# Backend

FastAPI backend for interactive product catalog API.

## Run in Docker (recommended)

1. Start services (from repository root):

```bash
docker compose up -d --build
```

2. Seed products:

```bash
docker compose exec backend python -m app.scripts.seed_products --reset --count 20
```

Swagger UI: `http://localhost:8000/docs`

## Local run (without Docker backend)

1. Start PostgreSQL (from repository root):

```bash
docker compose up -d postgres
```

2. Create virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Copy env file:

```bash
cp .env.example .env
```

5. Apply migrations:

```bash
.venv/bin/alembic upgrade head
```

6. Run app:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger UI: `http://localhost:8000/docs`

## Seed data

```bash
.venv/bin/python -m app.scripts.seed_products --reset --count 20
```

## Run tests

```bash
.venv/bin/pytest -q
```

## API notes

- Cart endpoints use `X-Session-Id` header.
- `GET /api/cart/` and `POST /api/cart/` create a cart if session header is missing and return `X-Session-Id` in response headers.
- `PUT /api/cart/{item_id}/` and `DELETE /api/cart/{item_id}/` require `X-Session-Id`.
