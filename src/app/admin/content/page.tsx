/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Gift,
  Headphones,
  Image as ImageIcon,
  Layers,
  Palette,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Truck,
  Video,
  X,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import type { AdminBanner, YouTubeVideoItem } from "@/lib/adminTypes";
import type {
  AdminBudgetTier,
  AdminCategoryGroupCard,
  AdminEditorialCampaign,
  AdminOccasionItem,
  AdminQuickBenefitItem,
  AdminSpotlightItem,
  AdminWhyUsItem,
} from "@/lib/homepageTypes";
import { handleImageError } from "@/lib/utils";

type ContentTab =
  | "overview"
  | "sections"
  | "hero"
  | "categories"
  | "spotlight"
  | "editorial"
  | "occasions"
  | "budget"
  | "trust"
  | "why-us"
  | "videos"
  | "headers"
  | "policies";

export default function AdminContentPage() {
  const {
    banners,
    announcements,
    youtubeVideos,
    festiveThemes,
    settings,
    switchFestiveTheme,
    saveBanner,
    deleteBanner,
    saveAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement,
    saveYouTubeVideo,
    deleteYouTubeVideo,
    homepageConfig,
    saveHomepageConfig,
    updateSectionVisibility,
    moveSectionOrder,
    adminToast,
  } = useAdmin();

  // Active subtab
  const [activeTab, setActiveTab] = useState<ContentTab>("overview");

  // Announcement state
  const [newAnnText, setNewAnnText] = useState("");

  // Banner Modal state (Hero Carousel)
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdminBanner | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerBadge, setBannerBadge] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [bannerLink, setBannerLink] = useState("/products");
  const [bannerBtnText, setBannerBtnText] = useState("Shop Now");
  const [bannerCategory, setBannerCategory] = useState("");
  const [bannerPrice, setBannerPrice] = useState("");
  const [bannerMrp, setBannerMrp] = useState("");

  // YouTube Video Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideoItem | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoTag, setVideoTag] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState("");
  const [videoDuration, setVideoDuration] = useState("Shorts");
  const [videoViews, setVideoViews] = useState("1.5K");

  // Policy Pages state
  const [policyTab, setPolicyTab] = useState<"refund" | "privacy" | "terms" | "shipping">("refund");
  const [policyText, setPolicyText] = useState(
    "Miracle Collections offers a hassle-free 7-day return policy for unworn, unwashed items in original packaging with tags attached. Once returned items are inspected, refunds are credited back to the original UPI reference within 48 hours."
  );

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryGroupCard | null>(null);
  const [catTitle, setCatTitle] = useState("");
  const [catHref, setCatHref] = useState("");
  const [catSub1Name, setCatSub1Name] = useState("");
  const [catSub1Href, setCatSub1Href] = useState("");
  const [catSub1Image, setCatSub1Image] = useState("");
  const [catSub2Name, setCatSub2Name] = useState("");
  const [catSub2Href, setCatSub2Href] = useState("");
  const [catSub2Image, setCatSub2Image] = useState("");

  // Spotlight Modal state
  const [isSpotlightModalOpen, setIsSpotlightModalOpen] = useState(false);
  const [editingSpotlight, setEditingSpotlight] = useState<AdminSpotlightItem | null>(null);
  const [spotBrand, setSpotBrand] = useState("MIRACLE");
  const [spotTitle, setSpotTitle] = useState("");
  const [spotSubtitle, setSpotSubtitle] = useState("");
  const [spotPrice, setSpotPrice] = useState("");
  const [spotImage, setSpotImage] = useState("");
  const [spotHref, setSpotHref] = useState("/products");

  // Occasion Modal state
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<AdminOccasionItem | null>(null);
  const [occTitle, setOccTitle] = useState("");
  const [occTagline, setOccTagline] = useState("");
  const [occBadge, setOccBadge] = useState("");
  const [occImage, setOccImage] = useState("");
  const [occHref, setOccHref] = useState("/products");

  // Budget Modal state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<AdminBudgetTier | null>(null);
  const [budLabel, setBudLabel] = useState("");
  const [budDesc, setBudDesc] = useState("");
  const [budBadge, setBudBadge] = useState("");
  const [budPopular, setBudPopular] = useState("");
  const [budImage, setBudImage] = useState("");
  const [budHref, setBudHref] = useState("/products");

  // Why Us Modal state
  const [isWhyUsModalOpen, setIsWhyUsModalOpen] = useState(false);
  const [editingWhyUs, setEditingWhyUs] = useState<AdminWhyUsItem | null>(null);
  const [whyTitle, setWhyTitle] = useState("");
  const [whyDesc, setWhyDesc] = useState("");
  const [whyIcon, setWhyIcon] = useState("Sparkles");

  // Editorial Campaign Form state
  const [editorialForm, setEditorialForm] = useState<AdminEditorialCampaign>(() => homepageConfig.editorial);

  // Headers & CTA state
  const [trendingBadge, setTrendingBadge] = useState(homepageConfig.trending?.badge || "Popular Demand");
  const [trendingTitle, setTrendingTitle] = useState(homepageConfig.trending?.title || "Trending Now");
  const [trendingSubtitle, setTrendingSubtitle] = useState(homepageConfig.trending?.subtitle || "");
  const [trendingLink, setTrendingLink] = useState(homepageConfig.trending?.viewAll || "/products?sort=popular");

  const [discoveryBadge, setDiscoveryBadge] = useState(homepageConfig.discovery?.badge || "Customer Favorites");
  const [discoveryTitle, setDiscoveryTitle] = useState(homepageConfig.discovery?.title || "Popular Picks For You");
  const [discoverySubtitle, setDiscoverySubtitle] = useState(homepageConfig.discovery?.subtitle || "");
  const [discoveryLink, setDiscoveryLink] = useState(homepageConfig.discovery?.viewAll || "/products?sort=rating");

  const [dealsBadge, setDealsBadge] = useState(homepageConfig.deals?.badge || "Offers & Savings");
  const [dealsTitle, setDealsTitle] = useState(homepageConfig.deals?.title || "Special Offers & Coupons");
  const [dealsSubtitle, setDealsSubtitle] = useState(homepageConfig.deals?.subtitle || "");
  const [dealsBannerTag, setDealsBannerTag] = useState(homepageConfig.deals?.bannerTag || "Limited Festive Run");
  const [dealsBannerTitle, setDealsBannerTitle] = useState(homepageConfig.deals?.bannerTitle || "Festive Wardrobe Extravaganza");
  const [dealsBannerSubtitle, setDealsBannerSubtitle] = useState(homepageConfig.deals?.bannerSubtitle || "");
  const [dealsBannerCode, setDealsBannerCode] = useState(homepageConfig.deals?.bannerCode || "FESTIVE10");
  const [dealsBannerLink, setDealsBannerLink] = useState(homepageConfig.deals?.bannerLink || "/products");

  const [ctaBadge, setCtaBadge] = useState(homepageConfig.finalCta?.badge || "Your Fashion Journey Starts Here");
  const [ctaTitle, setCtaTitle] = useState(homepageConfig.finalCta?.title || "Ready to Upgrade Your Wardrobe?");
  const [ctaDesc, setCtaDesc] = useState(homepageConfig.finalCta?.description || "");
  const [ctaPrimaryBtnText, setCtaPrimaryBtnText] = useState(homepageConfig.finalCta?.primaryBtnText || "Browse All Collections");
  const [ctaPrimaryBtnLink, setCtaPrimaryBtnLink] = useState(homepageConfig.finalCta?.primaryBtnLink || "/products");
  const [ctaSecondaryBtnText, setCtaSecondaryBtnText] = useState(homepageConfig.finalCta?.secondaryBtnText || "View Trending Now");
  const [ctaSecondaryBtnLink, setCtaSecondaryBtnLink] = useState(homepageConfig.finalCta?.secondaryBtnLink || "/products?sort=popular");

  // YouTube URL parser helper
  const parseYouTubeUrl = (url: string) => {
    if (!url) return { videoId: null, isShort: false };
    const trimmed = url.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return { videoId: trimmed, isShort: false };
    }
    const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
      return { videoId: shortsMatch[1], isShort: true };
    }
    const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      return { videoId: watchMatch[1], isShort: false };
    }
    const youtuMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtuMatch) {
      return { videoId: youtuMatch[1], isShort: false };
    }
    const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (embedMatch) {
      return { videoId: embedMatch[1], isShort: false };
    }
    return { videoId: null, isShort: false };
  };

  const handleUrlChange = (newUrl: string) => {
    setVideoUrl(newUrl);
    const parsed = parseYouTubeUrl(newUrl);
    if (parsed.videoId) {
      setVideoId(parsed.videoId);
      if (!videoThumbnail || videoThumbnail.includes("i.ytimg.com") || videoThumbnail.includes("unsplash")) {
        setVideoThumbnail(`https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`);
      }
      if (parsed.isShort) {
        setVideoDuration("Shorts");
      }
    }
  };

  const handleOpenBannerModal = (b?: AdminBanner) => {
    if (b) {
      setEditingBanner(b);
      setBannerTitle(b.title);
      setBannerSubtitle(b.subtitle);
      setBannerBadge(b.badge);
      setBannerCategory(b.category || "");
      setBannerPrice(b.price !== undefined ? String(b.price) : "");
      setBannerMrp(b.mrp !== undefined ? String(b.mrp) : "");
      setBannerImage(b.image);
      setBannerLink(b.link);
      setBannerBtnText(b.buttonText);
    } else {
      setEditingBanner(null);
      setBannerTitle("");
      setBannerSubtitle("");
      setBannerBadge("Festive Offer");
      setBannerCategory("Heritage Weaves");
      setBannerPrice("");
      setBannerMrp("");
      setBannerImage("https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=1600&q=80");
      setBannerLink("/products");
      setBannerBtnText("Shop Now");
    }
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) return;

    saveBanner({
      ...(editingBanner ? { id: editingBanner.id, rating: editingBanner.rating, reviews: editingBanner.reviews, order: editingBanner.order } : {}),
      title: bannerTitle.trim(),
      subtitle: bannerSubtitle.trim(),
      badge: bannerBadge.trim(),
      category: bannerCategory.trim() || undefined,
      price: bannerPrice ? Number(bannerPrice) : undefined,
      mrp: bannerMrp ? Number(bannerMrp) : undefined,
      image: bannerImage.trim(),
      link: bannerLink.trim() || "/products",
      buttonText: bannerBtnText.trim() || "Shop Now",
      active: true,
    });

    setIsBannerModalOpen(false);
  };

  const handleOpenVideoModal = (v?: YouTubeVideoItem) => {
    if (v) {
      setEditingVideo(v);
      setVideoTitle(v.title);
      setVideoUrl(v.url || (v.videoId ? `https://youtube.com/shorts/${v.videoId}` : ""));
      setVideoId(v.videoId);
      setVideoDescription(v.description || "");
      setVideoTag(v.tag || "Ethnic Collection");
      setVideoThumbnail(v.thumbnail || (v.videoId ? `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg` : ""));
      setVideoDuration(v.duration || "Shorts");
      setVideoViews(v.views || "1.5K");
    } else {
      setEditingVideo(null);
      setVideoTitle("");
      setVideoUrl("");
      setVideoId("");
      setVideoDescription("");
      setVideoTag("Kids Lehenga");
      setVideoThumbnail("");
      setVideoDuration("Shorts");
      setVideoViews("1.5K");
    }
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) return;

    let finalId = videoId.trim();
    if (!finalId && videoUrl.trim()) {
      const parsed = parseYouTubeUrl(videoUrl);
      if (parsed.videoId) finalId = parsed.videoId;
    }
    if (!finalId) finalId = "KFCkU1PGMhI";

    const finalUrl = videoUrl.trim() || `https://youtube.com/shorts/${finalId}`;
    const finalThumbnail = videoThumbnail.trim() || `https://i.ytimg.com/vi/${finalId}/hqdefault.jpg`;

    saveYouTubeVideo({
      ...(editingVideo ? { id: editingVideo.id } : {}),
      title: videoTitle.trim(),
      videoId: finalId,
      url: finalUrl,
      description: videoDescription.trim(),
      tag: videoTag.trim() || "Collection",
      thumbnail: finalThumbnail,
      duration: videoDuration.trim() || "Shorts",
      views: videoViews.trim() || "1.5K",
      active: true,
    });

    setIsVideoModalOpen(false);
  };

  // Category handlers
  const handleOpenCategoryModal = (c?: AdminCategoryGroupCard) => {
    if (c) {
      setEditingCategory(c);
      setCatTitle(c.title);
      setCatHref(c.href);
      setCatSub1Name(c.items[0]?.name || "");
      setCatSub1Href(c.items[0]?.href || "");
      setCatSub1Image(c.items[0]?.image || "");
      setCatSub2Name(c.items[1]?.name || "");
      setCatSub2Href(c.items[1]?.href || "");
      setCatSub2Image(c.items[1]?.image || "");
    } else {
      setEditingCategory(null);
      setCatTitle("");
      setCatHref("/products");
      setCatSub1Name("");
      setCatSub1Href("/products");
      setCatSub1Image("");
      setCatSub2Name("");
      setCatSub2Href("/products");
      setCatSub2Image("");
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catTitle.trim()) return;

    const newGroup: AdminCategoryGroupCard = {
      id: editingCategory?.id || `grp-${Date.now()}`,
      title: catTitle.trim(),
      href: catHref.trim() || "/products",
      order: editingCategory?.order ?? (homepageConfig.categoryGroups.length + 1),
      active: editingCategory?.active ?? true,
      items: [
        {
          name: catSub1Name.trim() || "Featured",
          href: catSub1Href.trim() || "/products",
          image: catSub1Image.trim() || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80",
        },
        {
          name: catSub2Name.trim() || "Collection",
          href: catSub2Href.trim() || "/products",
          image: catSub2Image.trim() || "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80",
        },
      ],
    };

    let nextGroups = [...homepageConfig.categoryGroups];
    if (editingCategory) {
      nextGroups = nextGroups.map((g) => (g.id === editingCategory.id ? newGroup : g));
    } else {
      nextGroups.push(newGroup);
    }

    await saveHomepageConfig({ ...homepageConfig, categoryGroups: nextGroups });
    setIsCategoryModalOpen(false);
    adminToast("Category group saved successfully!", "success");
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to remove this category group from the homepage? (The underlying products will NOT be deleted)")) return;
    const nextGroups = homepageConfig.categoryGroups.filter((g) => g.id !== id);
    await saveHomepageConfig({ ...homepageConfig, categoryGroups: nextGroups });
    adminToast("Category group removed from homepage", "info");
  };

  const handleToggleCategory = async (id: string) => {
    const nextGroups = homepageConfig.categoryGroups.map((g) =>
      g.id === id ? { ...g, active: !(g.active ?? true) } : g
    );
    await saveHomepageConfig({ ...homepageConfig, categoryGroups: nextGroups });
  };

  const handleMoveCategory = async (id: string, direction: "up" | "down") => {
    const list = [...homepageConfig.categoryGroups];
    const index = list.findIndex((g) => g.id === id);
    if (index === -1) return;
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    const updated = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    await saveHomepageConfig({ ...homepageConfig, categoryGroups: updated });
  };

  // Spotlight handlers
  const handleOpenSpotlightModal = (s?: AdminSpotlightItem) => {
    if (s) {
      setEditingSpotlight(s);
      setSpotBrand(s.brand || "MIRACLE");
      setSpotTitle(s.title);
      setSpotSubtitle(s.subtitle || "");
      setSpotPrice(s.price ? String(s.price) : "");
      setSpotImage(s.image);
      setSpotHref(s.href);
    } else {
      setEditingSpotlight(null);
      setSpotBrand("MIRACLE");
      setSpotTitle("");
      setSpotSubtitle("");
      setSpotPrice("");
      setSpotImage("");
      setSpotHref("/products");
    }
    setIsSpotlightModalOpen(true);
  };

  const handleSaveSpotlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotTitle.trim()) return;

    const newItem: AdminSpotlightItem = {
      id: editingSpotlight?.id || `spot-${Date.now()}`,
      brand: spotBrand.trim() || "MIRACLE",
      title: spotTitle.trim(),
      subtitle: spotSubtitle.trim(),
      price: Number(spotPrice) || 0,
      image: spotImage.trim(),
      href: spotHref.trim() || "/products",
      order: editingSpotlight?.order ?? (homepageConfig.spotlightItems.length + 1),
      active: editingSpotlight?.active ?? true,
    };

    let nextItems = [...homepageConfig.spotlightItems];
    if (editingSpotlight) {
      nextItems = nextItems.map((i) => (i.id === editingSpotlight.id ? newItem : i));
    } else {
      nextItems.push(newItem);
    }

    await saveHomepageConfig({ ...homepageConfig, spotlightItems: nextItems });
    setIsSpotlightModalOpen(false);
    adminToast("Spotlight item saved successfully!", "success");
  };

  const handleDeleteSpotlight = async (id: string) => {
    if (!confirm("Remove this spotlight product from homepage?")) return;
    const nextItems = homepageConfig.spotlightItems.filter((i) => i.id !== id);
    await saveHomepageConfig({ ...homepageConfig, spotlightItems: nextItems });
    adminToast("Spotlight item removed", "info");
  };

  const handleToggleSpotlight = async (id: string) => {
    const nextItems = homepageConfig.spotlightItems.map((i) =>
      i.id === id ? { ...i, active: !(i.active ?? true) } : i
    );
    await saveHomepageConfig({ ...homepageConfig, spotlightItems: nextItems });
  };

  const handleMoveSpotlight = async (id: string, direction: "up" | "down") => {
    const list = [...homepageConfig.spotlightItems];
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) return;
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    const updated = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    await saveHomepageConfig({ ...homepageConfig, spotlightItems: updated });
  };

  // Occasion handlers
  const handleOpenOccasionModal = (o?: AdminOccasionItem) => {
    if (o) {
      setEditingOccasion(o);
      setOccTitle(o.title);
      setOccTagline(o.tagline || "");
      setOccBadge(o.badge || "");
      setOccImage(o.image);
      setOccHref(o.href);
    } else {
      setEditingOccasion(null);
      setOccTitle("");
      setOccTagline("");
      setOccBadge("");
      setOccImage("");
      setOccHref("/products");
    }
    setIsOccasionModalOpen(true);
  };

  const handleSaveOccasion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occTitle.trim()) return;

    const newItem: AdminOccasionItem = {
      id: editingOccasion?.id || `occ-${Date.now()}`,
      title: occTitle.trim(),
      tagline: occTagline.trim(),
      badge: occBadge.trim() || undefined,
      image: occImage.trim(),
      href: occHref.trim() || "/products",
      order: editingOccasion?.order ?? (homepageConfig.occasions.length + 1),
      active: editingOccasion?.active ?? true,
    };

    let nextItems = [...homepageConfig.occasions];
    if (editingOccasion) {
      nextItems = nextItems.map((i) => (i.id === editingOccasion.id ? newItem : i));
    } else {
      nextItems.push(newItem);
    }

    await saveHomepageConfig({ ...homepageConfig, occasions: nextItems });
    setIsOccasionModalOpen(false);
    adminToast("Occasion card saved successfully!", "success");
  };

  const handleDeleteOccasion = async (id: string) => {
    if (!confirm("Remove this occasion from homepage?")) return;
    const nextItems = homepageConfig.occasions.filter((i) => i.id !== id);
    await saveHomepageConfig({ ...homepageConfig, occasions: nextItems });
    adminToast("Occasion removed", "info");
  };

  const handleToggleOccasion = async (id: string) => {
    const nextItems = homepageConfig.occasions.map((i) =>
      i.id === id ? { ...i, active: !(i.active ?? true) } : i
    );
    await saveHomepageConfig({ ...homepageConfig, occasions: nextItems });
  };

  const handleMoveOccasion = async (id: string, direction: "up" | "down") => {
    const list = [...homepageConfig.occasions];
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) return;
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    const updated = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    await saveHomepageConfig({ ...homepageConfig, occasions: updated });
  };

  // Budget handlers
  const handleOpenBudgetModal = (b?: AdminBudgetTier) => {
    if (b) {
      setEditingBudget(b);
      setBudLabel(b.label);
      setBudDesc(b.description || "");
      setBudBadge(b.badge || "");
      setBudPopular(b.popular || "");
      setBudImage(b.image);
      setBudHref(b.href);
    } else {
      setEditingBudget(null);
      setBudLabel("");
      setBudDesc("");
      setBudBadge("");
      setBudPopular("");
      setBudImage("");
      setBudHref("/products");
    }
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budLabel.trim()) return;

    const newItem: AdminBudgetTier = {
      id: editingBudget?.id || `bud-${Date.now()}`,
      label: budLabel.trim(),
      description: budDesc.trim(),
      badge: budBadge.trim(),
      popular: budPopular.trim(),
      image: budImage.trim(),
      href: budHref.trim() || "/products",
      order: editingBudget?.order ?? (homepageConfig.budgetTiers.length + 1),
      active: editingBudget?.active ?? true,
    };

    let nextItems = [...homepageConfig.budgetTiers];
    if (editingBudget) {
      nextItems = nextItems.map((i) => (i.id === editingBudget.id ? newItem : i));
    } else {
      nextItems.push(newItem);
    }

    await saveHomepageConfig({ ...homepageConfig, budgetTiers: nextItems });
    setIsBudgetModalOpen(false);
    adminToast("Budget tier saved successfully!", "success");
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Remove this budget tier from homepage?")) return;
    const nextItems = homepageConfig.budgetTiers.filter((i) => i.id !== id);
    await saveHomepageConfig({ ...homepageConfig, budgetTiers: nextItems });
    adminToast("Budget tier removed", "info");
  };

  const handleToggleBudget = async (id: string) => {
    const nextItems = homepageConfig.budgetTiers.map((i) =>
      i.id === id ? { ...i, active: !(i.active ?? true) } : i
    );
    await saveHomepageConfig({ ...homepageConfig, budgetTiers: nextItems });
  };

  const handleMoveBudget = async (id: string, direction: "up" | "down") => {
    const list = [...homepageConfig.budgetTiers];
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) return;
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    const updated = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    await saveHomepageConfig({ ...homepageConfig, budgetTiers: updated });
  };

  // Why Us handlers
  const handleOpenWhyUsModal = (w?: AdminWhyUsItem) => {
    if (w) {
      setEditingWhyUs(w);
      setWhyTitle(w.title);
      setWhyDesc(w.description);
      setWhyIcon(w.iconName || "Sparkles");
    } else {
      setEditingWhyUs(null);
      setWhyTitle("");
      setWhyDesc("");
      setWhyIcon("Sparkles");
    }
    setIsWhyUsModalOpen(true);
  };

  const handleSaveWhyUs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whyTitle.trim()) return;

    const newItem: AdminWhyUsItem = {
      id: editingWhyUs?.id || `why-${Date.now()}`,
      title: whyTitle.trim(),
      description: whyDesc.trim(),
      iconName: whyIcon,
      order: editingWhyUs?.order ?? (homepageConfig.whyUsItems.length + 1),
      active: editingWhyUs?.active ?? true,
    };

    let nextItems = [...homepageConfig.whyUsItems];
    if (editingWhyUs) {
      nextItems = nextItems.map((i) => (i.id === editingWhyUs.id ? newItem : i));
    } else {
      nextItems.push(newItem);
    }

    await saveHomepageConfig({ ...homepageConfig, whyUsItems: nextItems });
    setIsWhyUsModalOpen(false);
    adminToast("Reason saved successfully!", "success");
  };

  const handleDeleteWhyUs = async (id: string) => {
    if (!confirm("Remove this reason from homepage?")) return;
    const nextItems = homepageConfig.whyUsItems.filter((i) => i.id !== id);
    await saveHomepageConfig({ ...homepageConfig, whyUsItems: nextItems });
    adminToast("Reason removed", "info");
  };

  const handleToggleWhyUs = async (id: string) => {
    const nextItems = homepageConfig.whyUsItems.map((i) =>
      i.id === id ? { ...i, active: !(i.active ?? true) } : i
    );
    await saveHomepageConfig({ ...homepageConfig, whyUsItems: nextItems });
  };

  const handleMoveWhyUs = async (id: string, direction: "up" | "down") => {
    const list = [...homepageConfig.whyUsItems];
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) return;
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    const updated = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    await saveHomepageConfig({ ...homepageConfig, whyUsItems: updated });
  };

  // Quick Benefits Trust Strip handlers
  const handleToggleQuickBenefit = async (id: string) => {
    const nextItems = homepageConfig.quickBenefits.map((b) =>
      b.id === id ? { ...b, active: !(b.active ?? true) } : b
    );
    await saveHomepageConfig({ ...homepageConfig, quickBenefits: nextItems });
  };

  const handleUpdateQuickBenefit = async (id: string, patch: Partial<AdminQuickBenefitItem>) => {
    const nextItems = homepageConfig.quickBenefits.map((b) =>
      b.id === id ? { ...b, ...patch } : b
    );
    await saveHomepageConfig({ ...homepageConfig, quickBenefits: nextItems });
    adminToast("Trust badge updated!", "success");
  };

  // Editorial Campaign save handler
  const handleSaveEditorial = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveHomepageConfig({ ...homepageConfig, editorial: editorialForm });
    adminToast("Editorial fashion campaign published to homepage!", "success");
  };

  // Headers and CTA save handler
  const handleSaveHeadersAndCta = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveHomepageConfig({
      ...homepageConfig,
      trending: {
        badge: trendingBadge,
        title: trendingTitle,
        subtitle: trendingSubtitle,
        viewAll: trendingLink,
      },
      discovery: {
        badge: discoveryBadge,
        title: discoveryTitle,
        subtitle: discoverySubtitle,
        viewAll: discoveryLink,
      },
      deals: {
        badge: dealsBadge,
        title: dealsTitle,
        subtitle: dealsSubtitle,
        bannerTag: dealsBannerTag,
        bannerTitle: dealsBannerTitle,
        bannerSubtitle: dealsBannerSubtitle,
        bannerCode: dealsBannerCode,
        bannerDiscount: "10% INSTANT",
        bannerLink: dealsBannerLink,
      },
      finalCta: {
        badge: ctaBadge,
        title: ctaTitle,
        description: ctaDesc,
        primaryBtnText: ctaPrimaryBtnText,
        primaryBtnLink: ctaPrimaryBtnLink,
        secondaryBtnText: ctaSecondaryBtnText,
        secondaryBtnLink: ctaSecondaryBtnLink,
      },
    });
    adminToast("Section headers and CTA updated on homepage!", "success");
  };

  const sortedSections = [...homepageConfig.sections].sort((a, b) => a.order - b.order);
  const activeSectionCount = sortedSections.filter((s) => s.enabled).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white shadow-sm">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black">
              Storefront Merchandising & Content
            </h1>
            <p className="text-xs text-neutral-500">
              Manage all 13 homepage sections, live display sequence, content cards, seasonal themes & policies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            {activeSectionCount} of {sortedSections.length} Sections Live
          </span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-neutral-50 shadow-xs transition"
          >
            <span>Preview Storefront</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-neutral-200">
        {[
          { id: "overview", label: "Full Hub", icon: Layers },
          { id: "sections", label: "Section Order & Visibility", icon: Eye },
          { id: "hero", label: "Hero Banners", icon: Sparkles },
          { id: "categories", label: "Categories", icon: ShoppingBag },
          { id: "spotlight", label: "Spotlight", icon: Star },
          { id: "editorial", label: "Editorial", icon: Award },
          { id: "occasions", label: "Occasions", icon: Gift },
          { id: "budget", label: "Budget Tiers", icon: Tag },
          { id: "trust", label: "Trust Strip", icon: ShieldCheck },
          { id: "why-us", label: "Why Shop With Us", icon: Sparkles },
          { id: "videos", label: "YouTube Showcase", icon: Video },
          { id: "headers", label: "Headers & CTAs", icon: Flame },
          { id: "policies", label: "Policies", icon: Check },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ContentTab)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Festive Theming 1-Click Switcher */}
      {(activeTab === "overview" || activeTab === "sections") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                  1-Click Festive Theme Switcher
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Switch seasonal palettes and banner graphics (Diwali, Sankranti, Sale) with a single click
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-black border border-neutral-200">
              Active: {settings?.activeFestiveTheme?.toUpperCase() || "None"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {festiveThemes.map((theme) => {
              const isSelected = settings?.activeFestiveTheme === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => switchFestiveTheme(theme.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
                    isSelected
                      ? "border-black bg-neutral-50 shadow-sm"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white font-bold">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    {/* Color Swatch Bar */}
                    <div className="flex h-3 w-full rounded-full overflow-hidden mb-3 border border-neutral-200">
                      <div style={{ backgroundColor: theme.primaryColor }} className="flex-1" />
                      <div style={{ backgroundColor: theme.accentColor }} className="w-1/3" />
                    </div>

                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      {theme.badge}
                    </span>
                    <h3 className="font-bold text-black text-sm mt-0.5">{theme.name}</h3>
                    <p className="text-xs text-neutral-600 mt-2 font-medium italic line-clamp-2">
                      &quot;{theme.bannerHeadline}&quot;
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-between items-center text-[11px]">
                    <span className="text-neutral-400 font-mono">Palette preview</span>
                    <button
                      type="button"
                      className={`font-semibold ${
                        isSelected ? "text-black" : "text-neutral-500 group-hover:text-black"
                      }`}
                    >
                      {isSelected ? "Active Theme" : "Apply Theme"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Top Announcement Bar */}
      {(activeTab === "overview" || activeTab === "headers") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-black uppercase tracking-wider">
              Top Announcement Bar
            </h2>
            <p className="text-xs text-neutral-500">
              Rotating promo messages displayed at the very top of the customer storefront
            </p>
          </div>

          <div className="space-y-2">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleAnnouncement(ann.id)}
                    className={`h-2.5 w-2.5 rounded-full ${
                      ann.active ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-neutral-300"
                    }`}
                    title={ann.active ? "Active" : "Hidden"}
                  />
                  <span className={ann.active ? "text-black font-medium" : "text-neutral-400 line-through"}>
                    {ann.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteAnnouncement(ann.id)}
                  className="text-neutral-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newAnnText}
              onChange={(e) => setNewAnnText(e.target.value)}
              placeholder="Type announcement e.g. 'Use code FESTIVE10 for 10% instant discount'..."
              className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none"
            />
            <button
              onClick={() => {
                if (!newAnnText.trim()) return;
                saveAnnouncement(newAnnText.trim());
                setNewAnnText("");
              }}
              className="flex items-center gap-1 rounded-lg bg-black hover:bg-neutral-800 px-4 py-2 text-xs font-semibold text-white transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Text</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Section Order & Visibility Controller */}
      {(activeTab === "overview" || activeTab === "sections") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-black" />
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                  Homepage Section Order & Visibility Controller
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Reorder sections up/down or toggle them on/off. Customer homepage updates immediately in real time.
              </p>
            </div>
            <span className="text-xs font-semibold text-neutral-500">
              Drag or use arrows to adjust sequence
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 divide-y divide-neutral-200 bg-neutral-50">
            {sortedSections.map((sec, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === sortedSections.length - 1;

              return (
                <div
                  key={sec.id}
                  className={`flex items-center justify-between p-3.5 transition-colors ${
                    sec.enabled ? "bg-white hover:bg-neutral-50/80" : "bg-neutral-100/70 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 font-mono text-xs font-black text-neutral-700">
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-black text-xs sm:text-sm truncate">
                          {sec.name}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            sec.enabled
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-200 text-neutral-600"
                          }`}
                        >
                          {sec.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">{sec.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveSectionOrder(sec.id, "up")}
                      className="rounded-md border border-neutral-200 p-1.5 text-neutral-600 hover:border-black hover:text-black disabled:opacity-30 disabled:hover:border-neutral-200 transition"
                      title="Move section up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveSectionOrder(sec.id, "down")}
                      className="rounded-md border border-neutral-200 p-1.5 text-neutral-600 hover:border-black hover:text-black disabled:opacity-30 disabled:hover:border-neutral-200 transition"
                      title="Move section down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => updateSectionVisibility(sec.id, !sec.enabled)}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                        sec.enabled
                          ? "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                          : "bg-black text-white hover:bg-neutral-800"
                      }`}
                      title={sec.enabled ? "Hide section from homepage" : "Show section on homepage"}
                    >
                      {sec.enabled ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Show</span>
                        </>
                      )}
                    </button>

                    {/* Quick jump to editor */}
                    <button
                      type="button"
                      onClick={() => {
                        const tabMap: Record<string, ContentTab> = {
                          hero: "hero",
                          categories: "categories",
                          "quick-benefits": "trust",
                          trending: "headers",
                          spotlight: "spotlight",
                          deals: "headers",
                          editorial: "editorial",
                          occasions: "occasions",
                          discovery: "headers",
                          budget: "budget",
                          videos: "videos",
                          "why-us": "why-us",
                          "final-cta": "headers",
                        };
                        setActiveTab(tabMap[sec.id] || "overview");
                      }}
                      className="rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[11px] font-bold text-black hover:bg-neutral-100 transition hidden md:inline-flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit Content</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Hero Carousel Banners Manager */}
      {(activeTab === "overview" || activeTab === "hero") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                Hero Carousel Banners
              </h2>
              <p className="text-xs text-neutral-500">
                Full-width banners with headlines, offers, and direct action CTAs
              </p>
            </div>
            <button
              onClick={() => handleOpenBannerModal()}
              className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm group flex flex-col justify-between"
              >
                <div className="h-40 relative bg-neutral-100">
                  <img src={b.image} alt={b.title} onError={handleImageError} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 max-w-[90%]">
                    <span className="rounded bg-black text-white text-[10px] font-semibold px-2 py-0.5">
                      {b.badge}
                    </span>
                    {b.category && (
                      <span className="rounded bg-white/95 text-black text-[10px] font-bold px-2 py-0.5 shadow-xs">
                        {b.category}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="text-sm font-bold text-white leading-tight">{b.title}</h3>
                  </div>
                </div>

                <div className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-neutral-500 text-[11px] line-clamp-2">{b.subtitle}</p>
                    {b.price !== undefined && (
                      <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-sm font-bold text-neutral-900">₹{b.price.toLocaleString("en-IN")}</span>
                        {b.mrp !== undefined && (
                          <span className="text-[11px] text-neutral-400 line-through">₹{b.mrp.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex justify-between items-center">
                    <button
                      onClick={() => handleOpenBannerModal(b)}
                      className="text-black font-semibold hover:underline"
                    >
                      Edit Banner
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete banner '${b.title}'?`)) deleteBanner(b.id);
                      }}
                      className="text-neutral-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Shop By Category (Curated Dual-Item Group Cards) */}
      {(activeTab === "overview" || activeTab === "categories") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                Shop By Category Cards
              </h2>
              <p className="text-xs text-neutral-500">
                Curated dual-item category cards with high-conversion imagery & subcategory quick links
              </p>
            </div>
            <button
              onClick={() => handleOpenCategoryModal()}
              className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Category Group</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homepageConfig.categoryGroups.map((group, idx) => (
              <div
                key={group.id}
                className={`rounded-xl border border-neutral-200 bg-white p-4 flex flex-col justify-between shadow-xs transition-opacity ${
                  group.active !== false ? "opacity-100" : "opacity-50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <span className="font-bold text-black text-sm">{group.title}</span>
                    <span className="text-[10px] font-mono text-neutral-400">Card #{idx + 1}</span>
                  </div>

                  {/* Dual image preview */}
                  <div className="grid grid-cols-2 gap-2 my-3">
                    {group.items.map((sub, sIdx) => (
                      <div key={sIdx} className="space-y-1">
                        <div className="h-24 w-full rounded-lg overflow-hidden bg-neutral-100">
                          <img
                            src={sub.image}
                            alt={sub.name}
                            onError={handleImageError}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] font-bold text-neutral-800 truncate">{sub.name}</p>
                        <p className="text-[10px] text-neutral-400 font-mono truncate">{sub.href}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveCategory(group.id, "up")}
                      className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === homepageConfig.categoryGroups.length - 1}
                      onClick={() => handleMoveCategory(group.id, "down")}
                      className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(group.id)}
                      className="ml-1 text-[11px] font-semibold text-neutral-600 hover:text-black"
                    >
                      {group.active !== false ? "Active" : "Hidden"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryModal(group)}
                      className="font-bold text-black hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(group.id)}
                      className="text-neutral-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. In The Spotlight Manager */}
      {(activeTab === "overview" || activeTab === "spotlight") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                In The Spotlight Products
              </h2>
              <p className="text-xs text-neutral-500">
                Editorial showcase cards with brand badge, title, subtitle & direct purchase link
              </p>
            </div>
            <button
              onClick={() => handleOpenSpotlightModal()}
              className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Spotlight Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {homepageConfig.spotlightItems.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xs flex flex-col justify-between ${
                  item.active !== false ? "opacity-100" : "opacity-50"
                }`}
              >
                <div className="h-44 relative bg-neutral-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    onError={handleImageError}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[9px] font-bold text-white tracking-widest uppercase">
                    {item.brand}
                  </span>
                </div>

                <div className="p-3.5 space-y-2 text-xs flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-black text-xs line-clamp-1">{item.title}</h3>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{item.subtitle}</p>
                    <p className="font-bold text-black text-sm mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSpotlight(item.id, "up")}
                        className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === homepageConfig.spotlightItems.length - 1}
                        onClick={() => handleMoveSpotlight(item.id, "down")}
                        className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSpotlight(item.id)}
                        className="ml-1 text-[10px] font-semibold text-neutral-600"
                      >
                        {item.active !== false ? "Active" : "Hidden"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSpotlightModal(item)}
                        className="font-bold text-black hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSpotlight(item.id)}
                        className="text-neutral-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Editorial Fashion Campaign */}
      {(activeTab === "overview" || activeTab === "editorial") && (
        <form
          onSubmit={handleSaveEditorial}
          className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-black" />
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                  Editorial Fashion Campaign Section
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Full-width magazine editorial spotlight with pull quote, bullet highlights, 3 featured lookbook shots & CTAs
              </p>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-black hover:bg-neutral-800 px-4 py-2 text-xs font-bold text-white transition shadow-sm"
            >
              Save Campaign Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Badge Label</label>
              <input
                type="text"
                value={editorialForm.badge}
                onChange={(e) => setEditorialForm({ ...editorialForm, badge: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Headline</label>
              <input
                type="text"
                value={editorialForm.headline}
                onChange={(e) => setEditorialForm({ ...editorialForm, headline: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-neutral-700">Tagline / Subheading</label>
              <input
                type="text"
                value={editorialForm.tagline}
                onChange={(e) => setEditorialForm({ ...editorialForm, tagline: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-neutral-700">Pull Quote</label>
              <input
                type="text"
                value={editorialForm.pullQuote}
                onChange={(e) => setEditorialForm({ ...editorialForm, pullQuote: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none italic"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-neutral-700">Editorial Narrative / Description</label>
              <textarea
                rows={3}
                value={editorialForm.description}
                onChange={(e) => setEditorialForm({ ...editorialForm, description: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 p-2.5 text-black focus:border-black focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* 3 Campaign Imagery Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 pt-4 text-xs">
            {/* Primary Large Image */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
              <span className="font-bold text-black text-xs uppercase tracking-wide">Primary Lookbook Shot</span>
              <div className="h-32 rounded-lg bg-neutral-200 overflow-hidden">
                <img src={editorialForm.primaryImage} alt="Primary" onError={handleImageError} className="h-full w-full object-cover" />
              </div>
              <input
                type="url"
                value={editorialForm.primaryImage}
                onChange={(e) => setEditorialForm({ ...editorialForm, primaryImage: e.target.value })}
                placeholder="Image URL"
                className="w-full rounded border border-neutral-300 bg-white p-1.5 text-[11px]"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={editorialForm.primaryBadge}
                  onChange={(e) => setEditorialForm({ ...editorialForm, primaryBadge: e.target.value })}
                  placeholder="Badge (e.g. 2026 Collection)"
                  className="rounded border border-neutral-300 bg-white p-1 text-[11px]"
                />
                <input
                  type="text"
                  value={editorialForm.primaryTitle}
                  onChange={(e) => setEditorialForm({ ...editorialForm, primaryTitle: e.target.value })}
                  placeholder="Title (e.g. Regal Violet)"
                  className="rounded border border-neutral-300 bg-white p-1 text-[11px]"
                />
              </div>
            </div>

            {/* Secondary Image */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
              <span className="font-bold text-black text-xs uppercase tracking-wide">Secondary Detail Shot</span>
              <div className="h-32 rounded-lg bg-neutral-200 overflow-hidden">
                <img src={editorialForm.secondaryImage} alt="Secondary" onError={handleImageError} className="h-full w-full object-cover" />
              </div>
              <input
                type="url"
                value={editorialForm.secondaryImage}
                onChange={(e) => setEditorialForm({ ...editorialForm, secondaryImage: e.target.value })}
                placeholder="Image URL"
                className="w-full rounded border border-neutral-300 bg-white p-1.5 text-[11px]"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={editorialForm.secondaryTag}
                  onChange={(e) => setEditorialForm({ ...editorialForm, secondaryTag: e.target.value })}
                  placeholder="Tag"
                  className="rounded border border-neutral-300 bg-white p-1 text-[11px]"
                />
                <input
                  type="text"
                  value={editorialForm.secondaryTitle}
                  onChange={(e) => setEditorialForm({ ...editorialForm, secondaryTitle: e.target.value })}
                  placeholder="Title"
                  className="rounded border border-neutral-300 bg-white p-1 text-[11px]"
                />
              </div>
            </div>

            {/* Tertiary Image */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
              <span className="font-bold text-black text-xs uppercase tracking-wide">Tertiary Lookbook Shot</span>
              <div className="h-32 rounded-lg bg-neutral-200 overflow-hidden">
                <img src={editorialForm.tertiaryImage} alt="Tertiary" onError={handleImageError} className="h-full w-full object-cover" />
              </div>
              <input
                type="url"
                value={editorialForm.tertiaryImage}
                onChange={(e) => setEditorialForm({ ...editorialForm, tertiaryImage: e.target.value })}
                placeholder="Image URL"
                className="w-full rounded border border-neutral-300 bg-white p-1.5 text-[11px]"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={editorialForm.tertiaryTag}
                  onChange={(e) => setEditorialForm({ ...editorialForm, tertiaryTag: e.target.value })}
                  placeholder="Tag"
                  className="rounded border border-neutral-300 bg-white p-1 text-[11px]"
                />
                <input
                  type="text"
                  value={editorialForm.tertiaryTitle}
                  onChange={(e) => setEditorialForm({ ...editorialForm, tertiaryTitle: e.target.value })}
                  placeholder="Title"
                  className="rounded border border-neutral-300 bg-white p-1 text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* CTA Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-100 pt-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Primary Button (Text & Destination)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={editorialForm.ctaPrimaryText}
                  onChange={(e) => setEditorialForm({ ...editorialForm, ctaPrimaryText: e.target.value })}
                  placeholder="Button Text"
                  className="rounded border border-neutral-300 p-2"
                />
                <input
                  type="text"
                  value={editorialForm.ctaPrimaryLink}
                  onChange={(e) => setEditorialForm({ ...editorialForm, ctaPrimaryLink: e.target.value })}
                  placeholder="/products?..."
                  className="rounded border border-neutral-300 p-2"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Secondary Button (Text & Destination)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={editorialForm.ctaSecondaryText}
                  onChange={(e) => setEditorialForm({ ...editorialForm, ctaSecondaryText: e.target.value })}
                  placeholder="Button Text"
                  className="rounded border border-neutral-300 p-2"
                />
                <input
                  type="text"
                  value={editorialForm.ctaSecondaryLink}
                  onChange={(e) => setEditorialForm({ ...editorialForm, ctaSecondaryLink: e.target.value })}
                  placeholder="/products?..."
                  className="rounded border border-neutral-300 p-2"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* 8. Shop By Occasion Manager */}
      {(activeTab === "overview" || activeTab === "occasions") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                Shop By Occasion Cards
              </h2>
              <p className="text-xs text-neutral-500">
                Curated celebration cards (Weddings, Festivals, Everyday Chic, Casual Brunch)
              </p>
            </div>
            <button
              onClick={() => handleOpenOccasionModal()}
              className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Occasion</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {homepageConfig.occasions.map((occ, idx) => (
              <div
                key={occ.id}
                className={`rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xs flex flex-col justify-between ${
                  occ.active !== false ? "opacity-100" : "opacity-50"
                }`}
              >
                <div className="h-40 relative bg-neutral-100">
                  <img src={occ.image} alt={occ.title} onError={handleImageError} className="h-full w-full object-cover" />
                  {occ.badge && (
                    <span className="absolute top-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                      {occ.badge}
                    </span>
                  )}
                </div>

                <div className="p-3.5 space-y-2 text-xs flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-black text-sm">{occ.title}</h3>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{occ.tagline}</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-1 truncate">{occ.href}</p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveOccasion(occ.id, "up")}
                        className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === homepageConfig.occasions.length - 1}
                        onClick={() => handleMoveOccasion(occ.id, "down")}
                        className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleOccasion(occ.id)}
                        className="ml-1 text-[10px] font-semibold text-neutral-600"
                      >
                        {occ.active !== false ? "Active" : "Hidden"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenOccasionModal(occ)}
                        className="font-bold text-black hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOccasion(occ.id)}
                        className="text-neutral-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Shop By Budget Manager */}
      {(activeTab === "overview" || activeTab === "budget") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                Shop By Budget Tiers
              </h2>
              <p className="text-xs text-neutral-500">
                Direct price bracket discovery cards (Under ₹999, ₹1,000 - ₹2,499, Luxury Reserve)
              </p>
            </div>
            <button
              onClick={() => handleOpenBudgetModal()}
              className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Budget Tier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {homepageConfig.budgetTiers.map((tier, idx) => (
              <div
                key={tier.id}
                className={`rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xs flex flex-col justify-between ${
                  tier.active !== false ? "opacity-100" : "opacity-50"
                }`}
              >
                <div className="h-36 relative bg-neutral-100">
                  <img src={tier.image} alt={tier.label} onError={handleImageError} className="h-full w-full object-cover" />
                  <span className="absolute top-2 left-2 rounded bg-black/85 px-2 py-0.5 text-[10px] font-bold text-white">
                    {tier.label}
                  </span>
                </div>

                <div className="p-3.5 space-y-2 text-xs flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-black text-sm">{tier.badge}</h3>
                    <p className="text-[11px] text-neutral-500">{tier.description}</p>
                    <p className="text-[10px] text-amber-700 font-semibold mt-1">{tier.popular}</p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveBudget(tier.id, "up")}
                        className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === homepageConfig.budgetTiers.length - 1}
                        onClick={() => handleMoveBudget(tier.id, "down")}
                        className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBudget(tier.id)}
                        className="ml-1 text-[10px] font-semibold text-neutral-600"
                      >
                        {tier.active !== false ? "Active" : "Hidden"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenBudgetModal(tier)}
                        className="font-bold text-black hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBudget(tier.id)}
                        className="text-neutral-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Quick Benefits & Trust Strip Manager */}
      {(activeTab === "overview" || activeTab === "trust") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-black uppercase tracking-wider">
              Quick Benefits & Trust Signals Strip
            </h2>
            <p className="text-xs text-neutral-500">
              The high-visibility trust strip right beneath categories (Shipping, Returns, Authentic Handloom, Support)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {homepageConfig.quickBenefits.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border border-neutral-200 p-3 space-y-2 bg-neutral-50 ${
                  item.active !== false ? "opacity-100" : "opacity-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black text-xs">Badge</span>
                  <button
                    type="button"
                    onClick={() => handleToggleQuickBenefit(item.id)}
                    className="text-[10px] font-bold text-neutral-500 hover:text-black"
                  >
                    {item.active !== false ? "Enabled" : "Disabled"}
                  </button>
                </div>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleUpdateQuickBenefit(item.id, { title: e.target.value })}
                  placeholder="Title"
                  className="w-full rounded border border-neutral-300 bg-white p-1.5 text-xs font-bold text-black"
                />
                <input
                  type="text"
                  value={item.subtitle}
                  onChange={(e) => handleUpdateQuickBenefit(item.id, { subtitle: e.target.value })}
                  placeholder="Subtitle"
                  className="w-full rounded border border-neutral-300 bg-white p-1 text-[11px] text-neutral-600"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. Why Shop With Us Manager */}
      {(activeTab === "overview" || activeTab === "why-us") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                Why Shop With Us Cards
              </h2>
              <p className="text-xs text-neutral-500">
                Key value propositions and brand guarantees highlighted before the footer
              </p>
            </div>
            <button
              onClick={() => handleOpenWhyUsModal()}
              className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Reason</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {homepageConfig.whyUsItems.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-xl border border-neutral-200 bg-white p-4 flex flex-col justify-between shadow-xs ${
                  item.active !== false ? "opacity-100" : "opacity-50"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-black">
                      <Sparkles size={16} />
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">#{idx + 1}</span>
                  </div>
                  <h3 className="font-bold text-black text-sm">{item.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveWhyUs(item.id, "up")}
                      className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === homepageConfig.whyUsItems.length - 1}
                      onClick={() => handleMoveWhyUs(item.id, "down")}
                      className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleWhyUs(item.id)}
                      className="ml-1 text-[10px] font-semibold text-neutral-600"
                    >
                      {item.active !== false ? "Active" : "Hidden"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenWhyUsModal(item)}
                      className="font-bold text-black hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWhyUs(item.id)}
                      className="text-neutral-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12. YouTube Video Strip Showcase */}
      {(activeTab === "overview" || activeTab === "videos") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <Video className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                  Watch & Discover — YouTube Video Showcase
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Post and manage YouTube lookbook reels, Shorts, URLs, descriptions, and category tags displayed on the storefront
              </p>
            </div>
            <button
              onClick={() => handleOpenVideoModal()}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Post YouTube Video</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {youtubeVideos.map((vid) => (
              <div
                key={vid.id}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm group flex flex-col justify-between hover:border-black/30 transition-colors"
              >
                <div className="h-44 relative bg-neutral-900 overflow-hidden">
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg group-hover:scale-110 transition">
                      <Play className="h-5 w-5 ml-0.5 fill-current" />
                    </div>
                  </div>

                  {/* Tag Badge */}
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-black/75 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white tracking-wide">
                    {vid.tag || "Collection"}
                  </span>

                  {/* Duration Badge */}
                  <span className="absolute bottom-2.5 right-2.5 rounded bg-black/80 font-mono text-[10px] text-white px-2 py-0.5">
                    {vid.duration || "Shorts"}
                  </span>
                </div>

                <div className="p-3.5 text-xs flex flex-col flex-1 justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-bold text-black text-sm leading-snug line-clamp-2">
                      {vid.title}
                    </p>
                    {vid.description ? (
                      <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                        {vid.description}
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-400 italic">No description provided</p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-100">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="font-medium text-neutral-700">{vid.views || "1.2K"} views</span>
                      {vid.url && (
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                        >
                          <span>Open on YouTube</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[11px]">
                      <span className="font-mono text-[10px] text-neutral-400">ID: {vid.videoId}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenVideoModal(vid)}
                          className="text-black font-bold hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteYouTubeVideo(vid.id)}
                          className="text-neutral-400 hover:text-rose-600 transition"
                          title="Delete video"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 13. Section Headers & Final CTA Manager */}
      {(activeTab === "overview" || activeTab === "headers") && (
        <form
          onSubmit={handleSaveHeadersAndCta}
          className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-black" />
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                  Section Headers & Final Call-To-Action
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Customize titles, badges, subtitles, deals banner & the bottom conversion prompt
              </p>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-black hover:bg-neutral-800 px-4 py-2 text-xs font-bold text-white transition shadow-sm"
            >
              Save Headers & CTAs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Trending Now Config */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3">
              <span className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-600" />
                <span>Trending Now Header</span>
              </span>
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Badge</label>
                <input
                  type="text"
                  value={trendingBadge}
                  onChange={(e) => setTrendingBadge(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Title</label>
                <input
                  type="text"
                  value={trendingTitle}
                  onChange={(e) => setTrendingTitle(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white p-2 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Subtitle</label>
                <input
                  type="text"
                  value={trendingSubtitle}
                  onChange={(e) => setTrendingSubtitle(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">View All Link</label>
                <input
                  type="text"
                  value={trendingLink}
                  onChange={(e) => setTrendingLink(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white p-2"
                />
              </div>
            </div>

            {/* Personalized Discovery Config */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3">
              <span className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-black" />
                <span>Popular Picks & Discovery Header</span>
              </span>
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Badge</label>
                <input
                  type="text"
                  value={discoveryBadge}
                  onChange={(e) => setDiscoveryBadge(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Title</label>
                <input
                  type="text"
                  value={discoveryTitle}
                  onChange={(e) => setDiscoveryTitle(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white p-2 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Subtitle</label>
                <input
                  type="text"
                  value={discoverySubtitle}
                  onChange={(e) => setDiscoverySubtitle(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">View All Link</label>
                <input
                  type="text"
                  value={discoveryLink}
                  onChange={(e) => setDiscoveryLink(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white p-2"
                />
              </div>
            </div>

            {/* Deals & Offers Banner Config */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3 md:col-span-2">
              <span className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-black" />
                <span>Offers & Deals Banner Customizer</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Section Header Badge</label>
                  <input
                    type="text"
                    value={dealsBadge}
                    onChange={(e) => setDealsBadge(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Section Title</label>
                  <input
                    type="text"
                    value={dealsTitle}
                    onChange={(e) => setDealsTitle(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Section Subtitle</label>
                  <input
                    type="text"
                    value={dealsSubtitle}
                    onChange={(e) => setDealsSubtitle(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-neutral-200">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Featured Banner Tag</label>
                  <input
                    type="text"
                    value={dealsBannerTag}
                    onChange={(e) => setDealsBannerTag(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Banner Headline</label>
                  <input
                    type="text"
                    value={dealsBannerTitle}
                    onChange={(e) => setDealsBannerTitle(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Coupon Code</label>
                  <input
                    type="text"
                    value={dealsBannerCode}
                    onChange={(e) => setDealsBannerCode(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Banner Destination</label>
                  <input
                    type="text"
                    value={dealsBannerLink}
                    onChange={(e) => setDealsBannerLink(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2"
                  />
                </div>
              </div>
            </div>

            {/* Final CTA Config */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3 md:col-span-2">
              <span className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-black" />
                <span>Final Call-To-Action Banner</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Badge</label>
                  <input
                    type="text"
                    value={ctaBadge}
                    onChange={(e) => setCtaBadge(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Headline</label>
                  <input
                    type="text"
                    value={ctaTitle}
                    onChange={(e) => setCtaTitle(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2 font-bold"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-neutral-700">Description</label>
                  <input
                    type="text"
                    value={ctaDesc}
                    onChange={(e) => setCtaDesc(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Primary Button (Text & Link)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={ctaPrimaryBtnText}
                      onChange={(e) => setCtaPrimaryBtnText(e.target.value)}
                      placeholder="Text"
                      className="rounded border border-neutral-300 bg-white p-2"
                    />
                    <input
                      type="text"
                      value={ctaPrimaryBtnLink}
                      onChange={(e) => setCtaPrimaryBtnLink(e.target.value)}
                      placeholder="/products"
                      className="rounded border border-neutral-300 bg-white p-2"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Secondary Button (Text & Link)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={ctaSecondaryBtnText}
                      onChange={(e) => setCtaSecondaryBtnText(e.target.value)}
                      placeholder="Text"
                      className="rounded border border-neutral-300 bg-white p-2"
                    />
                    <input
                      type="text"
                      value={ctaSecondaryBtnLink}
                      onChange={(e) => setCtaSecondaryBtnLink(e.target.value)}
                      placeholder="/products?sort=popular"
                      className="rounded border border-neutral-300 bg-white p-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* 14. Policy Pages Editor */}
      {(activeTab === "overview" || activeTab === "policies") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                Legal & Policy Pages Editor
              </h2>
              <p className="text-xs text-neutral-500">
                Store policies: Returns & Refunds, Shipping, Privacy Policy, Terms of Service
              </p>
            </div>
            <button
              onClick={() => alert("Policy changes published to storefront successfully!")}
              className="rounded-lg bg-black hover:bg-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-sm"
            >
              Publish Updates
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-neutral-200 pb-2">
            {(
              [
                { id: "refund", label: "Returns & Refunds Policy" },
                { id: "shipping", label: "Shipping Policy" },
                { id: "privacy", label: "Privacy Policy" },
                { id: "terms", label: "Terms of Service" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setPolicyTab(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  policyTab === t.id
                    ? "bg-black text-white shadow-sm"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:text-black"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            rows={5}
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white p-4 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none leading-relaxed"
          />
        </div>
      )}

      {/* Hero Banner Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <h2 className="text-base font-bold text-black">
                {editingBanner ? "Edit Hero Banner" : "Create Hero Banner"}
              </h2>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Banner Headline *</label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Diwali Royal Ethnic Edit 2026"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Subheadline Description</label>
                <textarea
                  rows={2}
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="Brief descriptive marketing copy..."
                  className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Category / Tag</label>
                  <input
                    type="text"
                    value={bannerCategory}
                    onChange={(e) => setBannerCategory(e.target.value)}
                    placeholder="e.g. Heritage Weaves"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Badge Tag</label>
                  <input
                    type="text"
                    value={bannerBadge}
                    onChange={(e) => setBannerBadge(e.target.value)}
                    placeholder="e.g. 58% OFF · Signature"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Special Price (₹)</label>
                  <input
                    type="number"
                    value={bannerPrice}
                    onChange={(e) => setBannerPrice(e.target.value)}
                    placeholder="e.g. 2499"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Original MRP (₹)</label>
                  <input
                    type="number"
                    value={bannerMrp}
                    onChange={(e) => setBannerMrp(e.target.value)}
                    placeholder="e.g. 5999"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Button CTA Text</label>
                  <input
                    type="text"
                    value={bannerBtnText}
                    onChange={(e) => setBannerBtnText(e.target.value)}
                    placeholder="Shop Now"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Destination Link</label>
                  <input
                    type="text"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="/products?category=clothing"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Banner Background Image URL</label>
                <input
                  type="url"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
                >
                  Save Hero Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Group Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <h2 className="text-base font-bold text-black flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>{editingCategory ? "Edit Category Card Group" : "Create Category Card Group"}</span>
              </h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Group Header Title *</label>
                <input
                  type="text"
                  required
                  value={catTitle}
                  onChange={(e) => setCatTitle(e.target.value)}
                  placeholder="e.g. Royal Ethnic & Festive"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Main Destination Link</label>
                <input
                  type="text"
                  value={catHref}
                  onChange={(e) => setCatHref(e.target.value)}
                  placeholder="/products?category=clothing"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              {/* Subitem 1 */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-2">
                <span className="font-bold text-black text-xs">First Subcategory Item</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500 font-semibold">Name</label>
                    <input
                      type="text"
                      required
                      value={catSub1Name}
                      onChange={(e) => setCatSub1Name(e.target.value)}
                      placeholder="e.g. Kurta Sets"
                      className="w-full rounded border border-neutral-300 bg-white p-1.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500 font-semibold">Link</label>
                    <input
                      type="text"
                      required
                      value={catSub1Href}
                      onChange={(e) => setCatSub1Href(e.target.value)}
                      placeholder="/products?category=clothing..."
                      className="w-full rounded border border-neutral-300 bg-white p-1.5"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-500 font-semibold">Image URL</label>
                  <input
                    type="url"
                    required
                    value={catSub1Image}
                    onChange={(e) => setCatSub1Image(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded border border-neutral-300 bg-white p-1.5"
                  />
                </div>
              </div>

              {/* Subitem 2 */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-2">
                <span className="font-bold text-black text-xs">Second Subcategory Item</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500 font-semibold">Name</label>
                    <input
                      type="text"
                      required
                      value={catSub2Name}
                      onChange={(e) => setCatSub2Name(e.target.value)}
                      placeholder="e.g. Anarkalis & Sarees"
                      className="w-full rounded border border-neutral-300 bg-white p-1.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500 font-semibold">Link</label>
                    <input
                      type="text"
                      required
                      value={catSub2Href}
                      onChange={(e) => setCatSub2Href(e.target.value)}
                      placeholder="/products?category=clothing..."
                      className="w-full rounded border border-neutral-300 bg-white p-1.5"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-500 font-semibold">Image URL</label>
                  <input
                    type="url"
                    required
                    value={catSub2Image}
                    onChange={(e) => setCatSub2Image(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded border border-neutral-300 bg-white p-1.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
                >
                  Save Category Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spotlight Modal */}
      {isSpotlightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <h2 className="text-base font-bold text-black flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>{editingSpotlight ? "Edit Spotlight Product" : "Add Spotlight Product"}</span>
              </h2>
              <button
                onClick={() => setIsSpotlightModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpotlight} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Brand Tag</label>
                <input
                  type="text"
                  value={spotBrand}
                  onChange={(e) => setSpotBrand(e.target.value)}
                  placeholder="e.g. MIRACLE"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Product Title *</label>
                <input
                  type="text"
                  required
                  value={spotTitle}
                  onChange={(e) => setSpotTitle(e.target.value)}
                  placeholder="e.g. Banarasi Zari Checkered Saree"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Subtitle / Details</label>
                <input
                  type="text"
                  value={spotSubtitle}
                  onChange={(e) => setSpotSubtitle(e.target.value)}
                  placeholder="D.No 1584 · With Matching Blouse Piece"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={spotPrice}
                  onChange={(e) => setSpotPrice(e.target.value)}
                  placeholder="e.g. 1899"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Product Image URL *</label>
                <input
                  type="url"
                  required
                  value={spotImage}
                  onChange={(e) => setSpotImage(e.target.value)}
                  placeholder="https://... or /images/products/..."
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Destination Link *</label>
                <input
                  type="text"
                  required
                  value={spotHref}
                  onChange={(e) => setSpotHref(e.target.value)}
                  placeholder="/product/... or /products"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSpotlightModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
                >
                  Save Spotlight Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Occasion Modal */}
      {isOccasionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <h2 className="text-base font-bold text-black flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span>{editingOccasion ? "Edit Occasion" : "Add Occasion Card"}</span>
              </h2>
              <button
                onClick={() => setIsOccasionModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOccasion} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Occasion Title *</label>
                <input
                  type="text"
                  required
                  value={occTitle}
                  onChange={(e) => setOccTitle(e.target.value)}
                  placeholder="e.g. Weddings & Receptions"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Tagline Description</label>
                <input
                  type="text"
                  value={occTagline}
                  onChange={(e) => setOccTagline(e.target.value)}
                  placeholder="Grand silks, zari lehengas & formal suits"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Badge</label>
                <input
                  type="text"
                  value={occBadge}
                  onChange={(e) => setOccBadge(e.target.value)}
                  placeholder="e.g. Royal Grace"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Cover Image URL *</label>
                <input
                  type="url"
                  required
                  value={occImage}
                  onChange={(e) => setOccImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Destination Link *</label>
                <input
                  type="text"
                  required
                  value={occHref}
                  onChange={(e) => setOccHref(e.target.value)}
                  placeholder="/products?occasion=wedding"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOccasionModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
                >
                  Save Occasion Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Tier Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <h2 className="text-base font-bold text-black flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>{editingBudget ? "Edit Budget Tier" : "Add Budget Tier"}</span>
              </h2>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Price Bracket Label *</label>
                <input
                  type="text"
                  required
                  value={budLabel}
                  onChange={(e) => setBudLabel(e.target.value)}
                  placeholder="e.g. Under ₹999"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Badge Title</label>
                <input
                  type="text"
                  value={budBadge}
                  onChange={(e) => setBudBadge(e.target.value)}
                  placeholder="e.g. Budget Friendly"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Description</label>
                <input
                  type="text"
                  value={budDesc}
                  onChange={(e) => setBudDesc(e.target.value)}
                  placeholder="Everyday tees, casual kurtis & footwear steals"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Popular Highlight Tag</label>
                <input
                  type="text"
                  value={budPopular}
                  onChange={(e) => setBudPopular(e.target.value)}
                  placeholder="e.g. Popular for Daily Wear"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Image URL *</label>
                <input
                  type="url"
                  required
                  value={budImage}
                  onChange={(e) => setBudImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Filter Link *</label>
                <input
                  type="text"
                  required
                  value={budHref}
                  onChange={(e) => setBudHref(e.target.value)}
                  placeholder="/products?maxPrice=999"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
                >
                  Save Budget Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Why Us Modal */}
      {isWhyUsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <h2 className="text-base font-bold text-black flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>{editingWhyUs ? "Edit Reason" : "Add Brand Guarantee"}</span>
              </h2>
              <button
                onClick={() => setIsWhyUsModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWhyUs} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Reason Title *</label>
                <input
                  type="text"
                  required
                  value={whyTitle}
                  onChange={(e) => setWhyTitle(e.target.value)}
                  placeholder="e.g. Master Artisan Weaves"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-black font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={whyDesc}
                  onChange={(e) => setWhyDesc(e.target.value)}
                  placeholder="Describe your store's quality promise or assurance..."
                  className="w-full rounded-lg border border-neutral-300 p-2.5 text-black focus:border-black focus:outline-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Icon Type</label>
                <select
                  value={whyIcon}
                  onChange={(e) => setWhyIcon(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-black"
                >
                  <option value="Sparkles">Sparkles (Quality/Elegance)</option>
                  <option value="ShieldCheck">ShieldCheck (Security/Authenticity)</option>
                  <option value="Truck">Truck (Fast Delivery)</option>
                  <option value="RefreshCw">RefreshCw (Easy Returns)</option>
                  <option value="Star">Star (Top Rated)</option>
                  <option value="Award">Award (Certified Excellence)</option>
                  <option value="CreditCard">CreditCard (Safe Payments)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsWhyUsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
                >
                  Save Reason
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YouTube Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-black flex items-center gap-2">
                  <Video className="h-4 w-4 text-rose-600" />
                  <span>{editingVideo ? "Edit Video Showcase Card" : "Post YouTube Showcase Video"}</span>
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Publish lookbook reels with direct YouTube URLs, collection tags & descriptions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* YouTube Video URL Input with Auto-extract */}
              <div className="space-y-1">
                <label className="font-semibold text-neutral-800 flex items-center justify-between">
                  <span>YouTube Video or Shorts URL *</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Auto-detects video ID & thumbnail</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="e.g. https://youtube.com/shorts/KFCkU1PGMhI or https://youtu.be/..."
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-9 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                  />
                  {videoId && (
                    <div className="absolute right-2.5 top-2.5 text-emerald-600" title="Valid YouTube ID detected">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">
                  Accepts YouTube Shorts links, full watch URLs, or share links.
                </p>
              </div>

              {/* Video Title */}
              <div className="space-y-1">
                <label className="font-semibold text-neutral-800">Video Title *</label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. #బతుకమ్మ స్పెషల్ KIDS LEHENGA (Size 30-40)"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                />
              </div>

              {/* Category / Collection Tag with suggestions */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800">Collection / Category Tag</label>
                <input
                  type="text"
                  value={videoTag}
                  onChange={(e) => setVideoTag(e.target.value)}
                  placeholder="e.g. Kids Lehenga, Sarees & Sets, Pure Pattu"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {["Kids Lehenga", "Sarees & Sets", "Pure Pattu", "Anarkali Suits", "Bridal Wear", "Festive Edit"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setVideoTag(tag)}
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition ${
                        videoTag === tag
                          ? "border-black bg-black text-white"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:text-black"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Textarea */}
              <div className="space-y-1">
                <label className="font-semibold text-neutral-800">Video Description</label>
                <textarea
                  rows={3}
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Describe the fabric, design details, sizes available, or styling inspiration shown in the video..."
                  className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-black placeholder-neutral-400 focus:border-black focus:outline-none leading-relaxed"
                />
              </div>

              {/* Grid: Video ID, Duration, Views */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Video ID</label>
                  <input
                    type="text"
                    value={videoId}
                    onChange={(e) => {
                      setVideoId(e.target.value);
                      if (e.target.value.length === 11) {
                        setVideoThumbnail(`https://i.ytimg.com/vi/${e.target.value}/hqdefault.jpg`);
                      }
                    }}
                    placeholder="e.g. KFCkU1PGMhI"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-black font-mono text-[11px] focus:border-black focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Duration</label>
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="Shorts"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-black text-[11px] focus:border-black focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700">Views Badge</label>
                  <input
                    type="text"
                    value={videoViews}
                    onChange={(e) => setVideoViews(e.target.value)}
                    placeholder="1.8K"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-black text-[11px] focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Thumbnail Image URL */}
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Thumbnail Image URL</label>
                <input
                  type="url"
                  value={videoThumbnail}
                  onChange={(e) => setVideoThumbnail(e.target.value)}
                  placeholder="https://i.ytimg.com/vi/..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none font-mono text-[11px]"
                />
              </div>

              {/* Live Preview Card */}
              {videoThumbnail && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Live Storefront Card Preview
                  </span>
                  <div className="flex gap-3 items-center">
                    <div className="relative h-20 w-14 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                      <img src={videoThumbnail} alt="Preview" onError={handleImageError} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[9px] font-bold text-neutral-800">
                        {videoTag || "Collection"}
                      </span>
                      <p className="font-bold text-black text-xs truncate">
                        {videoTitle || "Untitled Video"}
                      </p>
                      <p className="text-[10px] text-neutral-500 line-clamp-1">
                        {videoDescription || "No description provided"}
                      </p>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {videoDuration || "Shorts"} • {videoViews || "1.2K"} views
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
                >
                  {editingVideo ? "Update Video" : "Publish Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
