from __future__ import annotations

import base64
import binascii
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
    UploadedSlot,
    UserProfile,
)

logger = logging.getLogger(__name__)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
FIT_DEFAULT_PROMPT = (
    "Fotoğraftaki parçanın tipini belirle (üst, alt, dış giyim veya elbise). "
    "Yalnızca eksik slotlardan tamamlayıcı ürün seç; yüklenen parçayla aynı kategoriden ürün seçme."
)
ALLOWED_IMAGE_MIME_TYPES = frozenset({"image/jpeg", "image/jpg", "image/png", "image/webp"})
MAX_IMAGE_BYTES = 4 * 1024 * 1024

GEMINI_FIT_SYSTEM_PROMPT = """Sen Visionist fit modu asistanısın. Kullanıcı kendi kıyafetinin fotoğrafını yükledi.
Görevin: fotoğraftaki parçanın tipini belirlemek ve katalogdan YALNIZCA tamamlayıcı parçalar seçmek.

## Adım 1 — uploaded_slot (zorunlu)
Fotoğrafa göre aşağıdakilerden birini seç:
- topwear: bluz, gömlek, tişört, kazak, sweatshirt, üst giyim (article_type Shirt / Topwear)
- bottomwear: pantolon, jean, etek, şort, alt giyim (article_type Trousers / Bottomwear)
- outerwear: ceket, blazer, mont, hırka, dış giyim (article_type Blazer / Outerwear)
- dress: elbise, tek parça (article_type Dress)

## Adım 2 — items (yalnızca tamamlayıcılar, 2 veya 3 ürün)
Yüklenen parça items listesinde OLMAYACAK. Slot kuralları:

| uploaded_slot | Seç (article_type / sub_category) | ASLA seçme |
|---|---|---|
| topwear | Trousers (alt) + Blazer (dış, tercih) | Shirt / üst |
| bottomwear | Shirt (üst) + Blazer (dış, tercih) | Trousers / alt |
| outerwear | Shirt (üst) + Trousers (alt) | Blazer / dış |
| dress | Blazer + Shirt veya Trousers; elbise tekrarı yok | Dress |

## Diğer kurallar
1. Yalnızca `products` listesindeki id'leri kullan; id'yi aynen kopyala (ör. k61.jpg).
2. Yüklenen parçanın aynısını veya çok benzer rengini listeden seçme.
3. Renk, usage ve mevsimi fotoğraftaki parça ile hizala; preference ve profile'a uy.
4. Her `reason` Türkçe ve kısa; yüklenen parçayla uyumu belirt.
5. `summary` yalnızca seçtiğin items içindeki ürün adlarından bahsetsin.

## Yasaklar
- 3-4 parçalı tam kombin kurma (bu fit modu; kullanıcının parçası zaten var).
- Yüklenen slot ile aynı kategoriden ürün seçme.
- Liste dışı id, markdown veya ek JSON alanı.

## Çıktı (yalnızca JSON)
{
  "uploaded_slot": "topwear",
  "items": [{ "id": "k61.jpg", "reason": "..." }],
  "summary": "..."
}"""

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
   - preferred_size (S, M, L, XL): yalnızca bu bedende stokta olan ürünler listededir; başka beden önerme.
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


