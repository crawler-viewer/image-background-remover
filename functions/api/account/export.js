/**
 * GET /api/account/export — everything we hold about the signed-in user.
 *
 * GDPR Art. 15 (access) / Art. 20 (portability). Machine-readable JSON, served
 * as a download so it is one click from the account page.
 */
import { getUserWithSession } from "../auth/db.js";
import { json, readSession } from "../auth/_lib.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const session = await readSession(request, env);
    if (!session?.sub) return json({ error: "Not signed in." }, { status: 401 });

    const user = await getUserWithSession(env, session);
    if (!user) return json({ error: "Account not found." }, { status: 404 });

    const [usage, orders, credits] = await Promise.all([
      env.DB.prepare(
        `SELECT action, source_filename, status, created_at
           FROM usage_logs
          WHERE google_sub = ?
          ORDER BY created_at DESC`
      )
        .bind(user.google_sub)
        .all(),
      env.DB.prepare(
        `SELECT id, order_type, plan_code, credit_amount, amount_usd, currency,
                product_id, billing_period, status, created_at, paid_at
           FROM payment_orders
          WHERE google_sub = ?
          ORDER BY created_at DESC`
      )
        .bind(user.google_sub)
        .all(),
      env.DB.prepare(`SELECT balance, updated_at FROM user_credits WHERE google_sub = ? LIMIT 1`)
        .bind(user.google_sub)
        .first(),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: {
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        plan: user.plan,
        plan_expires_at: user.plan_expires_at,
        status: user.status,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
      // The image itself is never stored — only that a removal happened
      usage: usage?.results || [],
      payments: orders?.results || [],
      credits: credits || { balance: 0 },
      notes: [
        "Uploaded and processed images are not stored on our servers.",
        "Guest usage is keyed by an anonymous cookie id and is not linked to this account.",
      ],
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="bgremover-data-export.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Account export failed:", error);
    return json({ error: "Could not build your export. Please try again." }, { status: 500 });
  }
}
