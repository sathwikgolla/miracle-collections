export interface HomepageSectionConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  order: number;
}

export interface AdminCategorySubItem {
  name: string;
  href: string;
  image: string;
}

export interface AdminCategoryGroupCard {
  id: string;
  title: string;
  href: string;
  items: [AdminCategorySubItem, AdminCategorySubItem];
  order?: number;
  active?: boolean;
}

export interface AdminSpotlightItem {
  id: string;
  brand: string;
  title: string;
  subtitle: string;
  price: number;
  image: string;
  href: string;
  order?: number;
  active?: boolean;
}

export interface AdminOccasionItem {
  id: string;
  title: string;
  tagline: string;
  image: string;
  href: string;
  badge?: string;
  order?: number;
  active?: boolean;
}

export interface AdminBudgetTier {
  id: string;
  label: string;
  description: string;
  href: string;
  badge: string;
  popular: string;
  image: string;
  order?: number;
  active?: boolean;
}

export interface AdminWhyUsItem {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  order?: number;
  active?: boolean;
}

export interface AdminQuickBenefitItem {
  id: string;
  title: string;
  subtitle: string;
  iconName?: string;
  active?: boolean;
}

export interface AdminEditorialCampaign {
  badge: string;
  headline: string;
  tagline: string;
  pullQuote: string;
  description: string;
  bullets: string[];
  primaryImage: string;
  primaryBadge: string;
  primaryTitle: string;
  primarySubtitle: string;
  secondaryImage: string;
  secondaryTag: string;
  secondaryTitle: string;
  tertiaryImage: string;
  tertiaryTag: string;
  tertiaryTitle: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
}

export interface AdminTrendingConfig {
  badge: string;
  title: string;
  subtitle: string;
  viewAll: string;
}

export interface AdminDiscoveryConfig {
  badge: string;
  title: string;
  subtitle: string;
  viewAll: string;
}

export interface AdminDealsConfig {
  badge: string;
  title: string;
  subtitle: string;
  bannerTag: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerCode: string;
  bannerDiscount: string;
  bannerLink: string;
}

export interface AdminFinalCtaConfig {
  badge: string;
  title: string;
  description: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
}

export interface AdminHomepageConfig {
  sections: HomepageSectionConfig[];
  categoryGroups: AdminCategoryGroupCard[];
  spotlightItems: AdminSpotlightItem[];
  editorial: AdminEditorialCampaign;
  occasions: AdminOccasionItem[];
  budgetTiers: AdminBudgetTier[];
  whyUsItems: AdminWhyUsItem[];
  quickBenefits: AdminQuickBenefitItem[];
  trending: AdminTrendingConfig;
  discovery: AdminDiscoveryConfig;
  deals: AdminDealsConfig;
  finalCta: AdminFinalCtaConfig;
}
