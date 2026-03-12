# Bake Your Cake

Bakery website with customer, client, and admin URLs plus MongoDB storage.

## Features

- Customer home page for the bakery showcase
- Client login to monitor recent orders and bakery updates
- Admin login to manage customer records and view order analysis

## Run locally

1. Start MongoDB locally or provide a connection string.
2. Set the connection string if needed:

```bash
set MONGODB_URI=mongodb://127.0.0.1:27017/bake_your_cake
```

3. Optional admin credentials:

```bash
set ADMIN_USER=admin
set ADMIN_PASS=bake123
```

4. Install dependencies and run:

```bash
npm install
npm start
```

Open http://localhost:3000

## Run with Docker

```bash
docker compose up --build
```

## URLs

- `/customer` Customer home
- `/client-login` Client login
- `/client` Client monitoring page
- `/admin-login` Admin login
- `/admin` Admin management page

## API

- `GET /api/health`
- `GET /api/products`
- `POST /api/login/client`
- `POST /api/login/admin`
- `GET /api/users` (admin)
- `GET /api/orders` (admin)
- `GET /api/orders/client` (client)
- `POST /api/orders` (client)
