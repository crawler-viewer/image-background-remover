/**
 * Lightweight unit tests (no extra deps).
 * Run: node scripts/unit-tests.mjs  or  pnpm test
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// Dynamic import of ESM modules under functions/
const planConfig = await import(
  pathToFileURL(path.join(root, "functions/api/plan-config.js")).href
);
const paypalLib = await import(
  pathToFileURL(path.join(root, "functions/api/payment/paypal-lib.js")).href
);
const fulfill = await import(
  pathToFileURL(path.join(root, "functions/api/payment/fulfill.js")).href
);

console.log("\nplan-config");
test("guest limit is 5", () => {
  assert.equal(planConfig.getPlanConfig("guest").monthlyLimit, 5);
});
test("free limit is 20", () => {
  assert.equal(planConfig.getPlanConfig("free").monthlyLimit, 20);
});
test("pro limit is 200", () => {
  assert.equal(planConfig.getPlanConfig("pro").monthlyLimit, 200);
});
test("business limit is 500 (not 800)", () => {
  assert.equal(planConfig.getPlanConfig("business").monthlyLimit, 500);
});
test("unknown plan falls back to free", () => {
  assert.equal(planConfig.getPlanConfig("nope").code, "free");
});

console.log("\npaypal products & expiry");
test("PRODUCTS has prepaid plans and credit packs", () => {
  const { PRODUCTS } = paypalLib;
  assert.ok(PRODUCTS.pro_monthly);
  assert.ok(PRODUCTS.credits_100);
  assert.equal(PRODUCTS.pro_monthly.amount, "9.90");
  assert.equal(PRODUCTS.business_monthly.planCode, "business");
  assert.equal(PRODUCTS.credits_100.credits, 100);
});
test("calcPlanExpiry monthly is ~30 days ahead", () => {
  const before = Date.now();
  const iso = paypalLib.calcPlanExpiry({ period: "monthly" });
  const t = new Date(iso).getTime();
  const days = (t - before) / 86400000;
  assert.ok(days > 27 && days < 32, `expected ~30 days, got ${days}`);
});
test("calcPlanExpiry yearly is ~365 days ahead", () => {
  const before = Date.now();
  const iso = paypalLib.calcPlanExpiry({ period: "yearly" });
  const days = (new Date(iso).getTime() - before) / 86400000;
  assert.ok(days > 360 && days < 370, `expected ~365 days, got ${days}`);
});
test("assertPayPalReady fails without credentials", () => {
  assert.throws(
    () => paypalLib.assertPayPalReady({}),
    (e) => e.code === "PAYPAL_NOT_CONFIGURED"
  );
});
test("assertPayPalReady blocks sandbox on prod host", () => {
  assert.throws(
    () =>
      paypalLib.assertPayPalReady({
        PAYPAL_CLIENT_ID: "id",
        PAYPAL_CLIENT_SECRET: "secret",
        // default sandbox
        SITE_URL: "https://picturebackgroundremover.xyz",
      }),
    (e) => e.code === "PAYPAL_SANDBOX_ON_PROD"
  );
});
test("assertPayPalReady allows sandbox when ALLOW_PAYPAL_SANDBOX=true", () => {
  const cfg = paypalLib.assertPayPalReady({
    PAYPAL_CLIENT_ID: "id",
    PAYPAL_CLIENT_SECRET: "secret",
    SITE_URL: "https://picturebackgroundremover.xyz",
    ALLOW_PAYPAL_SANDBOX: "true",
  });
  assert.equal(cfg.isSandbox, true);
});
test("assertPayPalReady allows live when PAYPAL_SANDBOX=false", () => {
  const cfg = paypalLib.assertPayPalReady({
    PAYPAL_CLIENT_ID: "id",
    PAYPAL_CLIENT_SECRET: "secret",
    PAYPAL_SANDBOX: "false",
    SITE_URL: "https://picturebackgroundremover.xyz",
  });
  assert.equal(cfg.isSandbox, false);
});

console.log("\nfulfill helpers");
test("getProductById resolves known products", () => {
  assert.equal(fulfill.getProductById("pro_monthly")?.planCode, "pro");
  assert.equal(fulfill.getProductById("missing"), null);
});
test("resolvePlanProduct prefers product_id", () => {
  const p = fulfill.resolvePlanProduct({
    product_id: "pro_yearly",
    order_type: "subscription",
    plan_code: "pro",
    amount_usd: "9.90", // wrong amount on purpose
  });
  assert.equal(p.period, "yearly");
});
test("resolvePlanProduct falls back to plan+amount", () => {
  const p = fulfill.resolvePlanProduct({
    order_type: "subscription",
    plan_code: "business",
    amount_usd: "29.90",
  });
  assert.equal(p.period, "monthly");
});

// Mock DB for fulfillPaidOrder
function createMockDb(orderRow) {
  let order = { ...orderRow };
  let user = {
    google_sub: order.google_sub,
    plan: "free",
    plan_expires_at: null,
  };
  let credits = 0;

  return {
    _state: () => ({ order, user, credits }),
    prepare(sql) {
      const self = {
        binds: [],
        bind(...args) {
          self.binds = args;
          return self;
        },
        async run() {
          if (sql.includes("UPDATE payment_orders") && sql.includes("status = 'paid'")) {
            const [now, id] = self.binds;
            if (order.id === id && order.status === "pending") {
              order = { ...order, status: "paid", paid_at: now };
              return { meta: { changes: 1 } };
            }
            return { meta: { changes: 0 } };
          }
          if (sql.includes("UPDATE users SET plan")) {
            const [plan, expires, , sub] = self.binds;
            if (user.google_sub === sub) {
              user = { ...user, plan, plan_expires_at: expires };
            }
            return { meta: { changes: 1 } };
          }
          if (sql.includes("INSERT INTO user_credits")) {
            const amount = self.binds[2];
            credits += Number(amount);
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
        async first() {
          if (sql.includes("SELECT status FROM payment_orders")) {
            return { status: order.status };
          }
          return null;
        },
      };
      return self;
    },
  };
}

console.log("\nfulfillPaidOrder");
await testAsync("applies prepaid plan once", async () => {
  const order = {
    id: 1,
    status: "pending",
    order_type: "subscription",
    plan_code: "pro",
    product_id: "pro_monthly",
    google_sub: "user-1",
    amount_usd: "9.90",
  };
  const db = createMockDb(order);
  const r1 = await fulfill.fulfillPaidOrder(db, order, "2026-07-12T00:00:00.000Z");
  assert.equal(r1.applied, true);
  assert.equal(r1.kind, "plan");
  assert.equal(db._state().user.plan, "pro");
  assert.ok(db._state().user.plan_expires_at);

  const r2 = await fulfill.fulfillPaidOrder(db, { ...order, status: "paid" }, "2026-07-12T00:00:01.000Z");
  assert.equal(r2.applied, false);
  assert.equal(r2.reason, "already_paid");
});

await testAsync("applies credits once (idempotent claim)", async () => {
  const order = {
    id: 2,
    status: "pending",
    order_type: "credits",
    credit_amount: 100,
    user_id: 9,
    google_sub: "user-2",
    product_id: "credits_100",
  };
  const db = createMockDb(order);
  const r1 = await fulfill.fulfillPaidOrder(db, order);
  assert.equal(r1.applied, true);
  assert.equal(db._state().credits, 100);

  // Second call with pending claim fails because status already paid in mock
  const r2 = await fulfill.fulfillPaidOrder(db, { ...order, status: "pending" });
  // claim uses db order status which is paid → already_paid
  assert.equal(r2.applied, false);
  assert.equal(db._state().credits, 100);
});

// Frontend pricing alignment (TS compiled away — read as text checks)
console.log("\npricing.ts alignment (source)");
const require = createRequire(import.meta.url);
const fs = await import("node:fs");
const pricingSrc = fs.readFileSync(path.join(root, "src/lib/pricing.ts"), "utf8");
test("pricing features mention prepaid / no auto-renew", () => {
  assert.match(pricingSrc, /no auto-renew/i);
  assert.match(pricingSrc, /500 removals/);
  assert.doesNotMatch(pricingSrc, /800 removals per month/);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
