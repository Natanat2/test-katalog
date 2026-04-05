from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_optional_current_user
from app.db.session import get_db
from app.models import Cart, CartItem, Product, User
from app.schemas.cart import (
    CartAddItemRequest,
    CartItemResponse,
    CartResponse,
    CartUpdateItemRequest,
)
from app.services.cart_service import (
    find_cart_by_session,
    get_or_create_session_cart,
    get_or_create_user_cart,
    merge_session_cart_into_user_cart,
)

router = APIRouter(prefix="/cart")


def _get_cart_for_session_or_404(db: Session, session_id: str | None) -> Cart:
    normalized = (session_id or "").strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Session-Id header is required",
        )
    cart = find_cart_by_session(db, normalized)
    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart with session_id={normalized} not found",
        )
    return cart


def _resolve_cart_for_read_or_add(
    db: Session,
    session_id: str | None,
    current_user: User | None,
) -> Cart:
    if current_user:
        user_cart = get_or_create_user_cart(db, current_user)
        return merge_session_cart_into_user_cart(db, session_id, current_user, user_cart)
    return get_or_create_session_cart(db, session_id)


def _resolve_cart_for_item_mutation(
    db: Session,
    session_id: str | None,
    current_user: User | None,
) -> Cart:
    if current_user:
        user_cart = get_or_create_user_cart(db, current_user)
        return merge_session_cart_into_user_cart(db, session_id, current_user, user_cart)
    return _get_cart_for_session_or_404(db, session_id)


def _load_cart_with_items(db: Session, cart_id: int) -> Cart:
    stmt = (
        select(Cart)
        .where(Cart.id == cart_id)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
    )
    return db.execute(stmt).scalars().unique().one()


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
    current_user: User | None = Depends(get_optional_current_user),
) -> CartResponse:
    cart = _resolve_cart_for_read_or_add(db, x_session_id, current_user)

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
    current_user: User | None = Depends(get_optional_current_user),
) -> CartResponse:
    cart = _resolve_cart_for_read_or_add(db, x_session_id, current_user)
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
    current_user: User | None = Depends(get_optional_current_user),
) -> CartResponse:
    cart = _resolve_cart_for_item_mutation(db, x_session_id, current_user)

    item_stmt = select(CartItem).where(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    )
    item = db.execute(item_stmt).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item with id={item_id} not found for this cart",
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
    current_user: User | None = Depends(get_optional_current_user),
) -> CartResponse:
    cart = _resolve_cart_for_item_mutation(db, x_session_id, current_user)

    item_stmt = select(CartItem).where(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    )
    item = db.execute(item_stmt).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item with id={item_id} not found for this cart",
        )

    db.delete(item)
    db.commit()

    loaded_cart = _load_cart_with_items(db, cart.id)
    response.headers["X-Session-Id"] = loaded_cart.session_id
    return _serialize_cart(loaded_cart)
