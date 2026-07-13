import { getUserWithSession } from "../auth/db";
import { json, readSession } from "../auth/_lib";
import { getPlanConfig } from "../plan-config";
import { assertMonthlyLimit } from "../usage";

function planExpiryInfo(planExpiresAt) {
  if (!planExpiresAt) {
    return {
      plan_expires_at: null,
      plan_expired: false,
      plan_days_remaining: null,
    };
  }

  const expiresMs = new Date(planExpiresAt).getTime();
  if (Number.isNaN(expiresMs)) {
    return {
      plan_expires_at: planExpiresAt,
      plan_expired: false,
      plan_days_remaining: null,
    };
  }

  const msLeft = expiresMs - Date.now();
  const days = Math.ceil(msLeft / 86400000);

  return {
    plan_expires_at: planExpiresAt,
    plan_expired: msLeft <= 0,
    plan_days_remaining: days,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const session = await readSession(request, env);
    if (!session?.sub) {
      return json({ user: null }, { status: 401 });
    }

    const user = await getUserWithSession(env, session);
    if (!user) {
      return json({ user: null }, { status: 404 });
    }

    let planCode = user.plan || "free";
    let planExpiresAt = user.plan_expires_at || null;

    // Mirror remove-bg: expire prepaid plans on read so Account stays accurate
    if (
      (planCode === "pro" || planCode === "business") &&
      planExpiresAt &&
      new Date(planExpiresAt) < new Date()
    ) {
      planCode = "free";
      planExpiresAt = null;
      await env.DB
        .prepare(
          `UPDATE users SET plan = 'free', plan_expires_at = NULL, updated_at = ? WHERE google_sub = ?`
        )
        .bind(new Date().toISOString(), user.google_sub)
        .run()
        .catch((e) => console.error("Failed to downgrade expired plan on account/me:", e));
    }

    const plan = getPlanConfig(planCode);
    const expiry = planExpiryInfo(
      planCode === "pro" || planCode === "business" ? user.plan_expires_at || planExpiresAt : null
    );

    // If we just downgraded, surface expired state clearly
    if (user.plan !== "free" && planCode === "free" && user.plan_expires_at) {
      expiry.plan_expires_at = user.plan_expires_at;
      expiry.plan_expired = true;
      expiry.plan_days_remaining = 0;
    }

    let quota = {
      used: 0,
      limit: plan.monthlyLimit,
      remaining: plan.monthlyLimit,
    };
    try {
      quota = await assertMonthlyLimit(env, user.google_sub, planCode);
    } catch (quotaError) {
      console.error("Failed to load quota for account/me:", quotaError);
    }

    let creditBalance = 0;
    try {
      const creditRow = await env.DB
        .prepare(`SELECT balance FROM user_credits WHERE google_sub = ? LIMIT 1`)
        .bind(user.google_sub)
        .first();
      creditBalance = Number(creditRow?.balance || 0);
    } catch {}

    return json({
      user: {
        id: user.id,
        google_sub: user.google_sub,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        plan: planCode,
        status: user.status || "active",
        created_at: user.created_at || null,
        updated_at: user.updated_at || null,
        last_seen_at: user.last_seen_at || null,
        last_login_at: user.last_login_at || null,
        plan_expires_at: expiry.plan_expires_at,
        plan_expired: expiry.plan_expired,
        plan_days_remaining: expiry.plan_days_remaining,
        month_used: quota.used,
        monthly_limit: quota.limit,
        remaining: quota.remaining,
        credits: creditBalance,
        max_file_size_mb: Math.round(plan.maxFileSizeBytes / (1024 * 1024)),
      },
    });
  } catch (error) {
    console.error("Failed to load account/me:", error);
    return json({ user: null }, { status: 500 });
  }
}
