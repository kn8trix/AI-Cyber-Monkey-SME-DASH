import React, { useState } from "react";
import { 
  ShoppingBag, 
  User, 
  ShieldCheck, 
  MessageSquare, 
  Star, 
  Check, 
  LogOut, 
  Building2,
  Trash2,
  Heart,
  Cpu,
  Terminal,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  Search,
  ChevronDown,
  Globe,
  Smartphone,
  Gift,
  Truck,
  Percent,
  ThumbsUp
} from "lucide-react";

import { StorefrontProduct, StorefrontProfile, normalizeTargetSites } from "../types";

interface CustomerStorefrontProps {
  activeProfile: StorefrontProfile;
  profiles: StorefrontProfile[];
  onSwitchProfile: (id: string) => void;
  products: StorefrontProduct[];
  onAddLog: (newLogText: string) => void;
  onSmeLoginSuccess: () => void;
  smeLoggedIn: boolean;
  isStandalone?: boolean;
  isFreeTier?: boolean;
}

export default function CustomerStorefront({ 
  activeProfile,
  profiles,
  onSwitchProfile,
  products, 
  onAddLog, 
  onSmeLoginSuccess, 
  smeLoggedIn,
  isStandalone = false,
  isFreeTier = true
}: CustomerStorefrontProps) {
  // Navigation & Authentication states
  const [authModal, setAuthModal] = useState<"none" | "customer" | "sme">("none");
  const [customerSession, setCustomerSession] = useState<{ email: string; name: string } | null>(null);

  // Simulated Web Browser control states and address handlers
  const [typingUrl, setTypingUrl] = useState(activeProfile?.simulatedUrl || "");
  const [isBrowserLoading, setIsBrowserLoading] = useState(false);
  const [dnsErrorUrl, setDnsErrorUrl] = useState<string | null>(null);

  // Synchronize browser address bar with whichever profile is active
  React.useEffect(() => {
    setTypingUrl(activeProfile?.simulatedUrl || "");
    setDnsErrorUrl(null);
  }, [activeProfile]);

  const handleReload = () => {
    setIsBrowserLoading(true);
    onAddLog(`[BROWSER-RELOAD] ${new Date().toLocaleTimeString()}: Reloader triggered for domain ${activeProfile.simulatedUrl}`);
    setTimeout(() => {
      setIsBrowserLoading(false);
    }, 700);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typingUrl.trim()) return;

    let targetUrl = typingUrl.trim().toLowerCase();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // Try to match the typed domain to a configured website profile
    const found = profiles.find(p => {
      const u1 = (p.simulatedUrl || "").toLowerCase();
      const idStr = p.id.toLowerCase();
      const nameStr = p.name.toLowerCase();
      return (
        targetUrl.includes(u1.replace("https://", "").replace("www.", "")) ||
        targetUrl.includes(idStr) ||
        targetUrl.includes(nameStr.replace(/[^a-z0-9]+/g, ""))
      );
    });

    setIsBrowserLoading(true);
    setTimeout(() => {
      setIsBrowserLoading(false);
      if (found) {
        onSwitchProfile(found.id);
        setDnsErrorUrl(null);
        onAddLog(`[BROWSER-NAVIGATE] ${new Date().toLocaleTimeString()}: Resolved DNS path "${typingUrl}" to simulated storefront "${found.name}".`);
      } else {
        setDnsErrorUrl(typingUrl);
        onAddLog(`[BROWSER-NAVIGATE-FAIL] ${new Date().toLocaleTimeString()}: DNS Lookup failed for typed domain: "${typingUrl}". NXDOMAIN status.`);
      }
    }, 600);
  };

  // Dynamic theme configurations mapping based on the active storefront profile settings
  const getAccentColors = (colorName: string) => {
    switch (colorName) {
      case "orange":
        return {
          primary: "orange-500",
          primaryText: "text-orange-500",
          primaryBg: "bg-orange-500",
          primaryHoverBg: "hover:bg-orange-600",
          primaryBorder: "border-orange-505 border-orange-500",
          primaryLightBg: "bg-orange-50",
          primaryBannerGradient: "from-orange-600 to-amber-500",
          badgeBg: "bg-orange-500 text-white",
          selection: "selection:bg-orange-500 selection:text-white"
        };
      case "rose":
        return {
          primary: "rose-500",
          primaryText: "text-rose-500",
          primaryBg: "bg-rose-500",
          primaryHoverBg: "hover:bg-rose-600",
          primaryBorder: "border-rose-500",
          primaryLightBg: "bg-rose-50",
          primaryBannerGradient: "from-rose-600 to-pink-500",
          badgeBg: "bg-rose-500 text-white",
          selection: "selection:bg-rose-505 selection:text-white"
        };
      case "emerald":
        return {
          primary: "emerald-600",
          primaryText: "text-emerald-600",
          primaryBg: "bg-emerald-600",
          primaryHoverBg: "hover:bg-emerald-700",
          primaryBorder: "border-emerald-600",
          primaryLightBg: "bg-emerald-50",
          primaryBannerGradient: "from-emerald-600 to-teal-500",
          badgeBg: "bg-emerald-600 text-white",
          selection: "selection:bg-emerald-600 selection:text-white"
        };
      case "purple":
        return {
          primary: "purple-600",
          primaryText: "text-purple-600",
          primaryBg: "bg-purple-600",
          primaryHoverBg: "hover:bg-purple-700",
          primaryBorder: "border-purple-600",
          primaryLightBg: "bg-purple-50",
          primaryBannerGradient: "from-purple-600 to-fuchsia-500",
          badgeBg: "bg-purple-600 text-white",
          selection: "selection:bg-purple-600 selection:text-white"
        };
      case "cyan":
        return {
          primary: "cyan-500",
          primaryText: "text-cyan-500",
          primaryBg: "bg-cyan-500",
          primaryHoverBg: "hover:bg-cyan-600",
          primaryBorder: "border-cyan-500",
          primaryLightBg: "bg-cyan-50",
          primaryBannerGradient: "from-cyan-600 to-blue-500",
          badgeBg: "bg-cyan-500 text-slate-900",
          selection: "selection:bg-cyan-500 selection:text-slate-950"
        };
      case "amber":
        return {
          primary: "amber-500",
          primaryText: "text-amber-500",
          primaryBg: "bg-amber-500",
          primaryHoverBg: "hover:bg-amber-600",
          primaryBorder: "border-amber-500",
          primaryLightBg: "bg-amber-50",
          primaryBannerGradient: "from-amber-600 to-orange-500",
          badgeBg: "bg-amber-500 text-slate-900",
          selection: "selection:bg-amber-500 selection:text-slate-955"
        };
      case "indigo":
      default:
        return {
          primary: "indigo-600",
          primaryText: "text-indigo-600",
          primaryBg: "bg-indigo-600",
          primaryHoverBg: "hover:bg-indigo-700",
          primaryBorder: "border-indigo-600",
          primaryLightBg: "bg-indigo-50",
          primaryBannerGradient: "from-indigo-600 to-indigo-500",
          badgeBg: "bg-indigo-600 text-white",
          selection: "selection:bg-indigo-600 selection:text-white"
        };
    }
  };

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

  const getCoreFontStyle = (fontSizeScale = 1) => {
    if (!activeProfile.coreFont) return {};
    const f = activeProfile.coreFont;
    return {
      fontFamily: resolveFontFamily(f.family, activeProfile.customUploadedFontName),
      fontSize: `${f.size * fontSizeScale}px`,
      color: f.color,
      opacity: f.opacity,
      fontWeight: f.weight,
    };
  };

  const getProductFontStyle = (fontSizeScale = 1) => {
    if (!activeProfile.productFont) return {};
    const f = activeProfile.productFont;
    return {
      fontFamily: resolveFontFamily(f.family, activeProfile.customUploadedFontName),
      fontSize: `${f.size * fontSizeScale}px`,
      color: f.color,
      opacity: f.opacity,
      fontWeight: f.weight,
    };
  };

  const getDescFontStyle = (fontSizeScale = 1) => {
    if (!activeProfile.descFont) return {};
    const f = activeProfile.descFont;
    return {
      fontFamily: resolveFontFamily(f.family, activeProfile.customUploadedFontName),
      fontSize: `${f.size * fontSizeScale}px`,
      color: f.color,
      opacity: f.opacity,
      fontWeight: f.weight,
    };
  };

  const getThemeStyles = (style: string) => {
    let fontClass = "";
    const chosenFont = activeProfile.customFont || (style === "tech" ? "tech" : style === "retro" ? "retro" : style === "wellness" ? "serif" : "sans");
    const isDark = activeProfile.colorMode === "dark";
    
    switch (chosenFont) {
      case "sans":
        fontClass = "font-sans tracking-wide";
        break;
      case "mono":
        fontClass = "font-mono tracking-normal";
        break;
      case "tech":
        fontClass = "font-tech tracking-tight";
        break;
      case "serif":
        fontClass = "font-serif tracking-normal";
        break;
      case "retro":
        fontClass = "font-retro tracking-wide";
        break;
      default:
        fontClass = "font-sans tracking-normal";
    }

    switch (style) {
      case "tech":
        return {
          fontFamily: fontClass,
          monoFont: "font-mono",
          cardClass: isDark 
            ? "bg-slate-950 text-white border border-slate-900 shadow-md relative rounded-3xl overflow-hidden flex flex-col justify-between"
            : "bg-slate-900 text-white border border-slate-800 shadow-md relative rounded-3xl overflow-hidden flex flex-col justify-between",
          buttonStyle: "rounded-full transition-all text-[11px] font-bold py-2 px-4 shadow-sm",
          headerBg: isDark ? "bg-black border-b border-slate-950" : "bg-slate-950 border-b border-slate-850",
          headerText: "text-white",
          badge: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded uppercase text-[8px] font-mono",
          benefitsBg: isDark ? "bg-[#0b0c10] text-slate-400 border-none" : "bg-[#141414] text-slate-300 border-none",
          footerBg: isDark ? "bg-black text-slate-500 border-t border-slate-950" : "bg-slate-950 text-slate-505 border-t border-slate-905",
          nameColor: "text-white",
          descColor: "text-slate-400 font-mono text-[11px]",
          inputField: "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500",
          navClass: isDark ? "bg-black text-white py-2 px-4 shadow-sm border-t border-slate-900" : "bg-slate-900 text-white py-2 px-4 shadow-sm border-t border-slate-800"
        };
      case "retro":
        return {
          fontFamily: fontClass,
          monoFont: "font-retro",
          cardClass: "bg-black text-rose-500 border-4 border-double border-pink-500 shadow-[4px_4px_0px_0px_rgba(236,72,153,0.30)] relative overflow-hidden flex flex-col justify-between rounded-none",
          buttonStyle: "rounded-none transition-all uppercase text-[10px] font-black border-2 border-pink-500 py-1.5 px-3 block text-center",
          headerBg: "bg-black border-b-4 border-pink-500",
          headerText: "text-pink-500 font-retro",
          badge: "bg-yellow-400 text-black border border-white font-retro uppercase text-[8px] px-1 rounded-none",
          benefitsBg: "bg-slate-950 text-pink-400 border-y border-dashed border-pink-500 rounded-none",
          footerBg: "bg-black text-rose-500 border-t-4 border-pink-500 rounded-none",
          nameColor: "text-rose-400 uppercase font-black",
          descColor: "text-slate-400 font-retro text-[10px]",
          inputField: "bg-black border-2 border-pink-500 text-pink-500 placeholder-rose-900 focus:outline-none focus:ring-0 rounded-none uppercase font-retro text-xs",
          navClass: "bg-black text-pink-500 py-1.5 px-3 border-y-2 border-dashed border-pink-500 rounded-none font-retro uppercase text-[10px] tracking-widest flex items-center overflow-x-auto whitespace-nowrap scrollbar-none"
        };
      case "wellness":
        return {
          fontFamily: fontClass,
          monoFont: "font-sans",
          cardClass: isDark 
            ? "bg-[#182a20] text-[#e3ece7] border border-emerald-950 shadow-sm relative rounded-3xl overflow-hidden flex flex-col justify-between"
            : "bg-emerald-50/10 text-[#2c3e35] border border-emerald-100 shadow-sm relative rounded-3xl overflow-hidden flex flex-col justify-between",
          buttonStyle: "rounded-full transition-all text-xs font-semibold py-2 px-4 shadow-xs",
          headerBg: isDark ? "bg-[#0b130f] border-b border-emerald-950 text-[#e3ece7]" : "bg-[#f4f2ee] border-b border-emerald-100 text-[#2c3e35]",
          headerText: isDark ? "text-emerald-400 font-serif" : "text-emerald-800 font-serif",
          badge: isDark 
            ? "bg-[#1c3226] text-emerald-300 border border-emerald-900 uppercase text-[9px] font-sans px-2 py-0.5 rounded-full font-bold"
            : "bg-emerald-50 text-emerald-800 border border-emerald-200/50 uppercase text-[9px] font-sans px-2 py-0.5 rounded-full font-bold",
          benefitsBg: isDark ? "bg-[#0f1a15] text-[#b3c7bc] border-y border-emerald-950" : "bg-[#fbfbfa] text-[#5c6e64] border-y border-stone-200",
          footerBg: isDark ? "bg-[#0b130f] text-[#8ea497] border-t border-emerald-950" : "bg-[#eae6df] text-stone-600 border-t border-[#eae6df]",
          nameColor: isDark ? "text-[#f0ede6] font-serif text-sm" : "text-stone-900 font-serif text-sm",
          descColor: isDark ? "text-[#b2c6bb] font-sans text-xs" : "text-[#5c6e64] font-sans text-xs",
          inputField: isDark ? "bg-[#13201a] border-emerald-900 text-slate-100 placeholder-[#5c6e64] focus:outline-none focus:ring-1 focus:ring-[#e3ece7] rounded-xl text-xs" : "bg-stone-50 border-emerald-100 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-700 rounded-xl text-xs",
          navClass: isDark ? "bg-[#0e1814] text-[#b3c7bc] py-2.5 px-4 border-b border-emerald-950 font-sans shadow-xs tracking-wide flex items-center overflow-x-auto whitespace-nowrap scrollbar-none" : "bg-[#fcfbfa] text-[#2c3e35] py-2.5 px-4 border-b border-stone-200 font-sans shadow-xs tracking-wide flex items-center overflow-x-auto whitespace-nowrap scrollbar-none"
        };
      case "minimalist":
      default:
        return {
          fontFamily: fontClass,
          monoFont: "font-mono",
          cardClass: isDark 
            ? "bg-slate-900 text-white border border-slate-800 shadow-2xs hover:shadow-xs transition relative rounded-2xl overflow-hidden flex flex-col justify-between"
            : "bg-white text-slate-900 border border-slate-100 shadow-2xs hover:shadow-xs transition relative rounded-2xl overflow-hidden flex flex-col justify-between",
          buttonStyle: "rounded-xl transition-all text-xs font-bold py-2 px-4.5",
          headerBg: isDark ? "bg-slate-950 border-b border-slate-900 text-white" : "bg-white border-b border-slate-200 text-slate-900",
          headerText: isDark ? "text-white" : "text-slate-900",
          badge: isDark ? "bg-slate-800 text-slate-200 border border-slate-700 uppercase text-[9px] px-1.5 rounded font-black" : "bg-slate-100 text-slate-800 border border-slate-200 uppercase text-[9px] px-1.5 rounded font-black",
          benefitsBg: isDark ? "bg-slate-950 text-slate-400 border-y border-slate-900" : "bg-slate-50 text-slate-500 border-y border-slate-100",
          footerBg: isDark ? "bg-slate-950 text-slate-500 border-t border-slate-900" : "bg-[#fafafa] text-slate-400 border-t border-slate-100",
          nameColor: isDark ? "text-white font-bold" : "text-slate-900 font-bold",
          descColor: isDark ? "text-slate-400 font-sans text-xs" : "text-slate-500 font-sans text-xs",
          inputField: isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 rounded-xl text-xs" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 rounded-xl text-xs",
          navClass: isDark ? "bg-slate-950 text-slate-300 font-medium text-xs py-2.5 px-4 border-b border-slate-900 flex items-center overflow-x-auto whitespace-nowrap scrollbar-none" : "bg-white text-slate-700 font-medium text-xs py-2.5 px-4 border-b border-slate-100 flex items-center overflow-x-auto whitespace-nowrap scrollbar-none"
        };
    }
  };

  const clr = getAccentColors(activeProfile?.primaryColor || "orange");
  const thm = getThemeStyles(activeProfile?.themeStyle || "tech");
  const isDarkTheme = activeProfile?.colorMode === "dark";
  const bodyBgClass = isDarkTheme 
    ? (activeProfile?.themeStyle === "tech" ? "bg-slate-950" : activeProfile?.themeStyle === "wellness" ? "bg-[#0b130f]" : "bg-slate-950")
    : (activeProfile?.themeStyle === "retro" ? "bg-[#111]" : activeProfile?.themeStyle === "wellness" ? "bg-[#eae6df]" : "bg-[#f4f4f4]");

  // Dynamic visual layout variables that fully adapt to light / dark color modes
  const cardBgClass = isDarkTheme 
    ? "bg-slate-900 border border-slate-800 text-slate-100 shadow-lg" 
    : "bg-white border border-slate-100 text-slate-800 shadow-sm";
  const itemBgClass = isDarkTheme 
    ? "bg-slate-950 border border-slate-850 text-slate-200" 
    : "bg-slate-50 border border-slate-150 text-slate-800";
  const textTitleClass = isDarkTheme ? "text-white" : "text-slate-900";
  const textMutedClass = isDarkTheme ? "text-slate-400" : "text-slate-500";
  
  // Search query state for AliExpress-like instant filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [showBottomAd, setShowBottomAd] = useState(true);

  // Login input fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Shopping simple states
  const [cart, setCart] = useState<{productId: string; qty: number}[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Amazon-Style Product Detail View states
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>("Cobalt Black");
  const [selectedSpec, setSelectedSpec] = useState<string>("Standard Node Base");
  const [activeTab, setActiveTab] = useState<"specs" | "reviews" | "similar">("specs");
  
  // Custom Reviews simulated store
  const [productReviews, setProductReviews] = useState<Record<string, {
    id: string;
    author: string;
    rating: number;
    title: string;
    text: string;
    date: string;
    verified: boolean;
    helpfulCount: number;
  }[]>>({
    "p1": [
      { id: "r1", author: "Dr. Marcus Vance", rating: 5, title: "Exceptional Coherence Metrics", text: "Tested this neural transceiver in our signal testing laboratory. Mean coherence peaked at 99.4%, beyond the rated maximum of 98.6%. Low-thermal coefficient casing keeps physical heat extremely low under synthetic workloads.", date: "May 12, 2026", verified: true, helpfulCount: 24 },
      { id: "r2", author: "Operator Sarah K.", rating: 4, title: "Good unit, slight config friction", text: "We plugged this directly into our distributed cluster. It synced flawlessly with the legacy gateways, but we had to calibrate the bandwidth frequency clock twice. Extremely rugged and stable ever since.", date: "May 18, 2026", verified: true, helpfulCount: 9 }
    ],
    "p2": [
      { id: "r3", author: "Tech Lead J. Chen", rating: 5, title: "Flawless Holographic Tracking", text: "A revolutionary module for peripheral feedback display. Light refraction index holds stable even under direct sunlight testing. Recommend standard Cobalt Black specification options for general system contrast levels.", date: "May 14, 2026", verified: true, helpfulCount: 15 }
    ]
  });

  // State for user review input in product page
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);

  // Live Customer Feedback form fields
  const [feedbackAuthor, setFeedbackAuthor] = useState("");
  const [feedbackProduct, setFeedbackProduct] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Social Login simulators
  const handleSocialClick = (platform: string) => {
    setCustomerSession({
      email: `${platform.toLowerCase()}@express.io`,
      name: `Demo User (${platform})`
    });
    // Add record log
    onAddLog(`[AUTH] User synchronized via mock ${platform} OAuth channel.`);
  };

  // Standard pre-filled test logins
  const handleTestLogin = (role: "customer" | "sme") => {
    if (role === "customer") {
      setLoginEmail("customer@cybermonkey.com");
      setLoginPassword("password123");
    } else {
      setLoginEmail("chief@cybermonkey.com");
      setLoginPassword("smeowner2026");
    }
    setErrorMsg("");
  };

  const handleExecuteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Please fill in both fields.");
      return;
    }

    if (authModal === "sme") {
      // Mock SME Owner Verification
      if (loginEmail === "chief@cybermonkey.com" && loginPassword === "smeowner2026") {
        setAuthModal("none");
        onSmeLoginSuccess();
      } else {
        setErrorMsg("Invalid Owner credentials. Click 'Inject Pre-filled Credentials' directly above to fill valid credentials.");
      }
    } else {
      // Mock Customer Login verification
      setCustomerSession({
        email: loginEmail,
        name: loginEmail.split("@")[0].toUpperCase()
      });
      setAuthModal("none");
      setLoginEmail("");
      setLoginPassword("");
      setErrorMsg("");
    }
  };

  const handleLogoutCustomer = () => {
    setCustomerSession(null);
  };

  const toggleWishlist = (id: string) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(item => item !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  const addToCart = (productId: string) => {
    const existing = cart.find(c => c.productId === productId);
    if (existing) {
      setCart(cart.map(c => c.productId === productId ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { productId, qty: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.productId !== productId));
  };

  const cartTotal = cart.reduce((acc, currentItem) => {
    const p = products.find(prod => prod.id === currentItem.productId);
    return acc + (p ? p.price * currentItem.qty : 0);
  }, 0);

  const triggerCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      const invoiceNum = Math.floor(Math.random() * 90000) + 10000;
      const boughtItems = cart.map(item => {
        const p = products.find(prod => prod.id === item.productId);
        return p ? `${item.qty}x ${p.name}` : "";
      }).filter(Boolean).join(", ");
      
      const newRawFeedLine = `[ORDER-#${invoiceNum}] ${new Date().toLocaleDateString()}: Thank you! ${customerSession?.name || "A valued customer"} placed an order for: [${boughtItems}] totaling $${cartTotal.toFixed(2)}. We're preparing your package for shipment.`;
      
      onAddLog(newRawFeedLine);
      
      setIsCheckingOut(false);
      setCheckoutSuccess(true);
      setCart([]);
      setTimeout(() => setCheckoutSuccess(false), 5000);
    }, 1500);
  };

  const handlePostFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    const recordId = `${Math.floor(Math.random() * 90) + 10}`;
    const dateStr = new Date().toLocaleDateString("en-US", { day: '2-digit', month: 'short', year: 'numeric' });
    const author = feedbackAuthor.trim() || customerSession?.name || "Anonymous Customer";
    const productTag = feedbackProduct ? ` regarding: [${feedbackProduct}]` : "";
    
    const formattedFeedback = `[COMMENT-#${recordId}] ${dateStr}: Customer ${author} commented${productTag}: "${feedbackText.trim()}"`;
    
    onAddLog(formattedFeedback);

    setFeedbackSuccess(true);
    setFeedbackText("");
    setFeedbackProduct("");
    setTimeout(() => setFeedbackSuccess(false), 4000);
  };

  const addToCartWithQty = (productId: string, qty: number) => {
    const existing = cart.find(c => c.productId === productId);
    const p = products.find(prod => prod.id === productId);
    if (existing) {
      setCart(cart.map(c => c.productId === productId ? { ...c, qty: c.qty + qty } : c));
    } else {
      setCart([...cart, { productId, qty }]);
    }
    onAddLog(`[CART] Added ${qty}x "${p ? p.name : productId}" to shopping cart.`);
  };

  const triggerBuyNow = (productId: string, qty: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    setIsCheckingOut(true);
    setTimeout(() => {
      const invoiceNum = Math.floor(Math.random() * 90000) + 10000;
      const newRawFeedLine = `[EXPRESS-ORDER-#${invoiceNum}] ${new Date().toLocaleDateString()}: Speed Checkout completed by ${customerSession?.name || "a customer"} for ${qty}x [${p.name}] ($${(p.price * qty).toFixed(2)}). Tracking info is being generated.`;
      
      onAddLog(newRawFeedLine);
      setIsCheckingOut(false);
      setCheckoutSuccess(true);
      setTimeout(() => setCheckoutSuccess(false), 5000);
    }, 1200);
  };

  const handleAddProductReview = (e: React.FormEvent, pId: string) => {
    e.preventDefault();
    if (!newReviewText.trim() || !newReviewTitle.trim()) return;

    const newRev = {
      id: `rev-${Date.now()}`,
      author: customerSession?.name || "Verified Customer",
      rating: newReviewRating,
      title: newReviewTitle.trim(),
      text: newReviewText.trim(),
      date: new Date().toLocaleDateString("en-US", { day: '2-digit', month: 'short', year: 'numeric' }),
      verified: true,
      helpfulCount: 0
    };

    const currentReviews = productReviews[pId] || [
      { id: "d1", author: "Verified Buyer", rating: 5, title: "Exceeded my expectations", text: `I absolutely love this product. Setup was quick, build quality is solid, and it performs flawlessly.`, date: "May 20, 2026", verified: true, helpfulCount: 4 },
      { id: "d2", author: "Tech Enthusiast", rating: 4, title: "Extremely reliable choice", text: "Solid feel, premium materials, and works exactly as described. Worth every penny.", date: "May 25, 2026", verified: true, helpfulCount: 1 }
    ];

    setProductReviews({
      ...productReviews,
      [pId]: [newRev, ...currentReviews]
    });

    onAddLog(`[REVIEW] Customer submitted a helpful ${newReviewRating}-star review for "${products.find(p => p.id === pId)?.name || pId}": "${newReviewTitle.trim()}"`);

    setNewReviewText("");
    setNewReviewTitle("");
    setNewReviewRating(5);
    setReviewSuccessMsg(true);
    setTimeout(() => setReviewSuccessMsg(false), 3000);
  };

  // Get dynamic unique list of active categories loaded from current products matching this website profile
  const categoriesList = Array.from(new Set(
    products
      .filter(p => {
        const targetSites = normalizeTargetSites(p);
        return targetSites.length === 0 || targetSites.includes("all") || targetSites.includes(activeProfile.id);
      })
      .map(p => p.category)
  )).filter(Boolean);

  // Filter products based on search query and active category vertical, and target website
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      activeCategory === "All" || 
      p.category.toLowerCase() === activeCategory.toLowerCase();

    const targetSites = normalizeTargetSites(p);
    const matchesWebsite =
      targetSites.length === 0 ||
      targetSites.includes("all") ||
      targetSites.includes(activeProfile.id);
      
    return matchesSearch && matchesCategory && matchesWebsite;
  });

  const layout = activeProfile.layoutStyle || "amazon-mega";
  let mainGridClass = "max-w-[1300px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1";
  let col1Span = "lg:col-span-3 space-y-6";
  let col2Span = "lg:col-span-5 space-y-6";
  let col3Span = "lg:col-span-4 space-y-6";

  if (layout === "rows" || layout === "ebay-auction") {
    mainGridClass = "max-w-[1300px] w-full mx-auto p-4 lg:p-6 flex flex-col gap-6 flex-1";
    col1Span = "w-full space-y-6";
    col2Span = "w-full space-y-6";
    col3Span = "w-full space-y-6";
  } else if (layout === "split" || layout === "streetwear-split") {
    mainGridClass = "max-w-[1300px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1";
    col1Span = "lg:col-span-4 space-y-6 lg:border-r border-slate-100 dark:border-slate-800 pr-4";
    col2Span = "lg:col-span-4 space-y-6";
    col3Span = "lg:col-span-4 space-y-6";
  } else if (layout === "masonry" || layout === "pinterest-masonry") {
    mainGridClass = "max-w-[1300px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1";
    col1Span = "lg:col-span-4 space-y-8";
    col2Span = "lg:col-span-4 space-y-4";
    col3Span = "lg:col-span-4 space-y-12";
  } else if (layout === "shopify-clean" || layout === "instagram-grid") {
    mainGridClass = "max-w-[1300px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1";
    col1Span = "lg:col-span-3 space-y-6";
    col2Span = "lg:col-span-9 space-y-6"; // Products list is prominent and wide
    col3Span = "lg:col-span-0 hidden"; // Hide side bar or place it quiet at bottom
  } else if (layout === "bento-editorial") {
    mainGridClass = "max-w-[1300px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1";
    col1Span = "lg:col-span-3 space-y-6";
    col2Span = "lg:col-span-6 space-y-6";
    col3Span = "lg:col-span-3 space-y-6";
  }

  return (
    <div className={isStandalone ? "min-h-screen flex flex-col w-full" : "bg-slate-900 min-h-screen p-1 sm:p-4 md:p-6 lg:p-8 flex flex-col justify-start"} id="multistore_browser_wrapper">
      
      {/* EXQUISITE BROWSER DEVICE CHROME */}
      <div className={isStandalone ? "w-full flex-1 flex flex-col" : "w-full max-w-7xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[90vh]"}>
        
        {/* A. BROWSER TABS BAR */}
        {!isStandalone && (
          <div className="bg-slate-900 border-b border-slate-850 px-4 pt-3 pb-0 flex items-center justify-between gap-4 select-none shrink-0" id="browser_mock_tabs">
            <div className="flex items-end gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
              {/* Window control dots */}
              <div className="flex items-center gap-1.5 px-3 pb-2.5">
                <span className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-650 transition-colors inline-block cursor-not-allowed"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors inline-block cursor-not-allowed"></span>
                <span className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors inline-block cursor-not-allowed"></span>
              </div>
              
              {/* Dynamic tabs for each separate website */}
              {profiles.map((p) => {
                const tabIsActive = p.id === activeProfile.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setIsBrowserLoading(true);
                      setTimeout(() => {
                        setIsBrowserLoading(false);
                        onSwitchProfile(p.id);
                        setDnsErrorUrl(null);
                      }, 400);
                    }}
                    className={`px-4 py-2 text-xs rounded-t-xl font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                      tabIsActive 
                        ? "bg-[#fafafa] text-slate-900 shadow-xs border-t border-x border-slate-800" 
                        : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      p.primaryColor === "orange" ? "bg-orange-500" :
                      p.primaryColor === "rose" ? "bg-rose-500" :
                      p.primaryColor === "emerald" ? "bg-emerald-500" :
                      p.primaryColor === "purple" ? "bg-purple-500" :
                      p.primaryColor === "cyan" ? "bg-cyan-500" :
                      p.primaryColor === "amber" ? "bg-amber-500" : "bg-indigo-600"
                    }`}></span>
                    <span className="truncate max-w-[140px]">{p.name}</span>
                    <span className="text-[9px] opacity-65 font-mono font-normal">.io</span>
                  </button>
                );
              })}
            </div>

            <div className="pb-2.5 hidden sm:flex items-center gap-2 text-slate-500 text-[10px] font-mono">
              <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-750 font-bold text-slate-300">
                {profiles.length} Websites Active
              </span>
            </div>
          </div>
        )}

        {/* B. BROWSER NAVIGATION BAR & SIMULATED URL ADDRESS BAR */}
        {!isStandalone && (
          <div className="bg-slate-900 border-b border-slate-850 p-3 flex items-center gap-3 shrink-0" id="browser_mock_addbar">
            
            {/* Navigation Arrows */}
            <div className="flex items-center gap-1 shrink-0 text-slate-400 select-none">
              <button 
                type="button"
                onClick={() => {
                  onAddLog(`[BROWSER] Back button clicked.`);
                }}
                className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer" 
                title="Back"
              >
                ←
              </button>
              <button 
                type="button"
                onClick={() => {
                  onAddLog(`[BROWSER] Forward button clicked.`);
                }}
                className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer" 
                title="Forward"
              >
                →
              </button>
              <button 
                type="button"
                onClick={handleReload}
                className={`p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer ${
                  isBrowserLoading ? "animate-spin text-indigo-500" : ""
                }`} 
                title="Reload page"
              >
                ↻
              </button>
            </div>

            {/* REAL, EDITABLE ADDRESS BAR WITH SSL PADLOCK AND URL */}
            <form onSubmit={handleUrlSubmit} className="flex-1">
              <div className="relative flex items-center w-full">
                {/* SSL secure padlock icon */}
                <div className="absolute left-3 flex items-center gap-1.5 select-none text-emerald-500 font-bold text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="hidden sm:inline leading-none uppercase font-extrabold tracking-wider text-[8px] bg-emerald-500/10 px-1 border border-emerald-500/10 rounded">SECURE</span>
                </div>
                
                <input
                  type="text"
                  value={typingUrl}
                  onChange={(e) => setTypingUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-12 sm:pl-24 pr-16 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-555 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  placeholder="Type a web address, e.g. https://www.cybermonkey.io"
                />

                <div className="absolute right-3 text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded-md px-1.5 py-0.5 select-none leading-none">
                  Press Enter
                </div>
              </div>
            </form>

            {/* User profile / Ext extensions toolbar */}
            <div className="hidden md:flex items-center gap-2 text-slate-450 shrink-0">
              <div className="w-6 h-6 rounded-md bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold font-mono" title="AdBlock Enabled">
                🛡️
              </div>
              <div className="w-6 h-6 rounded-md bg-yellow-600/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center text-[10px]" title="Bookmarked">
                ★
              </div>
              <div className="w-6.5 h-6.5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300" title="Browser Operator User">
                👤
              </div>
            </div>
          </div>
        )}

        {/* C. VIEWPORT WINDOW COMPONENT PORT */}
        <div className={isStandalone ? "flex-1 relative flex flex-col" : "flex-1 bg-white relative flex flex-col overflow-y-auto max-h-[78vh]"} id="browser_viewport">
          
          {/* Loading Spinner Overlays */}
          {isBrowserLoading ? (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-white font-mono text-xs select-none animate-fadeIn">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4"></div>
              <p className="animate-pulse tracking-widest text-[10px] uppercase font-bold text-slate-400">
                RESOLVING IP ADDRESS VIA DNS...
              </p>
              <p className="text-[11px] text-indigo-400 font-semibold mt-1 font-mono">
                {typingUrl}
              </p>
            </div>
          ) : null}

          {/* DNS URL NOT RECOGNIZED ERROR STATE MAP */}
          {dnsErrorUrl ? (
            <div className="flex-1 bg-slate-950 text-slate-450 flex flex-col items-center justify-center p-6 text-center select-none font-mono text-xs leading-relaxed min-h-[50vh]">
              <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 text-3xl mb-4">
                ⚠️
              </div>
              <h1 className="text-white text-base font-black uppercase tracking-wider mb-2">
                This site can’t be reached
              </h1>
              <p className="max-w-md text-slate-400 text-[11px] leading-relaxed">
                The router could not find any active cloud-based storefront registered for:
                <br />
                <span className="text-slate-100 font-bold mt-1 inline-block text-xs text-indigo-400">{dnsErrorUrl}</span>
              </p>
              <div className="text-[10px] text-slate-600 mt-2">
                DNS_PROBE_FINISHED_NXDOMAIN
              </div>
              
              {/* Dynamic corrective suggestions */}
              <div className="mt-8 p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full space-y-3 font-sans">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-left">
                  Try Browsing One of Your Registered Storefront Websites:
                </p>
                <div className="flex flex-col gap-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setIsBrowserLoading(true);
                        setTimeout(() => {
                          setIsBrowserLoading(false);
                          onSwitchProfile(p.id);
                          setDnsErrorUrl(null);
                        }, 500);
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 text-left border border-slate-800 hover:border-slate-700 transition flex items-center justify-between font-mono text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-300 font-bold text-xs">{p.name}</span>
                      </div>
                      <span className="text-indigo-400 text-[11px] font-bold group-hover:underline">
                        {p.simulatedUrl}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ACTUAL ACTIVE STORE WEBSITES VIEW (Styles are fully customized by active theme) */
            <div className={`${bodyBgClass} min-h-screen ${isDarkTheme ? "text-slate-100" : "text-slate-800"} flex flex-col ${thm.fontFamily} ${clr.selection}`} id="storefront_root">
       
       {/* Advertisement strip for free tier & announcement-dense head layout */}
       {activeProfile.headLayout === "announcement-dense" && (
         <div className="bg-slate-900 border-b border-indigo-500/20 text-indigo-400 font-semibold text-center text-[10.5px] py-2 font-mono uppercase tracking-wider px-4 select-none flex items-center justify-center gap-2">
           <span className="bg-indigo-600 text-white text-[8px] px-1 rounded animate-pulse">PROMOTIONAL</span>
           <span>Exclusive Campaign: Real-time discounts & offline configurations applied in sandbox!</span>
         </div>
       )}

       {/* 1. TOP PREMIUM HEADER BAR WITH DYNAMIC COLOR STYLE PRESET AND BRAND TITLE */}
       <header className={`${thm.headerBg} py-3.5 px-4 lg:px-8 border-b sticky top-0 z-40 shadow-lg transition-colors`}>
         <div className="max-w-[1300px] mx-auto flex flex-col gap-3">
           
           {activeProfile.headLayout === "centered" ? (
             /* ====== CENTERED HEADER LAYOUT ====== */
             <div className="flex flex-col items-center text-center gap-3 w-full py-2">
               {/* Brand Info */}
               <div className="flex flex-col items-center gap-2">
                 {activeProfile.customLogoDataUrl ? (
                   <img src={activeProfile.customLogoDataUrl} alt="custom brand logo" className="w-14 h-14 object-contain shadow-xs rounded-xl" />
                 ) : (
                   <span className="text-4xl select-none">{activeProfile.customIcon || "🔬"}</span>
                 )}
                 <h1 className={`text-2xl font-black tracking-tighter ${thm.headerText} flex items-center gap-1 justify-center`}>
                   {activeProfile.name}
                   <span className={`${clr.primaryText} italic`}>.</span>
                   <span className={`text-[9px] ${clr.primaryBg} ${activeProfile.primaryColor === "cyan" || activeProfile.primaryColor === "amber" ? "text-slate-900" : "text-white"} font-black px-2 py-0.5 rounded-full uppercase tracking-widest font-mono ml-2`}>
                     {activeProfile.themeStyle}
                   </span>
                 </h1>
                 <p className="text-[10px] text-slate-400 font-medium font-mono uppercase tracking-widest">{activeProfile.tagline || "Official Centered Portal"}</p>
               </div>

               {/* Center Row Search and switcher controls stacked */}
               <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-500/10 pt-3 mt-1">
                 {/* Search Input */}
                 <div className="w-full max-w-xl relative flex items-center mx-auto md:mx-0">
                   <div className="relative w-full">
                     <input
                       type="text"
                       placeholder={`Search catalog listings inside ${activeProfile.name}...`}
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className={`w-full bg-black/10 hover:bg-black/20 focus:bg-white text-slate-800 focus:text-black placeholder-slate-400 focus:placeholder-slate-500 text-sm px-4.5 py-2 rounded-full outline-hidden transition-all pr-12 text-semibold border ${clr.primaryBorder}`}
                     />
                     <button 
                       className={`absolute right-1 top-1 bottom-1 px-3.5 ${clr.primaryBg} ${clr.primaryHoverBg} rounded-full flex items-center justify-center text-white transition-colors cursor-pointer`}
                       title="Search items"
                     >
                       <Search className="w-4 h-4 stroke-[2.5]" />
                     </button>
                   </div>
                 </div>

                 {/* Right controllers */}
                 <div className="flex items-center gap-3 flex-wrap">
                   {/* Switcher */}
                   <div className="flex items-center gap-1.5 bg-slate-800/10 border border-slate-300 hover:border-slate-400 px-2.5 py-1 rounded-sm shadow-2xs transition cursor-pointer select-none">
                     <Globe className={`w-3.5 h-3.5 ${clr.primaryText}`} />
                     <select
                       value={activeProfile.id}
                       onChange={(e) => onSwitchProfile(e.target.value)}
                       className="bg-transparent border-none text-[10px] font-black text-slate-700 focus:outline-none cursor-pointer uppercase pr-1 font-mono"
                     >
                       {profiles.map(p => (
                         <option key={p.id} value={p.id} className="text-slate-800 uppercase font-mono">{p.name}</option>
                       ))}
                     </select>
                   </div>

                   {/* Quick USD/EN flag */}
                   <div className="flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-250 text-slate-700 px-2 py-1 rounded border border-slate-200 text-[10px] font-bold font-mono uppercase">
                     <span>🇺🇸 USD</span>
                   </div>

                   {/* Cart status count trigger */}
                   <div className="relative cursor-pointer hover:text-white transition-all flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                     <ShoppingBag className="w-4 h-4 text-orange-500" />
                     {cart.length > 0 && (
                       <span className="bg-orange-500 text-white rounded-full text-[9px] font-black w-4 h-4 flex items-center justify-center font-mono">
                         {cart.reduce((ac, cur) => ac + cur.qty, 0)}
                       </span>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           ) : activeProfile.headLayout === "split-logo" ? (
             /* ====== SPLIT HEADER LAYOUT ====== */
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-2 w-full">
               <div className="md:col-span-4 flex items-center gap-3">
                 {activeProfile.customLogoDataUrl ? (
                   <img src={activeProfile.customLogoDataUrl} alt="custom company logo" className="w-12 h-12 object-contain shadow-xs rounded-md" />
                 ) : (
                   <span className="text-3xl select-none">{activeProfile.customIcon || "🔬"}</span>
                 )}
                 <div>
                   <h1 className={`text-xl font-black tracking-tighter ${thm.headerText} flex items-center gap-1`}>
                     {activeProfile.name}
                     <span className={`${clr.primaryText} italic`}>.</span>
                   </h1>
                   <p className="text-[9px] font-mono uppercase tracking-widest text-[#5c6e64] font-extrabold">{activeProfile.tagline || "Split Brand Interface"}</p>
                 </div>
               </div>

               {/* Search bar inside split */}
               <div className="md:col-span-5 w-full">
                 <div className="relative w-full">
                   <input
                     type="text"
                     placeholder={`Search Catalog inside ${activeProfile.name}...`}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className={`w-full bg-black/15 hover:bg-black/25 focus:bg-white text-slate-800 focus:text-black placeholder-slate-400 focus:placeholder-slate-500 text-sm px-4 py-2 rounded-lg outline-hidden transition-all pr-12 text-semibold border ${clr.primaryBorder}`}
                   />
                   <button 
                     className={`absolute right-1 top-1 bottom-1 px-3.5 ${clr.primaryBg} ${clr.primaryHoverBg} rounded-md flex items-center justify-center text-white transition-colors cursor-pointer`}
                     title="Search items"
                   >
                     <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                   </button>
                 </div>
               </div>

               {/* Right buttons inside split */}
               <div className="md:col-span-3 flex items-center justify-end gap-3 flex-wrap">
                 {/* Switcher */}
                 <div className="flex items-center gap-1 bg-slate-800/10 border border-slate-300 px-2 py-1 rounded text-[10px]">
                   <Globe className="w-3.5 h-3.5 text-slate-400" />
                   <select
                     value={activeProfile.id}
                     onChange={(e) => onSwitchProfile(e.target.value)}
                     className="bg-transparent border-none text-[9px] font-black text-slate-705 focus:outline-none uppercase pr-1 font-mono"
                   >
                     {profiles.map(p => (
                       <option key={p.id} value={p.id} className="text-slate-800 uppercase font-mono">{p.name}</option>
                     ))}
                   </select>
                 </div>

                 {/* Cart */}
                 <div className="relative cursor-pointer hover:text-white transition-all flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                   <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                   {cart.length > 0 && (
                     <span className="bg-orange-500 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center font-mono animate-bounce">
                       {cart.reduce((ac, cur) => ac + cur.qty, 0)}
                     </span>
                   )}
                 </div>
               </div>
             </div>
           ) : (
             /* ====== DEFAULT SLEEK-INLINE / ANNOUNCEMENT LAYOUTS ====== */
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
               {/* Brand logo details */}
               <div className="flex items-center gap-3 self-start md:self-auto">
                 <span className={`text-2xl font-black tracking-tighter ${thm.headerText} flex items-center`}>
                   <span className="mr-2 text-2xl flex items-center text-center select-none" style={{ minWidth: "1.5rem" }}>
                     {activeProfile.customLogoDataUrl ? (
                       <img src={activeProfile.customLogoDataUrl} alt="custom brand logo" className="w-8 h-8 object-contain" />
                     ) : (
                       activeProfile.customIcon || "🔬"
                     )}
                   </span>
                   {activeProfile.name}
                   <span className={`${clr.primaryText} mr-1 italic`}>.</span>
                   <span className={`text-[9px] ${clr.primaryBg} ${activeProfile.primaryColor === "cyan" || activeProfile.primaryColor === "amber" ? "text-slate-900" : "text-white"} font-black px-2 py-0.5 rounded-full ml-1.5 uppercase tracking-widest font-mono`}>
                     {activeProfile.themeStyle}
                   </span>
                 </span>
               </div>

               {/* Dynamic Placeholder Search Input field */}
               <div className="w-full max-w-xl relative flex items-center">
                 <div className="relative w-full">
                   <input
                     type="text"
                     placeholder={`Search catalog listings inside ${activeProfile.name}...`}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className={`w-full bg-black/20 hover:bg-black/30 focus:bg-white text-slate-800 focus:text-black placeholder-slate-400 focus:placeholder-slate-500 text-sm px-4.5 py-2.5 rounded-full outline-hidden transition-all pr-12 text-semibold border ${clr.primaryBorder}`}
                   />
                   <button 
                     className={`absolute right-1 top-1 bottom-1 px-3.5 ${clr.primaryBg} ${clr.primaryHoverBg} rounded-full flex items-center justify-center text-white transition-colors cursor-pointer`}
                     title="Search items"
                   >
                     <Search className="w-4 h-4 stroke-[2.5]" />
                   </button>
                 </div>
               </div>

               {/* Right controllers */}
               <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
                 {/* OMNICHANNEL PUBLIC MULTI-STOREFRONT SELECT SWITCHER */}
                 <div className="flex items-center gap-1.5 bg-slate-800/10 border border-slate-300 hover:border-slate-400 px-2.5 py-1 rounded-sm shadow-2xs transition cursor-pointer select-none">
                   <Globe className={`w-3.5 h-3.5 ${clr.primaryText}`} />
                   <span className="text-[10px] font-black uppercase text-slate-500">Website:</span>
                   <select
                     value={activeProfile.id}
                     onChange={(e) => onSwitchProfile(e.target.value)}
                     className="bg-transparent border-none text-[10px] font-black text-slate-700 focus:outline-none cursor-pointer uppercase pr-1 font-mono"
                   >
                     {profiles.map(p => (
                       <option key={p.id} value={p.id} className="text-slate-800 uppercase font-mono">{p.name}</option>
                     ))}
                   </select>
                 </div>

                 {/* Language Flag details */}
                 <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 transition-all bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-sm border border-slate-250">
                   <span className="text-sm">🇬🇧</span>
                   <span className="font-extrabold text-[10px] font-mono uppercase tracking-wide">USD / EN</span>
                   <ChevronDown className="w-3 h-3 text-slate-400" />
                 </div>
               </div>
             </div>
           )}

            {/* Operational Admin panel redirect */}
            {smeLoggedIn && (
              <button
                onClick={() => onSmeLoginSuccess()}
                className="bg-orange-950/40 hover:bg-orange-900 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-md font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Store Settings
              </button>
            )}

            {/* Client Account block */}
            {customerSession ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-mono">My Account</p>
                  <p className="font-bold text-orange-400 leading-none">{customerSession.name}</p>
                </div>
                <button
                  onClick={handleLogoutCustomer}
                  className="p-1.5 hover:bg-red-950/30 hover:text-red-400 border border-slate-800 rounded-md transition-all text-slate-400"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setErrorMsg("");
                  setAuthModal("customer");
                }}
                className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors text-[11px]"
              >
                <User className="w-4 h-4 text-orange-500 stroke-[2.2]" />
                <span className="font-bold">Welcome, Sign In</span>
              </button>
            )}

            {/* Shopping status count trigger */}
            <div className="relative cursor-pointer hover:text-white transition-all flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <div className="relative">
                <ShoppingBag className="w-4.5 h-4.5 text-orange-500" />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[9px] font-black w-4 h-4 flex items-center justify-center font-mono">
                    {cart.reduce((ac, cur) => ac + cur.qty, 0)}
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-slate-200">Cart</span>
            </div>

        </div>
      </header>

      {/* 2. SUB NAVIGATION BAR (Categories Dropdown & Promo tabs) */}
      <nav className={thm.navClass}>
        <div className="max-w-[1300px] mx-auto flex items-center gap-6 text-xs font-semibold overflow-x-auto whitespace-nowrap scrollbar-none">
          
          {/* Categories select dropdown */}
          <div className="relative">
            <div 
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="bg-[#333] hover:bg-orange-500 cursor-pointer text-white hover:text-white px-4 py-1.5 rounded-md flex items-center gap-2 transition-all select-none"
              id="category_button_trigger"
            >
              <Sliders className={`w-3.5 h-3.5 ${clr.primaryText}`} />
              <span className="text-[11px] uppercase tracking-wider font-extrabold">
                {activeCategory === "All" ? "All Categories" : activeCategory}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {categoryDropdownOpen && (
              <div 
                className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 text-slate-800 py-1.5 font-sans"
                id="category_dropdown_menu"
              >
                <button
                  onClick={() => {
                    setActiveCategory("All");
                    setCategoryDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 font-extrabold transition-all text-xs flex items-center justify-between ${activeCategory === "All" ? "text-orange-600 bg-orange-50/50" : "text-slate-700"}`}
                >
                  <span>All Categories</span>
                  {activeCategory === "All" && <Check className="w-3.5 h-3.5 text-orange-500" />}
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 font-extrabold transition-all text-xs flex items-center justify-between ${activeCategory.toLowerCase() === cat.toLowerCase() ? "text-orange-600 bg-orange-50/50" : "text-slate-700"}`}
                  >
                    <span>{cat}</span>
                    {activeCategory.toLowerCase() === cat.toLowerCase() && <Check className="w-3.5 h-3.5 text-orange-550" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Quick Filtering Spans */}
          <button
            onClick={() => setActiveCategory("All")}
            className={`hover:text-orange-405 transition-all text-xs border-none bg-transparent font-extrabold cursor-pointer ${activeCategory === "All" ? "text-orange-400 bg-slate-800 px-2 py-0.5 rounded" : "text-slate-300"}`}
          >
            All Items
          </button>

          {categoriesList.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`hover:text-orange-400 transition-all text-xs border-none bg-transparent font-extrabold cursor-pointer ${activeCategory.toLowerCase() === cat.toLowerCase() ? "text-orange-400 bg-slate-800 px-2 py-0.5 rounded" : "text-slate-300"}`}
            >
              {cat}
            </button>
          ))}

          {categoriesList.length > 6 && (
            <span 
              onClick={() => setCategoryDropdownOpen(true)}
              className="hover:text-orange-400 cursor-pointer transition-all text-slate-400 text-xs"
            >
              More ▾
            </span>
          )}

          {/* Sme Bridge Gate trigger */}
          <button 
            onClick={() => {
              setErrorMsg("");
              setAuthModal("sme");
            }}
            className={`ml-auto text-[11px] font-extrabold ${clr.primaryBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} px-3.5 py-1 rounded-sm shadow-xs border border-black/10 ${clr.primaryHoverBg} transition-colors uppercase tracking-wider font-mono`}
          >
            SME Terminal
          </button>
        </div>
      </nav>

       {/* 3. "BETTER CHOICES, BETTER PRICES" PROMOTIONAL HEADER GRID (Strictly matches the AliExpress design) */}
       <section 
         className="py-12 border-b transition-all relative overflow-hidden bg-cover bg-center"
         style={(activeProfile.customBannerDataUrl || activeProfile.heroImage) ? { backgroundImage: `url(${activeProfile.customBannerDataUrl || activeProfile.heroImage})` } : { backgroundColor: "#ffffff" }}
       >
         {(activeProfile.customBannerDataUrl || activeProfile.heroImage) && (
           <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] z-0" />
         )}
 
         <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10 px-4">
           
           {/* Left Large Promotion text */}
           <div className="lg:col-span-3 space-y-1">
             <h2 className={`text-xl lg:text-3xl font-black tracking-tight select-none ${(activeProfile.customBannerDataUrl || activeProfile.heroImage) ? "text-white" : "text-slate-900"}`}>
               Better choices,
             </h2>
             <h2 className={`text-xl lg:text-3xl font-black tracking-tight leading-none select-none ${(activeProfile.customBannerDataUrl || activeProfile.heroImage) ? "text-slate-200" : "text-slate-900"}`}>
               better prices
             </h2>
             <p className={`text-[10px] font-bold ${(activeProfile.customBannerDataUrl || activeProfile.heroImage) ? "text-indigo-400" : "text-slate-400"} uppercase tracking-wider`}>
               {activeProfile.tagline || `${activeProfile.name} Official Portal`}
             </p>
           </div>

          {/* Right Benefits Strip (🚚 Value for money, Over 100M items, Fast delivery, Safe payments, etc) */}
          <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
            
            <div className={`p-3 flex flex-col items-center rounded-xl transition-colors ${activeProfile.heroImage ? "bg-[#111]/45 border border-white/5 text-white hover:bg-[#111]/70" : "hover:bg-slate-50 text-slate-900"}`}>
              <div className="p-2 bg-amber-500/10 rounded-full text-orange-600 mb-1.5 flex items-center justify-center">
                <Gift className="w-5 h-5 text-orange-500" />
              </div>
              <h4 className="text-[11px] font-extrabold leading-tight">Value-for-money</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Highly competitive rates</p>
            </div>

            <div className={`p-3 flex flex-col items-center rounded-xl transition-colors ${activeProfile.heroImage ? "bg-[#111]/45 border border-white/5 text-white hover:bg-[#111]/70" : "hover:bg-slate-50 text-slate-900"}`}>
              <div className="p-2 bg-pink-500/10 rounded-full text-pink-500 mb-1.5 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-pink-500" />
              </div>
              <h4 className="text-[11px] font-extrabold leading-tight">100M+ Devices</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Expansive active catalog</p>
            </div>

            <div className={`p-3 flex flex-col items-center rounded-xl transition-colors ${activeProfile.heroImage ? "bg-[#111]/45 border border-white/5 text-white hover:bg-[#111]/70" : "hover:bg-slate-50 text-slate-900"}`}>
              <div className="p-2 bg-blue-500/10 rounded-full text-blue-500 mb-1.5 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <h4 className="text-[11px] font-extrabold leading-tight">Fast delivery</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Sovereign Air dispatch</p>
            </div>

            <div className={`p-3 flex flex-col items-center rounded-xl transition-colors ${activeProfile.heroImage ? "bg-[#111]/45 border border-white/5 text-white hover:bg-[#111]/70" : "hover:bg-slate-50 text-slate-900"}`}>
              <div className="p-2 bg-emerald-500/10 rounded-full mb-1.5 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <h4 className="text-[11px] font-extrabold leading-tight">Safe payments</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Secured key validation</p>
            </div>

            <div className={`p-3 flex flex-col items-center rounded-xl transition-colors ${activeProfile.heroImage ? "bg-[#111]/45 border border-white/5 text-white hover:bg-[#111]/70" : "hover:bg-slate-50 text-slate-900"}`}>
              <div className="p-2 bg-purple-500/10 rounded-full mb-1.5 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-purple-500" />
              </div>
              <h4 className="text-[11px] font-extrabold leading-tight">Buyer protection</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Comprehensive refunds</p>
            </div>

            <div className={`p-3 flex flex-col items-center rounded-xl transition-colors ${activeProfile.heroImage ? "bg-[#111]/45 border border-white/5 text-white hover:bg-[#111]/70" : "hover:bg-slate-50 text-slate-900"}`}>
              <div className="p-2 bg-orange-500/10 rounded-full mb-1.5 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-orange-500" />
              </div>
              <h4 className="text-[11px] font-extrabold leading-tight">Download app</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Scan QR & play</p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. MAIN BODY INTERACTIVE ROUTER (Swaps between standard bento grid and detailed Amazon item view) */}
      {selectedProductId !== null && products.find(p => p.id === selectedProductId) ? (
        (() => {
          const prod = products.find(p => p.id === selectedProductId)!;
          const listPrice = prod.msrp || Math.round(prod.price * 1.45);
          const currentPrice = prod.price;
          const savingsAmount = listPrice - currentPrice;
          const savingsPct = Math.round((savingsAmount / listPrice) * 100);
          
          const defaultReviews = [
            { id: "d1", author: "Dr. Marcus Vance", rating: 5, title: "Exceptional Coherence Metrics", text: `Tested this neural transceiver in our signal testing laboratory. Mean coherence peaked at 99.4%, beyond the rated maximum. Low-thermal coefficient casing keeps physical heat extremely low under synthetic workloads.`, date: "May 12, 2026", verified: true, helpfulCount: 24 },
            { id: "d2", author: "Operator Sarah K.", rating: 4, title: "Good unit, slight config friction", text: `We plugged this directly into our distributed cluster. It synced flawlessly with the legacy gateways, but we had to calibrate the bandwidth frequency clock twice. Extremely rugged and stable ever since.`, date: "May 18, 2026", verified: true, helpfulCount: 9 }
          ];
          const reviews = productReviews[prod.id] || defaultReviews;
          const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

          return (
            <main className={`max-w-[1300px] w-full mx-auto p-4 lg:p-6 rounded-3xl flex flex-col gap-6 flex-1 mt-4 mb-4 ${cardBgClass}`} id="product_detail_page">
              {/* Back breadcrumb bar */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3 font-mono">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setSelectedProductId(null);
                      setSelectedQty(1);
                    }}
                    className="text-orange-600 hover:text-orange-850 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    ‹ Back to results
                  </button>
                  <span>|</span>
                  <span className="text-slate-400">Electronics</span>
                  <span>›</span>
                  <span className="text-slate-400">Cybernetics</span>
                  <span>›</span>
                  <span className="text-slate-400">Semiconductors</span>
                  <span>›</span>
                  <span className="font-semibold text-slate-600">{prod.category}</span>
                </div>
                <div className="text-[11px]">
                  ID: <span className="font-semibold text-slate-700">NTS-{prod.id}</span>
                </div>
              </div>

              {/* Amazon Three-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Left Column: Product Spec Images & Badges (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50 relative flex items-center justify-center min-h-[350px] overflow-hidden group">
                    <img 
                      src={prod.imageUrl || "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=600"} 
                      alt={prod.name} 
                      className="max-h-[320px] object-contain rounded-lg group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 font-mono">
                      <span className="bg-orange-500 text-white font-extrabold px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-white" /> #1 Best Seller
                      </span>
                      <span className="bg-yellow-400 text-black font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider italic">
                        ✓ Choice Deal
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs text-slate-300 font-mono text-[9px] p-1.5 rounded-lg border border-slate-800">
                      🔍 Hover image to zoom
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="flex gap-2.5 justify-center overflow-x-auto py-1 font-mono text-[10px]">
                    <div className="w-16 h-16 border-2 border-orange-500 rounded-lg p-1 bg-slate-50 cursor-pointer overflow-hidden flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt="Thumbnail 1" className="object-cover max-h-full" />
                      ) : (
                        <Cpu className="w-5 h-5 text-orange-505" />
                      )}
                    </div>
                    <div className="w-16 h-16 border border-slate-200 hover:border-orange-500 rounded-lg p-1 bg-slate-50 cursor-pointer overflow-hidden flex items-center justify-center opacity-70 hover:opacity-100 transition-all">
                      <img src="https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=150" alt="Thumbnail 2" className="object-cover max-h-full" />
                    </div>
                    <div className="w-16 h-16 border border-slate-200 hover:border-orange-500 rounded-lg p-1 bg-slate-50 cursor-pointer overflow-hidden flex items-center justify-center opacity-70 hover:opacity-100 transition-all">
                      <img src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=150" alt="Thumbnail 3" className="object-cover max-h-full" />
                    </div>
                    <div className="w-16 h-16 border border-slate-200 hover:border-orange-500 rounded-lg p-1 bg-slate-50 cursor-pointer overflow-hidden flex items-center justify-center opacity-70 hover:opacity-100 transition-all">
                      <img src="https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=150" alt="Thumbnail 4" className="object-cover max-h-full" />
                    </div>
                  </div>

                  {/* Quality lock summary badges */}
                  <div className="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-extrabold leading-tight text-slate-900">100% Secure Node</p>
                        <p className="text-[10px] text-slate-400">Military-grade protection</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono">
                      <Truck className="w-4 h-4 text-orange-600 shrink-0" />
                      <div>
                        <p className="font-extrabold leading-tight text-slate-900">Global Air Transport</p>
                        <p className="text-[10px] text-slate-400">Zero latency shipping</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Middle Column: Product Specifications & Listing Details (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                      {prod.name}
                    </h2>
                    <p className="text-xs text-orange-600 font-semibold hover:underline cursor-pointer font-mono">
                      Visit the Cyber Monkey Premium Store
                    </p>
                  </div>

                  {/* Star Rating Info block */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs">
                    <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                      <span className="text-slate-900 font-bold mr-1">{avgRating}</span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-500" : "text-slate-200"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-slate-400">|</span>
                    <button 
                      onClick={() => {
                        const rec = document.getElementById("reviews-section-tab");
                        if (rec) rec.scrollIntoView({ behavior: 'smooth' });
                        setActiveTab("reviews");
                      }}
                      className="text-cyan-600 hover:text-cyan-800 font-semibold hover:underline text-left"
                    >
                      {reviews.length} customer review{reviews.length > 1 ? "s" : ""}
                    </button>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-orange-600 font-mono">
                        ${currentPrice.toFixed(2)}
                      </span>
                      {savingsAmount > 0 && (
                        <span className="text-red-600 font-bold font-mono text-xs bg-red-50 px-1.5 py-0.5 rounded">
                          -{savingsPct}% Limited Deal
                        </span>
                      )}
                    </div>
                    {savingsAmount > 0 && (
                      <div className="text-slate-500 text-xs font-mono space-y-0.5">
                        <p>Typical Retail: <span className="line-through">${listPrice.toFixed(2)}</span></p>
                        <p className="text-emerald-600 font-bold">You save: ${savingsAmount.toFixed(2)} ({savingsPct}%)</p>
                      </div>
                    )}
                  </div>

                  {/* Custom Option Attributes Selector Buttons (Cobalt vs Silver, etc.) */}
                  <div className="space-y-3 pb-2 border-b border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-500 font-mono">Select Color Option:</span>
                      <span className="ml-1.5 font-bold text-slate-800">{selectedColor}</span>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {["Cobalt Black", "Laser Silver", "Aurora Red"].map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setSelectedColor(col)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                              selectedColor === col 
                                ? "border-orange-500 bg-orange-50/20 text-orange-600 font-bold shadow-xs" 
                                : "border-slate-200 hover:border-slate-400 text-slate-600"
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 font-mono">Select Model Edition:</span>
                      <span className="ml-1.5 font-bold text-slate-800">{selectedSpec}</span>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {["Standard Base Edition", "Premium Enhanced", "Pro High-Speed Special"].map((spec) => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => setSelectedSpec(spec)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                              selectedSpec === spec 
                                ? "border-orange-500 bg-orange-50/20 text-orange-600 font-bold shadow-xs" 
                                : "border-slate-200 hover:border-slate-400 text-slate-600"
                            }`}
                          >
                            {spec}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Amazon style Bulletpoints description block */}
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-slate-900 font-mono">About this item</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-600 leading-relaxed">
                      <li>
                        <strong className="text-slate-800">ULTRA-FAST SPEED & PERFORMANCE</strong>: Engineered for high-speed responsiveness. Perfect for gaming, massive multitasking, creative work, or daily streaming.
                      </li>
                      <li>
                        <strong className="text-slate-800">PREMIUM DURABLE BUILD</strong>: Crafted with durable, heat-resistant lightweight alloys and soft-touch materials that assure daily longevity and an aesthetic look.
                      </li>
                      <li>
                        <strong className="text-slate-800">SETUP IN SECONDS</strong>: Convenient plug-and-play capability connects flawlessly to your device with zero complicated drivers or software required.
                      </li>
                      <li>
                        <strong className="text-slate-800">SMART POWER OPTIMIZATION</strong>: Uses smart power-efficiency filters that keep elements running cool, saving energy during intensive activities.
                      </li>
                    </ul>
                  </div>

                </div>

                {/* 3. Right Column: Buy Box (3 cols) */}
                <div className="lg:col-span-3">
                  <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50/80 space-y-4 shadow-xs">
                    <div className="space-y-1">
                      <span className="text-2xl font-black text-slate-900 font-mono">${currentPrice.toFixed(2)}</span>
                      <p className="text-xs text-orange-600 font-semibold font-mono flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> prime
                      </p>
                      <p className="text-[11px] text-slate-500">FREE delivery <span className="font-bold text-slate-800">tomorrow</span>. Order within <span className="text-orange-605 text-orange-600 font-semibold">10 hrs 14 mins</span>.</p>
                    </div>

                    <div className="space-y-1 font-mono">
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <span>●</span> Currently In Stock
                      </p>
                      <p className="text-[10px] text-slate-400">Ships promptly in carefully packaged custom protective casing.</p>
                    </div>

                    {/* Quantity Choice selector drop down */}
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-500 font-bold">Qty:</span>
                      <select 
                        value={selectedQty}
                        onChange={(e) => setSelectedQty(Number(e.target.value))}
                        className="p-1 px-2 border border-slate-300 rounded bg-white text-slate-800 font-bold text-xs cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 10, 20].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    {/* Check out actions */}
                    <div className="space-y-2.5 pt-2 font-mono">
                      <button
                        onClick={() => {
                          addToCartWithQty(prod.id, selectedQty);
                          setSelectedProductId(null);
                        }}
                        className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 font-bold text-xs rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-slate-900 border border-yellow-500 shadow-xs"
                        title="Add to shopping cart"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-slate-900" />
                        Add to Cart
                      </button>

                      <button
                        onClick={() => {
                          triggerBuyNow(prod.id, selectedQty);
                        }}
                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-650 font-bold text-xs rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-white shadow-xs"
                      >
                        Buy Now
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-500 divide-y divide-slate-100 font-mono space-y-1.5 pt-2">
                      <div className="flex justify-between items-center py-1">
                        <span>Ships from</span>
                        <span className="font-semibold text-slate-800">Cyber Monkey Logistics</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Sold by</span>
                        <span className="font-semibold text-slate-800">Cyber Monkey</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Returns</span>
                        <span className="text-cyan-600 font-bold hover:underline cursor-pointer">30-day Free Return</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Specs & Reviews Accordion/Tabs container */}
              <div className="mt-6 border-t border-slate-150 pt-6" id="reviews-section-tab">
                
                {/* Tab layout button bar */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 text-xs font-mono mb-4">
                  <button
                    onClick={() => setActiveTab("specs")}
                    className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTab === "specs" ? "bg-white text-black shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Product Details
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "reviews" ? "bg-white text-black shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Customer reviews ({reviews.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("similar")}
                    className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTab === "similar" ? "bg-white text-black shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Compare Similar Products
                  </button>
                </div>

                {/* Tab content panel A: SPECS */}
                {activeTab === "specs" && (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 lg:p-6 space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">PRODUCT SPECIFICATION TABLE</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-2">
                        <div className="flex justify-between border-b pb-1.5 border-slate-200">
                          <span className="text-slate-400 font-medium">Manufacturer Brand</span>
                          <span className="font-bold text-slate-800">Cyber Monkey</span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5 border-slate-200">
                          <span className="text-slate-400 font-medium">Product Series</span>
                          <span className="font-bold text-slate-800">CMS-{prod.id}-SPECIAL</span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5 border-slate-200">
                          <span className="text-slate-400 font-medium">Hardware Class</span>
                          <span className="font-bold text-slate-800">{prod.category}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5 border-slate-200">
                          <span className="text-slate-400 font-medium">Operating Standard</span>
                          <span className="font-bold text-slate-800">Consumer Compliant</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between border-b pb-1.5 border-slate-200">
                          <span className="text-slate-400 font-medium">Shipping Carrier</span>
                          <span className="font-bold text-slate-800">Cyber Monkey Logistics / Prime</span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5 border-slate-200">
                          <span className="text-slate-400 font-medium">Warranty Protection</span>
                          <span className="font-bold text-slate-800">1-Year Cyber Monkey Warranty</span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5 border-slate-200">
                          <span className="text-slate-400 font-medium">Returns Policy</span>
                          <span className="font-bold text-slate-800">30-day Free Guarantee</span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5 border-slate-200">
                          <span className="text-slate-400 font-medium">Item Weight</span>
                          <span className="font-bold text-slate-800">1.2 lbs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab content panel B: REVIEWS & LIVE SUBMISSION FORM */}
                {activeTab === "reviews" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 antialiased">
                    
                    {/* Left aggregate rating breakdown card */}
                    <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4 font-mono text-xs">
                      <div>
                        <h4 className="font-black text-sm text-slate-900">Customer Reviews</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-500" : "text-slate-200"}`} 
                            />
                          ))}
                          <span className="font-bold text-slate-705 text-slate-900 ml-1">{avgRating} out of 5</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{reviews.length} total rating scores logged.</p>
                      </div>

                      {/* Dummy Distribution Bar */}
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="w-10 text-slate-500 text-right">5 star</span>
                          <div className="flex-1 h-2.5 rounded bg-slate-200 overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: "80%" }}></div>
                          </div>
                          <span className="w-6 text-slate-400">80%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-10 text-slate-500 text-right">4 star</span>
                          <div className="flex-1 h-2.5 rounded bg-slate-200 overflow-hidden text-right">
                            <div className="h-full bg-amber-400" style={{ width: "15%" }}></div>
                          </div>
                          <span className="w-6 text-slate-400">15%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-10 text-slate-500 text-right">3 star</span>
                          <div className="flex-1 h-2.5 rounded bg-slate-200 overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: "5%" }}></div>
                          </div>
                          <span className="w-6 text-slate-400">5%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-10 text-slate-500 text-right">2 star</span>
                          <div className="flex-1 h-2.5 rounded bg-slate-200 overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: "0%" }}></div>
                          </div>
                          <span className="w-6 text-slate-400">0%</span>
                        </div>
                      </div>

                    </div>

                    {/* Right feedback loop review feed + submission card */}
                    <div className="md:col-span-8 space-y-5">
                      
                      {/* Live Review Feed list */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-900 font-mono tracking-widest uppercase">OPERATOR FEEDBACK LOGS (LIVE)</h4>
                        
                        <div className="space-y-3">
                          {reviews.map((rev) => (
                            <div key={rev.id} className="border-b border-slate-100 pb-3 text-xs font-sans">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-805 text-slate-900">{rev.author}</span>
                                <span className="text-[10px] text-slate-400 font-mono">on {rev.date}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${i < rev.rating ? "fill-amber-400 text-amber-500" : "text-slate-200"}`} 
                                  />
                                ))}
                                <span className="font-bold text-slate-900 text-[11px] ml-1.5 font-sans">{rev.title}</span>
                              </div>
                              <p className="text-slate-600 mt-1 leading-normal pl-1 border-l-2 border-slate-100 italic">{rev.text}</p>
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                                <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded">✓ Verified Dispatch Purchase</span>
                                <span>•</span>
                                <button type="button" className="hover:text-amber-600 text-slate-400">Helpful ({rev.helpfulCount})</button>
                                <span>•</span>
                                <button type="button" className="hover:text-amber-600 text-slate-400 font-mono">Report telemetry anomaly</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add telemetry review form */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5 mt-4">
                        <h4 className="text-xs font-extrabold text-slate-900 font-mono uppercase tracking-wide">Write an Amazon-style Product Review</h4>
                        
                        <form onSubmit={(e) => handleAddProductReview(e, prod.id)} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                            <div className="space-y-1">
                              <label className="text-slate-500 font-bold">Review Headline</label>
                              <input 
                                type="text"
                                required
                                placeholder="e.g. Blazing fast transfer velocities"
                                value={newReviewTitle}
                                onChange={(e) => setNewReviewTitle(e.target.value)}
                                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:border-orange-500 font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-500 font-bold">Star Rating Indicator</label>
                              <select
                                value={newReviewRating}
                                onChange={(e) => setNewReviewRating(Number(e.target.value))}
                                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-bold font-mono focus:outline-hidden focus:border-orange-500"
                              >
                                <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                                <option value="4">⭐⭐⭐⭐ (4 - Highly Stable)</option>
                                <option value="3">⭐⭐⭐ (3 - Acceptable)</option>
                                <option value="2">⭐⭐ (2 - Minor Latency)</option>
                                <option value="1">⭐ (1 - Needs Recalibration)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-500 font-mono">Your review details (Pipes instantly into operational logs feed)</label>
                            <textarea
                              required
                              rows={3}
                              placeholder="Describe testing metrics under synthetic workloads. Note system coherence spikes, casing heat coefficients, and general firmware integration ease."
                              value={newReviewText}
                              onChange={(e) => setNewReviewText(e.target.value)}
                              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-805 text-slate-800 focus:outline-hidden focus:border-orange-500"
                            />
                          </div>

                          {reviewSuccessMsg && (
                            <div className="p-2 bg-emerald-50 text-emerald-800 text-[10.5px] rounded-lg border border-emerald-200 font-mono leading-relaxed">
                              ✓ Review submitted successfully! Star ratings updated, telemetry dispatched to operational system.
                            </div>
                          )}

                          <button
                            type="submit"
                            className="py-2 px-5 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-mono cursor-pointer transition-colors"
                          >
                            Post Product Review
                          </button>
                        </form>
                      </div>

                    </div>
                  </div>
                )}

                {/* Tab content panel C: SIMILAR HARDWARE */}
                {activeTab === "similar" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">SIMILAR HARDWARE INTEGRATIONS COMPARISON CHART</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {products.filter(p => p.id !== prod.id).slice(0, 3).map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setSelectedProductId(item.id);
                            setSelectedQty(1);
                          }}
                          className="bg-slate-50 border border-slate-200 hover:border-orange-500 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-2xs group"
                        >
                          <div className="space-y-2">
                             <div className="h-28 bg-slate-900 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center font-mono text-[10px]">
                               {item.imageUrl ? (
                                 <img src={item.imageUrl} alt={item.name} className="max-h-24 object-contain group-hover:scale-105 transition-transform" />
                               ) : (
                                 <div className="flex flex-col items-center justify-center text-slate-505 gap-1 select-none">
                                   <Cpu className="w-8 h-8 text-orange-500 animate-pulse" />
                                   <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Micro-Mod</span>
                                 </div>
                               )}
                             </div>
                            <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">{item.name}</h5>
                            <p className="text-[10px] text-slate-400 font-mono">{item.category}</p>
                            <span className="text-xs font-extrabold text-orange-600 font-mono">${item.price.toFixed(2)}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item.id);
                            }}
                            className="w-full py-1.5 mt-3 bg-slate-200 hover:bg-orange-500 hover:text-white transition-all text-[11px] font-bold font-mono rounded-lg cursor-pointer"
                          >
                            Add to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </main>
          );
        })()
      ) : (
        <div className="flex flex-col w-full flex-1">
          {/* LEADERBOARD ADSENSE SIMULATED BANNER AD (Free Tier only) */}
          {isFreeTier && (
            <div className="max-w-[1300px] w-full mx-auto px-4 lg:px-6 pt-4">
              <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/5 to-amber-500/15 border border-amber-505/30 border-amber-500/30 rounded-2xl p-4.5 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="absolute top-1 left-2 flex items-center gap-1.5">
                  <span className="text-[7.5px] font-black text-amber-600 tracking-wider uppercase font-mono bg-amber-500/10 px-1.5 border border-amber-500/20 rounded animate-pulse">Ad</span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase font-mono">Sponsored Monetization</span>
                </div>
                <div className="flex items-center gap-3.5 mt-2 sm:mt-0">
                  <div className="w-11 h-11 rounded-xl bg-orange-600 flex items-center justify-center text-white text-xl shadow-md shrink-0">
                    🥤
                  </div>
                  <div className="text-left space-y-0.5">
                    <h4 className="text-xs font-black text-slate-800 font-sans tracking-tight">CYBERMONKEY SODA EXTREME</h4>
                    <p className="text-[10px] text-slate-500 tracking-tight font-medium leading-none">Overclock your visual &amp; synaptic compilers. 0g Sugar, 100% Code Speed.</p>
                  </div>
                </div>
                <button 
                  onClick={() => alert("Simulation: Redirecting to CyberMonkey monorepo soda catalog...")}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all font-mono shadow-sm shrink-0 cursor-pointer"
                >
                  Claim 1 Free Can
                </button>
              </div>
            </div>
          )}

          <main className={mainGridClass}>
        
        {/* ==============================================
            COLUMN 1: SIGN IN CARD & WELCOME DEAL (3 COLS) 
           ============================================== */}
        <div className={col1Span}>
          
          {/* Welcome Logged in/sign-in avatar card */}
          <div className={`${cardBgClass} rounded-2xl p-4.5 space-y-4`}>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 overflow-hidden">
                {customerSession ? (
                  <span className="font-extrabold text-sm text-orange-600 font-mono">
                    {customerSession.name.charAt(0)}
                  </span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 leading-tight">Welcome to Cyber Monkey</p>
                <h4 className="text-xs font-black text-slate-900 truncate font-sans">
                  {customerSession ? `Hi, ${customerSession.name}!` : "Sign in to see customized deals"}
                </h4>
              </div>
            </div>

            {/* In login modal/register prompt states */}
            {!customerSession ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setErrorMsg("");
                      setAuthModal("customer");
                    }}
                    className="py-2 bg-black hover:bg-slate-800 text-white font-extrabold text-[11px] rounded-full text-center transition-all cursor-pointer font-mono"
                    id="welcome_register_btn"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => {
                      setErrorMsg("");
                      setAuthModal("customer");
                    }}
                    className="py-2 border border-slate-300 hover:border-slate-800 hover:bg-slate-55 text-slate-800 font-extrabold text-[11px] rounded-full text-center transition-all cursor-pointer font-mono"
                    id="welcome_signin_btn"
                  >
                    Sign in
                  </button>
                </div>

                {/* Social register login badges (Exactly matches the row of circles in the image: Blue Facebook, Cyan Twitter/Telegram, Black Apple, Red Google) */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 text-center font-semibold uppercase tracking-wider">
                    Or connection node via:
                  </p>
                  <div className="flex justify-center items-center gap-2.5">
                    <button
                      onClick={() => handleSocialClick("Facebook")}
                      className="w-8 h-8 rounded-full bg-[#1877f2] text-white flex items-center justify-center font-black text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs"
                      title="Facebook Node Verification"
                    >
                      f
                    </button>
                    <button
                      onClick={() => handleSocialClick("Twitter")}
                      className="w-8 h-8 rounded-full bg-[#1da1f2] text-white flex items-center justify-center font-black text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs"
                      title="Twitter / X Channel"
                    >
                      t
                    </button>
                    <button
                      onClick={() => handleSocialClick("Apple")}
                      className="w-8 h-8 rounded-full bg-[#000000] text-white flex items-center justify-center font-black text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs"
                      title="Apple Crypt-Key Auth"
                    >
                      
                    </button>
                    <button
                      onClick={() => handleSocialClick("Google")}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-red-500 flex items-center justify-center font-bold text-xs hover:border-slate-450 active:scale-95 transition-all shadow-xs"
                      title="Sovereign Google OAuth"
                    >
                      G
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <p className="text-[10px] text-slate-500 font-mono">
                  Access level: <span className="font-bold text-emerald-600">Active Operator Node</span>
                </p>
                <button
                  onClick={handleLogoutCustomer}
                  className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] rounded-full border border-rose-200 transition-all font-mono"
                >
                  Logoff Session
                </button>
              </div>
            )}
          </div>

          {/* Standard Welcome Deal (Left block below profile) */}
          <div className={`${cardBgClass} rounded-2xl p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-black ${clr.primaryText} tracking-tight flex items-center gap-1 font-mono uppercase`}>
                <Percent className={`w-4 h-4 ${clr.primaryText}`} /> Welcome Deal
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase font-mono">Exclusive Price</span>
            </div>

            {products.length > 0 ? (
              <div 
                onClick={() => {
                  setSelectedProductId(products[products.length - 1].id);
                  setSelectedQty(1);
                }}
                className={`space-y-3 bg-slate-50 p-2 rounded-xl border border-slate-100 relative group overflow-hidden cursor-pointer hover:${clr.primaryBorder} hover:shadow-xs transition-all`}
              >
                <div className="h-32 bg-slate-950 rounded-lg overflow-hidden relative">
                  <img
                    src={products[products.length - 1].imageUrl || "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=300"}
                    alt="Exclusive active deal"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {/* Huge AliExpress styled round discount badge! */}
                  <div className="absolute top-2 right-2 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-full font-black text-xs flex items-center justify-center w-10 h-10 shadow-md font-mono animate-bounce">
                    -70%
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className={`text-xs font-bold text-slate-800 truncate group-hover:${clr.primaryText} transition-colors`}>
                    {products[products.length - 1].name}
                  </h4>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-black ${clr.primaryText} font-mono`}>
                      ${(products[products.length - 1].price * 0.3).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through font-mono">
                      MSRP ${(products[products.length - 1].price).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-red-500 font-medium font-mono">Limited welcome quota remaining</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(products[products.length - 1].id);
                  }}
                  className={`w-full py-1.5 ${clr.primaryBg} ${clr.primaryHoverBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} text-[11px] font-black rounded-lg transition-all signature-deal-btn cursor-pointer font-mono`}
                >
                  Claim Active Deal
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-mono">No discounted custom systems listed currently.</p>
            )}
          </div>

        </div>

        {/* ==============================================================
            COLUMN 2: CENTRAL BESTSELLERS DISPATCH (4 COLS)
           ============================================================== */}
        <div className={col2Span}>
          
          <div className={`${cardBgClass} rounded-2xl p-4.5 space-y-4`}>
            
            {/* Header copy */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${clr.primaryBg}`}></span>
                  Bestsellers
                </h3>
                <p className="text-[11px] text-slate-500">Get hardware discounts on popular items</p>
              </div>
              <span className={`text-[11px] font-bold ${clr.primaryText} ${clr.primaryLightBg} px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono`}>
                Popular Grid
              </span>
            </div>

            {/* Simulated Triple phone lineup screen matching the exact picture center bestsellers item */}
            <div className="bg-[#141414] rounded-xl p-4 text-white relative overflow-hidden flex flex-col items-center border border-slate-900 shadow-inner">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
              
              {/* Product picture lineup */}
              <div className="flex justify-center items-end gap-1.5 py-4 relative z-10">
                <div className="w-14 h-28 bg-slate-900 border border-slate-800 rounded-md shadow-lg overflow-hidden transform rotate-[-4deg] relative hover:rotate-0 transition-transform cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=200" alt="Device segment A" referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-90" />
                  <span className="absolute bottom-1 left-1 text-[8px] bg-black/85 text-orange-500 px-1 rounded font-mono">4nm</span>
                </div>
                <div className="w-16 h-32 bg-slate-800 border-2 border-orange-500 rounded-md shadow-2xl overflow-hidden relative z-10 hover:scale-105 transition-transform cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=200" alt="Device segment B" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1.5 text-[8px] bg-orange-500 text-white px-1.5 rounded-full font-bold font-mono">BEST</span>
                </div>
                <div className="w-14 h-28 bg-slate-900 border border-slate-800 rounded-md shadow-lg overflow-hidden transform rotate-[4deg] relative hover:rotate-0 transition-transform cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=200" alt="Device segment C" referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-90" />
                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/85 text-orange-500 px-1 rounded font-mono">ANC</span>
                </div>
              </div>

              {/* Red absolutely-positioned AliExpress circular coupon discount tag */}
              <div className="absolute bottom-16 right-6 bg-red-600 text-white rounded-full flex flex-col items-center justify-center w-14 h-14 shadow-2xl shadow-red-500/40 border-2 border-white select-none animate-pulse">
                <span className="text-[10px] font-semibold leading-none text-red-155">UP TO</span>
                <span className="text-sm font-black leading-none font-mono">-70%</span>
              </div>

              {/* Lineup footer details */}
              <div className="w-full text-center space-y-1 relative z-10 border-t border-slate-800/80 pt-3">
                <h4 className="text-xs font-bold text-slate-100 font-mono tracking-wide uppercase">Cyber Monkey Core hardware bundle</h4>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 line-through">$899.00</span>
                  <span className="font-extrabold text-xs text-orange-500 font-mono bg-orange-950/40 px-2 py-0.5 rounded">
                    Special Bundle: $271.60
                  </span>
                </div>
              </div>
            </div>

            {/* List with live queue selectors for best selling items */}
            <h4 className={`text-[10px] font-extrabold pb-1.5 ${textMutedClass} uppercase tracking-widest font-mono`}>
              ALL SYSTEM COMPONENTS ({filteredProducts.length} items found)
            </h4>
            
            <div className={`pr-1`}>
              {layout === "shopify-clean" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto" id="shopify-clean-wrapper">
                  {filteredProducts.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setSelectedQty(1);
                      }}
                      className={`group border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:scale-[1.015] cursor-pointer ${
                        isDarkTheme ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-150 text-slate-850"
                      }`}
                    >
                      <div className="h-40 w-full relative bg-slate-100 dark:bg-slate-950 overflow-hidden select-none border-b border-slate-150 dark:border-slate-850">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Cpu className="w-8 h-8 text-indigo-550" /></div>
                        )}
                        <span className={`absolute top-1.5 left-1.5 ${clr.primaryBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} font-mono text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-sm`}>HOT</span>
                      </div>
                      
                      <div className="p-3.5 space-y-2 text-left">
                        <span className="text-[8.5px] font-black text-slate-400 uppercase font-mono tracking-wider">{p.category}</span>
                        <h5 className="font-extrabold line-clamp-1 text-xs leading-none text-slate-800 dark:text-white">{p.name}</h5>
                        <p className={`text-[10px] ${textMutedClass} line-clamp-2 leading-tight`}>{p.desc}</p>

                        <div className={`flex justify-between items-center pt-2 mt-1 border-t ${isDarkTheme ? "border-slate-800" : "border-slate-100"}`}>
                          <span className="text-xs font-black font-mono text-rose-600">${p.price.toFixed(2)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p.id);
                            }}
                            className={`px-3 py-1 ${clr.primaryBg} ${clr.primaryHoverBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} text-[9px] font-black uppercase rounded-lg cursor-pointer transition-colors`}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {layout === "etsy-boho" && (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 max-h-[600px] overflow-y-auto" id="etsy-boho-wrapper">
                  {filteredProducts.map((p, idx) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setSelectedQty(1);
                      }}
                      className={`break-inside-avoid rounded-2xl border-2 border-dashed p-3.5 space-y-3.5 text-left shadow-xs flex flex-col justify-between cursor-pointer ${
                        idx % 2 === 0 ? "min-h-[160px]" : "min-h-[190px]"
                      } ${
                        isDarkTheme 
                          ? "bg-slate-900/60 border-indigo-950/45 text-slate-100" 
                          : "bg-orange-50/20 border-orange-200/50 text-slate-850"
                      }`}
                    >
                      <div className="rounded-xl overflow-hidden bg-amber-100 dark:bg-amber-950 select-none h-24 shrink-0 relative">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-950"><Cpu className="w-6 h-6 text-orange-400 font-bold" /></div>
                        )}
                      </div>

                      <div className="space-y-1.5 p-1.5 bg-white/10 dark:bg-black/20 rounded-lg">
                        <h5 className="font-serif font-bold text-xs line-clamp-2 leading-tight text-slate-800 dark:text-slate-200">{p.name}</h5>
                        <span className="text-[8.5px] text-orange-600 dark:text-orange-400 font-bold uppercase font-mono tracking-widest">{p.category}</span>
                        <p className={`text-[9.5px] ${textMutedClass} leading-tight line-clamp-3`}>{p.desc}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 font-mono">
                        <span className="text-xs font-black text-amber-800 dark:text-[#fef08a]">${p.price.toFixed(2)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p.id);
                          }}
                          className={`p-1.5 rounded-full ${clr.primaryBg} ${clr.primaryHoverBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} transition-transform hover:scale-105`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 mr-0" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {layout === "streetwear-split" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 max-h-[600px] overflow-y-auto" id="streetwear-split-wrapper">
                  {filteredProducts.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setSelectedQty(1);
                      }}
                      className={`border-4 border-black p-4 space-y-3 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#4f46e5] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer flex flex-col justify-between ${
                        isDarkTheme ? "bg-slate-900 text-white border-white dark:border-indigo-600" : "bg-white text-slate-900"
                      }`}
                    >
                      <div className="h-32 bg-slate-955 relative border-2 border-black dark:border-indigo-600 overflow-hidden select-none">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black"><Cpu className="w-8 h-8 text-rose-500 animate-pulse" /></div>
                        )}
                        <span className="absolute top-2 left-2 bg-red-650 bg-red-600 text-white font-mono text-[9px] font-black uppercase px-2 border-2 border-black">DROP</span>
                      </div>
                      <div className="text-left space-y-1">
                        <span className="text-[8.5px] bg-black text-white dark:bg-indigo-600 px-1.5 py-0.5 font-bold uppercase tracking-wider">{p.category}</span>
                        <h5 className="text-xs font-black font-sans tracking-tight uppercase leading-none mt-1">{p.name}</h5>
                        <p className="text-[9.5px] line-clamp-2 leading-snug font-medium text-slate-500 dark:text-slate-400">{p.desc}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t-2 border-black dark:border-indigo-600">
                        <span className="text-sm font-black font-mono leading-none">${p.price.toFixed(2)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p.id);
                          }}
                          className="bg-black hover:bg-slate-800 text-white dark:bg-indigo-650 dark:bg-indigo-600 dark:hover:bg-indigo-700 p-2 px-3.5 border-2 border-black font-bold text-[10px] uppercase cursor-pointer"
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {layout === "pinterest-masonry" && (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 max-h-[600px] overflow-y-auto" id="pinterest-masonry-wrapper">
                  {filteredProducts.map((p, idx) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setSelectedQty(1);
                      }}
                      className={`break-inside-avoid border group rounded-3xl overflow-hidden p-3 transition-all hover:bg-slate-100/30 dark:hover:bg-slate-900/30 shadow-xs hover:shadow-md cursor-pointer ${
                        isDarkTheme ? "bg-slate-950 border-slate-850" : "bg-white border-slate-150"
                      } ${idx % 2 === 0 ? "pt-3 pb-5" : "pt-4 pb-7"}`}
                    >
                      <div className="w-full h-44 rounded-2xl overflow-hidden relative border border-slate-205/10">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900"><Cpu className="w-6 h-6 text-purple-400" /></div>
                        )}
                        <span className="absolute bottom-2.5 left-2.5 bg-white/95 dark:bg-black/95 text-slate-800 dark:text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-black shadow-xs">
                          ${p.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="mt-3.5 text-left space-y-1.5 px-1">
                        <span className="text-[8.5px] bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-full font-mono text-slate-500 uppercase">{p.category}</span>
                        <h4 className={`text-xs font-black truncate text-slate-800 dark:text-white group-hover:${clr.primaryText} transition-colors`}>{p.name}</h4>
                        <p className={`text-[9.5px] ${textMutedClass} leading-tight line-clamp-2`}>{p.desc}</p>
                        <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-slate-200/20 mt-2">
                          <span className="text-[9px] font-bold text-emerald-600">✓ Ready to dispatch</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p.id);
                            }}
                            className={`p-1.5 ${clr.primaryBg} ${clr.primaryHoverBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} rounded-full hover:scale-105 transition-all cursor-pointer`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {layout === "instagram-grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto" id="instagram-grid-wrapper">
                  {filteredProducts.map((p, idx) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setSelectedQty(1);
                      }}
                      className={`border overflow-hidden rounded-2xl transition-all cursor-pointer ${
                        isDarkTheme ? "bg-slate-950 border-slate-900" : "bg-white border-slate-150"
                      }`}
                    >
                      <div className="flex items-center gap-2 p-2.5 border-b border-slate-200 dark:border-slate-850">
                        <div className={`w-6 h-6 rounded-full ${clr.primaryBg} flex items-center justify-center text-[10px] font-black text-white`}>
                          {activeProfile.customIcon || "🛠️"}
                        </div>
                        <div className="text-left">
                          <p className="text-[10.5px] font-black text-slate-900 dark:text-white leading-none">{activeProfile.name}</p>
                          <span className="text-[7.5px] text-slate-400 font-mono">Sponsored</span>
                        </div>
                      </div>

                      <div className="aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black"><Cpu className="w-10 h-10 text-rose-500 animate-pulse" /></div>
                        )}
                      </div>

                      <div className="p-3 space-y-2 text-left">
                        <div className="flex gap-3 text-slate-800 dark:text-white items-center">
                          <span className="text-xs cursor-pointer hover:scale-110 transition-transform">❤️ {p.salesCount + idx + 14}</span>
                          <span className="text-xs cursor-pointer hover:scale-110 transition-transform">💬 {(p.viewsCount % 8) + 1}</span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p.id);
                            }}
                            className={`ml-auto p-1.5 ${clr.primaryBg} ${clr.primaryHoverBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} rounded-full transition-transform hover:scale-105 shadow-xs cursor-pointer`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-sans">
                            <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">{activeProfile.name}</span>
                            <span className="text-slate-800 dark:text-slate-200">{p.desc}</span>
                          </p>
                          <h4 className="text-xs font-black text-rose-600 font-mono">${p.price.toFixed(2)}</h4>
                          <p className="text-[9.5px] font-semibold text-indigo-500 font-mono bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded w-fit uppercase">{p.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {layout === "ebay-auction" && (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1" id="ebay-auction-wrapper">
                  {filteredProducts.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setSelectedQty(1);
                      }}
                      className={`border p-3.5 rounded-xl flex flex-wrap sm:flex-nowrap gap-4 items-center justify-between transition-all hover:shadow-md cursor-pointer ${
                        isDarkTheme ? "bg-slate-950 border-slate-850 hover:border-slate-700" : "bg-white border-slate-150 hover:border-slate-205"
                      }`}
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded bg-slate-900 shrink-0 overflow-hidden relative border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <Cpu className="w-6 h-6 text-indigo-500" />
                        )}
                        <span className="absolute top-1 left-1 bg-red-600 text-white font-mono text-[7px] px-1 font-bold rounded">BIDDING FEED</span>
                      </div>

                      <div className="flex-1 min-w-0 text-left space-y-1.5">
                        <h4 className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight group-hover:underline leading-none">{p.name}</h4>
                        <p className={`text-[10px] ${textMutedClass} line-clamp-1`}>{p.desc}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          <span className="text-[9px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-0.5 font-mono font-black rounded">⏱️ 1h 24m left</span>
                          <span className="text-[9px] text-slate-400 font-bold font-mono">15 bids submitted</span>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono px-2 py-0.5 rounded">{p.category}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 min-w-[100px] flex flex-col justify-center items-end gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-105 dark:border-slate-850 pt-2.5 sm:pt-0 sm:pl-4">
                        <p className="text-sm font-black font-mono leading-none tracking-tight text-slate-900 dark:text-white">${p.price.toFixed(2)}</p>
                        <p className="text-[8px] text-slate-400 uppercase font-mono font-bold">Buy-It-Now price</p>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p.id);
                          }}
                          className={`p-1 px-3 ${clr.primaryBg} ${clr.primaryHoverBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} text-[9px] font-black uppercase font-mono rounded transition-all cursor-pointer`}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {layout === "bento-editorial" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 max-h-[600px] overflow-y-auto" id="bento-editorial-wrapper">
                  {filteredProducts.map((p, idx) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setSelectedQty(1);
                      }}
                      className={`p-3.5 border rounded-2xl flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                        idx === 0 
                          ? `sm:col-span-1 md:col-span-4 ${isDarkTheme ? "bg-indigo-950/20 border-indigo-900" : "bg-indigo-50/60 border-indigo-150"}` 
                          : `sm:col-span-1 md:col-span-2 ${isDarkTheme ? "bg-slate-950 border-slate-850" : "bg-white border-slate-150"}`
                      }`}
                    >
                      {idx === 0 ? (
                        <div className="space-y-3 text-left w-full">
                          <span className="bg-indigo-600 text-white font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded-sm inline-block">MEMBER SPOTLIGHT EDITORIAL</span>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/3 h-28 bg-slate-900 rounded-xl overflow-hidden shrink-0 relative">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500"><Cpu className="w-7 h-7" /></div>
                              )}
                            </div>
                            <div className="space-y-1.5 flex-1 select-text">
                              <h5 className="text-xs sm:text-sm font-black uppercase leading-tight text-indigo-700 dark:text-indigo-400">{p.name}</h5>
                              <p className={`text-[10px] md:text-xs ${textMutedClass} leading-snug line-clamp-3`}>{p.desc}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-slate-305 dark:border-slate-800 font-mono">
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">${p.price.toFixed(2)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p.id);
                              }}
                              className={`px-4 py-1.5 ${clr.primaryBg} ${clr.primaryHoverBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} text-[10px] font-black uppercase rounded-lg cursor-pointer`}
                            >
                              Get Spotlight
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-left flex flex-col justify-between h-full w-full">
                          <div className="space-y-2">
                            <div className="h-20 rounded-xl bg-slate-900 overflow-hidden relative flex items-center justify-center">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-950"><Cpu className="w-5 h-5" /></div>
                              )}
                            </div>
                            <h5 className="text-[11px] font-black uppercase truncate text-slate-805 dark:text-white mt-1 leading-none">{p.name}</h5>
                            <p className={`text-[9.5px] ${textMutedClass} line-clamp-2 leading-snug`}>{p.desc}</p>
                          </div>
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100 dark:border-slate-850 font-mono">
                            <span className="text-[10.5px] font-black text-slate-850 dark:text-white">${p.price.toFixed(2)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p.id);
                              }}
                              className={`p-1.5 ${clr.primaryBg} ${clr.primaryHoverBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} rounded-lg hover:scale-105 transition-transform cursor-pointer`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Standard Classic fallbacks: amazon-mega or other layout types */}
              {layout !== "shopify-clean" && layout !== "etsy-boho" && layout !== "streetwear-split" && layout !== "pinterest-masonry" && layout !== "instagram-grid" && layout !== "ebay-auction" && layout !== "bento-editorial" && (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto" id="amazon-mega-wrapper">
                  {filteredProducts.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setSelectedQty(1);
                      }}
                      className={`flex items-center gap-3 ${itemBgClass} hover:${clr.primaryBorder}/40 hover:${clr.primaryLightBg} p-2.5 rounded-xl transition-all cursor-pointer hover:shadow-xs group`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-550">
                            <Cpu className={`w-5 h-5 ${clr.primaryText} animate-pulse`} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className={`text-xs font-bold truncate leading-none ${textTitleClass} group-hover:${clr.primaryText} transition-colors`}>{p.name}</h4>
                          <span className={`text-xs font-black font-mono ${textTitleClass}`}>${p.price.toFixed(2)}</span>
                        </div>
                        <p className={`text-[10px] ${textMutedClass} line-clamp-1 mt-1`}>{p.category} | {p.desc}</p>
                        {p.buyingPrice && (
                          <span className="text-[9px] text-emerald-600 bg-emerald-100/10 px-1.5 py-0.2 rounded font-mono font-bold mt-1 inline-block">
                            Buying price: ${p.buyingPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p.id);
                        }}
                        className={`p-1.5 ${clr.primaryBg} ${clr.primaryHoverBg} ${activeProfile.primaryColor === 'cyan' || activeProfile.primaryColor === 'amber' ? 'text-slate-900' : 'text-white'} rounded-lg transition-all cursor-pointer`}
                        title="Add directly to dispatch queue"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ==============================================================
            COLUMN 3: CHOICE TILES & WEEKLY OFFERS + LOG VIEW (5 COLS)
           ============================================================== */}
        <div className={col3Span}>
          
          {/* Tile A: AliExpress styled "✓ Choice" banner & product tiles row */}
          <div className={`${cardBgClass} rounded-2xl p-4.5 space-y-3`}>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="bg-yellow-400 text-black font-black italic px-2 py-0.5 rounded text-[11px] leading-none uppercase tracking-wide">
                  ✓ Choice
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-[10.5px] font-bold text-slate-705">Fast Free shipping</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 uppercase font-black">Choice Specials</span>
            </div>

            {/* Three side-by-side product preview boxes exactly like choice items layout */}
            <div className="grid grid-cols-3 gap-2 pb-2">
              
              <div className="bg-slate-50 border border-slate-1s0 rounded-xl p-1.5 text-center relative flex flex-col justify-between h-36">
                <div className="h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                  <img src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=150" alt="Earbuds" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-slate-700 truncate">Acoustic pods</h4>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black text-orange-600 font-mono leading-none">$18.99</span>
                    <span className="text-[8px] text-slate-400 line-through font-mono">$189.90</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const found = products.find(prod => prod.category.toLowerCase().includes("acoustic") || prod.id === "p3");
                    if (found) addToCart(found.id);
                  }}
                  className="w-full py-0.5 bg-black hover:bg-slate-800 text-white text-[8px] font-black rounded-sm uppercase tracking-wide cursor-pointer font-mono"
                >
                  Grab
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-1s0 rounded-xl p-1.5 text-center relative flex flex-col justify-between h-36">
                <div className="h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                  <img src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=150" alt="Keyboard" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-slate-700 truncate">Holo Keyboard</h4>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black text-orange-600 font-mono leading-none">$43.00</span>
                    <span className="text-[8px] text-slate-400 line-through font-mono">$249.00</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const found = products.find(prod => prod.category.toLowerCase().includes("peripheral") || prod.id === "p2");
                    if (found) addToCart(found.id);
                  }}
                  className="w-full py-0.5 bg-black hover:bg-slate-800 text-white text-[8px] font-black rounded-sm uppercase tracking-wide cursor-pointer font-mono"
                >
                  Grab
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-1s0 rounded-xl p-1.5 text-center relative flex flex-col justify-between h-36">
                <div className="h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                  <img src="https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=150" alt="VR VR" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-slate-700 truncate">Vision Visor</h4>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black text-orange-600 font-mono leading-none">$120.00</span>
                    <span className="text-[8px] text-slate-400 line-through font-mono">$420.00</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const found = products.find(prod => prod.category.toLowerCase().includes("optic") || prod.id === "p4");
                    if (found) addToCart(found.id);
                  }}
                  className="w-full py-0.5 bg-black hover:bg-slate-800 text-white text-[8px] font-black rounded-sm uppercase tracking-wide cursor-pointer font-mono"
                >
                  Grab
                </button>
              </div>

            </div>

          </div>

          {/* Tile B: "Weekly deals" container with subtitle "Low prices in the past 30 days" */}
          <div className={`${cardBgClass} rounded-2xl p-4.5 space-y-3`}>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center justify-between">
                <span>Weekly deals</span>
                <span className="text-[10px] text-slate-400 font-semibold font-sans normal-case">Updated 1h ago</span>
              </h3>
              <p className="text-[11px] text-slate-500">Exceptional low price records in the past 30 days</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-1">
              {products.slice(0, 2).map((prod) => (
                <div 
                  key={prod.id} 
                  onClick={() => {
                    setSelectedProductId(prod.id);
                    setSelectedQty(1);
                  }}
                  className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center gap-2.5 cursor-pointer hover:border-orange-500 hover:shadow-2xs transition-all group lg:min-h-[48px]"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200 flex items-center justify-center">
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Cpu className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">{prod.name}</h5>
                    <p className="text-[11px] font-extrabold text-orange-600 font-mono">From ${(prod.price * 0.5).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Interactive Dispatch Cart Terminal (Ensuring cart works) */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center justify-between font-mono">
              <span>Checkout Terminal</span>
              <span className="font-mono bg-orange-950 text-orange-400 border border-orange-800 px-2 py-0.5 rounded text-[10px]">
                {cart.length} modules active
              </span>
            </h3>

            {cart.length > 0 ? (
              <div className="space-y-3">
                <div className="space-y-2 divide-y divide-slate-800 max-h-[160px] overflow-y-auto pr-1">
                  {cart.map((cartItem, idx) => {
                    const prod = products.find(p => p.id === cartItem.productId);
                    if (!prod) return null;
                    return (
                      <div key={idx} className="flex items-center justify-between text-[11px] pt-2 font-mono">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-black text-orange-500">{cartItem.qty}x</span>
                          <span className="text-slate-300 truncate max-w-[125px]">{prod.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-slate-100">${(prod.price * cartItem.qty).toFixed(2)}</span>
                          <button
                            onClick={() => removeFromCart(cartItem.productId)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Dispatch total:</span>
                  <span className="text-sm font-black font-mono text-orange-400">${cartTotal.toFixed(2)}</span>
                </div>

                {checkoutSuccess && (
                  <div className="p-2 bg-emerald-950/25 text-emerald-400 border border-emerald-900/35 text-[10.5px] rounded-lg">
                    ✓ Transaction complete! Dispatched package to telemetry logs feed.
                  </div>
                )}

                <button
                  onClick={triggerCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-650 text-white font-black text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono"
                >
                  {isCheckingOut ? "Calibrating dispatch channels..." : "Instant Secure Gateway Dispatch"}
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 bg-[#161616] rounded-xl border border-slate-800 border-dashed">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-600 mb-1.5 stroke-[1.4]" />
                <p className="text-[10px] font-mono">Shopping Cart is currently empty.</p>
              </div>
            )}
          </div>

          {/* SIDEBAR BLOCK SIMULATED AD (Free Tier only) */}
          {isFreeTier && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100 rounded-2xl p-4.5 space-y-3.5 relative overflow-hidden text-left">
              <div className="absolute top-1 left-2 flex items-center gap-1">
                <span className="text-[7px] font-black text-indigo-500 tracking-wider uppercase font-mono bg-indigo-500/10 px-1 border border-indigo-500/15 rounded animate-pulse">Ad</span>
                <span className="text-[7.5px] text-slate-400 font-bold font-mono">By Antigravity systems</span>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-24 bg-slate-950 rounded-xl flex items-center justify-center font-mono text-[10px] overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 animate-pulse" />
                  <span className="text-indigo-400 font-extrabold text-xs tracking-widest text-center px-4 animate-bounce">
                    ANTIGRAVITY BUILDER
                  </span>
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-slate-800 leading-none">Defy Platform Physics</h5>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">
                    Deploy separate, standalone web experiences in 1 click. Connect Google Sheets boards effortlessly.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => alert("Simulation: Launching Antigravity AI Console in a sandbox...")}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all font-mono cursor-pointer"
              >
                Sign Up for Free Hub
              </button>
            </div>
          )}

          {/* System Review submission feeder (Keeps feedback logic working perfectly) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                Live Review channel Feed
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Pipes customer telemetry reviews dynamically into our AI categorizing sorter.
              </p>
            </div>

            <form onSubmit={handlePostFeedback} className="space-y-3">
              <input
                type="text"
                placeholder={customerSession ? customerSession.name : "e.g., Engineer Ramirez"}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-801 focus:outline-hidden focus:border-orange-500 font-mono"
                value={feedbackAuthor}
                onChange={(e) => setFeedbackAuthor(e.target.value)}
              />

              <select
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-mono focus:outline-hidden focus:border-orange-500"
                value={feedbackProduct}
                onChange={(e) => setFeedbackProduct(e.target.value)}
              >
                <option value="">General Service / Delivery</option>
                {products.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>

              <textarea
                required
                placeholder="Review details (e.g. Visor screen brightness spiked on direct sun. Firmware needs optimization)."
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 min-h-[60px] resize-y focus:outline-hidden focus:border-orange-500"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />

              {feedbackSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-[10.5px] rounded-lg border border-emerald-200">
                  ✓ Transmitted! Review logged into autonomous sorted feedback list.
                </div>
              )}

              <button
                type="submit"
                className="w-full py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors font-mono"
              >
                Submit Feedback Telemetry
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
    )}

      {/* 5. AUTHENTICATION POPUP DIALOG */}
      {authModal !== "none" && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 relative space-y-4 text-slate-900">
            
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-black text-slate-900 font-mono flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-orange-500" />
                  {authModal === "sme" ? "Enterprise Operations Panel Login" : "Client Credentials Init"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {authModal === "sme" 
                    ? "Enter administrative pins to verify system clearance." 
                    : "Create temporary operator login key."}
                </p>
              </div>
              <button
                onClick={() => setAuthModal("none")}
                className="text-slate-400 hover:text-black font-extrabold text-xl select-none"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest font-mono block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Auto-Credential Bypass Pass
              </span>
              <p className="text-[11px] text-slate-500 leading-normal">
                Click here to automatically load verified credentials configured in database nodes:
              </p>
              <button
                type="button"
                onClick={() => handleTestLogin(authModal === "sme" ? "sme" : "customer")}
                className="py-1 px-3 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black font-mono rounded active:scale-95 transition-all text-center cursor-pointer block"
              >
                Inject Pre-Filled Demo Credentials
              </button>
            </div>

            <form onSubmit={handleExecuteLogin} className="space-y-3">
              <div className="space-y-0.5">
                <label className="text-[10.5px] font-bold text-slate-500 block font-mono">Email address</label>
                <input
                  type="email"
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:border-orange-500 font-mono"
                  placeholder={authModal === "sme" ? "chief@cybermonkey.com" : "customer@cybermonkey.com"}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10.5px] font-bold text-slate-500 block font-mono">Password</label>
                <input
                  type="password"
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:border-orange-500 font-mono"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div className="p-2 bg-red-50 text-red-700 rounded text-[11px] font-mono leading-relaxed border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModal("none")}
                  className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs font-mono"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-black hover:bg-slate-800 text-white rounded-lg font-black text-xs font-mono"
                >
                  Confirm Init
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`${thm.footerBg} py-8 px-4 text-center text-xs mt-auto opacity-80 border-t`}>
        {activeProfile.name} © 2026. {activeProfile.tagline}. All catalogs synced via omnichannel spreadsheet.
      </footer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
