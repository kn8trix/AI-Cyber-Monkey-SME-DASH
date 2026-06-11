import React, { useEffect, useState } from "react";
import { Trash2, Eye, Copy, Pause, Play, RefreshCw } from "lucide-react";

interface Tenant {
  id: string;
  domain: string;
  name: string;
  owner_email: string;
  plan: string;
  status: string;
  created_at: string;
}

interface StorefrontManagerProps {
  onTenantSelect?: (tenant: Tenant) => void;
}

export default function StorefrontManager({ onTenantSelect }: StorefrontManagerProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/tenants");
      if (!response.ok) {
        throw new Error("Failed to fetch tenants");
      }
      const data = await response.json();
      setTenants(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSuspend = async (tenantId: string) => {
    if (!window.confirm("Are you sure you want to suspend this storefront?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin suspension" })
      });

      if (response.ok) {
        fetchTenants();
      }
    } catch (err) {
      console.error("Suspend failed:", err);
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (!window.confirm("Are you sure you want to delete this storefront? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/delete`, {
        method: "POST"
      });

      if (response.ok) {
        fetchTenants();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-yellow-100 text-yellow-800",
      deleted: "bg-red-100 text-red-800"
    };
    return classes[status] || "bg-gray-100 text-gray-800";
  };

  const getPlanBadge = (plan: string) => {
    const classes: Record<string, string> = {
      free: "bg-blue-100 text-blue-800",
      monthly: "bg-purple-100 text-purple-800",
      yearly: "bg-indigo-100 text-indigo-800"
    };
    return classes[plan] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Provisioned Storefronts</h3>
        <button
          onClick={fetchTenants}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && tenants.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="text-gray-600 mt-2">Loading storefronts...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No storefronts provisioned yet</p>
          <p className="text-sm text-gray-500 mt-1">Deploy your first storefront to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Domain</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Store Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Owner Email</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Plan</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 max-w-xs truncate">
                        {tenant.domain}
                      </code>
                      <button
                        onClick={() => handleCopy(tenant.domain, `domain-${tenant.id}`)}
                        className="p-1 hover:bg-gray-200 rounded transition"
                        title="Copy domain"
                      >
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>
                      {copied === `domain-${tenant.id}` && (
                        <span className="text-xs text-green-600">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{tenant.name}</td>
                  <td className="py-3 px-4 text-gray-600">{tenant.owner_email}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPlanBadge(tenant.plan)}`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onTenantSelect?.(tenant)}
                        className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {tenant.status === "active" ? (
                        <button
                          onClick={() => handleSuspend(tenant.id)}
                          className="p-1.5 hover:bg-yellow-100 text-yellow-600 rounded transition"
                          title="Suspend storefront"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-1.5 text-gray-300 rounded"
                          title="Resume (not implemented)"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded transition"
                        title="Delete storefront"
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
      )}
    </div>
  );
}
