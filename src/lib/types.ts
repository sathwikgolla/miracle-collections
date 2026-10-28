export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  subcategories?: string[];
  active?: boolean;
}

export interface Specification {
  label: string;
  value: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
}

export type Gender = "men" | "women" | "kids" | "unisex";

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  reservedStock?: number;
  priceOverride?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  categoryId: string;
  subCategory?: string;
  /** Audience the product belongs to. Optional for backwards compatibility; empty values are inferred from the name. */
  gender?: Gender;
  price: number; // selling price
  mrp: number; // original price
  costPrice?: number;
  rating: number;
  reviews: number;
  images: string[];
  colors: string[];
  sizes: string[];
  badges: string[];
  specifications: Specification[];
  reviewsList?: Review[];
  variants?: ProductVariant[];
  stock: number;
  status?: "live" | "draft";
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  key: string;
  productId: string;
  qty: number;
  color?: string;
  size?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  qty: number;
  image: string;
  color?: string;
  size?: string;
}

export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus =
  | "Pending"
  | "Pending Verification"
  | "Verified"
  | "Paid"
  | "Failed"
  | "Refunded";

export interface Order {
  id: string;
  placedAt: string;
  items: OrderItem[];
  itemTotal: number;
  discount: number;
  deliveryCharge: number;
  coupon: string;
  couponDiscount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryBy: string;
  address: string;
  /** Recipient name stored with this order's shipping address. */
  addressName?: string;
  /** Recipient phone stored with this order's shipping address. */
  addressPhone?: string;
  paymentMethod: string;
  /** Courier partner, set when the order is dispatched. */
  courierName?: string;
  /** AWB / tracking number, set when the order is dispatched. */
  trackingNumber?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  createdAt: string;
}

/** Full mock user record including an obfuscated password hash (demo only). */
export interface MockUser extends User {
  passwordHash: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  /**
   * True when sign-up succeeded but Supabase requires email confirmation before
   * a session exists ("Confirm email" enabled on the project). Callers should
   * prompt the user to confirm rather than assuming they are logged in.
   */
  needsEmailConfirmation?: boolean;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export type AppNotificationType =
  | "order"
  | "shipped"
  | "stock"
  | "offer"
  | "price"
  | "delivery";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface QAItem {
  id: string;
  author: string;
  question: string;
  answer?: string;
  date: string;
}

export type ReturnStatus = "Return Requested" | "Approved" | "Picked Up" | "Refunded";

export interface ReturnRecord {
  orderId: string;
  reason: string;
  status: ReturnStatus;
  requestedAt: string;
}

export type Theme = "light" | "dark";