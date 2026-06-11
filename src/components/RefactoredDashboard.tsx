import React, { useState } from 'react';
import DashboardHeader, { TabItem } from './DashboardHeader';
import MetricCards from './MetricCards';
import CurrentBalances from './CurrentBalances';
import StoresTable, { StoreRecord } from './StoresTable';
import ActivityFeed, { ActivityItem } from './ActivityFeed';
import AIStorefrontDeployer from './AIStorefrontDeployer';
import SmeCatalogSelector from './SmeCatalogSelector';
import StorefrontInsights from './StorefrontInsights';
import SmeWebsiteCustomizer from './SmeWebsiteCustomizer';
import SmeProfileManager from './SmeProfileManager';
import GoogleSheetsDashboard from './GoogleSheetsDashboard';
import { StorefrontProfile, StorefrontProduct, withNormalizedTargetSites } from '../types';

interface RefactoredDashboardProps {
  userName?: string;
  storefrontProfiles: StorefrontProfile[];
  activeProfileId: string;
  products: StorefrontProduct[];
  rawLogs: string;
  currentPlan: "free" | "monthly" | "yearly";
  isMenuOpen: boolean;
  accountSettings: any;
  smeLoggedIn: boolean;
  activeTab: "overview" | "catalog" | "deployer" | "insights" | "customizer" | "profiles" | "sheets";

  setActiveTab: (tab: "overview" | "catalog" | "deployer" | "insights" | "customizer" | "profiles" | "sheets") => void;
  onSwitchProfile: (id: string) => void;
  onUpdateProfiles: (updated: StorefrontProfile[]) => void;
  onUpdateProducts: (newProducts: StorefrontProduct[] | ((current: StorefrontProduct[]) => StorefrontProduct[])) => void;
  onAddLog: (newLogLine: string) => void;
  onSelectPlan: (plan: "free" | "monthly" | "yearly") => void;
  onMenuToggle: () => void;
  onUpdateAccountSettings: (settings: any) => void;
  onLogout: () => void;
  onNavigateToStore: () => void;
}

// Parsing function to translate raw logs to ActivityFeed items
const parseRawLogsToActivities = (rawLogs: string): ActivityItem[] => {
  if (!rawLogs) return [];
  const lines = rawLogs.split("\n\n").filter(Boolean);
  return lines.map((line, idx) => {
    const match = line.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.*)$/s);
    let type: 'deployment' | 'order' | 'alert' | 'update' = 'update';
    let title = 'System Update';
    let description = line;
    let timestamp = 'Just now';

    if (match) {
      const tag = match[1];
      timestamp = match[2].trim();
      description = match[3].trim();

      if (tag.startsWith('FEEDBACK')) {
        title = 'Customer Feedback';
        type = 'order';
      } else if (tag === 'STOREFRONT-SWAP') {
        title = 'Store Context Switched';
        type = 'update';
      } else if (tag === 'MSMD-DEPLOY' || tag === 'PROVISION') {
        title = 'New Storefront Deployed';
        type = 'deployment';
      } else if (tag === 'PRICE-UPDATE') {
        title = 'Price Manually Updated';
        type = 'update';
      } else if (tag === 'AUTOPILOT-COMPLY') {
        title = 'Autopilot Price Optimization';
        type = 'alert';
      } else if (tag === 'PROFILE-CREATE') {
        title = 'Profile Created';
        type = 'deployment';
      } else if (tag === 'PROFILE-EDIT') {
        title = 'Profile Configuration Edited';
        type = 'update';
      } else if (tag === 'PROFILE-DESTROY') {
        title = 'Profile Dismantled';
        type = 'alert';
      } else {
        title = tag.replace(/-/g, ' ');
      }
    }

    return {
      id: `act-${idx}`,
      title,
      description,
      timestamp,
      email: type === 'deployment' ? 'deployer@sme.ai' : type === 'order' ? 'buyer@market.com' : 'system@sme.ai',
      avatar: title.charAt(0),
      type
    };
  });
};

