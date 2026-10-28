-- ============================================================================
-- HISTORICAL DELIVERY-ADDRESS RECOVERY & BACKFILL
-- ============================================================================
--
-- Symptom: some orders (created before the current address handling) have no
-- usable row in `order_shipping_addresses`, so the admin Orders table shows
-- "Address unavailable" and the Order Details modal renders an empty address.
-- The table itself is fine — the per-order address is simply missing or blank.
--
-- This migration recovers each order's ORIGINAL delivery address from
-- order-specific sources only, in strict priority order:
--
--   1. The order's existing `order_shipping_addresses` row.
--      Valid fields are NEVER overwritten. Blank fields of that row are first
--      completed from the SAME order's approved payment-verification snapshot
--      (`payment_verifications.shipping` matched by order_id — the checkout
--      address captured for that exact purchase).
--   2. The approved payment-verification record linked to the order
--      (`payment_verifications.order_id`, set exactly once at approval).
--   3. The customer's saved address — ONLY under strict evidence that it was
--      the address for that particular order:
--        * the customer has EXACTLY ONE row in `addresses` (no ambiguity),
--        * it was created at or before the order was placed, and
--        * it has not been modified since the order was placed,
--        * and it is a complete address (house/street, city, state, PIN).
--      A customer's current profile address is NEVER assigned wholesale to
--      historical orders; multi-address or later-changed customers are left
--      untouched and reported as unrecoverable instead of guessed.
--
-- Guarantees:
--   * idempotent — every statement is guarded, so a second run is a no-op;
--   * never overwrites a non-blank address field;
--   * never creates a duplicate shipping row (ON CONFLICT (order_id) DO
--     NOTHING + NOT EXISTS guards; the table's unique order_id constraint is
--     the final backstop);
--   * touches ONLY `order_shipping_addresses` — no order, payment, item,
--     timeline, status, total, inventory or profile row is modified;
--   * a single atomic DO block (one transaction), so a partial backfill can
--     never be committed;
--   * reports exactly what it recovered and what could not be recovered
--     (RAISE NOTICE — visible in the Supabase SQL editor / CLI output).
--
-- To re-list orders that still have no recoverable address at any time:
--
--   SELECT o.id, o.placed_at, o.customer_name, o.customer_phone
--   FROM orders o
--   WHERE NOT EXISTS (
--     SELECT 1 FROM order_shipping_addresses a
--     WHERE a.order_id = o.id
--       AND (nullif(btrim(coalesce(a.name,'')),'')     IS NOT NULL
--         OR nullif(btrim(coalesce(a.line1,'')),'')    IS NOT NULL
--         OR nullif(btrim(coalesce(a.city,'')),'')     IS NOT NULL)
--   )
--   ORDER BY o.placed_at DESC;

DO $$
DECLARE
  v_total              bigint;
  v_had_address        bigint;   -- orders with a usable address BEFORE backfill
  v_pv_completed       bigint;   -- blank fields completed from the order's own pv snapshot
  v_pv_restored        bigint;   -- missing rows restored from the pv snapshot
  v_profile_completed  bigint;   -- entirely-blank rows filled from the single saved address
  v_profile_restored   bigint;   -- missing rows created from the single saved address
  v_unrecoverable      bigint;
  v_missing_ids        text;
