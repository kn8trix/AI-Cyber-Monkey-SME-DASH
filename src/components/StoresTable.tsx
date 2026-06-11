import React, { useState } from 'react';
import { ChevronDown, Edit2, Trash2, Eye, Copy } from 'lucide-react';

export interface StoreRecord {
  id: string;
  domain: string;
  createdDate: string;
  ordersToday: number;
  status: 'active' | 'suspended' | 'pending';
  storeUrl?: string;
}

interface StoresTableProps {
  stores?: StoreRecord[];
  onEdit?: (store: StoreRecord) => void;
  onDelete?: (store: StoreRecord) => void;
  onView?: (store: StoreRecord) => void;
}

const defaultStores: StoreRecord[] = [
  {
    id: 'STORE-001',
    domain: 'store1.example.com',
    createdDate: '27 Jun 2025',
    ordersToday: 8,
    status: 'active',
    storeUrl: 'https://store1.example.com'
  },
  {
    id: 'STORE-002',
    domain: 'store2.example.com',
    createdDate: '25 Jun 2025',
    ordersToday: 12,
    status: 'active',
    storeUrl: 'https://store2.example.com'
  },
  {
    id: 'STORE-003',
    domain: 'store3.example.com',
    createdDate: '20 Jun 2025',
    ordersToday: 0,
    status: 'pending',
    storeUrl: 'https://store3.example.com'
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>;
    case 'suspended':
      return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Suspended</span>;
    case 'pending':
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Pending</span>;
    default:
      return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Unknown</span>;
  }
};

export default function StoresTable({ 
  stores = defaultStores,
  onEdit,
  onDelete,
  onView
}: StoresTableProps) {
  const [sortBy, setSortBy] = useState<'domain' | 'date' | 'orders'>('date');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">All Stores</h3>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Store ID</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-500 cursor-pointer" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Store ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Primary Domain</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders Today</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-500 cursor-pointer" />
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900 text-sm">{store.id}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700 text-sm">{store.domain}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700 text-sm">{store.createdDate}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700 text-sm font-medium">{store.ordersToday}</span>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(store.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onView?.(store)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                      title="View store"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit?.(store)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                      title="Edit store"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(store)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      title="Delete store"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
        <span>{stores.length} stores • All Client Status</span>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-white rounded transition-colors">←</button>
          <span>27 Jun 2025</span>
          <button className="p-1 hover:bg-white rounded transition-colors">→</button>
        </div>
      </div>
    </div>
  );
}
