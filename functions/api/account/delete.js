/**
 * POST /api/account/delete — erase the signed-in user (GDPR Art. 17).
 *
 * What actually happens, and why it is not a plain `DELETE FROM users`:
 *
 * D1 enforces foreign keys, and `payment_orders.user_id` references `users(id)`.
 * Completed payments also have to survive for accounting and PayPal dispute
 * handling. So instead of dropping the row we *detach the identity from it*:
 *
 *   usage_logs    deleted   (carries user-supplied source filenames)
 *   user_credits  deleted   (balance is forfeited — the UI says so up front)
 *   payment_orders kept     (financial record) but re-keyed to a tombstone
 *   users         kept      (FK target) with every PII column nulled, status
 *                           'deleted', and google_sub replaced by the tombstone
 *
 * Replacing google_sub matters: it means signing in again with the same Google
 * account creates a fresh account rather than resurrecting this one, and no
 * remaining row can be joined back to a person.
 */
import { getUserWithSession } from "../auth/db.js";
import { clearSessionCookie, json, readSession } from "../auth/_lib.js";

/** Opaque, unique, non-null replacement for the Google subject id. */
function tombstone() {
  return `deleted:${crypto.randomUUID()}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const session = await readSession(request, env);
    if (!session?.sub) return json({ error: "Not signed in." }, { status: 401 });

    const user = await getUserWithSession(env, session);
    if (!user) return json({ error: "Account not found." }, { status: 404 });

    // Deliberate, explicit action — never something a stray request can trigger
    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== "DELETE") {
      return json(
        { error: "Confirmation required.", code: "CONFIRMATION_REQUIRED" },
        { status: 400 }
      );
    }

    const sub = user.google_sub;
    const gone = tombstone();
    const now = new Date().toISOString();

    // Sequential in one transaction. Every statement matches on the *old*
    // google_sub, so the users row must be re-keyed last.
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM usage_logs WHERE google_sub = ?`).bind(sub),
      env.DB.prepare(`DELETE FROM user_credits WHERE google_sub = ?`).bind(sub),
      env.DB.prepare(`UPDATE payment_orders SET google_sub = ? WHERE google_sub = ?`).bind(
        gone,
        sub
      ),
      env.DB.prepare(
        `UPDATE users
            SET google_sub = ?,
                email = NULL,
                name = NULL,
                avatar_url = NULL,
                plan = 'free',
                plan_expires_at = NULL,
                status = 'deleted',
                updated_at = ?
          WHERE google_sub = ?`
      ).bind(gone, now, sub),
    ]);

    console.log(
      JSON.stringify({
        ts: now,
        level: "info",
        event: "account_deleted",
        // No identifiers: the point of the operation is that they are gone
        userId: user.id,
      })
    );

    return new Response(JSON.stringify({ deleted: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Set-Cookie": clearSessionCookie(),
      },
    });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return json(
      { error: "Could not delete the account. Please contact support." },
      { status: 500 }
    );
  }
}
