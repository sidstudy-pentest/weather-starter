# Frontend Architecture

## State

No router, no state library. `frontend/src/state/store.tsx` is a React context `StoreProvider` owning the location list, selection, add-form visibility, and refresh/delete state. It calls `api.ts` then reloads the full list after each mutation. Hooks: `useStore()` and `useSelectedLocation()`. `Layout.tsx` is the top-level shell.

## Theming

21 named themes in `frontend/src/theme.ts`. `ThemeId` is derived from the array — adding a theme automatically extends the union type. `useTheme()` persists to `localStorage` and applies themes via `document.documentElement.dataset.theme`. A `data-period` attribute (dawn/day/dusk/night from the current hour) is also set for the Sunrise Gradient theme's time-of-day backgrounds.

`tailwind.config.js` remaps `white` → `rgb(var(--c-fg) / <alpha-value>)` and `black` → `rgb(var(--c-bg) / <alpha-value>)`, and maps `rounded-md`, `rounded-lg`, `rounded-2xl`, and `backdrop-blur-xl` to CSS variables. Components need zero theme-conditional logic — all visual variation happens through `themes.css`. Per-theme controls:

| Variable | Effect |
|---|---|
| `--c-fg` / `--c-bg` | Foreground/background RGB triples |
| `--r-md` / `--r-lg` | Border radii (set to `0px` for sharp corners) |
| `--blur-card` | Backdrop blur (set to `0px` to disable) |
| `--font-body` | Font stack (serif / monospace / system-ui) |
| `--body-bg` / `--body-size` | Background gradient and tile size |

## Tile grid and map

`TileGrid` renders `MapCard` as its first tile before the weather tiles. `MapCard` reads `locations` from `useStore()` directly (no prop). It is a non-interactive preview (dragging/zoom/scroll disabled) that expands to `FullscreenMapView` — a `fixed inset-0 z-50` modal with full Leaflet controls.

Both components apply the same Leaflet default-icon CDN fix at module load. `WeatherMarker` (a `divIcon` with Tailwind-class HTML) is currently duplicated in both files — extract it to a shared module if either changes. Tailwind classes inside `L.divIcon({ html: ... })` are runtime strings the static scanner may not detect: if map markers appear unstyled, add those class names to `safelist` in `tailwind.config.js`.
