from __future__ import annotations

import os

import jwt


def extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    parts = authorization.strip().split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


def get_user_id_from_token(token: str | None) -> str | None:
    if not token:
        return None

    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()

    if not secret:
        return None

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        return None

    sub = payload.get("sub")

    if not isinstance(sub, str) or not sub:
        return None

    return sub
