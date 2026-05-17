from __future__ import annotations

import logging
import os

from supabase import Client, create_client

logger = logging.getLogger(__name__)

_client: Client | None = None


def is_supabase_configured() -> bool:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    return bool(url and key)


def get_supabase() -> Client | None:
    global _client

    if not is_supabase_configured():
        return None

    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"].strip(),
            os.environ["SUPABASE_SERVICE_ROLE_KEY"].strip(),
        )
        logger.info("Supabase client initialized")

    return _client
