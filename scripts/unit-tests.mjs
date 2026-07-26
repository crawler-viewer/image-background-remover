/**
 * Lightweight unit tests (no extra deps).
 * Run: node scripts/unit-tests.mjs  or  pnpm test
 *
 * Frontend TypeScript modules are imported for real (native type stripping,
 * Node >= 22.18) through scripts/ts-alias-hook.mjs, which resolves the `@/*`
 * alias and extensionless specifiers. Only genuinely non-code contracts
 * (workflow YAML, a landing-page href) are still asserted as text.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Importing .ts needs unflagged type stripping (Node 22.18+ / 24+)
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(
    `\nThis suite imports frontend .ts modules directly and needs Node >= 22.18 ` +
      `(found ${process.versions.node}). Upgrade Node, or run with ` +
      `--experimental-strip-types on 22.6–22.17.\n`
  );
  process.exit(1);
}

register("./ts-alias-hook.mjs", import.meta.url);

/** Import a TypeScript module from src/ by repo-relative path. */
function importTs(relPath) {
  return import(pathToFileURL(path.join(root, relPath)).href);
}

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

const fs = await import("node:fs");

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

const sharedPlanLimits = await import(
  pathToFileURL(path.join(root, "shared/plan-limits.js")).href
);

console.log("\nplan-config + shared/plan-limits");
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
test("plan-config re-exports shared PLAN_LIMITS numbers", () => {
  for (const code of ["guest", "free", "pro", "business"]) {
    const shared = sharedPlanLimits.PLAN_LIMITS[code];
    const cfg = planConfig.getPlanConfig(code);
    assert.equal(cfg.monthlyLimit, shared.monthlyLimit, `${code} monthlyLimit`);
    assert.equal(cfg.maxFileSizeMb, shared.maxFileSizeMb, `${code} maxFileSizeMb`);
    assert.equal(
      cfg.maxFileSizeBytes,
      shared.maxFileSizeMb * 1024 * 1024,
      `${code} maxFileSizeBytes`
    );
  }
});
test("MAX_BATCH_SIZE and GUEST_IP from shared", () => {
  assert.equal(planConfig.MAX_BATCH_SIZE, sharedPlanLimits.MAX_BATCH_SIZE);
  assert.equal(planConfig.GUEST_IP_MONTHLY_LIMIT, sharedPlanLimits.GUEST_IP_MONTHLY_LIMIT);
  assert.equal(sharedPlanLimits.MAX_BATCH_SIZE, 20);
  assert.equal(sharedPlanLimits.GUEST_IP_MONTHLY_LIMIT, 15);
});
test("plan-config.js imports shared/plan-limits.js", () => {
  const src = fs.readFileSync(path.join(root, "functions/api/plan-config.js"), "utf8");
  assert.match(src, /shared\/plan-limits\.js/);
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
test("extractWebhookCaptureAmount reads capture resource money", () => {
  const amt = paypalLib.extractWebhookCaptureAmount({
    id: "CAP-1",
    amount: { value: "29.90", currency_code: "USD" },
  });
  assert.deepEqual(amt, { value: "29.90", currency: "USD" });
  assert.equal(paypalLib.extractWebhookCaptureAmount({ id: "CAP-1" }), null);
  assert.equal(paypalLib.extractWebhookCaptureAmount(null), null);
});
test("verifyCapturedAmount accepts an exact match", () => {
  const r = paypalLib.verifyCapturedAmount(
    { amount_usd: "9.90", currency: "USD" },
    { value: "9.9", currency: "USD" }
  );
  assert.equal(r.ok, true);
});
test("verifyCapturedAmount rejects underpay, wrong currency, missing amount", () => {
  const order = { amount_usd: "299.00", currency: "USD" };
  assert.equal(
    paypalLib.verifyCapturedAmount(order, { value: "0.01", currency: "USD" }).reason,
    "amount_mismatch"
  );
  assert.equal(
    paypalLib.verifyCapturedAmount(order, { value: "299.00", currency: "MXN" }).reason,
    "currency_mismatch"
  );
  assert.equal(paypalLib.verifyCapturedAmount(order, null).reason, "missing_amount");
  assert.equal(paypalLib.verifyCapturedAmount(null, { value: "299.00" }).reason, "missing_order");
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

console.log("\npaypal webhook handler");
const webhook = await import(
  pathToFileURL(path.join(root, "functions/api/payment/paypal/webhook.js")).href
);

function webhookRequest(event, headers = {}) {
  return new Request("https://picturebackgroundremover.xyz/api/payment/paypal/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(event),
  });
}

/** Any D1 access at all is a failure for the reject paths. */
function explodingDb(onUse) {
  return {
    prepare() {
      onUse();
      throw new Error("DB must not be touched on a rejected webhook");
    },
  };
}

async function withSilencedConsole(fn) {
  const { error, warn, log } = console;
  console.error = () => {};
  console.warn = () => {};
  console.log = () => {};
  try {
    return await fn();
  } finally {
    console.error = error;
    console.warn = warn;
    console.log = log;
  }
}

await testAsync("webhook fails closed without PAYPAL_WEBHOOK_ID", async () => {
  let dbUsed = false;
  const res = await withSilencedConsole(() =>
    webhook.onRequestPost({
      request: webhookRequest({
        event_type: "PAYMENT.CAPTURE.COMPLETED",
        resource: {
          amount: { value: "9.90", currency_code: "USD" },
          supplementary_data: { related_ids: { order_id: "PAYPAL-1" } },
        },
      }),
      env: { DB: explodingDb(() => (dbUsed = true)) },
    })
  );

  // 503 (not 200) so PayPal retries once the variable is configured
  assert.equal(res.status, 503);
  assert.equal(dbUsed, false, "no fulfilment may happen without signature verification");
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

// Plan resolution (expiry / downgrade)
const planLib = await import(
  pathToFileURL(path.join(root, "functions/api/auth/plan.js")).href
);
console.log("\nresolveActivePlan / computeActivePlan");
test("guest when user is null", () => {
  const r = planLib.computeActivePlan(null);
  assert.equal(r.planCode, "guest");
  assert.equal(r.needsDowngrade, false);
});
test("free user stays free", () => {
  const r = planLib.computeActivePlan({ plan: "free", plan_expires_at: null });
  assert.equal(r.planCode, "free");
  assert.equal(r.expired, false);
});
test("active pro is kept", () => {
  const future = new Date(Date.now() + 7 * 86400000).toISOString();
  const r = planLib.computeActivePlan({ plan: "pro", plan_expires_at: future });
  assert.equal(r.planCode, "pro");
  assert.equal(r.needsDowngrade, false);
  assert.equal(r.planExpiresAt, future);
});
test("expired pro becomes free and needs downgrade", () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  const r = planLib.computeActivePlan({ plan: "pro", plan_expires_at: past });
  assert.equal(r.planCode, "free");
  assert.equal(r.expired, true);
  assert.equal(r.previousPlan, "pro");
  assert.equal(r.needsDowngrade, true);
  assert.equal(r.planExpiresAt, past);
});
test("expired business becomes free", () => {
  const past = new Date(Date.now() - 1000).toISOString();
  const r = planLib.computeActivePlan({ plan: "business", plan_expires_at: past });
  assert.equal(r.planCode, "free");
  assert.equal(r.previousPlan, "business");
});
test("isPlanExpired boundary", () => {
  assert.equal(planLib.isPlanExpired(null), false);
  assert.equal(planLib.isPlanExpired(new Date(Date.now() - 1).toISOString()), true);
  assert.equal(planLib.isPlanExpired(new Date(Date.now() + 60_000).toISOString()), false);
});
test("planExpiryInfo forceExpired", () => {
  const info = planLib.planExpiryInfo("2026-01-01T00:00:00.000Z", { forceExpired: true });
  assert.equal(info.plan_expired, true);
  assert.equal(info.plan_days_remaining, 0);
});
await testAsync("resolveActivePlan writes downgrade to DB", async () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  let updated = null;
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            this._args = args;
            return this;
          },
          async run() {
            if (sql.includes("UPDATE users SET plan = 'free'")) {
              updated = this._args;
            }
            return { meta: { changes: 1 } };
          },
        };
      },
    },
  };
  const r = await planLib.resolveActivePlan(
    env,
    { google_sub: "sub-1", plan: "pro", plan_expires_at: past }
  );
  assert.equal(r.planCode, "free");
  assert.equal(r.plan.code, "free");
  assert.ok(updated);
  assert.equal(updated[1], "sub-1");
});

