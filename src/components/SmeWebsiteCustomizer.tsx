import React, { useState, useEffect, useRef } from "react";
import { StorefrontProfile, StorefrontProduct } from "../types";
import { 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  Type as FontIcon, 
  Grid as LayoutIcon, 
  Check, 
  Globe, 
  ArrowRight,
  Monitor,
  Heart,
  Upload,
  Sun,
  Moon,
  Sliders,
  Eye,
  Trash2,
  FileText,
  MousePointer,
  HelpCircle,
  Tag
} from "lucide-react";

interface SmeWebsiteCustomizerProps {
  profiles: StorefrontProfile[];
  activeProfileId: string;
  onSwitchProfile: (id: string) => void;
  onUpdateProfiles: (updated: StorefrontProfile[]) => void;
  onAddLog: (newLogText: string) => void;
}

const PRESET_FONTS = [
  { id: "sans", name: "Inter / Plus Jakarta Sans", family: "sans-serif" },
  { id: "mono", name: "JetBrains Mono / Sora", family: "monospace" },
  { id: "tech", name: "Space Grotesk", family: "'Space Grotesk', sans-serif" },
  { id: "serif", name: "Playfair Display / Serif", family: "'Playfair Display', serif" },
  { id: "retro", name: "Share Tech Mono", family: "'Share Tech Mono', monospace" }
];

const PRESET_LAYOUTS = [
  { 
    id: "amazon-mega", 
    name: "Amazon-Style Bestseller Mega Grid", 
    desc: "Relentless multi-column grid matrix with massive categories sidebar, top seller announcement banners, and inline ad cards. Highly optimized to hold massive inventory queues." 
  },
  { 
    id: "shopify-clean", 
    name: "Shopify Minimalist Clean Catalog", 
    desc: "Balanced grid structure with thin responsive borders, card-hover shadows, centered titles, and high-visibility badge indicators. The standard of modern online retail clean layouts." 
  },
  { 
    id: "etsy-boho", 
    name: "Etsy Artisanal Boho Staggered Flow", 
    desc: "Warm clay backgrounds, organic card headers in Serifs, dashed board trims, and a pinterest-style masonry staggered layout. Gives items a cozy custom-crafted look." 
  },
  { 
    id: "streetwear-split", 
    name: "Supreme High-Contrast Bold Split", 
    desc: "Asymmetric split layout with heavy borders, thick high-contrast line rules, bold streetwear graphics labels, and dynamic high-opacity display sizes." 
  },
  {
    id: "pinterest-masonry",
    name: "Pinterest-Style Staggered Masonry Grid",
    desc: "Asymmetric fluid grid with columns that shift organically based on card heights. Features elegant display categories, clean borders, and inline action overlays."
  },
  {
    id: "instagram-grid",
    name: "Social Feed Square Showcase",
    desc: "Optimized for visually impactful lifestyle stores. Renders bold, square images with comments simulators, likes badges, and interactive click-to-cart buttons."
  },
  {
    id: "ebay-auction",
    name: "Ebay-Style Listing Rows Layout",
    desc: "High-density row matrix optimized for custom comparative shopping. Features bidding simulator blocks, countdown clock indicators, and instant buy-it-now buttons."
  },
  {
    id: "bento-editorial",
    name: "Bento Grid Editorial Spotlight",
    desc: "Modern block interface where spotlight items occupy double the grid span of normal items. Finished with stylish margins and high-contrast labels."
  }
];

const PRESET_HEAD_LAYOUTS = [
  { 
    id: "minimalist", 
    name: "Minimalist Single Row", 
    desc: "A clean single-row header with compact navigation, premium spacing, and a crisp orange accent line." 
  },
  { 
    id: "centered", 
    name: "Centered Brand Overlay", 
    desc: "A centered brand badge over the hero, ideal for immersive product-first storefronts." 
  },
  { 
    id: "asymmetric", 
    name: "Asymmetric Left Header", 
    desc: "A bold editorial split header with a left-aligned brand column and right-side navigation stack." 
  },
  { 
    id: "sleek-inline", 
    name: "Inline Sleek Commerce Navbar", 
    desc: "Brand logo and navigation links aligned cleanly inline with an integrated fast search bar on the right." 
  },
  { 
    id: "centered", 
    name: "Centered Brand Identity Emblem Layout", 
    desc: "Stacked, classic look with a large centered emoji symbol and bold branding text over centered navigations." 
  },
  { 
    id: "announcement-dense", 
    name: "Mega Retail Heavy Announcement Header", 
    desc: "Highly-dense header featuring a distinct top advertisement ribbon, dynamic filter tabs, and direct contact metrics." 
  },
  { 
    id: "split-logo", 
    name: "Asymmetric Split Editorial Header", 
    desc: "Left-aligned brand columns, navigation categories on the right, punctuated with editorial card frames." 
  }
];

const MOCK_AD_SIMULATIONS = {
  leaderboard: {
    title: "🥤 CYBERMONKEY ENERGY BLITZ",
    desc: "Re-compile your brain. 165mg Synaptic Caffeine. 0g Sugar. Free Delivery.",
    cta: "Order 1 Can"
  },
  native: {
    title: "⚡ Antigravity Deployment Suite",
    desc: "Deploy standalone Isolated websites with zero platform physics drag.",
    cta: "Launch For Free"
  },
  sticker: {
    title: "🏺 Traditional Earthen Pots On Sale - 45% Off with code SANDBOX"
  }
};

