import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useT } from '../i18n/LanguageContext';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  email?: string;
  avatar?: string;
  type: 'deployment' | 'order' | 'alert' | 'update';
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  onViewAll?: () => void;
}

const defaultActivities: ActivityItem[] = [
  {
    id: '1',
    title: 'New Storefront Deployed',
    description: 'store1.example.com successfully deployed with 45 products',
    timestamp: '2 hours ago',
    email: 'admin@company.com',
    avatar: 'A',
    type: 'deployment'
  },
  {
    id: '2',
    title: 'High Volume Orders',
    description: 'Store 3 received 24 orders in the last 2 hours',
    timestamp: '1 hour ago',
    email: 'support@store3.com',
    avatar: 'S',
    type: 'alert'
  },
  {
    id: '3',
    title: 'Inventory Update',
    description: 'Automatic price adjustment applied across 3 stores',
    timestamp: '30 minutes ago',
    email: 'system@dashboard.com',
    avatar: 'S',
    type: 'update'
  }
];

const getActivityColor = (type: string) => {
  switch (type) {
    case 'deployment':
      return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
    case 'order':
      return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
    case 'alert':
      return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
    case 'update':
      return { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
  }
};

export default function ActivityFeed({ activities = defaultActivities, onViewAll }: ActivityFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const t = useT();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t('activity.title')}</h3>
          <p className="text-gray-600 text-xs">{t('activity.subtitle')}</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ExternalLink className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {activities.map((activity) => {
          const colors = getActivityColor(activity.type);
          const isExpanded = expandedId === activity.id;
          // Translate type label if a matching key exists, otherwise show the provided title
          const typeKey = `activity.types.${activity.type}` as const;
          const localizedTitle = t(typeKey);
          const displayTitle = localizedTitle.startsWith('⚠') ? activity.title : localizedTitle;

          return (
            <div
              key={activity.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : activity.id)}
            >
              {/* Main Row */}
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center flex-shrink-0 ${colors.text} font-bold text-sm`}>
                  {activity.avatar}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{displayTitle}</h4>
                      {isExpanded && (
                        <p className="text-gray-600 text-xs mt-1 line-clamp-3">{activity.description}</p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0 mt-1`}></div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-500 text-xs">{activity.timestamp}</span>
                    {activity.email && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 text-xs truncate">{activity.email}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Expand Icon */}
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
        <button
          onClick={onViewAll}
          className="text-orange-600 text-sm font-semibold hover:text-orange-700 transition-colors"
        >
          {t('activity.seeDetail')}
        </button>
      </div>
    </div>
  );
}
