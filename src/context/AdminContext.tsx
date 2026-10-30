"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type {
  AdminBanner,
  AdminCategory,
  AdminCoupon,
  AdminCustomer,
  AdminOrder,
  AdminOrderStatus,
  AdminPayment,
  AdminPaymentVerification,
  AdminProduct,
  AdminSettings,
  AnnouncementBarItem,
  AuditLogEntry,
  CategoryFilter,
  FestiveTheme,
  StaffMember,
  StockChangeType,
  StockLedgerEntry,
  YouTubeVideoItem,
  AdminSubcategory,
} from "@/lib/adminTypes";
import { useStore } from "@/context/StoreContext";
import { SEED_BANNERS, SEED_YOUTUBE_VIDEOS } from "@/data/adminSeed";
import type { AdminHomepageConfig } from "@/lib/homepageTypes";
import DEFAULT_HOMEPAGE_CONFIG from "@/data/adminHomepage.json";
// Admin data access goes through server actions only. The service-role client
// is server-only and must never be imported into this Client Component.
import {
  adminGetOrders,
  adminGetPayments,
  adminGetPaymentVerifications,
  adminGetCustomers,
  adminGetCoupons,
  adminGetBanners,
  adminGetAnnouncements,
  adminGetYoutubeVideos,
  adminGetSettings,
  adminGetStaff,
  adminGetAuditLogs,
  adminGetStockLedger,
  adminGetFilters,
} from "@/app/actions/admin/reads";
import {
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
} from "@/app/actions/admin/coupons";
import { adminAddStaff, adminDeleteStaff } from "@/app/actions/admin/staff";
import { adminUpdateSettings } from "@/app/actions/admin/settings";
import {
  adminSaveBanner,
  adminDeleteBanner,
  adminSaveAnnouncement,
  adminDeleteAnnouncement,
  adminSaveYoutubeVideo,
  adminDeleteYoutubeVideo,
} from "@/app/actions/admin/content";
import { adminSaveFilter, adminDeleteFilter } from "@/app/actions/admin/filters";
import { adminCreateAuditLog } from "@/app/actions/admin/audit";
import {
  adminSaveCategory,
  adminDeleteCategory,
  adminSaveSubcategory,
  adminDeleteSubcategory,
} from "@/app/actions/admin/categories";
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminToggleProductStatus,
} from "@/app/actions/admin/products";
import {
  adminAdjustStock,
  adminBulkUpdateStock,
} from "@/app/actions/admin/inventory";
import {
  adminConfirmOrder,
  adminUpdateOrderStatus,
  adminVerifyPayment,
  adminRejectPayment,
  adminApprovePaymentVerification,
  adminRejectPaymentVerification,
} from "@/app/actions/admin/orders";
import { countLowStock } from "@/lib/inventory";
import { isAwaitingConfirmation } from "@/lib/orderStatus";
import { getCategories as getCategoriesSupabase } from "@/lib/supabase/categories";
import { buildSubcategoryOptions } from "@/lib/catalogTaxonomy";
import type { Product } from "@/lib/types";

/**
 * Lazy-load map: which datasets each admin route actually needs.
 *
 * Previously the provider fired ~13 server actions on mount regardless of the
 * page. Now only the current route's datasets (plus the always-loaded `staff`
 * and `categories`) are fetched, each at most once per session.
 */
const ROUTE_DATASETS: Record<string, string[]> = {
  "/admin": ["orders", "payments", "paymentVerifications", "customers", "settings"],
  "/admin/audit": ["auditLogs"],
  "/admin/categories": ["filters"],
  "/admin/content": ["banners", "announcements", "youtubeVideos"],
  "/admin/coupons": ["coupons"],
  "/admin/customers": ["customers", "orders"],
  "/admin/inventory": ["stockLedger"],
  "/admin/orders": ["orders"],
  "/admin/payments": ["payments", "paymentVerifications", "settings"],
  "/admin/products": [],
  "/admin/reports": ["orders", "payments"],
  "/admin/settings": ["settings"],
  "/admin/staff": [],
};

export interface AdminToast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AdminContextValue {
  // State
  products: AdminProduct[];
  categories: AdminCategory[];
  filters: CategoryFilter[];
  orders: AdminOrder[];
  payments: AdminPayment[];
  /** Checkout UTR submissions awaiting an accept/reject decision (pre-order). */
  paymentVerifications: AdminPaymentVerification[];
  stockLedger: StockLedgerEntry[];
  customers: AdminCustomer[];
  coupons: AdminCoupon[];
  banners: AdminBanner[];
  announcements: AnnouncementBarItem[];
  youtubeVideos: YouTubeVideoItem[];
  festiveThemes: FestiveTheme[];
  settings: AdminSettings;
  staff: StaffMember[];
  currentStaff: StaffMember;
  auditLogs: AuditLogEntry[];
  toasts: AdminToast[];
  loading: boolean;

  // Quick metrics
  pendingPaymentCount: number;
  newOrderCount: number;
  lowStockCount: number;
  totalRevenue: number;
  todaySales: number;

  // Actions
  adminToast: (message: string, type?: AdminToast["type"]) => void;
  setCurrentStaff: (staff: StaffMember) => void;
  logAudit: (
    module: AuditLogEntry["module"],
    action: AuditLogEntry["action"],
    description: string
  ) => void;

  // Orders & Payments
  confirmOrder: (orderId: string) => Promise<void>;
  verifyPayment: (orderId: string, paymentId: string) => Promise<boolean>;
  rejectPayment: (orderId: string, paymentId: string, reason: string) => Promise<boolean>;
  /** Accept a checkout UTR submission — this is what creates the order (once). */
  approvePaymentVerification: (verificationId: string) => Promise<boolean>;
  /** Reject a checkout UTR submission — creates no order; restores the cart. */
  rejectPaymentVerification: (verificationId: string, reason: string) => Promise<boolean>;
  updateOrderStatus: (
    orderId: string,
    newStatus: AdminOrderStatus,
    courierName?: string,
    trackingNumber?: string,
    note?: string
  ) => Promise<void>;
  addInternalOrderNote: (orderId: string, note: string) => void;

  // Products
  saveProduct: (product: Partial<AdminProduct>) => Promise<AdminProduct>;
  deleteProduct: (productId: string) => void;
  toggleProductStatus: (productId: string) => void;

  // Inventory & Stock
  adjustStock: (
    productId: string,
    variantSku: string,
    change: number,
    type: StockChangeType,
    reason: string
  ) => Promise<void>;
  bulkUpdateStock: (rows: { sku: string; stock: number }[]) => Promise<{ updated: number; errors: string[] }>;

