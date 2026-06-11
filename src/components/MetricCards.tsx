import React from 'react';
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

export default function MetricCards({ metrics = defaultMetrics }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric, idx) => (
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
