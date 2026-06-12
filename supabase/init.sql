-- =============================================================================
-- AI Cyber Monkey SME Dashboard — Supabase Demo Schema
-- =============================================================================
-- Where to run this:
--   1. Log into https://supabase.com/dashboard
--   2. Create a new project (region: singapore for BD latency, free tier OK)
--   3. Project Settings → Database → Connection string → copy the
--      "Transaction pooler" URL (port 6543) — that's the DATABASE_URL
--   4. SQL Editor → New query → paste this file → Run
--   5. Project Settings → API → copy "Project URL" + "anon public" key
--   6. Paste both into .env.local as SUPABASE_URL + SUPABASE_ANON_KEY
--      (and the pooled URL as DATABASE_URL — your existing pg.Pool keeps working)
--
-- Why this schema and not the existing tenant_${uuid}.* setup:
--   This is a DEMO. One project, one shared schema, RLS off. The existing
--   multi-tenant code in src/server/db.ts is for the real product; for the
--   BuildFest pitch we want judges to click into a Supabase dashboard and
--   see live rows. Keep both, isolate by `tenant_id` column.
-- =============================================================================

-- Drop in reverse dependency order so re-runs are clean
DROP TABLE IF EXISTS public.audit_events      CASCADE;
DROP TABLE IF EXISTS public.demand_forecasts  CASCADE;
DROP TABLE IF EXISTS public.recommendations   CASCADE;
DROP TABLE IF EXISTS public.pricing_snapshots CASCADE;
DROP TABLE IF EXISTS public.orders            CASCADE;
DROP TABLE IF EXISTS public.products          CASCADE;
DROP TABLE IF EXISTS public.tenants           CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Tenants (the demo "SME" customers using the platform)
-- -----------------------------------------------------------------------------
CREATE TABLE public.tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          varchar(64)  UNIQUE NOT NULL,           -- used in URL paths
  name          varchar(120) NOT NULL,
  owner_email   varchar(160) NOT NULL,
  plan          varchar(20)  NOT NULL DEFAULT 'free',   -- free | pro | enterprise
  status        varchar(20)  NOT NULL DEFAULT 'active',-- active | suspended
  backend_port  int          UNIQUE,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Products (the universal catalog a tenant sells)