def _decode_image_base64(raw: str) -> bytes:
    cleaned = raw.strip()
    if "," in cleaned and cleaned.lower().startswith("data:"):
        cleaned = cleaned.split(",", 1)[1]
    try:
        return base64.b64decode(cleaned, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ValueError("Geçersiz görsel verisi.") from error


def _parse_fit_image(request: RecommendationRequest) -> tuple[bytes, str]:
    if not request.image_base64:
        raise ValueError("Fit modu için fotoğraf gerekli.")

    mime = (request.image_mime_type or "").strip().lower()
    if mime == "image/jpg":
        mime = "image/jpeg"
    if mime not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValueError("Desteklenen formatlar: JPEG, PNG, WebP.")

    image_bytes = _decode_image_base64(request.image_base64)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("Görsel en fazla 4 MB olabilir.")
    if len(image_bytes) < 100:
        raise ValueError("Görsel dosyası okunamadı.")

    return image_bytes, mime


def _validate_request(request: RecommendationRequest) -> None:
    if request.mode == "fit":
        _parse_fit_image(request)
        return

    if len(request.prompt.strip()) < 3:
        raise ValueError("Kombin için en az 3 karakterlik bir istek yazın.")


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
    image_hint: str | None = None,
    *,
    image_bytes: bytes | None = None,
    image_mime_type: str | None = None,
    is_fit: bool = False,
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

    user_prompt: dict = {
        "user_profile": profile.model_dump(),
        "request": prompt,
        "preference": preference_note,
        "products": catalog_lines,
        "exclude_ids": [],
        "response_format": {
            "items": [{"id": "k61.jpg", "reason": "neden"}],
            "summary": "kısa özet",
        },
    }

    if is_fit and image_bytes and image_mime_type:
        user_prompt["task"] = "fit_outfit"
        user_prompt["response_format"] = {
            "uploaded_slot": "topwear",
            "items": [{"id": "k61.jpg", "reason": "neden"}],
            "summary": "kısa özet",
        }
        user_prompt["slot_completion_rules"] = {
            "topwear": {"pick": ["Trousers", "Blazer"], "forbid": ["Shirt"]},
            "bottomwear": {"pick": ["Shirt", "Blazer"], "forbid": ["Trousers"]},
            "outerwear": {"pick": ["Shirt", "Trousers"], "forbid": ["Blazer"]},
            "dress": {"pick": ["Blazer", "Shirt", "Trousers"], "forbid": ["Dress"]},
        }
    elif image_hint:
        user_prompt["image_hint"] = image_hint

    system_instruction = GEMINI_FIT_SYSTEM_PROMPT if is_fit else GEMINI_SYSTEM_PROMPT

    fit_mime = image_mime_type
    if fit_mime == "image/jpg":
        fit_mime = "image/jpeg"

    attempts = 3 if is_fit else 1
    last_error: Exception | None = None

    for attempt in range(attempts):
        try:
            model = genai.GenerativeModel(
                GEMINI_MODEL,
                system_instruction=system_instruction,
            )
            text_part = json.dumps(user_prompt, ensure_ascii=False)
            if is_fit and image_bytes and fit_mime:
                content: list = [
                    {"mime_type": fit_mime, "data": image_bytes},
                    text_part,
                ]
            else:
                content = [text_part]

            response = model.generate_content(
                content,
                generation_config={"response_mime_type": "application/json"},
            )
            payload = _extract_json(response.text or "")
            if not payload:
                last_error = ValueError("Gemini boş veya geçersiz JSON döndürdü.")
                continue
            return GeminiPickResponse.model_validate(payload)
        except Exception as error:
            last_error = error
            logger.warning(
                "Gemini recommendation failed (model=%s, attempt=%s/%s): %s",
                GEMINI_MODEL,
                attempt + 1,
                attempts,
                error,
            )

    if last_error:
        logger.warning("Gemini gave up after %s attempts: %s", attempts, last_error)
    return None


def _join_product_names(names: list[str]) -> str:
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} ve {names[1]}"
    return ", ".join(names[:-1]) + f" ve {names[-1]}"


def _build_fit_summary(items: list[RecommendedItem]) -> str:
    catalog_names = [item.product.name for item in items]
    catalog_text = _join_product_names(catalog_names)

    if not catalog_text:
        return "Yüklediğin parçaya uyumlu tamamlayıcı ürün seçilemedi."

    return f"Yüklediğin parçayla birlikte {catalog_text} ile kombin oluşturuldu."


def _complete_gemini_items(
    items: list[RecommendedItem],
    pool: list[Product],
    preference: PreferenceMode,
    prompt: str,
    target_count: int = 3,
    *,
    excluded_slots: set[str] | None = None,
    slot_priority: list[str] | None = None,
) -> list[RecommendedItem]:
    if len(items) >= target_count:
        return items

    excluded = excluded_slots or set()
    slots_to_try = slot_priority if slot_priority else list(OUTFIT_SLOTS)

    used_ids = {item.product.id for item in items}
    used_slots = {_slot_for_product(item.product) for item in items}
    next_slot_id = max((item.id for item in items), default=0) + 1
    completed = list(items)

    for slot in slots_to_try:
        if len(completed) >= target_count:
            break
        if slot in excluded or slot in used_slots:
            continue
        product = _pick_for_slot(pool, slot, used_ids, preference)
        if not product:
            continue
        used_ids.add(product.id)
        used_slots.add(slot)
        completed.append(
            RecommendedItem(
                id=next_slot_id,
                reason=(
                    f'Yüklediğin parçaya uyumlu {product.article_type.lower()} '
                    f'("{prompt}" isteğiyle hizalı).'
                ),
                product=to_frontend_product(product),
            ),
        )
        next_slot_id += 1

    if len(completed) < target_count:
        for product in sort_by_preference(pool, preference):
            if len(completed) >= target_count:
                break
            if product.id in used_ids:
                continue
            product_slot = _slot_for_product(product)
            if product_slot in excluded:
                continue
            used_ids.add(product.id)
            completed.append(
                RecommendedItem(
                    id=next_slot_id,
                    reason=f'Kombini tamamlayan {product.article_type.lower()} seçimi.',
                    product=to_frontend_product(product),
                ),
            )
            next_slot_id += 1

    return completed


def _items_from_gemini(
    gemini_result: GeminiPickResponse,
    products: list[Product],
    profile: UserProfile,
) -> list[RecommendedItem]:
    in_stock_pool = {product.id for product in filter_for_profile(products, profile)}
    items: list[RecommendedItem] = []
    for index, pick in enumerate(gemini_result.items[:4], start=1):
        product = find_product(products, pick.id)
        if not product or product.id not in in_stock_pool:
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


