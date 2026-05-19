from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path

from app.models import ClothingSize, FrontendProduct, PreferenceMode, Product, UserProfile

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "products.json"

OUTFIT_SLOTS = ["Shirt", "Trousers", "Blazer", "Dress"]
SLOT_FALLBACKS: dict[str, list[str]] = {
    "Shirt": ["Shirt"],
    "Trousers": ["Trousers"],
    "Blazer": ["Blazer"],
    "Dress": ["Dress"],
}


def resolve_catalog_gender(profile: UserProfile) -> str | None:
    if profile.segment == "child":
        return "Girls" if profile.gender == "female" else "Boys"
    if profile.gender == "male":
        if profile.segment == "young":
            return "Young Male"
        if profile.segment == "adult":
            return "Adult Male"
        return None
    if profile.segment == "young":
        return "Young Female"
    if profile.segment == "adult":
        return "Adult Female"
    return None


def to_frontend_gender(catalog_gender: str) -> str:
    if catalog_gender in ("Adult Female", "Young Female"):
        return "Women"
    if catalog_gender in ("Adult Male", "Young Male"):
        return "Men"
    if catalog_gender == "Girls":
        return "Girls"
    if catalog_gender == "Boys":
        return "Boys"
    return "Men"


def to_frontend_product(product: Product) -> FrontendProduct:
    return FrontendProduct(
        id=product.id,
        name=product.name,
        gender=to_frontend_gender(product.catalog_gender),
        master_category=product.master_category,
        sub_category=product.sub_category,
        article_type=product.article_type,
        base_colour=product.base_colour,
        usage=product.usage,
        price=product.price,
        sale_price=product.sale_price,
        image_url=product.image_url,
        product_url=product.product_url,
    )


def load_products() -> list[Product]:
    if not DATA_PATH.is_file():
        return []
    raw = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    return [Product.model_validate(item) for item in raw]


def discount_score(product: Product) -> float:
    if product.price <= 0:
        return 0.0
    return (product.price - product.sale_price) / product.price


def is_in_stock(product: Product, size: ClothingSize) -> bool:
    status = (product.stock or {}).get(size, "Out of Stock").strip()
    return status != "Out of Stock"


def filter_for_profile(products: list[Product], profile: UserProfile) -> list[Product]:
    catalog_gender = resolve_catalog_gender(profile)
    if not catalog_gender:
        return []
    return [
        product
        for product in products
        if product.catalog_gender == catalog_gender and is_in_stock(product, profile.preferred_size)
    ]


def sort_by_preference(products: list[Product], preference: PreferenceMode) -> list[Product]:
    if preference == "cheaper":
        return sorted(products, key=lambda product: product.sale_price)
    if preference in ("sportier", "elegant"):
        return sorted(
            products,
            key=lambda product: (
                0 if preference == "sportier" and "sport" in product.usage.lower() else 1,
                -discount_score(product),
            ),
        )
    return sorted(products, key=lambda product: (-discount_score(product), product.sale_price))


def _diversity_seed(diversity_key: str) -> int:
    normalized = diversity_key.strip().lower()
    if not normalized:
        return 0
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def build_shortlist(
    products: list[Product],
    profile: UserProfile,
    preference: PreferenceMode,
    limit: int = 60,
    *,
    diversity_key: str | None = None,
    exclude_ids: set[str] | None = None,
) -> list[Product]:
    pool = filter_for_profile(products, profile)
    if not pool:
        return []

    blocked = exclude_ids or set()
    ranked = [product for product in sort_by_preference(pool, preference) if product.id not in blocked]

    if diversity_key and diversity_key.strip():
        shuffled = list(ranked)
        random.Random(_diversity_seed(diversity_key)).shuffle(shuffled)
        ranked = shuffled

    picked: list[Product] = []
    seen_ids: set[str] = set()

    for slot in OUTFIT_SLOTS:
        for article in SLOT_FALLBACKS[slot]:
            for product in ranked:
                if product.article_type != article or product.id in seen_ids:
                    continue
                picked.append(product)
                seen_ids.add(product.id)
                break

    for product in ranked:
        if len(picked) >= limit:
            break
        if product.id in seen_ids:
            continue
        picked.append(product)
        seen_ids.add(product.id)

    return picked[:limit]


def find_product(products: list[Product], product_id: str) -> Product | None:
    for product in products:
        if product.id == product_id:
            return product
    return None
