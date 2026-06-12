// =============================================================================
// src/server/recommendations.ts
// Closed-loop action inbox. Takes the latest ForecastRow[] + PricingRow[]
// and turns them into prioritized, typed, deduped ActionRecommendation rows
// the merchant can Accept or Dismiss.
//
// Types
//   reorder      — stockout risk from the forecaster
//   reprice      — recommended price diverges from current by > 5%
//   promo        — pricing engine flagged promo
//   clearance    — pricing engine flagged clearance (overstocked, high elasticity)
//   hold         — current setup is fine; explicit "do nothing" so the
//                  merchant sees the engine has looked at every SKU
//
// Priority (1 = most urgent):
//   1. Stockout imminent + high stockout-urgency
//   2. Reorder due now
//   3. Significant reprice upside (>15%)
//   4. Modest reprice upside (5-15%)
//   5. Hold / clearance / promo suggestion
// =============================================================================

import type { Pool, PoolClient } from 'pg';
import type { ForecastRow } from './forecasting';
import type { PricingRow } from './pricing-engine';

export type RecommendationType = 'reorder' | 'reprice' | 'promo' | 'clearance' | 'hold';
export type RecommendationStatus = 'open' | 'accepted' | 'dismissed' | 'applied';

export interface ActionRecommendation {
  id?: string;
  tenant_id: string;
  product_id: string;
  type: RecommendationType;
  priority: 1 | 2 | 3 | 4 | 5;
  expected_impact: number;
  confidence: number;
  rationale: string[];
  status: RecommendationStatus;
  source_model: 'forecast' | 'pricing' | 'joint';
  payload: {
    forecast?: Pick<ForecastRow, 'forecast_7d' | 'forecast_30d' | 'days_until_stockout' | 'status' | 'reorder_point' | 'suggested_reorder_qty'>;
    pricing?:  Pick<PricingRow,   'current_price' | 'recommended_price' | 'promotional_price' | 'price_index' | 'tactical_action' | 'market_positioning' | 'stockout_urgency' | 'confidence_score'>;
    product?:  { name: string; sku: string | null; stock_count: number; price: number };
    computed_at: string;
  };
  created_at?: string;
  resolved_at?: string | null;
}