  // Categories & Filters
  subcategories: AdminSubcategory[];
  saveCategory: (category: Partial<AdminCategory>) => Promise<AdminCategory>;
  deleteCategory: (id: string) => Promise<void>;
  saveSubcategory: (sub: Partial<AdminSubcategory>) => Promise<AdminSubcategory>;
  deleteSubcategory: (categoryId: string, name: string) => Promise<void>;
  saveFilter: (filter: Partial<CategoryFilter>) => Promise<CategoryFilter>;
  deleteFilter: (id: string) => Promise<void>;

  // Customers
  toggleCustomerBlock: (id: string, reason?: string) => void;

  // Coupons
  saveCoupon: (coupon: Partial<AdminCoupon>) => Promise<AdminCoupon>;
  deleteCoupon: (id: string) => Promise<void>;

  // Content & Festive theme
  switchFestiveTheme: (themeId: FestiveTheme["id"]) => void;
  saveBanner: (banner: Partial<AdminBanner>) => Promise<AdminBanner>;
  deleteBanner: (id: string) => Promise<void>;
  saveAnnouncement: (text: string) => Promise<void>;
  toggleAnnouncement: (id: string) => void;
  deleteAnnouncement: (id: string) => Promise<void>;
  saveYouTubeVideo: (video: Partial<YouTubeVideoItem>) => Promise<YouTubeVideoItem>;
  deleteYouTubeVideo: (id: string) => Promise<void>;

  // Homepage Section & Content Management
  homepageConfig: AdminHomepageConfig;
  saveHomepageConfig: (newConfig: AdminHomepageConfig) => Promise<boolean>;
  updateSectionVisibility: (sectionId: string, enabled: boolean) => Promise<boolean>;
  moveSectionOrder: (sectionId: string, direction: "up" | "down") => Promise<boolean>;

  // Settings
  saveSettings: (patch: Partial<AdminSettings>) => Promise<void>;

