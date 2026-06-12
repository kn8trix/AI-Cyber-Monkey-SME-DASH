// =============================================================================
// src/server/pricing-engine.ts
// Deterministic dynamic-pricing optimizer. No LLM.
// Used by /api/pricing/run to populate public.pricing_snapshots and feed
// the AI Strategist commentary layer.
// =============================================================================
//
// Inputs:
//   - products  (price, buying_price, stock_count, sales_count, views_count)
//   - pricing_snapshots history (for elasticity estimate)
//   - the latest forecast row per product (for stockout urgency)
//
// Output:
//   - recommendedPrice   the new suggested sell price
//   - promotionalPrice   a short-window deal price (~7% below recommended)
//   - priceIndex         (ourPrice - competitorAvg) / competitorAvg
//   - elasticityHint     historical demand sensitivity to price
//   - marketPositioning  premium | mid | value
//   - tacticalAction     raise_price | hold | lower_price | clearance
//   - confidenceScore    0..1 — higher when we have more data
// =============================================================================

import type { Pool, PoolClient } from 'pg';
import type { ForecastRow } from './forecasting';

export type TacticalAction = 'raise_price' | 'hold' | 'lower_price' | 'clearance';
export type MarketPositioning = 'premium' | 'mid' | 'value';

export interface PricingRow {
  product_id: string;
  tenant_id: string;
  sku: string | null;
  name: string;
  current_price: number;
  buying_price: number;
  competitor_avg: number;
  price_index: number;             // signed, -1 = half the market, +0.3 = 30% over
  stockout_urgency: number;        // 0..1
  recommended_price: number;
  promotional_price: number;
  elasticity_hint: number;         // historical price-sensitivity estimate
  market_positioning: MarketPositioning;
  tactical_action: TacticalAction;
  confidence_score: number;        // 0..1
  rationale: string[];             // short human-readable bullets for the UI
  model: 'cost_plus_market';
}

interface ProductRow {
  id: string;
  tenant_id: string;
  sku: string | null;
  name: string;
  price: number;
  buying_price: number;
  stock_count: number;
  sales_count: number;
  views_count: number;
}

interface SnapshotRow {
  product_id: string;
  competitor_avg: number | null;
  recommended_price: number | null;
  elasticity: number | null;
  created_at: string;
}

// Logistic (sigmoid) function — used to map a "days of stock left" deficit
// into a 0..1 urgency that smoothly decays as we move away from the cliff.
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Estimate elasticity from the last 5 pricing_snapshots. We don't have
 * explicit demand deltas here, so we use a simple proxy: if the recommended
 * price keeps rising while sales_count stays flat or grows, elasticity is
 * low (premium product). If recommended price rose but sales_count fell,
 * elasticity is high (commodity).
 *
 * Returns a signed number: positive = elastic (price-sensitive demand),
 *                          negative = inelastic (luxury / must-have).
 */
function estimateElasticity(snapshots: SnapshotRow[], product: ProductRow): number {
  if (snapshots.length < 2) {
    // Fall back to category heuristic. Premium SKUs tend to be inelastic.
    const premiumCats = ['Graphics Cards', 'Smartphones', 'Watches', 'Displays'];
    return premiumCats.includes(product.name) ? -0.8 : 1.1;
  }
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const priceDelta =
    (Number(last.recommended_price) || product.price) -
    (Number(first.recommended_price) || product.price);
  // We don't have unit-sales deltas in the snapshot, so we lean on
  // product.sales_count as a coarse proxy. This is good enough for the demo
  // and obviously documented; the production model would join on orders.
  const demandProxy = product.sales_count > 50 ? 'flat' : 'soft';
  if (Math.abs(priceDelta) < 0.01) return 1.0;
  if (priceDelta > 0 && demandProxy === 'flat') return -0.6;
  if (priceDelta > 0 && demandProxy === 'soft') return 1.4;
  if (priceDelta < 0 && demandProxy === 'flat') return -1.2;
  return 0.9;
}

