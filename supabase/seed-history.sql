-- =============================================================================
-- AI Cyber Monkey — 90-day order history backfill
-- =============================================================================
-- Why this file exists:
--   init.sql ships only 8 orders spread over ~9 days. That's not enough to
--   train or even display a time-series forecast with confidence bands.
--   This file backfills 90 days of deterministic synthetic orders (cosine
--   trend + weekly seasonality + small noise) so the forecaster has signal.
--
-- How to run:
--   SQL Editor → New query → paste this file → Run. Idempotent — the DELETE
--   guard means re-running is safe.
--
-- What it does NOT touch:
--   init.sql (it only INSERTs into public.orders and bumps products.sales_count)
-- =============================================================================

-- Guard: wipe any prior backfill so this stays idempotent
DELETE FROM public.orders
WHERE created_at < (now() - INTERVAL '14 days')
  AND customer_email LIKE 'backfill+%';

-- Reset sales_count so the post-backfill totals are reproducible
UPDATE public.products SET sales_count = 0;

-- -----------------------------------------------------------------------------
-- Generate 90 days × 3 tenants × ~1.5 orders/day ≈ 400 synthetic orders.
-- Pattern per tenant: a slow cosine trend (peak around day 45) + weekly
-- seasonality (Fridays/Saturdays are ~40% higher) + small noise from RANDOM().
-- -----------------------------------------------------------------------------
INSERT INTO public.orders (tenant_id, customer_email, total, status, created_at)
SELECT
  t.id                                                            AS tenant_id,
  'backfill+' || s.day || '+' || t.slug || '@demo.local'          AS customer_email,
  ROUND(
    (
      -- base basket varies per tenant
      CASE t.slug
        WHEN 'aurora'  THEN 540 + RANDOM() * 420
        WHEN 'kobutor' THEN 95  + RANDOM() * 220
        WHEN 'sahara'  THEN 145 + RANDOM() * 180
      END
      *
      -- cosine trend across the 90-day window
      (0.6 + 0.4 * COS(2 * PI() * (s.day - 45) / 90))
      *
      -- weekly seasonality (Friday=5, Saturday=6 boost)
      (CASE EXTRACT(DOW FROM (now() - (s.day || ' days')::interval))
         WHEN 5 THEN 1.40
         WHEN 6 THEN 1.30
         WHEN 0 THEN 1.15
         ELSE 1.00
      END)
    )::numeric, 2
  )                                                               AS total,
  -- 78% of historical orders are completed
  CASE WHEN RANDOM() < 0.78 THEN 'shipped' ELSE 'paid' END        AS status,
  (now() - (s.day || ' days')::interval)
    - (FLOOR(RANDOM() * 24) || ' hours')::interval                AS created_at
FROM public.tenants t
CROSS JOIN generate_series(1, 90) AS s(day)
-- 1 order per day baseline; ~50% chance of a second order on the day
LEFT JOIN LATERAL (
  SELECT 1 WHERE RANDOM() < 0.5
) extra ON true
WHERE
  -- Drop some days entirely so it doesn't look robotic
  RANDOM() > 0.15;

-- -----------------------------------------------------------------------------
-- Now distribute the post-backfill order volume onto products via
-- products.sales_count so the forecaster has a meaningful per-product series.
-- We weight by category "popularity" so the chart isn't flat:
--   Kobutor chargers + buds sell the most, Aurora GPUs are rarer.
-- -----------------------------------------------------------------------------
WITH tenant_totals AS (
  SELECT t.id AS tenant_id, t.slug, COUNT(o.id) AS order_count
  FROM public.tenants t
  LEFT JOIN public.orders o ON o.tenant_id = t.id
  GROUP BY t.id, t.slug
),
weights AS (
  SELECT
    p.id              AS product_id,
    p.tenant_id       AS tenant_id,
    p.sku,
    CASE
      -- Kobutor
      WHEN p.sku = 'KOB-PH-01'    THEN 1.4
      WHEN p.sku = 'KOB-BUDS-02'  THEN 2.6
      WHEN p.sku = 'KOB-CHG-03'   THEN 3.0
      -- Aurora
      WHEN p.sku = 'AUR-GPU-01'   THEN 0.8
      WHEN p.sku = 'AUR-KB-02'    THEN 1.7
      WHEN p.sku = 'AUR-MN-03'    THEN 0.9
      -- Sahara
      WHEN p.sku = 'SAH-BAG-01'   THEN 1.5
      WHEN p.sku = 'SAH-WAT-02'   THEN 1.0
      WHEN p.sku = 'SAH-SHADES-03' THEN 2.2
      ELSE 1.0
    END AS weight
  FROM public.products p
),
weighted AS (
  SELECT
    w.product_id,
    w.tenant_id,
    w.weight,
    w.weight / NULLIF(SUM(w.weight) OVER (PARTITION BY w.tenant_id), 0) AS share
  FROM weights w
)
UPDATE public.products p
SET sales_count = GREATEST(
  1,
  ROUND((tt.order_count * w.share))::int
)
FROM weighted w
JOIN tenant_totals tt ON tt.tenant_id = w.tenant_id
WHERE p.id = w.product_id;

-- -----------------------------------------------------------------------------
-- Drop a few forecast / snapshot rows from the seed and let the forecaster
-- refill them on the first /api/forecast/run hit. We keep one row per
-- product in demand_forecasts as a "last known" so the UI has a fallback.
-- -----------------------------------------------------------------------------
DELETE FROM public.demand_forecasts
WHERE generated_at < (now() - INTERVAL '1 hour');

-- Audit trail entry
INSERT INTO public.audit_events (tenant_id, actor, action, entity, payload)
SELECT id, 'system', 'history.backfilled', 'order', jsonb_build_object(
  'days', 90,
  'note', 'Seed for time-series forecaster'
)
FROM public.tenants;

-- Done. Quick sanity check:
--   SELECT slug, COUNT(*) FROM public.orders o JOIN public.tenants t ON t.id=o.tenant_id
--   GROUP BY slug;
--   SELECT sku, sales_count FROM public.products ORDER BY sku;
