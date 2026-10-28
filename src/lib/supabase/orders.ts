import { supabase } from './client';
import type { Order, OrderItem } from '@/lib/types';

/**
 * Customer-facing order reads.
 *
 * These use the browser (anon/authenticated) client and are constrained by RLS
 * to the signed-in user's own orders.
 *
 * NOTE: order creation and cancellation are NOT here. They are privileged,
 * multi-row writes that RLS intentionally blocks from the browser, so they run
 * through the `placeOrderSecure` / `cancelOrderSecure` server actions, which
 * delegate to the `create_order` / `cancel_order` Postgres functions. See
 * `src/app/actions/orders.ts`.
 */

/**
 * Get user's orders.
 *
 * Returns `null` on a FAILED request (so a transient error never clobbers the
 * customer's already-loaded orders with an empty list) and `[]` only for a
 * genuinely empty result.
 */
export async function getOrders(userId: string): Promise<Order[] | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        placed_at,
        subtotal,
        discount,
        shipping_fee,
        total,
        order_status,
        payment_status,
        payment_method,
        courier_name,
        tracking_number,
        order_items (id, product_id, name, price, quantity, image, variant),
        order_shipping_addresses (id, name, phone, line1, line2, landmark, city, state, pincode)
      `)
      .eq('user_id', userId)
      .order('placed_at', { ascending: false });

    if (error) throw error;

    return data.map(transformOrder);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return null;
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        placed_at,
        subtotal,
        discount,
        shipping_fee,
        total,
        order_status,
        payment_status,
        payment_method,
        courier_name,
        tracking_number,
        order_items (id, product_id, name, price, quantity, image, variant),
        order_shipping_addresses (id, name, phone, line1, line2, landmark, city, state, pincode)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return transformOrder(data);
  } catch (error) {
    return null;
  }
}

/**
 * Transform database order to app order format
 */
function transformOrder(data: any): Order {
  const items: OrderItem[] = data.order_items?.map((item: any) => {
    const variantParts = (item.variant ?? '').split(' / ');
    return {
      productId: item.product_id,
      name: item.name,
      brand: item.name.split(' ')[0] || '', // Extract brand from name
      price: Number(item.price),
      qty: item.quantity,
      image: item.image,
      color: variantParts[0] || undefined,
      size: variantParts[1] || undefined,
    };
  }) ?? [];

  // PostgREST returns this one-to-one embed (UNIQUE order_id) as an OBJECT,
  // not an array — normalise both shapes so the saved address is never dropped.
  const shippingAddress = Array.isArray(data.order_shipping_addresses)
    ? data.order_shipping_addresses[0]
    : data.order_shipping_addresses;
  const addressString = shippingAddress
    ? `${shippingAddress.line1}${shippingAddress.line2 ? ', ' + shippingAddress.line2 : ''}${shippingAddress.landmark ? ', ' + shippingAddress.landmark : ''}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`
    : '';

  return {
    id: data.id,
    placedAt: data.placed_at,
    items,
    itemTotal: Number(data.subtotal),
    discount: Number(data.discount),
    deliveryCharge: Number(data.shipping_fee),
    // The orders table has no coupon columns. Any coupon discount is already
    // folded into the server-computed `total`, so it is not persisted here.
    coupon: '',
    couponDiscount: 0,
    total: Number(data.total),
    status: data.order_status as any,
    paymentStatus: data.payment_status as any,
    deliveryBy: new Date(new Date(data.placed_at).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    address: addressString,
    // Recipient + contact exactly as captured at checkout (from the order's own
    // shipping-address row — never the customer's current profile address).
    addressName: shippingAddress?.name ?? undefined,
    addressPhone: shippingAddress?.phone ?? undefined,
    paymentMethod: data.payment_method,
    courierName: data.courier_name ?? undefined,
    trackingNumber: data.tracking_number ?? undefined,
  };
}
