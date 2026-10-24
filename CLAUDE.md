@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

npm workspaces monorepo (`frontend`, `backend`). Run everything from the repo root.

```bash
npm install            # also runs husky via the "prepare" script
npm run dev            # Express + Vite through Portless, http://weather-starter.localhost:1355
npm run build          # frontend build (tsc + vite build), then tsc for backend -> backend/dist
npm run start          # runs backend/dist/server.js with NODE_ENV=production (serves frontend/dist)
npm test               # vitest run (backend/src/**/*.test.ts only)
npm run test:watch
npx vitest run backend/src/routes/locations.test.ts                           # single file
npx vitest run backend/src/routes/locations.test.ts -t "refreshes weather"   # single test by name
npm run doctor         # hits /health and /api/locations (default http://127.0.0.1:3000)
npm run reset          # deletes backend/weather.db (+ -wal/-shm)
npm run db:generate    # drizzle-kit generate after editing backend/src/schema.ts
npm run db:migrate     # drizzle-kit migrate
```

There is no ESLint or Prettier script in package.json, even though both are installed as devDependencies. Don't assume a lint command exists. Type-checking happens through `npm run build`.

## Architecture

**One process in development.** `scripts/dev.mjs` wraps `tsx watch backend/src/server.ts` in `portless run`. `createApp()` in `backend/src/server.ts` mounts Express routes and then Vite in middleware mode, so there is no separate frontend dev server and no frontend port config. The frontend calls relative `/api/*` URLs. In production (`NODE_ENV=production`) the same app serves `frontend/dist` as static files.

**Backend layers.**
- `routes/locations.ts` is the HTTP layer. `createLocationsRouter({ weatherClient })` takes an injectable `WeatherClient`, which is how tests replace the external API.
- `db.ts` is the only module that touches SQLite. It uses `node:sqlite` `DatabaseSync` (Node 22+ built-in, not an npm package) under Drizzle's `sqlite-proxy` driver, and runs migrations from `backend/drizzle` at import time. Schema lives in `schema.ts`, which also defines the `WeatherSnapshot` shape. `forecast_periods` and `daily_forecast` are stored as JSON columns. `DuplicateLocationError` is thrown by `createLocation` before hitting any DB constraint.
- `weather.ts` (`SingaporeWeatherClient`) is the data.gov.sg client. `getCurrentWeather` fans out about ten requests with `Promise.all`, and each feed has its own `.catch(() => null)`. One failing feed leaves only its own fields null. Forecast matching uses the nearest `area_metadata` label, and the air-quality and station readings use nearest-point lookup. The client throws `WeatherProviderError` for provider problems. Routes map that to 502 on refresh and to a logged 201 on create.

**Snapshot data flow.** The weather API is never called on read. `POST /api/locations` inserts the row with a placeholder weather value (`condition: 'Not refreshed'`), immediately calls the weather client, and writes the snapshot back with `updateWeather`. If the provider fails, the location is still created and returned. `POST /:id/refresh` overwrites the latest snapshot. Coordinates are unique (`locations_latitude_longitude_unique`), and duplicates return 409. Input is restricted to a bounding box around Singapore.

**Frontend state.** There is no router and no state library. `frontend/src/state/store.tsx` is a single `StoreProvider` (React context) that owns the location list, selection, add-form visibility, and refresh/delete state. It calls `api.ts` and then reloads the full list after each mutation. Components read from `useStore()` / `useSelectedLocation()`. `Layout.tsx` is the top-level shell. Every mutating action calls `logInteraction()` from `api.ts` (events like `'location_create_submitted'`, `'location_created'`, `'location_create_failed'`); follow this pattern for any new operations.

**Theming.** 21 named themes are defined in `frontend/src/theme.ts` (the `ThemeId` union type is derived from the array, so adding a theme automatically extends it). `useTheme()` persists to `localStorage` and applies a theme by setting `document.documentElement.dataset.theme`. A `data-period` attribute (dawn/day/dusk/night from the current hour) is also set to support the Sunrise Gradient theme's time-of-day backgrounds.

The Tailwind config remaps `white` → `rgb(var(--c-fg) / <alpha-value>)` and `black` → `rgb(var(--c-bg) / <alpha-value>)`, and maps `rounded-md`, `rounded-lg`, `rounded-2xl`, and `backdrop-blur-xl` to CSS variables. This means components need no theme-conditional logic — a single set of Tailwind classes adapts to all themes via `themes.css` variable substitution. Themes that want square corners set `--r-md: 0px`; themes that want no blur set `--blur-card: 0px`; `--font-body` varies per theme (serif, monospace, or system-ui).

**Tile grid and map.** `TileGrid` in `Tiles.tsx` renders `MapCard` as the first tile before the weather tiles; `MapCard` reads `locations` from `useStore()` directly. `MapCard` is a non-interactive preview (dragging/zoom disabled) that expands to `FullscreenMapView` (a `fixed inset-0 z-50` modal). Both use react-leaflet and apply the same Leaflet default-icon CDN fix at module load. `WeatherMarker` (a `divIcon` with Tailwind-class HTML) is duplicated in both files and should be extracted to a shared module if either changes. Tailwind classes inside `L.divIcon({ html: ... })` are runtime strings that Tailwind's static scanner may not detect — if map markers appear unstyled, add those class names to `safelist` in `tailwind.config.js`.

**Interaction logging.** Store actions call `logInteraction`, which POSTs to `/api/logs`. That endpoint writes to the pino logger, which goes to stdout and `backend/logs/app.log`. Logger output is silenced under `NODE_ENV=test`.

**Tests.** `backend/src/routes/locations.test.ts` uses supertest against `createApp({ serveFrontend: false, ... })`. Each test sets `DATABASE_PATH` to a temp directory before importing the server, so the real `backend/weather.db` is never touched. Vitest runs with `fileParallelism: false` because the database is a module-level singleton.

`backend/src/weather.test.ts` tests `SingaporeWeatherClient` in isolation. It uses a `fakeProvider(overrides)` factory that creates a `vi.fn()` dispatching by URL endpoint segment, and stubs global `fetch` with `vi.stubGlobal`. Pass `null` for an endpoint to simulate feed failure and verify graceful degradation (only that feed's fields go null).

## Notes

- Database path comes from `DATABASE_PATH` and defaults to `backend/weather.db`. Migrations are applied automatically on startup, so after changing `schema.ts` you need `db:generate`, and the new migration is picked up on the next start.
- `WEATHER_API_KEY` is optional and is sent as the `x-api-key` header. Copy `.env.example` to `.env` to set it.
- `scripts/dev.mjs` and `scripts/start.mjs` use `shell: true` / a Windows-compatible spawn. Keep this in mind when editing them, since the repo has had Windows-specific fixes in its recent history.
