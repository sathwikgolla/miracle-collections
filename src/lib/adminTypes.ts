export type StaffRole =
  | "Super Admin"
  | "Store Manager"
  | "Fulfillment Specialist"
  | "Inventory Manager"
  | "Verification Officer";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  avatar: string;
  lastActive: string;
  status: "active" | "inactive";
}

export interface AdminVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  reservedStock: number;
  priceOverride?: number;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  subCategory?: string;
  /** Audience the product belongs to (men/women/kids); drives the category hierarchy. */
  gender?: "men" | "women" | "kids" | "unisex" | "";
  price: number;
  mrp: number;
  costPrice?: number;
  rating: number;
  reviews: number;
  images: string[];
  colors: string[];
  sizes: string[];
  badges: string[];
  description: string;
  specifications: { label: string; value: string }[];
  variants: AdminVariant[];
  stock: number;
  status: "live" | "draft";
  createdAt: string;
  updatedAt: string;
}

export type StockChangeType =
  | "restock"
  | "manual_adjust"
  | "order_reserved"
  | "order_sale"
  | "order_cancelled"
  | "return_restored"
  | "damage_writeoff";

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  variantSku: string;
  variantLabel: string;
  type: StockChangeType;
  change: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  staffName: string;
  referenceId?: string;
}

export type PaymentVerificationStatus =
  | "awaiting_reference"
  | "pending_verification"
  | "verified"
  | "rejected";

export interface AdminPayment {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  utrNumber: string;
  /** Canonical method key from the order (upi / card / netbanking / ...). */
  paymentMethod: string;
  screenshotUrl?: string;
  submittedAt: string;
  status: PaymentVerificationStatus;
  isDuplicateUtr: boolean;
  duplicateOrderId?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  expiresAt: string;
}

/**
 * A checkout payment verification (UTR submitted BEFORE an order exists).
 * A `pending` row is NOT an order: accepting it creates the order exactly
 * once, rejecting it creates none.
 */
export interface AdminPaymentVerification {
  id: string;
  status: "pending" | "approved" | "rejected";
  userId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  /** Server-computed payable total at submission (re-quoted at approval). */
  amount: number;
  utrNumber: string;
  /** Raw checkout label ("UPI", "Credit / Debit Card", ...). */
  paymentMethod: string;
  /** Canonical method key (upi / card / netbanking / ...). */
  paymentMethodKey: string;
  /** Raw cart snapshot; names/prices are resolved from live product data. */
  items: {
    product_id: string;
    quantity: number;
    color?: string | null;
    size?: string | null;
  }[];
  shipping: {
    name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    /** "Area / Landmark" captured at checkout (optional). */
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  coupon?: string | null;
  orderId?: string | null;
  rejectionReason?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  submittedAt: string;
}

export type AdminOrderStatus =
  | "Placed"
  | "Confirmed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  // Legacy order-status values from the pre-split payment/order model. Kept so
  // existing rows still type-check; the UI normalizes them to "Confirmed".
  | "Payment Pending"
  | "Payment Verified"
  | "Packed"
  | "Payment Rejected";

export interface AdminOrderTimeline {
  status: AdminOrderStatus;
  timestamp: string;
  note: string;
  staff?: string;
}

export interface AdminOrder {
  id: string;
  placedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    productId: string;
    name: string;
    sku: string;
    variant: string;
    price: number;
    qty: number;
    image: string;
  }[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  paymentMethod: "Merchant UPI QR" | "Cash on Delivery" | "Card / Netbanking";
  paymentStatus: "Pending" | "Pending Verification" | "Verified" | "Paid" | "Failed" | "Refunded";
  orderStatus: AdminOrderStatus;
  utrNumber?: string;
  paymentId?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  internalNotes?: string[];
  timeline: AdminOrderTimeline[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  /** @deprecated Superseded by the `subcategories` table (category → gender → subcategory). Kept only for backwards compatibility. */
  subcategories: string[];
  productCount: number;
  active: boolean;
}

/** A third-level catalog node: a subcategory scoped to one category + audience. */
export interface AdminSubcategory {
  id: string;
  categoryId: string;
  gender: "men" | "women" | "kids" | "unisex";
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
}

export interface CategoryFilter {
  id: string;
  name: string;
  key: string;
  targetCategories: string[];
  type: "multiselect" | "range" | "single";
  options: string[];
  active: boolean;
}

export interface AdminCoupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrder: number;
  maxDiscountCap?: number;
  startDate: string;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  joinedDate: string;
  lastOrderDate: string;
  status: "active" | "blocked";
  blockReason?: string;
  addresses: string[];
}

export interface AdminBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  link: string;
  buttonText: string;
  active: boolean;
  order: number;
  category?: string;
  price?: number;
  mrp?: number;
  rating?: number;
  reviews?: number;
}

export interface AnnouncementBarItem {
  id: string;
  text: string;
  active: boolean;
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  videoId: string;
  url?: string;
  description?: string;
  tag?: string;
  thumbnail: string;
  duration: string;
  views: string;
  active: boolean;
}

export interface FestiveTheme {
  id: "default" | "diwali" | "sankranti" | "festive_sale";
  name: string;
  badge: string;
  primaryColor: string;
  accentColor: string;
  bannerHeadline: string;
  bannerSubhead: string;
}

export interface AdminSettings {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  upiId: string;
  upiMerchantName: string;
  qrCodeUrl: string;
  utrLength: number;
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee: number;
  gstin: string;
  defaultGstRate: number;
  pricesIncludeGst: boolean;
  cartTimeoutMinutes: number;
  utrExpiryHours: number;
  activeFestiveTheme: FestiveTheme["id"];
  notificationTemplates: {
    orderPlaced: string;
    paymentVerified: string;
    orderShipped: string;
    paymentRejected: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  staffName: string;
  role: string;
  module:
    | "Dashboard"
    | "Products"
    | "Inventory"
    | "Orders"
    | "Payments"
    | "Categories"
    | "Content"
    | "Coupons"
    | "Settings"
    | "Staff"
    | "Reports";
  action: "Create" | "Update" | "Delete" | "Verify" | "Reject" | "Adjust Stock" | "Export" | "Theme Change";
  description: string;
  ipAddress: string;
}
