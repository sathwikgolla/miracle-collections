-- ============================================================================
-- FULL DELIVERY ADDRESS PERSISTENCE
-- ============================================================================
--
-- The checkout address form collects an "Area / Landmark" field, but until now
-- that value was dropped in two places:
--   1. order_shipping_addresses had no landmark column, so an approved order
--      could never carry the exact address the customer entered, and
--   2. approve_payment_verification() copied only name/phone/line1/line2/
--      city/state/pincode from the pending submission.
--
-- This migration is purely additive:
--   * a nullable `landmark` column (existing rows keep NULL — nothing is
--     rewritten, no historical order or profile address is touched),
--   * a CREATE OR REPLACE of approve_payment_verification() whose only
--     behaviour change is copying `shipping->>'landmark'` into that column.
--     The function's signature, admin role check, row lock, idempotency and
--     exactly-once order creation are unchanged, so existing grants and the
--     verification guard still apply.

-- ----------------------------------------------------------------------------
-- 1. Nullable landmark column on the order's shipping-address record
-- ----------------------------------------------------------------------------
ALTER TABLE public.order_shipping_addresses
  ADD COLUMN IF NOT EXISTS landmark text;

-- ----------------------------------------------------------------------------
-- 2. Approval copies the COMPLETE checkout address into the order
-- ----------------------------------------------------------------------------
-- Verbatim re-issue of public.approve_payment_verification from
-- 20240101000009_checkout_payment_verification.sql with only the
-- order_shipping_addresses insert extended by `landmark`. Everything else —
-- auth.uid() check, profiles.role = 'admin' check, SELECT ... FOR UPDATE,
-- idempotent early returns, pv_quote re-pricing, the order-id claim that the
-- orders BEFORE INSERT trigger validates, and the payments upsert — is
-- intentionally identical.
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

  -- The COMPLETE checkout address (including the optional landmark) is copied
  -- from the pending submission, so the order's shipping address is exactly
  -- what the customer entered — never a re-fetched profile address.
  INSERT INTO order_shipping_addresses (order_id, name, phone, line1, line2, landmark, city, state, pincode)
  VALUES (
    v_order_id,
    v_ver.shipping->>'name',
    v_ver.shipping->>'phone',
    v_ver.shipping->>'line1',
    NULLIF(trim(COALESCE(v_ver.shipping->>'line2', '')), ''),
    NULLIF(trim(COALESCE(v_ver.shipping->>'landmark', '')), ''),
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