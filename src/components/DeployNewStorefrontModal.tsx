import React, { useState } from "react";
import { X, Plus, Loader, AlertCircle, CheckCircle, Copy } from "lucide-react";

interface DeployNewStorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

export default function DeployNewStorefrontModal({
  isOpen,
  onClose,
  onSuccess
}: DeployNewStorefrontModalProps) {
  const [step, setStep] = useState<"form" | "provisioning" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    domain: "",
    name: "",
    ownerEmail: "",
    ownerName: "",
    plan: "free" as "free" | "monthly" | "yearly"
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.domain.trim()) {
      setError("Domain is required");
      return false;
    }
    if (!formData.name.trim()) {
      setError("Store name is required");
      return false;
    }
    if (!formData.ownerEmail.trim()) {
      setError("Owner email is required");
      return false;
    }
    if (!formData.ownerEmail.includes("@")) {
      setError("Invalid email address");
      return false;
    }
    return true;
  };

  const handleDeploy = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setStep("provisioning");

    try {
      const response = await fetch("/api/admin/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Provisioning failed");
      }

      const data = await response.json();
      setResult(data);
      setStep("success");
      onSuccess?.(data);
    } catch (err: any) {
      setError(err.message || "Failed to provision storefront");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (step === "success") {
      setFormData({
        domain: "",
        name: "",
        ownerEmail: "",
        ownerName: "",
        plan: "free"
      });
      setStep("form");
      setError(null);
      setResult(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">
              {step === "success" ? "✓ Storefront Deployed" : "Deploy New Storefront"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "form" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDeploy();
              }}
              className="space-y-4"
            >
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  placeholder="e.g., store1.com or store1.localhost"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique domain for the storefront (must be globally unique)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Tech Store"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan
                  </label>
                  <select
                    name="plan"
                    value={formData.plan}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Email
                </label>
                <input
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleInputChange}
                  placeholder="owner@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name (Optional)
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Deploy Storefront
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === "provisioning" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 text-orange-500 animate-spin" />
              <p className="text-lg font-medium text-gray-900">Provisioning new storefront...</p>
              <p className="text-sm text-gray-600">
                This may take a few moments. Please wait.
              </p>
            </div>
          )}

          {step === "success" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">Storefront deployed successfully!</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Tenant ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-300 font-mono text-gray-900 break-all">
                      {result.tenantId}
                    </code>
                    <button
                      onClick={() => handleCopyValue(result.tenantId)}
                      className="p-2 hover:bg-gray-200 rounded transition"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Domain</p>
                  <p className="text-sm text-gray-900 mt-1 font-mono bg-white px-3 py-2 rounded border border-gray-300">
                    {result.domain}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Backend URL</p>
                  <p className="text-sm text-gray-900 mt-1 font-mono bg-white px-3 py-2 rounded border border-gray-300">
                    {result.backendUrl}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">API Key</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-300 font-mono text-gray-900 break-all">
                      {result.apiKey.slice(0, 16)}...
                    </code>
                    <button
                      onClick={() => handleCopyValue(result.apiKey)}
                      className="p-2 hover:bg-gray-200 rounded transition"
                      title={copied ? "Copied!" : "Copy API key"}
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600 mt-1">✓ Copied to clipboard</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">S3 Bucket</p>
                  <p className="text-sm text-gray-900 mt-1 font-mono bg-white px-3 py-2 rounded border border-gray-300">
                    {result.s3Bucket}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 mb-2">Next Steps:</p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Access storefront at <code className="bg-white px-1">{result.domain}</code></li>
                  <li>Configure domain DNS to point to your app</li>
                  <li>Use API key for authenticated requests</li>
                  <li>S3 bucket is ready for asset uploads</li>
                </ul>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
