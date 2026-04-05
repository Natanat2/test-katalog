from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Product

TEST_DATABASE_URL = "sqlite+pysqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    class_=Session,
)


@pytest.fixture
def db_session() -> Session:
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session: Session) -> TestClient:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_products(db_session: Session) -> list[int]:
    products = [
        Product(
            name="Test Phone",
            description="Phone for tests",
            price=Decimal("100.00"),
            image=None,
            category="Electronics",
        ),
        Product(
            name="Test Book",
            description="Book for tests",
            price=Decimal("20.50"),
            image=None,
            category="Books",
        ),
        Product(
            name="Test Lamp",
            description="Lamp for tests",
            price=Decimal("35.10"),
            image=None,
            category="Home",
        ),
    ]
    db_session.add_all(products)
    db_session.commit()
    return [product.id for product in products]