// Mapping function to translate storefrontProfiles to StoresTable records
const mapProfilesToStoreRecords = (profiles: StorefrontProfile[]): StoreRecord[] => {
  return profiles.map(profile => {
    const totalSales = profile.products ? profile.products.reduce((acc, p) => acc + (p.salesCount || 0), 0) : 0;
    const ordersToday = Math.max(0, Math.round(totalSales * 0.05));
    const status = (profile.simulatedUrl && profile.simulatedUrl.includes('localhost')) ? 'pending' : 'active';

    return {
      id: profile.id,
      domain: profile.simulatedUrl.replace(/^https?:\/\//, '').replace(/^www\./, ''),
      createdDate: '26 Jun 2025',
      ordersToday,
      status: status as 'active' | 'suspended' | 'pending',
      storeUrl: `/store/${profile.id}`
    };
  });
};

export default function RefactoredDashboard({
  userName = "Akrom",
  storefrontProfiles,
  activeProfileId,
  products,
  rawLogs,
  currentPlan,
  isMenuOpen,
  accountSettings,
  smeLoggedIn,
  activeTab,

  setActiveTab,
  onSwitchProfile,
  onUpdateProfiles,
  onUpdateProducts,
  onAddLog,
  onSelectPlan,
  onMenuToggle,
  onUpdateAccountSettings,
  onLogout,
  onNavigateToStore
}: RefactoredDashboardProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  // Compute live multi-tenant metrics
  const totalSales = storefrontProfiles.reduce((sum, profile) => {
    return sum + (profile.products ? profile.products.reduce((acc, p) => acc + (p.salesCount || 0), 0) : 0);
  }, 0);
  const totalRevenue = storefrontProfiles.reduce((sum, profile) => {
    return sum + (profile.products ? profile.products.reduce((acc, p) => acc + (p.price * p.salesCount), 0) : 0);
  }, 0);
  const totalCustomers = Math.round(totalSales * 0.85);

  const metricsData = [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trend: 18,
      period: 'from last month',
      icon: 'revenue' as const
    },
    {
      label: 'New Customers',
      value: totalCustomers.toLocaleString(),
      trend: 12,
      period: 'from last month',
      icon: 'customers' as const
    },
    {
      label: 'Active Stores',
      value: storefrontProfiles.length.toString(),
      trend: storefrontProfiles.length - 2,
      period: 'from last week',
      icon: 'stores' as const
    }
  ];

  // Dynamic monthly balance data based on total revenue
  const baseRevenue = Math.round(totalRevenue / 1000);
  const balanceData = [
    { month: 'Jan', amount: Math.round(baseRevenue * 0.4) || 12 },
    { month: 'Feb', amount: Math.round(baseRevenue * 0.5) || 8 },
    { month: 'Mar', amount: Math.round(baseRevenue * 0.65) || 14 },
    { month: 'Apr', amount: Math.round(baseRevenue * 0.55) || 9 },
    { month: 'May', amount: Math.round(baseRevenue * 0.8) || 11 },
    { month: 'Jun', amount: baseRevenue || 18 }
  ];

  const stores = mapProfilesToStoreRecords(storefrontProfiles);
  const activities = parseRawLogsToActivities(rawLogs);

  // AI Storefront deployer simulator that provisions real storefront profiles
  const handleDeploy = async (payload: {
    name: string;
    description: string;
    style: 'tech' | 'retail' | 'wellness' | 'minimalist';
    fontFamily: 'sans' | 'serif' | 'round' | 'mono';
    headerLayout: 'minimalist' | 'centered' | 'asymmetric';
    isDeployed: boolean;
    virtualUrl: string;
  }) => {
    setIsDeploying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerDesc = payload.description.toLowerCase();
    let theme: "tech" | "retro" | "wellness" | "minimalist" = payload.style === 'minimalist' ? 'minimalist' : (payload.style === 'wellness' ? 'wellness' : 'tech');
    let name = payload.name || 'AI Generated Store';
    let color = payload.style === 'wellness' ? 'emerald' : payload.style === 'minimalist' ? 'indigo' : 'orange';

    if (lowerDesc.includes("retro") || lowerDesc.includes("game") || lowerDesc.includes("arcade") || lowerDesc.includes("vintage")) {
      theme = "retro";
      name = "AI Pixel Retro Shop";
      color = "rose";
    } else if (lowerDesc.includes("wellness") || lowerDesc.includes("health") || lowerDesc.includes("fit") || lowerDesc.includes("meditation")) {
      theme = "wellness";
      name = "AI Organic Wellness Hub";
      color = "emerald";
    } else if (lowerDesc.includes("minimalist") || lowerDesc.includes("simple") || lowerDesc.includes("elegant")) {
      theme = "minimalist";
      name = "AI Minimalist Boutique";
      color = "indigo";
    } else {
      const words = payload.description.split(' ').slice(0, 3).join(' ');
      if (words.trim().length > 3) {
        name = words.replace(/[^a-zA-Z0-9\s]/g, '').trim() + " Tech";
      } else {
        name = "AI Cyber Edge Store";
      }
      color = "orange";
    }

    const generatedId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const virtualUrl = payload.virtualUrl || `https://www.${generatedId}.invowise.shop`;

    if (storefrontProfiles.some(p => p.id === generatedId)) {
      setIsDeploying(false);
      alert("A storefront with that name already exists. Try a different description!");
      return;
    }

    const tenantLayout = {
      id: generatedId,
      name,
      subdomain: `${generatedId}.invowise.shop`,
      isDeployed: true,
      theme: {
        headerLayout: payload.headerLayout,
        fontFamily: payload.fontFamily,
        spacing: 'comfortable' as const,
        borderRadius: 'md' as const,
        primaryColor: color
      }
    };

    const seededProducts: StorefrontProduct[] = [
      withNormalizedTargetSites({
        id: `tenant-${generatedId}-${Date.now()}-1`,
        name: `${name} Starter Bundle`,
        price: 129.00,
        category: 'Featured',
        desc: `${payload.description || 'Instant storefront launch'} with pre-hydrated theme defaults.`,
        salesCount: 18,
        viewsCount: 110,
        buyingPrice: 50,
        stockCount: 24,
        targetSites: [generatedId]
      }),
      withNormalizedTargetSites({
        id: `tenant-${generatedId}-${Date.now()}-2`,
        name: `${name} Signature Pack`,
        price: 189.00,
        category: 'Premium',
        desc: 'Cross-store ready inventory bundle for multi-tenant catalog sync.',
        salesCount: 11,
        viewsCount: 92,
        buyingPrice: 80,
        stockCount: 16,
        targetSites: [generatedId]
      })
    ];

    const newProfile: StorefrontProfile = {
      id: generatedId,
      name: name,
      tagline: `AI Deployed: ${payload.description.slice(0, 50)}...`,
      categoryDefault: theme === "retro" ? "Consoles" : theme === "wellness" ? "Wellness" : "Electronics",
      primaryColor: color,
      themeStyle: theme,
      bannerText: `Welcome to ${name}! Generated by our senior AI architect.`,
      simulatedUrl: virtualUrl,
      isDeployed: true,
      subdomain: tenantLayout.subdomain,
      tenantLayout,
      layoutTheme: tenantLayout.theme,
      headLayout: payload.headerLayout,
      customFont: payload.fontFamily,
      products: seededProducts,
      benefitsStrip: [
        { title: "AI Optimised", desc: "Auto pricing active", iconName: "Cpu" },
        { title: "Express Deliver", desc: "Sovereign Air dispatch", iconName: "Truck" },
        { title: "Safe Check out", desc: "Verified payment keys", iconName: "Check" }
      ]
    };

    onUpdateProfiles([...storefrontProfiles, newProfile]);
    onUpdateProducts(current => [
      ...current,
      ...seededProducts.map(product => ({ ...product, imageUrl: product.imageUrl ?? 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=80' }))
    ]);
    onSwitchProfile(generatedId);
    onAddLog(`[MSMD-DEPLOY] ${new Date().toLocaleTimeString()}: AI Agent successfully conceptualised, themed, and provisioned storefront "${name}" (${theme} style) with ${seededProducts.length} items on ${virtualUrl}.`);
    setIsDeploying(false);
  };

  const handleViewStore = (store: StoreRecord) => {
    onSwitchProfile(store.id);
    setActiveTab("catalog");
  };

  const handleEditStore = (store: StoreRecord) => {
    onSwitchProfile(store.id);
    setActiveTab("customizer");
  };

  const handleDeleteStore = (store: StoreRecord) => {
    if (storefrontProfiles.length <= 1) {
      alert("Cannot delete the last storefront! An operator must maintain at least 1 live active profile.");
      return;
    }
    if (window.confirm(`Are you absolutely sure you want to completely dismantle and shut down storefront: "${store.domain}"?`)) {
      onUpdateProfiles(storefrontProfiles.filter(p => p.id !== store.id));
      onAddLog(`[PROFILE-DESTROY] ${new Date().toLocaleTimeString()}: Dismantled and offline-scoped storefront "${store.domain}".`);
    }
  };

  // Callback to update a single product from the child component
  const handleUpdateProduct = (updatedProduct: StorefrontProduct) => {
    const updatedProfiles = storefrontProfiles.map(profile => {
      const containsProduct = profile.products.some(p => p.id === updatedProduct.id);
      if (containsProduct) {
        return {
          ...profile,
          products: profile.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
        };
      }
      return profile;
    });
    onUpdateProfiles(updatedProfiles);
    onUpdateProducts(current => current.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleAddProduct = (newProduct: StorefrontProduct) => {
    const updatedProfiles = storefrontProfiles.map(profile => ({
      ...profile,
      products: [...profile.products, newProduct]
    }));

    onUpdateProfiles(updatedProfiles);
    onUpdateProducts(current => [newProduct, ...current]);
  };

  const dashboardTabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'catalog', label: 'Product Catalog' },
    { id: 'deployer', label: 'Store Deployer' },
    { id: 'insights', label: 'Store Insights' },
    { id: 'customizer', label: 'Store Customizer' },
    { id: 'profiles', label: 'Profiles Manager' },
    { id: 'sheets', label: 'Sheets Dashboard' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <DashboardHeader
        userName={userName}
        activeTab={activeTab}
        onTabChange={(tabId: any) => setActiveTab(tabId)}
        tabs={dashboardTabs}
        storefrontProfiles={storefrontProfiles}
        activeProfileId={activeProfileId}
        onSwitchProfile={onSwitchProfile}
        onNavigateToStore={onNavigateToStore}
        onOpenSettings={onMenuToggle}
        onLogout={onLogout}
        onMenuToggle={() => setHeaderMenuOpen(!headerMenuOpen)}
        menuOpen={headerMenuOpen}
      />

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Welcome Section */}
        {activeTab === 'overview' && (
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Good Morning, {userName}!</h1>
            <p className="text-gray-500 text-sm mt-1">Thursday, 26 Jun 2025 • Multi-tenant management console</p>
          </div>
        )}

        {/* Tab-driven layout rendering */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div>
              <MetricCards metrics={metricsData} />
            </div>

            {/* Asymmetric Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Chart + Stores Table */}
              <div className="lg:col-span-2 space-y-6 flex flex-col">
                <CurrentBalances data={balanceData} currentBalance={`$${totalRevenue.toLocaleString()}`} trend={18} />
                <div className="flex-1">
                  <StoresTable
                    stores={stores}
                    onView={handleViewStore}
                    onEdit={handleEditStore}
                    onDelete={handleDeleteStore}
                  />
                </div>
              </div>

              {/* Right Column: Activities + Quick AI Deployer */}
              <div className="lg:col-span-1 space-y-6 flex flex-col">
                <div className="flex-1">
                  <ActivityFeed activities={activities} onViewAll={() => setActiveTab('profiles')} />
                </div>
                <div className="flex-1">
                  <AIStorefrontDeployer onDeploy={handleDeploy} isLoading={isDeploying} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 animate-fadeIn">
            <SmeCatalogSelector
              products={products}
              storefrontProfiles={storefrontProfiles}
              onUpdateProduct={handleUpdateProduct}
              onAddProduct={handleAddProduct}
              onAddLog={onAddLog}
            />
          </div>
        )}

        {activeTab === 'deployer' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 animate-fadeIn">
            <AIStorefrontDeployer
              onDeploy={handleDeploy}
              isLoading={isDeploying}
              stores={storefrontProfiles}
              setStores={onUpdateProfiles}
              products={products}
              setProducts={onUpdateProducts}
            />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 animate-fadeIn">
            <StorefrontInsights products={products} />
          </div>
        )}

        {activeTab === 'customizer' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 animate-fadeIn">
            <SmeWebsiteCustomizer
              profiles={storefrontProfiles}
              activeProfileId={activeProfileId}
              onSwitchProfile={onSwitchProfile}
              onUpdateProfiles={onUpdateProfiles}
              onAddLog={onAddLog}
            />
          </div>
        )}

        {activeTab === 'profiles' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 animate-fadeIn">
            <SmeProfileManager
              profiles={storefrontProfiles}
              activeProfileId={activeProfileId}
              onSwitchProfile={onSwitchProfile}
              onUpdateProfiles={onUpdateProfiles}
              onAddLog={onAddLog}
            />
          </div>
        )}

        {activeTab === 'sheets' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 animate-fadeIn">
            <GoogleSheetsDashboard
              products={products}
              onUpdateProducts={onUpdateProducts}
              onAddLog={onAddLog}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center mt-auto">
        <p className="text-xs text-gray-400 font-medium">
          Enterprise Operational Agentic Suite © 2026. Powered with Gemini model alignment filters.
        </p>
      </footer>
    </div>
  );
}