// Credit helpers (mock D1)
const usageLib = await import(
  pathToFileURL(path.join(root, "functions/api/usage.js")).href
);
console.log("\ncredit deduct / refund");
function createCreditDb(initialBalance) {
  let balance = initialBalance;
  return {
    _balance: () => balance,
    prepare(sql) {
      const self = {
        binds: [],
        bind(...args) {
          self.binds = args;
          return self;
        },
        async run() {
          if (sql.includes("balance = balance - 1")) {
            const sub = self.binds[1];
            if (balance > 0) {
              balance -= 1;
              return { meta: { changes: 1 } };
            }
            return { meta: { changes: 0 } };
          }
          if (sql.includes("balance = balance + 1")) {
            balance += 1;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
        async first() {
          if (sql.includes("SELECT balance")) {
            return { balance };
          }
          return null;
        },
      };
      return self;
    },
  };
}
await testAsync("tryDeductCredit succeeds when balance > 0", async () => {
  const db = createCreditDb(2);
  const ok = await usageLib.tryDeductCredit({ DB: db }, "u1");
  assert.equal(ok, true);
  assert.equal(db._balance(), 1);
});
await testAsync("tryDeductCredit fails when balance is 0", async () => {
  const db = createCreditDb(0);
  const ok = await usageLib.tryDeductCredit({ DB: db }, "u1");
  assert.equal(ok, false);
  assert.equal(db._balance(), 0);
});
await testAsync("refundCredit restores one credit", async () => {
  const db = createCreditDb(0);
  await usageLib.refundCredit({ DB: db }, "u1");
  assert.equal(db._balance(), 1);
});
await testAsync("concurrent-style double deduct cannot go negative", async () => {
  const db = createCreditDb(1);
  const a = await usageLib.tryDeductCredit({ DB: db }, "u1");
  const b = await usageLib.tryDeductCredit({ DB: db }, "u1");
  assert.equal(a, true);
  assert.equal(b, false);
  assert.equal(db._balance(), 0);
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

// Frontend pricing alignment — real imports, so the rendered copy is asserted
console.log("\npricing + plan limits (frontend modules)");
const planLimitsTs = await importTs("src/lib/plan-limits.ts");
const pricing = await importTs("src/lib/pricing.ts");

test("frontend plan limits are the shared numbers, not a copy", () => {
  for (const code of ["guest", "free", "pro", "business"]) {
    assert.deepEqual(
      planLimitsTs.getPlanLimits(code),
      sharedPlanLimits.getPlanLimits(code),
      code
    );
  }
  assert.equal(planLimitsTs.MAX_BATCH_SIZE, sharedPlanLimits.MAX_BATCH_SIZE);
  assert.equal(planLimitsTs.GUEST_IP_MONTHLY_LIMIT, sharedPlanLimits.GUEST_IP_MONTHLY_LIMIT);
});

test("every pricing card renders its plan's shared numbers", () => {
  for (const plan of pricing.pricingPlans) {
    const limits = sharedPlanLimits.getPlanLimits(plan.code);
    const features = plan.features.join(" | ");
    assert.match(
      features,
      new RegExp(`\\b${limits.monthlyLimit} removals`),
      `${plan.code} removals`
    );
    assert.match(features, new RegExp(`${limits.maxFileSizeMb}MB`), `${plan.code} upload size`);
  }
});

test("prepaid plans say no auto-renew; free tiers advertise the batch cap", () => {
  const byCode = Object.fromEntries(pricing.pricingPlans.map((p) => [p.code, p]));
  for (const code of ["pro", "business"]) {
    assert.match(byCode[code].features.join(" | "), /no auto-renew/i, code);
  }
  for (const code of ["guest", "free"]) {
    assert.match(
      byCode[code].features.join(" | "),
      new RegExp(`Batch up to ${sharedPlanLimits.MAX_BATCH_SIZE} images`),
      code
    );
  }
});

test("comparison table + FAQ quote the shared numbers", () => {
  const removalsRow = pricing.comparisonRows.find((r) => r.label === "Monthly removals");
  for (const code of ["guest", "free", "pro", "business"]) {
    assert.match(
      String(removalsRow[code]),
      new RegExp(`${sharedPlanLimits.getPlanLimits(code).monthlyLimit}`),
      code
    );
  }
  const batchRow = pricing.comparisonRows.find((r) => r.label.startsWith("Batch upload"));
  assert.equal(batchRow.pro, String(sharedPlanLimits.MAX_BATCH_SIZE));

  const faq = pricing.pricingFaqs.map((f) => `${f.q} ${f.a}`).join("\n");
  assert.match(faq, new RegExp(`${sharedPlanLimits.getPlanLimits("guest").monthlyLimit} free`));
  assert.match(faq, /prepaid/i);
  // Guard against the old business=800 drift
  assert.doesNotMatch(faq, /800 removals/);
});

// Shared products.js is the single catalog for PayPal + frontend
// Rate limit helpers + daily budget
const rateLimitShared = await import(
  pathToFileURL(path.join(root, "shared/rate-limit.js")).href
);
const costGuard = await import(
  pathToFileURL(path.join(root, "functions/api/cost-guard.js")).href
);
const usageForRate = await import(
  pathToFileURL(path.join(root, "functions/api/usage.js")).href
);

console.log("\nrate limiter (D1 batch)");

/**
 * Fake D1 for assertRateLimit: `batch()` answers [insert, count], and every
 * follow-up statement is recorded so we can assert on the rejection cleanup.
 */
function fakeRateLimitDb({ count, hitId = 500, throwOn = null }) {
  const statements = [];
  const db = {
    statements,
    prepare(sql) {
      const stmt = {
        sql,
        args: [],
        bind(...args) {
          stmt.args = args;
          statements.push({ sql, args });
          return stmt;
        },
        async run() {
          if (throwOn && sql.includes(throwOn)) throw new Error(throwOn);
          return { meta: { changes: 1, last_row_id: hitId } };
        },
        async first() {
          return { count };
        },
      };
      return stmt;
    },
    async batch() {
      if (throwOn) throw new Error(throwOn);
      return [
        { meta: { last_row_id: hitId, changes: 1 } },
        { results: [{ count }] },
      ];
    },
  };
  return db;
}

await testAsync("rate limiter allows up to the window max", async () => {
  const db = fakeRateLimitDb({ count: rateLimitShared.RATE_LIMIT_MAX_PER_WINDOW });
  const r = await usageForRate.assertRateLimit({ DB: db }, { clientIp: "1.2.3.4" });
  assert.equal(r.allowed, true);
  assert.equal(r.used, rateLimitShared.RATE_LIMIT_MAX_PER_WINDOW);
  assert.equal(
    db.statements.some((s) => s.sql.includes("DELETE FROM rate_limit_logs WHERE id")),
    false,
    "an accepted hit must stay in the window"
  );
});

await testAsync("rate limiter rejects past the max and removes its own hit", async () => {
  const db = fakeRateLimitDb({ count: rateLimitShared.RATE_LIMIT_MAX_PER_WINDOW + 1, hitId: 77 });
  const r = await usageForRate.assertRateLimit({ DB: db }, { clientIp: "1.2.3.4" });
  assert.equal(r.allowed, false);
  assert.equal(r.retryAfterSec, 60);
  // Rejected attempts must not extend the window, or a retrying client never recovers
  const cleanup = db.statements.find((s) =>
    s.sql.includes("DELETE FROM rate_limit_logs WHERE id")
  );
  assert.ok(cleanup, "rejected hit should be deleted");
  assert.deepEqual(cleanup.args, [77]);
});

await testAsync("rate limiter fails open only when the table is missing", async () => {
  const missing = fakeRateLimitDb({ count: 1, throwOn: "no such table: rate_limit_logs" });
  const open = await withSilencedConsole(() =>
    usageForRate.assertRateLimit({ DB: missing }, { clientIp: "1.2.3.4" })
  );
  assert.equal(open.allowed, true, "pre-migration must not block traffic");

  const broken = fakeRateLimitDb({ count: 1, throwOn: "D1_ERROR: network" });
  const closed = await withSilencedConsole(() =>
    usageForRate.assertRateLimit({ DB: broken }, { clientIp: "1.2.3.4" })
  );
  assert.equal(closed.allowed, false, "a DB blip must not silently disable the limiter");
  assert.equal(closed.error, true);
});

console.log("\nquota claim ranking");

/** Fake D1 that returns one fixed row and records the SQL it was asked for. */
function fakeRowDb(row) {
  const seen = [];
  return {
    seen,
    prepare(sql) {
      const stmt = {
        bind(...args) {
          seen.push({ sql, args });
          return stmt;
        },
        async first() {
          return row;
        },
      };
      return stmt;
    },
  };
}

await testAsync("getUserUsageRank ranks the claimed row, not the total", async () => {
  const db = fakeRowDb({ rank: 21 });
  const rank = await usageForRate.getUserUsageRank({ DB: db }, "sub-1", 4242);
  assert.equal(rank, 21);

  const { sql, args } = db.seen[0];
  assert.match(sql, /id <= \?/, "rank must be scoped to rows at or before the claim");
  assert.equal(args[0], "sub-1");
  assert.equal(args[3], 4242);
  // Rank 21 with a limit of 20 → this claim loses; rank 20 would have won
  assert.equal(rank > planConfig.getPlanConfig("free").monthlyLimit, true);
});

await testAsync("getUserUsageRank short-circuits without a claim id", async () => {
  const db = fakeRowDb({ rank: 9 });
  assert.equal(await usageForRate.getUserUsageRank({ DB: db }, "sub-1", 0), 0);
  assert.equal(db.seen.length, 0, "no query for a missing claim");
});

await testAsync("getGuestUsageRanks covers cookie and IP rows in one query", async () => {
  const db = fakeRowDb({ cookie_rank: 3, ip_rank: 11 });
  const ranks = await usageForRate.getGuestUsageRanks(
    { DB: db },
    { guestKey: "guest-1", clientIp: "9.9.9.9", guestLogId: 10, ipLogId: 11 }
  );
  assert.deepEqual(ranks, { cookieRank: 3, ipRank: 11 });
  assert.equal(db.seen.length, 1, "one round trip");
  assert.deepEqual(db.seen[0].args[4], "ip:9.9.9.9");
});

await testAsync("getGuestUsageRanks skips the IP rank when no mirror row exists", async () => {
  const db = fakeRowDb({ cookie_rank: 2 });
  const ranks = await usageForRate.getGuestUsageRanks(
    { DB: db },
    { guestKey: "guest-1", clientIp: "unknown", guestLogId: 10, ipLogId: null }
  );
  assert.deepEqual(ranks, { cookieRank: 2, ipRank: 0 });
  assert.doesNotMatch(db.seen[0].sql, /ip_rank/);
});

console.log("\nrate-limit + cost-guard");
test("shared rate limit constants are sensible", () => {
  assert.equal(rateLimitShared.RATE_LIMIT_WINDOW_MS, 60_000);
  assert.equal(rateLimitShared.RATE_LIMIT_MAX_PER_WINDOW, 12);
  assert.equal(rateLimitShared.BATCH_MIN_GAP_MS, 5000);
  assert.equal(rateLimitShared.BATCH_RATE_LIMIT_MAX_RETRIES, 3);
});
test("usage.js re-exports shared rate limit constants", () => {
  assert.equal(usageForRate.RATE_LIMIT_WINDOW_MS, rateLimitShared.RATE_LIMIT_WINDOW_MS);
  assert.equal(usageForRate.RATE_LIMIT_MAX_PER_WINDOW, rateLimitShared.RATE_LIMIT_MAX_PER_WINDOW);
});
test("parseRetryAfterSec prefers header over body", () => {
  assert.equal(
    rateLimitShared.parseRetryAfterSec({
      headerValue: "15",
      bodyRetryAfterSec: 60,
      fallback: 90,
    }),
    15
  );
});
test("parseRetryAfterSec uses body when no header", () => {
  assert.equal(
    rateLimitShared.parseRetryAfterSec({
      headerValue: null,
      bodyRetryAfterSec: 45,
    }),
    45
  );
});
test("parseRetryAfterSec clamps to max and min 1", () => {
  assert.equal(
    rateLimitShared.parseRetryAfterSec({ bodyRetryAfterSec: 999, max: 90 }),
    90
  );
  assert.equal(
    rateLimitShared.parseRetryAfterSec({ bodyRetryAfterSec: 0, fallback: 0 }),
    1
  );
});
test("dayRangeUtc is midnight-aligned UTC", () => {
  const now = new Date("2026-07-21T15:30:00.000Z");
  const { start, end } = costGuard.dayRangeUtc(now);
  assert.equal(start, "2026-07-21T00:00:00.000Z");
  assert.equal(end, "2026-07-22T00:00:00.000Z");
});
test("getDailyUpstreamLimit treats empty as disabled", () => {
  assert.equal(costGuard.getDailyUpstreamLimit({}), 0);
  assert.equal(costGuard.getDailyUpstreamLimit({ DAILY_UPSTREAM_LIMIT: "" }), 0);
  assert.equal(costGuard.getDailyUpstreamLimit({ DAILY_UPSTREAM_LIMIT: "2000" }), 2000);
  assert.equal(costGuard.getDailyUpstreamLimit({ DAILY_UPSTREAM_LIMIT: "0" }), 0);
});
await testAsync("assertDailyUpstreamBudget disabled allows traffic", async () => {
  const r = await costGuard.assertDailyUpstreamBudget({});
  assert.equal(r.allowed, true);
  assert.equal(r.disabled, true);
});
await testAsync("assertDailyUpstreamBudget blocks when used >= limit", async () => {
  let queries = 0;
  let seenSql = "";
  const env = {
    DAILY_UPSTREAM_LIMIT: "10",
    DB: {
      prepare(sql) {
        queries += 1;
        seenSql = sql;
        return {
          bind() {
            return this;
          },
          async first() {
            return { count: 12 };
          },
        };
      },
    },
  };
  const r = await costGuard.assertDailyUpstreamBudget(env, new Date("2026-07-21T12:00:00Z"));
  assert.equal(r.allowed, false);
  assert.equal(r.used, 12);
  assert.equal(r.limit, 10);
  // Both tables are summed in a single D1 round trip
  assert.equal(queries, 1);
  assert.match(seenSql, /usage_logs/);
  assert.match(seenSql, /guest_usage_logs/);
});
await testAsync("assertDailyUpstreamBudget allows under limit", async () => {
  const env = {
    DAILY_UPSTREAM_LIMIT: "100",
    DB: {
      prepare() {
        return {
          bind() {
            return this;
          },
          async first() {
            return { count: 6 };
          },
        };
      },
    },
  };
  const r = await costGuard.assertDailyUpstreamBudget(env);
  assert.equal(r.allowed, true);
  assert.equal(r.used, 6);
  assert.equal(r.remaining, 94);
});
await testAsync("daily budget query never counts ip:* mirror rows", async () => {
  let seenSql = "";
  const env = {
    DAILY_UPSTREAM_LIMIT: "10",
    DB: {
      prepare(sql) {
        seenSql = sql;
        return { bind() { return this; }, async first() { return { count: 0 }; } };
      },
    },
  };
  await costGuard.assertDailyUpstreamBudget(env);
  assert.match(seenSql, /guest_key NOT LIKE 'ip:%'/);
});
console.log("\nreporting (guest mirror rows + admin auth)");
const stats = await import(pathToFileURL(path.join(root, "functions/api/stats.js")).href);
const adminReport = await import(
  pathToFileURL(path.join(root, "functions/api/admin/report.js")).href
);

/** Mock D1 that records every SQL string and answers every count with `value`. */
function countingDb(value = 0) {
  const queries = [];
  return {
    queries,
    prepare(sql) {
      queries.push(sql);
      return {
        bind() {
          return this;
        },
        async first() {
          return { count: value, c: value, total: value };
        },
        async all() {
          return { results: [] };
        },
      };
    },
  };
}

await testAsync("public stats exclude ip:* mirror rows", async () => {
  const db = countingDb(7);
  const res = await stats.onRequestGet({ env: { DB: db } });
  const body = await res.json();

  const guestQuery = db.queries.find((q) => q.includes("guest_usage_logs"));
  assert.ok(guestQuery, "stats must query guest_usage_logs");
  assert.match(guestQuery, /guest_key NOT LIKE 'ip:%'/);
  // 7 logged-in + 7 guest cookie rows, not 7 + 14
  assert.equal(body.totalProcessed, 14);
});

await testAsync("admin report rejects the API key in the query string", async () => {
  const res = await adminReport.onRequestGet({
    request: new Request("https://picturebackgroundremover.xyz/api/admin/report?key=s3cret"),
    env: { ADMIN_API_KEY: "s3cret", DB: countingDb(1) },
  });
  assert.equal(res.status, 401);
});

await testAsync("admin report accepts the x-admin-key header and de-dupes guests", async () => {
  const db = countingDb(4);
  const res = await adminReport.onRequestGet({
    request: new Request("https://picturebackgroundremover.xyz/api/admin/report", {
      headers: { "x-admin-key": "s3cret" },
    }),
    env: { ADMIN_API_KEY: "s3cret", DB: db },
  });
  assert.equal(res.status, 200);

  const guestQueries = db.queries.filter((q) => q.includes("guest_usage_logs"));
  assert.equal(guestQueries.length, 4, "today / yesterday / month / all-time");
  for (const q of guestQueries) {
    assert.match(q, /guest_key NOT LIKE 'ip:%'/);
  }
});

test("deploy workflow is gated on tests passing", () => {
  const src = fs.readFileSync(path.join(root, ".github/workflows/deploy.yml"), "utf8");
  assert.match(src, /needs:\s*test/);
  assert.match(src, /pnpm test/);
});

await testAsync("frontend rate-limit module mirrors the shared constants", async () => {
  const front = await importTs("src/lib/rate-limit.ts");
  assert.equal(front.RATE_LIMIT_WINDOW_MS, rateLimitShared.RATE_LIMIT_WINDOW_MS);
  assert.equal(front.RATE_LIMIT_MAX_PER_WINDOW, rateLimitShared.RATE_LIMIT_MAX_PER_WINDOW);
  assert.equal(front.BATCH_MIN_GAP_MS, rateLimitShared.BATCH_MIN_GAP_MS);
  assert.equal(front.BATCH_RATE_LIMIT_MAX_RETRIES, rateLimitShared.BATCH_RATE_LIMIT_MAX_RETRIES);
  // The batch loop paces on this: a gap below window/max would trip the server limit
  assert.ok(
    front.BATCH_MIN_GAP_MS >= front.RATE_LIMIT_WINDOW_MS / front.RATE_LIMIT_MAX_PER_WINDOW,
    "batch gap must keep a single client under the IP window"
  );
  assert.equal(front.parseRetryAfterSec({ headerValue: "12" }), 12);
});
test("static responses carry the baseline security headers", () => {
  const headers = fs.readFileSync(path.join(root, "public/_headers"), "utf8");
  const global = headers.slice(headers.indexOf("/*"));
  for (const h of [
    "X-Content-Type-Options: nosniff",
    "X-Frame-Options: DENY",
    "frame-ancestors 'none'",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy:",
  ]) {
    assert.ok(global.includes(h), `missing ${h}`);
  }
});
test("CI uses frozen-lockfile", () => {
  const ci = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
  const deploy = fs.readFileSync(path.join(root, ".github/workflows/deploy.yml"), "utf8");
  assert.match(ci, /frozen-lockfile/);
  assert.match(deploy, /frozen-lockfile/);
  assert.doesNotMatch(ci, /no-frozen-lockfile/);
  assert.doesNotMatch(deploy, /no-frozen-lockfile/);
});

console.log("\nremove-bg orchestration (guest path)");
const removeBg = await import(
  pathToFileURL(path.join(root, "functions/api/remove-bg.js")).href
);
const removeBgGuards = await import(
  pathToFileURL(path.join(root, "functions/api/_remove-bg-guards.js")).href
);

/**
 * In-memory D1 stand-in. Dispatches on the SQL we actually issue and throws on
 * anything unknown, so a newly added query cannot slip through untested.
 */
function fakeRemoveBgDb({ guestUsed = 0, ipUsed = 0, failOn = null } = {}) {
  const store = { seq: 100, inserted: [], deleted: [], guestUsed, ipUsed };

  const handle = (sql, args) => {
    const s = sql.replace(/\s+/g, " ").trim();

    // Simulate a D1 hiccup on one specific query
    if (failOn && s.includes(failOn)) {
      throw new Error(`D1_ERROR: simulated failure on ${failOn}`);
    }

    if (s.startsWith("INSERT INTO rate_limit_logs")) {
      return { meta: { last_row_id: ++store.seq, changes: 1 } };
    }
    if (s.startsWith("SELECT COUNT(*) AS count") && s.includes("FROM rate_limit_logs")) {
      return { results: [{ count: 1 }], row: { count: 1 } };
    }
    if (s.startsWith("DELETE FROM rate_limit_logs")) {
      return { meta: { changes: 0 } };
    }
    if (s.includes("AS cookie_used")) {
      return { row: { cookie_used: store.guestUsed, ip_used: store.ipUsed } };
    }
    if (s.startsWith("INSERT INTO guest_usage_logs")) {
      const id = ++store.seq;
      store.inserted.push({ id, guestKey: args[0] });
      return { meta: { last_row_id: id, changes: 1 } };
    }
    if (s.includes("AS cookie_rank")) {
      // The claim just added one row for each key
      return { row: { cookie_rank: store.guestUsed + 1, ip_rank: store.ipUsed + 1 } };
    }
    if (s.startsWith("DELETE FROM guest_usage_logs")) {
      store.deleted.push(args[0]);
      return { meta: { changes: 1 } };
    }
    throw new Error(`fakeRemoveBgDb: unexpected SQL: ${s}`);
  };

  return {
    store,
    prepare(sql) {
      const stmt = {
        sql,
        args: [],
        bind(...args) {
          stmt.args = args;
          return stmt;
        },
        async first() {
          return handle(sql, stmt.args).row ?? null;
        },
        async run() {
          return handle(sql, stmt.args);
        },
      };
      return stmt;
    },
    async batch(statements) {
      return statements.map((stmt) => handle(stmt.sql, stmt.args));
    },
  };
}

function imageUploadRequest() {
  const form = new FormData();
  form.append("image", new File([new Uint8Array(2048)], "cat.png", { type: "image/png" }));
  return new Request("https://picturebackgroundremover.xyz/api/remove-bg", {
    method: "POST",
    headers: { "cf-connecting-ip": "203.0.113.7" },
    body: form,
  });
}

async function withStubbedUpstream(response, fn) {
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return typeof response === "function" ? response() : response();
  };
  try {
    return { result: await fn(), calls: () => calls };
  } finally {
    globalThis.fetch = realFetch;
  }
}

await testAsync("no provider key configured → 503, upstream never called", async () => {
  const { result } = await withStubbedUpstream(
    () => new Response("should not happen", { status: 200 }),
    () =>
      withSilencedConsole(() =>
        removeBg.onRequestPost({ request: imageUploadRequest(), env: { DB: fakeRemoveBgDb() } })
      )
  );
  assert.equal(result.status, 503);
});

await testAsync("guest removal succeeds, mints the cookie on the same response", async () => {
  const db = fakeRemoveBgDb({ guestUsed: 0, ipUsed: 0 });
  const png = new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4]);

  const { result, calls } = await withStubbedUpstream(
    () => new Response(png, { status: 200, headers: { "Content-Type": "image/png" } }),
    () =>
      withSilencedConsole(() =>
        removeBg.onRequestPost({
          request: imageUploadRequest(),
          env: { DB: db, CLIPDROP_API_KEY: "test-key" },
        })
      )
  );

  assert.equal(result.status, 200);
  assert.equal(result.headers.get("Content-Type"), "image/png");
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.ok(result.headers.get("X-Request-Id"), "request id header for log correlation");
  // Guest cookie must ride the response that consumed the quota
  assert.match(result.headers.get("Set-Cookie") || "", /__bg_gid=[0-9a-f-]+/);
  assert.match(result.headers.get("Set-Cookie") || "", /HttpOnly/);
  assert.equal(calls(), 1, "one upstream call");

  // Cookie row + ip: mirror row, and nothing rolled back
  assert.equal(db.store.inserted.length, 2);
  assert.ok(db.store.inserted.some((r) => r.guestKey.startsWith("ip:")));
  assert.deepEqual(db.store.deleted, []);
});

await testAsync("guest over the monthly limit → 429 before any upstream spend", async () => {
  const guestLimit = planConfig.getPlanConfig("guest").monthlyLimit;
  const db = fakeRemoveBgDb({ guestUsed: guestLimit, ipUsed: guestLimit });

  const { result, calls } = await withStubbedUpstream(
    () => new Response("nope", { status: 200 }),
    () =>
      withSilencedConsole(() =>
        removeBg.onRequestPost({
          request: imageUploadRequest(),
          env: { DB: db, CLIPDROP_API_KEY: "test-key" },
        })
      )
  );

  assert.equal(result.status, 429);
  const body = await result.json();
  assert.equal(body.code, "GUEST_MONTHLY_LIMIT_REACHED");
  assert.equal(body.limit, guestLimit);
  assert.equal(calls(), 0, "no paid call once quota is gone");
  assert.equal(db.store.inserted.length, 0, "no usage rows for a rejected request");
});

await testAsync("upstream failure rolls back both claimed guest rows", async () => {
  const db = fakeRemoveBgDb();

  const { result } = await withStubbedUpstream(
    () => new Response("provider exploded", { status: 500 }),
    () =>
      withSilencedConsole(() =>
        removeBg.onRequestPost({
          request: imageUploadRequest(),
          env: { DB: db, CLIPDROP_API_KEY: "test-key" },
        })
      )
  );

  assert.equal(result.status, 502);
  assert.equal(db.store.inserted.length, 2);
  assert.equal(db.store.deleted.length, 2, "cookie row + ip mirror row released");
  assert.deepEqual(
    db.store.deleted.sort(),
    db.store.inserted.map((r) => r.id).sort(),
    "the rows released are the rows claimed"
  );
});

await testAsync("a D1 failure after claiming releases the rows, not the user's quota", async () => {
  // The rank query runs after the rows are inserted but before the claim is
  // handed to the orchestrator — the one window where a throw used to strand
  // them, silently costing a removal the caller never received.
  const db = fakeRemoveBgDb({ failOn: "AS cookie_rank" });

  const { result, calls } = await withStubbedUpstream(
    () => new Response("unreachable", { status: 200 }),
    () =>
      withSilencedConsole(() =>
        removeBg.onRequestPost({
          request: imageUploadRequest(),
          env: { DB: db, CLIPDROP_API_KEY: "test-key" },
        })
      )
  );

  assert.equal(result.status, 503);
  assert.equal((await result.json()).code, "QUOTA_CLAIM_FAILED");
  assert.equal(calls(), 0, "never reached the paid call");
  assert.equal(db.store.inserted.length, 2);
  assert.deepEqual(
    db.store.deleted.sort(),
    db.store.inserted.map((r) => r.id).sort(),
    "both claimed rows released despite the mid-flight failure"
  );
});

await testAsync("upstream 429 is surfaced as retryable with Retry-After", async () => {
  const db = fakeRemoveBgDb();
  const { result } = await withStubbedUpstream(
    () => new Response("busy", { status: 429 }),
    () =>
      withSilencedConsole(() =>
        removeBg.onRequestPost({
          request: imageUploadRequest(),
          env: { DB: db, CLIPDROP_API_KEY: "test-key" },
        })
      )
  );

  assert.equal(result.status, 429);
  assert.equal(result.headers.get("Retry-After"), "30");
  assert.equal((await result.json()).code, "UPSTREAM_RATE_LIMITED");
  assert.equal(db.store.deleted.length, 2, "claims released so the retry is free");
});

await testAsync("oversized Content-Length is rejected before the body is read", async () => {
  const plan = planConfig.getPlanConfig("free");
  let bodyRead = false;
  const request = {
    headers: new Headers({ "content-length": String(plan.maxFileSizeBytes * 4) }),
    formData: async () => {
      bodyRead = true;
      return new FormData();
    },
  };

  const outcome = await withSilencedConsole(() =>
    removeBgGuards.readUploadedImage(request, {
      plan,
      planCode: "free",
      requestId: "test",
    })
  );

  assert.equal(outcome.response.status, 413);
  assert.equal((await outcome.response.json()).code, "FILE_TOO_LARGE");
  assert.equal(bodyRead, false, "must not buffer a huge upload into Worker memory");
});

await testAsync("unsupported type and missing file are rejected with 400", async () => {
  const plan = planConfig.getPlanConfig("free");

  const gifForm = new FormData();
  gifForm.append("image", new File([new Uint8Array(64)], "a.gif", { type: "image/gif" }));
  const gif = await removeBgGuards.readUploadedImage(
    new Request("https://x/api/remove-bg", { method: "POST", body: gifForm }),
    { plan, planCode: "free", requestId: "t" }
  );
  assert.equal(gif.response.status, 400);
  assert.match((await gif.response.json()).error, /PNG, JPG, or WebP/);

  const empty = await removeBgGuards.readUploadedImage(
    new Request("https://x/api/remove-bg", { method: "POST", body: new FormData() }),
    { plan, planCode: "free", requestId: "t" }
  );
  assert.equal((await empty.response.json()).code, "NO_IMAGE");
});

console.log("\ncheckout throttle");
const createCheckout = await import(
  pathToFileURL(path.join(root, "functions/api/payment/create-checkout.js")).href
);

const CHECKOUT_ENV = {
  AUTH_SECRET: "test-secret-for-unit-tests",
  PAYPAL_CLIENT_ID: "id",
  PAYPAL_CLIENT_SECRET: "secret",
  PAYPAL_SANDBOX: "false",
  SITE_URL: "https://picturebackgroundremover.xyz",
};

/** Fake D1 for create-checkout: one user row, a configurable order count. */
function fakeCheckoutDb(ordersInWindow) {
  const store = { inserted: 0, countQueries: 0, updates: [] };
  const handle = (sql) => {
    const s = sql.replace(/\s+/g, " ").trim();
    if (s.startsWith("ALTER TABLE")) return { meta: {} };
    if (s.includes("FROM users")) {
      return { row: { id: 7, google_sub: "sub-7", email: "a@b.c", plan: "free", status: "active" } };
    }
    if (s.includes("FROM payment_orders")) {
      store.countQueries += 1;
      return { row: { count: ordersInWindow } };
    }
    if (s.startsWith("INSERT INTO payment_orders")) {
      store.inserted += 1;
      return { meta: { last_row_id: 900 + store.inserted, changes: 1 } };
    }
    if (s.startsWith("UPDATE payment_orders")) {
      store.updates.push(s);
      return { meta: { changes: 1 } };
    }
    throw new Error(`fakeCheckoutDb: unexpected SQL: ${s}`);
  };
  return {
    store,
    prepare(sql) {
      const stmt = {
        bind() {
          return stmt;
        },
        async first() {
          return handle(sql).row ?? null;
        },
        async run() {
          return handle(sql);
        },
      };
      return stmt;
    },
  };
}

async function checkoutRequest(productId) {
  const cookie = await authLib.createSessionCookie(CHECKOUT_ENV, {
    sub: "sub-7",
    email: "a@b.c",
    name: "Test",
  });
  return new Request("https://picturebackgroundremover.xyz/api/payment/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie.split(";")[0],
    },
    body: JSON.stringify({ productId }),
  });
}