  // Staff
  addStaff: (member: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;

  // Utilities
  exportToCsv: (data: Record<string, unknown>[], filename: string) => void;
  resetToSampleData: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const {
    products: storeProducts,
    refreshCategories,
    upsertProduct,
    removeProduct,
    refreshProduct,
  } = useStore();

  const pathname = usePathname();
  // Datasets already fetched this session (or in-flight), so StrictMode's
  // double-invoke and route revisits never refetch the same dataset.
  const loadedRef = useRef<Set<string>>(new Set());

  const products = storeProducts as unknown as AdminProduct[];
  
  // Supabase-backed state
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  // Subcategory nodes are DERIVED from the categories table + shared taxonomy.
  // There is no `subcategories` table and no query against one.
  const subcategories = useMemo<AdminSubcategory[]>(
    () =>
      buildSubcategoryOptions(categories).map((option) => ({
        id: option.id,
        categoryId: option.categoryId,
        gender: option.gender as AdminSubcategory["gender"],
        name: option.name,
        slug: option.slug,
        sortOrder: option.sortOrder,
        active: true,
      })),
    [categories]
  );
  const [filters, setFilters] = useState<CategoryFilter[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentVerifications, setPaymentVerifications] = useState<AdminPaymentVerification[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementBarItem[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideoItem[]>([]);
  const [homepageConfig, setHomepageConfig] = useState<AdminHomepageConfig>(DEFAULT_HOMEPAGE_CONFIG as unknown as AdminHomepageConfig);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [festiveThemes, setFestiveThemes] = useState<FestiveTheme[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  // Single timer for the visible toast. Cleared before every new schedule so a
  // stale timeout can never re-hide or leave a later notification behind.
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load ONLY the datasets the current admin route needs (plus the always-needed
  // staff + categories). Each dataset is fetched at most once per session, so
  // opening /admin/products no longer pulls payments, audit logs, customers,
  // coupons, ... — those load lazily when their page is first visited.
  useEffect(() => {
    const route = pathname.replace(/\/+$/, "") || "/admin";
    const needed = new Set<string>([
      "staff",
      "categories",
      ...(ROUTE_DATASETS[route] ?? []),
    ]);
    const toLoad = [...needed].filter((k) => !loadedRef.current.has(k));
    if (toLoad.length === 0) {
      setLoading(false);
      return;
    }
    // Mark in-flight synchronously so StrictMode's double-invoke cannot fire the
    // same requests twice. These datasets are global (not route-scoped), so the
    // results are applied even if the caller unmounts mid-load — cancelling the
    // setters here would drop the data permanently (the keys are already marked,
    // so a remount would refetch nothing).
    toLoad.forEach((k) => loadedRef.current.add(k));

    const loaders: Record<string, () => Promise<void>> = {
      orders: async () => {
        const res = await adminGetOrders();
        setOrders(res.success ? res.data : []);
      },
      payments: async () => {
        const res = await adminGetPayments();
        setPayments(res.success ? res.data : []);
      },
      paymentVerifications: async () => {
        const res = await adminGetPaymentVerifications();
        setPaymentVerifications(res.success ? res.data : []);
      },
      customers: async () => {
        const res = await adminGetCustomers();
        setCustomers(res.success ? res.data : []);
      },
      coupons: async () => {
        const res = await adminGetCoupons();
        setCoupons(res.success ? res.data : []);
      },
      banners: async () => {
        // Try fetching server-persisted admin banners from /api/banners
        try {
          const res = await fetch("/api/banners");
          if (res.ok) {
            const serverData = await res.json();
            if (Array.isArray(serverData) && serverData.length > 0) {
              setBanners(serverData);
              try {
                localStorage.setItem("miracle_admin_banners", JSON.stringify(serverData));
              } catch {}
              return;
            }
          }
        } catch {}

        // Fallback to client localStorage
        let localData: AdminBanner[] | null = null;
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem("miracle_admin_banners") : null;
          if (raw) localData = JSON.parse(raw);
        } catch {}

        if (localData && Array.isArray(localData) && localData.length > 0) {
          setBanners(localData);
          return;
        }

        try {
          const res = await adminGetBanners();
          if (res.success && res.data && res.data.length > 0) {
            setBanners(res.data);
            try {
              localStorage.setItem("miracle_admin_banners", JSON.stringify(res.data));
            } catch {}
            return;
          }
        } catch {}

        setBanners(SEED_BANNERS);
        try {
          localStorage.setItem("miracle_admin_banners", JSON.stringify(SEED_BANNERS));
        } catch {}
      },
      announcements: async () => {
        const res = await adminGetAnnouncements();
        setAnnouncements(res.success ? res.data : []);
      },
      youtubeVideos: async () => {
        // Try fetching server-persisted admin videos from /api/videos
        try {
          const res = await fetch("/api/videos");
          if (res.ok) {
            const serverData = await res.json();
            if (Array.isArray(serverData)) {
              setYoutubeVideos(serverData);
              try {
                localStorage.setItem("miracle_admin_videos", JSON.stringify(serverData));
              } catch {}
              return;
            }
          }
        } catch {}

        // Fallback to client localStorage
        let localData: YouTubeVideoItem[] | null = null;
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem("miracle_admin_videos") : null;
          if (raw) localData = JSON.parse(raw);
        } catch {}

        if (localData && Array.isArray(localData)) {
          setYoutubeVideos(localData);
          return;
        }

        setYoutubeVideos(SEED_YOUTUBE_VIDEOS);
        try {
          localStorage.setItem("miracle_admin_videos", JSON.stringify(SEED_YOUTUBE_VIDEOS));
        } catch {}
      },
      settings: async () => {
        const res = await adminGetSettings();
        setSettings(res.success ? res.data : null);
      },
      staff: async () => {
        const res = await adminGetStaff();
        setStaff(res.success ? res.data : []);
        if (res.success && res.data.length > 0) setCurrentStaff(res.data[0]);
      },
      auditLogs: async () => {
        const res = await adminGetAuditLogs();
        setAuditLogs(res.success ? res.data : []);
      },
      stockLedger: async () => {
        const res = await adminGetStockLedger();
        setStockLedger(res.success ? res.data : []);
      },
      filters: async () => {
        const res = await adminGetFilters();
        setFilters(res.success ? res.data : []);
      },
      categories: async () => {
        const categoriesData = await getCategoriesSupabase();
        setCategories(categoriesData as AdminCategory[]);
      },
    };

    (async () => {
      setLoading(true);
      try {
        await Promise.all(toLoad.map((k) => loaders[k]()));
      } catch (error) {
        console.error("Error loading admin data:", error);
        // Let a failed dataset retry on the next visit.
        toLoad.forEach((k) => loadedRef.current.delete(k));
      } finally {
        setLoading(false);
      }
    })();
  }, [pathname]);

  /**
   * Show ONE temporary admin notification. A new toast REPLACES the current
   * one (never stacks), and auto-dismisses after 4 seconds — approving many
   * UTR submissions in a row therefore always leaves exactly one short-lived
   * message and then a clean screen.
   */
  const adminToast = useCallback((message: string, type: AdminToast["type"] = "success") => {
    const id = "t_" + Math.random().toString(36).slice(2, 9);
    setToasts([{ id, message, type }]);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  // Never leak a pending dismissal timer when the admin shell unmounts.
  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  const logAudit = useCallback(
    (
      module: AuditLogEntry["module"],
      action: AuditLogEntry["action"],
      description: string
    ) => {
      // Never silently no-op when the client has no staff roster loaded: the
      // acting admin is always resolvable server-side, so fall back to a safe
      // label rather than dropping the action (this caused admin actions to
      // appear "dead" when the `staff` table was empty).
      const staffName = currentStaff?.name || "Admin";
      const staffRole = currentStaff?.role || "Super Admin";
      // Persisted server-side (service-role, admin-verified). Fire-and-forget so
      // an audit write never blocks the action it describes.
      void adminCreateAuditLog({
        staffName,
        role: staffRole,
        module,
        action,
        description,
        ipAddress: "unknown",
      }).catch(() => {});
      const entry: AuditLogEntry = {
        id: "aud_" + Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toISOString(),
        staffName,
        role: staffRole,
        module,
        action,
        description,
        ipAddress: "unknown",
      };
      setAuditLogs((prev) => [entry, ...prev].slice(0, 200));
    },
    [currentStaff]
  );

  /**
   * Apply a single authoritative order: replace it in place, or insert it when
   * it is new (approving a payment verification CREATES an order, so the admin
   * list must gain that row without a refetch).
   */
  const replaceOrder = useCallback((updated: AdminOrder | null) => {
    if (!updated) return;
    setOrders((prev) =>
      prev.some((o) => o.id === updated.id)
        ? prev.map((o) => (o.id === updated.id ? updated : o))
        : [updated, ...prev]
    );
  }, []);

  // ---------------------------------------------------------------------------
  // AUTO-SYNC of the datasets behind the payment-verification queue
  // ---------------------------------------------------------------------------
  // Supabase Realtime is NOT configured in this project (no `channel()`
  // subscriptions anywhere and no `supabase_realtime` publication on these
  // tables), so instead of adding an infrastructure dependency we poll the
  // EXISTING admin read actions: they run server-side behind requireAdmin()
  // with the service-role client, so no key and no extra privilege is exposed.
  //
  // Rules that keep this safe:
  //   * only the datasets the current admin route already needs are refreshed,
  //   * ticks never overlap (a slow fetch skips the next tick instead of piling up),
  //   * polling pauses while the tab is hidden and refreshes immediately when it
  //     comes back, and everything is cleared on unmount,
  //   * a failed tick never blanks the UI — the next tick simply retries,
  //   * approve/reject additionally re-fetch from the server right away, so the
  //     UI never depends on a tick arriving (DB state stays the source of truth).
  // ---------------------------------------------------------------------------
  const syncInFlightRef = useRef(false);
  // Cross-tab wake-up: an action in one admin tab refreshes its siblings now
  // rather than on their next tick.
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  const syncAdminData = useCallback(async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      const route = pathname.replace(/\/+$/, "") || "/admin";
      const needed = new Set(ROUTE_DATASETS[route] ?? []);
      const jobs: Promise<void>[] = [];

      if (needed.has("paymentVerifications")) {
        jobs.push(
          adminGetPaymentVerifications().then((res) => {
            if (res.success) setPaymentVerifications(res.data);
          })
        );
      }
      if (needed.has("payments")) {
        jobs.push(
          adminGetPayments().then((res) => {
            if (res.success) setPayments(res.data);
          })
        );
      }
      if (needed.has("orders")) {
        jobs.push(
          adminGetOrders().then((res) => {
            if (res.success) setOrders(res.data);
          })
        );
      }

      if (jobs.length > 0) await Promise.all(jobs);
    } catch (error) {
      console.error("Admin auto-sync failed:", error);
    } finally {
      syncInFlightRef.current = false;
    }
  }, [pathname]);

  const notifyAdminTabs = useCallback(() => {
    try {
      syncChannelRef.current?.postMessage("admin-data-changed");
    } catch {
      // Channel already closed — this tab is still covered by its own poll.
    }
  }, []);

  useEffect(() => {
    const INTERVAL_MS = 20_000;

    const tick = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        void syncAdminData();
      }
    };

    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("miracle-admin-sync")
        : null;
    if (channel) {
      channel.onmessage = tick;
      syncChannelRef.current = channel;
    }

    const timer = setInterval(tick, INTERVAL_MS);
    // Returning to a hidden tab shows fresh data immediately instead of stale rows.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      channel?.close();
      syncChannelRef.current = null;
    };
  }, [syncAdminData]);

