# Database

## Setup

Uses Node 22's built-in `node:sqlite` (`DatabaseSync`) — not an npm package. Wrapped in a custom `drizzle-orm/sqlite-proxy` adapter so the synchronous driver works behind Drizzle's async API. WAL mode is enabled at startup.

Migrations live in `backend/drizzle/` and run automatically when the module is first imported — no manual migration step needed during development.

## Schema changes

1. Edit `backend/src/schema.ts`
2. `npm run db:generate` — generates a new migration file in `backend/drizzle/`
3. Restart the dev server — migration applies on next import

## Key implementation details

- `forecast_periods` and `daily_forecast` are JSON columns (serialized arrays).
- `DuplicateLocationError` is thrown by `createLocation` on exact lat/lon match, before any DB constraint fires.
- `resetStore()` deletes all rows and resets the autoincrement sequence — used only in tests.
- `closeDatabase()` closes the synchronous connection — used in integration test teardown.

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_PATH` | `backend/weather.db` | Tests set this to a temp dir before importing the server |
| `WEATHER_API_KEY` | _(none)_ | Sent as `x-api-key`; copy `.env.example` to `.env` to set it |
