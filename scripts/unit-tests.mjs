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
test("calcPlanExpiry extends from provided base date", () => {
  const base = new Date("2026-08-01T00:00:00.000Z");
  const iso = paypalLib.calcPlanExpiry({ period: "monthly" }, base);
  // ~30 days after Aug 1
  assert.equal(iso.slice(0, 10), "2026-09-01");
});
test("amountsEqual compares money strings", () => {
  assert.equal(paypalLib.amountsEqual("9.90", "9.9"), true);
  assert.equal(paypalLib.amountsEqual("9.90", "9.91"), false);
  assert.equal(paypalLib.amountsEqual(null, "9.90"), false);
});
test("extractCapturedAmount reads purchase_units captures", () => {
  const amt = paypalLib.extractCapturedAmount({
    purchase_units: [
      {
        payments: { captures: [{ amount: { value: "9.90", currency_code: "USD" } }] },
      },
    ],
  });
  assert.equal(amt, "9.90");
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
function createMockDb(orderRow, userOverrides = {}) {
  let order = { ...orderRow };
  let user = {
    google_sub: order.google_sub,
    plan: "free",
    plan_expires_at: null,
    ...userOverrides,
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
          if (sql.includes("SELECT plan, plan_expires_at FROM users")) {
            return { plan: user.plan, plan_expires_at: user.plan_expires_at };
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

await testAsync("renewing same plan extends from current expiry", async () => {
  const farExpiry = new Date(Date.now() + 20 * 86400000).toISOString();
  const order = {
    id: 3,
    status: "pending",
    order_type: "subscription",
    plan_code: "pro",
    product_id: "pro_monthly",
    google_sub: "user-3",
    amount_usd: "9.90",
  };
  const db = createMockDb(order, { plan: "pro", plan_expires_at: farExpiry });
  const r = await fulfill.fulfillPaidOrder(db, order);
  assert.equal(r.applied, true);
  assert.equal(r.extended, true);
  const newExpiry = new Date(db._state().user.plan_expires_at).getTime();
  const expectedMin = new Date(farExpiry).getTime() + 27 * 86400000;
  assert.ok(newExpiry >= expectedMin, `expected extension beyond remaining, got ${db._state().user.plan_expires_at}`);
});

test("resolvePlanExtensionBase stacks same active plan", () => {
  const expires = new Date(Date.now() + 10 * 86400000).toISOString();
  const base = fulfill.resolvePlanExtensionBase(
    { plan: "pro", plan_expires_at: expires },
    "pro"
  );
  assert.equal(base.toISOString(), new Date(expires).toISOString());
});

test("resolvePlanExtensionBase starts now for upgrade", () => {
  const expires = new Date(Date.now() + 10 * 86400000).toISOString();
  const before = Date.now();
  const base = fulfill.resolvePlanExtensionBase(
    { plan: "pro", plan_expires_at: expires },
    "business"
  );
  assert.ok(base.getTime() >= before - 1000);
  assert.ok(base.getTime() <= Date.now() + 1000);
});

test("buildPaymentSuccessQuery includes plan details", () => {
  const qs = fulfill.buildPaymentSuccessQuery(
    {
      id: 42,
      product_id: "pro_monthly",
      order_type: "subscription",
      plan_code: "pro",
      amount_usd: "9.90",
    },
    { kind: "plan", plan: "pro", expiresAt: "2026-08-01T00:00:00.000Z", extended: true }
  );
  const p = new URLSearchParams(qs);
  assert.equal(p.get("payment"), "success");
  assert.equal(p.get("kind"), "plan");
  assert.equal(p.get("plan"), "pro");
  assert.equal(p.get("extended"), "1");
  assert.equal(p.get("product"), "pro_monthly");
  assert.equal(p.get("amount"), "9.90");
  assert.equal(p.get("order"), "42");
});

// Auth return path sanitization
const authLib = await import(
  pathToFileURL(path.join(root, "functions/api/auth/_lib.js")).href
);
console.log("\nauth return path");
test("sanitizeReturnPath allows relative paths", () => {
  assert.equal(authLib.sanitizeReturnPath("/pricing/?buy=pro_monthly"), "/pricing/?buy=pro_monthly");
  assert.equal(authLib.sanitizeReturnPath("/credits/?buy=credits_100"), "/credits/?buy=credits_100");
});
test("sanitizeReturnPath blocks open redirects", () => {
  assert.equal(authLib.sanitizeReturnPath("https://evil.com"), null);
  assert.equal(authLib.sanitizeReturnPath("//evil.com"), null);
  assert.equal(authLib.sanitizeReturnPath("pricing"), null);
  assert.equal(authLib.sanitizeReturnPath("/\\evil"), null);
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

// Shared products.js is the single catalog for PayPal + frontend
console.log("\nshared products catalog");
const sharedProducts = await import(
  pathToFileURL(path.join(root, "shared/products.js")).href
);
test("shared products match PRODUCTS export", () => {
  assert.equal(paypalLib.PRODUCTS.pro_monthly.amount, sharedProducts.default.pro_monthly.amount);
  assert.equal(paypalLib.PRODUCTS.credits_20.credits, sharedProducts.default.credits_20.credits);
  assert.equal(paypalLib.PRODUCTS.credits_100.amount, "9.90");
});
test("shared products has all plan + credit SKUs", () => {
  for (const id of [
    "pro_monthly",
    "pro_yearly",
    "business_monthly",
    "business_yearly",
    "credits_20",
    "credits_100",
    "credits_300",
    "credits_800",
  ]) {
    assert.ok(sharedProducts.default[id], `missing ${id}`);
  }
});
const productsTs = fs.readFileSync(path.join(root, "src/lib/products.ts"), "utf8");
test("frontend products.ts imports shared products.js", () => {
  assert.match(productsTs, /shared\/products\.js/);
});
const paypalLibSrc = fs.readFileSync(
  path.join(root, "functions/api/payment/paypal-lib.js"),
  "utf8"
);
test("paypal-lib imports shared products.js", () => {
  assert.match(paypalLibSrc, /shared\/products\.js/);
});

// BgRemover UX helpers (source-level — pure functions duplicated for assert)
console.log("\nbatch ETA helper");
function formatEta(remainingJobs, avgSec, currentElapsed = 0) {
  if (remainingJobs <= 0) return "";
  const secPer = avgSec > 0 ? avgSec : 8;
  const currentLeft = Math.max(0, secPer - currentElapsed);
  const queuedLeft = Math.max(0, remainingJobs - 1) * secPer;
  const total = Math.round(currentLeft + queuedLeft);
  if (total < 5) return "a few seconds";
  if (total < 60) return `~${total}s left`;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins < 3 && secs > 0) return `~${mins}m ${secs}s left`;
  if (secs < 15) return `~${mins} min left`;
  return `~${mins + 1} min left`;
}
test("formatEta for multi-image batch", () => {
  assert.match(formatEta(5, 10, 0), /left/);
  assert.equal(formatEta(0, 10, 0), "");
  assert.match(formatEta(1, 8, 7), /few seconds|~1s|left/);
});
const bgSrc = fs.readFileSync(path.join(root, "src/components/BgRemover.tsx"), "utf8");
test("BgRemover has dual download CTAs and deep-link export", () => {
  assert.match(bgSrc, /Transparent PNG/);
  assert.match(bgSrc, /White background JPG/);
  assert.match(bgSrc, /export=white/);
  assert.match(bgSrc, /handleDownloadAmazonWhite/);
  assert.match(bgSrc, /batchEta/);
});
const whiteSrc = fs.readFileSync(
  path.join(root, "src/app/white-background/page.tsx"),
  "utf8"
);
test("white-background CTA deep-links export=white", () => {
  assert.match(whiteSrc, /export=white&size=2000/);
});
test("BgRemover white ZIP defaults to 2000", () => {
  assert.match(bgSrc, /ZIP white JPG/);
  assert.match(bgSrc, /zipSize.*2000|2000.*zipSize|canvasSize === "original" \? "2000"/);
  assert.match(bgSrc, /handleDownloadAllCustomSolid|white_jpeg_zip/);
});
const analyticsSrc = fs.readFileSync(path.join(root, "src/lib/analytics.ts"), "utf8");
test("analytics has GA4 ecommerce helpers", () => {
  assert.match(analyticsSrc, /trackBeginCheckout/);
  assert.match(analyticsSrc, /trackPurchase/);
  assert.match(analyticsSrc, /begin_checkout/);
  assert.match(analyticsSrc, /view_pricing/);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
