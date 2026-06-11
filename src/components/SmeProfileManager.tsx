import React, { useState } from "react";
import { StorefrontProfile, StorefrontProduct } from "../types";
import DeployNewStorefrontModal from "./DeployNewStorefrontModal";
import StorefrontManager from "./StorefrontManager";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Settings, 
  Palette, 
  Check, 
  Store, 
  Globe, 
  Sparkles, 
  Copy, 
  Edit3, 
  ExternalLink,
  RefreshCw,
  Package,
  Heart,
  Eye,
  Gift,
  Cpu,
  Truck,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  X
} from "lucide-react";

export interface SmeProfileManagerProps {
  profiles: StorefrontProfile[];
  activeProfileId: string;
  onSwitchProfile: (id: string) => void;
  onUpdateProfiles: (updated: StorefrontProfile[]) => void;
  onAddLog: (line: string) => void;
}

export default function SmeProfileManager({
  profiles,
  activeProfileId,
  onSwitchProfile,
  onUpdateProfiles,
  onAddLog
}: SmeProfileManagerProps) {
  
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // Editing current active profile states
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(activeProfile.name);
  const [editedTagline, setEditedTagline] = useState(activeProfile.tagline);
  const [editedBanner, setEditedBanner] = useState(activeProfile.bannerText);
  const [editedColor, setEditedColor] = useState(activeProfile.primaryColor);
  const [editedStyle, setEditedStyle] = useState(activeProfile.themeStyle);
  const [editedUrl, setEditedUrl] = useState(activeProfile.simulatedUrl || "");

  // New Profile creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTagline, setNewTagline] = useState("");
  const [newBanner, setNewBanner] = useState("Big discount on quality collections! Limited deals inside.");
  const [newUrl, setNewUrl] = useState("");
  const [newColor, setNewColor] = useState("indigo");
  const [newStyle, setNewStyle] = useState<"tech" | "retro" | "wellness" | "minimalist font-sans text-xs" | "tech">("tech");
  const [seedPreset, setSeedPreset] = useState<"current" | "tech" | "retro" | "wellness" | "empty">("tech");

  // Multi-tenant provisioning states
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showStorefrontManager, setShowStorefrontManager] = useState(false);

  const handleDeploySuccess = (result: any) => {
    onAddLog(`[PROVISION] ${new Date().toLocaleTimeString()}: Successfully deployed "${result.domain}" (Tenant: ${result.tenantId}). Backend: ${result.backendUrl}`);
  };

  const handleStartEdit = () => {
    setEditedName(activeProfile.name);
    setEditedTagline(activeProfile.tagline);
    setEditedBanner(activeProfile.bannerText);
    setEditedColor(activeProfile.primaryColor);
    setEditedStyle(activeProfile.themeStyle);
    setEditedUrl(activeProfile.simulatedUrl || "");
    setEditMode(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim()) return;

    const updated = profiles.map(p => {
      if (p.id === activeProfile.id) {
        return {
          ...p,
          name: editedName.trim(),
          tagline: editedTagline.trim(),
          bannerText: editedBanner.trim(),
          primaryColor: editedColor,
          themeStyle: editedStyle,
          simulatedUrl: editedUrl.trim() || `https://www.${p.id}.com`
        };
      }
      return p;
    });

    onUpdateProfiles(updated);
    setEditMode(false);
    onAddLog(`[PROFILE-EDIT] ${new Date().toLocaleTimeString()}: Updated node configs for "${editedName}". Theme: ${editedStyle}, Color: ${editedColor}.`);
  };

  const colorOptions = [
    { id: "orange", label: "Orange Alert", bg: "bg-orange-500", rawHex: "#f97316" },
    { id: "rose", label: "Retro Rose", bg: "bg-rose-500", rawHex: "#ec4899" },
    { id: "emerald", label: "Sage Green", bg: "bg-emerald-500", rawHex: "#10b981" },
    { id: "purple", label: "Cyber Violet", bg: "bg-purple-500", rawHex: "#a855f7" },
    { id: "indigo", label: "Classic Indigo", bg: "bg-indigo-505", bgReal: "bg-indigo-600", rawHex: "#4f46e5" },
    { id: "amber", label: "Gold Sunset", bg: "bg-amber-500", rawHex: "#f59e0b" },
    { id: "cyan", label: "Arctic Cyan", bg: "bg-cyan-500", rawHex: "#06b6d4" }
  ];

  const getStyleLabel = (style: string) => {
    switch (style) {
      case "tech": return "Modern Sci-Fi Tech";
      case "retro": return "8-Bit Arcade Retro";
      case "wellness": return "Biohealth & Wellness";
      case "minimalist": return "Modern Elegant Minimalist";
      default: return style;
    }
  };

  // Seeding product database presets
  const getProductPreset = (preset: typeof seedPreset): StorefrontProduct[] => {
    switch (preset) {
      case "current":
        return [...activeProfile.products];
      case "retro":
        return [
          {
            id: `retro-pkg-${Date.now()}-1`,
            name: "Legendary Arcade Stick Box",
            price: 199.00,
            category: "Consoles",
            desc: "Custom physical control deck built with raw cherry microswitches and vintage joystick tension filters.",
            salesCount: 15,
            viewsCount: 120,
            buyingPrice: 85,
            stockCount: 30,
            imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300"
          },
          {
            id: `retro-pkg-${Date.now()}-2`,
            name: "Holographic Pixel Gamepad",
            price: 79.99,
            category: "Accessories",
            desc: "Wireless D-pad overlay styled with custom laser-etched neon engravings and 0.5ms ultra low response speeds.",
            salesCount: 41,
            viewsCount: 302,
            buyingPrice: 32,
            stockCount: 88,
            imageUrl: "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?auto=format&fit=crop&q=80&w=300"
          }
        ];
      case "wellness":
        return [
          {
            id: `well-pkg-${Date.now()}-1`,
            name: "Vagus Nerve Smart Stimulator",
            price: 245.00,
            category: "Wellness",
            desc: "Provides sub-cutaneous bio-electric pulses to soothe the nervous system and decrease ambient cortisol parameters.",
            salesCount: 16,
            viewsCount: 184,
            buyingPrice: 110,
            stockCount: 25,
            imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300"
          },
          {
            id: `well-pkg-${Date.now()}-2`,
            name: "Circadian Day-Glow Lamp Element",
            price: 115.00,
            category: "Eyewear",
            desc: "Sovereign medical desk lamp radiating 10,000 lux circadian rays to supplement low solar density environments.",
            salesCount: 38,
            viewsCount: 220,
            buyingPrice: 48,
            stockCount: 45,
            imageUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&q=80&w=300"
          }
        ];
      case "tech":
        return [
          {
            id: `tech-pkg-${Date.now()}-1`,
            name: "Quantum Multi-core AI Host Node",
            price: 999.00,
            category: "Electronics",
            desc: "Accelerate deep networks in a whisper quiet aluminum cabinet fitted with integrated liquid metal plates.",
            salesCount: 3,
            viewsCount: 99,
            buyingPrice: 550,
            stockCount: 10,
            imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=300"
          },
          {
            id: `tech-pkg-${Date.now()}-2`,
            name: "Ultrasonic Peripheral Audio Buds",
            price: 149.00,
            category: "Audio",
            desc: "Waterproof sovereign audio monitor designed for flawless signal reproduction across deep bass scopes.",
            salesCount: 65,
            viewsCount: 512,
            buyingPrice: 65,
            stockCount: 90,
            imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=300"
          }
        ];
      case "empty":
      default:
        return [];
    }
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTagline.trim()) return;

    const generatedId = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    // Safety check for duplicates
    if (profiles.some(p => p.id === generatedId)) {
      alert("A storefront with that name or path already exists.");
      return;
    }

    const seededProducts = getProductPreset(seedPreset);

    // Format benefit strip default based on style/color
    const formattedBenefits = [
      { title: "Special Deal", desc: "Highly competitive rates", iconName: "Gift" as const },
      { title: "Smart Devices", desc: "Synced catalog products", iconName: "Cpu" as const },
      { title: "Express Deliver", desc: "Rapid transport dispatch", iconName: "Truck" as const },
      { title: "Validated Check", desc: "Safe identity codes", iconName: "Check" as const },
      { title: "Node Guarantee", desc: "100% full buyer support", iconName: "ShieldCheck" as const },
      { title: "Mobile Ready", desc: "Browse from anywhere", iconName: "Smartphone" as const }
    ];

    const finalSimulatedUrl = newUrl.trim() || `https://www.${generatedId}.com`;

    const newProfile: StorefrontProfile = {
      id: generatedId,
      name: newName.trim(),
      tagline: newTagline.trim(),
      categoryDefault: seedPreset === "retro" ? "Consoles" : seedPreset === "wellness" ? "Wellness" : "Electronics",
      primaryColor: newColor,
      themeStyle: newStyle as any,
      bannerText: newBanner.trim(),
      simulatedUrl: finalSimulatedUrl,
      products: seededProducts,
      benefitsStrip: formattedBenefits
    };

    onUpdateProfiles([...profiles, newProfile]);
    setShowCreateModal(false);
    
    // Clear inputs
    setNewName("");
    setNewTagline("");
    setNewBanner("Big discount on quality collections! Limited deals inside.");
    setNewUrl("");
    
    // Switch to new profile automatically for best user experience
    onSwitchProfile(generatedId);
    
    onAddLog(`[PROFILE-CREATE] ${new Date().toLocaleTimeString()}: Deployed brand-new storefront website profile node "${newProfile.name}" initialized with ${seededProducts.length} preset products!`);
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    if (profiles.length <= 1) {
      alert("Cannot delete the last storefront! An operator must maintain at least 1 live active profile.");
      return;
    }

    if (window.confirm(`Are you absolutely sure you want to completely dismantle and shut down storefront: "${profileName}"? This action is irreversible.`)) {
      const filtered = profiles.filter(p => p.id !== profileId);
      
      // If we are deleting the active profile, fall back to another one
      if (activeProfileId === profileId) {
        const nextActive = filtered[0].id;
        onSwitchProfile(nextActive);
      }
      
      onUpdateProfiles(filtered);
      onAddLog(`[PROFILE-DESTROY] ${new Date().toLocaleTimeString()}: Dismantled and offline-scoped storefront "${profileName}".`);
    }
  };

  // Helper to color borders/texts dynamically
  const getAccentBorderClass = (colorName: string) => {
    switch (colorName) {
      case "orange": return "border-orange-500 focus:ring-orange-500 text-orange-600";
      case "rose": return "border-rose-500 focus:ring-rose-500 text-rose-600";
      case "emerald": return "border-emerald-500 focus:ring-emerald-500 text-emerald-600";
      case "purple": return "border-purple-500 focus:ring-purple-500 text-purple-600";
      case "indigo": return "border-indigo-600 focus:ring-indigo-600 text-indigo-700";
      case "amber": return "border-amber-500 focus:ring-amber-500 text-amber-600";
      case "cyan": return "border-cyan-500 focus:ring-cyan-500 text-cyan-600";
      default: return "border-indigo-500 focus:ring-indigo-500 text-indigo-600";
    }
  };

  const getAccentBgClass = (colorName: string) => {
    switch (colorName) {
      case "orange": return "bg-orange-500 hover:bg-orange-600 text-white";
      case "rose": return "bg-rose-500 hover:bg-rose-605 text-white bg-rose-500 hover:bg-rose-600";
      case "emerald": return "bg-emerald-500 hover:bg-emerald-650 text-white bg-emerald-600 hover:bg-emerald-700";
      case "purple": return "bg-purple-500 hover:bg-purple-600 text-white";
      case "indigo": return "bg-indigo-600 hover:bg-indigo-700 text-white";
      case "amber": return "bg-amber-500 hover:bg-amber-600 text-white";
      case "cyan": return "bg-cyan-500 hover:bg-cyan-600 text-white";
      default: return "bg-indigo-600 hover:bg-indigo-700 text-white";
    }
  };

  const getAccentBadgeClass = (colorName: string) => {
    switch (colorName) {
      case "orange": return "bg-orange-50 text-orange-700 border border-orange-100";
      case "rose": return "bg-rose-50 text-rose-700 border border-rose-100";
      case "emerald": return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "purple": return "bg-purple-50 text-purple-700 border border-purple-100";
      case "indigo": return "bg-indigo-50 text-indigo-700 border border-indigo-100";
      case "amber": return "bg-amber-50 text-amber-700 border border-amber-100";
      case "cyan": return "bg-cyan-50 text-cyan-700 border border-cyan-100";
      default: return "bg-indigo-50 text-indigo-700 border border-indigo-100";
    }
  };

  return (
    <div className="space-y-6" id="profiles_manager_panel">
      
      {/* 1. Header with 'Create storefront' button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
            OMNICHANNEL STOREFRONT PROFILE CONTEXTS
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Create, switch, and style multiple distinct websites individually. Live catalogs, reviews, and stats swap automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeployModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-95"
            title="Deploy new standalone storefront with unique domain"
          >
            <Globe className="w-4 h-4 stroke-[2.5]" />
            Deploy Domain
          </button>
          <button
            onClick={() => setShowStorefrontManager(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-95"
            title="Manage provisioned storefronts"
          >
            <Settings className="w-4 h-4 stroke-[2.5]" />
            Manage
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Create Storefront Web Node
          </button>
        </div>
      </div>

      {/* 2. List of current Storefront Web Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {profiles.map((prof) => {
          const isActive = prof.id === activeProfileId;
          const itemsCount = prof.products.length;
          const salesCountTotal = prof.products.reduce((acc, p) => acc + (p.salesCount || 0), 0);
          
          return (
            <div 
              key={prof.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between relative ${
                isActive 
                  ? "border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/5 shadow-md scale-[1.01]" 
                  : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-xs"
              }`}
            >
              
              {/* Highlight badge for active context */}
              {isActive && (
                <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-indigo-600 text-white text-[9px] rounded-full font-black uppercase tracking-widest flex items-center gap-1 shadow-xs">
                  <Check className="w-2.5 h-2.5" /> Managing Active
                </span>
              )}

              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <div className={`p-2.5 rounded-xl ${getAccentBadgeClass(prof.primaryColor)}`}>
                    <Store className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      {prof.name}
                      <span className="text-[10px] font-mono text-slate-400 font-normal">/{prof.id}</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">&ldquo;{prof.tagline}&rdquo;</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono p-2 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="col-span-2 pb-1 border-b border-slate-100">
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-extrabold">Website URL</span>
                    <span className="font-bold text-indigo-700 truncate block">
                      {prof.simulatedUrl || `https://www.${prof.id}.com`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-extrabold">Inventory Size</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {itemsCount} Products
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-extrabold">Total Sales</span>
                    <span className="font-bold text-slate-705 flex items-center gap-1 text-emerald-700">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {salesCountTotal} Units
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-150 flex justify-between">
                    <span className="text-slate-400 uppercase tracking-wider text-[8px] font-extrabold">Theme Style:</span>
                    <span className="font-bold text-slate-600 uppercase text-[9px]">{getStyleLabel(prof.themeStyle)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-2">
                {isActive ? (
                  <button
                    disabled
                    className="flex-1 py-1 px-3 bg-indigo-50 border-transparent text-indigo-400 font-extrabold text-[11px] rounded-lg text-center"
                  >
                    Active Node Selected
                  </button>
                ) : (
                  <button
                    onClick={() => onSwitchProfile(prof.id)}
                    className="flex-1 py-1.5 px-3 bg-white border border-slate-205 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-black text-[11px] rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    Switch Management Context
                  </button>
                )}

                <button
                  type="button"
                  title="Shut down storefront context"
                  onClick={() => handleDeleteProfile(prof.id, prof.name)}
                  disabled={profiles.length <= 1}
                  className={`p-1.5 rounded-lg border text-slate-400 hover:text-red-600 transition-colors ${
                    profiles.length <= 1 ? "opacity-30 cursor-not-allowed" : "hover:border-red-200 cursor-pointer"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. Detailed Profile Configuration Setup (Currently Active Profile Settings Form) */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-slate-500 shrink-0" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Selected Host Settings Node: <span className="text-indigo-650 text-indigo-600">{activeProfile.name}</span>
            </h3>
          </div>
          
          <button
            type="button"
            onClick={() => {
              if (editMode) {
                setEditMode(false);
              } else {
                handleStartEdit();
              }
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {editMode ? "Minimize Details" : "Edit Configuration settings"}
          </button>
        </div>

        {editMode ? (
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Store Website Title Name</label>
                <input 
                  type="text" 
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full p-2.5 border border-slate-205 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold"
                  placeholder="e.g. Cyber Monkey Store"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Website URL (Distinct URL Address)</label>
                <input 
                  type="text" 
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-505 font-mono text-xs text-indigo-700 font-bold"
                  placeholder="e.g. https://www.cybermonkey.io"
                  required
                />
              </div>

              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Store Tagline text (Aesthetic Footer/Header desc)</label>
                <input 
                  type="text" 
                  value={editedTagline}
                  onChange={(e) => setEditedTagline(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  placeholder="e.g. Premium hardware limits"
                  required
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Primary Promotional Banner Text</label>
                <input 
                  type="text" 
                  value={editedBanner}
                  onChange={(e) => setEditedBanner(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  placeholder="Better choices, better prices deal..."
                  required
                />
              </div>

              {/* Color option */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Accent Secondary Color Node</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEditedColor(opt.id)}
                      className={`p-1 px-2 text-[10px] font-bold rounded-lg border-2 flex items-center gap-1.5 transition cursor-pointer ${
                        editedColor === opt.id ? "border-slate-800 bg-white" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${opt.bgReal || opt.bg}`}></span>
                      {opt.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme style option */}
              <div className="space-y-1 col-span-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Visual Design Preset Hub</label>
                <select
                  value={editedStyle}
                  onChange={(e: any) => setEditedStyle(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl w-full bg-white text-slate-700 font-bold"
                >
                  <option value="tech">Modern Sci-Fi Tech Theme (Dark headers, neon cards)</option>
                  <option value="retro">8-Bit Retro Gaming Theme (Fuchsia overlays, pixelated look)</option>
                  <option value="wellness">Bio-hacking Wellness Theme (Sage clean headers, calm textures)</option>
                  <option value="minimalist">Modern Minimalist Elegant (Charcoal thin borders, high contrast spacing)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className={`py-2 px-6 rounded-xl font-extrabold ${getAccentBgClass(editedColor)} transition-all cursor-pointer`}
              >
                Save Settings Nodes
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold"
              >
                Discard
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs">
            <div className="space-y-2">
              <p className="text-[10px] text-slate-450 font-black uppercase tracking-wider">Passive Details</p>
              <div className="space-y-1">
                <p className="text-slate-500">Website URL: <span className="font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded hover:bg-white">{activeProfile.simulatedUrl || `https://www.${activeProfile.id}.com`}</span></p>
                <p className="text-slate-500">Node Identifier: <span className="font-mono text-slate-800 font-bold bg-slate-200 px-1.5 py-0.2 rounded">{activeProfile.id}</span></p>
                <p className="text-slate-800 font-bold">Public Name: <span className="font-bold text-slate-800">{activeProfile.name}</span></p>
                <p className="text-slate-500">Aesthetic Tagline: &ldquo;<span className="italic font-bold text-slate-700">{activeProfile.tagline}</span>&rdquo;</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-slate-450 font-black uppercase tracking-wider">Colors &amp; Styling Parameters</p>
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-2">
                  Accent Shade: 
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono capitalize ${getAccentBadgeClass(activeProfile.primaryColor)}`}>
                    {activeProfile.primaryColor}
                  </span>
                </span>
                <p className="text-slate-500">Design Pipeline: <span className="font-semibold text-slate-705 uppercase font-mono">{activeProfile.themeStyle}</span></p>
                <p className="text-slate-500 shrink-0 select-none truncate">Promo Banner: &ldquo;<span className="font-semibold text-slate-650">{activeProfile.bannerText}</span>&rdquo;</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL: Create Brand New Storefront */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 text-xs font-sans">
            
            {/* Modal header */}
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Launch New Storefront Node
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Sovereign website profile setup, custom-themed from scratch.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Modal body form */}
            <form onSubmit={handleCreateProfile} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Store/Brand Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Retro Byte Arcade"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Store Website URL</label>
                  <input 
                    type="text"
                    placeholder="https://www.retrobyte.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-indigo-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Footer/Aesthetic Subtitle Tagline</label>
                <input 
                  type="text"
                  placeholder="e.g. Ultimate 8-bit chipsets and classic layouts"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Header Promotion Banner text</label>
                <input 
                  type="text"
                  value={newBanner}
                  onChange={(e) => setNewBanner(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Theme Style */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Theme Blueprint Preset</label>
                  <select
                    value={newStyle}
                    onChange={(e: any) => setNewStyle(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl w-full bg-slate-50 text-slate-700 font-bold"
                  >
                    <option value="tech">Modern Sci-Fi Tech</option>
                    <option value="retro">8-Bit Arcade Retro</option>
                    <option value="wellness">Biohealth Wellness</option>
                    <option value="minimalist font-sans text-xs">Elegant Minimalist</option>
                  </select>
                </div>

                {/* Seeding products preset */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Inventory Seeding Database</label>
                  <select
                    value={seedPreset}
                    onChange={(e: any) => setSeedPreset(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl w-full bg-slate-50 text-slate-700 font-semibold"
                  >
                    <option value="tech">Seeded Tech GPU-Buds Bundle</option>
                    <option value="retro">Seeded Retro Console-Monitor Bundle</option>
                    <option value="wellness">Seeded Bio-glasses Wearables Bundle</option>
                    <option value="current">Clone products of Currently Active store</option>
                    <option value="empty">Start with completely Empty catalog</option>
                  </select>
                </div>
              </div>

              {/* Color options */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Accent Secondary Theme Color</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewColor(opt.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                        newColor === opt.id ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${opt.bgReal || opt.bg}`}></span>
                      <span className="text-[8px] font-extrabold capitalize">{opt.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition shadow"
                >
                  Deploy Web Node
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Deploy New Storefront Modal */}
      <DeployNewStorefrontModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        onSuccess={handleDeploySuccess}
      />

      {/* Storefront Manager Modal */}
      {showStorefrontManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Manage Provisioned Storefronts</h2>
              <button
                onClick={() => setShowStorefrontManager(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <StorefrontManager
                onTenantSelect={(tenant) => {
                  onAddLog(`[TENANT-SELECT] ${new Date().toLocaleTimeString()}: Selected tenant "${tenant.domain}"`);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