  // Orders & Payments
  /**
   * ACCEPT / CONFIRM an order. This is the ONLY path that deducts stock.
   * The atomic RPC guarantees a single deduction (idempotent), and the server
   * returns the affected products + the refreshed order so we update just
   * those rows rather than refetching the catalog.
   */
  const confirmOrder = useCallback(
    async (orderId: string) => {
      const result = await adminConfirmOrder(orderId);
      if (!result.success) {
        adminToast(result.error || "Failed to confirm order", "error");
        return;
      }
      const { order, products: affected, ledgerEntryCount } = result.data;
      replaceOrder(order);
      affected.forEach((p) => upsertProduct(p));
      // Only refresh the ledger when its page data is already loaded, so we
      // never introduce a new request on unrelated routes.
      if (ledgerEntryCount > 0 && loadedRef.current.has("stockLedger")) {
        const ledgerRes = await adminGetStockLedger();
        if (ledgerRes.success) setStockLedger(ledgerRes.data);
      }
      logAudit("Orders", "Update", `Confirmed order ${orderId}; stock deducted`);
      adminToast(
        ledgerEntryCount > 0
          ? `Order ${orderId} confirmed; stock updated`
          : `Order ${orderId} was already confirmed`
      );
    },
    [replaceOrder, upsertProduct, logAudit, adminToast]
  );

  // Calculations
  // Needs admin attention: pre-order checkout submissions awaiting an
  // accept/reject decision, plus legacy "awaiting the customer's UTR" and
  // "submitted, awaiting verification" payments on existing orders.
  const pendingPaymentCount = useMemo(
    () =>
      payments.filter(
        (p) => p.status === "pending_verification" || p.status === "awaiting_reference"
      ).length +
      paymentVerifications.filter((v) => v.status === "pending").length,
    [payments, paymentVerifications]
  );

  // Orders awaiting admin acceptance — the "new order" signal. Drops to zero
  // the moment an order is confirmed.
  const newOrderCount = useMemo(
    () => orders.filter((o) => isAwaitingConfirmation(o.orderStatus)).length,
    [orders]
  );

