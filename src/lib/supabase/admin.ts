import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { AdminOrder, AdminPayment, AdminPaymentVerification, AdminCoupon, AdminCustomer, AdminBanner, AnnouncementBarItem, YouTubeVideoItem, AdminSettings, StaffMember, AuditLogEntry, CategoryFilter, StockLedgerEntry } from '@/lib/adminTypes';

// Server-only admin client using the service-role key.
//
// SECURITY: this module must never be imported by a Client Component (or any
// module reachable from the browser bundle). The `server-only` import above
// makes Next.js fail the build if that ever happens. The service-role key
// bypasses Row Level Security, so every caller must first be authorized with
// `requireAdmin()` (see src/lib/supabase/require-admin.ts) on the server.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export { adminSupabase };

/**
 * Get all orders (admin)
 */
export async function getAllOrders(): Promise<AdminOrder[]> {
  try {
    const { data, error } = await adminSupabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_shipping_addresses (*),
        order_timeline (*)
      `)
      .order('placed_at', { ascending: false });

    if (error) throw error;

    return data.map(transformAdminOrder);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Get a single order with its items/address/timeline (admin).
 *
 * Used to return the authoritative post-mutation state so the admin UI can
 * update one row instead of refetching the whole order list.
 */
export async function getOrderById(id: string): Promise<AdminOrder | null> {
  try {
    const { data, error } = await adminSupabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_shipping_addresses (*),
        order_timeline (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return transformAdminOrder(data);
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Get a single payment (admin).
 */
export async function getPaymentById(id: string): Promise<AdminPayment | null> {
  try {
    const { data, error } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return transformPayment(data);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return null;
  }
}

/**
 * Get pending payments (admin)
 */
export async function getPayments(): Promise<AdminPayment[]> {
  try {
    const { data, error } = await adminSupabase
      .from('payments')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return data.map(transformPayment);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

/**
 * Get all checkout payment verifications (admin).
 *
 * These are the pre-order UTR submissions: `pending` rows have NO order yet
 * and are what the admin accepts/rejects from /admin/payments.
 */
export async function getPaymentVerifications(): Promise<AdminPaymentVerification[]> {
  try {
    const { data, error } = await adminSupabase
      .from('payment_verifications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map(transformPaymentVerification);
  } catch (error) {
    console.error('Error fetching payment verifications:', error);
    return [];
  }
}

/** Get one checkout payment verification by id (admin). */
export async function getPaymentVerificationById(id: string): Promise<AdminPaymentVerification | null> {
  try {
    const { data, error } = await adminSupabase
      .from('payment_verifications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    return data ? transformPaymentVerification(data) : null;
  } catch (error) {
    console.error('Error fetching payment verification:', error);
    return null;
  }
}

/**
 * Get all customers (admin)
 */
export async function getCustomers(): Promise<AdminCustomer[]> {
  try {
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(transformCustomer);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

/**
 * Get all coupons (admin)
 */
export async function getCoupons(): Promise<AdminCoupon[]> {
  try {
    const { data, error } = await adminSupabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(transformCoupon);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
}

/**
 * Create coupon (admin)
 */
export async function createCoupon(
  coupon: Omit<AdminCoupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>
): Promise<AdminCoupon | null> {
  try {
    const now = new Date().toISOString();
    const id = `CPN-${Date.now()}`;

    const { data, error } = await adminSupabase
      .from('coupons')
      .insert({
        id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discountType,
        discount_value: coupon.discountValue,
        min_order: coupon.minOrder,
        max_discount_cap: coupon.maxDiscountCap,
        start_date: coupon.startDate,
        expiry_date: coupon.expiryDate,
        usage_limit: coupon.usageLimit,
        used_count: 0,
        active: coupon.active,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    return transformCoupon(data);
  } catch (error) {
    console.error('Error creating coupon:', error);
    return null;
  }
}

/**
 * Update coupon (admin)
 */
export async function updateCoupon(
  id: string,
  coupon: Partial<AdminCoupon>
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    const { error } = await adminSupabase
      .from('coupons')
      .update({
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discountType,
        discount_value: coupon.discountValue,
        min_order: coupon.minOrder,
        max_discount_cap: coupon.maxDiscountCap,
        start_date: coupon.startDate,
        expiry_date: coupon.expiryDate,
        usage_limit: coupon.usageLimit,
        active: coupon.active,
        updated_at: now,
      })
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating coupon:', error);
    return false;
  }
}

/**
 * Delete coupon (admin)
 */
export async function deleteCoupon(id: string): Promise<boolean> {
  try {
    const { error } = await adminSupabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return false;
  }
}

/**
 * Get all staff (admin)
 */
export async function getStaff(): Promise<StaffMember[]> {
  try {
    const { data, error } = await adminSupabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(transformStaff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
}

/**
 * Add staff (admin)
 */
export async function addStaff(
  staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StaffMember | null> {
  try {
    const now = new Date().toISOString();
    const id = `STF-${Date.now()}`;

    const { data, error } = await adminSupabase
      .from('staff')
      .insert({
        id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        avatar: staff.avatar,
        last_active: staff.lastActive,
        status: staff.status,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    return transformStaff(data);
  } catch (error) {
    console.error('Error adding staff:', error);
    return null;
  }
}

/**
 * Delete staff (admin)
 */
export async function deleteStaff(id: string): Promise<boolean> {
  try {
    const { error } = await adminSupabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting staff:', error);
    return false;
  }
}

/**
 * Get audit logs (admin)
 */
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await adminSupabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    return data.map(transformAuditLog);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Create audit log
 */
export async function createAuditLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    await adminSupabase.from('audit_logs').insert({
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      staff_name: log.staffName,
      role: log.role,
      module: log.module,
      action: log.action,
      description: log.description,
      ip_address: log.ipAddress,
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

/**
 * Get stock ledger (admin)
 */
export async function getStockLedger(): Promise<StockLedgerEntry[]> {
  try {
    const { data, error } = await adminSupabase
      .from('stock_ledger')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    return data.map(transformStockLedger);
  } catch (error) {
    console.error('Error fetching stock ledger:', error);
    return [];
  }
}

/**
 * Get settings (admin)
 */
export async function getSettings(): Promise<AdminSettings | null> {
  try {
    const { data, error } = await adminSupabase
      .from('settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) throw error;

    return transformSettings(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

/**
 * Update settings (admin)
 */
export async function updateSettings(settings: Partial<AdminSettings>): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    const { error } = await adminSupabase
      .from('settings')
      .update({
        store_name: settings.storeName,
        tagline: settings.tagline,
        support_email: settings.supportEmail,
        support_phone: settings.supportPhone,
        address: settings.address,
        upi_id: settings.upiId,
        upi_merchant_name: settings.upiMerchantName,
        qr_code_url: settings.qrCodeUrl,
        utr_length: settings.utrLength,
        free_shipping_threshold: settings.freeShippingThreshold,
        standard_shipping_fee: settings.standardShippingFee,
        express_shipping_fee: settings.expressShippingFee,
        gstin: settings.gstin,
        default_gst_rate: settings.defaultGstRate,
        prices_include_gst: settings.pricesIncludeGst,
        cart_timeout_minutes: settings.cartTimeoutMinutes,
        utr_expiry_hours: settings.utrExpiryHours,
        active_festive_theme: settings.activeFestiveTheme,
        notification_templates: settings.notificationTemplates,
        updated_at: now,
      })
      .eq('id', 'default');

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  }
}

/**
 * Get banners (admin)
 */
export async function getBanners(): Promise<AdminBanner[]> {
  try {
    const { data, error } = await adminSupabase
      .from('banners')
      .select('*')
      .order('order_num', { ascending: true });

    if (error) throw error;

    return data.map(transformBanner);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

/**
 * Save banner (admin)
 */
export async function saveBanner(
  banner: Partial<AdminBanner>
): Promise<AdminBanner | null> {
  try {
    const now = new Date().toISOString();
    const id = banner.id || `BAN-${Date.now()}`;

    const { data, error } = await adminSupabase
      .from('banners')
      .upsert({
        id,
        title: banner.title,
        subtitle: banner.subtitle,
        badge: banner.badge,
        image: banner.image,
        link: banner.link,
        button_text: banner.buttonText,
        active: banner.active,
        order_num: banner.order,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    return transformBanner(data);
  } catch (error) {
    console.error('Error saving banner:', error);
    return null;
  }
}

/**
 * Delete banner (admin)
 */
export async function deleteBanner(id: string): Promise<boolean> {
  try {
    const { error } = await adminSupabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting banner:', error);
    return false;
  }
}

/**
 * Get announcements (admin)
 */
export async function getAnnouncements(): Promise<AnnouncementBarItem[]> {
  try {
    const { data, error } = await adminSupabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((a: any) => ({
      id: a.id,
      text: a.text,
      active: a.active,
    }));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

/**
 * Save announcement (admin)
 */
export async function saveAnnouncement(
  announcement: Omit<AnnouncementBarItem, 'id'>
): Promise<AnnouncementBarItem | null> {
  try {
    const id = `ANN-${Date.now()}`;

    const { data, error } = await adminSupabase
      .from('announcements')
      .insert({
        id,
        text: announcement.text,
        active: announcement.active,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      text: data.text,
      active: data.active,
    };
  } catch (error) {
    console.error('Error saving announcement:', error);
    return null;
  }
}

/**
 * Delete announcement (admin)
 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    const { error } = await adminSupabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return false;
  }
}

/**
 * Get YouTube videos (admin)
 */
export async function getYoutubeVideos(): Promise<YouTubeVideoItem[]> {
  try {
    const { data, error } = await adminSupabase
      .from('youtube_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(transformYoutubeVideo);
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

/**
 * Save YouTube video (admin)
 */
export async function saveYoutubeVideo(
  video: Partial<YouTubeVideoItem>
): Promise<YouTubeVideoItem | null> {
  try {
    const now = new Date().toISOString();
    const id = video.id || `VID-${Date.now()}`;

    const { data, error } = await adminSupabase
      .from('youtube_videos')
      .upsert({
        id,
        title: video.title,
        video_id: video.videoId,
        thumbnail: video.thumbnail,
        duration: video.duration,
        views: video.views,
        active: video.active,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    return transformYoutubeVideo(data);
  } catch (error) {
    console.error('Error saving YouTube video:', error);
    return null;
  }
}

/**
 * Delete YouTube video (admin)
 */
export async function deleteYoutubeVideo(id: string): Promise<boolean> {
  try {
    const { error } = await adminSupabase
      .from('youtube_videos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting YouTube video:', error);
    return false;
  }
}

/**
 * Get category filters (admin)
 */
export async function getFilters(): Promise<CategoryFilter[]> {
  try {
    const { data, error } = await adminSupabase
      .from('category_filters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(transformFilter);
  } catch (error) {
    console.error('Error fetching filters:', error);
    return [];
  }
}

/**
 * Save filter (admin)
 */
export async function saveFilter(
  filter: Partial<CategoryFilter>
): Promise<CategoryFilter | null> {
  try {
    const now = new Date().toISOString();
    const id = filter.id || `FLT-${Date.now()}`;

    const { data, error } = await adminSupabase
      .from('category_filters')
      .upsert({
        id,
        name: filter.name,
        key: filter.key,
        target_categories: filter.targetCategories,
        type: filter.type,
        options: filter.options,
        active: filter.active,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    return transformFilter(data);
  } catch (error) {
    console.error('Error saving filter:', error);
    return null;
  }
}

/**
 * Delete filter (admin)
 */
export async function deleteFilter(id: string): Promise<boolean> {
  try {
    const { error } = await adminSupabase
      .from('category_filters')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting filter:', error);
    return false;
  }
}

// ----------------------------------------------------------------------------
// Subcategories (admin reads; writes live in the server actions)
// ----------------------------------------------------------------------------

// Subcategory nodes are NOT read from the database. They are derived from the
// `categories` table (`subcategories text[]`) by `buildSubcategoryOptions()` in
// `@/lib/catalogTaxonomy` — there is no `public.subcategories` table.

// Transform functions

function transformAdminOrder(data: any): AdminOrder {
  return {
    id: data.id,
    placedAt: data.placed_at,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    // PostgREST embeds this one-to-one relation (UNIQUE order_id) as a single
    // OBJECT, not an array — indexing [0] on it is undefined and would blank
    // every address. Normalise both shapes so either form maps correctly.
    shippingAddress:
      (Array.isArray(data.order_shipping_addresses)
        ? data.order_shipping_addresses[0]
        : data.order_shipping_addresses) || {},
    items: data.order_items?.map((item: any) => ({
      productId: item.product_id,
      name: item.name,
      sku: item.sku,
      variant: item.variant,
      price: Number(item.price),
      qty: item.quantity,
      image: item.image,
    })) ?? [],
    subtotal: Number(data.subtotal),
    discount: Number(data.discount),
    shippingFee: Number(data.shipping_fee),
    taxAmount: Number(data.tax_amount),
    total: Number(data.total),
    paymentMethod: data.payment_method,
    paymentStatus: data.payment_status,
    orderStatus: data.order_status,
    utrNumber: data.utr_number,
    paymentId: data.payment_id,
    courierName: data.courier_name,
    trackingNumber: data.tracking_number,
    trackingUrl: data.tracking_url,
    internalNotes: data.internal_notes,
    timeline: data.order_timeline?.map((t: any) => ({
      status: t.status,
      timestamp: t.timestamp,
      note: t.note,
      staff: t.staff_name,
    })) ?? [],
  };
}

function transformPaymentVerification(data: {
  id: string;
  status: AdminPaymentVerification["status"];
  user_id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone: string;
  total: number | string;
  utr_number?: string | null;
  payment_method: string;
  payment_method_key: string;
  items?: AdminPaymentVerification["items"];
  shipping?: AdminPaymentVerification["shipping"] | null;
  coupon?: string | null;
  order_id?: string | null;
  rejection_reason?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  submitted_at: string;
}): AdminPaymentVerification {
  return {
    id: data.id,
    status: data.status,
    userId: data.user_id,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    amount: Number(data.total ?? 0),
    utrNumber: data.utr_number ?? '',
    paymentMethod: data.payment_method,
    paymentMethodKey: data.payment_method_key,
    items: data.items ?? [],
    shipping: data.shipping ?? ({} as AdminPaymentVerification["shipping"]),
    coupon: data.coupon,
    orderId: data.order_id,
    rejectionReason: data.rejection_reason,
    decidedBy: data.decided_by,
    decidedAt: data.decided_at,
    submittedAt: data.submitted_at,
  };
}

function transformPayment(data: any): AdminPayment {
  return {
    id: data.id,
    orderId: data.order_id,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    amount: Number(data.amount),
    // A row created at order time has no UTR yet — never surface null, so the
    // admin UI's `.includes`/`.length` usages stay safe.
    utrNumber: data.utr_number ?? "",
    paymentMethod: data.payment_method,
    screenshotUrl: data.screenshot_url,
    submittedAt: data.submitted_at,
    status: data.status,
    isDuplicateUtr: data.is_duplicate_utr,
    duplicateOrderId: data.duplicate_order_id,
    verifiedAt: data.verified_at,
    verifiedBy: data.verified_by,
    rejectionReason: data.rejection_reason,
    expiresAt: data.expires_at,
  };
}

function transformCustomer(data: any): AdminCustomer {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.mobile,
    totalOrders: 0,
    totalSpend: 0,
    joinedDate: data.created_at,
    lastOrderDate: data.created_at,
    status: data.status,
    blockReason: data.block_reason,
    addresses: [],
  };
}

function transformCoupon(data: any): AdminCoupon {
  return {
    id: data.id,
    code: data.code,
    description: data.description,
    discountType: data.discount_type,
    discountValue: Number(data.discount_value),
    minOrder: Number(data.min_order),
    maxDiscountCap: data.max_discount_cap ? Number(data.max_discount_cap) : undefined,
    startDate: data.start_date,
    expiryDate: data.expiry_date,
    usageLimit: data.usage_limit,
    usedCount: data.used_count,
    active: data.active,
  };
}

function transformStaff(data: any): StaffMember {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    avatar: data.avatar,
    lastActive: data.last_active,
    status: data.status,
  };
}

function transformAuditLog(data: any): AuditLogEntry {
  return {
    id: data.id,
    timestamp: data.timestamp,
    staffName: data.staff_name,
    role: data.role,
    module: data.module,
    action: data.action,
    description: data.description,
    ipAddress: data.ip_address,
  };
}

function transformStockLedger(data: any): StockLedgerEntry {
  return {
    id: data.id,
    timestamp: data.timestamp,
    productId: data.product_id,
    productName: data.product_name,
    variantSku: data.variant_sku,
    variantLabel: data.variant_label,
    type: data.type,
    change: data.change,
    previousStock: data.previous_stock,
    newStock: data.new_stock,
    reason: data.reason,
    staffName: data.staff_name,
    referenceId: data.reference_id,
  };
}

function transformSettings(data: any): AdminSettings {
  return {
    storeName: data.store_name,
    tagline: data.tagline,
    supportEmail: data.support_email,
    supportPhone: data.support_phone,
    address: data.address,
    upiId: data.upi_id,
    upiMerchantName: data.upi_merchant_name,
    qrCodeUrl: data.qr_code_url,
    utrLength: data.utr_length,
    freeShippingThreshold: Number(data.free_shipping_threshold),
    standardShippingFee: Number(data.standard_shipping_fee),
    expressShippingFee: Number(data.express_shipping_fee),
    gstin: data.gstin,
    defaultGstRate: Number(data.default_gst_rate),
    pricesIncludeGst: data.prices_include_gst,
    cartTimeoutMinutes: data.cart_timeout_minutes,
    utrExpiryHours: data.utr_expiry_hours,
    activeFestiveTheme: data.active_festive_theme,
    notificationTemplates: data.notification_templates,
  };
}

function transformBanner(data: any): AdminBanner {
  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle,
    badge: data.badge,
    image: data.image,
    link: data.link,
    buttonText: data.button_text,
    active: data.active,
    order: data.order_num,
  };
}

function transformYoutubeVideo(data: any): YouTubeVideoItem {
  return {
    id: data.id,
    title: data.title,
    videoId: data.video_id,
    thumbnail: data.thumbnail,
    duration: data.duration,
    views: data.views,
    active: data.active,
  };
}

function transformFilter(data: any): CategoryFilter {
  return {
    id: data.id,
    name: data.name,
    key: data.key,
    targetCategories: data.target_categories,
    type: data.type,
    options: data.options,
    active: data.active,
  };
}
