from __future__ import annotations

import base64
import binascii
import logging

from app.db.supabase_client import get_supabase, is_supabase_configured

logger = logging.getLogger(__name__)

FIT_UPLOADS_BUCKET = "fit-uploads"
SIGNED_URL_EXPIRES_SECONDS = 3600


def decode_image_base64(raw: str) -> bytes:
    cleaned = raw.strip()
    if "," in cleaned and cleaned.lower().startswith("data:"):
        cleaned = cleaned.split(",", 1)[1]
    return base64.b64decode(cleaned, validate=True)


def _extension_for_mime(mime: str) -> str:
    normalized = mime.strip().lower()
    if normalized in ("image/jpeg", "image/jpg"):
        return "jpg"
    if normalized == "image/png":
        return "png"
    if normalized == "image/webp":
        return "webp"
    return "jpg"


def upload_fit_image(
    *,
    user_id: str,
    recommendation_id: str,
    image_base64: str,
    mime_type: str,
) -> str | None:
    if not is_supabase_configured():
        return None

    client = get_supabase()
    if client is None:
        return None

    try:
        image_bytes = decode_image_base64(image_base64)
    except (binascii.Error, ValueError):
        logger.warning("Invalid fit image base64 for recommendation %s", recommendation_id)
        return None

    extension = _extension_for_mime(mime_type)
    storage_path = f"{user_id}/{recommendation_id}.{extension}"
    content_type = "image/jpeg" if extension == "jpg" else f"image/{extension}"

    try:
        client.storage.from_(FIT_UPLOADS_BUCKET).upload(
            path=storage_path,
            file=image_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
    except Exception:
        logger.exception("Failed to upload fit image to storage")
        return None

    return storage_path


def create_signed_url(storage_path: str, expires_in: int = SIGNED_URL_EXPIRES_SECONDS) -> str | None:
    if not is_supabase_configured():
        return None

    client = get_supabase()
    if client is None:
        return None

    try:
        result = client.storage.from_(FIT_UPLOADS_BUCKET).create_signed_url(
            storage_path,
            expires_in,
        )
    except Exception:
        logger.exception("Failed to create signed URL for %s", storage_path)
        return None

    if isinstance(result, dict):
        return result.get("signedURL") or result.get("signedUrl")

    signed = getattr(result, "signed_url", None) or getattr(result, "signedURL", None)
    return str(signed) if signed else None
