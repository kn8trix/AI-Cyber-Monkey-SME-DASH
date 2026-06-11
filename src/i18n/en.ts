// English dictionary — source of truth for the i18n system.
// Keys are namespaced by feature/screen so they're easy to find.
// Use {name} style placeholders for runtime interpolation.

export const en = {
  // ── App / Global ─────────────────────────────────────────────────
  appName: "SME Dashboard",
  languageSwitch: "Language",

  // ── Header ───────────────────────────────────────────────────────
  header: {
    searchPlaceholder: "Search…",
    liveSite: "Live Site",
    openSettings: "Open Settings Drawer",
    profileSettings: "Profile Settings",
    subscriptionPlan: "Subscription Plan",
    signOut: "Sign out",
    switchStorefrontContext: "Switch Storefront Context",
    profileMenuTitle: "Operator Profile",
  },

  // ── Dashboard tabs ───────────────────────────────────────────────
  tabs: {
    overview: "Overview",
    catalog: "Product Catalog",
    deployer: "Store Deployer",
    insights: "Store Insights",
    customizer: "Store Customizer",
    profiles: "Profiles Manager",
    sheets: "Sheets Dashboard",
  },

  // ── Welcome / Overview header ────────────────────────────────────
  overview: {
    greetingMorning: "Good Morning, {name}!",
    greetingAfternoon: "Good Afternoon, {name}!",
    greetingEvening: "Good Evening, {name}!",
    subline: "{date} • Multi-tenant management console",
  },

  // ── Metric cards ─────────────────────────────────────────────────
  metrics: {
    totalRevenue: "Total Revenue",
    newCustomers: "New Customers",
    activeStores: "Active Stores",
    fromLastMonth: "from last month",
    fromLastWeek: "from last week",
  },

  // ── Current Balances / Chart ─────────────────────────────────────
  balances: {
    currentBalance: "Current Balance",
    trendUp: "Up {pct}% from last month",
    months: {
      Jan: "Jan", Feb: "Feb", Mar: "Mar", Apr: "Apr", May: "May", Jun: "Jun",
      Jul: "Jul", Aug: "Aug", Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Dec",
    },
  },

  // ── Stores table ─────────────────────────────────────────────────
  stores: {
    title: "All Stores",
    storeId: "Store ID",
    primaryDomain: "Primary Domain",
    createdDate: "Created Date",
    ordersToday: "Orders Today",
    status: "Status",
    action: "Action",
    viewStore: "View store",
    editStore: "Edit store",
    deleteStore: "Delete store",
    summary: "{count} stores • All Client Status",
    statusActive: "Active",
    statusSuspended: "Suspended",
    statusPending: "Pending",
    statusUnknown: "Unknown",
  },

  // ── Activity feed ────────────────────────────────────────────────
  activity: {
    title: "Activity Feed",
    subtitle: "Recent store events",
    seeDetail: "See Detail →",
    types: {
      deployment: "New Storefront Deployed",
      order: "Customer Feedback",
      update: "System Update",
      alert: "Alert",
    },
    logTags: {
      FEEDBACK: "Customer Feedback",
      "STOREFRONT-SWAP": "Store Context Switched",
      "MSMD-DEPLOY": "New Storefront Deployed",
      PROVISION: "New Storefront Deployed",
      "PRICE-UPDATE": "Price Manually Updated",
      "AUTOPILOT-COMPLY": "Autopilot Price Optimization",
      "PROFILE-CREATE": "Profile Created",
      "PROFILE-EDIT": "Profile Configuration Edited",
      "PROFILE-DESTROY": "Profile Dismantled",
    },
  },

  // ── AI Storefront Deployer ───────────────────────────────────────
  deployer: {
    quickTitle: "AI Storefront Deployer",
    quickPlaceholder: "Describe a new storefront… e.g. 'Retro arcade game shop, neon colors, 90s vibe'",
    quickSubmit: "Generate by AI",
    quickLabel: "AI Storefront Deployer",
    busy: "Generating…",
    cannotDeleteLast: "Cannot delete the last storefront! An operator must maintain at least 1 live active profile.",
    confirmDelete: "Are you absolutely sure you want to completely dismantle and shut down storefront: \"{name}\"?",
    duplicateName: "A storefront with that name already exists. Try a different description!",
    deployed: "AI Agent successfully conceptualised, themed, and provisioned storefront \"{name}\" ({style} style) with {items} items on {url}.",
    swappedTo: "Switched active management context to \"{name}\" ({tagline}).",
    switchedToStore: "Switched view perspective to standalone live storefront \"{name}\".",
    deployedProduct: "MSMD Deployer successfully scraped listings, mixed descriptions, calculated competitive MSRP of ${msrp}, applied savings and deployed item \"{name}\" to live catalog storefront (${price}, Category: {category}) on \"{store}\".",
    // Push-Button Deployer panel
    pbTitle: "Push-Button Deploy",
    pbSubtitle: "Launch an instant virtual tenant with theme, font, and layout presets.",
    pbStoreName: "Store Name",
    pbStyleLabel: "Theme Style",
    pbStyleTech: "Tech / Futuristic",
    pbStyleRetail: "Retail / Lifestyle",
    pbStyleWellness: "Wellness / Calm",
    pbStyleMinimalist: "Minimalist",
    pbFontLabel: "Font Family",
    pbFontSans: "System Sans",
    pbFontSerif: "Serif",
    pbFontRound: "Display Round",
    pbFontMono: "Mono",
    pbHeaderLabel: "Header Layout",
    pbHeaderMinimalist: "Minimalist Single Row",
    pbHeaderCentered: "Centered Brand Overlay",
    pbHeaderAsymmetric: "Asymmetric Left Header",
    pbDescriptionPlaceholder: "Optional launch copy or theme brief",
    pbCharCount: "{count} / 500 words",
    pbDeploy: "Deploy Website",
    pbQuickTooltip: "Quick deploy",
    pbQuickTemplates: "Quick Templates",
    pbQuickTech: "Tech",
    pbQuickRetail: "Retail",
    pbQuickWellness: "Wellness",
    pbDeploying: "Deploying storefront...",
    pbDefaultName: "Invowise Storefront",
    pbDefaultDescription: "Instant storefront deployment for {name}",
    pbTemplateTech: "AI-powered tech gadgets store with modern design",
    pbTemplateRetail: "Fashion and lifestyle retail storefront",
    pbTemplateWellness: "Health and wellness products marketplace",
    pbPresetTech: "Cyber Edge",
    pbPresetRetail: "Luxe Market",
    pbPresetWellness: "Wellness Club",
  },

  // ── Drawer / Account / Plans / Terms ─────────────────────────────
  drawer: {
    title: "SME General Control Panel",
    close: "Close Panel",
    tabAccount: "Account",
    tabPlans: "Plans",
    tabTerms: "Terms",
    scalingBadge: "$ Scaling",
    // Account form
    identityParams: "Identity Node Parameters",
    ownerName: "Owner Full Name",
    adminEmail: "Administrative Email",
    company: "Enterprise Company",
    phone: "Support Phone Number",
    automations: "Administrative Automations",
    alertTitle: "Checkout Push Alerts",
    alertDesc: "Trigger realtime dashboard log outputs for every client dispatch event.",
    syncTitle: "Auto-Update Billing Ledgers",
    syncDesc: "Sync ledger invoice lists inside sheets based on hosted profiles count automatically.",
    save: "Save Parameters",
    savedToast: "Settings saved successfully and logged in terminal feed!",
    savedLog: "Operator settings optimized for owner \"{name}\" of \"{company}\". Synchronized across database.",
    // Plans
    plansHeading: "Active Domain-Based Pricing Slider",
    plansSub: "Plans are calculated using a baseline hosting fee plus {price} per hosted storefront website. Deleting standalone storefront profiles immediately lowers downstream monthly and yearly active rate totals.",
    activeStores: "Active Stores",
    addedCost: "Added Cost",
    yearlyScale: "Yearly Scale",
    chooseTier: "Choose Service Tier",
    tierFreeBadge: "Free Core",
    tierFreeName: "Ad-Supported Sandbox",
    tierFreeDesc: "Full catalog management for separate standalone storefronts. Contains active simulated advertisement placement monetization channels on client sites.",
    tierFreeSelected: "Checked — Simulated Ads are Deployed",
    tierMonthlyBadge: "PRO MONTHLY",
    tierMonthlyName: "Clean Subscription",
    tierMonthlyDesc: "Removes all simulated layout advertisements from hosted customer sites. High performance database query buffers enabled. Just $10/mo base rate + $7/mo per storefront.",
    tierMonthlySelected: "Selected Pro Mode — Ad system removed",
    tierYearlyBadge: "YEARLY PLATINUM",
    tierYearlyName: "Enterprise Bundle",
    tierYearlyDesc: "Get full annual priority support routing. Completely clean ad-free storefront custom branding. Base $100/yr rate + $70/yr per hosted storefront.",
    tierYearlySelected: "Selected Annual Suite — Best Value",
    perMonth: "/ Month",
    perYear: "/ Year (Save 20%)",
    // Pricing widget numbers
    perStorePrice: "$7.00 per hosted storefront website",
    // Footer
    forecast: "Forecast Amount:",
    perMonthShort: "/ month",
    perYearShort: "/ year",
    forecastNote: "Automatic adjustments applied instantly based on profiles.",
    storesCount: "Stores: {count} Standalone",
    tierFree: "Ad-Supported Free",
    tierMonthly: "Monthly Pro",
    tierYearly: "Yearly Platinum",
    // Plan labels in logs
    planFree: "Free Core Tier",
    planMonthly: "Monthly Pro Enterprise",
    planYearly: "Yearly Platinum Suite",
    planLog: "Subscription updated to [{plan}] pricing tier. Expected automated invoicing calculation of {cost}. Storefront ad systems immediately adapted.",
    // Terms
    termsTitle: "Global Platform Service Agreements",
    termsEffective: "Effective Date: June 6, 2026",
    termsScope: "1. Interactive Sandbox Scope",
    termsScopeBody: "The sovereign platform acts as an agentic sandbox application suite designed to host isolated, standalone, decoupled customer-facing website routes. No administrative connections are exposed to third-party endpoints unless explicitly verified by the operator.",
    termsAds: "2. Ad Monetization Disclosure (Free Tier)",
    termsAdsBody: "Under the Free Core sandbox subscription level, the operator acknowledges and agrees that the platform reserves the right to display simulated, dynamic advertising banner blocks and sidebar product blocks on any public client-facing storefront domain channels. These advertisements help defray high speed server hosting, routing node and persistent indexing storage overhead.",
    termsBilling: "3. Storefront Billing Scaling",
    termsBillingBody: "All premium subscriptions operate with dynamic pricing, scaled live according to the number of hosted storefront website configurations mapped within the 'Web Profiles' module. The baseline monthly fee of $10.00 is subject to an additional cost of $7.00 per month for each physical website listed. Removing redundant web profiles immediately terminates relevant storefront surcharges at the start of the next cycle.",
    termsOwnership: "4. Data Ownership & Sheets Synclinks",
    termsOwnershipBody: "Product catalogs and live telemetry customer feedback queues belong fully to the operator. Google Sheets sync engines operate through native sandbox boundaries, writing secure tabular datasets to the simulated cloud sheets workspace instantly.",
    termsFooter: "*By clicking 'Check' or maintaining an active account list, you submit full compliance parameters to these integrated licensing agreements.",
  },

  // ── Customer Storefront (public side) ────────────────────────────
  storefront: {
    operatorLogin: "Operator Sign In",
    welcome: "Welcome to {name}!",
  },

  // ── Footer ───────────────────────────────────────────────────────
  footer: "Enterprise Operational Agentic Suite © 2026. Powered with Gemini model alignment filters.",
  customerFooter: "{name} © 2026. {tagline}. All catalogs synced via omnichannel spreadsheet.",

  // ── Common actions ───────────────────────────────────────────────
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    close: "Close",
    loading: "Loading…",
    yes: "Yes",
    no: "No",
  },
};

export type Dictionary = typeof en;
