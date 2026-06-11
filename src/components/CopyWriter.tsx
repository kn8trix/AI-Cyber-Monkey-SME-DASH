import { useState } from "react";
import { CopyGenOutput } from "../types";
import { Loader2, Sparkles, MessageSquareHeart, Check, Copy, Tag, AlignLeft, Volume2, Share2, Award, ListFilter } from "lucide-react";

export default function CopyWriter() {
  const [productName, setProductName] = useState("");
  const [attributes, setAttributes] = useState("");
  const [tone, setTone] = useState("Premium and Professional");
  const [loading, setLoading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"website" | "social" | "features">("website");
  const [generatedCopy, setGeneratedCopy] = useState<CopyGenOutput | null>({
    seoKeywords: ["handmade artisan leather wallet", "minimalist bifold", "sustainable fashion", "rfid blocking accessory"],
    websiteCopy: "Crafted for the modern functionalist, the Classic Bifold Wallet blends timeless elegance with everyday practicality. Each wallet is meticulously hand-stitched from full-grain vegetable-tanned leather that develops a rich, unique patina over time. Designed with a slim profile that nests perfectly in your pocket, it features space-saving internal slots for six credit cards, an adaptable money sleeve, and advanced integrated RFID blocking shielding to ensure your secure data passes through with peace of mind.",
    socialHook: "💼 Redefine your everyday carry. Meet our Artisan Bifold Wallet—classic design made for thin pockets. Hand-stitched full-grain leather that only gets better with age. 🪵✨ Secure yours today and feel the premium leather smell. #EverydayCarry #LeatherCraft #MinimalistStyle #GiftConcept #SMEArtisan",
    featureList: [
      "100% Genuine Full-Grain Vegetable-Tanned Leather",
      "Sleek & Ultra-Slim profile avoiding front-pocket bulging",
      "Built-in Certified RFID Shielding protecting digital identity",
      "Beautiful hand-painted edges for maximum strength over years of wear"
    ]
  });

  const loadPreset = (preset: "wallet" | "charger") => {
    if (preset === "wallet") {
      setProductName("Artisan Leather Care Pack");
      setAttributes("Organic bees wax, natural premium oils, cleans premium leather, prevents dry cracking, fresh lavender scent");
      setTone("Luxury and Warm");
    } else {
      setProductName("Eco-Solar Portable Powerbank");
      setAttributes("15000mAh capacity, waterproof shell, dual quick-charge USB ports, built-in solar panel, bright LED emergency flashlight");
      setTone("Passionate and Energetic");
    }
    setError(null);
  };

  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError("Please key in a Product Name to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, attributes, tone }),
      });

      if (!response.ok) {
        throw new Error("Unable to retrieve descriptions. Please make sure the backend is active.");
      }

      const data = await response.json();
      setGeneratedCopy(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed during generation. Try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6" id="copy_writer_section">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Product Copy & Descriptions
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Instantly generate multi-channel product copy optimized for conversion, SEO ranking, and social engagement.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3 md:mt-0">
          <button
            onClick={() => loadPreset("wallet")}
            className="px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100/50 hover:bg-indigo-100 rounded-lg font-medium transition-all"
          >
            Care Pack Template
          </button>
          <button
            onClick={() => loadPreset("charger")}
            className="px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100/50 hover:bg-indigo-100 rounded-lg font-medium transition-all"
          >
            Solar Pack Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-slate-400" />
            Product Specs & Parameters
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Product Name</label>
            <input
              type="text"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g., Ergonomic Walnut Keyboard Wrist Rest"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Unique Qualities / Key Features (Optional)
            </label>
            <textarea
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[100px]"
              placeholder="e.g., solid walnut wood, cushions wrist tension, slip-resistant base, fine oil finish"
              value={attributes}
              onChange={(e) => setAttributes(e.target.value)}
            />
            <p className="text-[10px] text-slate-400">
              Provide comma-separated keywords or simple bullet points to refine copywriting precision.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Brand Voice & Tone</label>
            <select
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="Premium and Professional">Premium & Professional (Default)</option>
              <option value="Luxury and Warm artisan tone">Luxury & Heritage Artisan</option>
              <option value="Casual, Friendly, and Witty">Casual & Witty Friends</option>
              <option value="Highly Energetic, Bold, and Urgently Persuasive">Bold & High Energy</option>
              <option value="Technical, Informative, and Straightforward">Straightforward Technical</option>
            </select>
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Crafting Optimizations...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Creative Copy
              </>
            )}
          </button>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 space-y-4">
          {generatedCopy ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              {/* Tab Toggles */}
              <div className="flex border-b border-slate-100 bg-slate-50 text-xs px-2 pt-2 gap-1.5">
                <button
                  onClick={() => setActiveTab("website")}
                  className={`px-4 py-2 font-medium rounded-t-lg transition-all flex items-center gap-1.5 ${
                    activeTab === "website"
                      ? "bg-white text-indigo-700 border-t border-x border-slate-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  SEO Website Copy
                </button>
                <button
                  onClick={() => setActiveTab("social")}
                  className={`px-4 py-2 font-medium rounded-t-lg transition-all flex items-center gap-1.5 ${
                    activeTab === "social"
                      ? "bg-white text-indigo-700 border-t border-x border-slate-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Social Hook
                </button>
                <button
                  onClick={() => setActiveTab("features")}
                  className={`px-4 py-2 font-medium rounded-t-lg transition-all flex items-center gap-1.5 ${
                    activeTab === "features"
                      ? "bg-white text-indigo-700 border-t border-x border-slate-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  USP Key Features
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5 flex-1 space-y-4">
                {activeTab === "website" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded tracking-wide uppercase">
                        Product Listing Pitch
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedCopy.websiteCopy, "website")}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 active:scale-95 transition-all rounded"
                        title="Copy text"
                      >
                        {copiedSection === "website" ? (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-normal font-sans">
                      {generatedCopy.websiteCopy}
                    </p>
                  </div>
                )}

                {activeTab === "social" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded tracking-wide uppercase">
                        Social Feed Pitch
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedCopy.socialHook, "social")}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 active:scale-95 transition-all rounded"
                        title="Copy text"
                      >
                        {copiedSection === "social" ? (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-slate-700 text-xs md:text-sm font-mono p-3 bg-amber-50/50 rounded-lg border border-amber-100/50 leading-relaxed whitespace-pre-line">
                      {generatedCopy.socialHook}
                    </p>
                  </div>
                )}

                {activeTab === "features" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded tracking-wide uppercase">
                        Selling Point Bullets
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedCopy.featureList.join("\n"), "features")}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 active:scale-95 transition-all rounded"
                        title="Copy list"
                      >
                        {copiedSection === "features" ? (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <ul className="space-y-2.5">
                      {generatedCopy.featureList.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-700">
                          <span className="flex items-center justify-center p-0.5 bg-indigo-50 text-indigo-700 rounded font-bold text-[10px] mt-0.5 min-w-[20px]">
                            {idx + 1}
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tag Cloud for SEO Keywords */}
              <div className="border-t border-slate-100 p-4 bg-slate-50/60">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  Target SEO Indexing Terms
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {generatedCopy.seoKeywords.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white text-slate-600 border border-slate-200 hover:border-indigo-400 font-normal hover:text-indigo-700 hover:bg-indigo-50/20 text-xs rounded transition-all cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquareHeart className="w-12 h-12 stroke-[1.2] text-slate-300 mb-2 animate-pulse" />
              <p className="font-semibold text-slate-600">Ready to build copy</p>
              <p className="text-xs max-w-sm mt-1">
                Enter product specifications on the left to synthesize localized, high-impact descriptions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
