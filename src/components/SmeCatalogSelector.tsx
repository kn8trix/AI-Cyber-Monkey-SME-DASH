import React, { useState, useEffect } from "react";
import { StorefrontProduct, StorefrontProfile, CopyGenOutput, Competitor, PricingAnalysisOutput, SorterRecord, SorterResult, ConnectedAccount, normalizeTargetSites, withNormalizedTargetSites } from "../types";
import { 
  ArrowLeft, 
  Cpu, 
  Sparkles, 
  TrendingDown, 
  FileText, 
  Database, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  Tag, 
  DollarSign, 
  Package, 
  FileSpreadsheet, 
  TrendingUp, 
  HelpCircle, 
  ArrowUpRight, 
  BadgePercent, 
  ThumbsUp, 
  ThumbsDown, 
  AlertCircle, 
  Loader2, 
  MessageSquareHeart,
  Save,
  CheckCircle2,
  Lock,
  Layers,
  Sparkle,
  Share2,
  Send,
  Instagram,
  Linkedin,
  Twitter,
  Facebook
} from "lucide-react";

interface SmeCatalogSelectorProps {
  products: StorefrontProduct[];
  storefrontProfiles: StorefrontProfile[];
  onUpdateProduct: (prod: StorefrontProduct) => void;
  onAddProduct: (prod: StorefrontProduct) => void;
  onAddLog: (log: string) => void;
}

