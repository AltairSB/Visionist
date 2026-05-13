import json
import os
from collections import defaultdict

from app.catalog import filter_products_by_segment
from app.models import Product, RecommendationRequest, RecommendationResponse, RecommendedItem


CATEGORY_PRIORITY = {
    "Outerwear": 4,
    "Topwear": 3,
    "Bottomwear": 2,
    "Footwear": 1,
}


def get_discount_score(product: Product) -> float:
    if product.price <= 0:
        return 0

    return (product.price - product.sale_price) / product.price


def get_style_score(product: Product, request: RecommendationRequest) -> float:
    prompt = request.prompt.lower()
    style = request.profile.style
    usage = product.usage.lower()
    score = 0.0

    if style == "classic" and usage in {"formal", "smart casual"}:
        score += 3
    if style == "sport" and usage in {"sports", "casual"}:
        score += 3
    if style == "daily" and usage in {"casual", "smart casual"}:
        score += 3
    if request.preference == "sportier" and usage in {"sports", "casual"}:
        score += 2
    if request.preference == "elegant" and usage in {"formal", "smart casual"}:
        score += 2
    if "ofis" in prompt or "is" in prompt or "gorusme" in prompt:
        score += 2 if usage in {"formal", "smart casual"} else 0
    if "spor" in prompt or "rahat" in prompt:
        score += 2 if usage in {"sports", "casual"} else 0
    if "ucuz" in prompt or "uygun" in prompt or "ekonomik" in prompt:
        score += get_discount_score(product) * 4

    return score


def rank_products(request: RecommendationRequest) -> list[Product]:
    products = filter_products_by_segment(request.profile.segment)

    return sorted(
        products,
        key=lambda product: (
            get_style_score(product, request),
            get_discount_score(product),
            CATEGORY_PRIORITY.get(product.sub_category, 0),
            -product.sale_price if request.preference == "cheaper" else 0,
        ),
        reverse=True,
    )


def pick_balanced_outfit(products: list[Product]) -> list[Product]:
    grouped_products: dict[str, list[Product]] = defaultdict(list)

    for product in products:
        grouped_products[product.sub_category].append(product)

    outfit: list[Product] = []

    for category in ["Outerwear", "Topwear", "Bottomwear", "Footwear"]:
        if grouped_products.get(category):
            outfit.append(grouped_products[category][0])

    if len(outfit) >= 3:
        return outfit[:4]

    for product in products:
        if product not in outfit:
            outfit.append(product)
        if len(outfit) == 4:
            break

    return outfit


def build_reason(product: Product, request: RecommendationRequest) -> str:
    discount = round(get_discount_score(product) * 100)
    style_map = {
        "classic": "klasik ve net bir siluet",
        "sport": "rahat hareket alanı",
        "daily": "günlük kullanıma uygun denge",
    }
    style_text = style_map[request.profile.style]

    return f"{product.base_colour} tonu {style_text} sağlar; %{discount} indirimle bütçe odağını destekler."


def build_response(items: list[Product], request: RecommendationRequest, source: str) -> RecommendationResponse:
    list_total = sum(product.price for product in items)
    sale_total = sum(product.sale_price for product in items)
    savings = list_total - sale_total
    recommended_items = [
        RecommendedItem(id=product.id, reason=build_reason(product, request), product=product)
        for product in items
    ]

    return RecommendationResponse(
        items=recommended_items,
        summary="Stil tercihinize uygun, toplam maliyeti düşüren dengeli bir kombin seçildi.",
        list_total=list_total,
        sale_total=sale_total,
        savings=savings,
        market_note=f"Bu kombin seçili ürünlerde toplam {round((savings / list_total) * 100)}% tasarruf sağlar.",
        source=source,
    )


def build_fallback_recommendation(request: RecommendationRequest) -> RecommendationResponse:
    ranked_products = rank_products(request)
    outfit = pick_balanced_outfit(ranked_products)

    return build_response(outfit, request, "fallback")


def try_gemini_recommendation(request: RecommendationRequest) -> RecommendationResponse | None:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return None

    try:
        import google.generativeai as genai

        ranked_products = rank_products(request)[:10]
        product_payload = [product.model_dump() for product in ranked_products]
        prompt = (
            "Sen bir moda ve ekonomi uzmanısın. "
            "Verilen ürün listesinden 3 veya 4 parçalık uyumlu ve ekonomik kombin seç. "
            "Sadece JSON döndür: {\"ids\":[101,102],\"summary\":\"...\"}. "
            f"Kullanıcı profili: {request.profile.model_dump()}. "
            f"İstek: {request.prompt}. "
            f"Ürünler: {json.dumps(product_payload, ensure_ascii=False)}"
        )

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        parsed = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
        selected_ids = set(parsed.get("ids", []))
        selected_products = [product for product in ranked_products if product.id in selected_ids]

        if len(selected_products) < 3:
            return None

        gemini_response = build_response(selected_products[:4], request, "gemini")
        gemini_response.summary = parsed.get("summary", gemini_response.summary)

        return gemini_response
    except Exception:
        return None


def get_recommendation(request: RecommendationRequest) -> RecommendationResponse:
    gemini_response = try_gemini_recommendation(request)

    if gemini_response:
        return gemini_response

    return build_fallback_recommendation(request)
