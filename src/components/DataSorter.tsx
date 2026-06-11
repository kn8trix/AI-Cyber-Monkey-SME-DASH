import { useState, useEffect } from "react";
import { SorterRecord, SorterResult } from "../types";
import { BASE_SORTED_ITEMS, SANDBOX_RAW_LOGS } from "../data";
import { AlertCircle, ArrowUpDown, ChevronDown, CheckCircle, Database, FileText, Loader2, Sparkles, Filter, RefreshCcw, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";

export default function DataSorter({ initialText }: { initialText?: string }) {
  const [rawText, setRawText] = useState(initialText || "");

  useEffect(() => {
    if (initialText) {
      setRawText(initialText);
    }
  }, [initialText]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SorterResult | null>({
    dataType: "Customer Feedback & Reviews",
    summaryText: "Current feedback shows reliable sentiment on product durability, with a few delivery bottleneck issues from logistics partner.",
    items: BASE_SORTED_ITEMS,
  });

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const loadSandboxLogs = () => {
    setRawText(SANDBOX_RAW_LOGS);
    setError(null);
  };

  const handleAISort = async () => {
    if (!rawText.trim()) {
      setError("Please paste or type raw text first so the AI can sort it.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sort-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Server processing failed.");
      }

      const data: SorterResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during auto-sorting. Please make sure your server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Get unique lists for filtering
  const allCategories = result ? ["All", ...Array.from(new Set(result.items.map(i => i.category)))] : ["All"];

  const filteredItems = result 
    ? result.items.filter(item => {
        const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
        const matchesSentiment = sentimentFilter === "All" || item.sentiment === sentimentFilter;
        const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;
        return matchesCategory && matchesSentiment && matchesPriority;
      })
    : [];

  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "negative":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-rose-100 text-rose-900 font-medium";
      case "medium":
        return "bg-amber-100 text-amber-950 font-medium";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6" id="data_sorter_section">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            AI Automated Data Sorter
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Feed disorganized textual streams into the engine to automatically categorize and extract strategic insights.
          </p>
        </div>
        <button
          onClick={loadSandboxLogs}
          className="mt-3 md:mt-0 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 rounded-lg border border-indigo-100 transition-all flex items-center justify-center gap-1.5"
        >
          <FileText className="w-4 h-4" />
          Load Sandbox Log Samples
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Input Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Paste Raw Enterprise Feed
            </label>
            <p className="text-xs text-slate-400">
              Input system logs, customer chat logs, complaints, or raw list sheets with dates/tags.
            </p>
            <textarea
              className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y font-mono min-h-[220px]"
              placeholder="[LOG-1]: Order delayed by shipper...&#10;Customer complains about sizing issues on medium linen."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />

            {error && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-100 text-rose-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAISort}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/10 cursor-pointer transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auto-Sorting Feed...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Sort Feed with Gemini
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Tabular Data Grid */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <div className="space-y-4">
              {/* Executive Summary Insight Card */}
              <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100/60 p-4 rounded-xl shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                        AI Executive Summary ({result.dataType})
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm mt-1 leading-relaxed font-medium">
                      {result.summaryText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Filters block */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Filters:
                </div>

                {/* Category dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Category:</span>
                  <select
                    className="text-xs font-medium border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Sentiment dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Sentiment:</span>
                  <select
                    className="text-xs font-medium border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={sentimentFilter}
                    onChange={(e) => setSentimentFilter(e.target.value)}
                  >
                    <option value="All">All Sentiments</option>
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>

                {/* Priority dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Priority:</span>
                  <select
                    className="text-xs font-medium border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="All">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Reset filters button */}
                {(categoryFilter !== "All" || sentimentFilter !== "All" || priorityFilter !== "All") && (
                  <button
                    onClick={() => {
                      setCategoryFilter("All");
                      setSentimentFilter("All");
                      setPriorityFilter("All");
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 ml-auto"
                  >
                    <RefreshCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Data Sorter Table Container */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="px-4 py-3 h-10 w-[100px]">ID</th>
                        <th className="px-4 py-3 h-10 min-w-[200px]">Original Text</th>
                        <th className="px-4 py-3 h-10 w-[130px]">Category</th>
                        <th className="px-4 py-3 h-10 w-[110px]">Sentiment</th>
                        <th className="px-4 py-3 h-10 w-[100px]">Priority</th>
                        <th className="px-4 py-3 h-10 min-w-[200px]">AI Resolution Summary & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-500 font-semibold">
                              {item.id}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-xs break-words">
                              {item.originalText}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded border flex items-center gap-1 w-fit ${getSentimentStyle(item.sentiment)}`}>
                                {item.sentiment.toLowerCase() === "positive" ? (
                                  <ThumbsUp className="w-3 h-3" />
                                ) : item.sentiment.toLowerCase() === "negative" ? (
                                  <ThumbsDown className="w-3 h-3" />
                                ) : (
                                  <HelpCircle className="w-3 h-3" />
                                )}
                                {item.sentiment}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs leading-none ${getPriorityStyle(item.priority)}`}>
                                {item.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3 space-y-1">
                              <p className="font-semibold text-slate-800">{item.resolvedSummary}</p>
                              <div className="flex items-center gap-1 text-[11px] text-indigo-600">
                                <span className="font-semibold select-none">Action plan:</span>
                                <span className="text-slate-500">{item.actionableInsight}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">
                            No items fit selected filter combinations.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Displaying {filteredItems.length} of {result.items.length} records</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    AI Sorted Realtime
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 p-12 text-center rounded-xl shadow-sm text-slate-400 space-y-3">
              <Database className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
              <div>
                <p className="font-semibold text-slate-600">No sorting batch analyzed yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Load sandbox logs using the button above or paste raw log lines into the left editor to run automatic categorization.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