export default function SmeCatalogSelector({ products, storefrontProfiles, onUpdateProduct, onAddProduct, onAddLog }: SmeCatalogSelectorProps) {
  // Navigation: null if viewing catalog list, otherwise contains selected product id
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // General Filter / Search States for the visual sheet list
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showUploader, setShowUploader] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState("Hardware");
  const [draftBuyingPrice, setDraftBuyingPrice] = useState("0");
  const [draftSellingPrice, setDraftSellingPrice] = useState("0");
  const [draftStockCount, setDraftStockCount] = useState("10");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);

  const activeProduct = products.find(p => p.id === selectedProductId);

  // Unique Categories list
  const allCategories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="visual_catalog_workspace" className="space-y-6">
      {!selectedProductId ? (
        // VIEW A: PRODUCT SPREADSHEET LIST (VISUAL SYSTEM OF THE LIVE SHEETS)
        <div className="space-y-4 animate-fadeIn">
          {/* List Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-100 rounded-2xl">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                Live Sheets Catalog System
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Visualizing all live product records synchronized from our Google Sheets workspace. Click any row/card to run specialized AI models.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowUploader(true);
                  setSelectedTargetIds(storefrontProfiles.map(profile => profile.id));
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
              <input
                type="text"
                placeholder="Search spreadsheets..."
                className="text-xs p-2.5 border border-slate-200 rounded-xl bg-white w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 font-semibold text-slate-700"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Catalog Visual Grid */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="px-6 py-4">Thumbnail & Identity</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Buying Price</th>
                    <th className="px-6 py-4">Selling Price (MSRP)</th>
                    <th className="px-6 py-4 text-center">Profit Margin</th>
                    <th className="px-6 py-4 text-center">Target Stores</th>
                    <th className="px-6 py-4 text-center">In Stock</th>
                    <th className="px-6 py-4 text-center">Conversions</th>
                    <th className="px-6 py-4 text-center">Tenant Targeting</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((prod) => {
                      const buyingPriceVal = prod.buyingPrice || 0;
                      const profit = prod.price - buyingPriceVal;
                      const marginPercentage = prod.price > 0 ? Math.round((profit / prod.price) * 100) : 0;
                      const isLowStock = (prod.stockCount ?? 20) < 10;

                      return (
                        <tr 
                          key={prod.id} 
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            onAddLog(`[SESSION] ${new Date().toLocaleTimeString()}: Opened edit page for product "${prod.name}" in MSMD Hub.`);
                          }}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          {/* Name & Photo */}
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-150 overflow-hidden shrink-0 flex items-center justify-center">
                              {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <Cpu className="w-5 h-5 text-orange-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 truncate max-w-[200px] group-hover:text-orange-600 transition-colors">
                                {prod.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                                SKU: {prod.id}
                              </p>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-slate-105 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                              {prod.category}
                            </span>
                          </td>

                          {/* Buying Price */}
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">
                            {buyingPriceVal > 0 ? `$${buyingPriceVal.toFixed(2)}` : (
                              <span className="text-amber-600 select-none bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-100">
                                $0.00 (Unstated)
                              </span>
                            )}
                          </td>

                          {/* Selling Price */}
                          <td className="px-6 py-4 font-mono font-black text-orange-600">
                            ${prod.price.toFixed(2)}
                          </td>

                          {/* Profit Margin */}
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-mono ${marginPercentage > 30 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'}`}>
                                {marginPercentage}% ROI
                              </span>
                              <span className="text-[9px] text-slate-405 font-mono mt-0.5">
                                Profit: ${profit.toFixed(2)}
                              </span>
                            </div>
                          </td>

                          {/* Target Stores (inline string input) */}
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={storefrontProfiles
                                .filter(profile => normalizeTargetSites(prod).includes(profile.id))
                                .map(profile => profile.name)
                                .join(', ')}
                              onChange={(e) => {
                                const typed = e.target.value
                                  .split(',')
                                  .map(part => part.trim())
                                  .filter(Boolean);
                                const nextTargets = storefrontProfiles
                                  .filter(profile => typed.some(name => name.toLowerCase() === profile.name.toLowerCase()))
                                  .map(profile => profile.id);
                                onUpdateProduct(withNormalizedTargetSites({ ...prod, targetSites: nextTargets }));
                              }}
                              placeholder="comma, separated, store, names"
                              className="w-full min-w-[180px] text-[11px] font-mono px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500"
                            />
                          </td>

                          {/* Stock Count */}
                          <td className="px-6 py-4 text-center font-mono">
                            <span className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-slate-850'}`}>
                              {prod.stockCount ?? 25} units
                            </span>
                            {isLowStock && (
                              <span className="block text-[8px] bg-amber-500 text-white font-black uppercase rounded py-0.2 tracking-wider mt-0.5">Low</span>
                            )}
                          </td>

                          {/* Stats conversions */}
                          <td className="px-6 py-4 text-center font-mono">
                            <div className="flex flex-col items-center">
                              <span className="font-semibold text-slate-700">{prod.salesCount} sold</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">({prod.viewsCount} clicks)</span>
                            </div>
                          </td>

                          {/* Tenant Sync */}
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-wrap justify-center gap-1.5">
                              {storefrontProfiles.map(profile => {
                                const targetSites = normalizeTargetSites(prod);
                                const checked = targetSites.includes(profile.id);
                                return (
                                  <label key={profile.id} className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2 py-1 cursor-pointer hover:bg-orange-50 hover:border-orange-200">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const nextTargets = checked
                                          ? targetSites.filter(id => id !== profile.id)
                                          : [...targetSites, profile.id];
                                        onUpdateProduct(withNormalizedTargetSites({ ...prod, targetSites: nextTargets }));
                                      }}
                                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    {profile.name}
                                  </label>
                                );
                              })}
                            </div>
                          </td>

                          {/* Action Action */}
                          <td className="px-6 py-4 text-right">
                            <button className="px-3 py-1 bg-slate-100 hover:bg-orange-500 hover:text-white border border-slate-205 rounded-xl font-bold text-[11px] transition-colors cursor-pointer group-hover:border-orange-500">
                              Open Detail Hub
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400 italic">
                        No product spreadsheets matched your filtering.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom aggregate indicator summary */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-150 text-[10px] text-slate-400 font-mono flex flex-wrap justify-between items-center gap-2">
              <span>Displaying {filteredProducts.length} of {products.length} catalog items</span>
              <span className="flex items-center gap-1.5 font-bold uppercase text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-505" />
                Live synchronization working
              </span>
            </div>
          </div>

          {showUploader && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-2xl rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Product Uploader</h3>
                    <p className="text-xs text-slate-500">Add a catalog item and choose which tenant storefronts should see it.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUploader(false)}
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-700">Product name
                    <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Category
                    <input value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Buying price
                    <input type="number" min="0" step="0.01" value={draftBuyingPrice} onChange={(e) => setDraftBuyingPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Selling price
                    <input type="number" min="0" step="0.01" value={draftSellingPrice} onChange={(e) => setDraftSellingPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Stock count
                    <input type="number" min="0" value={draftStockCount} onChange={(e) => setDraftStockCount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Image URL
                    <input value={draftImageUrl} onChange={(e) => setDraftImageUrl(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none" placeholder="https://..." />
                  </label>
                  <label className="md:col-span-2 text-xs font-semibold text-slate-700">Description
                    <textarea rows={3} value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none" />
                  </label>
                </div>

                <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Tenant targeting</p>
                      <p className="text-[11px] text-slate-500">Select which storefronts this new item should be visible on.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTargetIds(storefrontProfiles.map(profile => profile.id))}
                      className="text-[11px] font-semibold text-orange-700 underline underline-offset-4"
                    >
                      Select all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {storefrontProfiles.map(profile => {
                      const checked = selectedTargetIds.includes(profile.id);
                      return (
                        <label key={profile.id} className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-xs">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedTargetIds(current =>
                                checked ? current.filter(id => id !== profile.id) : [...current, profile.id]
                              );
                            }}
                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                          />
                          {profile.name}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploader(false)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmedName = draftName.trim();
                      if (!trimmedName) {
                        alert("Please provide a product name before saving.");
                        return;
                      }

                      const normalizedTargets: string[] = Array.from(new Set(selectedTargetIds.filter((id): id is string => Boolean(id))));
                      const newProduct = withNormalizedTargetSites({
                        id: `p_uploader_${Date.now().toString().slice(-6)}`,
                        name: trimmedName,
                        price: Math.max(0.01, Number(draftSellingPrice) || 0.01),
                        category: draftCategory.trim() || "General",
                        desc: draftDesc.trim() || "Newly uploaded product added from the catalog uploader.",
                        salesCount: 0,
                        viewsCount: 0,
                        buyingPrice: Math.max(0, Number(draftBuyingPrice) || 0),
                        stockCount: Math.max(0, Number(draftStockCount) || 0),
                        imageUrl: draftImageUrl.trim() || "",
                        targetSites: normalizedTargets,
                        targetWebsites: normalizedTargets,
                      });

                      onAddProduct(newProduct);
                      onAddLog(`[CATALOG-UPLOAD] ${new Date().toLocaleTimeString()}: Added new product "${trimmedName}" to the shared catalog with ${normalizedTargets.length || "all"} tenant target(s).`);
                      setShowUploader(false);
                      setDraftName("");
                      setDraftCategory("Hardware");
                      setDraftBuyingPrice("0");
                      setDraftSellingPrice("0");
                      setDraftStockCount("10");
                      setDraftDesc("");
                      setDraftImageUrl("");
                      setSelectedTargetIds(storefrontProfiles.map(profile => profile.id));
                    }}
                    className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white hover:bg-orange-700"
                  >
                    Save Product
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // VIEW B: MULTI-PURPOSE PRODUCT PAGE / WORKSPACE HUB FOR THE DIRECT PRODUCT
        <ProductPageDetail 
          product={activeProduct!} 
          onBack={() => setSelectedProductId(null)}
          onUpdateProduct={(up) => {
            onUpdateProduct(up);
          }}
          onAddLog={onAddLog}
        />
      )}
    </div>
  );
}

// ======================== PRODUCT DETAIL HUB SUB-COMPONENT ========================
interface ProductPageDetailProps {
  product: StorefrontProduct;
  onBack: () => void;
  onUpdateProduct: (p: StorefrontProduct) => void;
  onAddLog: (log: string) => void;
}

function ProductPageDetail({ product, onBack, onUpdateProduct, onAddLog }: ProductPageDetailProps) {
  // Local editable parameters
  const [localName, setLocalName] = useState(product.name);
  const [localCategory, setLocalCategory] = useState(product.category);
  const [localDesc, setLocalDesc] = useState(product.desc);
  const [localBuyingPrice, setLocalBuyingPrice] = useState(product.buyingPrice || 0);
  const [localSellingPrice, setLocalSellingPrice] = useState(product.price);
  const [localStockCount, setLocalStockCount] = useState(product.stockCount ?? 20);
  const [localImageUrl, setLocalImageUrl] = useState(product.imageUrl || "");

  const [savingFlag, setSavingFlag] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync state if products list updates from parent
  useEffect(() => {
    setLocalName(product.name);
    setLocalCategory(product.category);
    setLocalDesc(product.desc);
    setLocalBuyingPrice(product.buyingPrice || 0);
    setLocalSellingPrice(product.price);
    setLocalStockCount(product.stockCount ?? 20);
    setLocalImageUrl(product.imageUrl || "");
  }, [product]);

  // Calculations
  const calculatedProfit = localSellingPrice - localBuyingPrice;
  const calculatedROI = localSellingPrice > 0 ? Math.round((calculatedProfit / localSellingPrice) * 100) : 0;

  // Active AI Tool inside product page
  const [activeTab, setActiveTab] = useState<"copywriter" | "pricing" | "feedbacks" | "social">("copywriter");

  // ==================== INNER INTEGRATED AI TOOL 4: SOCIAL MEDIA DEPLOYER ====================
  const [socialPlatform, setSocialPlatform] = useState<"instagram" | "linkedin" | "twitter" | "facebook">("instagram");
  const [socialTone, setSocialTone] = useState("Excited and Bold");
  const [socialDescription, setSocialDescription] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [socialCopyText, setSocialCopyText] = useState("");
  const [socialHashtags, setSocialHashtags] = useState<string[]>([]);
  const [socialVisualAdvice, setSocialVisualAdvice] = useState("");
  const [socialImage, setSocialImage] = useState(product.imageUrl || "");
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);

  // Default suggestions for social layout
  const [socialPostsHistory, setSocialPostsHistory] = useState<Array<{
    id: string;
    platform: "instagram" | "linkedin" | "twitter" | "facebook";
    caption: string;
    image: string;
    date: string;
    status: "Published" | "Scheduled";
  }>>([
    {
      id: "SOC-101",
      platform: "instagram",
      caption: `🔥 Introducing the all-new ${localName}! Crafted with premium quality and extreme passion. Get Yours today and grab a 10% discount using code GSheetsLaunch! 🚀🛍️`,
      image: localImageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400",
      date: "Yesterday, 3:45 PM",
      status: "Published"
    }
  ]);

  // Connected Social Accounts Management State
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(() => {
    const saved = localStorage.getItem("sme_connected_accounts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: "ACC-001",
        name: "Hub Merchant Official",
        tag: "@hub_merchant_launches",
        platform: "instagram",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120",
        status: "Connected",
        scopes: ["instagram_basic", "instagram_content_publish"],
        tokenHint: "ig_usr_live_active_9082",
        createdAt: "2026-05-10"
      },
      {
        id: "ACC-002",
        name: "SME Digital Ventures",
        tag: "SME Corporate Group",
        platform: "linkedin",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120&h=120",
        status: "Connected",
        scopes: ["w_member_social", "r_liteprofile"],
        tokenHint: "li_oauth_live_active_3112",
        createdAt: "2026-05-18"
      },
      {
        id: "ACC-003",
        name: "Hub Merchant X",
        tag: "@HubMerchantNow",
        platform: "twitter",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120",
        status: "Connected",
        scopes: ["tweet.read", "tweet.write"],
        tokenHint: "x_tok_live_active_8891",
        createdAt: "2026-05-25"
      }
    ];
  });

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem("sme_connected_accounts", JSON.stringify(connectedAccounts));
  }, [connectedAccounts]);

  // Account addition state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccPlatform, setNewAccPlatform] = useState<"instagram" | "linkedin" | "twitter" | "facebook">("instagram");
  const [newAccName, setNewAccName] = useState("");
  const [newAccTag, setNewAccTag] = useState("");
  const [newAccToken, setNewAccToken] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Active selected account ID to deploy to (Defaults to matching platform account)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // Sync selected account when platform or list of accounts change
  useEffect(() => {
    const matching = connectedAccounts.filter(acc => acc.platform === socialPlatform);
    if (matching.length > 0) {
      setSelectedAccountId(matching[0].id);
    } else {
      setSelectedAccountId("");
    }
  }, [socialPlatform, connectedAccounts]);

  const handleConnectNewAccount = () => {
    if (!newAccName || !newAccTag) {
      alert("Please provide human-friendly Profile Name and Handle/Username.");
      return;
    }
    
    setIsAuthorizing(true);
    // Simulate real OAuth secure handshake
    setTimeout(() => {
      const generatedId = `ACC-${Math.floor(100 + Math.random() * 900)}`;
      const avatars = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120&h=120",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120"
      ];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      
      const newAccount: ConnectedAccount = {
        id: generatedId,
        name: newAccName,
        tag: newAccTag.startsWith("@") || newAccPlatform === "linkedin" || newAccPlatform === "facebook" ? newAccTag : `@${newAccTag}`,
        platform: newAccPlatform,
        avatar: randomAvatar,
        status: "Connected",
        scopes: newAccPlatform === "instagram" ? ["instagram_basic", "instagram_content_publish"] : 
                newAccPlatform === "linkedin" ? ["w_member_social", "r_liteprofile"] :
                newAccPlatform === "twitter" ? ["tweet.read", "tweet.write"] : ["pages_manage_posts", "pages_publish_posts"],
        tokenHint: `${newAccPlatform.slice(0, 2)}_tok_` + (newAccToken ? newAccToken.slice(0, 4) + "••••" : "oauth_handshake_" + Math.random().toString(36).slice(2, 6)),
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      setConnectedAccounts(prev => [...prev, newAccount]);
      setIsAuthorizing(false);
      setShowAddAccountModal(false);
      
      // Reset fields
      setNewAccName("");
      setNewAccTag("");
      setNewAccToken("");
      
      onAddLog(`[CONNECTION-HUB] ${new Date().toLocaleTimeString()}: Connected new ${newAccPlatform.toUpperCase()} profile "${newAccount.name}" (${newAccount.tag}) successfully via simulated OAuth flow.`);
    }, 1200);
  };

  const handleDeleteAccount = (accId: string, accName: string) => {
    if (confirm(`Are you sure you want to disconnect and delete the profile "${accName}"?`)) {
      setConnectedAccounts(prev => prev.filter(a => a.id !== accId));
      onAddLog(`[CONNECTION-HUB] ${new Date().toLocaleTimeString()}: Disconnected and removed credential node for profile "${accName}" (${accId}).`);
    }
  };

  // Sync social photo on product changes OR state change
  useEffect(() => {
    setSocialImage(product.imageUrl || "");
    setSocialCopyText("");
    setSocialHashtags([]);
    setSocialVisualAdvice("");
  }, [product.id]);

  const handleGenerateSocialPost = async () => {
    setSocialLoading(true);
    setSocialError(null);
    try {
      const response = await fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: localName,
          description: socialDescription || localDesc,
          platform: socialPlatform,
          tone: socialTone,
          price: localSellingPrice
        })
      });

      if (!response.ok) {
        throw new Error("Unable to generate social post. Please check standard connection.");
      }

      const data = await response.json();
      setSocialCopyText(data.caption);
      setSocialHashtags(data.suggestedHashtags || []);
      setSocialVisualAdvice(data.visualThemeAdvice || "");
      
      onAddLog(`[SOCIAL-AI] ${new Date().toLocaleTimeString()}: Generated a tailored social post draft on ${socialPlatform} for "${localName}".`);
    } catch (err: any) {
      console.error(err);
      setSocialError(err.message || "Failed generating organic promotional post.");
    } finally {
      setSocialLoading(false);
    }
  };

  const handleDeploySocialPost = () => {
    if (!socialCopyText) return;

    // Find the active selected account to target specifically
    const activeAccount = connectedAccounts.find(acc => acc.id === selectedAccountId);
    const accountName = activeAccount ? activeAccount.name : "Hub_Merchant";
    const accountTag = activeAccount ? activeAccount.tag : "@hub_merchant";

    setDeployLoading(true);
    setTimeout(() => {
      setDeployLoading(false);
      setDeploySuccess(true);
      
      const newPostId = `SOC-${Math.floor(100 + Math.random() * 900)}`;
      const nowStr = "Just now";
      
      setSocialPostsHistory([
        {
          id: newPostId,
          platform: socialPlatform,
          caption: socialCopyText,
          image: socialImage || localImageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400",
          date: nowStr,
          status: "Published"
        },
        ...socialPostsHistory
      ]);

      // Add to workspace logs!
      onAddLog(`[SOCIAL-DEPLOYER] ${new Date().toLocaleTimeString()}: Successfully deployed promotions for "${localName}" directly to ${socialPlatform.toUpperCase()} profile "${accountName}" (${accountTag})! (Record: ${newPostId})`);
      
      setTimeout(() => setDeploySuccess(false), 3500);
    }, 1500);
  };

  // Save/Update sheet state callback
  const handleSaveData = () => {
    setSavingFlag(true);
    setTimeout(() => {
      onUpdateProduct({
        ...product,
        name: localName,
        category: localCategory,
        desc: localDesc,
        buyingPrice: localBuyingPrice,
        price: localSellingPrice,
        stockCount: localStockCount,
        imageUrl: localImageUrl
      });
      setSavingFlag(false);
      setIsSavedRecently(true);
      onAddLog(`[SHEETS-SYNC] ${new Date().toLocaleTimeString()}: Synchronized edits for "${localName}" directly into live spreadsheets.`);
      setTimeout(() => setIsSavedRecently(false), 3000);
    }, 450);
  };

  // ==================== INNER INTEGRATED AI TOOL 1: COPYWRITER ====================
  const [copyAttributes, setCopyAttributes] = useState("");
  const [copyTone, setCopyTone] = useState("Premium and Professional");
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyCopiedSection, setCopyCopiedSection] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copyActiveTab, setCopyActiveTab] = useState<"website" | "social" | "features">("website");
  const [generatedCopy, setGeneratedCopy] = useState<CopyGenOutput | null>(null);

  // Auto pre-fill attributes based on existing product description
  useEffect(() => {
    setCopyAttributes("");
    setGeneratedCopy(null);
  }, [product.id]);

  const handleGenerateCopywriter = async () => {
    setCopyLoading(true);
    setCopyError(null);
    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productName: localName, 
          attributes: copyAttributes || localDesc, 
          tone: copyTone 
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to retrieve descriptions. Please make sure the backend is active.");
      }

      const data = await response.json();
      setGeneratedCopy(data);
      onAddLog(`[AI-COPYWRITER] ${new Date().toLocaleTimeString()}: Refined and generated marketing copy blocks for product "${localName}".`);
    } catch (err: any) {
      console.error(err);
      setCopyError(err.message || "Failed during generation. Try again shortly.");
    } finally {
      setCopyLoading(false);
    }
  };

  const handleApplyDescriptionCopy = () => {
    if (!generatedCopy) return;
    setLocalDesc(generatedCopy.websiteCopy);
    onAddLog(`[AI-COPYWRITER] ${new Date().toLocaleTimeString()}: Embedded and overwrote product description using newly generated web copy.`);
    // Quick blink trigger for saving helper
    const targetDesc = document.getElementById("field_desc");
    if (targetDesc) {
      targetDesc.classList.add("ring-2", "ring-emerald-500/50");
      setTimeout(() => targetDesc.classList.remove("ring-2", "ring-emerald-500/50"), 1000);
    }
  };

  // ==================== INNER INTEGRATED AI TOOL 2: OPTIONAL SMART PRICING ====================
  const [enableSmartPricing, setEnableSmartPricing] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { name: "EcoVolume Inc", price: localSellingPrice * 1.15 },
    { name: "Minimalist Craft Ltd", price: localSellingPrice * 0.95 }
  ]);
  const [newCompName, setNewCompName] = useState("");
  const [newCompPrice, setNewCompPrice] = useState("");
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysisOutput | null>(null);
  const [appliedPricingFlag, setAppliedPricingFlag] = useState(false);

  const handleAddCompetitor = () => {
    if (!newCompName.trim() || !newCompPrice) return;
    const priceNum = parseFloat(newCompPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;
    setCompetitors([...competitors, { name: newCompName, price: priceNum }]);
    setNewCompName("");
    setNewCompPrice("");
  };

  const handleRemoveCompetitor = (idx: number) => {
    setCompetitors(competitors.filter((_, i) => i !== idx));
  };

  const handleRunPricingAnalysis = async () => {
    setPricingLoading(true);
    setPricingError(null);
    try {
      const response = await fetch("/api/pricing-competition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: localName,
          currentPrice: localSellingPrice,
          competitorPrices: competitors,
          uniqueSells: localDesc
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to analyze pricing. Ensure server is running properly.");
      }

      const data: PricingAnalysisOutput = await response.json();
      setPricingAnalysis(data);
      onAddLog(`[AI-PRICER] ${new Date().toLocaleTimeString()}: Completed pricing matrix scan for "${localName}" comparing immediate markets.`);
    } catch (err: any) {
      console.error(err);
      setPricingError(err.message || "Failed running pricing competition analysis.");
    } finally {
      setPricingLoading(false);
    }
  };

  const handleApplyAIPricing = (targetPrice: number) => {
    setLocalSellingPrice(targetPrice);
    setAppliedPricingFlag(true);
    setTimeout(() => setAppliedPricingFlag(false), 2000);
    onAddLog(`[AI-PRICER] ${new Date().toLocaleTimeString()}: Synchronized suggested competitive selling price constraint ($${targetPrice.toFixed(2)}).`);
    // Blink field
    const targetPriceField = document.getElementById("field_selling_price");
    if (targetPriceField) {
      targetPriceField.classList.add("ring-2", "ring-orange-500/50");
      setTimeout(() => targetPriceField.classList.remove("ring-2", "ring-orange-500/50"), 1000);
    }
  };

  const competitorAvg = competitors.length > 0
    ? competitors.reduce((acc, c) => acc + c.price, 0) / competitors.length
    : 0;
  const maxPriceP = competitors.length > 0 ? Math.max(...competitors.map(c => c.price), localSellingPrice) : 100;
  const minPriceP = competitors.length > 0 ? Math.min(...competitors.map(c => c.price), localSellingPrice) : 0;

  // ==================== INNER INTEGRATED AI TOOL 3: FEEDBACK LOGS & SORTER ====================
  const [feedbackLogs, setFeedbackLogs] = useState(
    `[USER-REVIEW]: Loving my new custom ${localName}! Feels very premium. Highly recommend.\n` +
    `[DISSATISFIED-FEEDBACK]: The packaging of the ${localName} category was slighted. Took over 4 business days to ship.\n` +
    `[SUPPORT]: Inquiry: Can you state the exact raw materials backing the ${localName}? Need eco compliance certifications.`
  );
  const [sorterLoading, setSorterLoading] = useState(false);
  const [sorterResult, setSorterResult] = useState<SorterResult | null>(null);

  const handleRunFeedbackSorter = async () => {
    setSorterLoading(true);
    try {
      const response = await fetch("/api/sort-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: feedbackLogs }),
      });

      if (!response.ok) {
        throw new Error("Sorting failed.");
      }

      const resData = await response.json();
      setSorterResult(resData);
      onAddLog(`[AI-SORTER] ${new Date().toLocaleTimeString()}: Audited negative & positive sentiment lines matching ${localCategory}.`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSorterLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back to spreadsheet trigger */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer text-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live spreadsheet list
        </button>

        <div className="flex items-center gap-2">
          {isSavedRecently && (
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Spreadsheet synchronized
            </span>
          )}
          <button
            onClick={handleSaveData}
            disabled={savingFlag}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-extrabold text-xs text-white rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {savingFlag ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing Sheets...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Commit sheet edits live
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main product card visual banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
        {/* Decorative background grid and icons */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-slate-400">
          <Cpu className="w-60 h-60 animate-pulse" />
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-slate-900 border-2 border-slate-800/80 overflow-hidden shrink-0 flex items-center justify-center">
            {localImageUrl ? (
              <img src={localImageUrl} alt={localName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <Cpu className="w-8 h-8 text-orange-500" />
            )}
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-300 font-extrabold text-[10px] rounded border border-orange-500/30 uppercase tracking-widest">
                {localCategory || "Retail Product"}
              </span>
              <span className="text-slate-500 text-[10px] uppercase font-mono font-bold tracking-widest bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                Item ID: {product.id}
              </span>
            </div>
            <h1 className="text-xl lg:text-3xl font-black tracking-tight truncate text-slate-50">
              {localName}
            </h1>
            <p className="text-xs text-slate-405 leading-relaxed font-normal font-sans max-w-2xl">
              {localDesc || "No dynamic description drafted yet. Click the AI copywriter below to synthesize converting retail content instantly."}
            </p>
          </div>

          {/* Quick specs metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/60 w-full md:w-auto">
            <div className="text-center">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Markup Margin</span>
              <span className="text-lg font-black font-mono text-emerald-400">{calculatedROI}%</span>
            </div>
            <div className="text-center border-l border-slate-800/60 pl-3">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Avg Traffic Click</span>
              <span className="text-lg font-black font-mono text-cyan-405">{product.viewsCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: LIVE SHEET CONFIGURE (DATA EDITOR) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-orange-500" />
              Dynamic Spreadsheet Records
            </h3>
            <span className="text-[9px] font-mono font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Visual Editor Mode
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Field: Product Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Product Title Name</label>
              <input
                type="text"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 font-semibold text-slate-800"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
              />
            </div>

            {/* Field: Product Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Category Sheet Mapping</label>
              <select
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 font-semibold text-slate-700"
                value={localCategory}
                onChange={(e) => setLocalCategory(e.target.value)}
              >
                <option value="Home & Living">Home & Living</option>
                <option value="Consumer Electronics">Consumer Electronics</option>
                <option value="Ecological Gear">Ecological Gear</option>
                <option value="Artisan Crafts">Artisan Crafts</option>
                <option value="Fashion Accessories">Fashion Accessories</option>
              </select>
            </div>

            {/* Grid for Buying and Selling Prices */}
            <div className="grid grid-cols-2 gap-3">
              {/* Field: Buying Price */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  Buying Price (Cost)
                  <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 py-0.2 rounded font-black font-mono">NEW</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full text-xs p-2.5 pl-7 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 font-bold text-slate-700"
                    placeholder="e.g. 15.00"
                    value={localBuyingPrice}
                    onChange={(e) => setLocalBuyingPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Field: Selling Price / Retail MSRP */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Selling Price (MSRP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">$</span>
                  <input
                    id="field_selling_price"
                    type="number"
                    step="0.01"
                    className="w-full text-xs p-2.5 pl-7 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 font-black text-orange-600"
                    value={localSellingPrice}
                    onChange={(e) => setLocalSellingPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Field: Stock Count */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Spreadsheet Stock Counts</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400"><Package className="w-4 h-4" /></span>
                <input
                  type="number"
                  className="w-full text-xs p-2.5 pl-9 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 font-mono font-bold text-slate-800"
                  placeholder="e.g. 24"
                  value={localStockCount}
                  onChange={(e) => setLocalStockCount(parseInt(e.target.value) || 0)}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Controls warning flags and triggers automated product alerts in the catalog flow.</p>
            </div>

            {/* Field: Image URL */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Direct Image / Photograph URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/your-image"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 font-mono text-slate-500 bg-slate-50"
                value={localImageUrl}
                onChange={(e) => setLocalImageUrl(e.target.value)}
              />
            </div>

            {/* Field: Detailed description */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Catalog Front Description Text</label>
              <textarea
                id="field_desc"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 min-h-[110px] leading-relaxed transition-all font-normal text-slate-700 bg-slate-50"
                placeholder="Product attributes listed on the buyer storefront..."
                value={localDesc}
                onChange={(e) => setLocalDesc(e.target.value)}
              />
            </div>

            {/* Pricing dynamic spreadsheet calculator info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 font-mono text-[11px]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-200/60">
                Formula Real-time Cell Outputs
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">Retail Revenue Match (MSRP):</span>
                <span className="font-extrabold text-slate-800">${localSellingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Wholesale Asset Cost (COGS):</span>
                <span className="font-semibold text-indigo-700">${localBuyingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/50 pt-1.5 text-xs">
                <span className="font-bold text-slate-700">Calculated Net profit margin:</span>
                <span className={`font-black font-mono ${calculatedProfit > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  ${calculatedProfit.toFixed(2)} ({calculatedROI}% ROI)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTEGRATED WORKSPACE TOOLS */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Integrated Tool Nav tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-2 shadow-xs">
            <button
              onClick={() => setActiveTab("copywriter")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'copywriter' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Copywriter Tool
            </button>
            
            <button
              onClick={() => setActiveTab("pricing")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'pricing' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              AI Pricing Strategy
            </button>

            <button
              onClick={() => setActiveTab("feedbacks")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'feedbacks' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Database className="w-3.5 h-3.5" />
              AI Log Sorter
            </button>

            <button
              onClick={() => setActiveTab("social")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'social' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Share2 className="w-3.5 h-3.5" />
              Social Deployer
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex-1">
            {/* INNER MODULE A: AI COPYWRITER SPECIFIC TO THIS PRODUCT */}
            {activeTab === "copywriter" && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    AI Copywriter Agent
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Finetunes website metadata, social hooks, and bullet lists matching the unique traits of <span className="font-semibold text-slate-700">{localName}</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Copy config */}
                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Specific Product Attributes</label>
                      <textarea
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl min-h-[90px] focus:outline-none focus:ring-1 focus:ring-orange-500/20 bg-slate-50 font-normal text-slate-700"
                        placeholder="e.g. double layer genuine bamboo fiber, hand carved, fresh timber scent, fully dynamic"
                        value={copyAttributes}
                        onChange={(e) => setCopyAttributes(e.target.value)}
                      />
                      <span className="text-[9px] text-slate-400">If empty, AI will automatically analyze your live storefront description above.</span>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Tone of Delivery voice</label>
                      <select
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500/20 text-slate-700 font-semibold"
                        value={copyTone}
                        onChange={(e) => setCopyTone(e.target.value)}
                      >
                        <option value="Premium and Professional">Premium and Professional</option>
                        <option value="Luxury and Warm artisan legacy tone">Luxury & Heritage Artisan</option>
                        <option value="Playful, witty, and extremely high energy">Witty & High Energy</option>
                        <option value="Technical, straightforward, and highly factual">Factual Technical</option>
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateCopywriter}
                      disabled={copyLoading}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {copyLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Synthesizing creative write-up...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          Generate copywriting copy live
                        </>
                      )}
                    </button>
                  </div>

                  {/* Copy results */}
                  <div className="space-y-3">
                    {generatedCopy ? (
                      <div className="space-y-3">
                        <div className="flex border-b border-slate-100 text-[10px] font-extrabold pb-1.5 gap-2.5 uppercase tracking-wide">
                          <button onClick={() => setCopyActiveTab("website")} className={`pb-1 ${copyActiveTab === 'website' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-400 hover:text-slate-700'}`}>Website Copy</button>
                          <button onClick={() => setCopyActiveTab("social")} className={`pb-1 ${copyActiveTab === 'social' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-400 hover:text-slate-700'}`}>Social Hook</button>
                          <button onClick={() => setCopyActiveTab("features")} className={`pb-1 ${copyActiveTab === 'features' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-400 hover:text-slate-700'}`}>USPs</button>
                        </div>

                        <div className="bg-amber-50/20 border border-amber-100 p-3 rounded-xl min-h-[120px] text-xs text-slate-700 leading-relaxed font-sans overflow-y-auto max-h-[170px]">
                          {copyActiveTab === 'website' && (
                            <p className="whitespace-pre-line">{generatedCopy.websiteCopy}</p>
                          )}
                          {copyActiveTab === 'social' && (
                            <p className="font-mono text-[11px] whitespace-pre-line">{generatedCopy.socialHook}</p>
                          )}
                          {copyActiveTab === 'features' && (
                            <ul className="space-y-1.5 list-disc pl-3">
                              {generatedCopy.featureList.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {copyActiveTab === "website" && (
                          <button
                            onClick={handleApplyDescriptionCopy}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg tracking-wide shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white animate-bounce" />
                            Apply generated copy to description!
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-2xl h-full flex flex-col justify-center items-center p-6 text-center text-slate-400 min-h-[200px]">
                        <MessageSquareHeart className="w-10 h-10 text-slate-350 stroke-[1.2] animate-pulse mb-1.5" />
                        <h4 className="font-bold text-slate-600 text-xs text-slate-500">Awaiting creativity trigger</h4>
                        <p className="text-[10px] text-slate-400 max-w-xs mt-1">Ready to rewrite descriptions. Modify parameters or click "Generate" to let artificial intelligence take write over!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* INNER MODULE B: OPTIONAL COMPETITIVE SMART PRICING ANALYZER */}
            {activeTab === "pricing" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-orange-500" />
                      Smart Competitive Pricing
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Evaluate active competitors and adjust pricing using optimized margin formulas.
                    </p>
                  </div>

                  {/* Optional Toggle */}
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-mono font-black uppercase text-amber-800 tracking-wide">SMART POSITIONER OPTION</span>
                    <button
                      onClick={() => {
                        setEnableSmartPricing(!enableSmartPricing);
                        onAddLog(`[AI-PRICER] ${new Date().toLocaleTimeString()}: Toggled smart pricing status to ${!enableSmartPricing ? "ACTIVE" : "INACTIVE"} for "${localName}".`);
                      }}
                      className={`w-10 h-5.5 rounded-full relative cursor-pointer transition ${enableSmartPricing ? 'bg-orange-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform shadow-xs ${enableSmartPricing ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {!enableSmartPricing ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl min-h-[220px]">
                    <Lock className="w-10 h-10 text-slate-300 stroke-[1] mb-2" />
                    <h4 className="font-semibold text-xs text-slate-600">Smart Pricing Strategy is currently offline</h4>
                    <p className="text-[10.5px] max-w-sm mt-1">This tool lets you track local competitors, view market averages in real-time, and run AI matching. Opt-in using the slider option toggle at the top right.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Competitors and controller info */}
                    <div className="space-y-3.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Configure Regional Competitors</span>
                      
                      <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                        {competitors.map((comp, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-slate-52 rounded-xl border border-slate-100 text-xs">
                            <span className="font-semibold text-slate-700">{comp.name}</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-black text-slate-600">${comp.price.toFixed(2)}</span>
                              <button onClick={() => handleRemoveCompetitor(idx)} className="text-slate-405 hover:text-rose-600 transition cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add competitor controls */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Comp Name"
                          className="p-2 border border-slate-205 rounded-lg bg-white"
                          value={newCompName}
                          onChange={(e) => setNewCompName(e.target.value)}
                        />
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price Value"
                            className="p-2 border border-slate-205 rounded-lg w-full bg-white font-mono"
                            value={newCompPrice}
                            onChange={(e) => setNewCompPrice(e.target.value)}
                          />
                          <button onClick={handleAddCompetitor} className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-lg transition-colors cursor-pointer">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleRunPricingAnalysis}
                        disabled={pricingLoading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {pricingLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing market indices...
                          </>
                        ) : (
                          <>
                            <Sparkle className="w-4 h-4 text-amber-300 animate-spin" />
                            Analyze pricing parameters
                          </>
                        )}
                      </button>
                    </div>

                    {/* Chart / Results display */}
                    <div className="space-y-3">
                      {/* Price Scale Graphics */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-405 block">Market Positioning Map</span>
                        
                        <div className="relative h-10 bg-slate-200/50 border border-slate-300/40 rounded-lg flex items-center px-4">
                          <div className="absolute left-2.5 text-[9px] font-mono leading-none flex flex-col">
                            <span className="text-slate-400">Min</span>
                            <span className="font-extrabold text-slate-600">${minPriceP.toFixed(2)}</span>
                          </div>

                          <div className="flex-1 mx-12 h-1.5 bg-slate-300 rounded relative">
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-orange-600 rounded-full border border-white cursor-pointer group shadow"
                              style={{ 
                                left: `${((localSellingPrice - minPriceP) / (maxPriceP - minPriceP || 1)) * 100}%` 
                              }}
                            >
                              <div className="absolute -top-7 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap opacity-100 font-bold leading-none">
                                ${localSellingPrice.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="absolute right-2.5 text-right text-[9px] font-mono leading-none flex flex-col">
                            <span className="text-slate-400">Max</span>
                            <span className="font-extrabold text-slate-600">${maxPriceP.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Opportunity Gap badge detail */}
                        <div className="flex justify-between text-[11px] font-mono py-1">
                          <span className="text-slate-500">Market Competitor Avg:</span>
                          <span className="font-bold text-slate-800">${competitorAvg.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Applied diagnostic block */}
                      {pricingAnalysis ? (
                        <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl space-y-3 relative overflow-hidden">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">
                            <span className="text-orange-400">{pricingAnalysis.marketPositioning}</span>
                            <span className="text-white/40">AI Advice</span>
                          </div>
                          
                          <p className="text-[10px] text-slate-300 leading-snug font-sans truncate hover:text-white transition">
                            {pricingAnalysis.analysisSummary}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div onClick={() => handleApplyAIPricing(pricingAnalysis.recommendedPrice)} className="cursor-pointer bg-slate-800 hover:bg-slate-750 p-2 rounded-xl border border-slate-700/50 space-y-0.5 text-left select-none transition">
                              <span className="text-[9px] font-bold text-slate-500 block uppercase font-sans">Recommended Price</span>
                              <span className="font-mono text-emerald-400 font-black">${pricingAnalysis.recommendedPrice.toFixed(2)}</span>
                            </div>
                            <div onClick={() => handleApplyAIPricing(pricingAnalysis.promotionalPrice)} className="cursor-pointer bg-slate-800 hover:bg-slate-750 p-2 rounded-xl border border-slate-700/50 space-y-0.5 text-left select-none transition">
                              <span className="text-[9px] font-bold text-slate-500 block uppercase font-sans">Promo Price</span>
                              <span className="font-mono text-cyan-405 font-black">${pricingAnalysis.promotionalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-slate-100 p-3 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center font-mono text-[10px] text-slate-400">
                          <AlertCircle className="w-5 h-5 text-indigo-500 mb-1" />
                          <span>Pricing recommendations awaiting generation. Analyze values to load AI matrices.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* INNER MODULE C: FEEDBACK LOGS & ENRICHMENT AUDITOR */}
            {activeTab === "feedbacks" && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-orange-500" />
                    AI Log Audit & Feedback Sorter
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Examine recent system records, server requests, or client reviews matching category <span className="font-bold text-slate-700">"{localCategory}"</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Logs configure */}
                  <div className="space-y-3.5">
                    <label className="font-bold text-slate-500 uppercase text-[10px] block">Log Records Source Stream</label>
                    <textarea 
                      className="w-full text-xs p-2.5 border border-slate-205 rounded-xl min-h-[110px] focus:outline-none bg-slate-50 font-mono text-slate-600 leading-relaxed"
                      value={feedbackLogs}
                      onChange={(e) => setFeedbackLogs(e.target.value)}
                    />

                    <button
                      onClick={handleRunFeedbackSorter}
                      disabled={sorterLoading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {sorterLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sorting dynamic logs...
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5 text-white" />
                          Categorize associated logs
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sorted displays */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {sorterResult ? (
                      <div className="space-y-2.5">
                        <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-[11px]">
                          <span className="font-extrabold text-emerald-800 block uppercase text-[9px] mb-1">AI Executive Analysis ({sorterResult.dataType})</span>
                          <p className="text-slate-705 leading-normal italic">
                            "{sorterResult.summaryText}"
                          </p>
                        </div>

                        {sorterResult.items.map((it, iIdx) => {
                          const isNegative = it.sentiment.toLowerCase() === 'negative';
                          return (
                            <div key={iIdx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 space-y-1.5 text-xs">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-400 font-mono">REC-{it.id}</span>
                                <span className={`px-2 py-0.5 rounded border ${isNegative ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                  {it.sentiment} sentiment
                                </span>
                              </div>
                              <p className="font-bold text-slate-800 leading-snug">{it.resolvedSummary}</p>
                              <p className="text-[11px] text-slate-500 leading-normal"><span className="font-semibold text-orange-600">Action:</span> {it.actionableInsight}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="border border-slate-100 p-6 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center font-mono text-[10px] text-slate-400 h-full min-h-[170px]">
                        <Database className="w-6 h-6 text-slate-300 stroke-[1.5] mb-1.5 animate-pulse" />
                        <span>Awaiting analysis logs. Trigger Gemini matching above.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* INNER MODULE D: SOCIAL MEDIA DEPLOYER & POST BUILDER */}
            {activeTab === "social" && (() => {
              const activeAccount = connectedAccounts.find(acc => acc.id === selectedAccountId);
              const activeAccountName = activeAccount ? activeAccount.name : "Hub_Merchant";
              const activeAccountTag = activeAccount ? activeAccount.tag : "@hub_merchant";
              const activeAccountAvatar = activeAccount ? activeAccount.avatar : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120";
              
              return (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-orange-500 animate-pulse" />
                        SME Social Media Deployer
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Draft, optimize, and instantly publish campaign updates across multi-channel authenticated accounts.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT: SOCIAL POST BUILDER CONFIGS */}
                    <div className="space-y-4">
                      {/* Platform Selector */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Select Social Network</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: "instagram", name: "Instagram", icon: Instagram, color: "hover:bg-pink-50 text-pink-600 border-pink-100 hover:border-pink-300" },
                            { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "hover:bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300" },
                            { id: "twitter", name: "X / Twitter", icon: Twitter, color: "hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300" },
                            { id: "facebook", name: "Facebook", icon: Facebook, color: "hover:bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-350" }
                          ].map((plat) => {
                            const IconComp = plat.icon;
                            const isSelected = socialPlatform === plat.id;
                            return (
                              <button
                                key={plat.id}
                                onClick={() => {
                                  setSocialPlatform(plat.id as any);
                                  onAddLog(`[SOCIAL] ${new Date().toLocaleTimeString()}: Switched active social target to ${plat.name}.`);
                                }}
                                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-[10px] font-bold gap-1 transition-all cursor-pointer ${
                                  isSelected 
                                    ? "bg-slate-900 border-slate-900 text-white shadow" 
                                    : `bg-slate-50 border-slate-200 ${plat.color}`
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                                <span>{plat.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Connect Profiles selector */}
                      <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                          <label className="text-[10px] font-extrabold uppercase text-slate-550 block tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3 text-indigo-550" />
                            Connected {socialPlatform.toUpperCase()} Profiles
                          </label>
                          <button
                            onClick={() => {
                              setNewAccPlatform(socialPlatform);
                              setShowAddAccountModal(true);
                            }}
                            className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Connect account
                          </button>
                        </div>

                        {connectedAccounts.filter(acc => acc.platform === socialPlatform).length > 0 ? (
                          <div className="space-y-1.5 max-h-[135px] overflow-y-auto pr-1">
                            {connectedAccounts.filter(acc => acc.platform === socialPlatform).map((acc) => {
                              const isChosen = selectedAccountId === acc.id;
                              return (
                                <button
                                  key={acc.id}
                                  onClick={() => setSelectedAccountId(acc.id)}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition ${
                                    isChosen 
                                      ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10" 
                                      : "bg-white border-slate-200 hover:bg-slate-100/50 hover:border-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <img 
                                      src={acc.avatar} 
                                      alt={acc.name} 
                                      referrerPolicy="no-referrer"
                                      className="w-7 h-7 rounded-full object-cover border border-slate-200" 
                                    />
                                    <div className="leading-tight">
                                      <div className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1">
                                        {acc.name}
                                      </div>
                                      <div className="text-[9px] text-slate-400 font-bold font-mono">{acc.tag}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                    <span className="text-[8px] px-1.5 py-0.5 font-bold rounded bg-emerald-50 text-emerald-700 uppercase border border-emerald-100">
                                      Active
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAccount(acc.id, acc.name);
                                      }}
                                      className="p-1 hover:bg-rose-50 rounded text-rose-500 transition hover:text-rose-700 cursor-pointer"
                                      title="Disconnect Account"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-5 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2 bg-white">
                            <p className="text-[10px] text-slate-400 font-bold font-mono">
                              No authenticated {socialPlatform} channels linked.
                            </p>
                            <button
                              onClick={() => {
                                setNewAccPlatform(socialPlatform);
                                setShowAddAccountModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-slate-900 leading-none text-white rounded-lg text-[9px] font-black hover:bg-slate-800 transition cursor-pointer"
                            >
                              + Connect {socialPlatform.toUpperCase()} Account
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Tone select & prompts */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Desired Tone</label>
                          <select
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-slate-700"
                            value={socialTone}
                            onChange={(e) => setSocialTone(e.target.value)}
                          >
                            <option value="Excited and Bold">Excited and Bold</option>
                            <option value="Professional and Trustworthy">Professional and Trustworthy</option>
                            <option value="Witty and Creative">Witty and Creative</option>
                            <option value="Urgent (Flash Sale)">Urgent (Flash Sale)</option>
                            <option value="Storytelling Story">Storytelling</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Custom Guidance (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. mention free shipping"
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium text-slate-700"
                            value={socialDescription}
                            onChange={(e) => setSocialDescription(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Edit post photo link */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Campaign Photo / Graphic Link</label>
                        <input
                          type="text"
                          placeholder="Inherited image url..."
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-505 focus:outline-none"
                          value={socialImage}
                          onChange={(e) => setSocialImage(e.target.value)}
                        />
                      </div>

                      {/* Generate Draft Button */}
                      <button
                        onClick={handleGenerateSocialPost}
                        disabled={socialLoading}
                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {socialLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Synthesizing campaign variables...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate Custom copy with Gemini
                          </>
                        )}
                      </button>

                      {/* Error display */}
                      {socialError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{socialError}</span>
                        </div>
                      )}

                      {/* Gemini advice display if loaded */}
                      {socialVisualAdvice && (
                        <div className="bg-amber-50/40 border border-amber-100 p-3 rounded-xl text-[11px] space-y-1">
                          <span className="font-extrabold text-[9px] uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-amber-600 animate-bounce" />
                            SME Campaign Layout Strategy
                          </span>
                          <p className="text-slate-655 font-medium leading-relaxed italic pr-1">
                            {socialVisualAdvice}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: REAL-TIME DEVICE CAMPAIGN PREVIEW CARD */}
                    <div className="space-y-3.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Platform Live Feed Preview</span>
                      
                      <div className="bg-slate-100 border border-slate-205 rounded-2xl p-4 flex flex-col justify-between max-w-[340px] mx-auto shadow-xs select-none">
                        {/* Live platform Header mockup */}
                        <div className="flex items-center justify-between pb-3 pr-1">
                          <div className="flex items-center gap-2">
                            <img 
                              src={activeAccountAvatar} 
                              alt="Active avatar" 
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full border border-slate-300 object-cover" 
                            />
                            <div className="leading-none">
                              <div className="flex items-center gap-1">
                                <span className="font-extrabold text-[11.5px] text-slate-800 truncate max-w-[140px]">{activeAccountName}</span>
                                <span className="text-blue-500 text-[10px] font-black">✓</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono">{activeAccountTag} • Sponsored</span>
                            </div>
                          </div>
                          <div className="bg-slate-200 border border-slate-300 rounded px-1.5 py-0.5 text-[8px] font-mono font-bold text-slate-500 uppercase">
                            {socialPlatform}
                          </div>
                        </div>

                        {/* Display Picture Preview */}
                        <div className="w-full aspect-square rounded-xl bg-slate-900 border border-slate-200 overflow-hidden flex items-center justify-center relative group shadow-inner">
                          {socialImage || localImageUrl ? (
                            <img 
                              src={socialImage || localImageUrl} 
                              alt="Campaign Preview" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 text-[10px] font-mono">
                              <AlertCircle className="w-6 h-6 text-slate-400 mb-1" />
                              <span>Photo missing. Ensure image URL is valid or uploaded.</span>
                            </div>
                          )}
                          {/* Overlay with pricing indicator */}
                          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white font-black font-mono text-[9px] drop-shadow-md">
                            MSRP: ${localSellingPrice.toFixed(2)}
                          </div>
                        </div>

                        {/* Live Editable Text Caption Area */}
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                            <span>Live Description Copy (Editable)</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(socialCopyText || `Introducing the all-new ${localName}!`);
                                setCopiedSuccess(true);
                                setTimeout(() => setCopiedSuccess(false), 2000);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-0.5"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedSuccess ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          
                          <textarea
                            className="w-full text-[11px] p-2 border border-slate-200 rounded-lg bg-white/70 min-h-[90px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-normal text-slate-700"
                            value={socialCopyText}
                            placeholder={`Write or generate promotional speech regarding your "${localName}" here. Click "Generate" on the left to fill with Gemini automation instantly!`}
                            onChange={(e) => setSocialCopyText(e.target.value)}
                          />

                          {/* Social Hashtags Pills */}
                          {socialHashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {socialHashtags.map((tag, tIdx) => (
                                <span key={tIdx} className="text-[9px] bg-slate-200/60 font-mono font-bold text-slate-600 px-1.5 py-0.5 rounded border border-slate-300/30">
                                  {tag.startsWith('#') ? tag : `#${tag}`}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Deploy Button */}
                          <button
                            onClick={handleDeploySocialPost}
                            disabled={deployLoading || !socialCopyText || !selectedAccountId}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {deployLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Publishing to {activeAccountName}...
                              </>
                            ) : deploySuccess ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-white animate-bounce" />
                                Posted Successfully to {activeAccountName}!
                              </>
                            ) : !selectedAccountId ? (
                              <>
                                <Lock className="w-3 h-3 text-slate-300" />
                                Link a Profile to Publish
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                Publish Now on {activeAccountName} ({activeAccountTag})
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACCOUNT CONNECTIONS MASTER HUB CONTROL BLOCK */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4 shadow-md animate-fadeIn mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5 leading-none">
                          <Lock className="w-3.5 h-3.5 text-indigo-400" />
                          SME Central Identity Tunnel & Authentication Gates
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Secure API pipelines, sandbox key strings, and credentials currently authorized on this workspace.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNewAccPlatform(socialPlatform);
                          setShowAddAccountModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-center shrink-0 leading-none"
                      >
                        <Plus className="w-3.5 h-3.5" /> Connect Another Profile
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {connectedAccounts.map((acc) => {
                        const IconComponent = acc.platform === "instagram" ? Instagram 
                                            : acc.platform === "linkedin" ? Linkedin 
                                            : acc.platform === "twitter" ? Twitter 
                                            : Facebook;
                        return (
                          <div key={acc.id} className="p-3 bg-slate-805/50 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between space-y-2 leading-none relative group transition bg-slate-800/40">
                            <button
                              onClick={() => handleDeleteAccount(acc.id, acc.name)}
                              className="absolute top-2.5 right-2.5 p-1 hover:bg-slate-700 hover:text-rose-450 text-slate-400 rounded transition duration-150 cursor-pointer"
                              title="Disconnect credentials"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            <div className="flex items-center gap-2">
                              <img src={acc.avatar} alt={acc.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                              <div className="min-w-0 pr-4">
                                <p className="text-[11px] font-extrabold text-white truncate">{acc.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold font-mono truncate mt-0.5">{acc.tag}</p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-[8px] font-mono font-semibold">
                                <span className="text-slate-400 uppercase flex items-center gap-1">
                                  <IconComponent className="w-2.5 h-2.5" />
                                  {acc.platform}
                                </span>
                                <span className="text-emerald-400 font-black">● Connected</span>
                              </div>
                              <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                                <span>Established</span>
                                <span>{acc.createdAt}</span>
                              </div>
                              <div className="flex items-center justify-between text-[8px] bg-slate-950 p-1.5 rounded text-neutral-400 font-mono truncate gap-1 w-full">
                                <span className="shrink-0 text-slate-500">ID: {acc.id}</span>
                                <span className="text-[7.5px] text-indigo-400 truncate text-right flex-1">{acc.tokenHint}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* HISTORIC ARCHIVES LIST */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Campaign Execution Logs</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {socialPostsHistory.map((post) => {
                        return (
                          <div key={post.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-2 text-[11px] items-start hover:bg-slate-100/70 transition">
                            <div className="w-10 h-10 rounded bg-slate-200 border overflow-hidden shrink-0">
                              <img src={post.image} alt={post.id} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="min-w-0 flex-1 leading-normal text-slate-600">
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase pb-0.5">
                                <span className="font-mono text-slate-500">{post.id}</span>
                                <span className="font-bold text-emerald-600">{post.platform} • {post.status}</span>
                              </div>
                              <p className="line-clamp-2 text-[10.5px] font-medium text-slate-800 pr-1">
                                {post.caption}
                              </p>
                              <span className="text-[9px] text-slate-400 block pt-0.5">{post.date}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* OAUTH INTEGRATION/HANDSHAKE SIMULATOR MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-600 animate-pulse" />
                  Connect Secure Identity Node
                </h3>
                <p className="text-[10px] text-slate-400">
                  Establish secure publisher credentials using OAuth handshake or developer keys.
                </p>
              </div>
              <button 
                onClick={() => setShowAddAccountModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-705 transition cursor-pointer text-slate-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Platform */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Target Network Platform</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "instagram", name: "Instagram", icon: Instagram },
                    { id: "linkedin", name: "LinkedIn", icon: Linkedin },
                    { id: "twitter", name: "X", icon: Twitter },
                    { id: "facebook", name: "Facebook", icon: Facebook }
                  ].map((p) => {
                    const IconC = p.icon;
                    const isS = newAccPlatform === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNewAccPlatform(p.id as any)}
                        className={`p-2 rounded-lg border-2 text-[9px] font-black flex flex-col items-center justify-center gap-1 transition cursor-pointer ${isS ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-50 border-slate-200 text-slate-750 hover:bg-slate-100"}`}
                      >
                        <IconC className="w-3.5 h-3.5" />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile Name & Tag */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Channel Display Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Baker Elite HQ"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Handle / @Username</label>
                  <input 
                    type="text"
                    placeholder="e.g. baker_elite"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 font-mono"
                    value={newAccTag}
                    onChange={(e) => setNewAccTag(e.target.value)}
                  />
                </div>
              </div>

              {/* Developer Token / Custom Secret key */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Handshake Auth Code / Sandbox Token (Optional)</label>
                <input 
                  type="password"
                  placeholder="••••••••••••••••••••••••"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-505 font-mono text-slate-505"
                  value={newAccToken}
                  onChange={(e) => setNewAccToken(e.target.value)}
                />
                <span className="text-[8px] text-slate-400 italic font-mono block pt-0.5">
                  Defaults to standard development OAuth tunnel handshake.
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="flex-1 py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnectNewAccount}
                disabled={isAuthorizing || !newAccName || !newAccTag}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isAuthorizing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Exchanging OAuth...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Authorize
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
