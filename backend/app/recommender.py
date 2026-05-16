from __future__ import annotations

import json
import logging
import os
import re

import google.generativeai as genai

from app.catalog import (
    OUTFIT_SLOTS,
    SLOT_FALLBACKS,
    build_shortlist,
    discount_score,
    filter_for_profile,
    find_product,
    load_products,
    sort_by_preference,
    to_frontend_product,
)
from app.models import (
    FrontendProduct,
    GeminiPickResponse,
    GeminiReplaceResponse,
    PreferenceMode,
    Product,
    RecommendedItem,
    RecommendationRequest,
    RecommendationResponse,
    Source,
    UserProfile,
)

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash"

GEMINI_SYSTEM_PROMPT = """Sen Visionist adlı bir moda ve alışveriş asistanısın. Görevin, kullanıcıya yalnızca sana verilen ürün listesinden gerçek bir kombin önermektir.

## Kesin kurallar
1. Yalnızca kullanıcı mesajındaki `products` dizisinde bulunan ürünleri seç. Listede olmayan id uydurma.
2. Her seçilen ürünün `id` değerini aynen kopyala (örnek: "k61.jpg"). Büyük/küçük harf veya uzantıyı değiştirme.
3. Tam olarak 3 veya 4 parça seç. Kombin şu slotları mümkün olduğunca kapsasın:
   - Üst giyim (article_type: Shirt veya Topwear mantığı)
   - Alt giyim (Trousers / Bottomwear)
   - İsteğe bağlı dış katman (Blazer / Outerwear) veya tek parça (Dress)
   Aynı slot için iki ürün seçme (örneğin iki üst giyim).
4. Renk ve kullanım uyumu: colour (base_colour) ve usage alanlarını birlikte değerlendir. Çakışan veya uyumsuz kombinlerden kaçın.
5. Ekonomi: preference alanına uy:
   - cheaper → toplam sale_price mümkün olduğunca düşük
   - sportier → usage içinde sport/spor geçen parçaları önceliklendir
   - elegant → formal, smart, şık usage'ları önceliklendir
   - balanced → indirim (discount), uyum ve fiyat dengesi
6. Kullanıcı profiline uy:
   - segment (child / young / adult) ve gender ile uyumlu ürünler zaten filtrelenmiştir; yine de mantıksız seçim yapma.
   - style (classic, sport, daily, chic, vintage, minimal) ile usage ve parça karakterini hizala.
7. Kullanıcının isteğini (`request`) doğrudan yorumla: mevsim, ortam (iş, okul, akşam, tatil), rahatlık, şıklık vb.
8. `exclude_ids` varsa bu id'leri kesinlikle kullanma.
9. Her parça için kısa, Türkçe ve somut bir `reason` yaz (neden bu parça, renk/ortam/stil ile ilişkisi).
10. `summary` alanında kombinin genel hikayesini 1-2 cümleyle özetle; toplam tasarruf veya bütçe vurgusu yapabilirsin.

## Yasaklar
- Liste dışı ürün, marka veya fiyat uydurma.
- Markdown, açıklama metni veya kod bloğu döndürme.
- `items` dışında ek alan ekleme.

## Çıktı formatı
Yalnızca geçerli JSON döndür. Şema:
{
  "items": [
    { "id": "k61.jpg", "reason": "..." }
  ],
  "summary": "..."
}"""


def _configure_gemini() -> bool:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return False
    genai.configure(api_key=api_key)
    return True


def _totals(items: list[RecommendedItem]) -> tuple[float, float, float]:
    list_total = sum(item.product.price for item in items)
    sale_total = sum(item.product.sale_price for item in items)
    return list_total, sale_total, list_total - sale_total


def _pick_for_slot(
    pool: list[Product],
    slot: str,
    exclude_ids: set[str],
    preference: PreferenceMode,
) -> Product | None:
    ranked = sort_by_preference(pool, preference)
    for article in SLOT_FALLBACKS[slot]:
        for product in ranked:
            if product.article_type == article and product.id not in exclude_ids:
                return product
    for product in ranked:
        if product.id not in exclude_ids:
            return product
    return None


def _fallback_items(
    profile: UserProfile,
    prompt: str,
    preference: PreferenceMode,
    pool: list[Product],
    replace_item_id: int | None = None,
    replace_request: str | None = None,
    current_items: list[RecommendedItem] | None = None,
) -> list[RecommendedItem]:
    if current_items and replace_item_id is not None:
        used_ids: set[str] = set()
        updated: list[RecommendedItem] = []

        for item in current_items:
            if item.id != replace_item_id:
                used_ids.add(item.product.id)
                updated.append(item)
                continue

            slot_key = _slot_for_product(item.product)
            alternative = _pick_for_slot(pool, slot_key, used_ids | {item.product.id}, preference)
            if not alternative:
                updated.append(item)
                continue

            used_ids.add(alternative.id)
            reason = (
                f'"{replace_request}" isteğine göre {alternative.name} ile güncellendi.'
                if replace_request
                else f"{alternative.name} kombinle daha uyumlu görünüyor."
            )
            updated.append(
                RecommendedItem(
                    id=item.id,
                    reason=reason,
                    product=to_frontend_product(alternative),
                ),
            )

        return updated

    used_ids: set[str] = set()
    items: list[RecommendedItem] = []

    for index, slot in enumerate(OUTFIT_SLOTS, start=1):
        product = _pick_for_slot(pool, slot, used_ids, preference)
        if not product:
            continue
        used_ids.add(product.id)
        items.append(
            RecommendedItem(
                id=index,
                reason=f'"{prompt}" isteğine uygun {product.article_type.lower()} seçimi.',
                product=to_frontend_product(product),
            ),
        )

    return items


