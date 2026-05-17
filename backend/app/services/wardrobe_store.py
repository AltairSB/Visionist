from __future__ import annotations

import logging

from app.db.supabase_client import get_supabase, is_supabase_configured

logger = logging.getLogger(__name__)


def save_outfit(
    *,
    user_id: str,
    recommendation_id: str,
    prompt: str,
    title: str | None = None,
) -> str | None:
    if not is_supabase_configured():
        return None

    client = get_supabase()

    if client is None:
        return None

    row = {
        "user_id": user_id,
        "recommendation_id": recommendation_id,
        "prompt": prompt,
        "title": title,
    }

    try:
        result = client.table("saved_outfits").insert(row).execute()
    except Exception:
        logger.exception("Failed to save outfit")
        return None

    if not result.data:
        return None

    return str(result.data[0]["id"])