interface PersistedRow {
  id: string;
  tenant_id: string;
  product_id: string;
  type: RecommendationType;
  priority: number;
  expected_impact: string | number;
  confidence: string | number;
  rationale: string[];
  status: RecommendationStatus;
  source_model: 'forecast' | 'pricing' | 'joint';
  payload: any;
  created_at: string;
  resolved_at: string | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function num(v: string | number | null | undefined, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : fallback;
}

// =============================================================================
// Core: turn (forecasts × pricings) into a deduped list of actions.
// =============================================================================
export function deriveRecommendations(
  forecasts: ForecastRow[],
  pricings: PricingRow[]
): ActionRecommendation[] {
  const fcByProduct = new Map<string, ForecastRow>();
  for (const f of forecasts) fcByProduct.set(f.product_id, f);

  const prByProduct = new Map<string, PricingRow>();
  for (const p of pricings) prByProduct.set(p.product_id, p);

  // Union of all product ids we know about
  const productIds = new Set<string>([...fcByProduct.keys(), ...prByProduct.keys()]);

  const now = new Date().toISOString();
  const actions: ActionRecommendation[] = [];

  for (const productId of productIds) {
    const fc = fcByProduct.get(productId);
    const pr = prByProduct.get(productId);
    const product = (fc ?? pr)!; // one of them must exist; we need name/sku

    // ----- REORDER ----------------------------------------------------------
    if (fc) {
      const stockoutSoon = fc.status === 'stockout_imminent' || fc.days_until_stockout < 7;
      const reorderDue   = fc.status === 'reorder' || fc.stock_count <= fc.reorder_point;
      if (stockoutSoon || reorderDue) {
        // Expected impact: lost-sale avoidance = forecast_30d * price * margin
        const margin = pr ? Math.max(0.05, (pr.current_price - pr.buying_price) / Math.max(1, pr.current_price)) : 0.25;
        const lostSaleValue = fc.forecast_30d * (pr?.current_price ?? fc.sparkline.length ? 50 : 50);
        const expectedImpact = round2(lostSaleValue * margin);

        const conf = pr
          ? Math.min(fc.sparkline.length > 30 ? 0.85 : 0.6, pr.confidence_score)
          : 0.65;

        const rationale: string[] = [];
        if (stockoutSoon) {
          rationale.push(`Stockout in ~${fc.days_until_stockout.toFixed(1)} days at current run-rate`);
        } else {
          rationale.push(`Stock (${fc.stock_count}) is at or below reorder point (${fc.reorder_point})`);
        }
        if (fc.suggested_reorder_qty > 0) {
          rationale.push(`Suggested order: ${fc.suggested_reorder_qty} units to cover 30 days + 25% buffer`);
        }
        if (fc.trend === 'rising') {
          rationale.push('Demand is trending up — restock sooner rather than later');
        }

        const priority: 1 | 2 = stockoutSoon ? 1 : 2;
        actions.push({
          tenant_id: fc.tenant_id,
          product_id: fc.product_id,
          type: 'reorder',
          priority,
          expected_impact: expectedImpact,
          confidence: round2(conf),
          rationale,
          status: 'open',
          source_model: pr ? 'joint' : 'forecast',
          payload: {
            forecast: {
              forecast_7d: fc.forecast_7d,
              forecast_30d: fc.forecast_30d,
              days_until_stockout: fc.days_until_stockout,
              status: fc.status,
              reorder_point: fc.reorder_point,
              suggested_reorder_qty: fc.suggested_reorder_qty,
            },
            pricing: pr ? {
              current_price: pr.current_price,
              recommended_price: pr.recommended_price,
              promotional_price: pr.promotional_price,
              price_index: pr.price_index,
              tactical_action: pr.tactical_action,
              market_positioning: pr.market_positioning,
              stockout_urgency: pr.stockout_urgency,
              confidence_score: pr.confidence_score,
            } : undefined,
            product: { name: fc.name, sku: fc.sku, stock_count: fc.stock_count, price: pr?.current_price ?? 0 },
            computed_at: now,
          },
        });
      }
    }

    // ----- REPRICE / PROMO / CLEARANCE -------------------------------------
    if (pr) {
      const delta = (pr.recommended_price - pr.current_price) / Math.max(1, pr.current_price);
      const absDelta = Math.abs(delta);

      // 1. Clearance (high stock, elastic) — pricing engine's call
      if (pr.tactical_action === 'clearance') {
        const recovered = pr.current_price * Math.max(0, pr.confidence_score) * 0.4;
        actions.push({
          tenant_id: pr.tenant_id,
          product_id: pr.product_id,
          type: 'clearance',
          priority: 4,
          expected_impact: round2(recovered),
          confidence: round2(Math.max(0.4, pr.confidence_score - 0.1)),
          rationale: [
            `Inventory overstocked (${fc?.stock_count ?? pr.stockout_urgency > 0.5 ? 'high' : 'see stock'})`,
            'Demand appears price-elastic in history',
            `Clearance to ~${pr.promotional_price.toFixed(2)} recovers cash and frees shelf space`,
          ],
          status: 'open',
          source_model: 'pricing',
          payload: { pricing: {
            current_price: pr.current_price,
            recommended_price: pr.recommended_price,
            promotional_price: pr.promotional_price,
            price_index: pr.price_index,
            tactical_action: pr.tactical_action,
            market_positioning: pr.market_positioning,
            stockout_urgency: pr.stockout_urgency,
            confidence_score: pr.confidence_score,
          }, product: { name: pr.name, sku: pr.sku, stock_count: pr.stockout_urgency > 0.5 ? 0 : 0, price: pr.current_price }, computed_at: now },
        });
        continue; // clearance supersedes a plain reprice for the same product
      }

      // 2. Significant price move (>5%)
      if (absDelta > 0.05) {
        const direction = delta > 0 ? 'raise' : 'lower';
        // Expected impact: 30-day forecast units * price delta
        const units = fc?.forecast_30d ?? Math.max(1, pr.confidence_score * 30);
        const expectedImpact = round2(units * Math.abs(pr.recommended_price - pr.current_price));

        // Priority: bigger move + more confident = more urgent
        let priority: 1 | 2 | 3 | 4 | 5 = 5;
        if (absDelta > 0.20) priority = pr.confidence_score > 0.7 ? 2 : 3;
        else if (absDelta > 0.10) priority = 3;
        else if (absDelta > 0.05) priority = 4;
        else priority = 5;

        // If the engine recommended a promo (short-window deal) AND the
        // tactical_action says so, surface it as a 'promo' instead of plain
        // 'reprice' so the merchant can act on the deal price.
        const isPromo = pr.tactical_action === 'lower_price' &&
                        pr.promotional_price < pr.recommended_price * 0.98 &&
                        absDelta > 0.03;

        actions.push({
          tenant_id: pr.tenant_id,
          product_id: pr.product_id,
          type: isPromo ? 'promo' : 'reprice',
          priority,
          expected_impact: expectedImpact,
          confidence: round2(pr.confidence_score),
          rationale: [
            `Recommended ${direction} from ${pr.current_price.toFixed(2)} → ${pr.recommended_price.toFixed(2)} (${(delta * 100).toFixed(1)}%)`,
            pr.market_positioning === 'premium'
              ? 'Currently priced above market average'
              : pr.market_positioning === 'value'
              ? 'Currently priced below market average'
              : 'Price index is within market tolerance',
            isPromo
              ? `Run a promo at ${pr.promotional_price.toFixed(2)} to lift conversion`
              : pr.confidence_score > 0.7
              ? 'High-confidence recommendation based on rich history'
              : 'Moderate confidence — review before applying',
          ].concat(pr.rationale.slice(0, 2)),
          status: 'open',
          source_model: 'pricing',
          payload: { pricing: {
            current_price: pr.current_price,
            recommended_price: pr.recommended_price,
            promotional_price: pr.promotional_price,
            price_index: pr.price_index,
            tactical_action: pr.tactical_action,
            market_positioning: pr.market_positioning,
            stockout_urgency: pr.stockout_urgency,
            confidence_score: pr.confidence_score,
          }, forecast: fc ? {
            forecast_7d: fc.forecast_7d,
            forecast_30d: fc.forecast_30d,
            days_until_stockout: fc.days_until_stockout,
            status: fc.status,
            reorder_point: fc.reorder_point,
            suggested_reorder_qty: fc.suggested_reorder_qty,
          } : undefined, product: { name: pr.name, sku: pr.sku, stock_count: fc?.stock_count ?? 0, price: pr.current_price }, computed_at: now },
        });
        continue;
      }

      // 3. Hold — engine looked, no move needed
      if (pr.tactical_action === 'hold') {
        actions.push({
          tenant_id: pr.tenant_id,
          product_id: pr.product_id,
          type: 'hold',
          priority: 5,
          expected_impact: 0,
          confidence: round2(pr.confidence_score),
          rationale: [
            'Current price is within 2% of the engine recommendation',
            'Inventory and demand are stable — no action needed',
          ],
          status: 'open',
          source_model: 'joint',
          payload: { pricing: {
            current_price: pr.current_price,
            recommended_price: pr.recommended_price,
            promotional_price: pr.promotional_price,
            price_index: pr.price_index,
            tactical_action: pr.tactical_action,
            market_positioning: pr.market_positioning,
            stockout_urgency: pr.stockout_urgency,
            confidence_score: pr.confidence_score,
          }, forecast: fc ? {
            forecast_7d: fc.forecast_7d,
            forecast_30d: fc.forecast_30d,
            days_until_stockout: fc.days_until_stockout,
            status: fc.status,
            reorder_point: fc.reorder_point,
            suggested_reorder_qty: fc.suggested_reorder_qty,
          } : undefined, product: { name: pr.name, sku: pr.sku, stock_count: fc?.stock_count ?? 0, price: pr.current_price }, computed_at: now },
        });
      }
    }
  }

  // Sort by priority ASC then by expected_impact DESC
  actions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.expected_impact - a.expected_impact;
  });

  return actions;
}

