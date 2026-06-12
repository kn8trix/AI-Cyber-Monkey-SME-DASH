import React, { useEffect, useState } from 'react';
import { TrendingUp, Store, Users } from 'lucide-react';

export interface MetricCardData {
  label: string;
  value: string;
  trend: number;
  period: string;
  icon: 'revenue' | 'customers' | 'stores';
}

interface MetricCardsProps {
  metrics?: MetricCardData[];
}

const defaultMetrics: MetricCardData[] = [
  {
    label: 'Total Revenue',
    value: '$47,250.00',
    trend: 20,
    period: 'from last month',
    icon: 'revenue'
  },
  {
    label: 'New Customers',
    value: '284',
    trend: 12,
    period: 'from last month',
    icon: 'customers'
  },
  {
    label: 'Active Stores',
    value: '12',
    trend: -5,
    period: 'from last week',
    icon: 'stores'
  }
];

// Shape of a row coming back from /api/demo/tenant-metrics. The view
// in supabase/init.sql returns more fields than we consume; we only
// type what we use so the frontend stays loose.
interface DemoMetricRow {
  total_revenue?: number | string;
  total_orders?: number | string;
  total_products?: number | string;
  active_stores?: number | string;
  revenue_growth_pct?: number | string;
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toInt(n: number | string | undefined | null): number {
  if (n == null) return 0;
  const v = typeof n === 'string' ? parseFloat(n) : n;
  return Number.isFinite(v) ? v : 0;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'revenue':
      return <TrendingUp className="w-6 h-6 text-orange-500" />;
    case 'customers':
      return <Users className="w-6 h-6 text-blue-500" />;
    case 'stores':
      return <Store className="w-6 h-6 text-green-500" />;
    default:
      return <TrendingUp className="w-6 h-6 text-orange-500" />;
  }
};

export default function MetricCards({ metrics }: MetricCardsProps) {
  // If the parent passed metrics explicitly (e.g. preview/tests), honor
  // them. Otherwise, attempt to fetch from /api/demo/tenant-metrics
  // and fall back to the hardcoded defaults if the request fails or
  // the backend isn't configured.
  const [live, setLive] = useState<MetricCardData[] | null>(null);

  useEffect(() => {
    if (metrics) return; // explicit override wins
    let cancelled = false;
    fetch("/api/demo/tenant-metrics")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json || json.source !== "supabase") return;
        const row: DemoMetricRow = (json.metrics && json.metrics[0]) || {};
        const revenue = toInt(row.total_revenue);
        const orders = toInt(row.total_orders);
        const stores = toInt(row.active_stores);
        const growth = toInt(row.revenue_growth_pct);
        // "New customers" is approximated by recent order count for
        // the demo — the schema doesn't model customers explicitly.
        setLive([
          {
            label: "Total Revenue",
            value: formatCurrency(revenue),
            trend: growth,
            period: "from last month",
            icon: "revenue",
          },
          {
            label: "New Customers",
            value: String(orders),
            trend: 0,
            period: "from last month",
            icon: "customers",
          },
          {
            label: "Active Stores",
            value: String(stores),
            trend: 0,
            period: "currently deployed",
            icon: "stores",
          },
        ]);
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [metrics]);

  const resolved = metrics ?? live ?? defaultMetrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {resolved.map((metric, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">{metric.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              {getIcon(metric.icon)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${metric.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metric.trend >= 0 ? '+' : ''}{metric.trend}%
            </span>
            <span className="text-gray-500 text-xs">{metric.period}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
