# ThinkMetal Inventory API

Small Express API that sits between the browser and Supabase Postgres.

## Routes

- `GET /`
- `GET /api/health`
- `GET /api/inventory`

## Run

```sh
cd api
cp .env.example .env
npm install
npm run dev
```

Use your real Supabase Postgres URI in `.env`.

## Test

```sh
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:3000/api/inventory
```
