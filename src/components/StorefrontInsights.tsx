import React, { useState } from "react";
import { StorefrontProduct } from "../types";
import { 
  TrendingUp, 
  Eye, 
  Search, 
  DollarSign, 
  ArrowUpRight, 
  Activity, 
  HelpCircle, 
  BarChart4, 
  RefreshCw, 
  Tag, 
  Sparkles,
  ShoppingBag,
  Heart
} from "lucide-react";

interface StorefrontInsightsProps {
  products: StorefrontProduct[];
}

export default function StorefrontInsights({ products }: StorefrontInsightsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  // Stats
  const totalViews = filteredProducts.reduce((acc, p) => acc + p.viewsCount, 0);
  const totalConversions = filteredProducts.reduce((acc, p) => acc + p.salesCount, 0);
  const averageConversionRate = totalViews > 0 
    ? ((totalConversions / totalViews) * 100).toFixed(1)
    : "0.0";

  // Simulated Searched Terms matching active categories/keywords
  const searchTerms = [
    { term: "minimalist durable wallet with rfid protection", count: 850, trend: "+12.4%", pct: 100 },
    { term: "handmade clay terracotta pottery accessories", count: 720, trend: "+8.9%", pct: 85 },
    { term: "organic forest reserve wild wildflower amber honey", count: 640, trend: "+15.3%", pct: 75 },
    { term: "custom coconut polished double walled ecological mugs", count: 520, trend: "+2.1%", pct: 60 },
    { term: "biodegradable jute storage sacks travel golden carrier", count: 480, trend: "-3.4%", pct: 55 },
    { term: "ergonomic workspace solid dark walnut table accessory", count: 420, trend: "+24.8%", pct: 50 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn" id="insights_dashboard_panel">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-100 rounded-2xl">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600 animate-pulse" />
            Intelligence Insights & Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Realtime monitoring of buyer clicks, search traffic queries, and competitive index mapping.
          </p>
        </div>

        {/* Global category scope filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">Category Focus:</span>
          <select
            className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 font-bold text-slate-700"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Clicked On (Views Rate)</span>
            <span className="text-2xl font-black font-mono text-slate-800">{totalViews.toLocaleString()} clicks</span>
            <span className="text-[10px] text-slate-400 block font-medium">Accumulating buyer interactions</span>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Completed Conversions</span>
            <span className="text-2xl font-black font-mono text-slate-800">{totalConversions.toLocaleString()} sold</span>
            <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Sales velocity active
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Average Click Conversion</span>
            <span className="text-2xl font-black font-mono text-slate-800">{averageConversionRate}%</span>
            <span className="text-[10px] text-slate-400 block font-medium">Inquiry-to-purchase probability</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: CLICKED ON SPECTRUM (DUAL COMPARISON CHART) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart4 className="w-4 h-4 text-orange-500" />
                "Clicked On" Customer Attention Spectrum
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Comparing dynamic click view ratios against final retail checkouts per item.</p>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-orange-500 rounded"></span> Clicks (views)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-505 rounded"></span> Purchases (sales)</span>
            </div>
          </div>

          {/* SVG Clustered Grouped Bar Chart */}
          <div className="relative pt-4">
            {filteredProducts.length > 0 ? (
              <div className="space-y-4">
                {/* Scaled comparative bar grid */}
                <div className="space-y-3">
                  {filteredProducts.slice(0, 5).map((prod) => {
                    const maxCountVal = Math.max(...products.map(p => p.viewsCount), 1);
                    const viewsPct = (prod.viewsCount / maxCountVal) * 100;
                    const salesPct = ((prod.salesCount * 5) / maxCountVal) * 100; // Multiplied to visually balance scale weights

                    return (
                      <div key={prod.id} className="space-y-1 text-xs">
                        {/* Labels row */}
                        <div className="flex justify-between font-semibold text-slate-700 font-mono text-[11px]">
                          <span>{prod.name}</span>
                          <span className="text-slate-400 font-medium">({prod.viewsCount} views / {prod.salesCount} conversions)</span>
                        </div>
                        {/* Dual bars row */}
                        <div className="h-6 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-center px-1.5 gap-0.5">
                          {/* Views bar */}
                          <div 
                            className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(viewsPct, 2)}%` }}
                          />
                          {/* Sales completed bar */}
                          <div 
                            className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-555 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(salesPct, 1.5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend indicator help */}
                <p className="text-[10px] text-slate-450 italic font-medium leading-relaxed bg-slate-55 p-3 rounded-xl border border-slate-100">
                  *Purchase units are scaled (5x count) relative to views to enable easy visual alignment analysis of the Conversion ratios on standard screens.
                </p>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 italic">Configure inventory items to stream attention graphs.</div>
            )}
          </div>
        </div>

        {/* CHART 3: SEARCHED FOR CLOUDS (Horizontal Term Analytics) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-4 h-4 text-orange-500 animate-pulse" />
              "Searched For" Buyer Lookup Density
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Most common organic queries guiding active buyers to your catalog items.</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {searchTerms.map((term, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold leading-none">
                  <span className="truncate max-w-[200px] text-slate-705" title={term.term}>
                    {term.term}
                  </span>
                  <div className="flex gap-1.5 items-center font-mono text-[10px] shrink-0">
                    <span className="font-extrabold text-slate-800">{term.count} lookups</span>
                    <span className="text-emerald-700 bg-emerald-50 font-bold rounded border border-emerald-100 px-1 py-0.2">{term.trend}</span>
                  </div>
                </div>
                {/* Horizontal scale */}
                <div className="h-2 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 via-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${term.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 2: COMPETITION LOOKED AT SPECTRUM */}
        <div className="lg:col-span-12 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-orange-500" />
              "Competition Looked At" Competitive Spread Analysis
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Mapping our current list prices relative to immediate competitor spreads. A tighter range indicates pricing compression.</p>
          </div>

          {/* Handcarved spectrum grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {filteredProducts.slice(0, 4).map((prod) => {
              // Simulated competitors for this catalog
              const compPrices = [
                prod.price * 0.9,
                prod.price * 1.05,
                prod.price * 1.15
              ];
              const minVal = Math.min(...compPrices, prod.price);
              const maxVal = Math.max(...compPrices, prod.price);
              const avgComp = compPrices.reduce((acc, c) => acc + c, 0) / compPrices.length;

              return (
                <div key={prod.id} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3.5">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[11px] font-bold text-slate-800 truncate block max-w-[120px]">{prod.name}</span>
                    <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded uppercase border border-indigo-100 shrink-0">
                      ID: {prod.id}
                    </span>
                  </div>

                  {/* Horizontal visual slider spectrum */}
                  <div className="relative h-12 bg-white border border-slate-200/60 rounded-xl flex items-center px-3.5">
                    <div className="absolute left-2.5 text-[8.5px] font-mono leading-none">
                      <span className="text-slate-400 block uppercase font-sans">Min</span>
                      <span className="font-bold text-slate-600">${minVal.toFixed(1)}</span>
                    </div>

                    <div className="flex-1 mx-8.5 h-1.5 bg-slate-200 rounded relative">
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-orange-600 rounded-full border border-white cursor-pointer shadow flex items-center justify-center after:content-[''] after:w-1.5 after:h-1.5 after:bg-white after:rounded-full"
                        style={{ 
                          left: `${((prod.price - minVal) / (maxVal - minVal || 1)) * 100}%` 
                        }}
                        title={`Our Price: $${prod.price}`}
                      />
                    </div>

                    <div className="absolute right-2.5 text-right text-[8.5px] font-mono leading-none">
                      <span className="text-slate-400 block uppercase font-sans">Max</span>
                      <span className="font-bold text-slate-600">${maxVal.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Quick details aggregates */}
                  <div className="flex justify-between items-center text-[10.5px] font-mono font-bold">
                    <span className="text-slate-450 font-normal">Our list Price:</span>
                    <span className="text-orange-600 font-extrabold">${prod.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] font-mono font-bold">
                    <span className="text-slate-450 font-normal">Competitors Avg:</span>
                    <span className="text-slate-650 font-bold">${avgComp.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] font-mono font-bold pt-1.5 border-t border-slate-200/50">
                    <span className="text-slate-500 font-normal">Margin Position:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] uppercase ${prod.price < avgComp ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                      {prod.price < avgComp ? "Under Competitors" : "Premium Tier"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
