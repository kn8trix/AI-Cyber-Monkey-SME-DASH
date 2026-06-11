import React, { useState } from 'react';
import { Search, Settings, Bell, ChevronDown, Menu, X, Store } from 'lucide-react';
import { StorefrontProfile } from '../types';
import { useT } from '../i18n/LanguageContext';
import { LangSwitcher } from './LangSwitcher';

export interface TabItem {
  id: string;
  label: string;
}

interface DashboardHeaderProps {
  userName?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  tabs?: TabItem[];
  storefrontProfiles?: StorefrontProfile[];
  activeProfileId?: string;
  onSwitchProfile?: (profileId: string) => void;
  onNavigateToStore?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}

// The default tabs use i18n keys. They are resolved via t() inside the
// component so they pick up the active language automatically.
const defaultTabKeys: Array<{ id: string; i18nKey: string }> = [
  { id: 'overview', i18nKey: 'tabs.overview' },
  { id: 'catalog', i18nKey: 'tabs.catalog' },
  { id: 'deployer', i18nKey: 'tabs.deployer' },
  { id: 'insights', i18nKey: 'tabs.insights' },
  { id: 'customizer', i18nKey: 'tabs.customizer' },
  { id: 'profiles', i18nKey: 'tabs.profiles' },
  { id: 'sheets', i18nKey: 'tabs.sheets' },
];

export default function DashboardHeader({
  userName = "Akrom",
  activeTab = "overview",
  onTabChange,
  tabs,
  storefrontProfiles = [],
  activeProfileId = "",
  onSwitchProfile,
  onNavigateToStore,
  onOpenSettings,
  onLogout,
  onMenuToggle,
  menuOpen = false
}: DashboardHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const t = useT();

  // If the caller didn't pass custom tabs, fall back to the i18n-aware defaults.
  const resolvedTabs: TabItem[] =
    tabs ??
    defaultTabKeys.map(tk => ({ id: tk.id, label: t(tk.i18nKey) }));

  const activeProfile = storefrontProfiles.find(p => p.id === activeProfileId);
  const activeProfileName = activeProfile ? activeProfile.name : t("appName");

  const handleSignOut = () => {
    setShowProfileMenu(false);
    onLogout?.();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo + Dynamic Context Selector */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-gray-900 leading-tight tracking-tight text-sm sm:text-base">
                  {activeProfileName}
                </span>
                {storefrontProfiles.length > 0 && (
                  <select
                    value={activeProfileId}
                    onChange={(e) => onSwitchProfile?.(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-bold text-gray-500 focus:outline-none cursor-pointer p-0 m-0 mt-0.5"
                    title="Switch Storefront Context"
                  >
                    {storefrontProfiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden xl:flex gap-1">
              {resolvedTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 border border-transparent focus-within:border-gray-200">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("header.searchPlaceholder")}
                className="bg-transparent text-xs text-gray-900 placeholder-gray-400 outline-none w-36 focus:w-48 transition-all"
              />
            </div>

            {/* Language switcher (EN | বাংলা) */}
            <LangSwitcher />

            {/* Live Website Button */}
            {onNavigateToStore && (
              <button
                onClick={onNavigateToStore}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-750 hover:bg-orange-700 text-white rounded-lg text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Store className="w-3.5 h-3.5" />
                <span>{t("header.liveSite")}</span>
              </button>
            )}

            {/* Control Drawer Toggle (Settings) */}
            <button
              onClick={onOpenSettings}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
              title={t("header.openSettings")}
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            {/* Bell/Notifications */}
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors relative cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center shadow-xs">
                  <span className="text-white text-xs font-black uppercase">{userName.charAt(0)}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-550 text-gray-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                  <div className="px-4 py-2 text-xs text-gray-900 font-extrabold uppercase tracking-wide border-b border-gray-100">
                    {userName}
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); onOpenSettings?.(); }}
                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {t("header.profileSettings")}
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); onOpenSettings?.(); }}
                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {t("header.subscriptionPlan")}
                  </button>
                  <hr className="border-gray-100 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-xs text-red-650 text-red-650 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer font-bold"
                  >
                    {t("header.signOut")}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger menu */}
            <button onClick={onMenuToggle} className="xl:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Tablet / Mobile Navigation Tabs Row (visible below md/lg if not hamburger menu) */}
        <div className="hidden md:flex xl:hidden border-t border-gray-100 pt-3">
          <nav className="flex gap-1 overflow-x-auto pb-1 max-w-full">
            {resolvedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile menu expanded vertical stack */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 pt-3 flex flex-col gap-1.5 animate-fadeIn">
            {resolvedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange?.(tab.id);
                  onMenuToggle?.(); // Close mobile menu on click
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