BEGIN
  -- Baseline, captured BEFORE any change ------------------------------------
  SELECT count(*) INTO v_total FROM orders;

  SELECT count(*) INTO v_had_address
  FROM orders o
  WHERE EXISTS (
    SELECT 1 FROM order_shipping_addresses a
    WHERE a.order_id = o.id
      AND (nullif(btrim(coalesce(a.name,'')),'')  IS NOT NULL
        OR nullif(btrim(coalesce(a.line1,'')),'') IS NOT NULL
        OR nullif(btrim(coalesce(a.city,'')),'')  IS NOT NULL)
  );

  -- -------------------------------------------------------------------------
  -- 1a. Complete BLANK fields of an existing row from that SAME order's
  --     approved payment-verification snapshot. Non-blank fields win.
  -- -------------------------------------------------------------------------
  UPDATE order_shipping_addresses a
     SET name     = CASE WHEN nullif(btrim(coalesce(a.name,'')),'')     IS NULL THEN coalesce(s.name, o.customer_name, a.name)     ELSE a.name END,
         phone    = CASE WHEN nullif(btrim(coalesce(a.phone,'')),'')    IS NULL THEN coalesce(s.phone, o.customer_phone, a.phone)  ELSE a.phone END,
         line1    = CASE WHEN nullif(btrim(coalesce(a.line1,'')),'')    IS NULL THEN coalesce(s.line1, a.line1)                    ELSE a.line1 END,
         line2    = CASE WHEN nullif(btrim(coalesce(a.line2,'')),'')    IS NULL THEN coalesce(s.line2, a.line2)                    ELSE a.line2 END,
         landmark = CASE WHEN nullif(btrim(coalesce(a.landmark,'')),'') IS NULL THEN coalesce(s.landmark, a.landmark)             ELSE a.landmark END,
         city     = CASE WHEN nullif(btrim(coalesce(a.city,'')),'')     IS NULL THEN coalesce(s.city, a.city)                     ELSE a.city END,
         state    = CASE WHEN nullif(btrim(coalesce(a.state,'')),'')    IS NULL THEN coalesce(s.state, a.state)                    ELSE a.state END,
         pincode  = CASE WHEN nullif(btrim(coalesce(a.pincode,'')),'')  IS NULL THEN coalesce(s.pincode, a.pincode)               ELSE a.pincode END
    FROM payment_verifications pv
    JOIN orders o ON o.id = pv.order_id
    JOIN LATERAL (
      SELECT NULLIF(btrim(pv.shipping->>'name'), '')     AS name,
             NULLIF(btrim(pv.shipping->>'phone'), '')    AS phone,
             NULLIF(btrim(pv.shipping->>'line1'), '')    AS line1,
             NULLIF(btrim(pv.shipping->>'line2'), '')    AS line2,
             NULLIF(btrim(pv.shipping->>'landmark'), '') AS landmark,
             NULLIF(btrim(pv.shipping->>'city'), '')     AS city,
             NULLIF(btrim(pv.shipping->>'state'), '')    AS state,
             NULLIF(btrim(pv.shipping->>'pincode'), '')  AS pincode
    ) s ON TRUE
   WHERE pv.order_id IS NOT NULL
     AND pv.status = 'approved'
     AND pv.order_id = a.order_id
     -- Only when at least one blank column actually has a source value.
     AND ( (nullif(btrim(coalesce(a.name,'')),'')     IS NULL AND coalesce(s.name, o.customer_name)     IS NOT NULL)
        OR (nullif(btrim(coalesce(a.phone,'')),'')    IS NULL AND coalesce(s.phone, o.customer_phone)  IS NOT NULL)
        OR (nullif(btrim(coalesce(a.line1,'')),'')    IS NULL AND s.line1  IS NOT NULL)
        OR (nullif(btrim(coalesce(a.line2,'')),'')    IS NULL AND s.line2  IS NOT NULL)
        OR (nullif(btrim(coalesce(a.landmark,'')),'') IS NULL AND s.landmark IS NOT NULL)
        OR (nullif(btrim(coalesce(a.city,'')),'')     IS NULL AND s.city   IS NOT NULL)
        OR (nullif(btrim(coalesce(a.state,'')),'')    IS NULL AND s.state  IS NOT NULL)
        OR (nullif(btrim(coalesce(a.pincode,'')),'')  IS NULL AND s.pincode IS NOT NULL) );
  GET DIAGNOSTICS v_pv_completed = ROW_COUNT;

  -- -------------------------------------------------------------------------
  -- 1b. Orders with NO shipping row at all: restore it from that same
  --     approved payment-verification snapshot.
  -- -------------------------------------------------------------------------
  INSERT INTO order_shipping_addresses (order_id, name, phone, line1, line2, landmark, city, state, pincode)
  SELECT pv.order_id,
         coalesce(s.name, o.customer_name),
         coalesce(s.phone, o.customer_phone),
         s.line1, s.line2, s.landmark, s.city, s.state, s.pincode
    FROM payment_verifications pv
    JOIN orders o ON o.id = pv.order_id
    JOIN LATERAL (
      SELECT NULLIF(btrim(pv.shipping->>'name'), '')     AS name,
             NULLIF(btrim(pv.shipping->>'phone'), '')    AS phone,
             NULLIF(btrim(pv.shipping->>'line1'), '')    AS line1,
             NULLIF(btrim(pv.shipping->>'line2'), '')    AS line2,
             NULLIF(btrim(pv.shipping->>'landmark'), '') AS landmark,
             NULLIF(btrim(pv.shipping->>'city'), '')     AS city,
             NULLIF(btrim(pv.shipping->>'state'), '')    AS state,
             NULLIF(btrim(pv.shipping->>'pincode'), '')  AS pincode
    ) s ON TRUE
   WHERE pv.order_id IS NOT NULL
     AND pv.status = 'approved'
     -- A complete, insertable address (NOT NULL columns of the table).
     AND s.line1 IS NOT NULL
     AND s.city IS NOT NULL
     AND s.state IS NOT NULL
     AND s.pincode IS NOT NULL
     AND coalesce(s.name, o.customer_name) IS NOT NULL
     AND coalesce(s.phone, o.customer_phone) IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM order_shipping_addresses a WHERE a.order_id = pv.order_id
     )
  ON CONFLICT (order_id) DO NOTHING;
  GET DIAGNOSTICS v_pv_restored = ROW_COUNT;

  -- -------------------------------------------------------------------------
  -- 2a. Entirely-blank existing rows: fill ONLY under the strict saved-address
  --     evidence (exactly one address, predating the order, never modified).
  -- -------------------------------------------------------------------------
  UPDATE order_shipping_addresses x
     SET name     = coalesce(a.name, o.customer_name),
         phone    = coalesce(a.phone, o.customer_phone),
         line1    = a.line1,
         line2    = a.line2,
         landmark = a.landmark,
         city     = a.city,
         state    = a.state,
         pincode  = a.pincode
    FROM orders o
    JOIN LATERAL (
      SELECT ad.* FROM addresses ad WHERE ad.user_id = o.user_id
    ) a ON TRUE
   WHERE x.order_id = o.id
     AND nullif(btrim(coalesce(x.name,'')),'')     IS NULL
     AND nullif(btrim(coalesce(x.phone,'')),'')    IS NULL
     AND nullif(btrim(coalesce(x.line1,'')),'')    IS NULL
     AND nullif(btrim(coalesce(x.city,'')),'')     IS NULL
     AND nullif(btrim(coalesce(x.state,'')),'')    IS NULL
     AND nullif(btrim(coalesce(x.pincode,'')),'')  IS NULL
     -- Strict evidence: exactly one saved address, complete, predating the
     -- order and untouched since it was placed.
     AND (SELECT count(*) FROM addresses ad2 WHERE ad2.user_id = o.user_id) = 1
     AND a.created_at <= o.placed_at
     AND a.updated_at <= o.placed_at
     AND nullif(btrim(coalesce(a.line1,'')),'')    IS NOT NULL
     AND nullif(btrim(coalesce(a.city,'')),'')     IS NOT NULL
     AND nullif(btrim(coalesce(a.state,'')),'')    IS NOT NULL
     AND nullif(btrim(coalesce(a.pincode,'')),'')  IS NOT NULL
     AND coalesce(a.name, o.customer_name)  IS NOT NULL
     AND coalesce(a.phone, o.customer_phone) IS NOT NULL;
  GET DIAGNOSTICS v_profile_completed = ROW_COUNT;

  -- -------------------------------------------------------------------------
  -- 2b. Orders with no row at all: create it under the same strict evidence.
  -- -------------------------------------------------------------------------
  INSERT INTO order_shipping_addresses (order_id, name, phone, line1, line2, landmark, city, state, pincode)
  SELECT o.id,
         coalesce(a.name, o.customer_name),
         coalesce(a.phone, o.customer_phone),
         a.line1, a.line2, a.landmark, a.city, a.state, a.pincode
    FROM orders o
    JOIN LATERAL (
      SELECT ad.* FROM addresses ad WHERE ad.user_id = o.user_id
    ) a ON TRUE
   WHERE NOT EXISTS (
       SELECT 1 FROM order_shipping_addresses x WHERE x.order_id = o.id
     )
     AND (SELECT count(*) FROM addresses ad2 WHERE ad2.user_id = o.user_id) = 1
     AND a.created_at <= o.placed_at
     AND a.updated_at <= o.placed_at
     AND nullif(btrim(coalesce(a.line1,'')),'')    IS NOT NULL
     AND nullif(btrim(coalesce(a.city,'')),'')     IS NOT NULL
     AND nullif(btrim(coalesce(a.state,'')),'')    IS NOT NULL
     AND nullif(btrim(coalesce(a.pincode,'')),'')  IS NOT NULL
     AND coalesce(a.name, o.customer_name)  IS NOT NULL
     AND coalesce(a.phone, o.customer_phone) IS NOT NULL
  ON CONFLICT (order_id) DO NOTHING;
  GET DIAGNOSTICS v_profile_restored = ROW_COUNT;

  -- -------------------------------------------------------------------------
  -- Report: what was recovered, and what has no recoverable original address.
  -- -------------------------------------------------------------------------
  SELECT count(*) INTO v_unrecoverable
  FROM orders o
  WHERE NOT EXISTS (
    SELECT 1 FROM order_shipping_addresses a
    WHERE a.order_id = o.id
      AND (nullif(btrim(coalesce(a.name,'')),'')  IS NOT NULL
        OR nullif(btrim(coalesce(a.line1,'')),'') IS NOT NULL
        OR nullif(btrim(coalesce(a.city,'')),'')  IS NOT NULL)
  );

  SELECT left(string_agg(o.id, ', ' ORDER BY o.placed_at DESC), 1500)
    INTO v_missing_ids
  FROM orders o
  WHERE NOT EXISTS (
    SELECT 1 FROM order_shipping_addresses a
    WHERE a.order_id = o.id
      AND (nullif(btrim(coalesce(a.name,'')),'')  IS NOT NULL
        OR nullif(btrim(coalesce(a.line1,'')),'') IS NOT NULL
        OR nullif(btrim(coalesce(a.city,'')),'')  IS NOT NULL)
  );

  RAISE NOTICE 'delivery address backfill: total orders=%, already had an address=%, completed from payment verification=%, restored from payment verification=%, completed from single saved address=%, restored from single saved address=%, still without a recoverable address=%',
    v_total, v_had_address, v_pv_completed, v_pv_restored, v_profile_completed, v_profile_restored, v_unrecoverable;

  IF v_unrecoverable > 0 THEN
    RAISE NOTICE 'orders with NO recoverable original address (left as "Address unavailable"): %', coalesce(v_missing_ids, '(none)');
  END IF;
END;
$$;