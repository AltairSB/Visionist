from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.db.supabase_client import get_supabase, is_supabase_configured
from app.models import UserProfile
from app.services.recommendation_store import ensure_guest_session

logger = logging.getLogger(__name__)


def upsert_guest_profile(
    existing_session_id: str | None,
    profile: UserProfile,
) -> str | None:
    if not is_supabase_configured():
        return existing_session_id

    client = get_supabase()

    if client is None:
        return existing_session_id

    session_id = ensure_guest_session(existing_session_id)

    if not session_id:
        return None

    row = {
        "segment": profile.segment,
        "gender": profile.gender,
        "preferred_size": profile.preferred_size,
        "style": profile.style,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        client.table("guest_sessions").update(row).eq("id", session_id).execute()
    except Exception:
        logger.exception("Failed to update guest profile")
        return session_id

    return session_id
