import { useState, useEffect, lazy, Suspense } from "react";
import { useDebouncedLocalStorage } from "./hooks/useDebouncedLocalStorage";
import { StorefrontProduct, StorefrontProfile, withNormalizedTargetSites } from "./types";
import { INITIAL_STOREFRONT_PROFILES, SANDBOX_RAW_LOGS } from "./data";
import SmeDrawerMenu from "./components/SmeDrawerMenu";
// Heavy panels are code-split so the initial bundle stays under the
// 500 kB warning threshold. They are only fetched when the user
// navigates to the corresponding view.
const RefactoredDashboard = lazy(
  () => import("./components/RefactoredDashboard")
);
const CustomerStorefront = lazy(
  () => import("./components/CustomerStorefront")
);
import { LanguageProvider } from "./i18n/LanguageContext";

// Lightweight inline fallback shown while a lazy chunk is loading.
function PanelFallback({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 240,
        color: "#6b7280",
        fontSize: 14
      }}
    >
      Loading {label}…
    </div>
  );
}

export default function App() {
  // Navigation & Security Views
  const [viewMode, setViewMode] = useState<"storefront" | "dashboard" | "sheets">("dashboard");
  const [smeLoggedIn, setSmeLoggedIn] = useState(false);

  // Dynamic Subscription Plan selection state ('free' | 'monthly' | 'yearly')
  const [currentPlan, setCurrentPlan] = useState<"free" | "monthly" | "yearly">(() => {
    return (localStorage.getItem("sme_current_plan") as "free" | "monthly" | "yearly") || "free";
  });

  // Slide-out Drawer Control
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Business Owner Account parameters
  const [accountSettings, setAccountSettings] = useState(() => {
    const saved = localStorage.getItem("sme_account_settings_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      ownerName: "Sarah Connor",
      email: "sarah.connor@cybermonkey.io",
      phone: "+1 (800) 555-0199",
      companyName: "Sovereign Systems Corp",
      alertNotifications: true,
      autoSyncInvoices: true
    };
  });

  // Persist settings — debounced alongside the other state writes
  // further down via useDebouncedLocalStorage (see below).

  // Path-based routing state
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };
  
  // Realtime Log Feed shared with data sorter
  const [rawLogs, setRawLogs] = useState<string>(SANDBOX_RAW_LOGS);

  // Omnichannel Multi-storefront website profiles state loaded from LocalStorage or seeded presets
  const [storefrontProfiles, setStorefrontProfiles] = useState<StorefrontProfile[]>(() => {
    const saved = localStorage.getItem("sme_storefront_profiles_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved storefront profiles", e);
      }
    }
    return INITIAL_STOREFRONT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem("sme_active_profile_id_v1") || "cyber-monkey";
  });

  // Shared universal product catalog for "same products, different website" constraint
  const [products, setProductsState] = useState<StorefrontProduct[]>(() => {
    const saved = localStorage.getItem("sme_shared_products_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved products", e);
      }
    }
    
    // Combine products from all pre-seeded profiles to build a magnificent, comprehensive core catalog to start!
    const combined: StorefrontProduct[] = [];
    INITIAL_STOREFRONT_PROFILES.forEach(profile => {
      profile.products.forEach(p => {
        const existing = combined.find(x => x.name.toLowerCase() === p.name.toLowerCase());
        if (existing) {
          const nextTargets = Array.from(new Set([...(existing.targetSites ?? existing.targetWebsites ?? []), profile.id]));
          Object.assign(existing, withNormalizedTargetSites({ ...existing, targetSites: nextTargets, targetWebsites: nextTargets }));
        } else {
          combined.push(withNormalizedTargetSites({
            ...p,
            targetSites: [profile.id],
            targetWebsites: [profile.id]
          }));
        }
      });
    });
    return combined;
  });

  // Persist state updates — debounced to avoid JSON-serializing the
  // entire profile/product tree on every keystroke. The hook also
  // flushes the latest value on unmount so a tab close never loses
  // the most recent edit.
  useDebouncedLocalStorage("sme_storefront_profiles_v1", storefrontProfiles);
  useDebouncedLocalStorage("sme_active_profile_id_v1", activeProfileId, {
    // Active profile id is a single string — serialize as-is and use
    // a tighter debounce (50ms) so the tab UI feels snappy.
    delay: 50,
    serialize: (v) => v
  });
  useDebouncedLocalStorage("sme_shared_products_v2", products);
  useDebouncedLocalStorage("sme_current_plan", currentPlan, {
    delay: 50,
    serialize: (v) => v
  });
  useDebouncedLocalStorage("sme_account_settings_v1", accountSettings);

  // Derived properties for current profile
  const activeProfile = storefrontProfiles.find(p => p.id === activeProfileId) || storefrontProfiles[0] || INITIAL_STOREFRONT_PROFILES[0];

  // Tab navigation states
  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "deployer" | "insights" | "customizer" | "profiles" | "sheets">("overview");
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);

  // Set products globally (shares catalog across all websites)
  const setProducts = (newProducts: StorefrontProduct[] | ((current: StorefrontProduct[]) => StorefrontProduct[])) => {
    setProductsState(current => {
      return typeof newProducts === "function" ? newProducts(current) : newProducts;
    });
  };

  const handleSwitchProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    const target = storefrontProfiles.find(p => p.id === profileId);
    if (target) {
      handleAddLog(`[STOREFRONT-SWAP] ${new Date().toLocaleTimeString()}: Switched active management context to "${target.name}" (${target.tagline}).`);
    }
  };

  // Updates raw data logs instantly
  const handleAddLog = (newLogLine: string) => {
    setRawLogs(current => `${newLogLine}\n\n${current}`);
  };

  // Deploy product from AI image / search analyzer
  const handleDeployProduct = (newProduct: StorefrontProduct) => {
    setProducts(currentProducts => [newProduct, ...currentProducts]);
    handleAddLog(`[MSMD-DEPLOY] ${new Date().toLocaleTimeString()}: MSMD Deployer successfully scraped listings, mixed descriptions, calculated competitive MSRP of $${(newProduct.msrp || newProduct.price).toFixed(2)}, applied savings and deployed item "${newProduct.name}" to live catalog storefront ($${newProduct.price.toFixed(2)}, Category: ${newProduct.category}) on "${activeProfile.name}".`);
  };

  // --- CUSTOM ROUTER PATH RESOLVER ---
  
  // 1. Standalone Storefront Endpoint (/store/:profileId)
  if (currentPath.startsWith("/store/")) {
    const profileId = currentPath.substring("/store/".length);
    const targetProfile = storefrontProfiles.find(p => p.id === profileId) || storefrontProfiles[0];

    return (
      <LanguageProvider>
        <div className="relative animate-fadeIn">
          <Suspense fallback={<PanelFallback label="storefront" />}>
          <CustomerStorefront
            activeProfile={targetProfile}
            profiles={storefrontProfiles}
            onSwitchProfile={(id) => navigate(`/store/${id}`)}
            products={products}
            onAddLog={handleAddLog}
            onSmeLoginSuccess={() => {
              setSmeLoggedIn(true);
              navigate("/admin");
            }}
            smeLoggedIn={smeLoggedIn}
            isStandalone={true}
            isFreeTier={currentPlan === "free"}
          />
          </Suspense>
        </div>
      </LanguageProvider>
    );
  }

  // VIEW 2: SME OPERATIONS DASHBOARD
  return (
    <LanguageProvider>
      <>
        <Suspense fallback={<PanelFallback label="dashboard" />}>
        <RefactoredDashboard
          userName={accountSettings.ownerName}
          storefrontProfiles={storefrontProfiles}
          activeProfileId={activeProfileId}
          products={products}
          rawLogs={rawLogs}
          currentPlan={currentPlan}
          isMenuOpen={isMenuOpen}
          accountSettings={accountSettings}
          smeLoggedIn={smeLoggedIn}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSwitchProfile={handleSwitchProfile}
          onUpdateProfiles={setStorefrontProfiles}
          onUpdateProducts={setProducts}
          onAddLog={handleAddLog}
          onSelectPlan={setCurrentPlan}
          onMenuToggle={() => setIsMenuOpen(true)}
          onUpdateAccountSettings={setAccountSettings}
          onLogout={() => {
            setSmeLoggedIn(false);
            navigate("/");
          }}
          onNavigateToStore={() => {
            handleAddLog(`[NAV] Switched view perspective to standalone live storefront "${activeProfile.name}".`);
            navigate("/store/" + activeProfileId);
          }}
        />
        </Suspense>

        <SmeDrawerMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentPlan={currentPlan}
          onSelectPlan={setCurrentPlan}
          storefrontCount={storefrontProfiles.length}
          accountSettings={accountSettings}
          onUpdateAccountSettings={setAccountSettings}
          onAddLog={handleAddLog}
        />
      </>
    </LanguageProvider>
  );
}
