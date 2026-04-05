from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CartAddItemRequest(BaseModel):
    product_id: int = Field(ge=1)
    quantity: int = Field(ge=1)


class CartUpdateItemRequest(BaseModel):
    quantity: int = Field(ge=1)


class CartItemProduct(BaseModel):
    id: int
    name: str
    price: Decimal
    image: str | None
    category: str

    model_config = ConfigDict(from_attributes=True)


class CartItemResponse(BaseModel):
    id: int
    quantity: int
    line_total: Decimal
    product: CartItemProduct


class CartResponse(BaseModel):
    id: int
    session_id: str
    total_price: Decimal
    items: list[CartItemResponse]