export interface RunPricingOptions {
  /** Target gross margin. Default 0.40 (40%). */
  targetMargin?: number;
  /** Competitor index tolerance band. Default ±0.05. */
  priceTolerance?: number;
  /** Days-of-stock cliff that triggers the urgency sigmoid. */
  stockoutCliffDays?: number;
}

const DEFAULTS: Required<RunPricingOptions> = {
  targetMargin: 0.40,
  priceTolerance: 0.05,
  stockoutCliffDays: 7,
};

export async function runPricing(
  pool: Pool | PoolClient,
  forecasts: ForecastRow[] = [],
  opts: RunPricingOptions = {}
): Promise<PricingRow[]> {
  const { targetMargin, priceTolerance, stockoutCliffDays } = { ...DEFAULTS, ...opts };

  const productsRes = await pool.query<ProductRow>(
    `SELECT id, tenant_id, sku, name, price, buying_price,
            stock_count, sales_count, views_count
       FROM public.products
       WHERE is_active = true`
  );
  const products = productsRes.rows;
  if (products.length === 0) return [];

  // Pull the last 5 snapshots per product
  const snapsRes = await pool.query<SnapshotRow>(
    `SELECT product_id, competitor_avg, recommended_price,
            elasticity, created_at
       FROM (
         SELECT product_id, competitor_avg, recommended_price,
                elasticity, created_at,
                ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY created_at DESC) AS rn
           FROM public.pricing_snapshots
       ) s
       WHERE s.rn <= 5`
  );

  const snapsByProduct = new Map<string, SnapshotRow[]>();
  for (const s of snapsRes.rows) {
    if (!snapsByProduct.has(s.product_id)) snapsByProduct.set(s.product_id, []);
    snapsByProduct.get(s.product_id)!.push(s);
  }

  // Forecast lookup
  const fcByProduct = new Map<string, ForecastRow>();
  for (const f of forecasts) fcByProduct.set(f.product_id, f);

  const rows: PricingRow[] = [];
  for (const product of products) {
    const cost = Number(product.buying_price) || 0;
    const currentPrice = Number(product.price) || 0;

    // 1. Competitor benchmark. Use the latest snapshot's competitor_avg,
    //    else assume we're in line with the market.
    const snaps = snapsByProduct.get(product.id) ?? [];
    const lastSnap = snaps[0];
    const competitorAvg = lastSnap?.competitor_avg
      ? Number(lastSnap.competitor_avg)
      : currentPrice * 0.95;

    // 2. Price index — how far we are from the market average
    const priceIndex = competitorAvg > 0
      ? (currentPrice - competitorAvg) / competitorAvg
      : 0;

    // 3. Stockout urgency. Cliffs at 0 days of stock, smoothly decays.
    //    If we have a forecast, use days_until_stockout. Otherwise fall
    //    back to a stock-count-only heuristic.
    const fc = fcByProduct.get(product.id);
    const daysLeft = fc?.days_until_stockout
      ?? (product.stock_count / Math.max(0.1, (product.sales_count || 1) / 30));
    const stockoutUrgency = sigmoid((stockoutCliffDays - daysLeft) / stockoutCliffDays);

    // 4. Cost-plus margin anchor
    const costPlusPrice = cost > 0 ? cost * (1 + targetMargin) : currentPrice * 0.9;

    // 5. Market-pull: nudge our price toward the competitor band
    const marketAnchor =
      competitorAvg > 0 ? competitorAvg * (1 + priceTolerance) : currentPrice;

    // 6. Final recommended price = blend of the two anchors + stockout lift
    const blended = 0.55 * costPlusPrice + 0.45 * marketAnchor;
    const lift = stockoutUrgency * 0.08; // up to +8% if stockout is imminent
    let recommended = blended * (1 + lift);

    // 7. Elasticity nudge: if we're elastic, never push the price above
    //    the competitor by more than the tolerance band. If we're
    //    inelastic, allow up to +12% over the market.
    const elasticity = estimateElasticity(snaps, product);
    if (elasticity > 1.0 && priceIndex > priceTolerance) {
      recommended = Math.min(recommended, competitorAvg * (1 + priceTolerance));
    } else if (elasticity < 0 && priceIndex > 0.12) {
      recommended = Math.min(recommended, competitorAvg * 1.12);
    }

    // 8. Hard floor: never go below cost. We will eat margin but not money.
    if (cost > 0) recommended = Math.max(recommended, cost * 1.05);

    // 9. Market positioning classification
    let positioning: MarketPositioning = 'mid';
    if (priceIndex > 0.05) positioning = 'premium';
    else if (priceIndex < -0.05) positioning = 'value';

    // 10. Tactical action
    let action: TacticalAction = 'hold';
    if (stockoutUrgency > 0.6 && product.stock_count < 20) action = 'raise_price';
    else if (product.stock_count > 100 && elasticity > 0.5) action = 'lower_price';
    else if (product.stock_count > 200) action = 'clearance';
    else if (Math.abs(currentPrice - recommended) / Math.max(1, currentPrice) < 0.02) {
      action = 'hold';
    } else if (recommended > currentPrice * 1.02) action = 'raise_price';
    else if (recommended < currentPrice * 0.98) action = 'lower_price';

    // 11. Promotional price = recommended * 0.93, but never below cost
    const promotional = Math.max(cost * 1.02, recommended * 0.93);

    // 12. Confidence — more snapshots + more sales = more confidence
    const dataScore = Math.min(1, (snaps.length / 5) * 0.6 + Math.min(1, product.sales_count / 50) * 0.4);

    // 13. Rationale bullets for the UI
    const rationale: string[] = [];
    if (stockoutUrgency > 0.6) {
      rationale.push(`Stockout imminent in ${daysLeft.toFixed(1)} days → pricing power ↑`);
    } else if (product.stock_count > 100) {
      rationale.push(`High inventory (${product.stock_count} units) → markdown bias`);
    }
    if (priceIndex > 0.05) {
      rationale.push(`Currently ${(priceIndex * 100).toFixed(0)}% above market average`);
    } else if (priceIndex < -0.05) {
      rationale.push(`Currently ${Math.abs(priceIndex * 100).toFixed(0)}% below market average`);
    }
    if (cost > 0) {
      const margin = ((recommended - cost) / recommended) * 100;
      rationale.push(`Maintains ${margin.toFixed(0)}% gross margin at recommended price`);
    }
    if (elasticity > 1.0) rationale.push('Demand appears price-elastic in history');
    else if (elasticity < 0) rationale.push('Demand appears price-inelastic in history');

    rows.push({
      product_id: product.id,
      tenant_id: product.tenant_id,
      sku: product.sku,
      name: product.name,
      current_price: round2(currentPrice),
      buying_price: round2(cost),
      competitor_avg: round2(competitorAvg),
      price_index: Number(priceIndex.toFixed(3)),
      stockout_urgency: Number(stockoutUrgency.toFixed(3)),
      recommended_price: round2(recommended),
      promotional_price: round2(promotional),
      elasticity_hint: Number(elasticity.toFixed(2)),
      market_positioning: positioning,
      tactical_action: action,
      confidence_score: Number(dataScore.toFixed(2)),
      rationale,
      model: 'cost_plus_market',
    });
  }

  return rows;
}

/**
 * Persist one pricing_snapshots row per product so the AI Strategist and
 * the dashboard's pricing widget can read the latest run.
 */
export async function persistPricing(
  pool: Pool | PoolClient,
  rows: PricingRow[]
): Promise<void> {
  if (rows.length === 0) return;
  const doWork = async (c: PoolClient) => {
    await c.query('BEGIN');
    try {
      for (const r of rows) {
        await c.query(
          `INSERT INTO public.pricing_snapshots
            (tenant_id, product_id, competitor_avg, recommended_price,
             promotional_price, elasticity, market_positioning)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            r.tenant_id, r.product_id, r.competitor_avg,
            r.recommended_price, r.promotional_price,
            r.elasticity_hint, r.market_positioning,
          ]
        );
      }
      await c.query('COMMIT');
    } catch (err) {
      await c.query('ROLLBACK');
      throw err;
    }
  };

  if ('connect' in pool) {
    const c = await (pool as Pool).connect();
    try { await doWork(c); } finally { c.release(); }
  } else {
    await doWork(pool as PoolClient);
  }
}
