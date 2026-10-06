# Tanit Bank

Full-stack banking platform with ACID-safe transfers, admin-configurable loan products,
a public loan simulator, an approval workflow and a full audit trail.

> Portfolio project. No real money, no payment rails, not a licensed bank.

## Stack

| Layer | Choice |
|---|---|
| Web | Next.js 16.3, React 19, Tailwind CSS 4, TanStack Query, React Hook Form + Zod, Recharts |
| API | NestJS 11, TypeScript 5.9, Swagger, throttler, helmet |
| Database | PostgreSQL 17 on Neon, Prisma 7 (driver adapter) |
| Auth | JWT access token + rotating refresh token (httpOnly cookie), argon2 |
| Money | Decimal(14,3) everywhere, decimal.js, no floats |
| Hosting | Vercel (web), Render (API), Neon (DB) |

All dependency versions are pinned exactly. Runtime: Node 22 LTS.

## Architecture

```
Browser -> Vercel (Next.js) --/api/* rewrite--> Render (NestJS) --> Neon (PostgreSQL)
```

The browser only talks to the Vercel domain, so the refresh cookie is first-party.

Every cash movement has two sides. The internal TREASURY account is the counterparty
of deposits, withdrawals, loan disbursements and repayments, so the sum of all balances
is always zero.

## Run locally

```bash
# API
cd apps/api
cp .env.example .env        # fill in your Neon URLs and secrets
npm install
npx prisma migrate dev
npm run start:dev           # http://localhost:4000/docs

# Web (new terminal)
cd apps/web
npm install
npm run dev                 # http://localhost:3000
```

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `API_URL` | Vercel / web | Render API base URL used by the rewrites |
| `DATABASE_URL` | Render / api | Neon pooled connection string |
| `DIRECT_URL` | Render / api | Neon direct connection string (migrations) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | api | Token signing |
| `CORS_ORIGIN` | api | Allowed web origin |
| `PORT` | api | HTTP port |

## Deploy

- **Vercel**: root directory `apps/web`, env `API_URL`.
- **Render** (web service): root directory `apps/api`, `NODE_VERSION=22`,
  build `npm ci --include=dev && npm run build && npm run db:deploy`,
  start `npm run start`, health check path `/health`.
- **Neon**: `main` branch for production, `dev` branch for local work.

## Roadmap

- [x] Phase 0: setup
- [ ] Phase 1: auth and roles
- [ ] Phase 2: core banking
- [ ] Phase 3: loan products and simulator
- [ ] Phase 4: loan applications
- [ ] Phase 5: dashboards
- [ ] Phase 6: cards, notifications, audit, PDF statements
- [ ] Phase 7: polish and ship