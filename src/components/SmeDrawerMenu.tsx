import React, { useState } from "react";
import {
  X,
  User,
  CreditCard,
  Shield,
  Check,
  Save,
  Sparkles,
  Building2,
  HelpCircle,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { StorefrontProfile } from "../types";
import { useT } from "../i18n/LanguageContext";

interface SmeDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: "free" | "monthly" | "yearly";
  onSelectPlan: (plan: "free" | "monthly" | "yearly") => void;
  storefrontCount: number;
  accountSettings: {
    ownerName: string;
    email: string;
    phone: string;
    companyName: string;
    alertNotifications: boolean;
    autoSyncInvoices: boolean;
  };
  onUpdateAccountSettings: (settings: any) => void;
  onAddLog: (logText: string) => void;
}

export default function SmeDrawerMenu({
  isOpen,
  onClose,
  currentPlan,
  onSelectPlan,
  storefrontCount,
  accountSettings,
  onUpdateAccountSettings,
  onAddLog
}: SmeDrawerMenuProps) {
  const t = useT();

  // Drawer Active Sub-tab
  const [activeTab, setActiveTab] = useState<"account" | "plans" | "terms">("account");

  // Local form states to maintain inputs before saving
  const [formName, setFormName] = useState(accountSettings.ownerName);
  const [formEmail, setFormEmail] = useState(accountSettings.email);
  const [formPhone, setFormPhone] = useState(accountSettings.phone);
  const [formCompany, setFormCompany] = useState(accountSettings.companyName);
  const [formAlerts, setFormAlerts] = useState(accountSettings.alertNotifications);
  const [formSync, setFormSync] = useState(accountSettings.autoSyncInvoices);

  // Sync state if accountSettings updates externally
  React.useEffect(() => {
    setFormName(accountSettings.ownerName);
    setFormEmail(accountSettings.email);
    setFormPhone(accountSettings.phone);
    setFormCompany(accountSettings.companyName);
    setFormAlerts(accountSettings.alertNotifications);
    setFormSync(accountSettings.autoSyncInvoices);
  }, [accountSettings, isOpen]);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAccountSettings({
      ownerName: formName,
      email: formEmail,
      phone: formPhone,
      companyName: formCompany,
      alertNotifications: formAlerts,
      autoSyncInvoices: formSync
    });

    const logBody = t('drawer.savedLog', { name: formName, company: formCompany });
    const formattedLog = `[SME-ACCOUNT] ${new Date().toLocaleTimeString()}: ${logBody}`;
    onAddLog(formattedLog);
    alert(t('drawer.savedToast'));
  };

  // Subscription Pricing calculations
  const baseMonthly = 10;
  const baseYearly = 100;
  const increasePerStore = 7;

  const totalMonthlyPrice = baseMonthly + increasePerStore * storefrontCount;
  // Yearly plan price scales by $70 per added storefront (equivalent of 10 months or standard yearly scale)
  const totalYearlyPrice = baseYearly + (increasePerStore * 10) * storefrontCount;

  const handleSelectPlanWithLogging = (plan: "free" | "monthly" | "yearly") => {
    onSelectPlan(plan);
    let planLabel = t('drawer.planFree');
    let planCost = "$0.00";
    if (plan === "monthly") {
      planLabel = t('drawer.planMonthly');
      planCost = `$${totalMonthlyPrice.toFixed(2)}/mo`;
    } else if (plan === "yearly") {
      planLabel = t('drawer.planYearly');
      planCost = `$${totalYearlyPrice.toFixed(2)}/yr`;
    }

    const logBody = t('drawer.planLog', { plan: planLabel.toUpperCase(), cost: planCost });
    onAddLog(`[CMS-PLAN] ${new Date().toLocaleTimeString()}: ${logBody}`);
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] transition-all duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      id="control-menu-drawer-outer"
    >
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sliding Content Pane */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col justify-between transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        id="control-menu-drawer-inner"
      >
        {/* Header Block with quick context metrics */}
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500 text-white rounded-lg">
                <Building2 className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">{t('drawer.title')}</h2>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
              title={t('drawer.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded font-mono uppercase">
              {t('drawer.storesCount', { count: storefrontCount })}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded font-mono uppercase ${
              currentPlan === 'free'
                ? 'bg-amber-100 text-amber-850'
                : currentPlan === 'monthly'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {currentPlan === 'free' ? t('drawer.tierFree') : currentPlan === 'monthly' ? t('drawer.tierMonthly') : t('drawer.tierYearly')}
            </span>
          </div>
        </div>

        {/* Dynamic Tab Controllers */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-2.5 pt-1.5 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("account")}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === "account"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {t('drawer.tabAccount')}
          </button>

          <button
            onClick={() => setActiveTab("plans")}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === "plans"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            {t('drawer.tabPlans')}
            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded font-black">{t('drawer.scalingBadge')}</span>
          </button>

          <button
            onClick={() => setActiveTab("terms")}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === "terms"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {t('drawer.tabTerms')}
          </button>
        </div>

        {/* Scrollable Main Content Drawer Compartment */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* TAB A: Account Settings Form Layout */}
          {activeTab === "account" && (
            <form onSubmit={handleSaveAccount} className="space-y-4 text-left">
              <div className="border bg-slate-50/40 p-4 rounded-2xl border-slate-100 space-y-3">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold uppercase px-2 py-0.5 rounded font-mono">
                  {t('drawer.identityParams')}
                </span>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('drawer.ownerName')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold rounded-xl text-slate-800 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('drawer.adminEmail')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      type="email" 
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold rounded-xl text-slate-800 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('drawer.company')}
                    </label>
                    <input 
                      type="text" 
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold rounded-xl text-slate-800 shadow-2xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('drawer.phone')}
                    </label>
                    <input 
                      type="text" 
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold rounded-xl text-slate-800 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div className="border bg-slate-50/40 p-4 rounded-2xl border-slate-100 space-y-4">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold uppercase px-2 py-0.5 rounded font-mono">
                  {t('drawer.automations')}
                </span>

                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{t('drawer.alertTitle')}</h5>
                    <p className="text-[10px] text-slate-400">{t('drawer.alertDesc')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAlerts}
                    onChange={(e) => setFormAlerts(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{t('drawer.syncTitle')}</h5>
                    <p className="text-[10px] text-slate-400">{t('drawer.syncDesc')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formSync}
                    onChange={(e) => setFormSync(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 hover:scale-[1.01] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase font-mono tracking-wider"
              >
                <Save className="w-4 h-4" />
                {t('drawer.save')}
              </button>
            </form>
          )}

          {/* TAB B: Subscriptions and Dynamic Prices Scaling Widget */}
          {activeTab === "plans" && (
            <div className="space-y-4 text-left">
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/60 space-y-2.5">
                <div className="flex items-center gap-1 text-indigo-800">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase font-mono">{t('drawer.scalingBadge')}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">{t('drawer.plansHeading')}</h4>
                <p className="text-[10.5px] text-slate-600 leading-normal font-medium">
                  {t('drawer.plansSub', { price: t('drawer.perStorePrice') })}
                </p>

                <div className="grid grid-cols-3 bg-white p-2 text-center rounded-xl border border-slate-150 text-[11px] font-mono shadow-inner items-center divide-x divide-slate-100">
                  <div>
                    <span className="block text-slate-450 text-[9px] uppercase">{t('drawer.activeStores')}</span>
                    <span className="font-extrabold text-slate-800 text-sm">{storefrontCount}</span>
                  </div>
                  <div>
                    <span className="block text-slate-450 text-[9px] uppercase">{t('drawer.addedCost')}</span>
                    <span className="font-extrabold text-rose-600 text-xs">+${(storefrontCount * increasePerStore).toFixed(2)}/mo</span>
                  </div>
                  <div>
                    <span className="block text-slate-450 text-[9px] uppercase">{t('drawer.yearlyScale')}</span>
                    <span className="font-extrabold text-indigo-600 text-xs">+${(storefrontCount * increasePerStore * 10).toFixed(2)}/yr</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest block font-mono">{t('drawer.chooseTier')}</h4>

                {/* 1. Free Tier */}
                <div
                  onClick={() => handleSelectPlanWithLogging("free")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    currentPlan === 'free'
                      ? 'border-amber-500 bg-amber-50/20'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-extrabold rounded uppercase font-mono mr-1.5">{t('drawer.tierFreeBadge')}</span>
                      <h4 className="text-xs font-black text-slate-800 inline">{t('drawer.tierFreeName')}</h4>
                    </div>
                    <span className="font-extrabold text-sm text-slate-800 font-mono">$0.00</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {t('drawer.tierFreeDesc')}
                  </p>
                  {currentPlan === 'free' && (
                    <div className="mt-2.5 flex items-center gap-1 text-[10px] text-amber-700 font-bold font-mono">
                      <Check className="w-3.5 h-3.5" /> {t('drawer.tierFreeSelected')}
                    </div>
                  )}
                </div>

                {/* 2. Monthly Plan */}
                <div
                  onClick={() => handleSelectPlanWithLogging("monthly")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    currentPlan === 'monthly'
                      ? 'border-indigo-600 bg-indigo-50/10'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[8px] font-extrabold rounded uppercase font-mono mr-1.5">{t('drawer.tierMonthlyBadge')}</span>
                      <h4 className="text-xs font-black text-slate-800 inline">{t('drawer.tierMonthlyName')}</h4>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-slate-800 font-mono block leading-none">${totalMonthlyPrice.toFixed(2)}</span>
                      <span className="text-[8px] text-slate-400 font-mono font-bold uppercase">{t('drawer.perMonth')}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-505 text-slate-500 leading-tight">
                    {t('drawer.tierMonthlyDesc')}
                  </p>
                  {currentPlan === 'monthly' && (
                    <div className="mt-2.5 flex items-center gap-1 text-[10px] text-indigo-700 font-bold font-mono">
                      <Check className="w-3.5 h-3.5" /> {t('drawer.tierMonthlySelected')}
                    </div>
                  )}
                </div>

                {/* 3. Yearly Plan */}
                <div
                  onClick={() => handleSelectPlanWithLogging("yearly")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    currentPlan === 'yearly'
                      ? 'border-indigo-600 bg-gradient-to-r from-indigo-50/10 to-violet-50/10'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="px-1.5 py-0.5 bg-violet-100 text-violet-800 text-[8px] font-extrabold rounded uppercase font-mono mr-1.5">{t('drawer.tierYearlyBadge')}</span>
                      <h4 className="text-xs font-black text-slate-800 inline">{t('drawer.tierYearlyName')}</h4>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-slate-800 font-mono block leading-none">${totalYearlyPrice.toFixed(2)}</span>
                      <span className="text-[8px] text-slate-400 font-mono font-bold uppercase">{t('drawer.perYear')}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-550 text-slate-500 leading-tight">
                    {t('drawer.tierYearlyDesc')}
                  </p>
                  {currentPlan === 'yearly' && (
                    <div className="mt-2.5 flex items-center gap-1 text-[10px] text-violet-700 font-bold font-mono">
                      <Check className="w-3.5 h-3.5" /> {t('drawer.tierYearlySelected')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB C: Terms & Agreements Block */}
          {activeTab === "terms" && (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                <h4 className="text-xs font-black text-slate-805 uppercase tracking-wide font-sans">{t('drawer.termsTitle')}</h4>
              </div>

              <div className="h-96 overflow-y-auto border border-slate-150 p-4 rounded-2xl bg-slate-50 text-[10px] text-slate-505 leading-relaxed space-y-3 font-medium select-none font-sans">
                <p className="font-bold border-b pb-1.5 text-slate-800">{t('drawer.termsEffective')}</p>
                <h5 className="font-extrabold text-slate-700 uppercase">{t('drawer.termsScope')}</h5>
                <p>
                  {t('drawer.termsScopeBody')}
                </p>

                <h5 className="font-extrabold text-slate-705 uppercase">{t('drawer.termsAds')}</h5>
                <p>
                  {t('drawer.termsAdsBody')}
                </p>

                <h5 className="font-extrabold text-slate-700 uppercase">{t('drawer.termsBilling')}</h5>
                <p>
                  {t('drawer.termsBillingBody')}
                </p>

                <h5 className="font-extrabold text-slate-700 uppercase">{t('drawer.termsOwnership')}</h5>
                <p>
                  {t('drawer.termsOwnershipBody')}
                </p>

                <p className="text-[9.5px] text-slate-400 italic pt-2">
                  {t('drawer.termsFooter')}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer info showing billing forecast parameters */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center flex flex-col gap-1 items-center justify-center shrink-0">
          <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-700 font-mono">
            <span>{t('drawer.forecast')}</span>
            <span className="text-indigo-600 text-xs font-black">
              {currentPlan === 'free'
                ? `$0.00 ${t('drawer.perMonthShort')}`
                : currentPlan === 'monthly'
                ? `$${totalMonthlyPrice.toFixed(2)} ${t('drawer.perMonthShort')}`
                : `$${totalYearlyPrice.toFixed(2)} ${t('drawer.perYearShort')}`
              }
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium">{t('drawer.forecastNote')}</p>
        </div>
      </div>
    </div>
  );
}