def _extract_json(text: str) -> dict | None:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def _gemini_pick(
    profile: UserProfile,
    prompt: str,
    preference: PreferenceMode,
    shortlist: list[Product],
    image_hint: str | None,
) -> GeminiPickResponse | None:
    if not _configure_gemini():
        return None

    catalog_lines = [
        {
            "id": product.id,
            "name": product.name,
            "article_type": product.article_type,
            "sub_category": product.sub_category,
            "colour": product.base_colour,
            "usage": product.usage,
            "price": product.price,
            "sale_price": product.sale_price,
            "discount": product.discount_rate,
        }
        for product in shortlist
    ]

    preference_note = {
        "balanced": "Dengeli indirim ve uyum.",
        "cheaper": "Toplam satış fiyatını minimumda tut.",
        "sportier": "Sporty usage öncelikli.",
        "elegant": "Formal ve şık parçalar öncelikli.",
    }[preference]

    user_prompt = {
        "user_profile": profile.model_dump(),
        "request": prompt,
        "image_hint": image_hint,
        "preference": preference_note,
        "products": catalog_lines,
        "exclude_ids": [],
        "response_format": {
            "items": [{"id": "k61.jpg", "reason": "neden"}],
            "summary": "kısa özet",
        },
    }

    try:
        model = genai.GenerativeModel(
            GEMINI_MODEL,
            system_instruction=GEMINI_SYSTEM_PROMPT,
        )
        response = model.generate_content(
            json.dumps(user_prompt, ensure_ascii=False),
            generation_config={"response_mime_type": "application/json"},
        )
        payload = _extract_json(response.text or "")
        if not payload:
            return None
        return GeminiPickResponse.model_validate(payload)
    except Exception as error:
        logger.warning("Gemini recommendation failed: %s", error)
        return None


def _items_from_gemini(
    gemini_result: GeminiPickResponse,
    products: list[Product],
) -> list[RecommendedItem]:
    items: list[RecommendedItem] = []
    for index, pick in enumerate(gemini_result.items[:4], start=1):
        product = find_product(products, pick.id)
        if not product:
            continue
        items.append(
            RecommendedItem(
                id=index,
                reason=pick.reason,
                product=to_frontend_product(product),
            ),
        )
    return items


GEMINI_REPLACE_PROMPT = """Sen Visionist moda asistanısın. Kullanıcı mevcut kombinde YALNIZCA BİR parçayı değiştirmek istiyor.

Kurallar:
1. Yalnızca verilen `candidates` listesinden tam 1 ürün seç.
2. `id` değerini aynen kopyala (ör. k61.jpg).
3. Seçim, `replace_request` ve mevcut kombinle (renk, usage, stil) uyumlu olsun.
4. `current_outfit` içindeki diğer parçaları değiştirme; sadece yeni parçayı öner.
5. Türkçe, kısa ve somut `reason` yaz.

Yalnızca geçerli JSON döndür:
{"id": "k61.jpg", "reason": "..."}"""


def _candidates_for_replace(
    pool: list[Product],
    item_to_replace: RecommendedItem,
    current_items: list[RecommendedItem],
    preference: PreferenceMode,
) -> list[Product]:
    slot = _slot_for_product(item_to_replace.product)
    exclude_ids = {entry.product.id for entry in current_items}

    candidates: list[Product] = []
    for product in pool:
        if product.id in exclude_ids:
            continue
        if _slot_for_product(product) == slot:
            candidates.append(product)

    if not candidates:
        for product in pool:
            if product.id in exclude_ids:
                continue
            if product.article_type == item_to_replace.product.article_type:
                candidates.append(product)

    return sort_by_preference(candidates, preference)[:30]


