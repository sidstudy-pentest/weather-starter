# Testing Patterns

## Integration tests — `locations.test.ts`

Use supertest against `createApp({ serveFrontend: false, ... })`. Each test file sets `DATABASE_PATH` to a temp directory **before importing the server** — the real `backend/weather.db` is never touched. `fileParallelism: false` in vitest config because the database is a module-level singleton (importing the server twice in the same process would share it).

## Unit tests — `weather.test.ts`

Tests `SingaporeWeatherClient` in isolation without network calls.

- `fakeProvider(overrides)` returns a `vi.fn()` that dispatches mock responses by URL endpoint segment. Pass `null` for an endpoint to simulate that feed returning 404/error.
- Stub with `vi.stubGlobal('fetch', fakeProvider(...))` and restore in `afterEach` via `vi.unstubAllGlobals()`.
- A nulled feed causes only that feed's fields to be `null`; all other fields remain populated. This verifies the per-feed graceful degradation design — write tests this way when adding new feeds.
