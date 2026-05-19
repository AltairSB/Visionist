from __future__ import annotations

import logging
import uuid
from typing import Any

from app.db.supabase_client import get_supabase, is_supabase_configured
from app.models import RecommendationRequest, RecommendationResponse, RecommendedItem
from app.services.fit_image_store import upload_fit_image

logger = logging.getLogger(__name__)


def _guest_session_exists(client, session_id: str) -> bool:
    try:
        result = client.table("guest_sessions").select("id").eq("id", session_id).limit(1).execute()
    except Exception:
        logger.exception("Failed to verify guest session")
        return False

    return bool(result.data)


def ensure_guest_session(existing_id: str | None) -> str | None:
    if not is_supabase_configured():
        return existing_id

    client = get_supabase()

    if client is None:
        return existing_id

    if existing_id:
        try:
            parsed = uuid.UUID(existing_id)
            session_id = str(parsed)
            if _guest_session_exists(client, session_id):
                return session_id
        except ValueError:
            pass

    result = client.table("guest_sessions").insert({}).execute()

    if not result.data:
        return None

    return str(result.data[0]["id"])


def persist_recommendation(
    *,
    response: RecommendationResponse,
    request: RecommendationRequest,
    user_id: str | None,
    guest_session_id: str | None,
    request_meta: dict[str, Any] | None = None,
) -> tuple[str | None, str | None]:
    if not is_supabase_configured():
        return None, guest_session_id

    client = get_supabase()

    if client is None:
        return None, guest_session_id

    if user_id:
        owner: dict[str, str] = {"user_id": user_id}
    else:
        guest_session_id = ensure_guest_session(guest_session_id)

        if not guest_session_id:
            logger.warning("Could not create guest session")
            return None, None

        owner = {"guest_session_id": guest_session_id}

    meta = request_meta or {}

    if request.replace_item_id is not None:
        meta["replace_item_id"] = request.replace_item_id

    if request.item_update_note:
        meta["item_update_note"] = request.item_update_note

    if request.mode == "fit" and request.image_mime_type:
        meta["image_mime_type"] = request.image_mime_type

    if request.mode == "fit" and response.uploaded_slot:
        meta["uploaded_slot"] = response.uploaded_slot

    row = {
        **owner,
        "mode": request.mode,
        "preference": request.preference,
        "prompt": request.prompt,
        "summary": response.summary,
        "list_total": response.list_total,
        "sale_total": response.sale_total,
        "savings": response.savings,
        "market_note": response.market_note,
        "source": response.source,
        "profile_snapshot": request.profile.model_dump(),
        "request_meta": meta,
    }

    try:
        insert_result = client.table("recommendations").insert(row).execute()
    except Exception as error:
        error_message = str(error)
        is_fk_violation = "23503" in error_message or "guest_session_id_fkey" in error_message

        if not user_id and is_fk_violation:
            logger.warning("Stale guest session; creating new session and retrying")
            guest_session_id = ensure_guest_session(None)

            if not guest_session_id:
                return None, None

            row["guest_session_id"] = guest_session_id
            row.pop("user_id", None)

            try:
                insert_result = client.table("recommendations").insert(row).execute()
            except Exception:
                logger.exception("Failed to insert recommendation after guest session retry")
                return None, guest_session_id
        else:
            logger.exception("Failed to insert recommendation")
            return None, guest_session_id

    if not insert_result.data:
        return None, guest_session_id

    recommendation_id = str(insert_result.data[0]["id"])
    item_rows = [_item_row(recommendation_id, item) for item in response.items]

    if item_rows:
        try:
            client.table("recommendation_items").insert(item_rows).execute()
        except Exception:
            logger.exception("Failed to insert recommendation items")

    if (
        request.mode == "fit"
        and user_id
        and request.image_base64
        and request.image_mime_type
    ):
        storage_path = upload_fit_image(
            user_id=user_id,
            recommendation_id=recommendation_id,
            image_base64=request.image_base64,
            mime_type=request.image_mime_type,
        )
        if storage_path:
            meta["uploaded_garment_path"] = storage_path
            try:
                client.table("recommendations").update(
                    {"request_meta": meta},
                ).eq("id", recommendation_id).execute()
            except Exception:
                logger.exception("Failed to update recommendation with fit image path")

    return recommendation_id, guest_session_id


def _item_row(recommendation_id: str, item: RecommendedItem) -> dict[str, Any]:
    return {
        "recommendation_id": recommendation_id,
        "slot_index": item.id,
        "product_id": str(item.product.id),
        "reason": item.reason,
        "product_snapshot": item.product.model_dump(),
    }


def attach_fit_image_if_missing(
    *,
    user_id: str,
    recommendation_id: str,
    image_base64: str,
    mime_type: str,
) -> bool:
    if not is_supabase_configured():
        return False

    client = get_supabase()

    if client is None:
        return False

    try:
        result = (
            client.table("recommendations")
            .select("user_id, request_meta")
            .eq("id", recommendation_id)
            .limit(1)
            .execute()
        )
    except Exception:
        logger.exception("Failed to load recommendation for fit image attach")
        return False

    rows = result.data or []
    row = rows[0] if rows else None

    if not row or str(row.get("user_id")) != user_id:
        return False

    meta = dict(row.get("request_meta") or {})

    if meta.get("uploaded_garment_path"):
        return True

    storage_path = upload_fit_image(
        user_id=user_id,
        recommendation_id=recommendation_id,
        image_base64=image_base64,
        mime_type=mime_type,
    )

    if not storage_path:
        return False

    meta["uploaded_garment_path"] = storage_path
    meta.setdefault("image_mime_type", mime_type)

    try:
        client.table("recommendations").update({"request_meta": meta}).eq(
            "id",
            recommendation_id,
        ).execute()
    except Exception:
        logger.exception("Failed to update recommendation with fit image on wardrobe save")
        return False

    return True


def merge_guest_session(user_id: str, guest_session_id: str | None) -> None:
    if not guest_session_id or not is_supabase_configured():
        return

    client = get_supabase()

    if client is None:
        return

    try:
        client.rpc(
            "merge_guest_session",
            {
                "p_user_id": user_id,
                "p_guest_session_id": guest_session_id,
            },
        ).execute()
    except Exception:
        logger.exception("merge_guest_session failed")
