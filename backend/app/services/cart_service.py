from __future__ import annotations

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Cart, CartItem, User


def _generate_session_id() -> str:
    return uuid4().hex


def find_cart_by_session(db: Session, session_id: str) -> Cart | None:
    stmt = select(Cart).where(Cart.session_id == session_id)
    return db.execute(stmt).scalar_one_or_none()


def find_user_cart(db: Session, user_id: int) -> Cart | None:
    stmt = select(Cart).where(Cart.owner_user_id == user_id)
    return db.execute(stmt).scalar_one_or_none()


def get_or_create_session_cart(db: Session, session_id: str | None) -> Cart:
    normalized = (session_id or "").strip()
    if normalized:
        existing = find_cart_by_session(db, normalized)
        if existing:
            return existing
        cart = Cart(session_id=normalized)
        db.add(cart)
        db.flush()
        return cart

    cart = Cart(session_id=_generate_session_id())
    db.add(cart)
    db.flush()
    return cart


def get_or_create_user_cart(db: Session, user: User) -> Cart:
    cart = find_user_cart(db, user.id)
    if cart:
        if not cart.session_id:
            cart.session_id = _generate_session_id()
            db.flush()
        return cart

    cart = Cart(session_id=_generate_session_id(), owner_user_id=user.id)
    db.add(cart)
    db.flush()
    return cart


def _merge_carts(db: Session, source: Cart, target: Cart) -> None:
    if source.id == target.id:
        return

    source_items_stmt = select(CartItem).where(CartItem.cart_id == source.id)
    source_items = db.execute(source_items_stmt).scalars().all()

    target_items_stmt = select(CartItem).where(CartItem.cart_id == target.id)
    target_items = db.execute(target_items_stmt).scalars().all()
    target_by_product = {item.product_id: item for item in target_items}

    for source_item in source_items:
        target_item = target_by_product.get(source_item.product_id)
        if target_item:
            target_item.quantity += source_item.quantity
        else:
            created_item = CartItem(
                cart_id=target.id,
                product_id=source_item.product_id,
                quantity=source_item.quantity,
            )
            db.add(created_item)
            target_by_product[source_item.product_id] = created_item

        db.delete(source_item)

    db.flush()
    db.delete(source)
    db.flush()


def merge_session_cart_into_user_cart(db: Session, session_id: str | None, user: User, user_cart: Cart) -> Cart:
    normalized = (session_id or "").strip()
    if not normalized:
        return user_cart

    session_cart = find_cart_by_session(db, normalized)
    if session_cart is None:
        return user_cart

    if session_cart.owner_user_id and session_cart.owner_user_id != user.id:
        return user_cart

    if session_cart.id == user_cart.id:
        return user_cart

    _merge_carts(db, session_cart, user_cart)
    return user_cart
