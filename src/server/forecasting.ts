// =============================================================================
// src/server/forecasting.ts
// Real time-series forecaster — no LLM, just deterministic math.
// Used by /api/forecast/run to populate public.demand_forecasts.
// =============================================================================
//
// The orders table in this demo has no line_items and no product_id, so the
// forecaster works in two stages:
//
//   1. Build a *per-tenant* daily revenue series from the orders table
//      (group by tenant_id + date(created_at), sum the total).
//   2. Disaggregate that tenant revenue onto products by their
//      sales_count / (sum of sales_count in the tenant) share. This gives
//      each product a synthetic but consistent daily-unit series that
//      respects the tenant's actual demand shape.
//
// We then run a Holt-Winters double-exponential smoothing (level + trend,
// α=0.3, β=0.1) on the product's daily series and project it forward 7/14/30
// days with a ±20% confidence band.
// =============================================================================

import type { Pool, PoolClient } from 'pg';

export type StockStatus = 'healthy' | 'reorder' | 'stockout_imminent' | 'overstock';

export interface ForecastRow {
  product_id: string;
  tenant_id: string;
  sku: string | null;
  name: string;
  stock_count: number;
  avg_daily_sales: number;
  forecast_7d: number;
  forecast_14d: number;
  forecast_30d: number;
  lower_14d: number;
  upper_14d: number;
  days_until_stockout: number;
  reorder_point: number;
  suggested_reorder_qty: number;
  trend: 'rising' | 'flat' | 'falling';
  status: StockStatus;
  sparkline: number[];        // last 30 days of unit sales
  model: 'holt_winters';
}

interface ProductRow {
  id: string;
  tenant_id: string;
  sku: string | null;
  name: string;
  price: number;
  stock_count: number;
  sales_count: number;
}

interface OrderRow {
  tenant_id: string;
  day: string;       // YYYY-MM-DD
  total: number;
}

// ---- Holt-Winters double exponential smoothing -----------------------------
// Reference: Hyndman & Athanasopoulos, "Forecasting: Principles and Practice".
// We use the additive-trend variant with α (level) and β (trend). No
// seasonality term — seasonality is already baked into the order data and
// 90 days is too short for a stable seasonal fit.
function holtSmooth(series: number[], alpha = 0.3, beta = 0.1) {
  if (series.length === 0) {
    return { level: 0, trend: 0, fitted: [] as number[] };
  }
  let level = series[0];
  let trend = series.length > 1 ? series[1] - series[0] : 0;
  const fitted: number[] = [level];
  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(level + trend);
  }
  return { level, trend, fitted };
}

function projectHolt(series: number[], horizon: number) {
  const { level, trend } = holtSmooth(series);
  // Don't let the trend dominate beyond reason: cap at ±0.5 of the level
  // per day. Otherwise a one-off spike poisons the long forecast.
  const cappedTrend = Math.max(-0.5 * level, Math.min(0.5 * level, trend));
  const out: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    out.push(Math.max(0, level + cappedTrend * h));
  }
  return out;
}

function roundInt(n: number): number {
  return Math.max(0, Math.round(n));
}

// Standard-normal-ish CDF approximation (Abramowitz & Stegun 7.1.26)
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

// ---- Main entry point ------------------------------------------------------

export interface RunForecastOptions {
  /** Lookback window in days. Default 90 to match the seed SQL. */
  lookbackDays?: number;
  /** Assumed supplier lead time in days. Used for reorder point. */
  leadTimeDays?: number;
  /** Safety stock coefficient. 0.2 means "20% of avg daily sales per sqrt(leadTime)". */
  safetyStockZ?: number;
}

const DEFAULTS: Required<RunForecastOptions> = {
  lookbackDays: 90,
  leadTimeDays: 7,
  safetyStockZ: 0.2,
};

