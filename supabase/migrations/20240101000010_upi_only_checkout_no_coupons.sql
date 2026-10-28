-- ============================================================================
-- UPI-ONLY CHECKOUT  +  COUPON CODES DISABLED
-- ============================================================================
--
-- Two storefront changes, both enforced in the database so the browser is not
-- the security boundary:
--
--   1. UPI is the only payment method a NEW order may use. Credit/Debit Card,
--      Net Banking and Cash on Delivery were removed from checkout; a forged
--      request (direct PostgREST insert or an RPC call) must not be able to
--      create an order with them either. Historical COD/card/netbanking orders
--      are untouched — these are INSERT guards only.
--
--   2. The three seeded coupon codes (SAVE10 / WELCOME20 / FLAT100) are
--      deactivated. Checkout no longer has a coupon section, and the coupon
--      column on a pending submission must stay empty so the stored total
--      always equals the total the customer saw and acknowledged.
--
-- Nothing is deleted: no orders, payments, verification rows or coupon rows.

-- ----------------------------------------------------------------------------
-- 1. Disable the three seeded coupon codes (rows are kept for history)
-- ----------------------------------------------------------------------------
-- `create_order` and `pv_quote` only apply a coupon when `active = true`, so
-- deactivating makes every code inert for the order-creation process without
-- touching orders that previously used them. The admin Coupons page can still
-- see (and deliberately re-enable) them.
UPDATE public.coupons
   SET active = false,
       updated_at = now()
 WHERE upper(code) IN ('SAVE10', 'WELCOME20', 'FLAT100')
   AND active IS DISTINCT FROM false;

-- ----------------------------------------------------------------------------
-- 2. Submissions: UPI only, and never a coupon
-- ----------------------------------------------------------------------------
-- Applies to submit_payment_verification() and to any other insert path.
CREATE OR REPLACE FUNCTION public.enforce_upi_only_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.payment_method_key(NEW.payment_method) IS DISTINCT FROM 'upi' THEN
    RAISE EXCEPTION 'upi_only_payment_method';
  END IF;

  IF COALESCE(NEW.coupon, '') <> '' THEN
    RAISE EXCEPTION 'coupon_not_allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_upi_only_submission ON public.payment_verifications;
CREATE TRIGGER enforce_upi_only_submission
  BEFORE INSERT ON public.payment_verifications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_upi_only_submission();

-- ----------------------------------------------------------------------------
-- 3. New orders: UPI only
-- ----------------------------------------------------------------------------
-- Runs AFTER block_unverified_online_order (20240101000009). COD and unknown
-- methods are no longer offered at checkout, so no new order may use them;
-- online methods other than UPI are refused here too (they could never pass
-- the verification guard anyway). Existing rows are never re-evaluated.
CREATE OR REPLACE FUNCTION public.enforce_upi_only_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.payment_method_key(NEW.payment_method) IS DISTINCT FROM 'upi' THEN
    RAISE EXCEPTION 'upi_only_payment_method';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_upi_only_order ON public.orders;
CREATE TRIGGER enforce_upi_only_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_upi_only_order();