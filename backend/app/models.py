from typing import Literal

from pydantic import BaseModel, Field


Segment = Literal["child", "young", "adult"]
StylePreference = Literal["classic", "sport", "daily"]


class UserProfile(BaseModel):
    segment: Segment
    height: int = Field(ge=90, le=230)
    weight: int = Field(ge=20, le=180)
    style: StylePreference


class RecommendationRequest(BaseModel):
    profile: UserProfile
    prompt: str = Field(min_length=3, max_length=500)
    image_hint: str | None = Field(default=None, max_length=120)
    preference: Literal["balanced", "cheaper", "sportier", "elegant"] = "balanced"


class Product(BaseModel):
    id: int
    name: str
    gender: Literal["Men", "Women", "Boys", "Girls"]
    master_category: str
    sub_category: str
    article_type: str
    base_colour: str
    usage: str
    price: float
    sale_price: float
    image_url: str
    product_url: str


class RecommendedItem(BaseModel):
    id: int
    reason: str
    product: Product


class RecommendationResponse(BaseModel):
    items: list[RecommendedItem]
    summary: str
    list_total: float
    sale_total: float
    savings: float
    market_note: str
    source: Literal["gemini", "fallback"]