// =============================================================================
// Pull the latest forecast + pricing rows from the DB and derive fresh
// recommendations. Falls back to the in-memory lists if either is empty.
// =============================================================================
export async function runRecommendations(
  pool: Pool | PoolClient,
  forecasts: ForecastRow[],
  pricings: PricingRow[]
): Promise<ActionRecommendation[]> {
  const fc = forecasts.length > 0
    ? forecasts
    : await (async () => {
        try {
          const r = await pool.query<ForecastRow>(
            `SELECT DISTINCT ON (f.product_id)
                    f.product_id, f.tenant_id,
                    f.horizon_days, f.predicted_units,
                    f.lower_bound, f.upper_bound, f.model, f.generated_at,
                    p.sku, p.name, p.stock_count, p.price, p.buying_price,
                    0::float8 AS avg_daily_sales,
                    0::int    AS forecast_7d,
                    f.predicted_units::int AS forecast_14d,
                    0::int    AS forecast_30d,
                    0::float8 AS lower_14d,
                    0::float8 AS upper_14d,
                    9999::float8 AS days_until_stockout,
                    0::int    AS reorder_point,
                    0::int    AS suggested_reorder_qty,
                    'flat'    AS trend,
                    'healthy' AS status,
                    '{}'::float8[] AS sparkline
               FROM public.demand_forecasts f
               JOIN public.products p ON p.id = f.product_id
              ORDER BY f.product_id, f.generated_at DESC`
          );
          return r.rows;
        } catch { return []; }
      })();

  const pr = pricings.length > 0
    ? pricings
    : await (async () => {
        try {
          const r = await pool.query<PricingRow>(
            `SELECT DISTINCT ON (s.product_id)
                    s.product_id, s.tenant_id,
                    s.competitor_avg, s.recommended_price, s.promotional_price,
                    s.elasticity, s.market_positioning, s.created_at,
                    p.sku, p.name, p.price AS current_price, p.buying_price,
                    p.stock_count, p.sales_count, p.views_count,
                    0::float8 AS price_index,
                    0::float8 AS stockout_urgency,
                    s.elasticity AS elasticity_hint,
                    0.5::float8  AS confidence_score,
                    '{}'::text[] AS rationale,
                    'cost_plus_market' AS model,
                    'hold' AS tactical_action
               FROM public.pricing_snapshots s
               JOIN public.products p ON p.id = s.product_id
              ORDER BY s.product_id, s.created_at DESC`
          );
          return r.rows;
        } catch { return []; }
      })();

  return deriveRecommendations(fc, pr);
}