await testAsync("checkout is throttled per account before PayPal is called", async () => {
  const db = fakeCheckoutDb(rateLimitShared.CHECKOUT_MAX_PER_WINDOW);
  const request = await checkoutRequest("pro_monthly");
  const { result, calls } = await withStubbedUpstream(
    () => new Response("{}", { status: 200 }),
    () =>
      withSilencedConsole(() =>
        createCheckout.onRequestPost({ request, env: { ...CHECKOUT_ENV, DB: db } })
      )
  );

  assert.equal(result.status, 429);
  const body = await result.json();
  assert.equal(body.code, "CHECKOUT_RATE_LIMITED");
  assert.equal(result.headers.get("Retry-After"), "3600");
  assert.equal(db.store.inserted, 0, "no order row for a throttled attempt");
  assert.equal(calls(), 0, "PayPal never called");
});

await testAsync("checkout under the cap still reaches PayPal", async () => {
  const db = fakeCheckoutDb(rateLimitShared.CHECKOUT_MAX_PER_WINDOW - 1);
  let paypalCalls = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    paypalCalls += 1;
    // token endpoint, then create-order
    if (String(url).includes("/oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "t" }), { status: 200 });
    }
    return new Response(
      JSON.stringify({ id: "PP-1", links: [{ rel: "approve", href: "https://paypal/approve" }] }),
      { status: 200 }
    );
  };
  try {
    const request = await checkoutRequest("pro_monthly");
    const res = await withSilencedConsole(() =>
      createCheckout.onRequestPost({ request, env: { ...CHECKOUT_ENV, DB: db } })
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.paypalOrderId, "PP-1");
    assert.equal(body.approvalUrl, "https://paypal/approve");
    assert.equal(db.store.inserted, 1);
    assert.ok(paypalCalls >= 1);
  } finally {
    globalThis.fetch = realFetch;
  }
});

