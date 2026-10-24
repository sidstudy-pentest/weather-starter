# Backend Architecture

## Dev server

`scripts/dev.mjs` spawns `tsx watch backend/src/server.ts` inside Portless. `createApp()` mounts Express routes then Vite in middleware mode — no separate frontend dev server, no frontend port. Frontend uses relative `/api/*` URLs. Production (`NODE_ENV=production`) serves `frontend/dist` as static files from the same Express app.

## Layers

- **`routes/locations.ts`** — HTTP layer. `createLocationsRouter({ weatherClient })` accepts an injectable `WeatherClient`, which is how tests swap in a fake without network calls.
- **`weather.ts`** (`SingaporeWeatherClient`) — fans out ~10 `Promise.all` requests to data.gov.sg feeds; each has its own `.catch(() => null)` so one failing feed nulls only its own fields. Throws `WeatherProviderError` on provider failure; routes map that to 502 on refresh and to a logged 201 on create.
- **`db.ts`** — sole SQLite access point. See [database.md](database.md).

## Snapshot data flow

`POST /api/locations` inserts with `condition: 'Not refreshed'`, immediately fetches weather, and writes back with `updateWeather`. Provider failure still creates the location. `POST /:id/refresh` overwrites the snapshot. Lat/lon pairs are unique (409 on duplicate). The weather API is never called on read.

## Interaction logging

Every store action calls `logInteraction()` from `api.ts`, which POSTs to `/api/logs`. That endpoint writes via pino to stdout and `backend/logs/app.log`. Logger output is silenced under `NODE_ENV=test`. Follow the same pattern for any new operations — log on submission, success, and failure (e.g., `'location_create_submitted'`, `'location_created'`, `'location_create_failed'`).