  // Single shared low-stock rule (src/lib/inventory) so the dashboard and the
  // Inventory page can never disagree.
  const lowStockCount = useMemo(() => countLowStock(products), [products]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  const todaySales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return orders
      .filter((o) => o.placedAt.startsWith(today))
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  // Orders & Payments
  const verifyPayment = useCallback(
    async (orderId: string, paymentId: string) => {
      const result = await adminVerifyPayment(paymentId);
      if (result.success) {
        setPayments((prev) => prev.map((p) =>
          p.id === paymentId ? { ...p, status: "verified" as const, verifiedBy: currentStaff?.name } : p
        ));
        // A payment decision only changes payment_status — never the order's
        // fulfillment status. Apply the authoritative order when returned.
        if (result.data) replaceOrder(result.data);
        else setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "Verified" as const } : o)));
        logAudit("Payments", "Verify", `Verified payment ${paymentId} for order ${orderId}`);
        adminToast("Payment verified", "success");
      } else {
        adminToast(result.error || "Failed to verify payment", "error");
      }
      return result.success;
    },
    [currentStaff, logAudit, adminToast, replaceOrder]
  );

  const rejectPayment = useCallback(
    async (orderId: string, paymentId: string, reason: string) => {
      const result = await adminRejectPayment(paymentId, reason);
      if (result.success) {
        setPayments((prev) => prev.map((p) =>
          p.id === paymentId ? { ...p, status: "rejected" as const, rejectionReason: reason } : p
        ));
        if (result.data) replaceOrder(result.data);
        else setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "Failed" as const } : o)));
        logAudit("Payments", "Reject", `Rejected payment ${paymentId} for order ${orderId}: ${reason}`);
        adminToast("Payment rejected", "error");
      } else {
        adminToast(result.error || "Failed to reject payment", "error");
      }
      return result.success;
    },
    [logAudit, adminToast, replaceOrder]
  );

  /**
   * ACCEPT a checkout UTR submission. The atomic server RPC re-prices the cart
   * against live data and creates the order EXACTLY ONCE (Placed + payment
   * Verified); a repeat click returns the same order instead of a second one.
   */
  const approvePaymentVerification = useCallback(
    async (verificationId: string) => {
      const result = await adminApprovePaymentVerification(verificationId);
      if (!result.success) {
        adminToast(result.error || "Failed to approve payment", "error");
        return false;
      }
      const { order, verification, alreadyApproved } = result.data;
      if (verification) {
        setPaymentVerifications((prev) =>
          prev.map((v) => (v.id === verificationId ? verification : v))
        );
      }
      if (order) replaceOrder(order);
      // Server-confirmed refresh (not a local guess, and not a wait for the next
      // poll tick): re-read the verification list, payments and orders, then
      // wake any other admin tab so its table, badge and counts match too.
      await syncAdminData();
      notifyAdminTabs();
      adminToast(
        alreadyApproved
          ? "Already approved — order unchanged"
          : "Payment verified and order placed successfully.",
        "success"
      );
      return true;
    },
    [adminToast, replaceOrder, syncAdminData, notifyAdminTabs]
  );

  /**
   * REJECT a checkout UTR submission: no order is placed (the database
   * restores the customer's cart so they can retry).
   */
  const rejectPaymentVerification = useCallback(
    async (verificationId: string, reason: string) => {
      const result = await adminRejectPaymentVerification(verificationId, reason);
      if (!result.success) {
        adminToast(result.error || "Failed to reject payment", "error");
        return false;
      }
      const updated = result.data;
      if (updated) {
        setPaymentVerifications((prev) =>
          prev.map((v) => (v.id === verificationId ? updated : v))
        );
      }
      // Same server-confirmed refresh as approval: no order exists, so the list,
      // the pending count and any other open tab must all drop back immediately.
      await syncAdminData();
      notifyAdminTabs();
      adminToast("Payment rejected — no order was placed", "error");
      return true;
    },
    [adminToast, syncAdminData, notifyAdminTabs]
  );

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      newStatus: AdminOrderStatus,
      courierName?: string,
      trackingNumber?: string,
      note?: string
    ) => {
      // The acting admin name is derived server-side; the client value is only
      // a fallback and can never be the reason the action no-ops.
      const result = await adminUpdateOrderStatus(
        orderId,
        newStatus,
        currentStaff?.name,
        note,
        courierName,
        trackingNumber
      );
      if (result.success) {
        if (result.data) {
          replaceOrder(result.data);
        } else {
          setOrders((prev) => prev.map((o) => {
            if (o.id !== orderId) return o;
            const updated = { ...o, orderStatus: newStatus };
            if (courierName) updated.courierName = courierName;
            if (trackingNumber) updated.trackingNumber = trackingNumber;
            if (note) updated.internalNotes = [...(o.internalNotes || []), note];
            return updated;
          }));
        }
        logAudit("Orders", "Update", `Updated order ${orderId} to ${newStatus}`);
        adminToast(`Order status updated to ${newStatus}`);
      } else {
        adminToast(result.error || "Failed to update order status", "error");
      }
    },
    [currentStaff, logAudit, adminToast, replaceOrder]
  );

  const addInternalOrderNote = useCallback((orderId: string, note: string) => {
    setOrders((prev) => prev.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          internalNotes: [...(o.internalNotes || []), note],
        };
      }
      return o;
    }));
    logAudit("Orders", "Update", `Added note to order ${orderId}`);
    adminToast("Note added to order");
  }, [logAudit, adminToast]);

  /**
   * Apply the authoritative product returned by an admin mutation to the shared
   * catalog (targeted update). Falls back to a one-product refetch when the
   * server did not return a mapped product.
   */
  const applyProductResult = useCallback(
    async (data: unknown, id: string | undefined) => {
      const product = data as Product | null | undefined;
      if (product && typeof product === "object" && "id" in product) {
        upsertProduct(product);
      } else if (id) {
        await refreshProduct(id);
      }
    },
    [upsertProduct, refreshProduct]
  );

  // Products
  const saveProduct = useCallback(async (product: Partial<AdminProduct>): Promise<AdminProduct> => {
    if (product.id && products.some((p) => p.id === product.id)) {
      const result = await adminUpdateProduct(product.id, product as any);
      if (result.success) {
        logAudit("Products", "Update", `Updated product '${product.name || product.id}'`);
        adminToast("Product updated", "success");
        // Apply the authoritative product returned by the server to the shared
        // catalog — no full-catalog refetch.
        await applyProductResult(result.data, product.id);
        return product as AdminProduct;
      } else {
        adminToast(result.error || "Failed to update product", "error");
        throw new Error(result.error || "Failed to update product");
      }
    } else {
      const result = await adminCreateProduct(product as any);
      if (result.success) {
        logAudit("Products", "Create", `Created product '${product.name || product.id}'`);
        adminToast("Product created", "success");
        await applyProductResult(result.data, undefined);
        return product as AdminProduct;
      } else {
        adminToast(result.error || "Failed to create product", "error");
        throw new Error(result.error || "Failed to create product");
      }
    }
  }, [products, logAudit, adminToast, applyProductResult]);

  const deleteProduct = useCallback(async (productId: string) => {
    const result = await adminDeleteProduct(productId);
    if (result.success) {
      logAudit("Products", "Delete", `Deleted product ${productId}`);
      adminToast("Product deleted", "info");
      // Remove the single row locally instead of refetching the catalog.
      removeProduct(productId);
    } else {
      adminToast(result.error || "Failed to delete product", "error");
    }
  }, [logAudit, adminToast, removeProduct]);

  const toggleProductStatus = useCallback(async (productId: string) => {
    const result = await adminToggleProductStatus(productId);
    if (result.success) {
      const match = products.find((p) => p.id === productId);
      const nextStatus = match?.status === "live" ? "draft" : "live";
      logAudit("Products", "Update", `Changed '${match?.name || productId}' status to ${nextStatus}`);
      adminToast(`Product is now ${nextStatus.toUpperCase()}`, "info");
      await applyProductResult(result.data, productId);
    } else {
      adminToast(result.error || "Failed to toggle product status", "error");
    }
  }, [products, logAudit, adminToast, applyProductResult]);

  // Inventory & Stock
  const adjustStock = useCallback(
    async (
      productId: string,
      variantSku: string,
      change: number,
      type: StockChangeType,
      reason: string
    ) => {
      const prod = products.find((p) => p.id === productId);
      const prodName = prod?.name;
      const varIndex = prod?.variants?.findIndex((v) => v.sku === variantSku) ?? -1;
      const variant = prod?.variants?.[varIndex];
      // A variant-less product keeps its stock on the product row; an empty SKU
      // signals a product-level adjustment (see adminAdjustStock).
      const varLabel = variant
        ? `${variant.size} / ${variant.color}`
        : variantSku || 'Product-level';

      const result = await adminAdjustStock(
        productId,
        variantSku,
        change,
        currentStaff?.name || "Admin"
      );
      if (result.success) {
        // The RPC now creates the ledger entry atomically, so we just refresh it
        // to get the latest entries from the server.
        const ledgerResult = await adminGetStockLedger();
        if (ledgerResult.success && ledgerResult.data) {
          setStockLedger(ledgerResult.data);
        }
        logAudit("Inventory", "Adjust Stock", `Stock ${type.toLowerCase()}: ${prodName} (${varLabel}) by ${change} - ${reason}`);
        adminToast(`Stock updated: ${varLabel} ${change > 0 ? "+" : ""}${change}`, "success");
        // Apply the authoritative product returned by the action (falls back to
        // a single-product refetch if the server returned none).
        await applyProductResult(result.data, productId);
      } else {
        adminToast(result.error || "Failed to adjust stock", "error");
      }
    },
    [products, currentStaff, logAudit, adminToast, applyProductResult]
  );

  const bulkUpdateStock = useCallback(
    async (rows: { sku: string; stock: number }[]) => {
      const result = await adminBulkUpdateStock(rows, currentStaff?.name || "Admin");
      if (!result.success) {
        adminToast(result.error, "error");
        return { updated: 0, errors: [result.error] };
      }
      // Refresh ledger to get the new entries created by the RPC
      const ledgerResult = await adminGetStockLedger();
      if (ledgerResult.success && ledgerResult.data) {
        setStockLedger(ledgerResult.data);
      }
      logAudit("Inventory", "Adjust Stock", `Bulk updated stock for ${result.data.updated} SKU(s)`);
      adminToast(`Updated stock for ${result.data.updated} SKU(s)`, "success");
      // Apply the authoritative mapped products returned by the action — only
      // the affected rows change, with no extra fetches.
      result.data.products.forEach((p) => upsertProduct(p));
      return { updated: result.data.updated, errors: result.data.errors };
    },
    [logAudit, adminToast, upsertProduct, currentStaff]
  );

  // Categories & Filters
  const saveCategory = useCallback(
    async (patch: Partial<AdminCategory>): Promise<AdminCategory> => {
      const result = await adminSaveCategory(patch);
      if (result.success && result.data) {
        const saved = result.data;
        setCategories((prev) => {
          const exists = prev.some((c) => c.id === saved.id);
          return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
        });
        logAudit(
          "Categories",
          patch.id ? "Update" : "Create",
          `${patch.id ? "Updated" : "Created"} category '${saved.name}'`
        );
        adminToast(patch.id ? "Category updated" : "Category created", "success");
        await refreshCategories();
        return saved;
      }
      if (!result.success) adminToast(result.error, "error");
      return categories[0] ?? ({} as AdminCategory);
    },
    [categories, logAudit, adminToast, refreshCategories]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const result = await adminDeleteCategory(id);
      if (!result.success) {
        adminToast(result.error, "error");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      logAudit("Categories", "Delete", `Deleted category ${id}`);
      adminToast("Category deleted", "info");
      await refreshCategories();
    },
    [logAudit, adminToast, refreshCategories]
  );

  const saveSubcategory = useCallback(
    async (patch: Partial<AdminSubcategory>): Promise<AdminSubcategory> => {
      const result = await adminSaveSubcategory(patch);
      if (result.success && result.data) {
        const saved = result.data;
        setCategories((prev) =>
          prev.map((c) =>
            c.id === saved.categoryId &&
            !(c.subcategories ?? []).some((n) => n.toLowerCase() === saved.name.toLowerCase())
              ? { ...c, subcategories: [...(c.subcategories ?? []), saved.name] }
              : c
          )
        );
        logAudit("Categories", "Update", `Saved subcategory '${saved.name}'`);
        adminToast("Subcategory saved", "success");
        await refreshCategories();
        return saved;
      }
      if (!result.success) adminToast(result.error, "error");
      return {} as AdminSubcategory;
    },
    [logAudit, adminToast, refreshCategories]
  );

  const deleteSubcategory = useCallback(
    async (categoryId: string, name: string) => {
      const result = await adminDeleteSubcategory({ categoryId, name });
      if (!result.success) {
        adminToast(result.error, "error");
        return;
      }
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                subcategories: (c.subcategories ?? []).filter(
                  (n) => n.toLowerCase() !== name.toLowerCase()
                ),
              }
            : c
        )
      );
      logAudit("Categories", "Delete", `Deleted subcategory ${name}`);
      adminToast("Subcategory deleted", "info");
      await refreshCategories();
    },
    [logAudit, adminToast, refreshCategories]
  );

  const saveFilter = useCallback(
    async (patch: Partial<CategoryFilter>): Promise<CategoryFilter> => {
      const result = await adminSaveFilter(patch);
      if (result.success && result.data) {
        const saved = result.data;
        setFilters((prev) => {
          const exists = prev.some((f) => f.id === saved.id);
          if (exists) {
            return prev.map((f) => (f.id === saved.id ? saved : f));
          }
          return [saved, ...prev];
        });
        logAudit("Categories", "Update", `Saved filter '${patch.name || patch.id}'`);
        adminToast("Filter saved", "success");
        return saved;
      }
      if (!result.success) adminToast(result.error, "error");
      return filters[0] as CategoryFilter;
    },
    [filters, logAudit, adminToast]
  );

  const deleteFilter = useCallback(
    async (id: string) => {
      const result = await adminDeleteFilter(id);
      if (!result.success) {
        adminToast(result.error, "error");
        return;
      }
      setFilters((prev) => prev.filter((f) => f.id !== id));
      logAudit("Categories", "Delete", `Deleted filter ${id}`);
      adminToast("Filter deleted", "info");
    },
    [logAudit, adminToast]
  );

  // Customers
  const toggleCustomerBlock = useCallback((id: string, reason?: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const blocked = !(c as any).blocked;
          logAudit("Orders", "Update", `${blocked ? "Blocked" : "Unblocked"} customer ${c.name}${reason ? `: ${reason}` : ""}`);
          adminToast(`Customer ${blocked ? "blocked" : "unblocked"}`, blocked ? "error" : "success");
          return { ...c, blocked, blockedAt: blocked ? new Date().toISOString() : undefined, blockReason: blocked ? reason : undefined };
        }
        return c;
      })
    );
  }, [logAudit, adminToast]);

  // Coupons
  const saveCoupon = useCallback(
    async (patch: Partial<AdminCoupon>): Promise<AdminCoupon> => {
      let result: AdminCoupon | null = null;
      if (patch.id && coupons.some((c) => c.id === patch.id)) {
        const res = await adminUpdateCoupon(patch.id, patch);
        if (!res.success) {
          adminToast(res.error, "error");
        } else {
          const existing = coupons.find((c) => c.id === patch.id);
          if (existing) {
            result = { ...existing, ...patch } as AdminCoupon;
            setCoupons((prev) => prev.map((c) => (c.id === patch.id ? result! : c)));
            logAudit("Coupons", "Update", `Updated coupon '${patch.code || patch.id}'`);
            adminToast("Coupon updated", "success");
          }
        }
      } else {
        const res = await adminCreateCoupon(
          patch as Omit<AdminCoupon, "id" | "usedCount" | "createdAt" | "updatedAt">
        );
        if (!res.success) {
          adminToast(res.error, "error");
        } else if (res.data) {
          result = res.data;
          setCoupons((prev) => [...prev, res.data!]);
          logAudit("Coupons", "Create", `Created coupon '${res.data.code}'`);
          adminToast("Coupon created", "success");
        }
      }
      if (!result && coupons.length > 0) {
        result = coupons[0];
      }
      return result || ({} as AdminCoupon);
    },
    [coupons, logAudit, adminToast]
  );

  const deleteCoupon = useCallback(
    async (id: string) => {
      const result = await adminDeleteCoupon(id);
      if (!result.success) {
        adminToast(result.error, "error");
        return;
      }
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      logAudit("Coupons", "Delete", `Deleted coupon ${id}`);
      adminToast("Coupon deleted", "info");
    },
    [logAudit, adminToast]
  );

  // Content & Festive theme
  const switchFestiveTheme = useCallback((themeId: FestiveTheme["id"]) => {
    setFestiveThemes((prev) =>
      prev.map((t) => ({ ...t, active: t.id === themeId }))
    );
    logAudit("Content", "Theme Change", `Switched to festive theme ${themeId}`);
    adminToast("Festive theme activated");
  }, [logAudit, adminToast]);

  const saveBanner = useCallback(
    async (patch: Partial<AdminBanner>): Promise<AdminBanner> => {
      let finalSaved: AdminBanner = {
        id: patch.id || `ban_${Date.now()}`,
        title: patch.title || "Featured Collection",
        subtitle: patch.subtitle || "",
        category: patch.category || "Heritage Weaves",
        badge: patch.badge || "Signature Collection",
        price: patch.price,
        mrp: patch.mrp,
        rating: patch.rating || 4.8,
        reviews: patch.reviews || 100,
        image: patch.image || "",
        link: patch.link || "/products",
        buttonText: patch.buttonText || "Shop Now",
        active: patch.active ?? true,
        order: patch.order ?? 1,
      };

      try {
        const result = await adminSaveBanner(patch);
        if (result.success && result.data) {
          finalSaved = { ...finalSaved, ...result.data };
        }
      } catch {}

      let nextList: AdminBanner[] = [];
      setBanners((prev) => {
        const exists = prev.some((b) => b.id === finalSaved.id);
        nextList = exists
          ? prev.map((b) => (b.id === finalSaved.id ? finalSaved : b))
          : [finalSaved, ...prev];

        try {
          localStorage.setItem("miracle_admin_banners", JSON.stringify(nextList));
          window.dispatchEvent(new CustomEvent("miracle_banners_updated"));
        } catch {}

        return nextList;
      });

      // Persist to server storage API so homepage updates across all sessions
      try {
        await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextList),
        });
      } catch {}

      logAudit("Content", "Update", `Saved banner ${finalSaved.title}`);
      adminToast("Banner saved and published to storefront successfully", "success");
      return finalSaved;
    },
    [logAudit, adminToast]
  );

  const deleteBanner = useCallback(
    async (id: string) => {
      try {
        await adminDeleteBanner(id);
      } catch {}

      let nextList: AdminBanner[] = [];
      setBanners((prev) => {
        nextList = prev.filter((b) => b.id !== id);

        try {
          localStorage.setItem("miracle_admin_banners", JSON.stringify(nextList));
          window.dispatchEvent(new CustomEvent("miracle_banners_updated"));
        } catch {}

        return nextList;
      });

      // Persist removal to server storage API
      try {
        await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextList),
        });
      } catch {}

      logAudit("Content", "Delete", `Deleted banner ${id}`);
      adminToast("Banner deleted from storefront", "info");
    },
    [logAudit, adminToast]
  );

  const saveAnnouncement = useCallback(
    async (text: string) => {
      const result = await adminSaveAnnouncement({ text, active: true });
      if (result.success && result.data) {
        const saved = result.data;
        setAnnouncements((prev) => [saved, ...prev]);
        logAudit("Content", "Create", `Created announcement: ${text}`);
        adminToast("Announcement created", "success");
      } else if (!result.success) {
        adminToast(result.error, "error");
      }
    },
    [logAudit, adminToast]
  );

  const toggleAnnouncement = useCallback((id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const active = !a.active;
          logAudit("Content", "Update", `${active ? "Activated" : "Deactivated"} announcement ${id}`);
          adminToast(`Announcement ${active ? "activated" : "deactivated"}`, "info");
          return { ...a, active };
        }
        return a;
      })
    );
  }, [logAudit, adminToast]);

  const deleteAnnouncement = useCallback(
    async (id: string) => {
      const result = await adminDeleteAnnouncement(id);
      if (!result.success) {
        adminToast(result.error, "error");
        return;
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      logAudit("Content", "Delete", `Deleted announcement ${id}`);
      adminToast("Announcement deleted", "info");
    },
    [logAudit, adminToast]
  );

  const saveYouTubeVideo = useCallback(
    async (patch: Partial<YouTubeVideoItem>): Promise<YouTubeVideoItem> => {
      try {
        await adminSaveYoutubeVideo(patch);
      } catch {}

      const finalSaved: YouTubeVideoItem = {
        id: patch.id || `yt_${Date.now()}`,
        title: patch.title || "Miracle Collections Lookbook",
        videoId: patch.videoId || "KFCkU1PGMhI",
        url: patch.url || (patch.videoId ? `https://youtube.com/shorts/${patch.videoId}` : ""),
        description: patch.description || "",
        tag: patch.tag || "Collection",
        thumbnail: patch.thumbnail || `https://i.ytimg.com/vi/${patch.videoId || "KFCkU1PGMhI"}/hqdefault.jpg`,
        duration: patch.duration || "Shorts",
        views: patch.views || "1.5K",
        active: patch.active ?? true,
      };

      let nextList: YouTubeVideoItem[] = [];
      setYoutubeVideos((prev) => {
        const exists = prev.some((v) => v.id === finalSaved.id);
        nextList = exists
          ? prev.map((v) => (v.id === finalSaved.id ? finalSaved : v))
          : [finalSaved, ...prev];

        try {
          localStorage.setItem("miracle_admin_videos", JSON.stringify(nextList));
          window.dispatchEvent(new CustomEvent("miracle_videos_updated"));
        } catch {}

        return nextList;
      });

      // Persist to server storage API so homepage updates across all sessions
      try {
        await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextList),
        });
      } catch {}

      logAudit("Content", "Update", `Saved YouTube video ${finalSaved.title}`);
      adminToast("Video published to storefront successfully", "success");
      return finalSaved;
    },
    [logAudit, adminToast]
  );

  // Homepage Section & Content Management
  useEffect(() => {
    try {
      const cached = localStorage.getItem("miracle_admin_homepage");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.sections)) {
          setHomepageConfig(parsed);
        }
      }
    } catch {}

    const loadHomepage = async () => {
      try {
        const res = await fetch("/api/homepage");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.sections)) {
            setHomepageConfig(data);
            try {
              localStorage.setItem("miracle_admin_homepage", JSON.stringify(data));
            } catch {}
          }
        }
      } catch {}
    };

    loadHomepage();

    const handleUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail.sections)) {
        setHomepageConfig(e.detail);
        return;
      }
      try {
        const raw = localStorage.getItem("miracle_admin_homepage");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.sections)) {
            setHomepageConfig(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener("miracle_homepage_updated", handleUpdate);
    return () => window.removeEventListener("miracle_homepage_updated", handleUpdate);
  }, []);

  const saveHomepageConfig = useCallback(async (newConfig: AdminHomepageConfig): Promise<boolean> => {
    setHomepageConfig(newConfig);
    try {
      localStorage.setItem("miracle_admin_homepage", JSON.stringify(newConfig));
      window.dispatchEvent(new CustomEvent("miracle_homepage_updated", { detail: newConfig }));
    } catch {}

    try {
      const res = await fetch("/api/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      return res.ok;
    } catch (err) {
      console.error("Error saving homepage config:", err);
      return false;
    }
  }, []);

  const updateSectionVisibility = useCallback(async (sectionId: string, enabled: boolean): Promise<boolean> => {
    if (!homepageConfig) return false;
    const nextSections = homepageConfig.sections.map((s) =>
      s.id === sectionId ? { ...s, enabled } : s
    );
    return saveHomepageConfig({ ...homepageConfig, sections: nextSections });
  }, [homepageConfig, saveHomepageConfig]);

  const moveSectionOrder = useCallback(async (sectionId: string, direction: "up" | "down"): Promise<boolean> => {
    if (!homepageConfig) return false;
    const sorted = [...homepageConfig.sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === sectionId);
    if (idx < 0) return false;
    if (direction === "up" && idx === 0) return false;
    if (direction === "down" && idx === sorted.length - 1) return false;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = sorted[idx];
    sorted[idx] = sorted[targetIdx];
    sorted[targetIdx] = temp;
    const nextSections = sorted.map((s, i) => ({ ...s, order: i + 1 }));
    return saveHomepageConfig({ ...homepageConfig, sections: nextSections });
  }, [homepageConfig, saveHomepageConfig]);

  const deleteYouTubeVideo = useCallback(
    async (id: string) => {
      try {
        await adminDeleteYoutubeVideo(id);
      } catch {}

      let nextList: YouTubeVideoItem[] = [];
      setYoutubeVideos((prev) => {
        nextList = prev.filter((v) => v.id !== id);

        try {
          localStorage.setItem("miracle_admin_videos", JSON.stringify(nextList));
          window.dispatchEvent(new CustomEvent("miracle_videos_updated"));
        } catch {}

        return nextList;
      });

      // Persist removal to server storage API
      try {
        await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextList),
        });
      } catch {}

      logAudit("Content", "Delete", `Deleted YouTube video ${id}`);
      adminToast("Video deleted from storefront", "info");
    },
    [logAudit, adminToast]
  );

  // Settings
  const saveSettings = useCallback(
    async (patch: Partial<AdminSettings>) => {
      if (settings) {
        const result = await adminUpdateSettings({ ...settings, ...patch });
        if (!result.success) {
          adminToast(result.error, "error");
          return;
        }
        setSettings((prev) => (prev ? { ...prev, ...patch } : null));
        logAudit("Settings", "Update", `Updated settings`);
        adminToast("Settings saved", "success");
      }
    },
    [settings, logAudit, adminToast]
  );

  // Staff
  const addStaff = useCallback(
    async (member: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => {
      const result = await adminAddStaff(member);
      if (result.success && result.data) {
        const saved = result.data;
        setStaff((prev) => [...prev, saved]);
        logAudit("Staff", "Create", `Added staff member ${member.name}`);
        adminToast("Staff member added", "success");
      } else if (!result.success) {
        adminToast(result.error, "error");
      }
    },
    [logAudit, adminToast]
  );

  const deleteStaff = useCallback(
    async (id: string) => {
      const result = await adminDeleteStaff(id);
      if (!result.success) {
        adminToast(result.error, "error");
        return;
      }
      setStaff((prev) => prev.filter((s) => s.id !== id));
      if (currentStaff?.id === id) {
        setCurrentStaff(staff[0] || null);
      }
      logAudit("Staff", "Delete", `Deleted staff member ${id}`);
      adminToast("Staff member deleted", "info");
    },
    [currentStaff, staff, logAudit, adminToast]
  );

  // Utilities
  const exportToCsv = useCallback((data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      adminToast("No data to export", "error");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    logAudit("Reports", "Export", `Exported ${filename}.csv`);
    adminToast("Export successful");
  }, [logAudit, adminToast]);

  const resetToSampleData = useCallback(() => {
    if (confirm("This will reset all admin data to defaults. Are you sure?")) {
      window.location.reload();
    }
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({
      products,
      categories,
      filters,
      orders,
      payments,
      paymentVerifications,
      stockLedger,
      customers,
      coupons,
      banners,
      announcements,
      youtubeVideos,
      festiveThemes,
      settings: settings || {} as AdminSettings,
      staff,
      currentStaff: currentStaff || {} as StaffMember,
      auditLogs,
      toasts,
      loading,
      pendingPaymentCount,
      newOrderCount,
      lowStockCount,
      totalRevenue,
      todaySales,
      adminToast,
      setCurrentStaff,
      logAudit,
      confirmOrder,
      verifyPayment,
      rejectPayment,
      approvePaymentVerification,
      rejectPaymentVerification,
      updateOrderStatus,
      addInternalOrderNote,
      saveProduct,
      deleteProduct,
      toggleProductStatus,
      adjustStock,
      bulkUpdateStock,
      saveCategory,
      deleteCategory,
      subcategories,
      saveSubcategory,
      deleteSubcategory,
      saveFilter,
      deleteFilter,
      toggleCustomerBlock,
      saveCoupon,
      deleteCoupon,
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
      saveSettings,
      addStaff,
      deleteStaff,
      exportToCsv,
      resetToSampleData,
    }),
    [
      products,
      categories,
      filters,
      orders,
      payments,
      paymentVerifications,
      stockLedger,
      customers,
      coupons,
      banners,
      announcements,
      youtubeVideos,
      festiveThemes,
      settings,
      staff,
      currentStaff,
      auditLogs,
      toasts,
      loading,
      pendingPaymentCount,
      newOrderCount,
      lowStockCount,
      totalRevenue,
      todaySales,
      adminToast,
      setCurrentStaff,
      logAudit,
      confirmOrder,
      verifyPayment,
      rejectPayment,
      approvePaymentVerification,
      rejectPaymentVerification,
      updateOrderStatus,
      addInternalOrderNote,
      saveProduct,
      deleteProduct,
      toggleProductStatus,
      adjustStock,
      bulkUpdateStock,
      saveCategory,
      deleteCategory,
      subcategories,
      saveSubcategory,
      deleteSubcategory,
      saveFilter,
      deleteFilter,
      toggleCustomerBlock,
      saveCoupon,
      deleteCoupon,
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
      saveSettings,
      addStaff,
      deleteStaff,
      exportToCsv,
      resetToSampleData,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within an AdminProvider");
  return ctx;
}
