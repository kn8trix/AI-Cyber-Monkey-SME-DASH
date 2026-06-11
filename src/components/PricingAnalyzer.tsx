import { useState } from "react";
import { Competitor, PricingAnalysisOutput, StorefrontProduct } from "../types";
import { DEFAULT_COMPETITORS } from "../data";
import { AlertCircle, Loader2, Sparkles, Plus, Trash2, DollarSign, ArrowUpRight, TrendingDown, ShieldAlert, BadgePercent, Check } from "lucide-react";

interface PricingAnalyzerProps {
  products: StorefrontProduct[];
  onUpdateProductPrice: (id: string, newPrice: number) => void;
}

export default function PricingAnalyzer({ products, onUpdateProductPrice }: PricingAnalyzerProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [competitors, setCompetitors] = useState<Competitor[]>(DEFAULT_COMPETITORS);
  const [newCompName, setNewCompName] = useState("");
  const [newCompPrice, setNewCompPrice] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedPriceId, setAppliedPriceId] = useState<string | null>(null);

  // Default initial analysis output to prevent blank states
  const [analysis, setAnalysis] = useState<PricingAnalysisOutput | null>({
    competitorAverage: 42.83,
    marketPositioning: "Premium High-Value",
    analysisSummary: "Your product is positioned near the peak of the market compared to immediate competitors. This strategy relies heavily on highlighting your organic, handcrafted, or premium attributes. If sales volumes slow, consider introducing micro-promotions or bundling to incentivize first-time buyers who are highly price-sensitive.",
    recommendedPrice: 44.90,
    promotionalPrice: 39.90,
    tacticalAction: "Highlight premium materials (like genuine Italian full-grain leather or RFID-shielding) in top-fold banners is essential to justify this higher range."
  });

  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];

  const handleAddCompetitor = () => {
    if (!newCompName.trim() || !newCompPrice) return;
    const priceNum = parseFloat(newCompPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    setCompetitors([...competitors, { name: newCompName, price: priceNum }]);
    setNewCompName("");
    setNewCompPrice("");
  };

  const handleRemoveCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const handleRunAnalysis = async () => {
    if (!activeProduct) {
      setError("Please select/create a valid product first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pricing-competition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: activeProduct.name,
          currentPrice: activeProduct.price,
          competitorPrices: competitors,
          uniqueSells: activeProduct.desc
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to analyze pricing. Ensure server is running properly.");
      }

      const data: PricingAnalysisOutput = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed running pricing competition analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPrice = (targetPrice: number) => {
    if (!activeProduct) return;
    onUpdateProductPrice(activeProduct.id, targetPrice);
    setAppliedPriceId(activeProduct.id);
    setTimeout(() => setAppliedPriceId(null), 3000);
  };

  // Calculating local stats
  const competitorAvg = competitors.length > 0
    ? competitors.reduce((acc, c) => acc + c.price, 0) / competitors.length
    : 0;

  const maxPriceP = competitors.length > 0 ? Math.max(...competitors.map(c => c.price), activeProduct?.price || 0) : 100;
  const minPriceP = competitors.length > 0 ? Math.min(...competitors.map(c => c.price), activeProduct?.price || 0) : 0;

  return (
    <div className="space-y-6" id="pricing_analyzer_section">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-indigo-600" />
          Pricing Competition & Strategy Analyzer
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Input active competitors and evaluate pricing strategy with AI to maximize profit margins and sales velocity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Parameter Panel (Product + Competitors) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Select Target Product
            </h3>
            <div className="space-y-3">
              <select
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setError(null);
                }}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Current Price: ${p.price.toFixed(2)}
                  </option>
                ))}
              </select>

              {activeProduct && (
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-slate-700">Product Highlight/USP:</p>
                  <p className="text-slate-500 leading-relaxed italic">
                    "{activeProduct.desc}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Immediate Market Competitors
              </h3>
              
              {/* Competitors List */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {competitors.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-700 font-medium">{comp.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-600">${comp.price.toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveCompetitor(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {competitors.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4 italic">No competitors configured yet.</p>
                )}
              </div>

              {/* Add Competitor Controls */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Competitor Name"
                  className="text-xs p-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                />
                <div className="flex gap-1">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-mono inline-block">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      className="w-full text-xs p-2 pl-6 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      value={newCompPrice}
                      onChange={(e) => setNewCompPrice(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAddCompetitor}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="w-full pt-2.5 pb-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing market matrices...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Market Price Match
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Insights & Visual Range Chart Panel */}
        <div className="lg:col-span-7 space-y-4">
          {/* Custom SVG Price Comparison Chart Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Market Range Map</span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded border border-indigo-100 uppercase tracking-wide">
                Live Range Index
              </span>
            </h3>

            {/* Price Scale Graphics */}
            {activeProduct && (
              <div className="space-y-6 pt-2">
                <div className="relative h-14 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4">
                  {/* Min price visual anchor */}
                  <div className="absolute left-4 flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Min competitor</span>
                    <span className="text-xs font-bold text-slate-600 font-mono">${minPriceP.toFixed(2)}</span>
                  </div>

                  {/* Range line slider representation */}
                  <div className="flex-1 mx-28 h-2 bg-slate-200 rounded-full relative">
                    {/* Competitive mid marker */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white cursor-pointer group shadow-sm flex items-center justify-center"
                      style={{ 
                        left: `${((activeProduct.price - minPriceP) / (maxPriceP - minPriceP || 1)) * 100}%` 
                      }}
                    >
                      <div className="absolute -top-10 bg-indigo-950 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        Our Price: ${activeProduct.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Max price visual anchor */}
                  <div className="absolute right-4 text-right flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Max competitor</span>
                    <span className="text-xs font-bold text-slate-600 font-mono">${maxPriceP.toFixed(2)}</span>
                  </div>
                </div>

                {/* Grid metrics details */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Your Current price</span>
                    <span className="text-lg font-extrabold text-slate-700 font-mono mt-1">${activeProduct.price.toFixed(2)}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Competitors Avg</span>
                    <span className="text-lg font-extrabold text-slate-700 font-mono mt-1">${competitorAvg.toFixed(2)}</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100/30 flex flex-col justify-center items-center text-emerald-800">
                    <span className="text-[10px] text-emerald-600 uppercase tracking-wide font-medium">Opportunity Gap</span>
                    <span className="text-lg font-extrabold font-mono mt-1">
                      {activeProduct.price > competitorAvg ? "+" : "-"}
                      ${Math.abs(activeProduct.price - competitorAvg).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Strategy Evaluation Response */}
          {analysis && (
            <div className="bg-slate-900 text-white border border-slate-950 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="w-40 h-40" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-400/20">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider">AI Strategist Positioning Diagnosis</h4>
                    <p className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5 mt-0.5">
                      {analysis.marketPositioning}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                {analysis.analysisSummary}
              </p>

              <div className="bg-white/5 rounded-xl border border-white/5 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recommend Adjustment list */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-300">Target Standard Listing Price</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-emerald-400">${analysis.recommendedPrice.toFixed(2)}</span>
                    <button
                      onClick={() => handleApplyPrice(analysis.recommendedPrice)}
                      className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-400/20 rounded font-semibold active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {appliedPriceId === activeProduct?.id ? <Check className="w-3 h-3" /> : null}
                      Apply Standard Listing
                    </button>
                  </div>
                </div>

                {/* Promotional Price list */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BadgePercent className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-300">Recommended Flash Discount Price</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-indigo-400">${analysis.promotionalPrice.toFixed(2)}</span>
                    <button
                      onClick={() => handleApplyPrice(analysis.promotionalPrice)}
                      className="px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] border border-indigo-400/20 rounded font-semibold active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {appliedPriceId === activeProduct?.id ? <Check className="w-3 h-3" /> : null}
                      Apply Discount Rate
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400/80" />
                  Tactical Action Plan
                </h5>
                <p className="text-xs text-slate-200 mt-1 italic">
                  "{analysis.tacticalAction}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
