// Read-only live-data spot checks for the audit. Never prints secrets.
import fs from "fs";
const env = {};
for (const f of [".env", ".env.local", ".env.development", ".env.production"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in env)) env[m[1]] = v;
  }
}
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.log("MISSING ENV"); process.exit(1); }
const rest = url.replace(/\/$/, "") + "/rest/v1";
const H = { apikey: key, Authorization: `Bearer ${key}` };
const get = async (p, hdrs = {}) => {
  const r = await fetch(rest + p, { headers: { ...H, ...hdrs } });
  return { status: r.status, range: r.headers.get("content-range"), body: await r.text() };
};
const count = async (p) => (await get(p, { Prefer: "count=exact", Range: "0-0" })).range?.split("/")[1] ?? "?";

// 1. Address coverage for ALL orders (embed, object-or-array aware)
const orders = JSON.parse((await get("/orders?select=id,order_shipping_addresses(*)&limit=1000")).body);
const rowOf = (v) => (Array.isArray(v) ? v[0] : v);
const covered = orders.filter((o) => {
  const s = rowOf(o.order_shipping_addresses);
  return s && [s.name, s.line1, s.city].some((x) => (x ?? "").toString().trim());
});
console.log(`LIVE address coverage: ${covered.length}/${orders.length} orders`);

// 2. Payment methods on orders created in the last 90 days (UPI-only rule)
const recent = JSON.parse((await get("/orders?select=payment_method,placed_at&placed_at=gte.2026-07-29&limit=1000")).body);
const methods = [...new Set(recent.map((r) => r.payment_method))];
console.log(`LIVE payment methods on orders since 2026-07-29: ${JSON.stringify(methods)}`);

// 3. Coupon states
const cps = JSON.parse((await get("/coupons?select=code,active&order=code")).body);
console.log(`LIVE coupons: ${JSON.stringify(cps)}`);

// 4. Verification queue vs order linkage
console.log(`LIVE payment_verifications: total=${await count("/payment_verifications?select=id")}, pending=${await count("/payment_verifications?select=id&status=eq.pending")}, approved=${await count("/payment_verifications?select=id&status=eq.approved")}, rejected=${await count("/payment_verifications?select=id&status=eq.rejected")}`);

// 5. Any approved verification WITHOUT an order row (would indicate a broken approval)
const approved = JSON.parse((await get("/payment_verifications?select=id,order_id&status=eq.approved&limit=1000")).body);
const orphans = approved.filter((v) => !v.order_id);
console.log(`LIVE approved verifications missing order_id: ${orphans.length}`);

// 6. Orders missing a payments row / shipping row (data integrity)
const noShip = JSON.parse((await get("/orders?select=id,order_shipping_addresses&limit=1000")).body)
  .filter((o) => !rowOf(o.order_shipping_addresses));
console.log(`LIVE orders missing shipping row: ${noShip.length}`);