export default function SmeWebsiteCustomizer({ 
  profiles, 
  activeProfileId, 
  onSwitchProfile, 
  onUpdateProfiles, 
  onAddLog 
}: SmeWebsiteCustomizerProps) {
  
  const [selectedWebId, setSelectedWebId] = useState(activeProfileId);
  
  // Track draft changes locally so everything updates in the preview frame instantly
  // but only persists to the storefront when they click the 'Save Changes' button!
  const [draftProfile, setDraftProfile] = useState<StorefrontProfile>(() => {
    return profiles.find(p => p.id === selectedWebId) || profiles[0];
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync draft profile whenever the selected focus store changes
  useEffect(() => {
    const freshWeb = profiles.find(p => p.id === selectedWebId) || profiles[0];
    setDraftProfile(freshWeb);
    setHasUnsavedChanges(false);
  }, [selectedWebId, profiles]);

  const targetWeb = draftProfile;

  // Save changes explicitly to storefront profiles (which writes to App level state & localStorage)
  const handleSaveChanges = () => {
    const updatedProfiles = profiles.map(p => {
      if (p.id === selectedWebId) {
        return draftProfile;
      }
      return p;
    });
    onUpdateProfiles(updatedProfiles);
    setHasUnsavedChanges(false);
    onAddLog(`[CUSTOMIZER-SAVE] ${new Date().toLocaleTimeString()}: Successfully saved design and layout modifications for Standalone "${draftProfile.name}" storefront.`);
    setSaveSuccessMessage(`All design edits successfully pushed live to ${draftProfile.name}!`);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 5000);
  };

  // Drag and Drop files visual states
  const [dragBannerActive, setDragBannerActive] = useState(false);
  const [dragLogoActive, setDragLogoActive] = useState(false);
  const [dragFontActive, setDragFontActive] = useState(false);

  // Search filter and responsive preview options on interactive frame
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewCategory, setPreviewCategory] = useState("all");

  // Lazy-initialize fonts configurations if not present
  const initializeFont = (field: "coreFont" | "productFont" | "descFont", defaults: any) => {
    if (!targetWeb[field]) {
      // Create properties
      setTimeout(() => {
        updateDesignField(field, defaults);
      }, 0);
      return defaults;
    }
    return targetWeb[field];
  };

  const coreFont = initializeFont("coreFont", {
    family: "Space Grotesk",
    styleType: "preset",
    color: targetWeb.colorMode === "dark" ? "#f1f5f9" : "#0f172a",
    size: 20,
    opacity: 1,
    weight: "700",
    letterSpacing: "tracking-tight"
  });

  const productFont = initializeFont("productFont", {
    family: "Inter",
    styleType: "preset",
    color: targetWeb.colorMode === "dark" ? "#f8fafc" : "#1e293b",
    size: 15,
    opacity: 1,
    weight: "700",
    letterSpacing: "tracking-normal"
  });

  const descFont = initializeFont("descFont", {
    family: "Inter",
    styleType: "preset",
    color: targetWeb.colorMode === "dark" ? "#94a3b8" : "#475569",
    size: 11,
    opacity: 0.9,
    weight: "400",
    letterSpacing: "tracking-normal"
  });

  // Handle generalized updating of specific storefront profile properties inside local draft state
  const updateDesignField = (field: string, value: any) => {
    setDraftProfile(current => ({
      ...current,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const updateSubFontField = (fontCategory: "coreFont" | "productFont" | "descFont", subField: string, value: any) => {
    const current = targetWeb[fontCategory] || {
      family: "Inter",
      styleType: "preset",
      color: "#000000",
      size: 14,
      opacity: 1,
      weight: "500",
      letterSpacing: "tracking-normal"
    };

    updateDesignField(fontCategory, {
      ...current,
      [subField]: value
    });
  };

  // Upload banner to CDN and store absolute URL
  const handleBannerUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Invalid format. Please upload an image file (PNG, JPG, WEBP).");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("banner", file);

      const tenantId = selectedWebId || targetWeb.id || draftProfile.id;
      const response = await fetch("/api/assets/upload/banner", {
        method: "POST",
        body: formData,
        headers: {
          "X-Tenant-ID": tenantId
        }
      });

      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // Ignore JSON parse failures and fall back to the response status text.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json().catch(() => ({}));
      const safeBannerUrl = data.url || (typeof URL !== 'undefined' ? URL.createObjectURL(file) : targetWeb.bannerUrl);

      // Store absolute CDN URL (or a safe local fallback preview when the CDN path is not available)
      updateDesignField("bannerUrl", safeBannerUrl);
      updateDesignField("heroImageUrl", safeBannerUrl);
      onAddLog(`[CUSTOMIZER] ${new Date().toLocaleTimeString()}: ✓ Banner uploaded to tenant ${tenantId}. URL: ${safeBannerUrl}`);
    } catch (error: any) {
      alert(`Banner upload failed: ${error.message}`);
      console.error("Banner upload error:", error);
    }
  };

  // Upload logo/icon to CDN and store absolute URL
  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Invalid format. Please upload an image file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("icon", file);

      const response = await fetch("/api/assets/upload/icon", {
        method: "POST",
        body: formData,
        headers: {
          "X-Tenant-ID": selectedWebId || ""
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      
      // Store absolute CDN URL
      updateDesignField("customIconUrl", data.url);
      onAddLog(`[CUSTOMIZER] ${new Date().toLocaleTimeString()}: ✓ Logo uploaded to CDN. URL: ${data.url}`);
    } catch (error: any) {
      alert(`Logo upload failed: ${error.message}`);
      console.error("Logo upload error:", error);
    }
  };

  // Custom Font File Uploader
  const handleFontUpload = (file: File) => {
    if (!file.name.endsWith(".ttf") && !file.name.endsWith(".otf") && !file.name.endsWith(".woff") && !file.name.endsWith(".woff2")) {
      alert("Format mismatched. Supports .ttf, .otf, .woff, or .woff2 files.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const cleanFontName = "custom_uploaded_font_" + targetWeb.id;
      
      try {
        // Use Javascript browser FontFace API to dynamically register the uploaded font in the document
        const myFontFace = new FontFace(cleanFontName, arrayBuffer);
        const loadedFace = await myFontFace.load();
        document.fonts.add(loadedFace);
        
        // Update profile
        updateDesignField("customUploadedFontName", cleanFontName);
        updateDesignField("customFont", cleanFontName);
        
        // Push info
        onAddLog(`[CUSTOMIZER] ${new Date().toLocaleTimeString()}: Registered custom FontFace "${cleanFontName}" successfully. Core engine immediately re-compiled stylesheets.`);
        alert(`Font "${file.name}" uploaded, parsed and dynamically registered as: ${cleanFontName}! Ready to apply in core, products, or description settings.`);
      } catch (err) {
        console.error(err);
        alert("Failed to parse and register binary font face in iframe browser context.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Resolve actual font-family string used for inline styles
  const resolveFontFamily = (pFont: string | undefined, uploadedName: string | undefined) => {
    if (!pFont) return "Inter, sans-serif";
    if (pFont === "sans") return "Inter, sans-serif";
    if (pFont === "mono") return "'JetBrains Mono', monospace";
    if (pFont === "tech") return "'Space Grotesk', sans-serif";
    if (pFont === "serif") return "'Playfair Display', serif";
    if (pFont === "retro") return "'Share Tech Mono', monospace";
    if (pFont === uploadedName && uploadedName) return `'${uploadedName}', sans-serif`;
    return pFont;
  };

  // Simulate products generator to test holding "a lot of products"
  const getSimulatedProducts = (): StorefrontProduct[] => {
    let list = targetWeb.products && targetWeb.products.length > 0 ? targetWeb.products : [];
    if (list.length < 6) {
      // Extend with default catalog samples to show how it holds "a lot of products"
      const extras: StorefrontProduct[] = [
        {
          id: "extra-1",
          name: "Sovereign Silicon Core CPU",
          price: 499.00,
          category: "Electronics",
          desc: "Full performance micro-transistors and secure telemetry gateway loops.",
          salesCount: 88,
          viewsCount: 155,
          imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300"
        },
        {
          id: "extra-2",
          name: "Natural Clay Fermented Bowl",
          price: 45.00,
          category: "Clay & Arts",
          desc: "Earthen handcrafted bowl perfect for biological teas or melatonin seeds.",
          salesCount: 13,
          viewsCount: 200,
          imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300"
        },
        {
          id: "extra-3",
          name: "Nordic Soft Linen Pillow",
          price: 65.00,
          category: "Lounge Wear",
          desc: "Organic weaving fabric tailored for ultimate restorative circadian loops.",
          salesCount: 44,
          viewsCount: 310,
          imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300"
        },
        {
          id: "extra-4",
          name: "Industrial Cyber Mug v2",
          price: 29.00,
          category: "Keyboards",
          desc: "Dual-wall titanium insulated mug. Holds 500ml of Extreme Soda.",
          salesCount: 201,
          viewsCount: 809,
          imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300"
        },
        {
          id: "extra-5",
          name: "BioCircadian Ambient Light Ring",
          price: 119.00,
          category: "Virtual Reality",
          desc: "Simulates soft solar spectrum loops to ease nighttime circadian fatigue.",
          salesCount: 93,
          viewsCount: 421,
          imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300"
        },
        {
          id: "extra-6",
          name: "Micro-Suture Bamboo Weaving Brush",
          price: 18.00,
          category: "Clay & Arts",
          desc: "Tapered organic bamboo micro-fibers designed for precise glazing.",
          salesCount: 7,
          viewsCount: 84,
          imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300"
        }
      ];
      list = [...list, ...extras];
    }
    
    // Apply optional filter/search for interactive panel
    return list.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(previewSearch.toLowerCase());
      const matchCategory = previewCategory === "all" || p.category.toLowerCase().includes(previewCategory.toLowerCase());
      return matchSearch && matchCategory;
    });
  };

  const previewProducts = getSimulatedProducts();
  const activeColorMode = targetWeb.colorMode || "light";
  const activeLayout = targetWeb.layoutStyle || "amazon-mega";
  const activeHeadLayout = targetWeb.headLayout || "sleek-inline";

  return (
    <div className="space-y-6 animate-fadeIn" id="workspace_customizer_section">
      
      {/* Branding customized heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-indigo-100 gap-4">
        <div className="text-left flex-1">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span>Standalone Storefront Branding Customizer</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wide">
              CMS V3 Admin
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
            Design independent, isolated stores with custom layouts, custom uploaded assets, visual typography parameter sliders, dark/light modes, and compliant AdSense placements.
          </p>
        </div>

        {/* Dynamic Save Action controls */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {hasUnsavedChanges && (
            <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1.5 rounded-md animate-pulse">
              ● Unsaved Changes
            </span>
          )}
          <button
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer ${
              hasUnsavedChanges
                ? "bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 text-white"
                : "bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed"
            }`}
          >
            <Check className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Success Toaster Block */}
      {saveSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-3.5 rounded-2xl flex items-center justify-between text-xs font-mono font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-emerald-500 text-white rounded-full text-[10px] font-black font-sans leading-none">✓ SUCCESS</span>
            <span>{saveSuccessMessage}</span>
          </div>
          <button onClick={() => setSaveSuccessMessage(null)} className="text-slate-400 hover:text-slate-700 p-1">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CUSTOMIZER PARAMETERS & SLIDERS (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* A. Selector Cards & Basic Swapper */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block font-mono text-left">
              Select Standalone Website to Configure
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {profiles.map((p) => {
                const isSelected = p.id === selectedWebId;
                const isActiveBrowser = p.id === activeProfileId;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedWebId(p.id);
                      onAddLog(`[CUSTOMIZER] Swapped customization focus to Standalone Store "${p.name}".`);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected 
                        ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-[1.01]" 
                        : "bg-slate-50 border-slate-150 hover:bg-white text-slate-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold">{p.customIcon || "⚙️"}</span>
                        <h4 className="text-[11px] font-black truncate max-w-[100px]">{p.name}</h4>
                      </div>
                      <p className={`text-[9px] truncate tracking-tight ${isSelected ? "text-slate-400 font-medium" : "text-slate-500"}`}>
                        {p.tagline}
                      </p>
                    </div>

                    <div className="flex justify-between items-center w-full mt-2 border-t pt-1.5 border-slate-250/30">
                      <span className="text-[8px] font-mono text-indigo-500 font-semibold">{(p.simulatedUrl || "").replace("https://www.", "")}</span>
                      {isActiveBrowser && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active Core Context" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. General Color Schemes, popular Layouts and Header configurations */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-6">
            
            {/* Color Mode / Themes Trigger */}
            <div className="space-y-2.5 text-left">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                Color Preference Mode (Light / Dark)
              </label>
              <p className="text-[10px] text-slate-400">
                Switch between high-contrast light and dark themes. Standalone customer sites instantly re-render background values, catalog margins, and typography palettes accordingly.
              </p>

              <div className="grid grid-cols-2 gap-3.5">
                <button
                  onClick={() => {
                    updateDesignField("colorMode", "light");
                    // Sync default fonts colors if applicable
                    updateSubFontField("coreFont", "color", "#0f172a");
                    updateSubFontField("productFont", "color", "#1e293b");
                    updateSubFontField("descFont", "color", "#475569");
                    onAddLog(`[THEME] Switched "${targetWeb.name}" to high-contrast Light Theme.`);
                  }}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-colors cursor-pointer ${
                    activeColorMode === "light"
                      ? "border-amber-500 bg-amber-50/20 text-amber-900"
                      : "border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600"
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
                  Classic Light Mode
                </button>
                
                <button
                  onClick={() => {
                    updateDesignField("colorMode", "dark");
                    // Sync default fonts colors if applicable
                    updateSubFontField("coreFont", "color", "#f1f5f9");
                    updateSubFontField("productFont", "color", "#f8fafc");
                    updateSubFontField("descFont", "color", "#94a3b8");
                    onAddLog(`[THEME] Switched "${targetWeb.name}" to Cosmic Dark Theme.`);
                  }}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-colors cursor-pointer ${
                    activeColorMode === "dark"
                      ? "border-indigo-600 bg-indigo-950/20 text-indigo-400"
                      : "border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600"
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-500 animate-bounce" />
                  Cosmic Midnight Mode
                </button>
              </div>
            </div>

            <hr className="border-slate-105 border-slate-100" />

            {/* Popular Internet Layout Selector */}
            <div className="space-y-2.5 text-left">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <LayoutIcon className="w-3.5 h-3.5 text-indigo-600" />
                Popular Web Layout Template (Holds 6-12+ Products)
              </label>
              <p className="text-[10px] text-slate-400">
                Apply highly recognizable structures from popular internet retail hubs, designed to elegantly organize massive inventory queues:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_LAYOUTS.map((lay) => {
                  const isPref = activeLayout === lay.id;
                  
                  return (
                    <button
                      key={lay.id}
                      onClick={() => {
                        updateDesignField("layoutStyle", lay.id);
                        onAddLog(`[LAYOUT] Rebuilt storefront structure utilizing template: [${lay.id.toUpperCase()}].`);
                      }}
                      className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer h-full ${
                        isPref
                          ? "border-indigo-600 bg-indigo-50/10"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                          {isPref && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          {lay.name}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-normal font-medium">{lay.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* WEBSITE HEAD LAYOUT SECTIONS */}
            <div className="space-y-2.5 text-left">
              <label className="text-xs font-black text-slate-705 text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                Website Head Layout Structure
              </label>
              <p className="text-[10px] text-slate-400">
                Customize header search blocks, emblem distributions, announcement panels, and routing links positioning to fit specific brand personalities:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_HEAD_LAYOUTS.map((headL) => {
                  const isSelected = activeHeadLayout === headL.id;
                  return (
                    <button
                      key={headL.id}
                      onClick={() => {
                        updateDesignField("headLayout", headL.id);
                        onAddLog(`[HEAD-LAYOUT] Updated header format to [${headL.id.toUpperCase()}].`);
                      }}
                      className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer h-full ${
                        isSelected 
                          ? "border-indigo-600 bg-indigo-50/10" 
                          : "border-slate-105 border-slate-100 hover:border-slate-250 bg-white"
                      }`}
                    >
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        {headL.name}
                      </span>
                      <p className="text-[9px] text-slate-500 leading-normal font-medium mt-1">{headL.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* C. Real Asset Upload Management Zone (BANNER, LOGO, FONTS - No templates!) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block font-mono text-left">
              Upload Custom Branded Assets
            </h3>

            {/* custom Banner file uploader */}
            <div className="space-y-2 text-left">
              <span className="text-[11px] font-bold text-slate-700 block uppercase">
                1. Custom Header Banner File Upload (Drag &amp; Drop)
              </span>
              <p className="text-[10px] text-slate-400 leading-tight">
                Provide your custom brand billboard picture. Drag-and-drop or select an image to override preset header Unsplash photographs instantly.
              </p>
              
              <div 
                className={`border-2 border-dashed rounded-2xl p-4.5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  dragBannerActive 
                    ? "border-indigo-600 bg-indigo-50/20" 
                    : targetWeb.bannerUrl 
                    ? "border-emerald-300 bg-emerald-50/10" 
                    : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragBannerActive(true); }}
                onDragLeave={() => setDragBannerActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragBannerActive(false);
                  if (e.dataTransfer.files?.[0]) handleBannerUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e: any) => {
                    if (e.target.files?.[0]) handleBannerUpload(e.target.files[0]);
                  };
                  input.click();
                }}
              >
                {targetWeb.bannerUrl ? (
                  <div className="space-y-2">
                    <img 
                      src={targetWeb.bannerUrl} 
                      alt="Custom banner uploaded asset" 
                      className="h-16 w-full max-w-sm rounded-lg object-cover mx-auto border" 
                      crossOrigin="anonymous"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                        Active Uploaded Banner
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateDesignField("bannerUrl", undefined);
                          updateDesignField("heroImageUrlUrl", undefined);
                        }}
                        className="p-1 bg-red-100 hover:bg-red-200 rounded text-red-700 cursor-pointer"
                        title="Remove custom banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400" />
                    <div>
                      <span className="text-xs font-bold text-indigo-600 hover:underline">Choose custom banner file</span> or drag here
                    </div>
                    <span className="text-[9px] text-slate-400">Supports PNG, JPG, WEBP formats.</span>
                  </>
                )}
              </div>
            </div>

            {/* Custom Logo upload zone */}
            <div className="space-y-2 border-t border-slate-100 pt-4 text-left">
              <span className="text-[11px] font-bold text-slate-700 block uppercase">
                2. Custom brand Logo glyph / emblem File Upload
              </span>
              
              <div 
                className={`border-2 border-dashed rounded-2xl p-4.5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  dragLogoActive 
                    ? "border-indigo-600 bg-indigo-50/20" 
                    : targetWeb.customIconUrl 
                    ? "border-emerald-300 bg-emerald-50/10" 
                    : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragLogoActive(true); }}
                onDragLeave={() => setDragLogoActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragLogoActive(false);
                  if (e.dataTransfer.files?.[0]) handleLogoUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e: any) => {
                    if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]);
                  };
                  input.click();
                }}
              >
                {targetWeb.customIconUrl ? (
                  <div className="flex items-center justify-center gap-3">
                    <img 
                      src={targetWeb.customIconUrl} 
                      alt="Uploaded brand emblem icon" 
                      className="w-12 h-12 rounded-xl object-contain border bg-white p-1" 
                      crossOrigin="anonymous"
                    />
                    <div className="text-left space-y-1">
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase block">
                        Corporate Emblem Active
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateDesignField("customIconUrl", undefined);
                        }}
                        className="py-0.5 px-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-[8.5px] rounded transition-all font-bold block shrink-0"
                      >
                        Reset Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="text-xs font-bold text-indigo-600 hover:underline">Choose brand logo/icon</span> or drop graphic files
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Custom font binary file uploader */}
            <div className="space-y-2 border-t border-slate-100 pt-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 block uppercase">
                  3. Dynamic Font Face File (.TTF / .OTF / .WOFF) Uploader
                </span>
                {targetWeb.customUploadedFontName && (
                  <span className="text-[8.5px] font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black">
                    Registered: {targetWeb.customUploadedFontName}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Upload your exact corporate typography file. Generates dynamic FontFaces directly inside browser page style tags.
              </p>

              <div 
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  dragFontActive 
                    ? "border-indigo-600 bg-indigo-50/20" 
                    : targetWeb.customUploadedFontName 
                    ? "border-indigo-500/20 bg-indigo-500/5" 
                    : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragFontActive(true); }}
                onDragLeave={() => setDragFontActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragFontActive(false);
                  if (e.dataTransfer.files?.[0]) handleFontUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".ttf,.otf,.woff,.woff2";
                  input.onchange = (e: any) => {
                    if (e.target.files?.[0]) handleFontUpload(e.target.files[0]);
                  };
                  input.click();
                }}
              >
                {targetWeb.customUploadedFontName ? (
                  <div className="space-y-1">
                    <Check className="w-5 h-5 text-indigo-600 mx-auto animate-bounce" />
                    <p className="text-xs font-black text-slate-800">Dynamic Font Engine Loaded!</p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      Font Face applied. Select &quot;Uploaded custom typography&quot; in font category sliders below to experience real-time previewing.
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDesignField("customUploadedFontName", undefined);
                        if (targetWeb.customFont === "custom_uploaded_font_" + targetWeb.id) {
                          updateDesignField("customFont", "sans");
                        }
                      }}
                      className="text-[9px] text-red-600 hover:underline font-bold"
                    >
                      Delete Custom Font Face
                    </button>
                  </div>
                ) : (
                  <>
                    <FontIcon className="w-5 h-5 text-slate-400 mx-auto" />
                    <div>
                      <span className="text-xs font-bold text-indigo-600 hover:underline">Upload Custom Font File</span> or drag TTF/OTF
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* D. Comprehensive Font Parameters Sliders Accordion */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-6">
            <div className="text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                Advanced Font Parameter Sliders
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Customize colors, sizes, letter spacing (tracking), weight and opacity values separately for different elements of the website.
              </p>
            </div>

            {/* 1. Core Fonts Header accordion styling */}
            <div className="space-y-4 border border-slate-100 p-4 rounded-2xl bg-slate-50/50 text-left">
              <div className="flex items-center gap-1.5 border-b pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-extrabold text-slate-900 uppercase">1. Core Website Elements (Header name, Nav, Ribbons)</span>
              </div>

              {/* Font Picker */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Font Family</label>
                  <select
                    value={coreFont.family}
                    onChange={(e) => updateSubFontField("coreFont", "family", e.target.value)}
                    className="w-full text-xs font-semibold p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {PRESET_FONTS.map(f => (
                      <option key={f.id} value={f.family}>{f.name}</option>
                    ))}
                    {targetWeb.customUploadedFontName && (
                      <option value={targetWeb.customUploadedFontName}>★ Uploaded Custom Typography</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Font Color</label>
                  <div className="flex items-center gap-2 bg-white p-1 rounded-lg border">
                    <input 
                      type="color" 
                      value={coreFont.color}
                      onChange={(e) => updateSubFontField("coreFont", "color", e.target.value)}
                      className="w-8 h-6 border-none rounded cursor-pointer"
                    />
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-600">{coreFont.color}</span>
                  </div>
                </div>
              </div>

              {/* Typography Sliders */}
              <div className="grid grid-cols-2 gap-4 pt-1.5">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>FONT SIZE</span>
                    <span>{coreFont.size}px</span>
                  </div>
                  <input 
                    type="range" 
                    min={12} 
                    max={36} 
                    value={coreFont.size}
                    onChange={(e) => updateSubFontField("coreFont", "size", parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>OPACITY</span>
                    <span>{Math.round(coreFont.opacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={10} 
                    max={100} 
                    value={coreFont.opacity * 100}
                    onChange={(e) => updateSubFontField("coreFont", "opacity", parseFloat(e.target.value) / 100)}
                    className="w-full h-1 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              {/* Weight & Letter spacing */}
              <div className="grid grid-cols-2 gap-3 pt-1.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Font Weight</label>
                  <select
                    value={coreFont.weight}
                    onChange={(e) => updateSubFontField("coreFont", "weight", e.target.value)}
                    className="w-full text-[10px] font-bold p-1 bg-white border border-slate-200 rounded focus:outline-none"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="700">Bold (700)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Letter Spacing (Tracking)</label>
                  <select
                    value={coreFont.letterSpacing}
                    onChange={(e) => updateSubFontField("coreFont", "letterSpacing", e.target.value)}
                    className="w-full text-[10px] font-bold p-1 bg-white border border-slate-200 rounded focus:outline-none"
                  >
                    <option value="tracking-tighter">Ultra Narrow (Tighter)</option>
                    <option value="tracking-tight">Cosplay tight (Tight)</option>
                    <option value="tracking-normal">Universal (Normal)</option>
                    <option value="tracking-wide">Executive Broad (Wide)</option>
                    <option value="tracking-widest">Atmosphere Space (Widest)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Product Name fonts Accordion style settings */}
            <div className="space-y-4 border border-slate-100 p-4 rounded-2xl bg-slate-50/50 text-left">
              <div className="flex items-center gap-1.5 border-b pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-extrabold text-slate-900 uppercase">2. Product Titles &amp; Catalog Cards Headlines</span>
              </div>

              {/* Font family & Color */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Font Family</label>
                  <select
                    value={productFont.family}
                    onChange={(e) => updateSubFontField("productFont", "family", e.target.value)}
                    className="w-full text-xs font-semibold p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {PRESET_FONTS.map(f => (
                      <option key={f.id} value={f.family}>{f.name}</option>
                    ))}
                    {targetWeb.customUploadedFontName && (
                      <option value={targetWeb.customUploadedFontName}>★ Uploaded Custom Typography</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Font Color</label>
                  <div className="flex items-center gap-2 bg-white p-1 rounded-lg border">
                    <input 
                      type="color" 
                      value={productFont.color}
                      onChange={(e) => updateSubFontField("productFont", "color", e.target.value)}
                      className="w-8 h-6 border-none rounded cursor-pointer"
                    />
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-600">{productFont.color}</span>
                  </div>
                </div>
              </div>

              {/* Typo Sliders */}
              <div className="grid grid-cols-2 gap-4 pt-1.5">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>FONT SIZE</span>
                    <span>{productFont.size}px</span>
                  </div>
                  <input 
                    type="range" 
                    min={11} 
                    max={28} 
                    value={productFont.size}
                    onChange={(e) => updateSubFontField("productFont", "size", parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>OPACITY</span>
                    <span>{Math.round(productFont.opacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={10} 
                    max={100} 
                    value={productFont.opacity * 100}
                    onChange={(e) => updateSubFontField("productFont", "opacity", parseFloat(e.target.value) / 100)}
                    className="w-full h-1 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Weight & Letter spacing */}
              <div className="grid grid-cols-2 gap-3 pt-1.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Font Weight</label>
                  <select
                    value={productFont.weight}
                    onChange={(e) => updateSubFontField("productFont", "weight", e.target.value)}
                    className="w-full text-[10px] font-bold p-1 bg-white border border-slate-200 rounded focus:outline-none"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="700">Bold (700)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Letter Spacing (Tracking)</label>
                  <select
                    value={productFont.letterSpacing}
                    onChange={(e) => updateSubFontField("productFont", "letterSpacing", e.target.value)}
                    className="w-full text-[10px] font-bold p-1 bg-white border border-slate-200 rounded focus:outline-none"
                  >
                    <option value="tracking-tighter">Ultra Narrow (Tighter)</option>
                    <option value="tracking-tight">Cosplay tight (Tight)</option>
                    <option value="tracking-normal">Universal (Normal)</option>
                    <option value="tracking-wide">Executive Broad (Wide)</option>
                    <option value="tracking-widest">Atmosphere Space (Widest)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Description fonts and tags setting details */}
            <div className="space-y-4 border border-slate-100 p-4 rounded-2xl bg-slate-50/50 text-left">
              <div className="flex items-center gap-1.5 border-b pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-extrabold text-slate-900 uppercase">3. Product Descriptions &amp; Specification Text Lines</span>
              </div>

              {/* Font family & Color */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Font Family</label>
                  <select
                    value={descFont.family}
                    onChange={(e) => updateSubFontField("descFont", "family", e.target.value)}
                    className="w-full text-xs font-semibold p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {PRESET_FONTS.map(f => (
                      <option key={f.id} value={f.family}>{f.name}</option>
                    ))}
                    {targetWeb.customUploadedFontName && (
                      <option value={targetWeb.customUploadedFontName}>★ Uploaded Custom Typography</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold font-mono">Font Color</label>
                  <div className="flex items-center gap-2 bg-white p-1 rounded-lg border">
                    <input 
                      type="color" 
                      value={descFont.color}
                      onChange={(e) => updateSubFontField("descFont", "color", e.target.value)}
                      className="w-8 h-6 border-none rounded cursor-pointer"
                    />
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-600">{descFont.color}</span>
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-4 pt-1.5">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>FONT SIZE</span>
                    <span>{descFont.size}px</span>
                  </div>
                  <input 
                    type="range" 
                    min={9} 
                    max={20} 
                    value={descFont.size}
                    onChange={(e) => updateSubFontField("descFont", "size", parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold font-mono">
                    <span>OPACITY</span>
                    <span>{Math.round(descFont.opacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={10} 
                    max={100} 
                    value={descFont.opacity * 100}
                    onChange={(e) => updateSubFontField("descFont", "opacity", parseFloat(e.target.value) / 100)}
                    className="w-full h-1 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              </div>

              {/* Weight & spacing options */}
              <div className="grid grid-cols-2 gap-3 pt-1.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Font Weight</label>
                  <select
                    value={descFont.weight}
                    onChange={(e) => updateSubFontField("descFont", "weight", e.target.value)}
                    className="w-full text-[10px] font-bold p-1 bg-white border border-slate-200 rounded focus:outline-none"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="700">Bold (700)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Letter Spacing (Tracking)</label>
                  <select
                    value={descFont.letterSpacing}
                    onChange={(e) => updateSubFontField("descFont", "letterSpacing", e.target.value)}
                    className="w-full text-[10px] font-bold p-1 bg-white border border-slate-200 rounded focus:outline-none"
                  >
                    <option value="tracking-tighter">Ultra Narrow (Tighter)</option>
                    <option value="tracking-tight">Cosplay tight (Tight)</option>
                    <option value="tracking-normal">Universal (Normal)</option>
                    <option value="tracking-wide">Executive Broad (Wide)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: DYNAMIC REAL-TIME BROWSER VIEWPORT PREVIEW (5 Cols) */}
        <div className="xl:col-span-5 sticky top-20 space-y-4">
          <div className="flex justify-between items-center text-left">
            <span className="text-xs font-black text-slate-450 text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-500 animate-pulse" />
              Live Interactive Iframe Previewer
            </span>
            <span className="text-[9.5px] font-bold text-indigo-750 bg-indigo-120 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-mono uppercase">
              Render Engine active
            </span>
          </div>

          {/* MOCK INTEL WEB BROWSER FRAME */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* 1. Browser Top Bar / Tabs & Action lines */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 text-left flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between">
                
                {/* Simulated window red/green/yellow circles */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono font-bold uppercase">
                    Layout: {activeLayout.toUpperCase()}
                  </span>
                  <span className="text-[9.5px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono font-bold uppercase">
                    Theme: {activeColorMode.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Dynamic URL line and SSL badge */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-emerald-500 text-xs shrink-0 font-mono">🔒</span>
                <span className="text-[9.5px] font-mono text-slate-400 font-bold select-all truncate flex-1">
                  {targetWeb.simulatedUrl}/?theme={activeColorMode}&amp;layout={activeLayout}&amp;header={activeHeadLayout}
                </span>
                
                <div className="flex gap-1 items-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] font-mono text-emerald-400 font-extrabold uppercase">Live CDN</span>
                </div>
              </div>
            </div>

            {/* 2. LIVE BROWSER CANVAS ROOT */}
            <div 
              className={`max-h-[640px] overflow-y-auto relative text-slate-800 text-left transition-colors duration-300 ${
                activeColorMode === "dark" 
                  ? "bg-slate-950 text-slate-200" 
                  : "bg-white text-slate-800"
              }`}
              id="live-canvas-host"
            >
              
              {/* Ad Layout 1: Top Billboard Sponsor Ad Banner (Compliance Adsense Standard Leaderboard) */}
              <div className={`p-3 border-b text-center relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
                activeColorMode === "dark" ? "bg-amber-950/20 border-slate-900" : "bg-amber-55 bg-amber-50/40 border-amber-100"
              }`}>
                <div className="absolute top-0.5 left-1 flex items-center gap-1">
                  <span className="text-[6.5px] font-black tracking-widest uppercase bg-amber-500 text-white font-mono rounded px-1">AD</span>
                  <span className="text-[7.5px] font-mono font-black text-slate-400">LEADERBOARD_BILLBOARD_728X90_SIMULATED</span>
                </div>
                
                <div className="flex items-center gap-2 text-left pt-1.5 sm:pt-0">
                  <span className="text-sm">🥤</span>
                  <div>
                    <h5 className="text-[9px] font-black tracking-tight">{MOCK_AD_SIMULATIONS.leaderboard.title}</h5>
                    <p className="text-[8px] text-slate-450 text-slate-500 font-medium leading-none">{MOCK_AD_SIMULATIONS.leaderboard.desc}</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-mono text-[7px] font-extrabold uppercase rounded shadow-xs cursor-pointer select-none">
                  {MOCK_AD_SIMULATIONS.leaderboard.cta}
                </span>
              </div>

              {/* 2A. WEBSITE CORE HEADER LAYOUT COMPLIANT RENDERING */}
              <header 
                className={`p-4 border-b transition-colors ${
                  activeColorMode === "dark" 
                    ? "bg-slate-900/60 border-slate-900" 
                    : "bg-slate-50 border-slate-150"
                }`}
              >
                {/* CONDITIONAL HEAD LAYOUTS */}
                
                {/* Style: SLEEK COMMERCE NAVBAR */}
                {(activeHeadLayout === "minimalist" || activeHeadLayout === "sleek-inline") && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      {targetWeb.customIconUrl ? (
                        <img src={targetWeb.customIconUrl} alt="custom branded emblem logo" className="w-5 h-5 object-contain" />
                      ) : (
                        <span className="text-base">{targetWeb.customIcon || "🔬"}</span>
                      )}
                      <span 
                        style={{ 
                          fontFamily: resolveFontFamily(coreFont.family, targetWeb.customUploadedFontName),
                          fontSize: `${coreFont.size * 0.75}px`,
                          color: coreFont.color,
                          opacity: coreFont.opacity,
                          fontWeight: coreFont.weight,
                          letterSpacing: coreFont.letterSpacing === "tracking-tighter" ? "-0.05em" : coreFont.letterSpacing === "tracking-tight" ? "-0.025em" : coreFont.letterSpacing === "tracking-wide" ? "0.025em" : coreFont.letterSpacing === "tracking-widest" ? "0.08em" : "0"
                        }}
                        className="truncate max-w-[120px]"
                      >
                        {targetWeb.name}
                      </span>
                    </div>

                    <nav className="flex items-center gap-2 text-[8px] font-bold text-slate-400">
                      <span className="text-slate-800 dark:text-white border-b border-indigo-600 pb-0.5">Shop</span>
                      <span>Catalog</span>
                      <span>Support</span>
                    </nav>

                    <div className="relative max-w-[80px] w-full">
                      <input 
                        type="text" 
                        placeholder="Search items..." 
                        className="w-full text-[8px] p-1 pr-3 bg-slate-100 dark:bg-slate-800 dark:text-white rounded border border-slate-200 dark:border-slate-850" 
                        disabled 
                      />
                    </div>
                  </div>
                )}

                {/* Style: CENTERED BRAND EMBLEM */}
                {activeHeadLayout === "centered" && (
                  <div className="flex flex-col items-center text-center gap-1.5">
                    {targetWeb.customIconUrl ? (
                      <img src={targetWeb.customIconUrl} alt="custom logo asset" className="w-7 h-7 object-contain" />
                    ) : (
                      <span className="text-xl animate-pulse">{targetWeb.customIcon || "💎"}</span>
                    )}
                    <h4 
                      style={{ 
                        fontFamily: resolveFontFamily(coreFont.family, targetWeb.customUploadedFontName),
                        fontSize: `${coreFont.size * 0.85}px`,
                        color: coreFont.color,
                        opacity: coreFont.opacity,
                        fontWeight: coreFont.weight,
                        letterSpacing: coreFont.letterSpacing === "tracking-tighter" ? "-0.05em" : coreFont.letterSpacing === "tracking-tight" ? "-0.025em" : coreFont.letterSpacing === "tracking-wide" ? "0.025em" : coreFont.letterSpacing === "tracking-widest" ? "0.08em" : "0"
                      }}
                    >
                      {targetWeb.name}
                    </h4>
                    <p className="text-[7.5px] text-slate-450 text-slate-500 font-bold uppercase tracking-widest">{targetWeb.tagline}</p>
                    
                    <div className="flex gap-4 items-center justify-center text-[8px] font-black tracking-widest text-slate-400 mt-2">
                      <span className="text-slate-800 dark:text-white">HOT DEALS</span>
                      <span>SPECIFICATIONS</span>
                      <span>CONTACT INDEX</span>
                    </div>
                  </div>
                )}

                {/* Style: ANNOUNCEMENT HEAVY HEADER */}
                {activeHeadLayout === "announcement-dense" && (
                  <div className="space-y-2">
                    <div className="bg-slate-950 text-white rounded p-1 text-[7.5px] font-black text-center uppercase tracking-widest font-mono">
                      🚨 Free Shipping + 45% Markdown across all isolated client lines under active plans
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        {targetWeb.customIconUrl ? (
                          <img src={targetWeb.customIconUrl} alt="custom layout emblem" className="w-5 h-5 object-contain" />
                        ) : (
                          <span className="text-sm bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full">{targetWeb.customIcon || "🛍️"}</span>
                        )}
                        <span 
                          style={{ 
                            fontFamily: resolveFontFamily(coreFont.family, targetWeb.customUploadedFontName),
                            fontSize: `${coreFont.size * 0.75}px`,
                            color: coreFont.color,
                            opacity: coreFont.opacity,
                            fontWeight: coreFont.weight,
                            letterSpacing: coreFont.letterSpacing === "tracking-tighter" ? "-0.05em" : coreFont.letterSpacing === "tracking-tight" ? "-0.025em" : coreFont.letterSpacing === "tracking-wide" ? "0.025em" : coreFont.letterSpacing === "tracking-widest" ? "0.08em" : "0"
                          }}
                        >
                          {targetWeb.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[7px] font-mono text-slate-400">SUPPORT: {(targetWeb.simulatedUrl || "").replace("https://www.", "")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Style: SPLIT LOGO ASYMMETRIC HEADER */}
                {(activeHeadLayout === "asymmetric" || activeHeadLayout === "split-logo") && (
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-8 text-left">
                      <span 
                        style={{ 
                          fontFamily: resolveFontFamily(coreFont.family, targetWeb.customUploadedFontName),
                          fontSize: `${coreFont.size * 0.9}px`,
                          color: coreFont.color,
                          opacity: coreFont.opacity,
                          fontWeight: coreFont.weight,
                          letterSpacing: coreFont.letterSpacing === "tracking-tighter" ? "-0.05em" : coreFont.letterSpacing === "tracking-tight" ? "-0.025em" : coreFont.letterSpacing === "tracking-wide" ? "0.025em" : coreFont.letterSpacing === "tracking-widest" ? "0.08em" : "0"
                        }}
                        className="block truncate"
                      >
                        {targetWeb.name}
                      </span>
                      <p className="text-[8px] text-indigo-500 font-bold uppercase tracking-wide leading-none">{targetWeb.tagline}</p>
                    </div>

                    <div className="col-span-4 flex justify-end">
                      {targetWeb.customIconUrl ? (
                        <img src={targetWeb.customIconUrl} alt="custom branded icon layout" className="w-8 h-8 object-contain" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-indigo-500 flex items-center justify-center text-white font-mono text-lg font-black shrink-0">
                          {targetWeb.customIcon || "🚀"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </header>

              {/* 2B. BANNER BLOCK HERO SPOTLIGHT SECTION */}
              <div className="relative h-28 w-full overflow-hidden">
                {targetWeb.bannerUrl ? (
                  <img src={targetWeb.bannerUrl} alt="custom billboard uploaded" className="w-full h-full object-cover" />
                ) : targetWeb.heroImageUrl ? (
                  <img src={targetWeb.heroImageUrl} alt="preset hero photograph" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-indigo-950 flex flex-col justify-center px-4 font-mono select-none">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Aesthetic Canvas Sandbox</span>
                    <span className="text-[11px] text-slate-400 font-bold">Please upload a billboard banner image or select a preset backdrop above.</span>
                  </div>
                )}

                {/* Banner Text overlay */}
                <div className="absolute inset-0 bg-slate-950/45 flex flex-col justify-end p-3 text-left">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{targetWeb.bannerText || "Aesthetic hardware curation"}</h4>
                  <p className="text-[8.5px] text-slate-300 leading-tight font-medium line-clamp-1">{targetWeb.tagline}</p>
                </div>
              </div>

              {/* 2C. ACTIVE POPULAR INTERNET LAYOUT PRODUCTS GRID CONTAINER */}
              <div className="p-4 space-y-4">
                
                {/* Category filters within simulated browser block */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-xl">
                  <div className="flex flex-wrap gap-1">
                    {["all", "electronics", "audio", "clay", "lounge"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPreviewCategory(cat)}
                        className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase transition-all ${
                          previewCategory === cat 
                            ? "bg-indigo-600 text-white" 
                            : "bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <input 
                    type="text" 
                    placeholder="Filter preview items..." 
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="p-0.5 px-2 bg-white dark:bg-black text-[8.5px] font-medium border border-slate-200 dark:border-slate-850 rounded focus:outline-none max-w-[100px]"
                  />
                </div>

                <div className="text-left text-[9px] font-mono font-black text-indigo-500 uppercase flex items-center justify-between">
                  <span>Simulated Catalog Catalog ({previewProducts.length} elements mapped)</span>
                  <span className="text-[8px] text-slate-450">*Holds &quot;a lot of products&quot; grid formats</span>
                </div>

                {/* =======================================================
                    CONDITIONAL POPULAR RETAIL STRUCTURES FROM THE INTERNET
                    ======================================================= */}
                
                {/* 1. LAYOUT STYLE: AMAZON BESTSELLER MEGA GRID */}
                {activeLayout === "amazon-mega" && (
                  <div className="grid grid-cols-12 gap-3" id="amazon-mega-wrapper">
                    
                    {/* Left Sidebar Category blocks (Amazon feel) */}
                    <div className="col-span-3 space-y-2 border-r border-slate-150-custom border-slate-100 dark:border-slate-855 pr-2 select-none">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block font-mono">Bestsellers</span>
                      <ul className="text-[8px] space-y-1.5 font-bold text-slate-500 leading-none">
                        <li className="text-indigo-600 font-black">★ Recommended</li>
                        <li>💻 Desktop Parts</li>
                        <li>🛍️ Today&apos;s Deals</li>
                        <li>🏺 Handcrafted Crafts</li>
                      </ul>
                      
                      {/* Interactive inline side ad */}
                      <div className="bg-indigo-55 bg-indigo-50/40 p-2 rounded border border-indigo-150 text-[7px] space-y-1 font-sans text-left mt-3">
                        <span className="bg-indigo-400 font-mono text-[5.5px] text-white rounded px-0.5 font-black block w-fit">SPONSORED</span>
                        <span className="font-extrabold text-slate-800 block text-[7.5px]">{MOCK_AD_SIMULATIONS.native.title}</span>
                        <p className="text-slate-500 leading-tight font-medium">{MOCK_AD_SIMULATIONS.native.desc}</p>
                      </div>
                    </div>

                    {/* Right massive grids (Holds a lot of products) */}
                    <div className="col-span-9 grid grid-cols-2 gap-2.5">
                      {previewProducts.slice(0, 8).map((p, idx) => (
                        <div 
                          key={p.id}
                          className={`rounded-lg border p-2 flex flex-col justify-between transition-all hover:shadow-md relative ${
                            activeColorMode === "dark" ? "bg-slate-900 border-slate-850" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="h-14 w-full rounded overflow-hidden bg-slate-200 select-none">
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="pt-1.5 space-y-1 text-left">
                            <span className="text-[6.5px] font-bold text-slate-400 uppercase font-mono tracking-wider bg-slate-200/50 dark:bg-slate-800 px-1 rounded block w-fit">{p.category}</span>
                            <h5 
                              style={{ 
                                fontFamily: resolveFontFamily(productFont.family, targetWeb.customUploadedFontName),
                                fontSize: `${productFont.size * 0.65}px`,
                                color: productFont.color,
                                opacity: productFont.opacity,
                                fontWeight: productFont.weight,
                                letterSpacing: productFont.letterSpacing === "tracking-tighter" ? "-0.04em" : productFont.letterSpacing === "tracking-tight" ? "-0.02em" : "0"
                              }}
                              className="font-black line-clamp-1 leading-snug"
                            >
                              {p.name}
                            </h5>
                            <p 
                              style={{ 
                                fontFamily: resolveFontFamily(descFont.family, targetWeb.customUploadedFontName),
                                fontSize: `${descFont.size * 0.75}px`,
                                color: descFont.color,
                                opacity: descFont.opacity,
                                fontWeight: descFont.weight,
                                letterSpacing: descFont.letterSpacing === "tracking-tighter" ? "-0.04em" : "0"
                              }}
                              className="line-clamp-2 leading-tight"
                            >
                              {p.desc}
                            </p>
                          </div>
                          
                          <div className="pt-2 mt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] font-black text-indigo-500 font-mono">${p.price.toFixed(2)}</span>
                            <span className="text-[7px] text-slate-400 font-bold uppercase font-mono">{p.salesCount} sold</span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* 2. LAYOUT STYLE: SHOPIFY MINIMALIST CLEAN CATALOG */}
                {activeLayout === "shopify-clean" && (
                  <div className="grid grid-cols-3 gap-3.5" id="shopify-clean-wrapper">
                    {previewProducts.slice(0, 9).map((p) => (
                      <div 
                        key={p.id}
                        className={`group border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:scale-[1.015] ${
                          activeColorMode === "dark" ? "bg-slate-900/60 border-slate-850" : "bg-white border-slate-150 border-slate-200"
                        }`}
                      >
                        <div className="h-16 w-full relative bg-slate-100 overflow-hidden select-none border-b border-slate-100 dark:border-slate-850">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <span className="absolute top-1.5 left-1.5 bg-indigo-600 text-white font-mono text-[5.5px] font-extrabold uppercase px-1 rounded-sm">Hot</span>
                        </div>
                        
                        <div className="p-2 space-y-1.5">
                          <h5 
                            style={{ 
                              fontFamily: resolveFontFamily(productFont.family, targetWeb.customUploadedFontName),
                              fontSize: `${productFont.size * 0.65}px`,
                              color: productFont.color,
                              opacity: productFont.opacity,
                              fontWeight: productFont.weight,
                              letterSpacing: productFont.letterSpacing === "tracking-tighter" ? "-0.04em" : productFont.letterSpacing === "tracking-tight" ? "-0.02em" : "0"
                            }}
                            className="font-black line-clamp-1 leading-snug"
                          >
                            {p.name}
                          </h5>
                          
                          <p 
                            style={{ 
                              fontFamily: resolveFontFamily(descFont.family, targetWeb.customUploadedFontName),
                              fontSize: `${descFont.size * 0.72}px`,
                              color: descFont.color,
                              opacity: descFont.opacity,
                              fontWeight: descFont.weight,
                              letterSpacing: descFont.letterSpacing === "tracking-tighter" ? "-0.04em" : "0"
                            }}
                            className="line-clamp-2 leading-tight"
                          >
                            {p.desc}
                          </p>

                          <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100 dark:border-slate-850">
                            <span className="text-[9.5px] font-black text-rose-600 font-mono">${p.price.toFixed(2)}</span>
                            <button className="px-1.5 py-0.5 bg-slate-900 hover:bg-indigo-600 text-white text-[7px] font-black uppercase rounded-sm cursor-pointer select-none">
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. LAYOUT STYLE: ETSY ARTISANAL BOHO STAGGERED FLOW */}
                {activeLayout === "etsy-boho" && (
                  <div className="columns-2 gap-3 space-y-3 Staggered" id="etsy-boho-wrapper">
                    {previewProducts.slice(0, 8).map((p, idx) => (
                      <div 
                        key={p.id}
                        className={`break-inside-avoid rounded-2xl border-2 border-dashed p-3 space-y-2 text-left shadow-xs flex flex-col justify-between ${
                          idx % 2 === 0 ? "min-h-[140px]" : "min-h-[175px]"
                        } ${
                          activeColorMode === "dark" 
                            ? "bg-slate-900 border-indigo-950/40 text-slate-300" 
                            : "bg-orange-50/20 border-orange-200/50 text-slate-850"
                        }`}
                      >
                        <div className="rounded-xl overflow-hidden bg-amber-100 select-none h-16 shrink-0 relative">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="space-y-1 bg-white/20 p-1.5 rounded-lg">
                          <h5 
                            style={{ 
                              fontFamily: resolveFontFamily(productFont.family, targetWeb.customUploadedFontName),
                              fontSize: `${productFont.size * 0.65}px`,
                              color: productFont.color,
                              opacity: productFont.opacity,
                              fontWeight: productFont.weight,
                              letterSpacing: productFont.letterSpacing === "tracking-tighter" ? "-0.04em" : productFont.letterSpacing === "tracking-tight" ? "-0.02em" : "0"
                            }}
                            className="font-black line-clamp-2 leading-tight"
                          >
                            {p.name}
                          </h5>
                          
                          <p 
                            style={{ 
                              fontFamily: resolveFontFamily(descFont.family, targetWeb.customUploadedFontName),
                              fontSize: `${descFont.size * 0.72}px`,
                              color: descFont.color,
                              opacity: descFont.opacity,
                              fontWeight: descFont.weight,
                              letterSpacing: descFont.letterSpacing === "tracking-tighter" ? "-0.04em" : "0"
                            }}
                            className="line-clamp-2 leading-tight font-sans italic"
                          >
                            {p.desc}
                          </p>
                        </div>

                        <div className="mt-1 flex items-center justify-between border-t border-dashed border-slate-300 pt-1.5 shrink-0 select-none">
                          <span className="text-[9.5px] font-sans font-black text-orange-650 inline-block text-orange-700">${p.price.toFixed(2)}</span>
                          <span className="text-[7.5px] bg-orange-100 text-orange-850 px-1.5 py-0.2 rounded font-black font-serif">Originals</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. LAYOUT STYLE: SUPREME STREETWEAR SPLIT */}
                {activeLayout === "streetwear-split" && (
                  <div className="space-y-4" id="streetwear-split-wrapper">
                    
                    {/* Big Feature Horizontal split product showcase */}
                    {previewProducts[0] && (
                      <div className="border-4 border-black dark:border-white p-3 grid grid-cols-12 gap-3 bg-red-650 hover:scale-[1.01] transition-transform text-slate-800 bg-red-600 select-none justify-between items-center">
                        <div className="col-span-4 h-16 rounded border bg-slate-200 overflow-hidden">
                          <img src={previewProducts[0].imageUrl} alt={previewProducts[0].name} className="w-full h-full object-cover" />
                        </div>
                        <div className="col-span-8 text-left space-y-1">
                          <span className="bg-black text-white px-1.5 py-0.2 font-mono text-[7px] font-black uppercase">DROP OF THE WEEK</span>
                          <h4 className="text-xs font-black text-white uppercase">{previewProducts[0].name}</h4>
                          <span className="text-xs font-mono text-white font-black bg-stone-900 px-2 rounded">${previewProducts[0].price.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Uniform grid columns underneath */}
                    <div className="grid grid-cols-2 gap-3">
                      {previewProducts.slice(1, 7).map((p) => (
                        <div 
                          key={p.id}
                          className={`border-3 border-black dark:border-white p-3 flex flex-col justify-between transition-all relative ${
                            activeColorMode === "dark" ? "bg-slate-900" : "bg-white"
                          }`}
                        >
                          <div className="h-16 border-2 border-black dark:border-slate-800 bg-slate-150 select-none relative overflow-hidden">
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 right-0 bg-black text-stone-100 text-[6.5px] font-mono px-1 font-black uppercase">LIMITED</span>
                          </div>

                          <div className="pt-2 text-left space-y-1">
                            <h5 
                              style={{ 
                                fontFamily: resolveFontFamily(productFont.family, targetWeb.customUploadedFontName),
                                fontSize: `${productFont.size * 0.65}px`,
                                color: productFont.color,
                                opacity: productFont.opacity,
                                fontWeight: productFont.weight,
                                letterSpacing: productFont.letterSpacing === "tracking-tighter" ? "-0.04em" : productFont.letterSpacing === "tracking-tight" ? "-0.02em" : "0"
                              }}
                              className="font-black uppercase line-clamp-1 leading-snug"
                            >
                              {p.name}
                            </h5>
                            
                            <p 
                              style={{ 
                                fontFamily: resolveFontFamily(descFont.family, targetWeb.customUploadedFontName),
                                fontSize: `${descFont.size * 0.72}px`,
                                color: descFont.color,
                                opacity: descFont.opacity,
                                fontWeight: descFont.weight,
                                letterSpacing: descFont.letterSpacing === "tracking-tighter" ? "-0.04em" : "0"
                              }}
                              className="line-clamp-2 leading-tight"
                            >
                              {p.desc}
                            </p>
                          </div>

                          <div className="pt-2 border-t-2 border-stone-100 dark:border-stone-800 flex items-center justify-between font-mono font-black mt-2">
                            <span className="text-[10px] bg-red-100 dark:bg-stone-900 border px-1">${p.price.toFixed(2)}</span>
                            <span className="text-[6.5px] text-slate-400 font-bold">CAT#{p.id.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* 5. LAYOUT STYLE: PINTEREST STAGGERED MASONRY */}
                {activeLayout === "pinterest-masonry" && (
                  <div className="columns-2 gap-3 space-y-3" id="pinterest-masonry-wrapper">
                    {previewProducts.slice(0, 6).map((p, idx) => (
                      <div 
                        key={p.id}
                        className={`break-inside-avoid rounded-xl border p-2 text-left shadow-xs flex flex-col justify-between ${
                          idx % 2 === 0 ? "min-h-[120px]" : "min-h-[160px]"
                        } ${
                          activeColorMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-150 text-slate-800"
                        }`}
                      >
                        <div className="rounded-lg overflow-hidden shrink-0 select-none relative" style={{ height: idx % 2 === 0 ? '55px' : '75px' }}>
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-2 flex-1">
                          <h5 className="text-[8.5px] font-bold line-clamp-1 truncate">{p.name}</h5>
                          <p className="text-[7.5px] text-slate-400 line-clamp-3 mt-0.5 leading-tight">{p.desc}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-105 dark:border-slate-850">
                          <span className="text-[9px] font-mono font-black text-rose-500">${p.price.toFixed(2)}</span>
                          <span className="text-[7px] text-indigo-500 font-extrabold uppercase font-mono">Pin View</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. LAYOUT STYLE: INSTAGRAM SQUARE FEED */}
                {activeLayout === "instagram-grid" && (
                  <div className="grid grid-cols-3 gap-2" id="instagram-grid-wrapper">
                    {previewProducts.slice(0, 6).map((p) => (
                      <div 
                        key={p.id}
                        className={`border rounded-lg overflow-hidden group relative aspect-square flex flex-col justify-end ${
                          activeColorMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-150"
                        }`}
                      >
                        <div className="absolute inset-0 select-none">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-bold font-mono">
                            View details
                          </div>
                        </div>
                        <div className="relative z-10 bg-slate-950/80 p-1 text-center backdrop-blur-xs select-none">
                          <h5 className="text-[8px] font-black truncate text-white leading-none">{p.name}</h5>
                          <span className="text-[7px] text-emerald-400 font-mono tracking-tight font-black">${p.price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 7. LAYOUT STYLE: EBAY AUCTION GRID */}
                {activeLayout === "ebay-auction" && (
                  <div className="space-y-2 text-left" id="ebay-auction-wrapper">
                    {previewProducts.slice(0, 4).map((p) => (
                      <div 
                        key={p.id}
                        className={`border p-2 rounded-lg flex gap-3 items-center justify-between ${
                          activeColorMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <div className="w-12 h-12 rounded bg-slate-200 shrink-0 overflow-hidden select-none">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-[9px] font-black uppercase text-indigo-600 truncate">{p.name}</h5>
                          <p className="text-[8px] text-slate-500 truncate leading-none mt-0.5">{p.desc}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[7px] bg-red-100 text-red-600 px-1 font-mono font-bold">1h 12m left</span>
                            <span className="text-[7px] text-slate-400 font-bold font-mono">6 bids</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-black font-mono leading-none text-slate-800 dark:text-white">${p.price.toFixed(2)}</p>
                          <p className="text-[6.5px] text-slate-400 font-mono mt-0.5">Buy it now</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 8. LAYOUT STYLE: BENTO EDITORIAL SHOWCASE */}
                {activeLayout === "bento-editorial" && (
                  <div className="grid grid-cols-6 gap-2 text-left" id="bento-editorial-wrapper">
                    {previewProducts[0] && (
                      <div className={`col-span-4 p-2 border rounded-xl flex flex-col justify-between ${
                        activeColorMode === "dark" ? "bg-indigo-950/20 border-indigo-900 text-white" : "bg-indigo-50/60 border-indigo-150 text-indigo-950"
                      }`}>
                        <div>
                          <span className="bg-indigo-600 text-white font-mono text-[5.5px] font-black uppercase px-2 py-0.5 rounded-sm inline-block">SPOTLIGHT</span>
                          <h5 className="text-xs font-black uppercase mt-1 leading-tight">{previewProducts[0].name}</h5>
                          <p className="text-[8px] text-slate-500 line-clamp-2 leading-snug mt-0.5">{previewProducts[0].desc}</p>
                        </div>
                        <div className="flex justify-between items-baseline mt-4 pt-1 border-t border-dashed border-slate-200">
                          <span className="text-xs font-black font-mono text-indigo-600">${previewProducts[0].price.toFixed(2)}</span>
                          <span className="text-[7px] uppercase font-bold font-mono">Instant Checkout</span>
                        </div>
                      </div>
                    )}

                    {previewProducts.slice(1, 4).map((p) => (
                      <div 
                        key={p.id}
                        className={`col-span-2 p-2 border rounded-xl flex flex-col justify-between ${
                          activeColorMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-205 text-slate-800"
                        }`}
                      >
                        <div className="h-10 rounded bg-slate-200 overflow-hidden select-none">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <h5 className="text-[8px] font-black truncate mt-1.5">{p.name}</h5>
                        <p className="text-[9px] font-mono text-rose-500 font-black mt-2">${p.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ad Layout 2: Inline Native Content Sponsor block (Mixed beautifully with products list) */}
                <div className={`p-4 border border-dashed rounded-xl flex items-center justify-between gap-3 ${
                  activeColorMode === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-indigo-50/40 border-indigo-200"
                }`}>
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] font-mono bg-indigo-500 text-white rounded px-1 animate-pulse uppercase font-black leading-none">Sponsored Offer</span>
                      <span className="text-[6.5px] text-slate-400">By Admin Network</span>
                    </div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-white">{MOCK_AD_SIMULATIONS.native.title}</h5>
                    <p className="text-[9.5px] text-slate-500 leading-normal font-medium">{MOCK_AD_SIMULATIONS.native.desc}</p>
                  </div>

                  <button 
                    onClick={() => alert("Simulated programmatic advertisement checkout routing.")}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[8px] font-extrabold uppercase rounded shadow-sm shrink-0 cursor-pointer"
                  >
                    {MOCK_AD_SIMULATIONS.native.cta}
                  </button>
                </div>

              </div>
              
              {/* Ad Layout 3: Mobile Floating Anchor Ad Banner at base margins */}
              <div className="h-9" />
              <div className="absolute bottom-0 inset-x-0 bg-slate-950 text-white py-1 px-3.5 flex items-center justify-between gap-4 border-t border-slate-800 select-none z-10 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-[6.5px] font-black tracking-tighter uppercase bg-red-500 text-white rounded px-1">AD</span>
                  <p className="text-[7.5px] font-bold truncate leading-none">{MOCK_AD_SIMULATIONS.sticker.title}</p>
                </div>
                <button 
                  onClick={() => alert("Simulated micro-conversion close feedback log.")}
                  className="p-0.5 px-1 bg-stone-800 hover:bg-stone-700 font-bold border border-stone-700 rounded text-[6.5px] text-stone-200 shrink-0 cursor-pointer"
                >
                  Dismiss Ad
                </button>
              </div>

            </div>

          </div>

          <div className="p-3.5 bg-slate-100 rounded-2xl flex items-center gap-2 border border-slate-200 text-left">
            <span className="text-[10px] bg-emerald-500 text-white rounded-full p-0.5">✔</span>
            <p className="text-[10px] text-slate-650 leading-tight font-medium text-slate-600">
              Changes applied are previewed live on the interactive viewport. Your client-facing standalone URLs at <code className="bg-white px-1.5 py-0.5 rounded border">/store/{targetWeb.id}</code> sync synchronously in your local database storage instantly.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
