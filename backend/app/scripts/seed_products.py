from __future__ import annotations

import argparse
from decimal import Decimal

from sqlalchemy import delete, func, select

from app.db.session import SessionLocal
from app.models import Cart, CartItem, Product

BASE_PRODUCTS = [
    {
        "name": "Смартфон Samsung Galaxy A55 8/256 ГБ",
        "description": "Популярный смартфон среднего класса с AMOLED-экраном и NFC.",
        "price": Decimal("189990.00"),
        "image": "/images/products/smartphone-samsung-galaxy-a55.jpg",
        "category": "Электроника",
    },
    {
        "name": "Ноутбук Lenovo IdeaPad Slim 3 15",
        "description": "Ноутбук 15.6 дюйма для учебы, офиса и удаленной работы.",
        "price": Decimal("329990.00"),
        "image": "/images/products/notebook-lenovo-ideapad-slim-3-15.jpg",
        "category": "Электроника",
    },
    {
        "name": "Электрочайник Xiaomi Smart Kettle Pro",
        "description": "Умный электрочайник с поддержанием выбранной температуры.",
        "price": Decimal("22990.00"),
        "image": "/images/products/electric-kettle-xiaomi-smart-kettle-pro.jpg",
        "category": "Товары для дома",
    },
    {
        "name": "Кофе в зернах Barista 1 кг",
        "description": "Смесь арабики для эспрессо-машины, турки и фильтра.",
        "price": Decimal("13990.00"),
        "image": "/images/products/coffee-barista-beans-1kg.jpg",
        "category": "Продукты",
    },
    {
        "name": "Пылесос Dyson V8 беспроводной",
        "description": "Беспроводной пылесос с автономной работой до 40 минут.",
        "price": Decimal("229990.00"),
        "image": "/images/products/vacuum-dyson-v8.jpg",
        "category": "Товары для дома",
    },
    {
        "name": "Кроссовки Nike Revolution 7",
        "description": "Легкие кроссовки для тренировок и повседневной носки.",
        "price": Decimal("37990.00"),
        "image": "/images/products/sneakers-nike-revolution-7.jpg",
        "category": "Одежда и обувь",
    },
    {
        "name": "Куртка Uniqlo Ultra Light Down",
        "description": "Легкая теплая куртка для ветреной и холодной погоды в Астане.",
        "price": Decimal("59990.00"),
        "image": "/images/products/jacket-uniqlo-ultra-light-down.jpg",
        "category": "Одежда и обувь",
    },
    {
        "name": "Тетрадь А4 96 листов в линию",
        "description": "Классическая тетрадь для школы, колледжа и университета.",
        "price": Decimal("1290.00"),
        "image": "/images/products/notebook-a4-96-pages.jpg",
        "category": "Канцелярия",
    },
    {
        "name": "Электрическая зубная щетка Oral-B Pro 3",
        "description": "Щетка с датчиком давления и встроенным таймером чистки.",
        "price": Decimal("28990.00"),
        "image": "/images/products/toothbrush-oral-b-pro-3.jpg",
        "category": "Красота и здоровье",
    },
    {
        "name": "Книга «Атомные привычки»",
        "description": "Бестселлер о формировании полезных привычек и дисциплины.",
        "price": Decimal("7990.00"),
        "image": "/images/products/book-atomic-habits.jpg",
        "category": "Книги",
    },
]


def build_products(count: int) -> list[Product]:
    unique_count = min(count, len(BASE_PRODUCTS))
    result: list[Product] = []
    for template in BASE_PRODUCTS[:unique_count]:
        result.append(
            Product(
                name=template["name"],
                description=template["description"],
                price=template["price"],
                image=template["image"],
                category=template["category"],
            )
        )
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed products for local development.")
    parser.add_argument(
        "--count",
        type=int,
        default=len(BASE_PRODUCTS),
        help=f"Number of unique products to insert (max {len(BASE_PRODUCTS)}).",
    )
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
    if args.count > len(BASE_PRODUCTS):
        print(
            f"Only {len(BASE_PRODUCTS)} unique templates are available. "
            f"Will seed {len(BASE_PRODUCTS)} products."
        )

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
