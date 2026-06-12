-- =============================================================================
-- Migration 001: action_recommendations
-- Closed-loop inbox for the AI Engine. Each row is a single, prioritized,
-- typed action the merchant can Accept or Dismiss. The existing
-- public.recommendations table is the pairwise similar-products feed — we
-- keep it untouched and add a new table for the action inbox.
--
-- Idempotent: safe to re-run. Uses IF NOT EXISTS + ON CONFLICT logic only at
-- the CREATE TABLE level. No data migrations — the run() endpoint will seed
-- the inbox on first invocation.
-- =============================================================================

-- Drop in reverse dependency order so re-runs are clean
DROP TABLE IF EXISTS public.action_recommendations CASCADE;

CREATE TABLE public.action_recommendations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id)   ON DELETE CASCADE,
  product_id        uuid        NOT NULL REFERENCES public.products(id)  ON DELETE CASCADE,

  -- 'reorder' | 'reprice' | 'promo' | 'clearance' | 'hold'
  type              varchar(20) NOT NULL,
  -- 1 (urgent) → 5 (nice-to-have). Lower = more urgent.
  priority          smallint    NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),

  -- Quantified upside the merchant captures if they act.
  -- For reprice/promo: incremental revenue over 30 days.
  -- For reorder:     lost-sale avoidance over 30 days.
  -- For clearance:   inventory cash recovery.
  expected_impact   numeric(12,2) NOT NULL DEFAULT 0,
  -- 0..1 — model confidence, lower of forecaster/pricing confidence.
  confidence        numeric(4,3)  NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),

  -- Short human bullets explaining the action in plain language.
  rationale         text[]        NOT NULL DEFAULT '{}',

  -- 'open' | 'accepted' | 'dismissed' | 'applied'
  status            varchar(20)   NOT NULL DEFAULT 'open',
  -- Which engine produced this: 'forecast' | 'pricing' | 'joint'
  source_model      varchar(40)   NOT NULL DEFAULT 'joint',

  -- Raw inputs captured at generation time so we can explain the decision
  -- after the fact. {forecast_row, pricing_row, current_product, computed_at}.
  payload           jsonb         NOT NULL DEFAULT '{}'::jsonb,

  created_at        timestamptz   NOT NULL DEFAULT now(),
  resolved_at       timestamptz   NULL,

  -- Constraint: one OPEN action of the same type per product at a time.
  -- Resolved rows (accepted/dismissed/applied) are kept for the audit log
  -- and don't conflict with new opens.
  CONSTRAINT chk_status CHECK (status IN ('open','accepted','dismissed','applied')),
  CONSTRAINT chk_type   CHECK (type     IN ('reorder','reprice','promo','clearance','hold'))
);

-- Inbox query: WHERE status='open' ORDER BY priority, created_at
CREATE INDEX idx_action_rec_inbox
  ON public.action_recommendations(status, priority, created_at DESC);

-- Per-product history (for the activity timeline on the product detail)
CREATE INDEX idx_action_rec_product
  ON public.action_recommendations(product_id, status, created_at DESC);

-- Per-tenant list (for the storefront dashboard)
CREATE INDEX idx_action_rec_tenant
  ON public.action_recommendations(tenant_id, status, created_at DESC);

-- Partial unique: only one OPEN row per (tenant, product, type). Lets the
-- run() endpoint use ON CONFLICT DO UPDATE to upsert fresh recommendations
-- without leaving stale duplicates.
CREATE UNIQUE INDEX uq_action_rec_open
  ON public.action_recommendations(tenant_id, product_id, type)
  WHERE status = 'open';

-- RLS off (matches the rest of the demo schema). Comment this out and
-- enable RLS in a real deployment.
-- ALTER TABLE public.action_recommendations ENABLE ROW LEVEL SECURITY;
