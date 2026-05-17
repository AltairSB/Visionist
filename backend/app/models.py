from typing import Literal

from pydantic import BaseModel, Field

Segment = Literal["child", "young", "adult"]
Gender = Literal["female", "male"]
StylePreference = Literal["classic", "sport", "daily", "chic", "vintage", "minimal"]
PreferenceMode = Literal["balanced", "cheaper", "sportier", "elegant"]
RecommendationMode = Literal["text", "fit"]
Source = Literal["gemini", "fallback"]


class UserProfile(BaseModel):
    segment: Segment
    gender: Gender
    height: float
    weight: float
    style: StylePreference


class Product(BaseModel):
    """Internal catalog row — id matches dataset (e.g. k61.jpg)."""

    id: str
    name: str
    catalog_gender: str
    master_category: str
    sub_category: str
    article_type: str
    base_colour: str
    usage: str
    price: float
    sale_price: float
    discount_rate: str = ""
    image_url: str
    product_url: str = "#"


class FrontendProduct(BaseModel):
    """API shape expected by the Next.js client."""

    id: str
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
    product_url: str = "#"


class RecommendedItem(BaseModel):
    id: int
    reason: str
    product: FrontendProduct


class RecommendationRequest(BaseModel):
    profile: UserProfile
    prompt: str = ""
    mode: RecommendationMode = "text"
    image_base64: str | None = None
    image_mime_type: str | None = None
    image_hint: str | None = None
    preference: PreferenceMode = "balanced"
    replace_item_id: int | None = None
    item_update_note: str | None = None
    current_items: list[RecommendedItem] | None = None


class RecommendationResponse(BaseModel):
    items: list[RecommendedItem]
    summary: str
    list_total: float
    sale_total: float
    savings: float
    market_note: str
    source: Source
    recommendation_id: str | None = None
    guest_session_id: str | None = None


class SaveOutfitRequest(BaseModel):
    recommendation_id: str
    prompt: str
    title: str | None = None


class ProfileUpdateRequest(BaseModel):
    profile: UserProfile
    default_preference: PreferenceMode = "balanced"
    complete_onboarding: bool = False


class ProfileBundleResponse(BaseModel):
    display_name: str
    email: str | None = None
    onboarding_completed: bool
    profile: UserProfile
    default_preference: PreferenceMode


class GeminiPickItem(BaseModel):
    id: str
    reason: str


class GeminiPickResponse(BaseModel):
    items: list[GeminiPickItem] = Field(default_factory=list)
    summary: str = ""


class GeminiReplaceResponse(BaseModel):
    id: str
    reason: str
