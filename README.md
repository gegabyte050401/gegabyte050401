# Sweet Crumbs Bakery (Docker Desktop ready)

A lightweight bakery website for online ordering with local JSON order persistence.

## Features

- Browse bakery menu products
- Add/remove quantities in cart
- Place orders through a checkout form
- View the latest 5 recent orders
- Health endpoint at `/api/health`

## Run with Docker Desktop

1. Open Docker Desktop.
2. From this folder, run:

```bash
docker compose up --build
```

3. Open http://localhost:3000

Orders are persisted to `data/orders.json` on your host via a bind mount.

## Run locally without Docker

```bash
npm start
```

## API

- `GET /api/health`
- `GET /api/products`
- `GET /api/orders`
- `POST /api/orders`
