from __future__ import annotations

import argparse
from decimal import Decimal

from sqlalchemy import delete, func, select

from app.db.session import SessionLocal
from app.models import Cart, CartItem, Product

BASE_PRODUCTS = [
    {
        "name": "Smartphone Alpha",
        "description": "6.5-inch OLED display, 128GB storage.",
        "price": Decimal("599.00"),
        "image": "https://example.com/images/smartphone-alpha.jpg",
        "category": "Electronics",
    },
    {
        "name": "Notebook Breeze",
        "description": "Lightweight notebook for office and study.",
        "price": Decimal("2.90"),
        "image": "https://example.com/images/notebook-breeze.jpg",
        "category": "Stationery",
    },
    {
        "name": "Laptop Vertex 14",
        "description": "14-inch laptop for daily workloads.",
        "price": Decimal("899.00"),
        "image": "https://example.com/images/laptop-vertex-14.jpg",
        "category": "Electronics",
    },
    {
        "name": "Coffee Beans Roastery",
        "description": "Medium roast arabica beans, 1kg.",
        "price": Decimal("19.50"),
        "image": "https://example.com/images/coffee-beans-roastery.jpg",
        "category": "Grocery",
    },
    {
        "name": "Desk Lamp Nova",
        "description": "Adjustable LED lamp with warm/cold light.",
        "price": Decimal("34.99"),
        "image": "https://example.com/images/desk-lamp-nova.jpg",
        "category": "Home",
    },
    {
        "name": "Sneakers Sprint One",
        "description": "Breathable running shoes.",
        "price": Decimal("79.00"),
        "image": "https://example.com/images/sneakers-sprint-one.jpg",
        "category": "Fashion",
    },
    {
        "name": "Backpack Metro 20L",
        "description": "Water-resistant city backpack.",
        "price": Decimal("49.90"),
        "image": "https://example.com/images/backpack-metro-20l.jpg",
        "category": "Fashion",
    },
    {
        "name": "Bluetooth Speaker Mini",
        "description": "Portable speaker with 10h battery life.",
        "price": Decimal("45.00"),
        "image": "https://example.com/images/bluetooth-speaker-mini.jpg",
        "category": "Electronics",
    },
    {
        "name": "Cookware Pan 28cm",
        "description": "Non-stick frying pan for everyday cooking.",
        "price": Decimal("27.40"),
        "image": "https://example.com/images/cookware-pan-28.jpg",
        "category": "Home",
    },
    {
        "name": "Novel The North Line",
        "description": "Contemporary fiction bestseller.",
        "price": Decimal("14.20"),
        "image": "https://example.com/images/novel-the-north-line.jpg",
        "category": "Books",
    },
]


def build_products(count: int) -> list[Product]:
    result: list[Product] = []
    for i in range(count):
        template = BASE_PRODUCTS[i % len(BASE_PRODUCTS)]
        suffix = f" #{i + 1}" if i >= len(BASE_PRODUCTS) else ""
        result.append(
            Product(
                name=f"{template['name']}{suffix}",
                description=template["description"],
                price=template["price"],
                image=template["image"],
                category=template["category"],
            )
        )
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed products for local development.")
    parser.add_argument("--count", type=int, default=20, help="Number of products to insert.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing products and carts before insert.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.count < 1:
        raise ValueError("--count must be greater than 0")

    session = SessionLocal()
    try:
        existing_count = session.scalar(select(func.count()).select_from(Product)) or 0
        if args.reset:
            session.execute(delete(CartItem))
            session.execute(delete(Cart))
            session.execute(delete(Product))
            session.commit()
        else:
            if existing_count > 0:
                print("Products already exist. Use --reset to recreate dataset.")
                return

        products = build_products(args.count)
        session.add_all(products)
        session.commit()
        print(f"Inserted {len(products)} products.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
