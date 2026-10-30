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
import type {
  Address,
  AppNotification,
  AuthResult,
  Category,
  CartItem,
  Order,
  Product,
  QAItem,
  ReturnRecord,
  Review,
  Theme,
  Toast,
  User,
} from "@/lib/types";
import { getAvailableStock, uid, formatPrice } from "@/lib/utils";
import { getCurrentUser, signIn, signOut, signUp, getUserProfile } from "@/lib/supabase/auth";
import { getProductsForCards, getProductById as fetchProductById } from "@/lib/supabase/products-light";
import { getCategories, type SubcategoryOption } from "@/lib/supabase/categories";
import { buildSubcategoryOptions } from "@/lib/catalogTaxonomy";
import { getCart, addToCart as addToCartSupabase, updateCartItem as updateCartItemSupabase, removeFromCart as removeFromCartSupabase, clearCart as clearCartSupabase } from "@/lib/supabase/cart";
import { getWishlist, addToWishlist as addToWishlistSupabase, removeFromWishlist as removeFromWishlistSupabase, toggleWishlist as toggleWishlistSupabase } from "@/lib/supabase/wishlist";
import { getOrders, getOrderById } from "@/lib/supabase/orders";
import { placeOrderSecure, cancelOrderSecure, submitOrderPaymentUtr, getMyPaymentVerifications } from "@/app/actions/orders";
import { getAddresses, addAddress as addAddressSupabase, updateAddress as updateAddressSupabase, deleteAddress as deleteAddressSupabase } from "@/lib/supabase/addresses";
import { products as fallbackProducts } from "@/data/products";
import { categories as fallbackCategories } from "@/data/categories";

interface StoreValue {
  // Core
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  toasts: Toast[];
  user: User | null;
  addresses: Address[];
  hydrated: boolean;
  loading: boolean;

  // Products (customer reads only — admin writes live in server actions)
  products: Product[];
  categories: Category[];
  subcategories: SubcategoryOption[];
  getProductById: (id: string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;

  // Extended (localStorage only)
  recentlyViewed: string[];
  notifyList: string[];
  priceAlerts: string[];
  notifications: AppNotification[];
  userReviews: Record<string, Review[]>;
  questions: Record<string, QAItem[]>;
  recentSearches: string[];
  compare: string[];
  returns: Record<string, ReturnRecord>;
  theme: Theme;

  // Auth
  register: (data: { name: string; email: string; mobile: string; password: string }) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (patch: { name?: string; email?: string; mobile?: string }) => void;
  /** Re-read the session and reload the signed-in user's data (post-login). */
  refreshAuth: () => Promise<void>;
  /**
   * Re-read ONLY the signed-in user's orders (targeted — no catalog refetch).
   * Returns the fresh list (or null on failure) so callers can use it directly
   * instead of issuing a second, redundant order read.
   */
  refreshOrders: () => Promise<Order[] | null>;
  /** Re-fetch the category catalog (after an admin category mutation). */
  refreshCategories: () => Promise<void>;
  /** Apply a single authoritative product (insert or replace) without a full reload. */
  upsertProduct: (product: Product) => void;
  /** Remove one product from the catalog locally (after a delete). */
  removeProduct: (id: string) => void;
  /** Re-read ONE product (with variants) and apply it — for stock/variant edits. */
  refreshProduct: (id: string) => Promise<void>;

  // Addresses
  addAddress: (address: Omit<Address, "id">) => Promise<Address | null>;
  updateAddress: (id: string, address: Omit<Address, "id">) => Promise<boolean>;
  removeAddress: (id: string) => Promise<boolean>;

  // Cart
  addToCart: (productId: string, qty?: number, color?: string, size?: string) => Promise<void>;
  removeFromCart: (key: string) => Promise<void>;
  updateQty: (key: string, qty: number) => Promise<void>;
  moveToWishlist: (key: string) => Promise<void>;
  moveToCart: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  placeOrder: (order: Omit<Order, "id" | "placedAt">, shippingAddress: Address) => Promise<Order | null>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  submitUtr: (orderId: string, utr: string) => Promise<boolean>;
  clearCart: () => Promise<void>;

  // Recently viewed
  addRecentlyViewed: (productId: string) => void;
  removeRecentlyViewed: (productId: string) => void;

  // Notify me
  isNotified: (productId: string) => boolean;
  toggleNotify: (productId: string) => void;

  // Price drop alert
  isPriceAlerted: (productId: string) => boolean;
  togglePriceAlert: (productId: string) => void;

  // Notifications
  markAllNotificationsRead: () => void;

  // Reviews
  addReview: (productId: string, review: Omit<Review, "id">) => void;

  // Q&A
  addQuestion: (productId: string, text: string) => void;

  // Search
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;

  // Compare
  toggleCompare: (productId: string) => void;
  isCompared: (productId: string) => boolean;
  clearCompare: () => void;

  // Returns
  requestReturn: (orderId: string, reason: string) => void;

  // Theme
  toggleTheme: () => void;

  toast: (message: string, type?: Toast["type"]) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

// Simple localStorage hook for UI preferences only
function useLocalStorage<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  }, [key, state, hydrated]);

  return [state, setState, hydrated] as const;
}

