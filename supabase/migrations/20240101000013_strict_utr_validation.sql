-- ============================================================================
-- STRICT UTR VALIDATION  (exactly 12 numeric digits, everywhere)
-- ============================================================================
--
-- A UTR (UPI Transaction Reference) is always a 12-digit number. Until now the
-- database only checked that a reference was non-empty (submit_order_payment)
-- or matched a loose 6-30 alphanumeric rule (submit_payment_verification), so
-- values like "1", "50" or "12345abc9012" could enter the verification flow.
--
-- This migration is functionally additive — no table, column, row, index or
-- policy is changed, dropped or rewritten. It re-issues three SECURITY DEFINER
-- functions with ONE behavioural change each: the UTR format rule is tightened
-- to `^[0-9]{12}$` (applied after trimming leading/trailing whitespace only;
-- inner whitespace, letters and shorter/longer digit runs are rejected, and
-- leading zeros are preserved because a UTR is always handled as text).
--
--   1. submit_order_payment        — customer submits a UTR for an existing
--                                    order: empty AND malformed values now
--                                    raise 'invalid_utr'.
--   2. submit_payment_verification — checkout submission: the loose 6-30
--                                    alphanumeric regex becomes the strict
--                                    12-digit regex ('invalid_utr').
--   3. approve_payment_verification (verbatim re-issue of the landmark-aware
--      version from 20240101000011_full_delivery_address.sql) with a new guard:
--      a PENDING submission whose stored UTR is not 12 digits (captured before
--      this rule, or tampered with via any path) can no longer be approved —
--      approval raises 'invalid_utr' and places NO order. Rejection still
--      works, so the admin can send the customer back to retry, and the
--      already-approved idempotency branch is untouched (a repeat click on a
--      previously approved submission still returns the SAME order).
--
-- NOTE ON HISTORICAL ROWS: no CHECK constraint is added on purpose. Legacy
-- orders/payments may legitimately hold short UTRs, and a NOT VALID CHECK on
-- payment_verifications would still fire on the UPDATE that rejection makes —
-- blocking admins from rejecting exactly the legacy rows that need rejecting.
-- Because payment_verifications has no client INSERT/UPDATE policy and every
-- write goes through these SECURITY DEFINER functions, the function-level rule
-- IS the database-level rule.
--
-- Format validation never proves a payment happened: only the admin's bank
-- statement check does that, and the verification workflow is unchanged.

-- ----------------------------------------------------------------------------
-- 1. submit_order_payment  (customer; manual online reference verification)
-- ----------------------------------------------------------------------------
-- Verbatim re-issue of public.submit_order_payment from
-- 20240101000007_order_fulfillment.sql with only the UTR check tightened
-- (empty-only -> strict 12-digit regex). Ownership, duplicate-UTR detection,
-- the payments upsert and the orders status update are unchanged.
CREATE OR REPLACE FUNCTION public.submit_order_payment(
  p_order_id text,
  p_utr text,
  p_screenshot_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_order     record;
  v_pay_id    text;
  v_dup_order text;
  v_utr       text := trim(COALESCE(p_utr, ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- STRICT FORMAT: exactly 12 digits after outer trimming. Inner whitespace,
  -- letters and any other length are rejected; leading zeros are preserved.
  IF v_utr !~ '^[0-9]{12}$' THEN
    RAISE EXCEPTION 'invalid_utr';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'order_not_found');
  END IF;

  IF v_order.user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  IF v_order.payment_status IN ('Verified', 'Paid') THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_verified');
  END IF;

  -- Enforced in the DATABASE, not just the UI: a Cash-on-Delivery (or blank)
  -- order has nothing to verify and must never enter the online queue.
  IF NOT public.order_requires_online_payment(v_order.payment_method) THEN
    RAISE EXCEPTION 'not_required';
  END IF;

  -- A reference may not be reused on a different order. Reject outright rather
  -- than silently creating a second, colliding payment record.
  SELECT order_id INTO v_dup_order
  FROM payments
  WHERE upper(utr_number) = upper(v_utr) AND order_id <> p_order_id
  LIMIT 1;
  IF v_dup_order IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate_utr';
  END IF;

  SELECT id INTO v_pay_id FROM payments WHERE order_id = p_order_id LIMIT 1;

  IF v_pay_id IS NULL THEN
    v_pay_id := 'PAY-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-'
      || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    INSERT INTO payments (
      id, order_id, customer_name, customer_phone, amount, utr_number,
      payment_method, screenshot_url, submitted_at, status,
      is_duplicate_utr, duplicate_order_id
    ) VALUES (
      v_pay_id, p_order_id, v_order.customer_name, v_order.customer_phone,
      v_order.total, v_utr, public.payment_method_key(v_order.payment_method),
      p_screenshot_url, now(), 'pending_verification', false, NULL
    );
  ELSE
    UPDATE payments
       SET utr_number = v_utr,
           screenshot_url = COALESCE(p_screenshot_url, screenshot_url),
           amount = v_order.total,
           payment_method = public.payment_method_key(v_order.payment_method),
           status = 'pending_verification',
           submitted_at = now(),
           is_duplicate_utr = false,
           duplicate_order_id = NULL,
           verified_at = NULL,
           verified_by = NULL,
           rejection_reason = NULL
     WHERE id = v_pay_id;
  END IF;

  UPDATE orders
     SET utr_number = v_utr,
         payment_status = 'Pending Verification',
         updated_at = now()
   WHERE id = p_order_id;

  INSERT INTO order_timeline (order_id, status, timestamp, note)
  VALUES (p_order_id, 'Payment Submitted', now(), 'UTR ' || v_utr || ' submitted for verification');

  RETURN jsonb_build_object('success', true, 'payment_id', v_pay_id, 'duplicate', false);
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. submit_payment_verification  (customer, pre-order)
-- ----------------------------------------------------------------------------
-- Verbatim re-issue of public.submit_payment_verification from
-- 20240101000009_checkout_payment_verification.sql with only the UTR regex
-- tightened from '^[A-Z0-9-]{6,30}$' to '^[0-9]{12}$'. Server-side pricing,
-- stock checks, duplicate detection, the one-pending-per-user rule and the
-- cart clearing are unchanged.
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

  -- STRICT UTR FORMAT: exactly 12 numeric digits after outer trimming.
  IF v_utr !~ '^[0-9]{12}$' THEN
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
-- 3. approve_payment_verification  (admin; atomic; idempotent)
-- ----------------------------------------------------------------------------
-- Verbatim re-issue of the landmark-aware version from
-- 20240101000011_full_delivery_address.sql with ONE addition: after the
-- idempotency branches, a stored UTR that is not exactly 12 digits raises
-- 'invalid_utr' and places no order. The already-approved branch is above the
-- guard, so a repeat click on an approved submission still returns the same
-- order, and rejection (which has no format rule) still works for legacy rows.
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

  -- STRICT UTR FORMAT: a submission captured before the 12-digit rule (or
  -- tampered with through any path) must never produce an order. The admin
  -- can still REJECT it so the customer can retry with a valid reference.
  IF v_ver.utr_number !~ '^[0-9]{12}$' THEN
    RAISE EXCEPTION 'invalid_utr';
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

-- Grants are preserved by CREATE OR REPLACE; re-stating them here keeps the
-- migration self-documenting and idempotent.
REVOKE ALL ON FUNCTION public.submit_order_payment(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_payment_verification(jsonb, jsonb, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_payment_verification(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_order_payment(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_payment_verification(jsonb, jsonb, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_payment_verification(text, text) TO authenticated;
