export interface SorterRecord {
  id: string;
  originalText: string;
  category: string;
  sentiment: string;
  priority: string;
  resolvedSummary: string;
  actionableInsight: string;
}

export interface SorterResult {
  dataType: string;
  summaryText: string;
  items: SorterRecord[];
}

export interface CopyGenOutput {
  seoKeywords: string[];
  websiteCopy: string;
  socialHook: string;
  featureList: string[];
}

export interface Competitor {
  name: string;
  price: number;
}

export interface PricingAnalysisOutput {
  competitorAverage: number;
  marketPositioning: string;
  analysisSummary: string;
  recommendedPrice: number;
  promotionalPrice: number;
  tacticalAction: string;
}

export interface TenantLayout {
  id: string;
  name: string;
  subdomain: string;
  isDeployed: boolean;
  bannerUrl?: string;
  theme: {
    headerLayout: 'minimalist' | 'centered' | 'asymmetric';
    fontFamily: 'sans' | 'serif' | 'round' | 'mono';
    spacing: 'compact' | 'comfortable' | 'spacious';
    borderRadius: 'none' | 'md' | 'full';
    primaryColor: string;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  targetSites: string[];
}

export const normalizeTargetSites = (product: Pick<StorefrontProduct, 'targetSites' | 'targetWebsites'>): string[] => {
  const sites = [
    ...(product.targetSites ?? []),
    ...(product.targetWebsites ?? [])
  ];

  return Array.from(new Set(sites.filter(Boolean)));
};

export const withNormalizedTargetSites = <T extends StorefrontProduct>(product: T): T => {
  const targetSites = normalizeTargetSites(product);
  return { ...product, targetSites, targetWebsites: targetSites } as T;
};

export const resolveTenantTheme = (profile: Pick<StorefrontProfile, 'tenantLayout' | 'layoutTheme'>) => {
  return profile.tenantLayout?.theme ?? profile.layoutTheme;
};

export const resolveHeaderLayout = (profile: Pick<StorefrontProfile, 'tenantLayout' | 'headLayout'>) => {
  return profile.tenantLayout?.theme?.headerLayout ?? profile.headLayout;
};

export const resolveCustomFont = (profile: Pick<StorefrontProfile, 'tenantLayout' | 'customFont'>) => {
  return profile.tenantLayout?.theme?.fontFamily ?? profile.customFont;
};

export interface StorefrontProduct extends Product {
  category: string;
  desc: string;
  salesCount: number;
  viewsCount: number;
  imageUrl?: string;
  msrp?: number;
  discountPercentage?: number;
  websitesMixed?: string[];
  buyingPrice?: number;
  stockCount?: number;
  targetWebsites?: string[];
}

export interface AutonomousUpdate {
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  whyUpdate: string;
  newDescriptorTags: string;
}

export interface AutonomousCrawlEvent {
  id?: string;
  timestamp: string;
  marketEventTitle: string;
  marketEventIntensity: "High" | "Medium" | "Low";
  marketEventDescription: string;
  competitorDislocation: string;
  suggestedUpdates: AutonomousUpdate[];
  applied: boolean;
}

export interface ConnectedAccount {
  id: string;
  name: string;
  tag: string;
  platform: "instagram" | "linkedin" | "twitter" | "facebook";
  avatar: string;
  status: "Connected" | "Expired" | "Authenticating";
  scopes?: string[];
  tokenHint?: string;
  createdAt: string;
}

export interface StorefrontProfile {
  id: string;
  name: string;
  tagline: string;
  categoryDefault: string;
  primaryColor: string; // Tailwind color class roots (e.g. 'orange', 'indigo', 'rose', 'emerald')
  themeStyle: "tech" | "retro" | "wellness" | "minimalist";
  bannerText: string;
  simulatedUrl: string;
  products: StorefrontProduct[];
  benefitsStrip: { title: string; desc: string; iconName: "Gift" | "Cpu" | "Truck" | "Check" | "ShieldCheck" | "Smartphone" }[];
  customIcon?: string;
  heroImage?: string;
  customFont?: "sans" | "mono" | "tech" | "serif" | "retro" | string;
  layoutStyle?: "grid" | "rows" | "split" | "masonry" | "amazon-mega" | "shopify-clean" | "etsy-boho" | "streetwear-split" | "pinterest-masonry" | "instagram-grid" | "ebay-auction" | "bento-editorial";
  
  // Added customizer requirements
  colorMode?: "light" | "dark";
  customBannerDataUrl?: string;
  customLogoDataUrl?: string;
  customUploadedFontName?: string;
  headLayout?: "minimalist" | "centered" | "asymmetric" | "sleek-inline" | "split-logo" | "announcement-dense";
  
  // ABSOLUTE CDN URLs for cross-domain asset delivery
  bannerUrl?: string;      // Absolute CDN URL: https://cdn.domain.com/tenants/{tenantId}/banners/{id}.jpg
  heroImageUrl?: string;   // Absolute CDN URL: https://cdn.domain.com/tenants/{tenantId}/images/{id}.jpg
  customIconUrl?: string;  // Absolute CDN URL: https://cdn.domain.com/tenants/{tenantId}/icons/{id}.svg
  tenantLayout?: TenantLayout;
  isDeployed?: boolean;
  subdomain?: string;
  layoutTheme?: TenantLayout['theme'];
  
  // Font parameters details for core, products, descriptions
  coreFont?: {
    family: string;
    styleType: string;
    color: string;
    size: number;
    opacity: number;
    weight: string;
    letterSpacing: string;
  };
  productFont?: {
    family: string;
    styleType: string;
    color: string;
    size: number;
    opacity: number;
    weight: string;
    letterSpacing: string;
  };
  descFont?: {
    family: string;
    styleType: string;
    color: string;
    size: number;
    opacity: number;
    weight: string;
    letterSpacing: string;
  };
}