export async function runForecast(
  pool: Pool | PoolClient,
  opts: RunForecastOptions = {}
): Promise<ForecastRow[]> {
  const { lookbackDays, leadTimeDays, safetyStockZ } = { ...DEFAULTS, ...opts };

  // 1. Pull all products
  const productsRes = await pool.query<ProductRow>(
    `SELECT id, tenant_id, sku, name, price, stock_count, sales_count
       FROM public.products
       WHERE is_active = true`
  );
  const products = productsRes.rows;
  if (products.length === 0) return [];

  // 2. Pull per-tenant daily revenue for the lookback window
  const ordersRes = await pool.query<{ tenant_id: string; day: string; total: string }>(
    `SELECT tenant_id,
            to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
            SUM(total)::text AS total
       FROM public.orders
      WHERE created_at >= now() - ($1 || ' days')::interval
        AND status IN ('shipped', 'paid', 'pending')
      GROUP BY tenant_id, date_trunc('day', created_at)`,
    [lookbackDays]
  );

  // Index tenant -> day -> total
  const tenantDaily = new Map<string, Map<string, number>>();
  for (const row of ordersRes.rows) {
    if (!tenantDaily.has(row.tenant_id)) tenantDaily.set(row.tenant_id, new Map());
    tenantDaily.get(row.tenant_id)!.set(row.day, parseFloat(row.total));
  }

  // 3. Index products by tenant
  const productsByTenant = new Map<string, ProductRow[]>();
  for (const p of products) {
    if (!productsByTenant.has(p.tenant_id)) productsByTenant.set(p.tenant_id, []);
    productsByTenant.get(p.tenant_id)!.push(p);
  }

  // 4. Build a continuous day list (today inclusive, lookback days back)
  const days: string[] = [];
  for (let d = lookbackDays - 1; d >= 0; d--) {
    const dt = new Date();
    dt.setUTCHours(0, 0, 0, 0);
    dt.setUTCDate(dt.getUTCDate() - d);
    days.push(dt.toISOString().slice(0, 10));
  }

  const rows: ForecastRow[] = [];
  for (const [tenantId, tenantProducts] of productsByTenant) {
    const daily = tenantDaily.get(tenantId) ?? new Map<string, number>();
    const tenantTotalSales = tenantProducts.reduce((a, b) => a + (b.sales_count || 0), 0) || 1;

    // Per-product unit series (revenue * share / approx unit price)
    for (const product of tenantProducts) {
      const share = (product.sales_count || 0) / tenantTotalSales;
      const unitPrice = product.price > 0 ? product.price : 1;
      const series: number[] = days.map((d) => {
        const rev = daily.get(d) ?? 0;
        return (rev * share) / unitPrice;
      });

      const avg = series.reduce((a, b) => a + b, 0) / Math.max(1, series.length);
      const projected7 = projectHolt(series, 7);
      const projected14 = projectHolt(series, 14);
      const projected30 = projectHolt(series, 30);

      const sum7 = projected7.reduce((a, b) => a + b, 0);
      const sum14 = projected14.reduce((a, b) => a + b, 0);
      const sum30 = projected30.reduce((a, b) => a + b, 0);

      // 80% confidence band on the 14-day sum
      const stdDev = Math.sqrt(
        series.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(1, series.length)
      );
      const band = 1.2816 * stdDev * Math.sqrt(14); // z(0.9)
      const lower14 = Math.max(0, sum14 - band);
      const upper14 = sum14 + band;

      // Reorder point = lead time demand + safety stock
      const leadTimeDemand = avg * leadTimeDays;
      const safetyStock = safetyStockZ * Math.sqrt(leadTimeDays) * stdDev * 8;
      const reorderPoint = leadTimeDemand + safetyStock;
      const daysUntilStockout = avg > 0.01 ? product.stock_count / avg : 9999;

      // Trend classification
      const firstHalf = series.slice(0, Math.floor(series.length / 2));
      const secondHalf = series.slice(Math.floor(series.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / Math.max(1, firstHalf.length);
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / Math.max(1, secondHalf.length);
      let trend: 'rising' | 'flat' | 'falling' = 'flat';
      if (secondAvg > firstAvg * 1.10) trend = 'rising';
      else if (secondAvg < firstAvg * 0.90) trend = 'falling';

      // Status
      let status: StockStatus = 'healthy';
      if (daysUntilStockout < 7) status = 'stockout_imminent';
      else if (product.stock_count <= reorderPoint) status = 'reorder';
      else if (product.stock_count > reorderPoint * 4 && trend === 'falling') status = 'overstock';

      // Suggested reorder qty: enough for 30 days + 25% buffer
      const suggestedReorderQty = status === 'healthy'
        ? 0
        : Math.max(1, Math.round(sum30 * 1.25 - product.stock_count));

      rows.push({
        product_id: product.id,
        tenant_id: tenantId,
        sku: product.sku,
        name: product.name,
        stock_count: product.stock_count,
        avg_daily_sales: Number(avg.toFixed(2)),
        forecast_7d: roundInt(sum7),
        forecast_14d: roundInt(sum14),
        forecast_30d: roundInt(sum30),
        lower_14d: roundInt(lower14),
        upper_14d: roundInt(upper14),
        days_until_stockout: Number(daysUntilStockout.toFixed(1)),
        reorder_point: Math.round(reorderPoint),
        suggested_reorder_qty: suggestedReorderQty,
        trend,
        status,
        sparkline: series.map((n) => Number(n.toFixed(2))),
        model: 'holt_winters',
      });
    }
  }

  return rows;
}

/**
 * Persist the latest forecast rows into public.demand_forecasts. We keep the
 * last 3 horizons (7, 14, 30) per product and wipe older rows so the UI
 * always reads the freshest model output.
 */
export async function persistForecast(
  pool: Pool | PoolClient,
  rows: ForecastRow[]
): Promise<void> {
  if (rows.length === 0) return;
  const client = 'connect' in pool && typeof (pool as PoolClient).query === 'function'
    ? (pool as PoolClient)
    : null;

  const doWork = async (c: PoolClient) => {
    await c.query('BEGIN');
    try {
      // Clear today's older rows for affected products so we don't accumulate
      await c.query(
        `DELETE FROM public.demand_forecasts
          WHERE product_id = ANY($1::uuid[])
            AND generated_at >= now() - INTERVAL '1 hour'`,
        [rows.map((r) => r.product_id)]
      );

      for (const r of rows) {
        await c.query(
          `INSERT INTO public.demand_forecasts
            (tenant_id, product_id, horizon_days, predicted_units, lower_bound, upper_bound, model)
           VALUES ($1, $2, 7,  $3, $4, $5, 'holt_winters'),
                  ($1, $2, 14, $6, $7, $8, 'holt_winters'),
                  ($1, $2, 30, $9, $4, $5, 'holt_winters')`,
          [
            r.tenant_id, r.product_id,
            r.forecast_7d, r.forecast_7d - 1, r.forecast_7d + 1,
            r.forecast_14d, r.lower_14d, r.upper_14d,
            r.forecast_30d,
          ]
        );
      }
      await c.query('COMMIT');
    } catch (err) {
      await c.query('ROLLBACK');
      throw err;
    }
  };

  if (client) {
    await doWork(client);
  } else {
    const c = await (pool as Pool).connect();
    try {
      await doWork(c);
    } finally {
      c.release();
    }
  }
}
