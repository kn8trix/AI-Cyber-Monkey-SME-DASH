import React, { useEffect, useMemo, useState } from "react";
import { useT } from "../i18n/LanguageContext";

// ---------------------------------------------------------------------------
// Types — mirror src/server/forecasting.ts and src/server/pricing-engine.ts
// ---------------------------------------------------------------------------

type StockStatus = "healthy" | "reorder" | "stockout_imminent" | "overstock";
type Trend = "up" | "down" | "flat";
type MarketPositioning = "premium" | "discount" | "aligned" | "unknown";
type TacticalAction = "raise" | "lower" | "hold" | "promo" | "clearance";

interface ForecastRow {
  product_id: string;
  tenant_id?: string;
  sku: string;
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
  trend: Trend;
  status: StockStatus;
  sparkline: number[];
  model: string;
}

interface PricingRow {
  product_id: string;
  tenant_id?: string;
  sku: string;
  name: string;
  current_price: number;
  buying_price: number;
  competitor_avg: number | null;
  price_index: number;
  stockout_urgency: number;
  recommended_price: number;
  promotional_price: number;
  elasticity_hint: number;
  market_positioning: MarketPositioning;
  tactical_action: TacticalAction;
  confidence_score: number;
  rationale: string[];
  model: string;
}

interface ApiEnvelope<T> {
  ok: boolean;
  source?: string;
  rows?: T[];
  generated_at?: string;
  error?: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Inline SVG sparkline (no external dep) — mirrors the existing dashboard style
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  stroke = "#2563eb",
  fill = "rgba(37, 99, 235, 0.12)",
  width = 96,
  height = 28,
}: {
  data: number[];
  stroke?: string;
  fill?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) {
    return (
      <div
        className="rounded-md bg-gray-100 text-gray-400 text-[10px] flex items-center justify-center"
        style={{ width, height }}
      >
        —
      </div>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `0,${height} ${points} ${width},${height}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      aria-hidden
    >
      <polygon points={area} fill={fill} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tiny chip primitives
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<StockStatus, { bg: string; text: string; dot: string; key: string }> = {
  healthy: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", key: "invStatusHealthy" },
  reorder: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", key: "invStatusReorder" },
  stockout_imminent: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", key: "invStatusStockout" },
  overstock: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", key: "invStatusOverstock" },
};

function StatusPill({ status }: { status: StockStatus }) {
  const t = useT();
  const s = STATUS_STYLES[status] || STATUS_STYLES.healthy;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(s.key)}
    </span>
  );
}

function TrendBadge({ trend }: { trend: Trend }) {
  const t = useT();
  const map: Record<Trend, { sym: string; cls: string; key: string }> = {
    up: { sym: "▲", cls: "text-emerald-600 bg-emerald-50", key: "invTrendUp" },
    down: { sym: "▼", cls: "text-rose-600 bg-rose-50", key: "invTrendDown" },
    flat: { sym: "■", cls: "text-gray-600 bg-gray-100", key: "invTrendFlat" },
  };
  const m = map[trend] || map.flat;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${m.cls}`}>
      <span className="text-[9px] leading-none">{m.sym}</span>
      {t(m.key)}
    </span>
  );
}

const ACTION_STYLES: Record<TacticalAction, { bg: string; text: string; key: string }> = {
  raise: { bg: "bg-emerald-50", text: "text-emerald-700", key: "priceActionRaise" },
  lower: { bg: "bg-rose-50", text: "text-rose-700", key: "priceActionLower" },
  hold: { bg: "bg-gray-100", text: "text-gray-700", key: "priceActionHold" },
  promo: { bg: "bg-amber-50", text: "text-amber-700", key: "priceActionPromo" },
  clearance: { bg: "bg-purple-50", text: "text-purple-700", key: "priceActionClearance" },
};

function ActionPill({ action }: { action: TacticalAction }) {
  const t = useT();
  const s = ACTION_STYLES[action] || ACTION_STYLES.hold;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
      {t(s.key)}
    </span>
  );
}

const POS_STYLES: Record<MarketPositioning, { cls: string; key: string }> = {
  premium: { cls: "text-indigo-700 bg-indigo-50", key: "pricePosPremium" },
  discount: { cls: "text-orange-700 bg-orange-50", key: "pricePosDiscount" },
  aligned: { cls: "text-emerald-700 bg-emerald-50", key: "pricePosAligned" },
  unknown: { cls: "text-gray-500 bg-gray-100", key: "pricePosUnknown" },
};

