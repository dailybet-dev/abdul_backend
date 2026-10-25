# Abdul ICT & Electrical Solutions — Backend

NestJS REST + GraphQL API, Prisma ORM, PostgreSQL, and opaque server-side admin sessions.

## Local development
1. Copy `.env.example` to `.env`; set `DATABASE_URL`, `FRONTEND_URL`, and a random `SESSION_HASH_SECRET` (at least 32 characters).
2. Run `npm install`, then `npx prisma generate`.
3. Apply the schema with `npx prisma migrate dev`.
4. Set `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` (14+ characters), then start the API. The bootstrap command creates the admin only if that email does not already exist.
5. Run `npm run start:dev`.

## Endpoints
- `GET /api/health` — public health check.
- `POST /api/auth/login` — public login; JSON `{ "email": "...", "password": "..." }`; sets an HttpOnly `admin_session` cookie.
- `GET /api/auth/me` — protected session validation.
- `POST /api/auth/logout` — protected logout and cookie clearing.
- `POST /api/graphql` — protected GraphQL; `adminSessionStatus` returns current admin session details.

All routes are protected by default except handlers decorated `@Public()`. Sessions are random 256-bit opaque values; only a SHA-256 hash mixed with a server-side secret is stored in PostgreSQL. Sessions expire after eight hours. Passwords are bcrypt-hashed.

## Railway
1. Add a PostgreSQL service.
2. Deploy this repo as a separate service.
3. Set the variables in `.env.example`; use Railway's private Postgres connection reference for `DATABASE_URL`, e.g. `${{Postgres.DATABASE_URL}}` (replace `Postgres` with the actual service name).
4. `railway.json` applies committed Prisma migrations before starting the API.
5. For the first deployment only, set `ADMIN_EMAIL` and a strong `ADMIN_INITIAL_PASSWORD` (14+ characters). Startup applies migrations and creates that admin only if it does not exist. After the first successful deployment, remove `ADMIN_INITIAL_PASSWORD` from Railway variables and redeploy. The bootstrap will skip itself thereafter.

For reliable browser cookies, use custom frontend/API domains under the same root domain if possible. Railway-generated frontend and API domains are different sites; production uses `SameSite=None; Secure`, but browser third-party-cookie policies may still block cookies. A same-origin reverse proxy is the most reliable alternative.

Never commit `.env` or real secrets. Rotate the bootstrap password and remove the bootstrap variable after setup.
