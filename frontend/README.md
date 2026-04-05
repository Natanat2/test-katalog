# Frontend

React + Vite frontend for interactive product catalog.

## Stack

- React (JSX)
- Vite
- SASS
- react-window (virtualized list)
- @dnd-kit/core (drag-and-drop)
- react-toastify (notifications)

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Run in Docker

From repository root:

```bash
docker compose up -d --build
```

Frontend: `http://localhost:5173`

## Build

```bash
npm run build
npm run preview
```

## Main routes

- `/` - catalog
- `/products/:id` - product details
- `/compare` - compare mode
