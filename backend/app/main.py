import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.catalog import load_products
from app.models import RecommendationRequest, RecommendationResponse
from app.recommender import build_recommendation

load_dotenv()

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
    yield


app = FastAPI(title="Visionist Recommendation API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str | int]:
    return {"status": "ok", "products": len(load_products())}


@app.post("/recommend", response_model=RecommendationResponse)
def recommend(request: RecommendationRequest) -> RecommendationResponse:
    try:
        return build_recommendation(request)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        logger.exception("Recommendation failed")
        raise HTTPException(
            status_code=500,
            detail="Kombin önerisi oluşturulurken bir hata oluştu.",
        ) from error