def _normalize_uploaded_slot(raw: str | None) -> UploadedSlot:
    if not raw:
        return "topwear"

    normalized = raw.strip().lower()
    aliases: dict[str, UploadedSlot] = {
        "top": "topwear",
        "topwear": "topwear",
        "shirt": "topwear",
        "üst": "topwear",
        "bottom": "bottomwear",
        "bottomwear": "bottomwear",
        "trousers": "bottomwear",
        "alt": "bottomwear",
        "outer": "outerwear",
        "outerwear": "outerwear",
        "blazer": "outerwear",
        "dış": "outerwear",
        "dress": "dress",
        "elbise": "dress",
        "one-piece": "dress",
    }
    return aliases.get(normalized, "topwear")


def _excluded_catalog_slots(uploaded_slot: UploadedSlot) -> set[str]:
    mapping: dict[UploadedSlot, set[str]] = {
        "topwear": {"Shirt"},
        "bottomwear": {"Trousers"},
        "outerwear": {"Blazer"},
        "dress": {"Dress"},
    }
    return mapping[uploaded_slot]


def _completion_slot_order(uploaded_slot: UploadedSlot) -> list[str]:
    mapping: dict[UploadedSlot, list[str]] = {
        "topwear": ["Trousers", "Blazer"],
        "bottomwear": ["Shirt", "Blazer"],
        "outerwear": ["Shirt", "Trousers"],
        "dress": ["Blazer", "Shirt", "Trousers"],
    }
    return mapping[uploaded_slot]


def _filter_items_by_excluded_slots(
    items: list[RecommendedItem],
    excluded_slots: set[str],
) -> list[RecommendedItem]:
    if not excluded_slots:
        return items
    return [item for item in items if _slot_for_product(item.product) not in excluded_slots]


def _build_fit_recommendation(
    request: RecommendationRequest,
    all_products: list[Product],
) -> RecommendationResponse:
    if not _configure_gemini():
        raise ValueError(
            "Görsel analiz için GEMINI_API_KEY gerekli. backend/.env dosyasını kontrol edin.",
        )

    image_bytes, image_mime = _parse_fit_image(request)
    effective_prompt = request.prompt.strip() or FIT_DEFAULT_PROMPT
    shortlist = build_shortlist(all_products, request.profile, request.preference)

    gemini_result = _gemini_pick(
        request.profile,
        effective_prompt,
        request.preference,
        shortlist,
        image_bytes=image_bytes,
        image_mime_type=image_mime,
        is_fit=True,
    )

    if not gemini_result or not gemini_result.items:
        raise ValueError(
            "Gemini görseli işleyemedi. API anahtarınızı veya ağ bağlantınızı kontrol edip tekrar deneyin.",
        )

    uploaded_slot = _normalize_uploaded_slot(gemini_result.uploaded_slot)
    excluded_slots = _excluded_catalog_slots(uploaded_slot)
    slot_priority = _completion_slot_order(uploaded_slot)

    pool = filter_for_profile(all_products, request.profile)
    items = _items_from_gemini(gemini_result, all_products, request.profile)
    items = _filter_items_by_excluded_slots(items, excluded_slots)
    supplemented = len(items) < 2
    items = _complete_gemini_items(
        items,
        pool,
        request.preference,
        effective_prompt,
        target_count=3,
        excluded_slots=excluded_slots,
        slot_priority=slot_priority,
    )
    items = _filter_items_by_excluded_slots(items, excluded_slots)

    if len(items) == 1:
        items = _complete_gemini_items(
            items,
            pool,
            request.preference,
            effective_prompt,
            target_count=2,
            excluded_slots=excluded_slots,
            slot_priority=slot_priority,
        )
        items = _filter_items_by_excluded_slots(items, excluded_slots)

    if len(items) < 1:
        logger.warning(
            "Fit outfit incomplete: gemini_picks=%s valid=%s",
            [pick.id for pick in gemini_result.items],
            len(items),
        )
        raise ValueError(
            "Yeterli uyumlu ürün seçilemedi. Farklı bir fotoğraf, beden (S–XL) veya profil segmenti deneyin.",
        )

    list_total, sale_total, savings = _totals(items)
    market_note = "Yüklediğin parçaya göre Gemini Vision ile tamamlayıcı parçalar seçildi."
    if supplemented:
        market_note = (
            "Yüklediğin parçaya göre Gemini Vision kullanıldı; eksik slotlar katalogdan tamamlandı."
        )

    return RecommendationResponse(
        items=items,
        summary=_build_fit_summary(items),
        list_total=list_total,
        sale_total=sale_total,
        savings=savings,
        market_note=market_note,
        source="gemini",
        uploaded_slot=uploaded_slot,
    )


def build_recommendation(request: RecommendationRequest) -> RecommendationResponse:
    _validate_request(request)

    all_products = load_products()
    pool = filter_for_profile(all_products, request.profile)

    if not pool:
        size = request.profile.preferred_size
        raise ValueError(
            f"{size} bedeninde bu profil için stoklu ürün bulunamadı. Başka beden veya segment deneyin.",
        )

    if request.mode == "fit":
        return _build_fit_recommendation(request, all_products)

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
        items = _items_from_gemini(gemini_result, all_products, request.profile)
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
