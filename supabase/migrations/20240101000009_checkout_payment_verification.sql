-- ============================================================================
-- CHECKOUT PAYMENT VERIFICATION  (UTR collected BEFORE an order exists)
-- ============================================================================
--
-- New flow for ONLINE payment methods (anything that is not Cash on Delivery):
--
--   customer checkout
--     -> submit_payment_verification()   creates a PENDING payment_verifications
--        row (UTR + cart snapshot + server-computed totals). NO order row is
--        written; the customer's cart is cleared, exactly as checkout would.
--     -> admin reviews the UTR in /admin/payments
--          * approve_payment_verification() re-quotes from live product data,
--            creates the order EXACTLY ONCE (Placed + payment Verified) and
--            marks the payments row verified.
--          * reject_payment_verification() creates NO order and restores the
--            customer's cart so they can retry.
--
-- `payment_verifications` is deliberately a separate table from `orders`: a
-- pending submission is NOT an order and must never be treated as one.
--
-- Security / reliability properties enforced here (not in the browser):
--   * only an authenticated caller may submit, and only for their own session,
--   * COD/unknown methods can never enter this queue,
--   * the UTR is validated and may not be reused while pending/approved,
--   * at most ONE pending submission per customer (partial unique index),
--   * prices, variants, stock and totals are computed from live DB data,
--   * approval/rejection are admin-only, row-locked and idempotent,
--   * a BEFORE INSERT trigger makes it impossible to create an order for an
--     online payment method unless an APPROVED verification claims that exact
--     order id — so no client, RPC call or direct table write can bypass the
--     admin verification step.