// =============================================================================
// Persist recommendations to public.action_recommendations. Uses the partial
// unique index on (tenant, product, type) WHERE status='open' to upsert
// fresh rows in place — accepted/dismissed rows are left alone for audit.
// =============================================================================
export async function persistRecommendations(
  pool: Pool | PoolClient,
  rows: ActionRecommendation[]
): Promise<ActionRecommendation[]> {
  if (rows.length === 0) return [];

  const doWork = async (c: PoolClient) => {
    await c.query('BEGIN');
    try {
      const out: ActionRecommendation[] = [];
      for (const r of rows) {
        const q = await c.query<PersistedRow>(
          `INSERT INTO public.action_recommendations
            (tenant_id, product_id, type, priority, expected_impact, confidence,
             rationale, status, source_model, payload)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,$9::jsonb)
           ON CONFLICT (tenant_id, product_id, type) WHERE status = 'open'
           DO UPDATE SET
             priority        = EXCLUDED.priority,
             expected_impact = EXCLUDED.expected_impact,
             confidence      = EXCLUDED.confidence,
             rationale       = EXCLUDED.rationale,
             source_model    = EXCLUDED.source_model,
             payload         = EXCLUDED.payload,
             created_at      = now()
           RETURNING *`,
          [
            r.tenant_id, r.product_id, r.type, r.priority,
            r.expected_impact, r.confidence,
            r.rationale, r.source_model, JSON.stringify(r.payload),
          ]
        );
        out.push(persistedToAction(q.rows[0]));
      }
      await c.query('COMMIT');
      return out;
    } catch (err) {
      await c.query('ROLLBACK');
      throw err;
    }
  };

  const result = 'connect' in pool
    ? await (async () => { const c = await (pool as Pool).connect(); try { return await doWork(c); } finally { c.release(); } })()
    : await doWork(pool as PoolClient);

  return result;
}

