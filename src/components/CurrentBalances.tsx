import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useT } from '../i18n/LanguageContext';

interface BalanceChartProps {
  data?: Array<{ month: string; amount: number }>;
  currentBalance?: string;
  trend?: number;
}

const defaultData = [
  { month: 'Jan', amount: 12 },
  { month: 'Feb', amount: 8 },
  { month: 'Mar', amount: 14 },
  { month: 'Apr', amount: 9 },
  { month: 'May', amount: 11 },
  { month: 'Jun', amount: 18 }
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DemoOrdersResponse {
  source?: 'supabase' | 'fallback';
  series?: Array<{ month: string; revenue: number | string; order_count: number | string }>;
  currentBalance?: number | null;
  trend?: number | null;
}

function toNumber(n: number | string | undefined | null): number {
  if (n == null) return 0;
  const v = typeof n === 'string' ? parseFloat(n) : n;
  return Number.isFinite(v) ? v : 0;
}

function formatThousands(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CurrentBalances({
  data: dataProp,
  currentBalance: currentBalanceProp,
  trend: trendProp
}: BalanceChartProps) {
  // If the parent passed props explicitly (e.g. preview/tests), honor
  // them. Otherwise, fetch from /api/demo/orders and fall back to the
  // hardcoded defaults if the request fails or the backend is offline.
  const [live, setLive] = useState<DemoOrdersResponse | null>(null);

  useEffect(() => {
    if (dataProp || currentBalanceProp !== undefined || trendProp !== undefined) return;
    let cancelled = false;
    fetch('/api/demo/orders')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        setLive(json as DemoOrdersResponse);
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [dataProp, currentBalanceProp, trendProp]);

  const { data, currentBalance, trend } = useMemo(() => {
    if (dataProp || currentBalanceProp !== undefined || trendProp !== undefined) {
      return {
        data: dataProp ?? defaultData,
        currentBalance: currentBalanceProp ?? '15,890.00',
        trend: trendProp ?? 20,
      };
    }
    if (live && live.source === 'supabase' && live.series && live.series.length) {
      const series = live.series.map((row) => {
        const parts = (row.month || '').split('-');
        const monthIdx = parseInt(parts[1] || '0', 10) - 1;
        const label = MONTH_LABELS[monthIdx] || row.month;
        // Convert revenue (USD) to a "K" value to match the chart's
        // existing visual scale (default max is 18K).
        const revenue = toNumber(row.revenue);
        return { month: label, amount: Math.max(1, Math.round(revenue / 1000)) };
      });
      return {
        data: series,
        currentBalance: live.currentBalance != null ? formatThousands(live.currentBalance) : '15,890.00',
        trend: live.trend != null ? live.trend : 20,
      };
    }
    return {
      data: defaultData,
      currentBalance: '15,890.00',
      trend: 20,
    };
  }, [dataProp, currentBalanceProp, trendProp, live]);

  const maxAmount = Math.max(...data.map((d) => d.amount));
  const t = useT();

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{t('balances.currentBalance')}</h3>
          <p className="text-gray-600 text-sm">Revenue trend across stores</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ExternalLink className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Balance Display */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-gray-900">{currentBalance}</span>
          <span className="text-gray-500 text-sm">USD</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-gray-500 text-xs">{t('balances.trendUp', { pct: trend })}</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end gap-3 h-48 justify-between">
        {data.map((item, idx) => {
          const monthLabel = (t(`balances.months.${item.month}`) as string) || item.month;
          return (
            <div key={idx} className="flex flex-col items-center flex-1">
              <div className="w-full flex items-end justify-center h-32">
                <div
                  className="w-8 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all hover:shadow-lg"
                  style={{ height: `${(item.amount / maxAmount) * 128}px` }}
                  title={`${monthLabel}: ${item.amount}K`}
                />
              </div>
              <span className="text-gray-600 text-xs font-medium mt-2">{monthLabel}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span className="text-gray-600 text-xs">$20K</span>
          <span className="text-gray-400 text-xs">•</span>
          <div className="w-3 h-3 bg-orange-200 rounded-full"></div>
          <span className="text-gray-600 text-xs">$10K</span>
          <span className="text-gray-400 text-xs">•</span>
          <div className="w-3 h-3 bg-orange-100 rounded-full"></div>
          <span className="text-gray-600 text-xs">$5K</span>
        </div>
      </div>
    </div>
  );
}
