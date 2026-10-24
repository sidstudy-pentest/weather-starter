# AGENTS.md

Singapore weather dashboard — saves named locations and displays live weather snapshots from Singapore's data.gov.sg API.

## Commands

npm workspaces monorepo (`frontend`, `backend`). Run all commands from the repo root.

```bash
npm install
npm run dev            # http://weather-starter.localhost:1355
npm run build          # tsc + vite (frontend), then tsc (backend → backend/dist)
npm run start          # production mode
npm test               # vitest (backend/src/**/*.test.ts)
npm run test:watch
npx vitest run backend/src/routes/locations.test.ts
npx vitest run backend/src/routes/locations.test.ts -t "test name"
npm run doctor         # hits /health and /api/locations
npm run reset          # deletes backend/weather.db
npm run db:generate    # run after editing backend/src/schema.ts
npm run db:migrate
```

No lint script — ESLint and Prettier are installed but not wired to npm scripts. Type-checking: `npm run build`.

`scripts/dev.mjs` and `scripts/start.mjs` use `shell: true` for Windows compatibility. Preserve this when editing spawn calls.

## Architecture

- [Backend](docs/agents/backend.md) — dev server, Express routes, weather client, snapshot data flow, interaction logging
- [Frontend](docs/agents/frontend.md) — React state, theming system, tile grid, map components
- [Testing](docs/agents/testing.md) — integration and unit test patterns
- [Database](docs/agents/database.md) — SQLite setup, schema workflow, env vars
