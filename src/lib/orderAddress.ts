import type { AdminOrder } from "@/lib/adminTypes";

/**
 * An order's OWN saved delivery address — the `order_shipping_addresses` row
 * created with the order (copied from the checkout / payment-verification
 * snapshot). Never the customer's current profile address.
 */
export type OrderAddress = AdminOrder["shippingAddress"];

const clean = (v?: string | null): string => (v ?? "").trim();

/**
 * True when the order carries any real saved address field. Used to decide
 * between rendering the address and showing "Address unavailable" — never a
 * fabricated or guessed value.
 */
export function hasOrderAddress(s: OrderAddress | null | undefined): boolean {
  if (!s) return false;
  return [s.name, s.phone, s.line1, s.line2, s.landmark, s.city, s.state, s.pincode].some(
    (field) => clean(field) !== ""
  );
}

/** House/street/area lines of the address, in form order (empties removed). */
export function orderAddressStreetLines(s: OrderAddress): string[] {
  return [s.line1, s.line2, s.landmark].map(clean).filter(Boolean);
}

/** "City, State - PIN" built only from the parts that exist. */
export function orderAddressLocality(s: OrderAddress): string {
  const statePin =
    clean(s.state) && clean(s.pincode)
      ? `${clean(s.state)} - ${clean(s.pincode)}`
      : clean(s.state) || clean(s.pincode);
  return [clean(s.city), statePin].filter(Boolean).join(", ");
}

/** Every display line of the address (street lines + locality). */
export function orderAddressLines(s: OrderAddress): string[] {
  return [...orderAddressStreetLines(s), orderAddressLocality(s)].filter(Boolean);
}

/** Compact preview for table cells: locality/area + city. */
export function orderAddressPreview(s: OrderAddress): string {
  const area = [clean(s.landmark), clean(s.line2), clean(s.line1)].filter(Boolean)[0] ?? "";
  return [area, clean(s.city)].filter(Boolean).join(", ");
}

/** Full address as plain text (copy-to-clipboard). */
export function formatOrderAddress(s: OrderAddress): string {
  return [clean(s.name), clean(s.phone), ...orderAddressLines(s)].filter(Boolean).join("\n");
}
