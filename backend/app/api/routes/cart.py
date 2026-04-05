from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models import Cart, CartItem, Product
from app.schemas.cart import (
    CartAddItemRequest,
    CartItemResponse,
    CartResponse,
    CartUpdateItemRequest,
)

router = APIRouter(prefix="/cart")


def _generate_session_id() -> str:
    return uuid4().hex


def _find_cart_by_session(db: Session, session_id: str) -> Cart | None:
    stmt = select(Cart).where(Cart.session_id == session_id)
    return db.execute(stmt).scalar_one_or_none()


def _get_or_create_cart(db: Session, session_id: str | None) -> Cart:
    normalized = (session_id or "").strip()
    if normalized:
        cart = _find_cart_by_session(db, normalized)
        if cart:
            return cart
        cart = Cart(session_id=normalized)
        db.add(cart)
        db.flush()
        return cart

    cart = Cart(session_id=_generate_session_id())
    db.add(cart)
    db.flush()
    return cart


def _get_cart_for_session_or_404(db: Session, session_id: str | None) -> Cart:
    normalized = (session_id or "").strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Session-Id header is required",
        )
    cart = _find_cart_by_session(db, normalized)
    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart with session_id={normalized} not found",
        )
    return cart


def _load_cart_with_items(db: Session, cart_id: int) -> Cart:
    stmt = (
        select(Cart)
        .where(Cart.id == cart_id)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
    )
    cart = db.execute(stmt).scalars().unique().one()
    return cart


def _serialize_cart(cart: Cart) -> CartResponse:
    sorted_items = sorted(cart.items, key=lambda item: item.id)
    result_items: list[CartItemResponse] = []
    total = Decimal("0.00")

    for item in sorted_items:
        line_total = item.product.price * item.quantity
        total += line_total
        result_items.append(
            CartItemResponse(
                id=item.id,
                quantity=item.quantity,
                line_total=line_total,
                product=item.product,
            )
        )

    return CartResponse(
        id=cart.id,
        session_id=cart.session_id,
        total_price=total,
        items=result_items,
    )


@router.post("/", response_model=CartResponse, summary="Add item to cart")
def add_item_to_cart(
    payload: CartAddItemRequest,
    response: Response,
    db: Session = Depends(get_db),
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
) -> CartResponse:
    cart = _get_or_create_cart(db, x_session_id)

    product_stmt = select(Product).where(Product.id == payload.product_id)
    product = db.execute(product_stmt).scalar_one_or_none()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id={payload.product_id} not found",
        )

    item_stmt = select(CartItem).where(
        CartItem.cart_id == cart.id,
        CartItem.product_id == payload.product_id,
    )
    existing_item = db.execute(item_stmt).scalar_one_or_none()
    if existing_item:
        existing_item.quantity += payload.quantity
    else:
        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=payload.product_id,
                quantity=payload.quantity,
            )
        )

    db.commit()
    loaded_cart = _load_cart_with_items(db, cart.id)
    response.headers["X-Session-Id"] = loaded_cart.session_id
    return _serialize_cart(loaded_cart)


@router.get("/", response_model=CartResponse, summary="Get cart")
def get_cart(
    response: Response,
    db: Session = Depends(get_db),
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
) -> CartResponse:
    cart = _get_or_create_cart(db, x_session_id)
    db.commit()
    loaded_cart = _load_cart_with_items(db, cart.id)
    response.headers["X-Session-Id"] = loaded_cart.session_id
    return _serialize_cart(loaded_cart)


@router.put("/{item_id}/", response_model=CartResponse, summary="Update cart item quantity")
def update_cart_item(
    item_id: int,
    payload: CartUpdateItemRequest,
    response: Response,
    db: Session = Depends(get_db),
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
) -> CartResponse:
    cart = _get_cart_for_session_or_404(db, x_session_id)

    item_stmt = select(CartItem).where(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    )
    item = db.execute(item_stmt).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item with id={item_id} not found for this session",
        )

    item.quantity = payload.quantity
    db.commit()

    loaded_cart = _load_cart_with_items(db, cart.id)
    response.headers["X-Session-Id"] = loaded_cart.session_id
    return _serialize_cart(loaded_cart)


@router.delete("/{item_id}/", response_model=CartResponse, summary="Delete cart item")
def delete_cart_item(
    item_id: int,
    response: Response,
    db: Session = Depends(get_db),
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
) -> CartResponse:
    cart = _get_cart_for_session_or_404(db, x_session_id)

    item_stmt = select(CartItem).where(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    )
    item = db.execute(item_stmt).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item with id={item_id} not found for this session",
        )

    db.delete(item)
    db.commit()

    loaded_cart = _load_cart_with_items(db, cart.id)
    response.headers["X-Session-Id"] = loaded_cart.session_id
    return _serialize_cart(loaded_cart)
