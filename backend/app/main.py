import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.auth.jwt import extract_bearer_token, get_user_id_from_token
from app.catalog import load_products
from app.db.supabase_client import is_supabase_configured
from app.models import (
    ProfileBundleResponse,
    ProfileUpdateRequest,
    RecommendationRequest,
    RecommendationResponse,
    SaveOutfitRequest,
    UserProfile,
)
from app.recommender import build_recommendation
from app.services.profile_store import (
    complete_onboarding,
    get_user_profile_bundle,
    update_user_style_profile,
)
from app.services.recommendation_store import persist_recommendation
from app.services.wardrobe_store import save_outfit

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]


@asynccontextmanager
async def lifespan(_: FastAPI):
    products = load_products()
    logger.info("Loaded %s catalog products", len(products))
    if is_supabase_configured():
        logger.info("Supabase persistence enabled")
    else:
        logger.warning("Supabase not configured — recommendations will not be persisted")
    yield


app = FastAPI(title="Visionist Recommendation API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _resolve_user_id(authorization: str | None) -> str | None:
    token = extract_bearer_token(authorization)
    return get_user_id_from_token(token)


def _require_user_id(authorization: str | None) -> str:
    user_id = _resolve_user_id(authorization)

    if not user_id:
        raise HTTPException(status_code=401, detail="Oturum açmanız gerekiyor.")

    return user_id


def _bundle_to_response(bundle: dict) -> ProfileBundleResponse:
    profile_row = bundle["profile"]
    style_row = bundle["style"]

    return ProfileBundleResponse(
        display_name=profile_row.get("display_name") or "",
        onboarding_completed=profile_row.get("onboarding_completed_at") is not None,
        profile=UserProfile(
            segment=style_row["segment"],
            gender=style_row["gender"],
            height=float(style_row["height_cm"]),
            weight=float(style_row["weight_kg"]),
            style=style_row["style"],
        ),
        default_preference=style_row.get("default_preference") or "balanced",
    )


@app.get("/health")
def health() -> dict[str, str | int | bool]:
    return {
        "status": "ok",
        "products": len(load_products()),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY", "").strip()),
        "supabase_configured": is_supabase_configured(),
    }


@app.get("/me/profile", response_model=ProfileBundleResponse)
def get_profile(authorization: str | None = Header(default=None)) -> ProfileBundleResponse:
    user_id = _require_user_id(authorization)
    bundle = get_user_profile_bundle(user_id)

    if not bundle:
        raise HTTPException(status_code=404, detail="Profil bulunamadı.")

    return _bundle_to_response(bundle)


@app.patch("/me/profile", response_model=ProfileBundleResponse)
def patch_profile(
    body: ProfileUpdateRequest,
    authorization: str | None = Header(default=None),
) -> ProfileBundleResponse:
    user_id = _require_user_id(authorization)

    if not update_user_style_profile(user_id, body.profile, body.default_preference):
        raise HTTPException(status_code=503, detail="Profil güncellenemedi.")

    if body.complete_onboarding:
        complete_onboarding(user_id)

    bundle = get_user_profile_bundle(user_id)

    if not bundle:
        raise HTTPException(status_code=404, detail="Profil bulunamadı.")

    return _bundle_to_response(bundle)


@app.post("/recommend", response_model=RecommendationResponse)
def recommend(
    request: RecommendationRequest,
    authorization: str | None = Header(default=None),
    x_guest_session_id: str | None = Header(default=None),
) -> RecommendationResponse:
    try:
        response = build_recommendation(request)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        logger.exception("Recommendation failed")
        raise HTTPException(
            status_code=500,
            detail="Kombin önerisi oluşturulurken bir hata oluştu.",
        ) from error

    user_id = _resolve_user_id(authorization)
    recommendation_id, guest_session_id = persist_recommendation(
        response=response,
        request=request,
        user_id=user_id,
        guest_session_id=x_guest_session_id,
    )

    response.recommendation_id = recommendation_id
    response.guest_session_id = guest_session_id

    return response


@app.post("/wardrobe")
def post_wardrobe(
    body: SaveOutfitRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, str]:
    user_id = _require_user_id(authorization)
    saved_id = save_outfit(
        user_id=user_id,
        recommendation_id=body.recommendation_id,
        prompt=body.prompt,
        title=body.title,
    )

    if not saved_id:
        raise HTTPException(status_code=503, detail="Kombin dolaba kaydedilemedi.")

    return {"id": saved_id}


@app.delete("/wardrobe/{outfit_id}")
def delete_wardrobe(
    outfit_id: str,
    authorization: str | None = Header(default=None),
) -> dict[str, bool]:
    user_id = _require_user_id(authorization)

    if not is_supabase_configured():
        raise HTTPException(status_code=503, detail="Veritabanı yapılandırılmamış.")

    from app.db.supabase_client import get_supabase

    client = get_supabase()

    if client is None:
        raise HTTPException(status_code=503, detail="Veritabanı bağlantısı yok.")

    try:
        client.table("saved_outfits").delete().eq("id", outfit_id).eq("user_id", user_id).execute()
    except Exception as error:
        logger.exception("Failed to delete wardrobe item")
        raise HTTPException(status_code=500, detail="Kayıt silinemedi.") from error

    return {"ok": True}
