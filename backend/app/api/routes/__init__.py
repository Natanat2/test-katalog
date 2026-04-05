from fastapi import APIRouter

from app.api.routes import cart, health, products

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(products.router, tags=["products"])
api_router.include_router(cart.router, tags=["cart"])