def _gemini_replace_item(
    profile: UserProfile,
    preference: PreferenceMode,
    replace_request: str,
    replace_item_id: int,
    current_items: list[RecommendedItem],
    pool: list[Product],
) -> list[RecommendedItem] | None:
    if not _configure_gemini():
        return None

    target = next((item for item in current_items if item.id == replace_item_id), None)
    if not target:
        return None

    candidates = _candidates_for_replace(pool, target, current_items, preference)
    if not candidates:
        return None

    preference_note = {
        "balanced": "Dengeli indirim ve uyum.",
        "cheaper": "Daha uygun fiyatlı alternatif.",
        "sportier": "Daha sportif alternatif.",
        "elegant": "Daha şık alternatif.",
    }[preference]

    user_prompt = {
        "task": "replace_single_item",
        "user_profile": profile.model_dump(),
        "replace_request": replace_request,
        "preference": preference_note,
        "item_to_replace": {
            "slot_id": target.id,
            "product": target.product.model_dump(),
        },
        "current_outfit": [
            {
                "slot_id": item.id,
                "id": item.product.id,
                "name": item.product.name,
                "article_type": item.product.article_type,
                "colour": item.product.base_colour,
            }
            for item in current_items
            if item.id != replace_item_id
        ],
        "candidates": [
            {
                "id": product.id,
                "name": product.name,
                "article_type": product.article_type,
                "colour": product.base_colour,
                "usage": product.usage,
                "sale_price": product.sale_price,
            }
            for product in candidates
        ],
    }

    try:
        model = genai.GenerativeModel(
            GEMINI_MODEL,
            system_instruction=GEMINI_REPLACE_PROMPT,
        )
        response = model.generate_content(
            json.dumps(user_prompt, ensure_ascii=False),
            generation_config={"response_mime_type": "application/json"},
        )
        payload = _extract_json(response.text or "")
        if not payload:
            return None
        pick = GeminiReplaceResponse.model_validate(payload)
        replacement = find_product(pool, pick.id)
        if not replacement:
            return None

        updated: list[RecommendedItem] = []
        for item in current_items:
            if item.id != replace_item_id:
                updated.append(item)
                continue
            updated.append(
                RecommendedItem(
                    id=item.id,
                    reason=pick.reason,
                    product=to_frontend_product(replacement),
                ),
            )
        return updated
    except Exception as error:
        logger.warning("Gemini replace failed: %s", error)
        return None


def _slot_for_product(product: FrontendProduct | Product) -> str:
    sub = product.sub_category
    if sub == "Bottomwear":
        return "Trousers"
    if sub == "Outerwear":
        return "Blazer"
    if sub in ("Dress", "One-Piece"):
        return "Dress"
    return "Shirt"


def build_recommendation(request: RecommendationRequest) -> RecommendationResponse:
    all_products = load_products()
    pool = filter_for_profile(all_products, request.profile)

    if not pool:
        raise ValueError("Bu profil için katalogda ürün bulunamadı.")

    if request.replace_item_id is not None and request.current_items:
        note = request.item_update_note or "istek"
        items = _gemini_replace_item(
            request.profile,
            request.preference,
            note,
            request.replace_item_id,
            request.current_items,
            pool,
        )
        source: Source = "gemini"
        market_note = "Gemini ile tek parça güncellendi; diğer ürünler korundu."

        if not items:
            items = _fallback_items(
                request.profile,
                request.prompt,
                request.preference,
                pool,
                request.replace_item_id,
                request.item_update_note,
                request.current_items,
            )
            source = "fallback"
            market_note = "Kural tabanlı tek parça güncelleme; diğer ürünler korundu."

        if not items:
            raise ValueError("Parça güncellenemedi.")

        list_total, sale_total, savings = _totals(items)
        return RecommendationResponse(
            items=items,
            summary=f'"{note}" doğrultusunda yalnızca seçilen parça güncellendi; kombinin geri kalanı korundu.',
            list_total=list_total,
            sale_total=sale_total,
            savings=savings,
            market_note=market_note,
            source=source,
        )

    shortlist = build_shortlist(all_products, request.profile, request.preference)

    gemini_result = _gemini_pick(
        request.profile,
        request.prompt,
        request.preference,
        shortlist,
        request.image_hint,
    )

    if gemini_result and gemini_result.items:
        items = _items_from_gemini(gemini_result, all_products)
        if len(items) >= 3:
            list_total, sale_total, savings = _totals(items)
            return RecommendationResponse(
                items=items,
                summary=gemini_result.summary or f'"{request.prompt}" için Gemini kombini.',
                list_total=list_total,
                sale_total=sale_total,
                savings=savings,
                market_note="Gerçek katalog ve Gemini önerisi kullanıldı.",
                source="gemini",
            )

    items = _fallback_items(
        request.profile,
        request.prompt,
        request.preference,
        pool,
        request.replace_item_id,
        request.item_update_note,
        request.current_items,
    )

    if not items:
        raise ValueError("Kombin oluşturulamadı.")

    list_total, sale_total, savings = _totals(items)
    has_key = bool(os.getenv("GEMINI_API_KEY", "").strip())

    return RecommendationResponse(
        items=items,
        summary=f'"{request.prompt}" isteğine göre {request.profile.style} stilinde ekonomik kombin.',
        list_total=list_total,
        sale_total=sale_total,
        savings=savings,
        market_note=(
            "Kural tabanlı öneri kullanıldı (Gemini yanıt veremedi)."
            if has_key
            else "GEMINI_API_KEY tanımlı değil; kural tabanlı öneri kullanıldı."
        ),
        source="fallback",
    )