function PositionPill({ pos }: { pos: MarketPositioning }) {
  const t = useT();
  const s = POS_STYLES[pos] || POS_STYLES.unknown;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${s.cls}`}>
      {t(s.key)}
    </span>
  );
}

// --- P3: Action Inbox pill primitives --------------------------------------

const REC_TYPE_STYLES: Record<RecType, { cls: string; icon: string; key: string }> = {
  reorder: { cls: "bg-amber-50 text-amber-700", icon: "↻", key: "recTypeReorder" },
  reprice: { cls: "bg-indigo-50 text-indigo-700", icon: "↕", key: "recTypeReprice" },
  promo: { cls: "bg-purple-50 text-purple-700", icon: "★", key: "recTypePromo" },
  clearance: { cls: "bg-rose-50 text-rose-700", icon: "↓", key: "recTypeClearance" },
  hold: { cls: "bg-gray-100 text-gray-600", icon: "•", key: "recTypeHold" },
};

function RecTypePill({ type }: { type: RecType }) {
  const t = useT();
  const s = REC_TYPE_STYLES[type] || REC_TYPE_STYLES.hold;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${s.cls}`}
      aria-label={t(s.key)}
    >
      <span className="text-[10px] leading-none">{s.icon}</span>
      {t(s.key)}
    </span>
  );
}

const PRIORITY_STYLES: Record<number, { cls: string; label: string }> = {
  1: { cls: "bg-rose-100 text-rose-700 border-rose-200", label: "P1" },
  2: { cls: "bg-orange-100 text-orange-700 border-orange-200", label: "P2" },
  3: { cls: "bg-amber-100 text-amber-700 border-amber-200", label: "P3" },
  4: { cls: "bg-sky-100 text-sky-700 border-sky-200", label: "P4" },
  5: { cls: "bg-gray-100 text-gray-600 border-gray-200", label: "P5" },
};

