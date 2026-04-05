# Test Katalog

Interactive product catalog project.

## Project structure

- `backend/` - FastAPI API service
- `frontend/` - React + Vite client
- `docker-compose.yml` - local infrastructure (PostgreSQL + backend + frontend)

## Run in Docker (recommended)

```bash
docker compose up -d --build
```

Backend API: `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`  
Frontend: `http://localhost:5173`

Seed products:

```bash
docker compose exec backend python -m app.scripts.seed_products --reset --count 10
```

Stop services:

```bash
docker compose down
```

## Backend local run (without Docker backend)

```bash
docker compose up -d postgres
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
.venv/bin/alembic upgrade head
.venv/bin/python -m app.scripts.seed_products --reset --count 10
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend run

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`
