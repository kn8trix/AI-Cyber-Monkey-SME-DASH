import { useState, useEffect } from "react";
import { AutonomousCrawlEvent, StorefrontProduct } from "../types";
import { Loader2, Sparkles, AlertCircle, RefreshCw, Layers, TrendingUp, CheckCircle, Zap, ShieldAlert, Cpu } from "lucide-react";

interface AutonomousLearningProps {
  products: StorefrontProduct[];
  onApplyUpdates: (updates: any[]) => void;
  autopilotEnabled: boolean;
  onSetAutopilot: (val: boolean) => void;
}

export default function AutonomousLearning({
  products,
  onApplyUpdates,
  autopilotEnabled,
  onSetAutopilot,
}: AutonomousLearningProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // History of learned crawled events
  const [events, setEvents] = useState<AutonomousCrawlEvent[]>([
    {
      timestamp: "Today, 14:12 UTC",
      marketEventTitle: "Sustainable Bamboo Accessories Price Slashed by Competitors",
      marketEventIntensity: "Medium",
      marketEventDescription: "Two major low-cost ecological accessories competitors entered a summer flash promotion on double-walled insulated bamboo bottles, lowering price lines to $29.90. This risks displacing your search query views unless quick adjustment is made.",
      competitorDislocation: "EcoVolume Inc adjusted bamboo drinkware to $29.90, minimalist craft to $31.00.",
      suggestedUpdates: [
        {
          productId: "p2",
          productName: "Bamboo Water Bottle",
          oldPrice: 34.00,
          newPrice: 31.90,
          whyUpdate: "Matching nearest premium competitor to protect high margin while remaining in buyers' consideration bracket.",
          newDescriptorTags: "summer insulated drinkware, sustainable bamboo active, triple wall travel flasks"
        }
      ],
      applied: true
    }
  ]);

  const latestEvent = events[0];

  const handleRunCrawl = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/market-learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProducts: products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          desc: p.desc
        })) }),
      });

      if (!response.ok) {
        throw new Error("Unable to contact autonomous market learner crawler.");
      }

      const rawEvent = await response.json();
      
      const newEvent: AutonomousCrawlEvent = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " UTC",
        marketEventTitle: rawEvent.marketEventTitle,
        marketEventIntensity: rawEvent.marketEventIntensity as "High" | "Medium" | "Low",
        marketEventDescription: rawEvent.marketEventDescription,
        competitorDislocation: rawEvent.competitorDislocation,
        suggestedUpdates: rawEvent.suggestedUpdates,
        applied: autopilotEnabled // Automatically applied if autopilot is ON
      };

      setEvents([newEvent, ...events]);

      // If autopilot is enabled, execute the updates instantly to the products list
      if (autopilotEnabled && newEvent.suggestedUpdates.length > 0) {
        onApplyUpdates(newEvent.suggestedUpdates);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed running autonomous market intelligence crawler.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyManualUpdate = (eventIndex: number) => {
    const targetEvent = events[eventIndex];
    if (!targetEvent || targetEvent.applied) return;

    onApplyUpdates(targetEvent.suggestedUpdates);

    // Mark event as applied in UI memory
    setEvents(events.map((ev, idx) => idx === eventIndex ? { ...ev, applied: true } : ev));
  };

  // If autopilot triggers dynamically
  useEffect(() => {
    if (autopilotEnabled && latestEvent && !latestEvent.applied) {
      onApplyUpdates(latestEvent.suggestedUpdates);
      setEvents(events.map((ev, idx) => idx === 0 ? { ...ev, applied: true } : ev));
    }
  }, [autopilotEnabled]);

  const getIntensityBadge = (intensity: string) => {
    switch (intensity?.toLowerCase()) {
      case "high":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6" id="market_crawler_section">
      {/* Header Layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            Autonomous Market Learner Crawler
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Simulate an active crawler monitoring online competitors, learning from price movements, and updating descriptions dynamically.
          </p>
        </div>

        {/* Autopilot Master Switch */}
        <div className="mt-3 md:mt-0 flex items-center gap-3 bg-indigo-50/50 border border-indigo-100 p-2 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Zap className={`w-3 h-3 ${autopilotEnabled ? "text-indigo-600 fill-indigo-600" : ""}`} />
              Auto-Pilot Sync
            </span>
            <span className="text-xs text-slate-600 font-semibold">
              {autopilotEnabled ? "Autopilot On" : "Approval Required"}
            </span>
          </div>

          <button
            onClick={() => onSetAutopilot(!autopilotEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
              autopilotEnabled ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                autopilotEnabled ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Panel / Active Telemetry Trigger */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              Active Target Scanners
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              When triggered, Gemini simulates an automated micro-bot scanning popular marketplaces, evaluating competitive gaps, identifying inflation peaks, and planning description optimization hooks.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wide block mb-1">Crawl Targeting Vectors</span>
              <ul className="text-xs space-y-1 text-slate-600 font-medium">
                <li>• Search Queries Rank: Accessories</li>
                <li>• Industry Standard Check: Eco/Organic</li>
                <li>• Immediate Competitors Tracker</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {error && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-100 text-rose-700 rounded-lg flex items-start gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              onClick={handleRunCrawl}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Crawling Competition Web...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Force Market Crawl Scan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Crawl Incident Pipeline Timeline */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Crawled Event Registry (Audit Trail)
          </h3>

          <div className="space-y-4">
            {events.map((ev, index) => (
              <div
                key={index}
                className={`bg-white border p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden transition-all duration-300 ${
                  ev.applied ? "border-slate-200" : "border-amber-200 ring-2 ring-amber-100/50"
                }`}
              >
                {/* Event Tag Details */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {ev.timestamp}
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${getIntensityBadge(ev.marketEventIntensity)}`}>
                      {ev.marketEventIntensity} Impact
                    </span>
                  </div>

                  {ev.applied ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Live Website Recalibrated!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                        Awaiting Sync Action
                      </span>
                      <button
                        onClick={() => handleApplyManualUpdate(index)}
                        className="px-3 py-1 font-semibold text-xs text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors cursor-pointer"
                      >
                        Approve Optimization updates
                      </button>
                    </div>
                  )}
                </div>

                {/* Event core information */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-slate-800 leading-snug">
                    {ev.marketEventTitle}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    {ev.marketEventDescription}
                  </p>
                  {ev.competitorDislocation && (
                    <p className="text-[11px] text-slate-400 font-mono italic">
                      Crawled dislocation: "{ev.competitorDislocation}"
                    </p>
                  )}
                </div>

                {/* Automation Proposal actions list */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    AI Auto-Pilot Suggested Tuning Actions:
                  </span>
                  <div className="space-y-2">
                    {ev.suggestedUpdates.map((up, uIdx) => (
                      <div
                        key={uIdx}
                        className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-2.5 rounded-lg border border-slate-150 text-xs shadow-sm"
                      >
                        {/* Summary Column */}
                        <div className="md:col-span-1 border-r border-slate-100/80 pr-1.5 flex flex-col justify-center">
                          <span className="font-semibold text-slate-800 truncate block">
                            {up.productName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {up.productId}
                          </span>
                        </div>

                        {/* Price change list columns */}
                        <div className="md:col-span-1 border-r border-slate-100/80 pr-1.5 flex items-center gap-1 justify-center md:justify-start">
                          <span className="text-slate-400 font-mono line-through">
                            ${up.oldPrice.toFixed(2)}
                          </span>
                          <span className="font-bold text-emerald-600 font-mono">
                            → ${up.newPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* Rational Explanation Columns */}
                        <div className="md:col-span-2 space-y-1 pl-1">
                          <p className="text-[11px] text-slate-500 leading-normal">
                            <span className="font-semibold text-slate-700 uppercase tracking-wide uppercase text-[9px] block">Crawl Logic:</span>
                            {up.whyUpdate}
                          </p>
                          {up.newDescriptorTags && (
                            <p className="text-[10px] text-indigo-700 font-medium">
                              <span className="font-bold">Inject tags:</span> {up.newDescriptorTags}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