-- ----------------------------------------------------------------------------
-- 1. payment_verifications
-- ----------------------------------------------------------------------------
-- `order_id` is NULL while pending and is claimed exactly once at approval
-- (unique). The FK is DEFERRABLE INITIALLY DEFERRED because approval claims
-- the id immediately BEFORE inserting the orders row inside one transaction;
-- it is still validated at COMMIT, so a dangling link can never be persisted.
CREATE TABLE IF NOT EXISTS public.payment_verifications (
  id                 text PRIMARY KEY,
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected')),
  utr_number         text NOT NULL,
  payment_method     text NOT NULL,           -- raw checkout label ("UPI", "Credit / Debit Card", ...)
  payment_method_key text NOT NULL,           -- canonical key (upi / card / netbanking / ...)
  customer_name      text NOT NULL,
  customer_email     text,
  customer_phone     text NOT NULL,
  items              jsonb NOT NULL,          -- {product_id, quantity, color, size}[] snapshot
  shipping           jsonb NOT NULL,          -- delivery address snapshot
  coupon             text,
  subtotal           numeric(12,2) NOT NULL DEFAULT 0,
  discount           numeric(12,2) NOT NULL DEFAULT 0,
  shipping_fee       numeric(12,2) NOT NULL DEFAULT 0,
  coupon_discount    numeric(12,2) NOT NULL DEFAULT 0,
  total              numeric(12,2) NOT NULL DEFAULT 0,
  order_id           text
                       REFERENCES public.orders(id) ON DELETE SET NULL
                       DEFERRABLE INITIALLY DEFERRED,
  rejection_reason   text,
  decided_by         text,
  decided_at         timestamptz,
  submitted_at       timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_verifications_order_unique UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS payment_verifications_user_id_idx
  ON public.payment_verifications (user_id);
CREATE INDEX IF NOT EXISTS payment_verifications_status_idx
  ON public.payment_verifications (status);
CREATE INDEX IF NOT EXISTS payment_verifications_submitted_at_idx
  ON public.payment_verifications (submitted_at DESC);

-- At most ONE pending submission per customer: a second checkout submission
-- while one is awaiting review is rejected by the database itself.
CREATE UNIQUE INDEX IF NOT EXISTS payment_verifications_one_pending_per_user
  ON public.payment_verifications (user_id)
  WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- 2. Row Level Security
-- ----------------------------------------------------------------------------
-- Customers may READ their own submissions (to see pending / rejected status).
-- There is deliberately no client INSERT/UPDATE/DELETE policy: every write goes
-- through the SECURITY DEFINER functions below. Admin reads use the service
-- role on the server (RLS-bypassing) behind requireAdmin().
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment verifications" ON public.payment_verifications;
CREATE POLICY "Users can view own payment verifications" ON public.payment_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. pv_quote  — authoritative pricing / stock / totals
-- ----------------------------------------------------------------------------
-- Mirrors the item loop + coupon/shipping rules of public.create_order so a
-- verification is priced exactly the way an order would be. The caller never
-- supplies a price, total or stock figure: everything is read live here.
CREATE OR REPLACE FUNCTION public.pv_quote(p_items jsonb, p_coupon text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item            jsonb;
  v_lines           jsonb := '[]'::jsonb;
  v_product_id      text;
  v_qty             bigint;
  v_color           text;
  v_size            text;
  v_price           numeric(12,2);
  v_mrp             numeric(12,2);
  v_stock           integer;
  v_status          text;
  v_name            text;
  v_image           text;
  v_sku             text;
  v_variant_label   text;
  v_variant         record;
  v_subtotal        numeric(12,2) := 0;
  v_mrp_total       numeric(12,2) := 0;
  v_discount        numeric(12,2) := 0;
  v_shipping_fee    numeric(12,2) := 0;
  v_coupon_discount numeric(12,2) := 0;
  v_total           numeric(12,2) := 0;
  v_coupon          record;

  -- Same storefront rule as create_order (FREE_DELIVERY_THRESHOLD / DELIVERY_CHARGE).
  c_free_shipping_threshold constant numeric(12,2) := 499;
  c_standard_shipping_fee  constant numeric(12,2) := 50;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := v_item->>'product_id';
    v_qty := COALESCE((v_item->>'quantity')::bigint, 0);
    v_color := NULLIF(trim(COALESCE(v_item->>'color', '')), '');
    v_size := NULLIF(trim(COALESCE(v_item->>'size', '')), '');

    IF v_product_id IS NULL OR v_qty <= 0 OR v_qty > 1000 THEN
      RAISE EXCEPTION 'invalid_item';
    END IF;

    SELECT name, price, mrp, stock, status, images[1]
      INTO v_name, v_price, v_mrp, v_stock, v_status, v_image
    FROM products
    WHERE id = v_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found';
    END IF;

    IF v_status IS DISTINCT FROM 'live' THEN
      RAISE EXCEPTION 'product_unavailable';
    END IF;

    v_sku := NULL;
    v_variant_label := COALESCE(v_color, '') || ' / ' || COALESCE(v_size, '');

    IF EXISTS (SELECT 1 FROM product_variants WHERE product_id = v_product_id) THEN
      SELECT sku, price_override, stock
        INTO v_variant
      FROM product_variants
      WHERE product_id = v_product_id
        AND (v_size IS NULL OR size = v_size)
        AND (v_color IS NULL OR color = v_color)
      LIMIT 1;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_variant';
      END IF;

      v_sku := v_variant.sku;
      IF v_variant.stock IS NOT NULL THEN
        v_stock := v_variant.stock;
      END IF;
      IF v_variant.price_override IS NOT NULL THEN
        v_price := v_variant.price_override;
      END IF;
    END IF;

    -- Stock is validated but NOT decremented here — matching create_order's
    -- existing semantics (stock is deducted later by confirm_order).
    IF v_stock IS NULL OR v_stock < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock:%', v_name;
    END IF;

    v_subtotal := v_subtotal + (v_price * v_qty);
    v_mrp_total := v_mrp_total + (v_mrp * v_qty);

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product_id,
      'name', v_name,
      'sku', COALESCE(v_sku, v_product_id),
      'variant', v_variant_label,
      'price', v_price,
      'quantity', v_qty,
      'image', v_image
    );
  END LOOP;

  v_discount := GREATEST(v_mrp_total - v_subtotal, 0);
  v_shipping_fee := CASE
    WHEN v_subtotal >= c_free_shipping_threshold THEN 0
    ELSE c_standard_shipping_fee
  END;

  IF p_coupon IS NOT NULL AND length(trim(p_coupon)) > 0 THEN
    SELECT *
      INTO v_coupon
    FROM coupons
    WHERE upper(code) = upper(trim(p_coupon))
      AND active = true
      AND (start_date IS NULL OR start_date <= CURRENT_DATE)
      AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
      AND (usage_limit IS NULL OR used_count < usage_limit)
    LIMIT 1;

    IF FOUND AND v_subtotal >= COALESCE(v_coupon.min_order, 0) THEN
      IF v_coupon.discount_type = 'percentage' THEN
        v_coupon_discount := round(v_subtotal * COALESCE(v_coupon.discount_value, 0) / 100.0, 2);
        IF v_coupon.max_discount_cap IS NOT NULL THEN
          v_coupon_discount := LEAST(v_coupon_discount, v_coupon.max_discount_cap);
        END IF;
      ELSE
        v_coupon_discount := COALESCE(v_coupon.discount_value, 0);
      END IF;
    END IF;
  END IF;

  v_coupon_discount := LEAST(GREATEST(v_coupon_discount, 0), v_subtotal);
  v_total := GREATEST(v_subtotal + v_shipping_fee - v_coupon_discount, 0);

  RETURN jsonb_build_object(
    'lines', v_lines,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'shipping_fee', v_shipping_fee,
    'coupon_discount', v_coupon_discount,
    'total', v_total
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. submit_payment_verification  (customer, pre-order)
-- ----------------------------------------------------------------------------
-- Validates the checkout payload, prices it from live data and records a
-- PENDING verification. It NEVER creates an order and never marks anything as
-- paid — only approve_payment_verification() creates the order.
CREATE OR REPLACE FUNCTION public.submit_payment_verification(
  p_items jsonb,
  p_shipping jsonb,
  p_payment_method text,
  p_coupon text DEFAULT NULL,
  p_utr text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_utr        text := upper(trim(COALESCE(p_utr, '')));
  v_quote      jsonb;
  v_id         text;
  v_name       text;
  v_email      text;
  v_mobile     text;
  v_status     text;
  v_now        timestamptz := now();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Online payment only: COD (or a blank/unknown method) never enters this
  -- queue and must go through the regular COD checkout.
  IF NULLIF(trim(COALESCE(p_payment_method, '')), '') IS NULL
     OR NOT public.order_requires_online_payment(p_payment_method) THEN
    RAISE EXCEPTION 'not_required';
  END IF;

  -- UTR/reference validation: 6-30 alphanumeric characters (dashes allowed).
  IF v_utr = '' OR v_utr !~ '^[A-Z0-9-]{6,30}$' THEN
    RAISE EXCEPTION 'invalid_utr';
  END IF;

  -- Delivery address is required (same rules as create_order).
  IF NULLIF(trim(COALESCE(p_shipping->>'name', '')), '') IS NULL
     OR NULLIF(trim(COALESCE(p_shipping->>'phone', '')), '') IS NULL
     OR NULLIF(trim(COALESCE(p_shipping->>'line1', '')), '') IS NULL
     OR NULLIF(trim(COALESCE(p_shipping->>'city', '')), '') IS NULL
     OR NULLIF(trim(COALESCE(p_shipping->>'state', '')), '') IS NULL
     OR NULLIF(trim(COALESCE(p_shipping->>'pincode', '')), '') IS NULL THEN
    RAISE EXCEPTION 'invalid_address';
  END IF;

  SELECT name, email, mobile, status
    INTO v_name, v_email, v_mobile, v_status
  FROM profiles
  WHERE id = v_uid;

  IF v_status = 'blocked' THEN
    RAISE EXCEPTION 'blocked';
  END IF;

  -- One live submission at a time (also enforced by the partial unique index).
  IF EXISTS (
    SELECT 1 FROM payment_verifications
    WHERE user_id = v_uid AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'already_pending';
  END IF;

  -- A reference may not be reused while it is pending/approved elsewhere, nor
  -- on any existing payment record. (EXISTS — not a value comparison — because
  -- order_id is NULL on pending rows.)
  IF EXISTS (
    SELECT 1 FROM payment_verifications
    WHERE upper(utr_number) = v_utr AND status <> 'rejected'
  ) THEN
    RAISE EXCEPTION 'duplicate_utr';
  END IF;

  IF EXISTS (
    SELECT 1 FROM payments
    WHERE upper(COALESCE(utr_number, '')) = v_utr
  ) THEN
    RAISE EXCEPTION 'duplicate_utr';
  END IF;

  -- Server-side pricing/stock validation; raises on bad items or stock.
  v_quote := public.pv_quote(p_items, p_coupon);

  v_id := 'PVER-' || to_char(v_now, 'YYYYMMDD-HH24MISS') || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  BEGIN
    INSERT INTO payment_verifications (
      id, user_id, status, utr_number, payment_method, payment_method_key,
      customer_name, customer_email, customer_phone,
      items, shipping, coupon,
      subtotal, discount, shipping_fee, coupon_discount, total,
      submitted_at, updated_at
    ) VALUES (
      v_id, v_uid, 'pending', v_utr,
      trim(p_payment_method), public.payment_method_key(p_payment_method),
      COALESCE(NULLIF(trim(v_name), ''), p_shipping->>'name'),
      COALESCE(v_email, NULLIF(trim(p_shipping->>'email', ''), '')),
      COALESCE(NULLIF(trim(v_mobile), ''), p_shipping->>'phone'),
      p_items, p_shipping, NULLIF(trim(COALESCE(p_coupon, '')), ''),
      (v_quote->>'subtotal')::numeric,
      (v_quote->>'discount')::numeric,
      (v_quote->>'shipping_fee')::numeric,
      (v_quote->>'coupon_discount')::numeric,
      (v_quote->>'total')::numeric,
      v_now, v_now
    );
  EXCEPTION WHEN unique_violation THEN
    -- Either the one-pending-per-user index or an id collision: both mean a
    -- submission already exists, never a duplicate row.
    RAISE EXCEPTION 'already_pending';
  END;

  -- Checkout is complete: the captured items leave the cart (mirrors the
  -- cart clearing in create_order). A rejection restores them.
  DELETE FROM cart_items WHERE user_id = v_uid;

  RETURN jsonb_build_object(
    'success', true,
    'verification_id', v_id,
    'total', (v_quote->>'total')::numeric
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. approve_payment_verification  (admin; atomic; idempotent)
-- ----------------------------------------------------------------------------
-- Creates the order EXACTLY ONCE for a pending submission. Re-quotes from live
-- product data first (prices/stock/coupon are re-validated at approval time),
-- claims the order id on the verification row (which is what the orders insert
-- trigger checks), then writes order + items + address + timeline + the
-- verified `payments` row — all in one transaction.
CREATE OR REPLACE FUNCTION public.approve_payment_verification(
  p_verification_id text,
  p_staff_name text DEFAULT 'Admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_role  text;
  v_ver   record;
  v_quote jsonb;
  v_lines jsonb;
  v_order_id text;
  v_now   timestamptz := now();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_ver
  FROM payment_verifications
  WHERE id = p_verification_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  -- Idempotency: a second approval (double-click, retry, second tab) returns
  -- the SAME order instead of creating another one.
  IF v_ver.status = 'approved' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_approved', true,
      'order_id', v_ver.order_id
    );
  END IF;

  IF v_ver.status = 'rejected' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_rejected');
  END IF;

  -- Re-price and re-check stock against LIVE data at approval time.
  v_quote := public.pv_quote(v_ver.items, v_ver.coupon);
  v_lines := v_quote->'lines';

  v_order_id := 'ORD-' || to_char(v_now, 'YYYYMMDD') || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- Claim the order id BEFORE the insert: the orders BEFORE INSERT trigger
  -- only lets an online-payment order through when an APPROVED verification
  -- holds this exact id. (FK is deferrable, validated at COMMIT.)
  UPDATE payment_verifications
     SET status = 'approved',
         order_id = v_order_id,
         decided_by = p_staff_name,
         decided_at = v_now,
         rejection_reason = NULL,
         subtotal = (v_quote->>'subtotal')::numeric,
         discount = (v_quote->>'discount')::numeric,
         shipping_fee = (v_quote->>'shipping_fee')::numeric,
         coupon_discount = (v_quote->>'coupon_discount')::numeric,
         total = (v_quote->>'total')::numeric,
         updated_at = v_now
   WHERE id = p_verification_id;

  INSERT INTO orders (
    id, user_id, customer_name, customer_email, customer_phone,
    subtotal, discount, shipping_fee, tax_amount, total,
    payment_method, payment_status, order_status, utr_number,
    placed_at, updated_at
  ) VALUES (
    v_order_id, v_ver.user_id, v_ver.customer_name, v_ver.customer_email, v_ver.customer_phone,
    (v_quote->>'subtotal')::numeric,
    (v_quote->>'discount')::numeric,
    (v_quote->>'shipping_fee')::numeric,
    0,
    (v_quote->>'total')::numeric,
    v_ver.payment_method,
    'Verified', 'Placed', v_ver.utr_number,
    v_now, v_now
  );

  INSERT INTO order_items (order_id, product_id, name, sku, variant, price, quantity, image)
  SELECT v_order_id,
         l->>'product_id',
         l->>'name',
         l->>'sku',
         l->>'variant',
         (l->>'price')::numeric,
         (l->>'quantity')::integer,
         l->>'image'
  FROM jsonb_array_elements(v_lines) AS l;

  INSERT INTO order_shipping_addresses (order_id, name, phone, line1, line2, city, state, pincode)
  VALUES (
    v_order_id,
    v_ver.shipping->>'name',
    v_ver.shipping->>'phone',
    v_ver.shipping->>'line1',
    NULLIF(trim(COALESCE(v_ver.shipping->>'line2', '')), ''),
    v_ver.shipping->>'city',
    v_ver.shipping->>'state',
    v_ver.shipping->>'pincode'
  );

  INSERT INTO order_timeline (order_id, status, timestamp, note, staff_name)
  VALUES
    (v_order_id, 'Payment Verified', v_now,
     'UTR ' || v_ver.utr_number || ' approved by ' || COALESCE(p_staff_name, 'Admin'), p_staff_name),
    (v_order_id, 'Placed', v_now, 'Order placed after payment verification', p_staff_name);

  -- The order-creation trigger queued this payment as 'awaiting_reference';
  -- acceptance marks it verified (amount refreshed to the re-quoted total).
  UPDATE payments
     SET status = 'verified',
         utr_number = v_ver.utr_number,
         amount = (v_quote->>'total')::numeric,
         verified_at = v_now,
         verified_by = p_staff_name,
         rejection_reason = NULL
   WHERE order_id = v_order_id;

  IF NOT FOUND THEN
    INSERT INTO payments (
      id, order_id, customer_name, customer_phone, amount, utr_number,
      payment_method, submitted_at, status, verified_at, verified_by
    ) VALUES (
      'PAY-' || to_char(v_now, 'YYYYMMDDHH24MISS') || '-'
        || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
      v_order_id, v_ver.customer_name, v_ver.customer_phone,
      (v_quote->>'total')::numeric, v_ver.utr_number,
      v_ver.payment_method_key, v_now, 'verified', v_now, p_staff_name
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_approved', false,
    'order_id', v_order_id
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. reject_payment_verification  (admin; atomic; idempotent)
-- ----------------------------------------------------------------------------
-- Rejecting NEVER creates an order. The customer's captured cart items are
-- restored (only where still missing) so they can retry checkout.
CREATE OR REPLACE FUNCTION public.reject_payment_verification(
  p_verification_id text,
  p_reason text DEFAULT NULL,
  p_staff_name text DEFAULT 'Admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_role   text;
  v_ver    record;
  v_reason text := NULLIF(trim(COALESCE(p_reason, '')), '');
  v_now    timestamptz := now();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_ver
  FROM payment_verifications
  WHERE id = p_verification_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  -- Idempotency: rejecting twice is a no-op; an approved submission can never
  -- be rejected (its order already exists).
  IF v_ver.status = 'rejected' THEN
    RETURN jsonb_build_object('success', true, 'already_rejected', true, 'order_id', v_ver.order_id);
  END IF;

  IF v_ver.status = 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_approved', 'order_id', v_ver.order_id);
  END IF;

  UPDATE payment_verifications
     SET status = 'rejected',
         rejection_reason = v_reason,
         decided_by = p_staff_name,
         decided_at = v_now,
         updated_at = v_now
   WHERE id = p_verification_id;

  -- Restore the cart (items that are still live products and not already in
  -- the cart). This is the customer's "next step" after a rejection.
  INSERT INTO cart_items (user_id, product_id, quantity, color, size)
  SELECT v_ver.user_id,
         i->>'product_id',
         GREATEST(COALESCE((i->>'quantity')::integer, 1), 1),
         NULLIF(trim(COALESCE(i->>'color', '')), ''),
         NULLIF(trim(COALESCE(i->>'size', '')), '')
  FROM jsonb_array_elements(v_ver.items) AS i
  WHERE EXISTS (
          SELECT 1 FROM products p
          WHERE p.id = i->>'product_id' AND p.status = 'live'
        )
    AND NOT EXISTS (
          SELECT 1 FROM cart_items c
          WHERE c.user_id = v_ver.user_id
            AND c.product_id = i->>'product_id'
            AND COALESCE(c.color, '') = COALESCE(NULLIF(trim(COALESCE(i->>'color', '')), ''), '')
            AND COALESCE(c.size, '')  = COALESCE(NULLIF(trim(COALESCE(i->>'size', '')), ''), '')
        );

  RETURN jsonb_build_object('success', true, 'already_rejected', false, 'order_id', NULL);
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. GUARD: no online-payment order without an approved verification
-- ----------------------------------------------------------------------------
-- Applies to EVERY insert path (create_order, direct table writes, any future
-- code). COD and blank/unknown methods are unaffected, so the existing COD
-- flow keeps working unchanged.
CREATE OR REPLACE FUNCTION public.block_unverified_online_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.order_requires_online_payment(NEW.payment_method)
     AND NOT EXISTS (
       SELECT 1 FROM payment_verifications pv
       WHERE pv.order_id = NEW.id
         AND pv.status = 'approved'
     ) THEN
    RAISE EXCEPTION 'online_payment_verification_required';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_unverified_online_order ON public.orders;
CREATE TRIGGER block_unverified_online_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.block_unverified_online_order();

-- ----------------------------------------------------------------------------
-- 8. Close the direct-insert hole on orders
-- ----------------------------------------------------------------------------
-- 20240101000000_enable_rls_and_policies.sql allowed customers to INSERT their
-- own orders row directly, contradicting the documented design in
-- 20240101000002_secure_checkout.sql (orders are written only by the
-- SECURITY DEFINER checkout/approval functions, which run as the owner and are
-- unaffected by this policy). Denying direct inserts also means no client can
-- conjure an online-payment order outside payment verification.
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users cannot insert orders directly" ON public.orders;
CREATE POLICY "Users cannot insert orders directly" ON public.orders
  FOR INSERT
  WITH CHECK (false);

-- ----------------------------------------------------------------------------
-- 9. Exposure: only authenticated callers, each function authorizes itself.
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.submit_payment_verification(jsonb, jsonb, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_payment_verification(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_payment_verification(text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_payment_verification(jsonb, jsonb, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_payment_verification(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payment_verification(text, text, text) TO authenticated;