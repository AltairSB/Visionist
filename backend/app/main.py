from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.catalog import get_catalog
from app.models import RecommendationRequest, RecommendationResponse
from app.recommender import get_recommendation


load_dotenv()

app = FastAPI(title="Stil & Ekonomi API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/products")
async def products() -> dict[str, object]:
    return {"items": [product.model_dump() for product in get_catalog()]}


@app.post("/recommend", response_model=RecommendationResponse)
async def recommend(request: RecommendationRequest) -> RecommendationResponse:
    try:
        return get_recommendation(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Kombin önerisi oluşturulamadı.") from exc
