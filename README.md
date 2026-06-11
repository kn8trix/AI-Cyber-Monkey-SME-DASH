<div align="center">

# 🐒 AI Cyber Monkey — SME Dashboard

**An AI-powered, multi-tenant commerce platform for small & medium businesses.**

Spin up isolated storefronts, generate product copy, analyse competitor pricing, and
simulate autonomous storefront updates from a single dashboard — with Supabase as the
data layer, Gemini for AI, and Vercel for deploys.

[![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Vite%206%20%2B%20Express%204-blue)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%20strict-3178c6)](#tech-stack)
[![Node](https://img.shields.io/badge/Node-%E2%89%A520-339933)](#prerequisites)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black)](#deploy-to-vercel)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

</div>

---

## ✨ What it does

| Module | What you get |
|---|---|
| **Admin Dashboard** | Metrics, balances, recent orders, activity feed, multi-store table |
| **Multi-Tenant Provisioning** | Provision isolated tenants with dedicated schema, port, and API key |
| **Storefront Deployer** | Push a tenant storefront to a Vercel subdomain in one click |
| **AI Copy Writer** | Generate product titles, descriptions, and taglines via Gemini |
| **AI Visual Deployer** | Text → image → live product card in the storefront |
| **Pricing Analyzer** | Compare against market, recommend price, elasticity hint |
| **Autonomous Learning** | Watch ingest events + recommend the next product action |
| **Data Sorter** | Upload CSV/Sheets → clean, categorise, ingest into Supabase |
| **Customer Storefront** | Public-facing shop with cart, search, and product detail |
| **i18n** | 🇧🇩 বাংলা + 🇬🇧 English with instant switcher |

> **Audience for this build:** a *BuildFest* pitch demo. The dashboard works end-to-end
> with the Supabase schema in [`supabase/init.sql`](./supabase/init.sql) (3 tenants,
> 9 products, 8 orders seeded) **or** with hardcoded fallback data when no
> `DATABASE_URL` is set.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  VERCEL (single project, serverless function)                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  React 19 SPA (Vite 6) + Express 4 in /api/*              │  │
│  │  • Admin Dashboard   • Storefront   • API endpoints        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │  pg (node-postgres)               │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  SUPABASE (Postgres + Auth + Storage)                      │  │
│  │  • Master schema  • tenant_${id}.*  • supabase/init.sql    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  External:  Google Gemini 2.5 Flash (AI)  •  Vercel Deploy API   │
└──────────────────────────────────────────────────────────────────┘
```

- **One Vercel project, two faces.** `/` serves the React SPA; `/api/*` is handled by
  the Express app bundled to `dist/server.cjs` via esbuild.
- **Multi-tenant by `tenant_id`** for the demo. The production code in
  `src/server/db.ts` provisions `tenant_${uuid}` schemas; the BuildFest schema in
  `supabase/init.sql` keeps everything in `public.*` with a `tenant_id` column so
  judges can browse tables directly.
- **Graceful degradation.** Every AI/DB endpoint returns a typed fallback payload
  when its dependencies are missing, so the UI never breaks during a demo.

---

## 📦 Tech stack

| Layer | Choice |
|---|---|
| Frontend | **React 19.0.1**, **Vite 6.4.3**, **TypeScript 5.8** strict |
| Styling | **Tailwind CSS 3.4** + small custom design tokens |
| State | React context (`SmeProvider`) + localStorage persistence |
| i18n | Custom `LanguageContext` (`en.ts`, `bn.ts`) |
| Backend | **Express 4.21** (bundled to `dist/server.cjs` via esbuild) |
| DB | **Supabase / Postgres** via `pg` pool + `@supabase/supabase-js` |
| AI | **Google Gemini 2.5 Flash** (`@google/genai`) |
| Deploy | **Vercel Deploy API** (`src/server/vercel-deploy.ts`) |
| Dev runner | `tsx` (server) + Vite (HMR for SPA) |

---

## 🚀 Quick start (local)

### Prerequisites
- **Node ≥ 20** (tested on Node 24)
- **npm ≥ 10**
- A Supabase project *(optional — works with hardcoded fallback data without it)*
- A Google AI Studio API key *(optional — AI features return 500 without it)*

### 1. Install
```bash
git clone https://github.com/kn8trix/AI-Cyber-Monkey-SME-DASH.git
cd AI-Cyber-Monkey-SME-DASH
npm install
```

### 2. Configure environment
Create `.env.local`:
```bash
# --- Required for AI features ---
GEMINI_API_KEY=AIzaSy...                  # https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.5-flash            # default; can override per endpoint

# --- Required for multi-tenant admin endpoints (production) ---
ADMIN_API_KEY=$(openssl rand -hex 32)    # any long random string

# --- Optional: real Supabase Postgres ---
# Copy the "Transaction pooler" URL from
#   Supabase Dashboard → Project Settings → Database → Connection string
DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

# --- Optional: Vercel one-click deploy of new storefronts ---
VERCEL_TOKEN=...
VERCEL_TEAM_ID=...                       # omit for personal accounts
VERCEL_PROJECT_PREFIX=sm

# --- Optional: client-side Supabase (anon key) ---
VITE_SUPABASE_URL=https://[ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Boot the dev server
```bash
npm run dev
```
Opens on **http://127.0.0.1:3000** (Express serves the Vite SPA + API together).

> **First-run behaviour:** if `DATABASE_URL` is missing, the dashboard renders with
> the hardcoded demo dataset in `src/data.ts`. To see live data, run
> [`supabase/init.sql`](./supabase/init.sql) in your Supabase SQL Editor, then
> restart.

### 4. Build for production
```bash
npm run build      # bundles SPA to dist/ and server to dist/server.cjs
npm start          # node dist/server.cjs  (no tsx, no HMR)
```

---

## 🗂️ Project layout

```
.
├── api/index.ts              ← Vercel serverless entry (re-exports Express app)
├── server.ts                 ← Express bootstrap, AI routes, demo endpoints
├── src/
│   ├── App.tsx               ← Root + SmeProvider
│   ├── data.ts               ← Hardcoded demo dataset (fallback)
│   ├── types.ts              ← Shared TS types (StorefrontProfile, Product, …)
│   ├── components/           ← All React UI (see "Modules" below)
│   │   ├── RefactoredDashboard.tsx     ← New top-level layout
│   │   ├── dashboard-index.ts          ← Central export map
│   │   ├── MetricCards.tsx
│   │   ├── CurrentBalances.tsx
│   │   ├── StoresTable.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── AIStorefrontDeployer.tsx
│   │   ├── AiVisualDeployer.tsx
│   │   ├── CopyWriter.tsx
│   │   ├── PricingAnalyzer.tsx
│   │   ├── AutonomousLearning.tsx
│   │   ├── DataSorter.tsx
│   │   ├── GoogleSheetsDashboard.tsx
│   │   ├── CustomerStorefront.tsx
│   │   ├── StorefrontManager.tsx
│   │   ├── DeployNewStorefrontModal.tsx
│   │   ├── SmeProfileManager.tsx
│   │   ├── SmeWebsiteCustomizer.tsx
│   │   ├── SmeCatalogSelector.tsx
│   │   ├── SmeDrawerMenu.tsx
│   │   ├── DashboardHeader.tsx
│   │   └── LangSwitcher.tsx
│   ├── i18n/                 ← en.ts, bn.ts, LanguageContext.tsx
│   └── server/               ← Multi-tenant backend
│       ├── db.ts                       ← Master schema + connection pool
│       ├── multi-tenant-routes.ts      ← /api/admin/*, /api/assets/*, /api/storefront/*
│       ├── tenant-context.ts           ← Host/Header/API-key → tenant binding
│       ├── provisioning.ts             ← Tenant creation (schema, port, S3)
│       ├── asset-manager.ts            ← S3 + CloudFront URL builder
│       └── vercel-deploy.ts            ← Programmatic Vercel project creation
├── supabase/
│   └── init.sql              ← BuildFest demo schema + seed data
├── docker-compose.yml        ← Postgres + Redis + NGINX + Node
├── nginx.conf                ← Multi-domain reverse proxy
├── Dockerfile                ← Production image (Node 20 Alpine)
├── vercel.json               ← Rewrites /api/* → serverless fn, /assets/* → static
├── tsconfig.json
└── vite.config.ts
```

---

## 🔌 API surface

All routes are mounted on the Express app. In Vercel they are exposed as
`/api/*` serverless functions via `vercel.json` rewrites.

### Public demo endpoints (used by the dashboard widgets)
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/demo/tenant-metrics` | Combined dashboard payload (metrics, stores, activity) |
| `GET` | `/api/demo/stores` | List of tenant storefronts |
| `GET` | `/api/demo/orders` | Recent orders across tenants |
| `GET` | `/api/demo/activity` | Activity feed rows |

All four return `{ ok: true, source: "supabase" \| "fallback", … }` — the UI
renders identically in both modes.

### Admin (gated by `ADMIN_API_KEY` header in production)
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/provision` | Create a new tenant (schema + port + API key) |
| `GET` | `/api/admin/tenants` | List tenants |
| `GET` | `/api/admin/tenants/:id` | Get one tenant |
| `POST` | `/api/admin/tenants/:id/suspend` | Suspend a tenant |
| `POST` | `/api/admin/tenants/:id/delete` | Delete a tenant |
| `POST` | `/api/admin/vercel-deploy` | Deploy a tenant storefront to Vercel |

### Tenant assets
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/assets/upload/banner` | Upload banner → returns absolute CDN URL |
| `POST` | `/api/assets/upload/hero` | Upload hero image |
| `POST` | `/api/assets/upload/product` | Upload product image |
| `POST` | `/api/assets/upload/icon` | Upload custom icon |
| `GET` | `/api/assets?folder=banners` | List tenant assets |
| `DELETE` | `/api/assets/:key` | Delete an asset |
| `GET` / `PUT` | `/api/storefront/config` | Read / update storefront config |

### AI (Gemini)
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/ai/copy` | Generate product copy (title, description, tags) |
| `POST` | `/api/ai/visual` | Generate product imagery from a prompt |
| `POST` | `/api/ai/pricing` | Recommend a price + rationale |
| `POST` | `/api/ai/sort` | Classify & clean an incoming dataset row |

---

## 🗃️ Database schema (BuildFest demo)

`supabase/init.sql` provisions a single shared schema with these tables:

```
tenants  ─── products ─── orders
   │           │            │
   │           ├── pricing_snapshots
   │           ├── recommendations
   │           └── demand_forecasts
   └── audit_events
```

Plus two convenience views the dashboard reads from:

- `v_tenant_metrics`  — per-tenant product count, total stock, total sales, views
- `v_recent_orders`   — last N orders joined with the tenant

The seed inserts **3 tenants, 9 products, 8 orders, 3 pricing snapshots,
9 forecasts, and 4 audit events** so the dashboard is not empty on first load.

---

## 🌐 Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Add the env vars from the Quick Start section (Production + Preview).
4. Deploy. `vercel.json` wires everything up:
   - `/api/*` → `api/index.ts` (Express as a serverless function)
   - everything else → static SPA from `dist/`
5. (Optional) Provision a Supabase project and run `supabase/init.sql`.

No Docker, no NGINX, no S3 required for the BuildFest demo — those are wired in
[`docker-compose.yml`](./docker-compose.yml) for the full multi-tenant production
build described in [`MULTI_TENANT_ARCHITECTURE.md`](./MULTI_TENANT_ARCHITECTURE.md).

---

## 🧰 NPM scripts

| Script | What it does |
|---|---|
| `npm run dev` | tsx + Vite together; Express on `:3000` |
| `npm run build` | esbuild → `dist/server.cjs`, Vite → `dist/assets/*` |
| `npm start` | `node dist/server.cjs` (production) |
| `npm run preview` | Serve the built `dist/` via Vite preview |

---

## 🐛 Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| AI endpoints return 500 | Missing/invalid `GEMINI_API_KEY` | Get a key at https://aistudio.google.com/apikey — note: the key must start with `AIzaSy`, not `AQ.Ab8…` (that's the old Generative Language API format) |
| Dashboard shows empty tables | `DATABASE_URL` not set | Either set the Supabase pooler URL **or** leave it unset — the UI will fall back to `src/data.ts` |
| `/api/admin/*` returns 401 in prod | `ADMIN_API_KEY` missing or wrong header | Set in Vercel env; pass as `x-admin-key` header |
| Vercel deploy 403 | `VERCEL_TOKEN` missing or lacks project-create scope | Generate at https://vercel.com/account/tokens with **Full Account** scope |
| `EADDRINUSE: 3000` on `npm run dev` | Stale node/tsx process from a previous run | `Get-Process node,tsx,esbuild \| Stop-Process -Force` then retry |
| Port collisions on Windows | IPv6 vs IPv4 resolution | Always use `http://127.0.0.1:3000`, not `localhost` |

---

## 📚 Documentation map

- [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) — what shipped in phases 1–3
- [`MULTI_TENANT_ARCHITECTURE.md`](./MULTI_TENANT_ARCHITECTURE.md) — full multi-tenant design
- [`DASHBOARD_REFACTOR_SUMMARY.md`](./DASHBOARD_REFACTOR_SUMMARY.md) — UI refactor notes
- [`DASHBOARD_DESIGN_SYSTEM.md`](./DASHBOARD_DESIGN_SYSTEM.md) — design tokens
- [`DASHBOARD_CODE_EXAMPLES.md`](./DASHBOARD_CODE_EXAMPLES.md) — copy-paste snippets
- [`DASHBOARD_VISUAL_REFERENCE.md`](./DASHBOARD_VISUAL_REFERENCE.md) — layout screenshots
- [`DASHBOARD_README.md`](./DASHBOARD_README.md) — per-component behaviour
- [`DASHBOARD_MIGRATION_GUIDE.md`](./DASHBOARD_MIGRATION_GUIDE.md) — upgrade notes
- [`supabase/init.sql`](./supabase/init.sql) — demo schema + seed data

---

## 🤝 Contributing

1. Fork the repo & create a feature branch (`git checkout -b feat/your-thing`)
2. Keep the existing module boundaries: `src/components/*` for UI, `src/server/*` for the API
3. Run `npm run build` before opening a PR — type errors break the Vercel deploy
4. For AI prompt changes, update the response-schema in `server.ts` **and** the
   `ALLOWED_CATEGORIES` whitelist — the storefront filters by exact match

---

## 📝 License

MIT © 2026 AI Cyber Monkey
