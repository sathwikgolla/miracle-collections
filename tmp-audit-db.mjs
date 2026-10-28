// Throwaway AUDIT harness: all 15 migrations on embedded Postgres 18,
// consolidated workflow/security/backfill/coupon/address scenario checks.
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import fs from "fs";
import path from "path";

const DIR = ".tmp-pgdata";
const PORT = 55444;
fs.rmSync(DIR, { recursive: true, force: true });

const ep = new EmbeddedPostgres({
  databaseDir: DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
  initdbFlags: ["--encoding=UTF8"],
});

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}  ${extra}`); }
};
const expectError = async (name, fn, needle) => {
  try { await fn(); check(name, false, "no error thrown"); }
  catch (e) { check(name, String(e.message).includes(needle), `got: ${String(e.message).split("\n")[0]}`); }
};

const client = new pg.Client({
  host: "localhost", port: PORT, user: "postgres", password: "postgres", database: "postgres",
});
client.on?.("notice", (m) => console.log(`NOTICE  ${m.message.slice(0, 300)}`));
const q = async (sql, params) => (await client.query(sql, params)).rows;

try {
  await ep.initialise();
  await ep.start();
  await client.connect();

  // ---- Supabase shims ----
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
    END $$;
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text,
      raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  `);

  // ---- All migrations in order (12 included after seeding below) ----
  const migDir = path.join("supabase", "migrations");
  const all = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort();
  const bf = all.find((f) => f.includes("000012"));
  let migCount = 0;
  for (const f of all.filter((x) => x !== bf)) {
    await client.query(fs.readFileSync(path.join(migDir, f), "utf8"));
    migCount++;
  }

  // ---- Seed ----
  const mkUser = async (name, mobile) =>
    (await client.query(
      `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES (gen_random_uuid(), $1, $2) RETURNING id`,
      [`${name}@test.dev`, JSON.stringify({ name, mobile })])).rows[0].id;
  const admin = await mkUser("Admin", "9000000000");
  const cust1 = await mkUser("Cust One", "9000000001");
  const cust2 = await mkUser("Cust Two", "9000000002");
  const cust3 = await mkUser("Cust Three", "9000000003");
  await client.query(`UPDATE profiles SET role='admin' WHERE id=$1`, [admin]);
  await client.query(
    `INSERT INTO products (id, slug, name, brand, price, mrp, stock, status)
     VALUES ('prod-1','tp','Test Product','BrandX',999,1299,50,'live')`);

  // Historical-order scenario for the 000012 backfill (seed BEFORE applying it)
  const hist = await mkUser("Hist User", "9000000005");
  await client.query(
    `INSERT INTO addresses (user_id, name, phone, line1, city, state, pincode, created_at, updated_at)
     VALUES ($1,'Hist User','9000000005','H-1 Heritage Lane','Jaipur','Rajasthan','302001','2026-01-05T10:00:00Z','2026-01-05T10:00:00Z')`,
    [hist]);
  await client.query("BEGIN");
  await client.query(
    `INSERT INTO payment_verifications (id,user_id,status,utr_number,payment_method,payment_method_key,
       customer_name,customer_phone,items,shipping,order_id,submitted_at,updated_at)
     VALUES ('PV-H1',$1,'approved','UTRHIST001','UPI','upi','Hist User','9000000005','[]'::jsonb,'{}'::jsonb,'ORD-H1','2026-03-01T04:00:00Z','2026-03-01T04:00:00Z')`,
    [hist]);
  await client.query(
    `INSERT INTO orders (id,user_id,customer_name,customer_phone,subtotal,total,payment_method,payment_status,order_status,placed_at,updated_at)
     VALUES ('ORD-H1',$1,'Hist User','9000000005',999,999,'UPI','Verified','Placed','2026-06-15T04:00:00Z','2026-06-15T04:00:00Z')`,
    [hist]);
  await client.query("COMMIT");
  const ordersBefore = JSON.stringify(await q(`SELECT * FROM orders ORDER BY id`));

  // ---- Apply backfill migration ----
  await client.query(fs.readFileSync(path.join(migDir, bf), "utf8"));
  migCount++;
  const h1 = (await q(`SELECT * FROM order_shipping_addresses WHERE order_id='ORD-H1'`))[0];
  check("BF1 historical order recovered from single untouched saved address",
    h1 && h1.line1 === "H-1 Heritage Lane" && h1.city === "Jaipur" && h1.pincode === "302001", JSON.stringify(h1));
  check("BF2 orders table untouched by backfill",
    JSON.stringify(await q(`SELECT * FROM orders ORDER BY id`)) === ordersBefore);
  const addrSnap1 = JSON.stringify(await q(`SELECT * FROM order_shipping_addresses ORDER BY order_id`));
  await client.query(fs.readFileSync(path.join(migDir, bf), "utf8"));
  check("BF3 backfill idempotent (second run is a no-op)",
    JSON.stringify(await q(`SELECT * FROM order_shipping_addresses ORDER BY order_id`)) === addrSnap1);

  // ---- Workflow helpers ----
  const asRole = async (uid, fn) => {
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [uid]);
    await client.query(`SET ROLE authenticated`);
    try { return await fn(); }
    finally {
      await client.query(`RESET ROLE`);
      await client.query(`SELECT set_config('request.jwt.claim.sub', '', false)`);
    }
  };
  const rpc = (uid, sql, params) =>
    asRole(uid, () => client.query(sql, params)).then((r) => r.rows[0].r);
  const submit = (uid, shipping, utr, coupon = null) =>
    rpc(uid, `SELECT public.submit_payment_verification($1,$2,$3,$4,$5) AS r`,
      [JSON.stringify([{ product_id: "prod-1", quantity: 1 }]), JSON.stringify(shipping), "UPI", coupon, utr]);
  const approve = (uid, id) => rpc(uid, `SELECT public.approve_payment_verification($1,'Audit') AS r`, [id]);
  const reject = (uid, id, reason) => rpc(uid, `SELECT public.reject_payment_verification($1,$2,'Audit') AS r`, [id, reason]);

  for (const u of [cust1, cust2, cust3])
    await client.query(`INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,'prod-1',1)`, [u]);

  const SHIP1 = { name: "Ravi K", phone: "9876543210", line1: "12 Long Street Name That Goes On And On Block C", line2: "Near Park", landmark: "Beside Library", city: "Bengaluru", state: "Karnataka", pincode: "560001" };

  // ---- Coupons ----
  const quote = (await client.query(
    `SELECT public.pv_quote('[{"product_id":"prod-1","quantity":1}]'::jsonb,'SAVE10') AS r`)).rows[0].r;
  check("CP1 deactivated coupon gives NO discount (total=999, discount=0)",
    Number(quote.coupon_discount) === 0 && Number(quote.total) === 999, JSON.stringify(quote));
  await expectError("CP2 submitting WITH a coupon is rejected by the DB",
    () => submit(cust1, SHIP1, "UTRCOUP001", "SAVE10"), "coupon_not_allowed");
  const cp = await q(`SELECT code, active FROM coupons WHERE code IN ('SAVE10','WELCOME20','FLAT100') ORDER BY code`);
  check("CP3 all three seeded codes exist but are inactive (history preserved)",
    cp.length === 3 && cp.every((c) => c.active === false), JSON.stringify(cp));

  // ---- UTR submission ----
  const sub1 = await submit(cust1, SHIP1, "UTRAUD1111");
  check("U1 submit succeeds; no order created; cart cleared",
    sub1?.success === true &&
    (await q(`SELECT count(*) c FROM orders WHERE user_id=$1`, [cust1]))[0].c === "0" &&
    (await q(`SELECT count(*) c FROM cart_items WHERE user_id=$1`, [cust1]))[0].c === "0");
  const pv1 = (await q(`SELECT * FROM payment_verifications WHERE id=$1`, [sub1.verification_id]))[0];
  check("U2 pending record stores complete address + server-computed total",
    pv1.shipping.landmark === "Beside Library" && pv1.shipping.pincode === "560001" &&
    Number(pv1.total) === 999 && pv1.status === "pending");
  await expectError("U3 duplicate pending rejected", () => submit(cust1, SHIP1, "UTRAUD1112"), "already_pending");
  await expectError("U4 invalid UTR (too short) rejected", () => submit(cust3, SHIP1, "abc12"), "invalid_utr");
  await expectError("U5 duplicate UTR reuse rejected", () => submit(cust3, SHIP1, "UTRAUD1111"), "duplicate_utr");
  await expectError("U6 non-admin cannot approve", () => approve(cust3, sub1.verification_id), "forbidden");
  await expectError("U7 direct online order insert blocked without approval", () =>
    client.query(`INSERT INTO orders (id,user_id,customer_name,customer_phone,payment_method,payment_status,order_status)
      VALUES ('ORD-HACK1',$1,'X','1','UPI','Verified','Placed')`, [cust1]), "online_payment_verification_required");
  await expectError("U8 new COD order insert blocked", () =>
    client.query(`INSERT INTO orders (id,user_id,customer_name,customer_phone,payment_method,payment_status,order_status)
      VALUES ('ORD-HACK2',$1,'X','1','Cash on Delivery','Pending','Placed')`, [cust1]), "upi_only_payment_method");

  // ---- Approve ----
  const ap1 = await approve(admin, sub1.verification_id);
  const o1 = (await q(`SELECT * FROM orders WHERE id=$1`, [ap1.order_id]))[0];
  const a1 = (await q(`SELECT * FROM order_shipping_addresses WHERE order_id=$1`, [ap1.order_id]))[0];
  check("A1 approval creates exactly one order, Placed + Verified",
    ap1?.success === true && (await q(`SELECT count(*) c FROM orders WHERE user_id=$1`, [cust1]))[0].c === "1" &&
    o1.order_status === "Placed" && o1.payment_status === "Verified" && Number(o1.total) === 999);
  check("A2 order address = exact checkout address (all 8 fields incl. landmark)",
    a1 && a1.name === SHIP1.name && a1.phone === SHIP1.phone && a1.line1 === SHIP1.line1 &&
    a1.line2 === SHIP1.line2 && a1.landmark === SHIP1.landmark && a1.city === SHIP1.city &&
    a1.state === SHIP1.state && a1.pincode === SHIP1.pincode, JSON.stringify(a1));
  const ap1b = await approve(admin, sub1.verification_id);
  check("A3 repeat approval idempotent (same order, still 1 order/1 address/1 payment row)",
    ap1b?.already_approved === true && ap1b.order_id === ap1.order_id &&
    (await q(`SELECT count(*) c FROM orders WHERE user_id=$1`, [cust1]))[0].c === "1" &&
    (await q(`SELECT count(*) c FROM order_shipping_addresses WHERE order_id=$1`, [ap1.order_id]))[0].c === "1" &&
    (await q(`SELECT count(*) c FROM payments WHERE order_id=$1`, [ap1.order_id]))[0].c === "1");
  check("A4 verified payments row created with amount matching the order",
    (await q(`SELECT count(*) c FROM payments WHERE order_id=$1 AND status='verified' AND amount=999`, [ap1.order_id]))[0].c === "1");

  // ---- Reject ----
  const SHIP2 = { name: "Asha D", phone: "9123456780", line1: "7 MG Road", city: "Pune", state: "Maharashtra", pincode: "400001" };
  const sub2 = await submit(cust2, SHIP2, "UTRAUD2222");
  const rj = await reject(admin, sub2.verification_id, "UTR not found");
  check("R1 rejection creates NO order; address preserved; cart restored",
    rj?.success === true && (await q(`SELECT count(*) c FROM orders WHERE user_id=$1`, [cust2]))[0].c === "0" &&
    (await q(`SELECT shipping FROM payment_verifications WHERE id=$1`, [sub2.verification_id]))[0].shipping.line1 === "7 MG Road" &&
    (await q(`SELECT count(*) c FROM cart_items WHERE user_id=$1`, [cust2]))[0].c === "1");
  const late = await approve(admin, sub2.verification_id);
  check("R2 late approval of rejected row refused; still no order",
    late?.success === false && JSON.stringify(late).includes("already_rejected") &&
    (await q(`SELECT count(*) c FROM orders WHERE user_id=$1`, [cust2]))[0].c === "0");
  const rj2 = await reject(admin, sub2.verification_id, "again");
  check("R3 double rejection idempotent", rj2?.already_rejected === true);

  // ---- RLS ----
  const seeOther = await asRole(cust2, () => client.query(`SELECT id FROM orders`));
  const seeOtherPv = await asRole(cust2, () => client.query(`SELECT id FROM payment_verifications`));
  const seeOtherAddr = await asRole(cust2, () => client.query(`SELECT id FROM order_shipping_addresses`));
  check("SEC1 cross-user isolation (no foreign orders/addresses; only own verification visible)",
    seeOther.rows.length === 0 && seeOtherAddr.rows.length === 0 &&
    seeOtherPv.rows.length === 1 && seeOtherPv.rows[0].id === sub2.verification_id);
  await expectError("SEC2 non-admin blocked from admin read RPC surface",
    () => asRole(cust1, () => client.query(`SELECT public.approve_payment_verification('nope','x')`)), "forbidden");

  // ---- Final integrity ----
  check("INT1 no duplicate shipping rows anywhere",
    (await q(`SELECT count(*) c FROM (SELECT order_id FROM order_shipping_addresses GROUP BY order_id HAVING count(*)>1) d`))[0].c === "0");
  check("INT2 every order in this DB has exactly one shipping row",
    (await q(`SELECT count(*) c FROM orders o WHERE NOT EXISTS (SELECT 1 FROM order_shipping_addresses a WHERE a.order_id=o.id)`))[0].c === "0");
  check("INT3 migrations applied in harness", migCount === 15, `count=${migCount}`);

  console.log(`\nRESULT: ${pass}/${pass + fail} checks passed`);
} catch (e) {
  console.error("HARNESS ERROR:", e);
  process.exitCode = 1;
} finally {
  try { await client.end(); } catch {}
  try { await ep.stop(); } catch {}
  for (let i = 0; i < 5; i++) {
    try { fs.rmSync(DIR, { recursive: true, force: true }); break; }
    catch { await new Promise((r) => setTimeout(r, 1000)); }
  }
}
