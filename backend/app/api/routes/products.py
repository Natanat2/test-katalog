from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Product
from app.schemas.product import ProductDetail, ProductListResponse

router = APIRouter(prefix="/products")

OrderingParam = Literal["price", "-price", "name", "-name"]


def _build_page_links(request: Request, *, count: int, limit: int, offset: int) -> tuple[str | None, str | None]:
    next_url = None
    if offset + limit < count:
        next_url = str(request.url.include_query_params(limit=limit, offset=offset + limit))

    previous_url = None
    if offset > 0:
        previous_offset = max(offset - limit, 0)
        previous_url = str(request.url.include_query_params(limit=limit, offset=previous_offset))

    return next_url, previous_url


@router.get("/", response_model=ProductListResponse, summary="List products")
def list_products(
    request: Request,
    db: Session = Depends(get_db),
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    category: str | None = Query(default=None),
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    q: str | None = Query(default=None, min_length=1),
    ordering: OrderingParam = "name",
) -> ProductListResponse:
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="min_price cannot be greater than max_price",
        )

    filters = []

    if category:
        filters.append(Product.category == category)
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
    if q:
        normalized_q = q.strip()
        if normalized_q:
            query = f"%{normalized_q}%"
            filters.append(or_(Product.name.ilike(query), Product.description.ilike(query)))

    count_stmt = select(func.count()).select_from(Product)
    if filters:
        count_stmt = count_stmt.where(*filters)
    total = db.scalar(count_stmt) or 0

    stmt = select(Product)
    if filters:
        stmt = stmt.where(*filters)

    if ordering == "price":
        stmt = stmt.order_by(Product.price.asc(), Product.id.asc())
    elif ordering == "-price":
        stmt = stmt.order_by(Product.price.desc(), Product.id.desc())
    elif ordering == "name":
        stmt = stmt.order_by(Product.name.asc(), Product.id.asc())
    else:
        stmt = stmt.order_by(Product.name.desc(), Product.id.desc())

    stmt = stmt.offset(offset).limit(limit)
    items = db.execute(stmt).scalars().all()

    next_url, previous_url = _build_page_links(request, count=total, limit=limit, offset=offset)
    return ProductListResponse(
        count=total,
        next=next_url,
        previous=previous_url,
        results=items,
    )


@router.get("/{product_id}/", response_model=ProductDetail, summary="Get product details")
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductDetail:
    stmt = select(Product).where(Product.id == product_id)
    product = db.execute(stmt).scalar_one_or_none()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id={product_id} not found",
        )
    return product