function PriorityBadge({ priority }: { priority: number }) {
  const p = Math.max(1, Math.min(5, Math.round(priority || 3)));
  const s = PRIORITY_STYLES[p] || PRIORITY_STYLES[3];
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${s.cls}`}
      title={`${s.label} priority`}
    >
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// P3 — Action Inbox types
//   Mirrors src/server/recommendations.ts. Kept inline so this component
//   stays self-contained and the demo renders even when the API is offline.
// ---------------------------------------------------------------------------

type RecType = "reorder" | "reprice" | "promo" | "clearance" | "hold";
type RecStatus = "open" | "accepted" | "dismissed" | "applied";
type RecPending = "idle" | "accepting" | "dismissing";

interface ActionRecommendation {
  id: string;
  tenant_id?: string;
  product_id: string;
  sku: string;
  name: string;
  type: RecType;
  priority: number; // 1 = highest, 5 = lowest
  expected_impact: number; // currency
  confidence: number; // 0..1
  rationale: string[];
  status: RecStatus;
  source_model: string;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Offline fallback — deterministic mock so the demo never looks empty.
//   Synthesizes 6 SKUs across two tenants, trend + status + sparkline + price
//   using stable seeded formulas (no Math.random, so re-renders are stable).
// ---------------------------------------------------------------------------

function stableSpark(seed: number, base: number, days = 30): number[] {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < days; i++) {
    // deterministic wobble: sin + cos on i+seed
    const wobble = Math.sin((i + seed) * 0.6) * 0.35 + Math.cos((i + seed) * 0.27) * 0.18;
    v = Math.max(0, base * (1 + wobble * 0.4));
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

function mockForecasts(): ForecastRow[] {
  const seeds = [
    { id: "p1", sku: "BSK-001", name: "Handwoven Bamboo Basket", stock: 18, base: 3.2, buying: 120, price: 220 },
    { id: "p2", sku: "TSH-014", name: "Organic Cotton T-Shirt", stock: 4, base: 5.1, buying: 180, price: 320 },
    { id: "p3", sku: "MSK-007", name: "Beeswax Moisturizer 50ml", stock: 47, base: 1.8, buying: 95, price: 180 },
    { id: "p4", sku: "JWL-022", name: "Brass Earrings — Lotus", stock: 2, base: 2.4, buying: 260, price: 480 },
    { id: "p5", sku: "SPG-009", name: "Neem Wood Soap Dish", stock: 132, base: 0.6, buying: 60, price: 110 },
    { id: "p6", sku: "GRM-031", name: "Wild Honey 250g", stock: 12, base: 4.0, buying: 210, price: 380 },
  ];
  return seeds.map((s, i) => {
    const ads = s.base;
    const f7 = ads * 7;
    const f14 = ads * 14;
    const f30 = ads * 30;
    const lower = f14 * 0.78;
    const upper = f14 * 1.22;
    const daysLeft = s.stock > 0 ? Number((s.stock / Math.max(0.1, ads)).toFixed(1)) : 0;
    const reorderPt = Math.ceil(ads * 7 + Math.sqrt(ads * 7) * 1.28);
    let status: StockStatus = "healthy";
    if (s.stock <= 0) status = "stockout_imminent";
    else if (daysLeft <= 3) status = "stockout_imminent";
    else if (s.stock <= reorderPt) status = "reorder";
    else if (s.stock > ads * 45) status = "overstock";
    const trend: Trend = ads > 3 ? "up" : ads < 1.5 ? "down" : "flat";
    return {
      product_id: s.id,
      tenant_id: "demo",
      sku: s.sku,
      name: s.name,
      stock_count: s.stock,
      avg_daily_sales: ads,
      forecast_7d: Number(f7.toFixed(1)),
      forecast_14d: Number(f14.toFixed(1)),
      forecast_30d: Number(f30.toFixed(1)),
      lower_14d: Number(lower.toFixed(1)),
      upper_14d: Number(upper.toFixed(1)),
      days_until_stockout: daysLeft,
      reorder_point: reorderPt,
      suggested_reorder_qty: Math.max(1, Math.ceil(reorderPt - s.stock + f7)),
      trend,
      status,
      sparkline: stableSpark(i + 1, ads),
      model: "holt_winters_demo",
    };
  });
}

function mockPricings(): PricingRow[] {
  const items = [
    { id: "p1", sku: "BSK-001", name: "Handwoven Bamboo Basket", cost: 120, cur: 220, comp: 210, ads: 3.2, daysLeft: 5.6, pos: "aligned" as const, act: "hold" as const, rat: ["Cost-plus floor 168 covered", "Market aligned (PI 1.05)"] },
    { id: "p2", sku: "TSH-014", name: "Organic Cotton T-Shirt", cost: 180, cur: 320, comp: 295, ads: 5.1, daysLeft: 0.8, pos: "premium" as const, act: "raise" as const, rat: ["Stockout in <1 day — scarcity premium", "Demand up, elasticity inelastic", "Market anchor 295 leaves headroom"] },
    { id: "p3", sku: "MSK-007", name: "Beeswax Moisturizer 50ml", cost: 95, cur: 180, comp: 175, ads: 1.8, daysLeft: 26.1, pos: "aligned" as const, act: "hold" as const, rat: ["Healthy stockout window", "Market aligned (PI 1.03)"] },
    { id: "p4", sku: "JWL-022", name: "Brass Earrings — Lotus", cost: 260, cur: 480, comp: 510, ads: 2.4, daysLeft: 0.9, pos: "discount" as const, act: "raise" as const, rat: ["Stockout imminent — raise ceiling", "Already 6% below market", "Low elasticity supports increase"] },
    { id: "p5", sku: "SPG-009", name: "Neem Wood Soap Dish", cost: 60, cur: 110, comp: 105, ads: 0.6, daysLeft: 220, pos: "aligned" as const, act: "promo" as const, rat: ["Overstock — 200+ days cover", "Slow mover, promo to clear", "Promo 102 still 70% margin"] },
    { id: "p6", sku: "GRM-031", name: "Wild Honey 250g", cost: 210, cur: 380, comp: 410, ads: 4.0, daysLeft: 3.0, pos: "discount" as const, act: "raise" as const, rat: ["7% below market average", "Stockout in 3 days — urgency", "High demand, low elasticity"] },
  ];
  return items.map((it) => {
    const target = it.cost * 1.4;
    const market = it.comp ?? it.cur;
    const blended = target * 0.45 + market * 0.55;
    const urgency = it.daysLeft < 1 ? 0.95 : it.daysLeft < 3 ? 0.7 : it.daysLeft > 60 ? 0.0 : 0.25;
    const urgencyAdj = 1 + (urgency - 0.25) * 0.08; // ±~6%
    const recommended = Math.max(it.cost * 1.05, Number((blended * urgencyAdj).toFixed(2)));
    const promo = Number((recommended * 0.93).toFixed(2));
    const pi = market ? Number((it.cur / market).toFixed(2)) : 1;
    return {
      product_id: it.id,
      tenant_id: "demo",
      sku: it.sku,
      name: it.name,
      current_price: it.cur,
      buying_price: it.cost,
      competitor_avg: it.comp,
      price_index: pi,
      stockout_urgency: Number(urgency.toFixed(2)),
      recommended_price: recommended,
      promotional_price: promo,
      elasticity_hint: it.act === "raise" ? -0.7 : 1.1,
      market_positioning: it.pos,
      tactical_action: it.act,
      confidence_score: 0.78,
      rationale: it.rat,
      model: "cost_plus_market_demo",
    };
  });
}

// P3 — Mock action inbox (used when API is offline / DB not seeded)
//   6 actions spanning every type, deterministic IDs, sorted by priority.
function mockRecommendations(): ActionRecommendation[] {
  return [
    {
      id: "rec-p2-reorder",
      product_id: "p2",
      sku: "TSH-014",
      name: "Organic Cotton T-Shirt",
      type: "reorder",
      priority: 1,
      expected_impact: 1280,
      confidence: 0.91,
      rationale: [
        "Stockout in <1 day — reorder 80 units now",
        "7-day forecast 36, lead time 7 days",
        "Lost-sales cost ~$320/day at current margin",
      ],
      status: "open",
      source_model: "joint",
    },
    {
      id: "rec-p4-reorder",
      product_id: "p4",
      sku: "JWL-022",
      name: "Brass Earrings — Lotus",
      type: "reorder",
      priority: 1,
      expected_impact: 720,
      confidence: 0.86,
      rationale: [
        "Stockout in <1 day — reorder 30 units",
        "7-day forecast 17, lead time 5 days",
      ],
      status: "open",
      source_model: "joint",
    },
    {
      id: "rec-p4-reprice",
      product_id: "p4",
      sku: "JWL-022",
      name: "Brass Earrings — Lotus",
      type: "reprice",
      priority: 2,
      expected_impact: 460,
      confidence: 0.82,
      rationale: [
        "Current $480, recommended $510 (+6.3%)",
        "Low elasticity (-0.7) supports increase",
        "Below market anchor by 6%",
      ],
      status: "open",
      source_model: "joint",
    },
    {
      id: "rec-p5-clearance",
      product_id: "p5",
      sku: "SPG-009",
      name: "Neem Wood Soap Dish",
      type: "clearance",
      priority: 3,
      expected_impact: 880,
      confidence: 0.74,
      rationale: [
        "132 units in stock, 200+ days cover",
        "Slow mover — clearance at 70% margin",
        "Suggested $77 (-30%) to clear in 30 days",
      ],
      status: "open",
      source_model: "joint",
    },
    {
      id: "rec-p6-reprice",
      product_id: "p6",
      sku: "GRM-031",
      name: "Wild Honey 250g",
      type: "reprice",
      priority: 2,
      expected_impact: 540,
      confidence: 0.79,
      rationale: [
        "Current $380, recommended $410 (+7.9%)",
        "Stockout in 3 days — scarcity premium",
      ],
      status: "open",
      source_model: "joint",
    },
    {
      id: "rec-p1-hold",
      product_id: "p1",
      sku: "BSK-001",
      name: "Handwoven Bamboo Basket",
      type: "hold",
      priority: 5,
      expected_impact: 0,
      confidence: 0.65,
      rationale: [
        "Healthy stock, market-aligned price",
        "No action recommended",
      ],
      status: "open",
      source_model: "joint",
    },
  ];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface InventoryIntelligenceProps {
  // If the dashboard already knows the active tenant, we can label rows with it.
  // Kept optional so this component can be dropped into any layout.
  tenantId?: string;
  tenantName?: string;
  onActivatePricingTab?: () => void;
}

export default function InventoryIntelligence(_props: InventoryIntelligenceProps) {
  const t = useT();
  const [forecasts, setForecasts] = useState<ForecastRow[]>([]);
  const [pricings, setPricings] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [lastRunAt, setLastRunAt] = useState<string>("");

  // --- P3 Action Inbox state ---
  const [recs, setRecs] = useState<ActionRecommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsSource, setRecsSource] = useState<string>("");
  const [pending, setPending] = useState<Record<string, RecPending>>({});
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [totalSeen, setTotalSeen] = useState(0);
  const [auditError, setAuditError] = useState<string | null>(null);

  const fetchInbox = async () => {
    setRecsLoading(true);
    try {
      const r = await fetch("/api/recommendations/latest");
      const j = (await r.json()) as ApiEnvelope<ActionRecommendation>;
      const rows = j.rows ?? [];
      if (rows.length > 0) {
        setRecs(rows);
        setRecsSource("supabase");
      } else {
        setRecs(mockRecommendations());
        setRecsSource(j.source || "fallback");
      }
      setTotalSeen((s) => Math.max(s, rows.length));
    } catch {
      setRecs(mockRecommendations());
      setRecsSource("offline");
      setTotalSeen((s) => Math.max(s, mockRecommendations().length));
    } finally {
      setRecsLoading(false);
    }
  };

  const resolveRec = async (id: string, resolution: "accept" | "dismiss") => {
    setPending((p) => ({ ...p, [id]: resolution === "accept" ? "accepting" : "dismissing" }));
    setAuditError(null);
    // Optimistic remove
    const before = recs;
    setRecs((rs) => rs.filter((r) => r.id !== id));
    try {
      const r = await fetch(`/api/recommendations/${encodeURIComponent(id)}/${resolution}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = await r.json().catch(() => ({} as any));
      if (!r.ok || j?.ok === false) {
        // revert
        setRecs(before);
        setErr(j?.error || `Failed to ${resolution} recommendation`);
      } else {
        if (resolution === "accept") setAcceptedCount((c) => c + 1);
        if (j?.audit === false) setAuditError(t("recAuditError"));
      }
    } catch (e: any) {
      // network failure — revert
      setRecs(before);
      setErr(e?.message || String(e));
    } finally {
      setPending((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [fr, pr] = await Promise.all([
        fetch("/api/forecast/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lookbackDays: 90, leadTimeDays: 7 }),
        }).then((r) => r.json() as Promise<ApiEnvelope<ForecastRow>>),
        fetch("/api/pricing/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetMargin: 0.4 }),
        }).then((r) => r.json() as Promise<ApiEnvelope<PricingRow>>),
      ]);

      const fRows = fr.rows ?? [];
      const pRows = pr.rows ?? [];
      const finalSource =
        fRows.length > 0 || pRows.length > 0
          ? "supabase"
          : fr.source || pr.source || "fallback";

      if (finalSource === "fallback") {
        // No DB / seed not run — surface the demo data so the UI never looks dead.
        setForecasts(mockForecasts());
        setPricings(mockPricings());
      } else {
        setForecasts(fRows);
        setPricings(pRows);
      }
      setSource(finalSource);
      const stamp = fr.generated_at || pr.generated_at || new Date().toISOString();
      setGeneratedAt(stamp);
      setLastRunAt(new Date().toISOString());
      if (fr.error) setErr(fr.error);
      else if (pr.error) setErr(pr.error);
    } catch (e: any) {
      // Network or parse failure — still render demo data.
      setForecasts(mockForecasts());
      setPricings(mockPricings());
      setSource("offline");
      setErr(e?.message || String(e));
      setLastRunAt(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
    fetchInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- derived KPIs (inbox) ----------
  const recKpis = useMemo(() => {
    const open = recs.length;
    const topP = recs.reduce<number>((m, r) => Math.min(m, r.priority || 5), 6);
    const impact = recs.reduce((s, r) => s + (r.expected_impact || 0), 0);
    const rate = totalSeen > 0 ? acceptedCount / totalSeen : 0;
    return {
      open,
      topPriority: Number.isFinite(topP) && topP < 6 ? topP : 0,
      impact,
      acceptRate: rate,
    };
  }, [recs, acceptedCount, totalSeen]);

  // ---------- derived KPIs (forecast table) ----------
  const kpis = useMemo(() => {
    const acc = { healthy: 0, reorder: 0, stockout: 0, overstock: 0, total: forecasts.length };
    for (const f of forecasts) {
      if (f.status === "healthy") acc.healthy += 1;
      else if (f.status === "reorder") acc.reorder += 1;
      else if (f.status === "stockout_imminent") acc.stockout += 1;
      else if (f.status === "overstock") acc.overstock += 1;
    }
    return acc;
  }, [forecasts]);

  // pricing table sorted by confidence desc, then by biggest delta
  const sortedPricing = useMemo(() => {
    return [...pricings].sort((a, b) => {
      const dA = Math.abs((a.recommended_price || 0) - (a.current_price || 0));
      const dB = Math.abs((b.recommended_price || 0) - (b.current_price || 0));
      if (b.confidence_score !== a.confidence_score)
        return (b.confidence_score || 0) - (a.confidence_score || 0);
      return dB - dA;
    });
  }, [pricings]);

  const stockoutCount = kpis.stockout;
  const reorderCount = kpis.reorder;
  const healthyCount = kpis.healthy;
  const overstockCount = kpis.overstock;

  const isFallback = source === "fallback" || source === "offline";

  return (
    <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900">{t("inventoryTitle")}</h2>
            {isFallback && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {t("offlineRunEngine")}
              </span>
            )}
            {!isFallback && source && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {source}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">{t("inventorySubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-gray-400 hidden md:block">
            {t("priceRevertSource")}: <span className="font-mono text-gray-600">{source || "—"}</span>
            {generatedAt && (
              <>
                {" · "}
                <span className="font-mono text-gray-600">
                  {new Date(generatedAt).toLocaleString()}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition
              ${loading
                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
              }`}
          >
            {loading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {t("inventoryRunning")}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" />
                </svg>
                {t("inventoryRun")}
              </>
            )}
          </button>
        </div>
      </header>

      {err && (
        <div className="mt-3 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
          {err}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <KpiCard
          label={t("invKpiHealthy")}
          value={healthyCount}
          accent="emerald"
          sub={t("invKpiHealthySub")}
        />
        <KpiCard
          label={t("invKpiReorder")}
          value={reorderCount}
          accent="amber"
          sub={t("invKpiReorderSub")}
        />
        <KpiCard
          label={t("invKpiStockout")}
          value={stockoutCount}
          accent="rose"
          sub={t("invKpiStockoutSub")}
        />
        <KpiCard
          label={t("invKpiOverstock")}
          value={overstockCount}
          accent="sky"
          sub={t("invKpiOverstockSub")}
        />
      </div>

      {/* Two columns: inventory health + pricing actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* INVENTORY HEALTH TABLE */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t("inventoryHealth")}</h3>
            <span className="text-[11px] text-gray-400 font-mono">holt_winters · 14d</span>
          </div>
          {forecasts.length === 0 ? (
            <EmptyState message={t("inventoryEmpty")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">{t("invTableProduct")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("invTableStock")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("invTableFc7")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("invTableDays")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("invTableReorder")}</th>
                    <th className="text-center px-3 py-2 font-medium">{t("invTableTrend")}</th>
                    <th className="text-center px-3 py-2 font-medium">{t("invTableStatus")}</th>
                    <th className="text-center px-3 py-2 font-medium">14d</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {forecasts.map((f) => (
                    <tr key={f.product_id} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2.5 max-w-[180px]">
                        <div className="text-gray-900 font-medium text-[13px] truncate">{f.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{f.sku}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px] text-gray-700">
                        {f.stock_count}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px] text-gray-700">
                        {Math.round(f.forecast_7d)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px]">
                        <span
                          className={
                            f.days_until_stockout <= 3
                              ? "text-rose-600 font-semibold"
                              : f.days_until_stockout <= 7
                                ? "text-amber-600"
                                : "text-gray-700"
                          }
                        >
                          {Number.isFinite(f.days_until_stockout) ? `${f.days_until_stockout}d` : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px] text-gray-700">
                        <div className="leading-tight">
                          <div>{f.reorder_point}</div>
                          <div className="text-[10px] text-indigo-600">+{f.suggested_reorder_qty}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <TrendBadge trend={f.trend} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusPill status={f.status} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Sparkline
                          data={f.sparkline}
                          stroke={
                            f.status === "stockout_imminent"
                              ? "#e11d48"
                              : f.status === "reorder"
                                ? "#d97706"
                                : f.status === "overstock"
                                  ? "#0ea5e9"
                                  : "#059669"
                          }
                          fill={
                            f.status === "stockout_imminent"
                              ? "rgba(225, 29, 72, 0.12)"
                              : f.status === "reorder"
                                ? "rgba(217, 119, 6, 0.12)"
                                : f.status === "overstock"
                                  ? "rgba(14, 165, 233, 0.12)"
                                  : "rgba(5, 150, 105, 0.12)"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PRICING ACTIONS TABLE */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t("pricingTitle")}</h3>
            <span className="text-[11px] text-gray-400 font-mono">cost_plus_market</span>
          </div>
          {pricings.length === 0 ? (
            <EmptyState message={t("inventoryEmpty")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">{t("invTableProduct")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("priceCurrent")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("priceCompetitor")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("priceRecommended")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("pricePromo")}</th>
                    <th className="text-center px-3 py-2 font-medium">{t("pricePosition")}</th>
                    <th className="text-center px-3 py-2 font-medium">{t("priceAction")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("priceConfidence")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedPricing.map((p) => {
                    const delta = p.recommended_price - p.current_price;
                    const deltaPct = p.current_price ? (delta / p.current_price) * 100 : 0;
                    return (
                      <tr key={p.product_id} className="hover:bg-gray-50/60">
                        <td className="px-3 py-2.5 max-w-[180px]">
                          <div className="text-gray-900 font-medium text-[13px] truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{p.sku}</div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[12px] text-gray-700">
                          {fmtMoney(p.current_price)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[12px] text-gray-500">
                          {p.competitor_avg != null ? fmtMoney(p.competitor_avg) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[12px] font-semibold">
                          <div className="text-gray-900">{fmtMoney(p.recommended_price)}</div>
                          <div
                            className={`text-[10px] ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {delta >= 0 ? "+" : ""}
                            {delta.toFixed(0)} ({deltaPct.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[12px] text-amber-700">
                          {fmtMoney(p.promotional_price)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <PositionPill pos={p.market_positioning} />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <ActionPill action={p.tactical_action} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <ConfidenceBar value={p.confidence_score} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rationale panel — show top 3 priced items with full reasoning */}
      {sortedPricing.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {sortedPricing.slice(0, 3).map((p) => (
            <div
              key={`r-${p.product_id}`}
              className="rounded-2xl border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-gray-900 truncate">{p.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{p.sku}</div>
                </div>
                <ActionPill action={p.tactical_action} />
              </div>
              <ul className="mt-2.5 space-y-1">
                {(p.rationale ?? []).slice(0, 3).map((r, idx) => (
                  <li key={idx} className="text-[12px] text-gray-600 flex gap-1.5">
                    <span className="text-indigo-500 mt-1">•</span>
                    <span className="leading-snug">{r}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                <span>
                  {t("priceCurrent")}: <span className="font-mono text-gray-700">{fmtMoney(p.current_price)}</span>
                </span>
                <span>
                  → <span className="font-mono text-gray-900 font-semibold">{fmtMoney(p.recommended_price)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------
          P3 — Action Inbox (closed loop: model proposes → merchant ratifies)
         ------------------------------------------------------------------ */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-900">{t("recTitle")}</h2>
              {recsSource === "offline" || recsSource === "fallback" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t("offlineRunEngine")}
                </span>
              ) : recsSource ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {recsSource}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">{t("recSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={fetchInbox}
            disabled={recsLoading}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition shrink-0
              ${recsLoading
                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
          >
            {recsLoading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {t("recRefreshing")}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0115-6.7L21 7" strokeLinecap="round" />
                  <path d="M21 3v4h-4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12a9 9 0 01-15 6.7L3 17" strokeLinecap="round" />
                  <path d="M3 21v-4h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t("recRefresh")}
              </>
            )}
          </button>
        </header>

        {auditError && (
          <div className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
            {auditError}
          </div>
        )}

        {/* Inbox KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <KpiCard
            label={t("recKpiOpen")}
            value={recKpis.open}
            accent="indigo"
            sub={t("recKpiOpenSub")}
          />
          <KpiCard
            label={t("recKpiTopPriority")}
            value={recKpis.topPriority || 0}
            accent="rose"
            sub={t("recKpiTopPrioritySub")}
          />
          <KpiCard
            label={t("recKpiImpact")}
            value={recKpis.impact}
            accent="emerald"
            sub={t("recKpiImpactSub")}
            format="money"
          />
          <KpiCard
            label={t("recKpiAcceptRate")}
            value={recKpis.acceptRate}
            accent="sky"
            sub={t("recKpiAcceptRateSub", {
              accepted: String(acceptedCount),
              total: String(totalSeen),
            })}
            format="pct"
          />
        </div>

        {/* Inbox card grid */}
        {recs.length === 0 ? (
          <div className="mt-5">
            <EmptyState message={t("recEmpty")} />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recs.map((r) => {
              const pen = pending[r.id] || "idle";
              return (
                <article
                  key={r.id}
                  className={`rounded-2xl border bg-white p-4 flex flex-col gap-3 transition
                    ${pen !== "idle" ? "opacity-70 border-indigo-200" : "border-gray-200 hover:border-indigo-200"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-gray-900 truncate">{r.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{r.sku}</div>
                    </div>
                    <PriorityBadge priority={r.priority} />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <RecTypePill type={r.type} />
                    <span className="text-[10px] text-gray-400 font-mono">{r.source_model}</span>
                  </div>

                  <ul className="space-y-1">
                    {(r.rationale ?? []).slice(0, 3).map((line, idx) => (
                      <li key={idx} className="text-[12px] text-gray-600 flex gap-1.5">
                        <span className="text-indigo-500 mt-1">•</span>
                        <span className="leading-snug">{line}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">
                        {t("recImpactLabel")}
                      </div>
                      <div className="font-mono text-gray-900 text-[13px]">
                        {fmtMoney(r.expected_impact || 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">
                        {t("recConfidenceLabel")}
                      </div>
                      <div className="mt-1">
                        <ConfidenceBar value={r.confidence} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => resolveRec(r.id, "accept")}
                      disabled={pen !== "idle"}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition
                        ${pen === "accepting"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-wait"
                          : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                        }`}
                    >
                      {pen === "accepting" ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          {t("recAccepting")}
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {t("recAccept")}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveRec(r.id, "dismiss")}
                      disabled={pen !== "idle"}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition
                        ${pen === "dismissing"
                          ? "bg-gray-100 text-gray-500 border-gray-200 cursor-wait"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {pen === "dismissing" ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          {t("recDismissing")}
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                          </svg>
                          {t("recDismiss")}
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer caption */}
      {lastRunAt && (
        <div className="mt-4 text-[10px] text-gray-400 text-right font-mono">
          last_run={new Date(lastRunAt).toLocaleString()} · rows={forecasts.length}/{pricings.length} · inbox={recs.length}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Small sub-components kept local for cohesion
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  accent,
  sub,
  format = "number",
}: {
  label: string;
  value: number;
  accent: "emerald" | "amber" | "rose" | "sky" | "indigo";
  sub: string;
  format?: "number" | "money" | "pct";
}) {
  const accents: Record<string, string> = {
    emerald: "from-emerald-50 to-white border-emerald-100 text-emerald-700",
    amber: "from-amber-50 to-white border-amber-100 text-amber-700",
    rose: "from-rose-50 to-white border-rose-100 text-rose-700",
    sky: "from-sky-50 to-white border-sky-100 text-sky-700",
    indigo: "from-indigo-50 to-white border-indigo-100 text-indigo-700",
  };
  let display: string;
  if (format === "money") display = fmtMoney(value);
  else if (format === "pct") display = `${Math.round((value || 0) * 100)}%`;
  else display = String(value);
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${accents[accent]} p-3.5`}>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-0.5">{display}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value || 0));
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-indigo-500"
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
      <span className="text-[11px] font-mono text-gray-600">{Math.round(pct * 100)}%</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-gray-400">
      <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9h.01M15 9h.01M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5" strokeLinecap="round" />
        </svg>
      </div>
      {message}
    </div>
  );
}

function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(n >= 100 ? 0 : 2)}`;
}
