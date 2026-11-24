# ZINGO (rebuild)

Telegram Mini App: Free / Pro / VIP football prediction competitions.
- `public/index.html`: the new interactive design (mock data, no backend yet).
- `worker.js`: legacy API, to be rewritten in modules.
- Old code: tag `legacy-before-rebuild`. `main` is untouched.

## API (worker.js)
Auth: Telegram `initData` (HMAC) in `X-Telegram-Init-Data`. Tables are created automatically (`z_*`, no clash with the legacy ones).
- `GET /api/me`, `POST /api/profile` (name 30-day lock, emblem, frame)
- `GET /api/round?tier=free|pro|vip`, `POST /api/predict` (save once), `POST /api/total`, `GET /api/ranking?tier=`
- Admin only (`ADMIN_IDS` var, default owner): `POST /api/admin/round`, `/api/admin/settle`, `/api/admin/grant`
- Optional vars: `ADMIN_IDS` (comma list), `DEV_AUTH=1` (previews only, never production).

## Tests
`node --experimental-sqlite test/api.test.mjs` (Node 22+, D1 emulated with node:sqlite).
