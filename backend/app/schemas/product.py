from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductListItem(BaseModel):
    id: int
    name: str
    price: Decimal
    image: str | None
    category: str

    model_config = ConfigDict(from_attributes=True)


class ProductDetail(BaseModel):
    id: int
    name: str
    description: str
    price: Decimal
    image: str | None
    category: str

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    count: int
    next: str | None
    previous: str | None
    results: list[ProductListItem]