const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", type: "offer", title: "Weekend Sale is live!", message: "Up to 50% off on fashion, clothing and footwear. Shop now.", time: "2h ago", read: false },
  { id: "n2", type: "stock", title: "Back in stock", message: "White Leather Minimalist Sneakers are back in stock.", time: "1d ago", read: false },
  { id: "n3", type: "price", title: "Price dropped", message: "The price of Men's Oxford Cotton Shirt dropped by ₹200.", time: "2d ago", read: true },
  { id: "n4", type: "delivery", title: "Delivery update", message: "Your recent order is out for delivery and arriving today.", time: "3d ago", read: true },
];

export function StoreProvider({ children }: { children: ReactNode }) {
  // Supabase-backed state
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>(buildSubcategoryOptions(fallbackCategories));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // localStorage-backed state (UI preferences only)
  const [recentlyViewed, setRecentlyViewed, rvHydrated] = useLocalStorage<string[]>("saara:recentlyViewed", []);
  const [notifyList, setNotifyList, notifyHydrated] = useLocalStorage<string[]>("saara:notifyList", []);
  const [priceAlerts, setPriceAlerts, paHydrated] = useLocalStorage<string[]>("saara:priceAlerts", []);
  const [notifications, setNotifications, notifHydrated] = useLocalStorage<AppNotification[]>("saara:notifications", SEED_NOTIFICATIONS);
  const [userReviews, setUserReviews, urHydrated] = useLocalStorage<Record<string, Review[]>>("saara:userReviews", {});
  const [questions, setQuestions, qHydrated] = useLocalStorage<Record<string, QAItem[]>>("saara:questions", {});
  const [recentSearches, setRecentSearches, rsHydrated] = useLocalStorage<string[]>("saara:recentSearches", []);
  const [compare, setCompare, compareHydrated] = useLocalStorage<string[]>("saara:compare", []);
  const [returns, setReturns, returnsHydrated] = useLocalStorage<Record<string, ReturnRecord>>("saara:returns", {});
  const [theme, setTheme, themeHydrated] = useLocalStorage<Theme>("saara:theme", "light");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = uid();
    setToasts((t) => [...t, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  // ----------------------------------------------------------------
  // Refresh primitives (exposed to the UI and reused by the admin panel)
  // ----------------------------------------------------------------

  /** Re-fetch the category catalog (drives the navbar + admin category UI). */
  const refreshCategories = useCallback(async () => {
    const categoriesData = await getCategories();
    setCategories(categoriesData);
    setSubcategories(buildSubcategoryOptions(categoriesData));
  }, []);

  /**
   * Insert or replace a single product in the catalog. Admin mutations return
   * the authoritative product, so the UI updates that one row instead of
   * re-downloading the entire catalog (products + all variants).
   */
  const upsertProduct = useCallback((product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists
        ? prev.map((p) => (p.id === product.id ? product : p))
        : [product, ...prev];
    });
  }, []);

  /** Remove a deleted product locally — no refetch needed. */
  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /** Re-read ONE product (with variants) and apply it (stock/variant edits). */
  const refreshProduct = useCallback(
    async (id: string) => {
      const product = await fetchProductById(id);
      if (product) upsertProduct(product);
    },
    [upsertProduct]
  );

  /**
   * Re-read the current Supabase session and load the signed-in user's profile
   * plus their cart / wishlist / orders / addresses. Called after login (the
   * root-layout provider persists across the post-login navigation, so a
   * mount-only load never sees the new session) and after registration.
   */
  const refreshAuth = useCallback(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      setUser(null);
      setCart([]);
      setWishlist([]);
      setOrders([]);
      setAddresses([]);
      return;
    }
    // The profile and every user-scoped list depend only on the user id, so
    // fetch them in a single round trip.
    const [profile, cartData, wishlistData, ordersData, addressesData] = await Promise.all([
      getUserProfile(currentUser.id),
      getCart(currentUser.id),
      getWishlist(currentUser.id),
      getOrders(currentUser.id),
      getAddresses(currentUser.id),
    ] as const);
    if (profile) {
      setUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        mobile: profile.mobile || '',
        createdAt: profile.created_at,
      });
    }
    setCart(cartData);
    setWishlist(wishlistData);
    // Only replace orders when the read succeeded — a transient failure must not
    // wipe the list the customer is looking at.
    if (ordersData) setOrders(ordersData);
    setAddresses(addressesData);
  }, []);

  /**
   * Re-read ONLY the signed-in user's orders.
   *
   * Order status is changed by the ADMIN in a different session, and this
   * provider lives in the root layout (so it survives client navigation) — so
   * without an explicit revalidation the tracking page would keep showing the
   * status it captured at load. This touches orders only, never the catalog.
   */
  const knownOrderPaymentStatusesRef = useRef<Map<string, string>>(new Map());
  const knownVerifStatusesRef = useRef<Map<string, string>>(new Map());
  const initialOrdersLoadDoneRef = useRef(false);

  // Reset tracking when user identity changes
  useEffect(() => {
    initialOrdersLoadDoneRef.current = false;
    knownOrderPaymentStatusesRef.current.clear();
    knownVerifStatusesRef.current.clear();
  }, [user?.id]);

  /**
   * Re-read the signed-in user's orders and detect payment verification updates.
   * When an admin verifies a payment, this automatically creates an in-app
   * notification in the navbar bell and triggers a real-time toast alert.
   */
  const refreshOrders = useCallback(async () => {
    if (!user) return null;

    try {
      const [ordersData, verifsRes] = await Promise.all([
        getOrders(user.id),
        getMyPaymentVerifications().catch(() => null),
      ]);

      if (ordersData) {
        setOrders(ordersData);

        if (!initialOrdersLoadDoneRef.current) {
          // First load of this session: catalog current statuses quietly so we don't spam toasts
          ordersData.forEach((order) => {
            knownOrderPaymentStatusesRef.current.set(order.id, order.paymentStatus);
            if (order.paymentStatus === "Verified") {
              const notifId = `notif-payment-verified-${order.id}`;
              setNotifications((prev) => {
                if (prev.some((n) => n.id === notifId)) return prev;
                return [
                  {
                    id: notifId,
                    type: "order",
                    title: "Payment Verified",
                    message: `Your payment of ${formatPrice(order.total)} for Order #${order.id.slice(0, 8)} has been verified successfully. Your order is confirmed!`,
                    time: "Recently",
                    read: false,
                  },
                  ...prev,
                ];
              });
            }
          });

          if (verifsRes?.success && verifsRes.data) {
            verifsRes.data.forEach((v) => {
              knownVerifStatusesRef.current.set(v.id, v.status);
            });
          }

          initialOrdersLoadDoneRef.current = true;
        } else {
          // Live updates — detect newly verified orders!
          for (const order of ordersData) {
            const prevStatus = knownOrderPaymentStatusesRef.current.get(order.id);
            const isNewlyVerified = order.paymentStatus === "Verified" && prevStatus !== "Verified";

            if (isNewlyVerified) {
              knownOrderPaymentStatusesRef.current.set(order.id, "Verified");
              const notifId = `notif-payment-verified-${order.id}`;
              const orderShortId = order.id.slice(0, 8);

              setNotifications((prev) => {
                if (prev.some((n) => n.id === notifId)) return prev;
                return [
                  {
                    id: notifId,
                    type: "order",
                    title: "Payment Verified",
                    message: `Your payment of ${formatPrice(order.total)} for Order #${orderShortId} has been verified successfully. Your order is confirmed!`,
                    time: "Just now",
                    read: false,
                  },
                  ...prev,
                ];
              });

              toast(`Payment verified for order #${orderShortId}! Your order has been placed.`, "success");
            } else if (order.paymentStatus === "Failed" && prevStatus !== "Failed") {
              knownOrderPaymentStatusesRef.current.set(order.id, "Failed");
              const notifId = `notif-payment-failed-${order.id}`;
              const orderShortId = order.id.slice(0, 8);

              setNotifications((prev) => {
                if (prev.some((n) => n.id === notifId)) return prev;
                return [
                  {
                    id: notifId,
                    type: "order",
                    title: "Payment Verification Failed",
                    message: `Payment verification for Order #${orderShortId} failed. Please review your details or contact support.`,
                    time: "Just now",
                    read: false,
                  },
                  ...prev,
                ];
              });

              toast(`Payment verification failed for order #${orderShortId}`, "error");
            } else {
              knownOrderPaymentStatusesRef.current.set(order.id, order.paymentStatus);
            }
          }

          // Check for rejected pre-order payment verifications
          if (verifsRes?.success && verifsRes.data) {
            for (const v of verifsRes.data) {
              const prevVerifStatus = knownVerifStatusesRef.current.get(v.id);
              if (v.status === "rejected" && prevVerifStatus !== "rejected") {
                knownVerifStatusesRef.current.set(v.id, "rejected");
                const notifId = `notif-verif-rejected-${v.id}`;
                const reason = v.rejectionReason || "Invalid payment reference";

                setNotifications((prev) => {
                  if (prev.some((n) => n.id === notifId)) return prev;
                  return [
                    {
                      id: notifId,
                      type: "order",
                      title: "Payment Rejected",
                      message: `Your payment reference (UTR ${v.utrNumber}) was rejected: ${reason}`,
                      time: "Just now",
                      read: false,
                    },
                    ...prev,
                  ];
                });

                toast(`Payment verification rejected: ${reason}`, "error");
              } else {
                knownVerifStatusesRef.current.set(v.id, v.status);
              }
            }
          }
        }
      }

      return ordersData;
    } catch (err) {
      console.error("refreshOrders error:", err);
      return null;
    }
  }, [user, toast, setNotifications]);

  // Load initial data from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load products + catalog categories. Subcategory options are derived
        // from the category rows + the shared taxonomy (there is no separate
        // subcategories table).
        const [productsData, categoriesData] = await Promise.all([
          getProductsForCards(),
          getCategories(),
        ]);
        if (productsData && productsData.length > 0) {
          setProducts(productsData);
        } else {
          setProducts(fallbackProducts);
        }
        setCategories(categoriesData);
        setSubcategories(buildSubcategoryOptions(categoriesData));

        // Load the signed-in user's profile + user-scoped lists.
        await refreshAuth();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [refreshAuth]);

  // NOTE: the storefront CATALOG is NOT refetched on tab focus. Admin writes go
  // through server actions that return the authoritative product, and the admin
  // UI applies the change with targeted `upsertProduct`/`removeProduct` updates
  // (see AdminContext).
  //
  // ORDERS are different: their status is changed by the admin in another
  // session, so we revalidate just the order list when the tab becomes visible /
  // focused. That is a single RLS-scoped query, never a catalog reload.
  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      void refreshOrders();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshOrders();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // Cross-tab real-time sync: when an admin verifies payment in another tab,
    // notify this tab immediately via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("miracle_admin_sync");
      channel.onmessage = () => {
        void refreshOrders();
      };
    } catch {
      // BroadcastChannel not available in all environments
    }

    // Auto-poll every 4 seconds to ensure the customer receives the verification notification promptly
    const pollInterval = window.setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        void refreshOrders();
      }
    }, 4000);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (channel) channel.close();
      window.clearInterval(pollInterval);
    };
  }, [user, refreshOrders]);

  // Theme side effect
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  // Auth
  // NOTE: customer sign-in is performed by the `loginAction` Server Action in
  // `src/app/actions/auth.ts`. Doing the password check and the `profiles.role`
  // lookup together on the server removes the race where the browser read the
  // role before the session cookie had propagated. The client then calls
  // `refreshAuth()` so the (persisted) root-layout provider reflects the new
  // session immediately — no manual page reload. The server still re-verifies
  // the role on every privileged action.

  const register = useCallback(
    async (data: { name: string; email: string; mobile: string; password: string }): Promise<AuthResult> => {
      const result = await signUp(data);
      if (result.success && result.user) {
        await refreshAuth();
      }
      return {
        ok: result.success,
        error: result.error,
      };
    },
    [refreshAuth]
  );

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    setCart([]);
    setWishlist([]);
    setOrders([]);
    setAddresses([]);
    toast("Logged out successfully", "info");
  }, [toast]);

  const updateProfile = useCallback(
    async (patch: { name?: string; email?: string; mobile?: string }) => {
      if (user) {
        setUser((u) => (u ? { ...u, ...patch } : u));
      }
    },
    [user]
  );

  // Addresses
  const addAddress = useCallback(
    async (address: Omit<Address, "id">) => {
      if (!user) return null;
      const result = await addAddressSupabase(user.id, address);
      if (result) {
        setAddresses((prev) => [...prev, result]);
      }
      return result;
    },
    [user]
  );

  const updateAddress = useCallback(
    async (id: string, address: Omit<Address, "id">) => {
      if (!user) return false;
      const result = await updateAddressSupabase(id, user.id, address);
      if (result) {
        setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, ...address } : a)));
      }
      return result;
    },
    [user]
  );

  const removeAddress = useCallback(
    async (id: string) => {
      if (!user) return false;
      const result = await deleteAddressSupabase(id, user.id);
      if (result) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
      return result;
    },
    [user]
  );

  // Cart
  const addToCart = useCallback(
    async (productId: string, qty = 1, color?: string, size?: string) => {
      if (!user) return;
      // Respect real availability: don't add an item whose selected variant is
      // out of stock (the server re-validates stock at checkout).
      const product = products.find((p) => p.id === productId);
      const available = product ? getAvailableStock(product, color, size) : undefined;
      if (available !== undefined && available <= 0) {
        toast("This item is out of stock", "error");
        return;
      }
      // Calculate the final absolute quantity to send to the server.
      // If the item already exists in cart, add to it. Otherwise, use the requested quantity.
      const key = `${productId}::${color ?? ""}::${size ?? ""}`;
      const existing = cart.find((i) => i.key === key);
      const currentQty = existing?.qty ?? 0;
      const wanted = Math.max(1, Math.floor(qty));
      const requested = Math.min(wanted, 10, available ?? 10);
      const finalQty = Math.min(10, currentQty + requested);
      // Clamp to available stock
      const clampedQty = available !== undefined ? Math.min(finalQty, available) : finalQty;
      if (clampedQty < currentQty + requested) {
        toast(`Only ${available} available`, "error");
      }
      // Send the absolute final quantity to the server
      const result = await addToCartSupabase(user.id, { productId, qty: clampedQty, color, size });
      if (result) {
        // Use the returned value from server to ensure synchronization
        setCart((prev) => {
          const existingIndex = prev.findIndex((i) => i.key === key);
          if (existingIndex >= 0) {
            // Replace existing item with server-returned value
            const newCart = [...prev];
            newCart[existingIndex] = result;
            return newCart;
          }
          // Add new item
          return [...prev, result];
        });
      }
    },
    [user, products, toast, cart]
  );

  const removeFromCart = useCallback(
    async (key: string) => {
      if (!user) return;
      const item = cart.find((i) => i.key === key);
      if (!item) return;
      const removed = await removeFromCartSupabase(
        user.id,
        item.productId,
        item.color,
        item.size
      );
      if (!removed) {
        // The database row is still there — say so instead of pretending the
        // item is gone (it would just come back on the next page load).
        toast("Couldn't remove the item from your cart. Please try again.", "error");
        return;
      }
      // The delete matched on product + colour + size (all matching rows), so
      // the local state must filter on the same identity to stay in sync.
      setCart((prev) =>
        prev.filter(
          (i) =>
            !(
              i.productId === item.productId &&
              (i.color ?? null) === (item.color ?? null) &&
              (i.size ?? null) === (item.size ?? null)
            )
        )
      );
    },
    [user, cart, toast]
  );

  const updateQty = useCallback(
    async (key: string, qty: number) => {
      if (!user) return;
      const item = cart.find((i) => i.key === key);
      if (item) {
        // Clamp to the real purchasable stock for the selected variant as well
        // as the UI ceiling of 10.
        const product = products.find((p) => p.id === item.productId);
        const available = product ? getAvailableStock(product, item.color, item.size) : undefined;
        const upper = Math.min(10, available ?? 10);
        const nextQty = Math.max(1, Math.min(upper, qty));
        if (qty > upper) toast(`Only ${upper} available`, "error");
        const updated = await updateCartItemSupabase(
          user.id,
          item.productId,
          nextQty,
          item.color,
          item.size
        );
        if (!updated) {
          toast("Couldn't update the quantity. Please try again.", "error");
          return;
        }
        setCart((prev) => prev.map((i) => (i.key === key ? { ...i, qty: nextQty } : i)));
      }
    },
    [user, cart, products, toast]
  );

  const moveToWishlist = useCallback(
    async (key: string) => {
      const item = cart.find((i) => i.key === key);
      if (item && user) {
        const removed = await removeFromCartSupabase(
          user.id,
          item.productId,
          item.color,
          item.size
        );
        if (!removed) {
          toast("Couldn't update your cart. Please try again.", "error");
          return;
        }
        await addToWishlistSupabase(user.id, item.productId);
        setWishlist((prev) => (prev.includes(item.productId) ? prev : [...prev, item.productId]));
        setCart((prev) => prev.filter((i) => i.key !== key));
        toast("Moved to wishlist", "info");
      }
    },
    [cart, user, toast]
  );

  const moveToCart = useCallback(
    async (productId: string) => {
      if (!user) return;
      await removeFromWishlistSupabase(user.id, productId);
      await addToCartSupabase(user.id, { productId, qty: 1 });
      setWishlist((prev) => prev.filter((id) => id !== productId));
      setCart((prev) =>
        prev.some((i) => i.productId === productId)
          ? prev
          : [...prev, { key: `${productId}::`, productId, qty: 1 }]
      );
      toast("Moved to cart");
    },
    [user, toast]
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) return;
      await toggleWishlistSupabase(user.id, productId);
      setWishlist((prev) => {
        const has = prev.includes(productId);
        toast(has ? "Removed from wishlist" : "Added to wishlist", has ? "info" : "success");
        return has ? prev.filter((id) => id !== productId) : [...prev, productId];
      });
    },
    [user, toast]
  );

  const isWishlisted = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const placeOrder = useCallback(
    async (order: Omit<Order, "id" | "placedAt">, shippingAddress: Address) => {
      if (!user) {
        toast("Please log in to place an order", "error");
        return null;
      }

      // The server is the sole authority for prices, stock checks, totals,
      // ownership and initial status. We only forward identifiers + address.
      const result = await placeOrderSecure({
        items: cart.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          color: item.color,
          size: item.size,
        })),
        shipping: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
        },
        paymentMethod: order.paymentMethod,
        coupon: order.coupon,
      });

      if (!result.success) {
        toast(result.error, "error");
        return null;
      }

      // Re-read the persisted order (RLS-scoped to the signed-in user) so the
      // UI reflects the server-computed totals/address. Fall back to the local
      // snapshot only if the read is momentarily unavailable.
      const fallback: Order = {
        id: result.orderId,
        placedAt: new Date().toISOString(),
        items: order.items,
        itemTotal: order.itemTotal,
        discount: order.discount,
        deliveryCharge: order.deliveryCharge,
        coupon: order.coupon,
        couponDiscount: order.couponDiscount,
        total: order.total,
        status: order.status,
        // The server always records a new order as unpaid ('Pending'); mirror
        // that here rather than the optimistic client-side value.
        paymentStatus: "Pending",
        deliveryBy: order.deliveryBy,
        address: `${shippingAddress.line1}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`,
        paymentMethod: order.paymentMethod,
      };
      const created = (await getOrderById(result.orderId)) ?? fallback;

      setOrders((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
      setCart([]);
      setNotifications((prev) => [
        { id: uid(), type: "order", title: "Order confirmed", message: `Your order ${created.id} has been confirmed.`, time: "Just now", read: false },
        ...prev,
      ]);

      return created;
    },
    [user, cart, toast]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!user) return false;
      const result = await cancelOrderSecure(orderId);
      if (!result.success) {
        toast(result.error, "error");
        return false;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "Cancelled" as const } : o)));
      toast("Order cancelled", "info");
      return true;
    },
    [user, toast]
  );

  // Manual UPI/UTR submission. The server derives ownership from the session
  // and creates the payment record; the local order reflects the new status so
  // the UI updates without a refresh.
  const submitUtr = useCallback(
    async (orderId: string, utr: string) => {
      if (!user) return false;
      const result = await submitOrderPaymentUtr(orderId, utr);
      if (!result.success) {
        toast(result.error, "error");
        return false;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, paymentStatus: "Pending Verification" as const } : o
        )
      );
      toast("Payment reference submitted for verification");
      return true;
    },
    [user, toast]
  );

  const clearCart = useCallback(async () => {
    if (!user) return;
    const cleared = await clearCartSupabase(user.id);
    if (!cleared) {
      toast("Couldn't clear your cart. Please try again.", "error");
      return;
    }
    setCart([]);
  }, [user, toast]);

  // Product helpers
  const getProductById = useCallback(
    (id: string) => {
      return products.find((p) => p.id === id);
    },
    [products]
  );

  const getProductBySlug = useCallback(
    (slug: string) => {
      return products.find((p) => p.slug === slug || p.id === slug);
    },
    [products]
  );

  // Recently viewed
  const addRecentlyViewed = useCallback(
    (productId: string) => {
      setRecentlyViewed((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 10));
    },
    []
  );
  const removeRecentlyViewed = useCallback((productId: string) => setRecentlyViewed((prev) => prev.filter((id) => id !== productId)), []);

  // Notify me
  const isNotified = useCallback((productId: string) => notifyList.includes(productId), [notifyList]);
  const toggleNotify = useCallback(
    (productId: string) => {
      setNotifyList((prev) => {
        const has = prev.includes(productId);
        toast(has ? "Removed from notification list" : "You're on the notification list", has ? "info" : "success");
        return has ? prev.filter((id) => id !== productId) : [...prev, productId];
      });
    },
    [toast]
  );

  // Price drop alert
  const isPriceAlerted = useCallback((productId: string) => priceAlerts.includes(productId), [priceAlerts]);
  const togglePriceAlert = useCallback(
    (productId: string) => {
      setPriceAlerts((prev) => {
        const has = prev.includes(productId);
        toast(has ? "Price alert removed" : "You'll be notified when the price drops", has ? "info" : "success");
        return has ? prev.filter((id) => id !== productId) : [...prev, productId];
      });
    },
    [toast]
  );

  // Notifications
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast("All notifications marked as read", "info");
  }, [toast]);

  // Reviews
  const addReview = useCallback(
    (productId: string, review: Omit<Review, "id">) => {
      setUserReviews((prev) => ({
        ...prev,
        [productId]: [...(prev[productId] ?? []), { ...review, id: uid() }],
      }));
      toast("Review submitted — thank you!");
    },
    [toast]
  );

  // Q&A
  const addQuestion = useCallback(
    (productId: string, text: string) => {
      setQuestions((prev) => ({
        ...prev,
        [productId]: [
          { id: uid(), author: user?.name ?? "Guest", question: text, date: "Just now" },
          ...(prev[productId] ?? []),
        ],
      }));
      toast("Your question has been posted");
    },
    [toast, user]
  );

  // Search
  const addRecentSearch = useCallback(
    (q: string) => {
      const term = q.trim();
      if (!term) return;
      setRecentSearches((prev) => [term, ...prev.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 6));
    },
    []
  );
  const clearRecentSearches = useCallback(() => setRecentSearches([]), []);

  // Compare
  const toggleCompare = useCallback(
    (productId: string) => {
      setCompare((prev) => {
        const has = prev.includes(productId);
        if (has) {
          toast("Removed from compare", "info");
          return prev.filter((id) => id !== productId);
        }
        if (prev.length >= 4) {
          toast("You can compare up to 4 products", "error");
          return prev;
        }
        toast("Added to compare");
        return [...prev, productId];
      });
    },
    [toast]
  );
  const isCompared = useCallback((productId: string) => compare.includes(productId), [compare]);
  const clearCompare = useCallback(() => setCompare([]), []);

  // Returns
  const requestReturn = useCallback(
    (orderId: string, reason: string) => {
      setReturns((prev) => ({
        ...prev,
        [orderId]: { orderId, reason, status: "Return Requested", requestedAt: new Date().toISOString() },
      }));
      toast("Return request submitted");
    },
    [toast]
  );

  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);

  const hydrated = rvHydrated && notifyHydrated && paHydrated && notifHydrated && urHydrated && qHydrated && rsHydrated && compareHydrated && returnsHydrated && themeHydrated;

  const value = useMemo<StoreValue>(
    () => ({
      cart,
      wishlist,
      orders,
      toasts,
      user,
      addresses,
      products,
      categories,
      subcategories,
      hydrated,
      loading,
      getProductById,
      getProductBySlug,
      recentlyViewed,
      notifyList,
      priceAlerts,
      notifications,
      userReviews,
      questions,
      recentSearches,
      compare,
      returns,
      theme,
      register,
      logout,
      updateProfile,
      refreshAuth,
      refreshOrders,
      refreshCategories,
      upsertProduct,
      removeProduct,
      refreshProduct,
      addAddress,
      updateAddress,
      removeAddress,
      addToCart,
      removeFromCart,
      updateQty,
      moveToWishlist,
      moveToCart,
      toggleWishlist,
      isWishlisted,
      placeOrder,
      cancelOrder,
      submitUtr,
      clearCart,
      addRecentlyViewed,
      removeRecentlyViewed,
      isNotified,
      toggleNotify,
      isPriceAlerted,
      togglePriceAlert,
      markAllNotificationsRead,
      addReview,
      addQuestion,
      addRecentSearch,
      clearRecentSearches,
      toggleCompare,
      isCompared,
      clearCompare,
      requestReturn,
      toggleTheme,
      toast,
    }),
    [
      cart, wishlist, orders, user, addresses, products, categories, subcategories, hydrated, loading,
      recentlyViewed, notifyList, priceAlerts, notifications, userReviews, questions,
      recentSearches, compare, returns, theme,
      toasts,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
