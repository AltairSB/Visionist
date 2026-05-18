from __future__ import annotations

import logging
import os
from functools import lru_cache

import jwt
from jwt import PyJWKClient

logger = logging.getLogger(__name__)

_JWT_AUDIENCE = "authenticated"
_JWKS_ALGORITHMS = ("ES256", "RS256")


def extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    parts = authorization.strip().split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


def _supabase_url() -> str | None:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    return url or None


def _jwt_issuer() -> str | None:
    base = _supabase_url()
    if not base:
        return None
    return f"{base}/auth/v1"


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient | None:
    base = _supabase_url()
    if not base:
        return None
    return PyJWKClient(f"{base}/auth/v1/.well-known/jwks.json", cache_keys=True)


def _payload_sub(payload: dict) -> str | None:
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        return None
    return sub


def _decode_with_jwks(token: str) -> dict | None:
    client = _jwks_client()
    issuer = _jwt_issuer()

    if not client or not issuer:
        return None

    try:
        signing_key = client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=list(_JWKS_ALGORITHMS),
            audience=_JWT_AUDIENCE,
            issuer=issuer,
        )
    except jwt.PyJWTError as error:
        logger.debug("JWKS JWT verification failed: %s", error)
        return None


def _decode_with_legacy_secret(token: str, secret: str) -> dict | None:
    issuer = _jwt_issuer()
    options: dict = {"verify_iss": bool(issuer)}

    try:
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience=_JWT_AUDIENCE,
            issuer=issuer,
            options=options,
        )
    except jwt.PyJWTError as error:
        logger.debug("Legacy HS256 JWT verification failed: %s", error)
        return None


def get_user_id_from_token(token: str | None) -> str | None:
    if not token:
        return None

    payload = _decode_with_jwks(token)

    if payload is None:
        legacy_secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
        if legacy_secret:
            payload = _decode_with_legacy_secret(token, legacy_secret)

    if payload is None:
        return None

    return _payload_sub(payload)
