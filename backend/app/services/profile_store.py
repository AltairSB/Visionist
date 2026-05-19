from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.db.supabase_client import get_supabase, is_supabase_configured
from app.models import PreferenceMode, UserProfile

logger = logging.getLogger(__name__)


def update_user_style_profile(user_id: str, profile: UserProfile, default_preference: PreferenceMode) -> bool:
    if not is_supabase_configured():
        return False

    client = get_supabase()

    if client is None:
        return False

    row = {
        "segment": profile.segment,
        "gender": profile.gender,
        "preferred_size": profile.preferred_size,
        "style": profile.style,
        "default_preference": default_preference,
    }

    try:
        client.table("user_style_profiles").update(row).eq("user_id", user_id).execute()
    except Exception:
        logger.exception("Failed to update user_style_profiles")
        return False

    return True


def complete_onboarding(user_id: str) -> bool:
    if not is_supabase_configured():
        return False

    client = get_supabase()

    if client is None:
        return False

    timestamp = datetime.now(timezone.utc).isoformat()

    try:
        client.table("profiles").update({"onboarding_completed_at": timestamp}).eq("user_id", user_id).execute()
    except Exception:
        logger.exception("Failed to complete onboarding")
        return False

    return True


def get_user_profile_bundle(user_id: str) -> dict[str, Any] | None:
    if not is_supabase_configured():
        return None

    client = get_supabase()

    if client is None:
        return None

    try:
        profile_result = client.table("profiles").select("*").eq("user_id", user_id).execute()
        style_result = client.table("user_style_profiles").select("*").eq("user_id", user_id).execute()
    except Exception:
        logger.exception("Failed to load profile bundle")
        return None

    if not profile_result.data or not style_result.data:
        return None

    return {
        "profile": profile_result.data[0],
        "style": style_result.data[0],
    }
