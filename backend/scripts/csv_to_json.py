"""Convert styles.csv to backend/data/products.json."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

SUB_CATEGORY_TO_ARTICLE = {
    "Topwear": "Shirt",
    "Bottomwear": "Trousers",
    "Outerwear": "Blazer",
    "Dress": "Dress",
    "One-Piece": "Dress",
}

SIZE_COLUMNS = ("S", "M", "L", "XL")
CSV_STOCK_COLUMNS = {
    "S": "S_stock",
    "M": "M_stock",
    "L": "L_stock",
    "XL": "XL_stock",
}

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_CSV = DATA_DIR / "styles.csv"
OUTPUT_PATH = DATA_DIR / "products.json"


def parse_price(value: str) -> float:
    cleaned = value.strip().upper().replace("TL", "").replace(" ", "")
    cleaned = cleaned.replace(".", "")
    cleaned = cleaned.replace(",", ".")
    if not cleaned:
        return 0.0
    return float(cleaned)


def parse_stock_row(row: dict[str, str]) -> dict[str, str]:
    stock: dict[str, str] = {}
    for size, column in CSV_STOCK_COLUMNS.items():
        raw = row.get(column, "").strip()
        stock[size] = raw if raw else "Out of Stock"
    return stock


def row_to_product(row: dict[str, str]) -> dict:
    product_id = row["id"].strip()
    sub_category = row["subCategory"].strip()
    article_type = SUB_CATEGORY_TO_ARTICLE.get(sub_category, sub_category)

    return {
        "id": product_id,
        "name": row["productDisplayName"].strip(),
        "catalog_gender": row["gender"].strip(),
        "master_category": row["masterCategory"].strip(),
        "sub_category": sub_category,
        "article_type": article_type,
        "base_colour": row["baseColour"].strip(),
        "usage": row["usage"].strip(),
        "price": parse_price(row["price"]),
        "sale_price": parse_price(row["sale_price"]),
        "discount_rate": row.get("discount_rate", "").strip(),
        "image_url": f"/images/{product_id}",
        "product_url": "#",
        "stock": parse_stock_row(row),
    }


def convert(csv_path: Path, output_path: Path) -> int:
    products: list[dict] = []

    with csv_path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            if not row.get("id"):
                continue
            products.append(row_to_product(row))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(products)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    if not args.input.is_file():
        raise SystemExit(f"CSV not found: {args.input}")

    count = convert(args.input, args.output)
    print(f"Wrote {count} products to {args.output}")


if __name__ == "__main__":
    main()
