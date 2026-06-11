import React, { useEffect, useRef, useState } from "react";
import {
  Trash2,
  Eye,
  Copy,
  Pause,
  Play,
  RefreshCw,
  Rocket,
  ExternalLink,
  XCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface Tenant {
  id: string;
  domain: string;
  name: string;
  owner_email: string;
  plan: string;
  status: string;
  created_at: string;
  // Vercel deployment metadata (may be absent on older tenants)
  deployment_status?:
    | "not_deployed"
    | "provisioned"
    | "building"
    | "ready"
    | "failed";
  vercel_project_id?: string | null;
  vercel_project_name?: string | null;
  vercel_deployment_id?: string | null;
  vercel_deployment_url?: string | null;
  deployed_at?: string | null;
  last_deploy_error?: string | null;
}

interface DeployStatusResponse {
  tenantId: string;
  deploymentStatus: Tenant["deployment_status"];
  vercelProjectId: string | null;
  vercelProjectName: string | null;
  vercelDeploymentId: string | null;
  vercelDeploymentUrl: string | null;
  deployedAt: string | null;
  lastDeployError: string | null;
}

interface StorefrontManagerProps {
  onTenantSelect?: (tenant: Tenant) => void;
}

export default function StorefrontManager({
  onTenantSelect,
}: StorefrontManagerProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deploying, setDeploying] = useState<Record<string, boolean>>({});
  const [tornDown, setTornDown] = useState<Record<string, boolean>>({});
  const [vercelNotConfigured, setVercelNotConfigured] = useState(false);
  const pollersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // -------- data fetching --------
  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/tenants");
      if (!response.ok) throw new Error("Failed to fetch tenants");
      const data = await response.json();
      const list: Tenant[] = data.data || [];
      setTenants(list);

      // Kick off a one-time status refresh for any tenants that
      // currently report building — that way the table doesn't sit
      // stuck on "building" after a deploy.
      list.forEach((t) => {
        if (t.deployment_status === "building" || t.deployment_status === "provisioned") {
          startPolling(t.id, /*silent*/ true);
        }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    return () => {
      // Stop all pollers on unmount
      Object.values(pollersRef.current).forEach(clearInterval);
      pollersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- helpers --------
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
        body: JSON.stringify({ reason: "Admin suspension" }),
      });
      if (response.ok) fetchTenants();
    } catch (err) {
      console.error("Suspend failed:", err);
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this storefront? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/delete`, {
        method: "POST",
      });
      if (response.ok) fetchTenants();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // -------- Vercel deploy flow --------

  const applyDeployStatus = (tenantId: string, status: DeployStatusResponse) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              deployment_status: status.deploymentStatus,
              vercel_project_id: status.vercelProjectId,
              vercel_project_name: status.vercelProjectName,
              vercel_deployment_id: status.vercelDeploymentId,
              vercel_deployment_url: status.vercelDeploymentUrl,
              deployed_at: status.deployedAt,
              last_deploy_error: status.lastDeployError,
            }
          : t
      )
    );
  };

  const startPolling = (tenantId: string, silent = false) => {
    if (pollersRef.current[tenantId]) return;
    pollersRef.current[tenantId] = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/deploy/${tenantId}`);
        if (!res.ok) {
          stopPolling(tenantId);
          if (!silent) {
            const body = await res.json().catch(() => ({}));
            setError(body.message || body.error || "Status poll failed");
          }
          return;
        }
        const data: DeployStatusResponse = await res.json();
        applyDeployStatus(tenantId, data);
        if (
          data.deploymentStatus === "ready" ||
          data.deploymentStatus === "failed" ||
          data.deploymentStatus === "not_deployed"
        ) {
          stopPolling(tenantId);
        }
      } catch (err) {
        // Network blip — keep polling, surface only on the next tick
        console.warn("Deploy poll error:", err);
      }
    }, 2500);
  };

  const stopPolling = (tenantId: string) => {
    if (pollersRef.current[tenantId]) {
      clearInterval(pollersRef.current[tenantId]);
      delete pollersRef.current[tenantId];
    }
  };

  const handleDeploy = async (tenant: Tenant) => {
    if (tenant.status === "deleted") {
      setError("Cannot deploy a deleted storefront");
      return;
    }
    setDeploying((prev) => ({ ...prev, [tenant.id]: true }));
    setVercelNotConfigured(false);
    try {
      const res = await fetch(`/api/admin/deploy/${tenant.id}`, {
        method: "POST",
      });
      if (res.status === 503) {
        setVercelNotConfigured(true);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || body.error || `Deploy failed (HTTP ${res.status})`);
        return;
      }
      const data: DeployStatusResponse = await res.json();
      applyDeployStatus(tenant.id, data);
      startPolling(tenant.id);
    } catch (err: any) {
      setError(err?.message || "Deploy request failed");
    } finally {
      setDeploying((prev) => ({ ...prev, [tenant.id]: false }));
    }
  };

  const handleTeardown = async (tenant: Tenant) => {
    if (
      !window.confirm(
        `Tear down the Vercel project for "${tenant.name}"? The Vercel URL will stop working, but the tenant record stays in the dashboard.`
      )
    ) {
      return;
    }
    setTornDown((prev) => ({ ...prev, [tenant.id]: true }));
    try {
      const res = await fetch(`/api/admin/deploy/${tenant.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || body.error || `Teardown failed (HTTP ${res.status})`);
        return;
      }
      applyDeployStatus(tenant.id, {
        tenantId: tenant.id,
        deploymentStatus: "not_deployed",
        vercelProjectId: null,
        vercelProjectName: null,
        vercelDeploymentId: null,
        vercelDeploymentUrl: null,
        deployedAt: null,
        lastDeployError: null,
      });
    } catch (err: any) {
      setError(err?.message || "Teardown request failed");
    } finally {
      setTornDown((prev) => ({ ...prev, [tenant.id]: false }));
    }
  };

  // -------- badge helpers --------
  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-yellow-100 text-yellow-800",
      deleted: "bg-red-100 text-red-800",
    };
    return classes[status] || "bg-gray-100 text-gray-800";
  };

  const getPlanBadge = (plan: string) => {
    const classes: Record<string, string> = {
      free: "bg-blue-100 text-blue-800",
      monthly: "bg-purple-100 text-purple-800",
      yearly: "bg-indigo-100 text-indigo-800",
    };
    return classes[plan] || "bg-gray-100 text-gray-800";
  };

  const getDeployBadge = (status?: Tenant["deployment_status"]) => {
    switch (status) {
      case "ready":
        return {
          classes: "bg-green-100 text-green-800",
          label: "Live",
          icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
        };
      case "building":
      case "provisioned":
        return {
          classes: "bg-blue-100 text-blue-800",
          label: status === "provisioned" ? "Provisioning" : "Building",
          icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
        };
      case "failed":
        return {
          classes: "bg-red-100 text-red-800",
          label: "Failed",
          icon: <XCircle className="w-3 h-3 mr-1" />,
        };
      case "not_deployed":
      default:
        return {
          classes: "bg-gray-100 text-gray-800",
          label: "Not deployed",
          icon: null,
        };
    }
  };

  return (
    <div className="space-y-4">
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start justify-between gap-2">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
            title="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {vercelNotConfigured && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <strong>Vercel isn't configured yet.</strong> Add{" "}
          <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">
            VERCEL_API_TOKEN
          </code>{" "}
          to the dashboard's Vercel project (Settings → Environment
          Variables), redeploy once, then the Deploy buttons will work.
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
          <p className="text-sm text-gray-500 mt-1">
            Deploy your first storefront to get started
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Domain
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Store Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Owner Email
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Plan
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Vercel
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => {
                const deployBadge = getDeployBadge(tenant.deployment_status);
                const isLive = tenant.deployment_status === "ready" && tenant.vercel_deployment_url;
                return (
                  <tr
                    key={tenant.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
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
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {tenant.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {tenant.owner_email}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPlanBadge(tenant.plan)}`}
                      >
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(tenant.status)}`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${deployBadge.classes}`}
                          title={tenant.last_deploy_error || deployBadge.label}
                        >
                          {deployBadge.icon}
                          {deployBadge.label}
                        </span>
                        {isLive && (
                          <a
                            href={tenant.vercel_deployment_url!}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            title="Open the live storefront"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open
                          </a>
                        )}
                        {tenant.deployment_status === "failed" && tenant.last_deploy_error && (
                          <span
                            className="text-[10px] text-red-600 max-w-[160px] truncate"
                            title={tenant.last_deploy_error}
                          >
                            {tenant.last_deploy_error}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDeploy(tenant)}
                          disabled={
                            deploying[tenant.id] ||
                            tenant.deployment_status === "building" ||
                            tenant.deployment_status === "provisioned" ||
                            tenant.status === "deleted"
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition disabled:opacity-50 bg-orange-100 hover:bg-orange-200 text-orange-800"
                          title={
                            tenant.vercel_deployment_url
                              ? "Trigger a fresh production deploy"
                              : "Create Vercel project + deploy"
                          }
                        >
                          {deploying[tenant.id] || tenant.deployment_status === "building" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Rocket className="w-3 h-3" />
                          )}
                          {tenant.vercel_deployment_url ? "Redeploy" : "Deploy"}
                        </button>
                        {tenant.vercel_deployment_url && (
                          <button
                            onClick={() => handleTeardown(tenant)}
                            disabled={tornDown[tenant.id]}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition disabled:opacity-50"
                            title="Tear down the Vercel project"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