await testAsync("a failed PayPal call does not leave a pending order behind", async () => {
  const db = fakeCheckoutDb(0);
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("paypal down", { status: 500 });
  try {
    const request = await checkoutRequest("credits_100");
    const res = await withSilencedConsole(() =>
      createCheckout.onRequestPost({ request, env: { ...CHECKOUT_ENV, DB: db } })
    );
    assert.equal(res.status, 500);
    assert.equal(db.store.inserted, 1);
    // The row can never be fulfilled, so it must not sit in the table as pending
    assert.ok(
      db.store.updates.some((s) => /SET status = 'failed'/.test(s)),
      "orphaned order should be marked failed"
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});

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
await testAsync("frontend product catalog is the same SKUs and prices", async () => {
  const productsTs = await importTs("src/lib/products.ts");
  for (const [id, product] of Object.entries(sharedProducts.default)) {
    const front = productsTs.PRODUCTS[id];
    assert.ok(front, `frontend missing ${id}`);
    assert.equal(front.amount, product.amount, `${id} price`);
    assert.equal(front.type, product.type, `${id} type`);
  }
  // Price labels shown on /pricing must be derived from those amounts
  assert.equal(
    productsTs.planPriceLabel("pro", "monthly"),
    `${productsTs.formatUsdShort(sharedProducts.default.pro_monthly.amount)}/mo`
  );
});

console.log("\ntool helpers: ETA, canvas, deep links");
const bgFormat = await importTs("src/lib/bg-remover/format.ts");
const bgCanvas = await importTs("src/lib/bg-remover/canvas.ts");
const bgDeepLink = await importTs("src/lib/bg-remover/deep-link.ts");

test("formatEta for multi-image batch", () => {
  assert.match(bgFormat.formatEta(5, 10, 0), /left/);
  assert.equal(bgFormat.formatEta(0, 10, 0), "");
  assert.match(bgFormat.formatEta(1, 8, 7), /few seconds|~1s|left/);
  // 6 jobs × 10s = 60s → minutes, not "60s"
  assert.match(bgFormat.formatEta(6, 10, 0), /min left/);
  // No samples yet → falls back to the default estimate rather than 0
  assert.equal(bgFormat.formatEta(2, 0, 0), bgFormat.formatEta(2, bgFormat.DEFAULT_SEC_PER_IMAGE, 0));
});

test("formatFileSize and statusLabel", () => {
  assert.equal(bgFormat.formatFileSize(512), "512 B");
  assert.equal(bgFormat.formatFileSize(2048), "2.0 KB");
  assert.equal(bgFormat.formatFileSize(5 * 1024 * 1024), "5.0 MB");
  assert.equal(bgFormat.statusLabel("skipped"), "Skipped");
  assert.equal(bgFormat.planLabel("business"), "Business");
  assert.equal(bgFormat.planLabel(undefined), "—");
});

test("white/marketplace export upgrades 'original' to a 2000² square", () => {
  assert.equal(bgCanvas.resolveWhiteExportSize("original"), "2000");
  // An explicit choice is always honored
  assert.equal(bgCanvas.resolveWhiteExportSize("1000"), "1000");
  assert.equal(bgCanvas.resolveWhiteExportSize("1600"), "1600");
  assert.equal(bgCanvas.canvasEdge("original"), null);
  assert.equal(bgCanvas.canvasEdge("2000"), 2000);
});

test("export filename slugs", () => {
  assert.equal(bgCanvas.solidColorSlug("#ffffff"), "white");
  assert.equal(bgCanvas.solidColorSlug("#000000"), "black");
  assert.equal(bgCanvas.solidColorSlug("#12AB34"), "12ab34");
  assert.equal(bgCanvas.solidColorLabel("#12AB34"), "#12AB34");
  assert.equal(bgCanvas.sizeSlug("original"), "orig");
  assert.equal(bgCanvas.sizeSlug("2000"), "2000");
});

test("canvas size deep-link params", () => {
  assert.equal(bgCanvas.parseCanvasSizeParam("2000x2000"), "2000");
  assert.equal(bgCanvas.parseCanvasSizeParam(" ORIG "), "original");
  assert.equal(bgCanvas.parseCanvasSizeParam("1234"), null);
  assert.equal(bgCanvas.parseCanvasSizeParam(null), null);
});

test("?export=white lands on Amazon-ready defaults", () => {
  const link = bgDeepLink.parseExportDeepLink("#tool?export=white&size=2000", "");
  assert.equal(link.preferWhiteExport, true);
  assert.equal(link.bgColor, "#FFFFFF");
  assert.equal(link.canvasSize, "2000");
  assert.equal(link.openExportMenu, true);
  assert.equal(link.focusTool, true);
});

test("?export=white without a size still squares the canvas", () => {
  const link = bgDeepLink.parseExportDeepLink("#tool?export=amazon", "");
  assert.equal(link.canvasSize, "2000");
  assert.equal(link.preferWhiteExport, true);
});

test("deep link falls back to the query string and leaves defaults alone", () => {
  const black = bgDeepLink.parseExportDeepLink("", "?bg=black");
  assert.equal(black.bgColor, "#000000");
  assert.equal(black.preferWhiteExport, false);
  assert.equal(black.canvasSize, undefined);

  const bare = bgDeepLink.parseExportDeepLink("#tool", "");
  assert.equal(bare.bgColor, undefined);
  assert.equal(bare.canvasSize, undefined);
  assert.equal(bare.openExportMenu, false);
  assert.equal(bare.focusTool, true);
});

test("white-background landing CTA deep-links into the tool", () => {
  // Cross-file contract: the static page's href must parse to white + 2000.
  // This page puts the params on the pathname (`/?export=…#tool`), which is why
  // parseExportDeepLink falls back to location.search.
  const whiteSrc = fs.readFileSync(path.join(root, "src/app/white-background/page.tsx"), "utf8");
  const href = whiteSrc.match(/["'`](\/\?[^"'`]*#tool)["'`]/)?.[1];
  assert.ok(href, "landing page should link into the tool with export params");

  const url = new URL(href, "https://picturebackgroundremover.xyz");
  const link = bgDeepLink.parseExportDeepLink(url.hash, url.search);
  assert.equal(link.preferWhiteExport, true);
  assert.equal(link.canvasSize, "2000");
  assert.equal(link.focusTool, true);
});

console.log("\ntool helpers: quota, batch allowance, error mapping");
const bgQuotaView = await importTs("src/lib/bg-remover/quota-view.ts");
const bgAllowance = await importTs("src/lib/bg-remover/batch-allowance.ts");
const bgErrors = await importTs("src/lib/bg-remover/removal-errors.ts");
const MAX_BATCH = sharedPlanLimits.MAX_BATCH_SIZE;

test("credits only count for signed-in users", () => {
  const guest = bgQuotaView.deriveQuotaView({
    plan: "guest",
    used: 5,
    limit: 5,
    remaining: 0,
    credits: 99,
    maxFileSizeMb: 10,
    loggedIn: false,
  });
  assert.equal(guest.totalAvailable, 0);
  assert.equal(guest.usingCreditsNext, false);
  assert.equal(guest.usedPercent, 100);

  const paid = bgQuotaView.deriveQuotaView({
    plan: "pro",
    used: 200,
    limit: 200,
    remaining: 0,
    credits: 40,
    maxFileSizeMb: 25,
    loggedIn: true,
  });
  assert.equal(paid.totalAvailable, 40);
  assert.equal(paid.usingCreditsNext, true);
});

test("batch allowance caps at the shared batch size", () => {
  const r = bgAllowance.resolveBatchAllowance({
    quota: { plan: "pro", used: 0, limit: 200, remaining: 200, maxFileSizeMb: 25, loggedIn: true },
    fileCount: MAX_BATCH + 5,
    maxBatchSize: MAX_BATCH,
  });
  assert.equal(r.allowed, true);
  assert.equal(r.count, MAX_BATCH);
  assert.match(r.notice, new RegExp(`first ${MAX_BATCH} images`));
});

test("batch allowance trims to remaining quota + credits", () => {
  const r = bgAllowance.resolveBatchAllowance({
    quota: { plan: "free", used: 18, limit: 20, remaining: 2, credits: 1, maxFileSizeMb: 15, loggedIn: true },
    fileCount: 10,
    maxBatchSize: MAX_BATCH,
  });
  assert.equal(r.count, 3, "2 plan + 1 credit");
  assert.match(r.notice, /3 removals left/);
});

test("batch allowance blocks at zero with the right upsell code", () => {
  const guest = bgAllowance.resolveBatchAllowance({
    quota: { plan: "guest", used: 5, limit: 5, remaining: 0, maxFileSizeMb: 10, loggedIn: false },
    fileCount: 1,
    maxBatchSize: MAX_BATCH,
  });
  assert.equal(guest.allowed, false);
  assert.equal(guest.code, "GUEST_MONTHLY_LIMIT_REACHED");
  assert.match(guest.message, /Sign in/);

  const member = bgAllowance.resolveBatchAllowance({
    quota: { plan: "free", used: 20, limit: 20, remaining: 0, credits: 0, maxFileSizeMb: 15, loggedIn: true },
    fileCount: 1,
    maxBatchSize: MAX_BATCH,
  });
  assert.equal(member.allowed, false);
  assert.equal(member.code, "MONTHLY_LIMIT_REACHED");
  assert.match(member.message, /credits or upgrade/);
});

test("unknown quota still lets a batch start", () => {
  const r = bgAllowance.resolveBatchAllowance({
    quota: null,
    fileCount: 3,
    maxBatchSize: MAX_BATCH,
  });
  assert.equal(r.allowed, true);
  assert.equal(r.count, 3);
  assert.equal(r.notice, null);
});

test("RATE_LIMITED is retryable and honors Retry-After", () => {
  const { result, analytics } = bgErrors.mapRemovalFailure({
    status: 429,
    data: { code: "RATE_LIMITED", retryAfterSec: 60 },
    retryAfterHeader: "20",
    planHint: "free",
  });
  assert.equal(result.rateLimited, true);
  assert.equal(result.hardStop, false);
  assert.equal(result.retryAfterSec, 20, "header wins over body");
  assert.equal(analytics.event, "remove_error");
  assert.equal(analytics.params.reason, "rate_limited");
});

test("quota 429 stops the batch and drives the right upsell", () => {
  const guest = bgErrors.mapRemovalFailure({
    status: 429,
    data: { code: "GUEST_IP_LIMIT_REACHED", plan: "guest" },
    planHint: "guest",
  });
  assert.equal(guest.result.hardStop, true);
  assert.equal(guest.result.rateLimited, undefined);
  assert.equal(guest.result.limit.loggedIn, false);
  assert.match(guest.result.error, /this network/);
  assert.equal(guest.analytics.event, "limit_reached");

  const member = bgErrors.mapRemovalFailure({
    status: 429,
    data: { code: "MONTHLY_LIMIT_REACHED", plan: "pro" },
    planHint: "pro",
  });
  assert.equal(member.result.limit.loggedIn, true);
  assert.equal(member.analytics.params.plan, "pro");
});

test("daily budget and generic errors are distinguished", () => {
  const budget = bgErrors.mapRemovalFailure({
    status: 503,
    data: { code: "DAILY_BUDGET_EXCEEDED" },
    planHint: "free",
  });
  assert.equal(budget.result.hardStop, true);
  assert.equal(budget.analytics.params.reason, "daily_budget");

  const oversize = bgErrors.mapRemovalFailure({
    status: 413,
    data: { code: "FILE_TOO_LARGE", error: "File too large. Maximum size is 15MB for your current plan." },
    planHint: "free",
  });
  // One bad file must not stop the rest of the batch
  assert.equal(oversize.result.hardStop, undefined);
  assert.match(oversize.result.error, /Maximum size is 15MB/);
  assert.equal(oversize.analytics.params.reason, "server");

  const empty = bgErrors.mapRemovalFailure({ status: 500, data: {}, planHint: "free" });
  assert.match(empty.result.error, /Server error \(500\)/);
});

console.log("\nGA4 analytics helpers");
await testAsync("ecommerce events carry GA4-shaped params", async () => {
  const events = [];
  globalThis.window = { gtag: (...args) => events.push(args) };
  try {
    const analytics = await importTs("src/lib/analytics.ts");
    assert.equal(analytics.parseMoneyValue("9.90"), 9.9);
    assert.equal(analytics.parseMoneyValue("nope"), undefined);

    analytics.trackBeginCheckout({ productId: "pro_monthly", value: 9.9, productType: "subscription" });
    analytics.trackPurchase({ orderId: 42, productId: "pro_monthly", value: 9.9, kind: "plan" });
    analytics.trackViewPricing("test");

    // begin_checkout is mirrored as checkout_start for the older dashboards
    const names = events.map(([, name]) => name);
    assert.deepEqual(names, ["begin_checkout", "checkout_start", "purchase", "view_pricing"]);

    const [, , beginParams] = events[0];
    assert.equal(beginParams.currency, "USD");
    assert.equal(beginParams.value, 9.9);
    assert.equal(beginParams.product_id, "pro_monthly");
    assert.equal(beginParams.product_type, "subscription");

    const purchaseParams = events[2][2];
    // Stable transaction_id from the order row is what GA4 dedupes on
    assert.equal(purchaseParams.transaction_id, "po_42");
    assert.equal(purchaseParams.value, 9.9);
    assert.equal(purchaseParams.kind, "plan");
    // GA4 rejects undefined/null params — trackEvent must strip them
    for (const params of events.map(([, , p]) => p)) {
      for (const [key, value] of Object.entries(params)) {
        assert.ok(value !== undefined && value !== null, `${key} should be stripped when empty`);
      }
    }
  } finally {
    delete globalThis.window;
  }
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