-- -----------------------------------------------------------------------------
CREATE TABLE public.products (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sku                  varchar(64),
  name                 varchar(200) NOT NULL,
  category             varchar(80),
  description          text,
  image_url            text,
  price                numeric(10,2) NOT NULL CHECK (price >= 0),
  msrp                 numeric(10,2),
  buying_price         numeric(10,2),
  discount_percentage  numeric(5,2)  DEFAULT 0,
  stock_count          int           DEFAULT 0,
  sales_count          int           DEFAULT 0,
  views_count          int           DEFAULT 0,
  is_active            boolean       NOT NULL DEFAULT true,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_cat    ON public.products(tenant_id, category);

-- -----------------------------------------------------------------------------
-- 3. Orders (the "no real checkout" demo event log — just enough to show flow)
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id   uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  customer_email varchar(160),
  total         numeric(10,2) NOT NULL,
  status        varchar(20)  NOT NULL DEFAULT 'pending', -- pending|paid|shipped|cancelled
  notes         text,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_tenant_time ON public.orders(tenant_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Pricing snapshots (drives the Demand-forecasting + Dynamic-pricing views)
--    Every time the PricingAnalyzer runs we store a row. Over time this is
--    the training data for the Prophet / XGBoost model called out in the PDF.
-- -----------------------------------------------------------------------------
CREATE TABLE public.pricing_snapshots (
  id                 bigserial PRIMARY KEY,
  tenant_id          uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id         uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  competitor_avg     numeric(10,2),
  recommended_price  numeric(10,2),
  promotional_price  numeric(10,2),
  elasticity         numeric(6,4),          -- % change in demand per 1% price change
  market_positioning varchar(40),           -- premium | mid | value
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pricing_tenant_time
  ON public.pricing_snapshots(tenant_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. Recommendations (the "Similar products" + "Customers also bought" feed)
--    Pairwise scores computed offline; the storefront reads the top-N per product.
-- -----------------------------------------------------------------------------
CREATE TABLE public.recommendations (
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  target_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  score          numeric(5,4) NOT NULL CHECK (score BETWEEN 0 AND 1),
  reason         varchar(40),              -- category | co_purchase | embedding
  computed_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, target_id)
);
CREATE INDEX idx_reco_source_score
  ON public.recommendations(source_id, score DESC);

-- -----------------------------------------------------------------------------
-- 6. Demand forecasts (the Prophet/XGBoost output table)
--    One row per product per forecast horizon; dashboard reads the latest.
-- -----------------------------------------------------------------------------
CREATE TABLE public.demand_forecasts (
  id              bigserial PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  horizon_days    int  NOT NULL,           -- 7, 14, 30
  predicted_units int  NOT NULL,
  lower_bound     int,
  upper_bound     int,
  model           varchar(40) NOT NULL,    -- prophet | xgboost | moving_avg
  generated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_forecast_product_time
  ON public.demand_forecasts(product_id, generated_at DESC);

-- -----------------------------------------------------------------------------
-- 7. Audit events (any state change worth showing in the ActivityFeed)
-- -----------------------------------------------------------------------------
CREATE TABLE public.audit_events (
  id          bigserial PRIMARY KEY,
  tenant_id   uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  actor       varchar(40),                 -- system | admin | tenant_owner
  action      varchar(60) NOT NULL,        -- product.created | price.updated ...
  entity      varchar(40),                 -- product | order | pricing
  entity_id   uuid,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant_time
  ON public.audit_events(tenant_id, created_at DESC);

-- =============================================================================
-- Seed data — three demo tenants so the dashboard isn't empty on first load
-- =============================================================================
INSERT INTO public.tenants (slug, name, owner_email, plan, backend_port) VALUES
  ('aurora',  'Aurora Tech',     'owner@aurora.test',  'pro',        5101),
  ('kobutor', 'Kobutor Mobile',  'hello@kobutor.test', 'free',       5102),
  ('sahara',  'Sahara Lifestyle','team@sahara.test',   'enterprise', 5103);

-- Products: ~6 per tenant, mix of categories, stock + sales populated so the
-- dashboard metrics aren't all zero. Prices are in USD for the demo.
INSERT INTO public.products
  (tenant_id, sku, name, category, price, msrp, buying_price, stock_count, sales_count, views_count, description)
VALUES
  -- Aurora Tech
  ((SELECT id FROM public.tenants WHERE slug='aurora'),
   'AUR-GPU-01','Quantum Series GPU v4','Graphics Cards',
   899.00, 1099.00, 620.00, 14, 38, 1240, 'Flagship 24GB GDDR7 graphics card, silent cooling block.'),
  ((SELECT id FROM public.tenants WHERE slug='aurora'),
   'AUR-KB-02','Holographic Glass Keyboard','Peripherals',
   219.00, 269.00, 130.00, 32, 71, 2104, 'Touch-sensitive glass keycaps with per-key RGB refraction.'),
  ((SELECT id FROM public.tenants WHERE slug='aurora'),
   'AUR-MN-03','4K Holographic Monitor','Displays',
   649.00, 799.00, 410.00, 9, 22, 980, '27-inch 4K holographic display, 144Hz, low-blue-light.'),
  -- Kobutor Mobile
  ((SELECT id FROM public.tenants WHERE slug='kobutor'),
   'KOB-PH-01','Pixel 9 Pro','Smartphones',
   1099.00, 1199.00, 820.00, 41, 156, 5310, '256GB, titanium frame, 5x optical zoom.'),
  ((SELECT id FROM public.tenants WHERE slug='kobutor'),
   'KOB-BUDS-02','AirSilence Pro Buds','Audio',
   149.00, 199.00, 75.00, 88, 311, 7720, 'Active noise-cancelling earbuds, 36h battery.'),
  ((SELECT id FROM public.tenants WHERE slug='kobutor'),
   'KOB-CHG-03','MagSpeed 100W Charger','Accessories',
   39.00, 59.00, 14.00, 200, 612, 4011, 'GaN-based 100W USB-C charger, 3 ports.'),
  -- Sahara Lifestyle
  ((SELECT id FROM public.tenants WHERE slug='sahara'),
   'SAH-BAG-01','Italian Leather Tote','Bags',
   189.00, 249.00, 80.00, 22, 54, 1832, 'Full-grain Italian leather, RFID-shielded pocket.'),
  ((SELECT id FROM public.tenants WHERE slug='sahara'),
   'SAH-WAT-02','Solar Pilot Watch','Watches',
   279.00, 349.00, 130.00, 18, 29, 940, 'Solar-powered analog with sapphire crystal.'),
  ((SELECT id FROM public.tenants WHERE slug='sahara'),
   'SAH-SHADES-03','Aviator Polarized','Eyewear',
   89.00, 129.00, 28.00, 65, 188, 2670, 'Polarized UV400 lenses with titanium frame.');

-- Orders: spread across the last 30 days so charts have shape
INSERT INTO public.orders (tenant_id, customer_email, total, status, created_at) VALUES
  ((SELECT id FROM public.tenants WHERE slug='aurora'),
   'sarah.k@example.com',  899.00, 'shipped', now() - interval '2 days'),
  ((SELECT id FROM public.tenants WHERE slug='aurora'),
   'david.k@example.com',  219.00, 'shipped', now() - interval '5 days'),
  ((SELECT id FROM public.tenants WHERE slug='aurora'),
   'greg.p@example.com',   649.00, 'paid',    now() - interval '7 days'),
  ((SELECT id FROM public.tenants WHERE slug='kobutor'),
   'aisha.r@example.com', 1099.00, 'shipped', now() - interval '1 day'),
  ((SELECT id FROM public.tenants WHERE slug='kobutor'),
   'maruf.h@example.com',  149.00, 'shipped', now() - interval '3 days'),
  ((SELECT id FROM public.tenants WHERE slug='kobutor'),
   'eva.t@example.com',     39.00, 'pending', now() - interval '4 hours'),
  ((SELECT id FROM public.tenants WHERE slug='sahara'),
   'nazia.s@example.com',  189.00, 'shipped', now() - interval '6 days'),
  ((SELECT id FROM public.tenants WHERE slug='sahara'),
   'tahmid.i@example.com', 279.00, 'paid',    now() - interval '9 days');

-- Pricing snapshots: one recent row per Aurora product (drives the
-- "Pricing competition" widget so the chart isn't empty on first open)
INSERT INTO public.pricing_snapshots
  (tenant_id, product_id, competitor_avg, recommended_price, promotional_price, elasticity, market_positioning)
SELECT p.tenant_id, p.id,
       p.price * 0.95,
       p.price * 1.05,
       p.price * 0.92,
       1.20,
       'premium'
FROM public.products p
WHERE p.tenant_id = (SELECT id FROM public.tenants WHERE slug='aurora');

-- Demand forecasts: 14-day horizon for every product, moving-avg baseline
INSERT INTO public.demand_forecasts
  (tenant_id, product_id, horizon_days, predicted_units, lower_bound, upper_bound, model)
SELECT p.tenant_id, p.id, 14,
       GREATEST(1, p.sales_count / 4),            -- baseline
       GREATEST(1, p.sales_count / 4 * 0.7),
       (p.sales_count / 4) * 1.4,
       'moving_avg'
FROM public.products p;

-- Audit events: a few headline events for the ActivityFeed
INSERT INTO public.audit_events (tenant_id, actor, action, entity, payload) VALUES
  ((SELECT id FROM public.tenants WHERE slug='aurora'),  'system',  'product.created',  'product', '{"name":"Quantum Series GPU v4"}'::jsonb),
  ((SELECT id FROM public.tenants WHERE slug='aurora'),  'admin',   'price.updated',    'product', '{"sku":"AUR-GPU-01","from":899,"to":879}'::jsonb),
  ((SELECT id FROM public.tenants WHERE slug='kobutor'), 'admin',   'inventory.update', 'product', '{"sku":"KOB-PH-01","delta":12}'::jsonb),
  ((SELECT id FROM public.tenants WHERE slug='sahara'),  'system',  'order.shipped',    'order',   '{"total":189}'::jsonb);

-- =============================================================================
-- A couple of convenience views the demo dashboard can hit directly
-- =============================================================================
CREATE OR REPLACE VIEW public.v_tenant_metrics AS
SELECT
  t.id            AS tenant_id,
  t.slug,
  t.name,
  t.plan,
  COUNT(DISTINCT p.id)  AS product_count,
  COALESCE(SUM(p.stock_count), 0)  AS total_stock,
  COALESCE(SUM(p.sales_count), 0)  AS total_sales,
  COALESCE(SUM(p.views_count), 0)  AS total_views,
  COALESCE(AVG(p.price), 0)        AS avg_price
FROM public.tenants t
LEFT JOIN public.products p ON p.tenant_id = t.id
GROUP BY t.id, t.slug, t.name, t.plan;

CREATE OR REPLACE VIEW public.v_recent_orders AS
SELECT
  o.id,
  t.slug            AS tenant_slug,
  t.name            AS tenant_name,
  o.customer_email,
  o.total,
  o.status,
  o.created_at
FROM public.orders o
JOIN public.tenants t ON t.id = o.tenant_id
ORDER BY o.created_at DESC;

-- =============================================================================
-- Done. Open Table Editor in the Supabase sidebar — you should see
-- 3 tenants, 9 products, 8 orders, 3 pricing snapshots, 9 forecasts, 4 events.
-- =============================================================================