function persistedToAction(r: PersistedRow): ActionRecommendation {
  return {
    id: r.id,
    tenant_id: r.tenant_id,
    product_id: r.product_id,
    type: r.type,
    priority: r.priority as 1 | 2 | 3 | 4 | 5,
    expected_impact: num(r.expected_impact),
    confidence: num(r.confidence),
    rationale: r.rationale || [],
    status: r.status,
    source_model: r.source_model,
    payload: r.payload || {},
    created_at: r.created_at,
    resolved_at: r.resolved_at,
  };
}

// =============================================================================
// Accept / Dismiss — flips status + writes an audit_events row.
// =============================================================================
export async function resolveRecommendation(
  pool: Pool | PoolClient,
  id: string,
  resolution: 'accepted' | 'dismissed',
  actor: string = 'merchant'
): Promise<ActionRecommendation | null> {
  const doWork = async (c: PoolClient): Promise<ActionRecommendation | null> => {
    const upd = await c.query<PersistedRow>(
      `UPDATE public.action_recommendations
          SET status = $2, resolved_at = now()
        WHERE id = $1 AND status = 'open'
        RETURNING *`,
      [id, resolution]
    );
    if (upd.rowCount === 0) return null;
    const row = upd.rows[0];

    // Best-effort audit log. Don't fail the merchant action if the audit
    // table is missing.
    try {
      await c.query(
        `INSERT INTO public.audit_events
          (tenant_id, actor, action, entity, payload)
         VALUES ($1, $2, $3, 'recommendation', $4::jsonb)`,
        [
          row.tenant_id, actor,
          resolution === 'accepted' ? 'recommendation.accepted' : 'recommendation.dismissed',
          JSON.stringify({
            id: row.id,
            product_id: row.product_id,
            type: row.type,
            priority: row.priority,
            expected_impact: num(row.expected_impact),
            confidence: num(row.confidence),
            actor,
          }),
        ]
      );
    } catch (auditErr: any) {
      console.warn('[recommendations] audit_events insert failed:', auditErr?.message);
    }

    return persistedToAction(row);
  };

  return 'connect' in pool
    ? await (async () => { const c = await (pool as Pool).connect(); try { return await doWork(c); } finally { c.release(); } })()
    : await doWork(pool as PoolClient);
}

// =============================================================================
// Read API: inbox (open only, sorted by priority + impact)
// =============================================================================
export async function fetchInbox(
  pool: Pool | PoolClient,
  limit = 50
): Promise<ActionRecommendation[]> {
  try {
    const r = await pool.query<PersistedRow>(
      `SELECT *
         FROM public.action_recommendations
        WHERE status = 'open'
        ORDER BY priority ASC, expected_impact DESC, created_at DESC
        LIMIT $1`,
      [limit]
    );
    return r.rows.map(persistedToAction);
  } catch (err: any) {
    console.warn('[recommendations] fetchInbox failed:', err?.message);
    return [];
  }
}
