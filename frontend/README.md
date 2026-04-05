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

SSR frontend: `http://localhost:5173`

`PUBLIC_BASE_URL` используется для canonical/og URL в SSR метатегах.  
`SSR_API_URL` используется серверным рендером для загрузки данных товара на `/products/:id`.

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

## SPA mode (optional)

```bash
npm run dev:spa
npm run build:spa
npm run preview:spa
```

## Main routes

- `/` - catalog
- `/products/:id` - product details
- `/compare` - compare mode
