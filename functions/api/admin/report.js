export async function onRequestGet(context) {
  const { request, env } = context;

  // Simple API key auth
  const authKey = request.headers.get("x-admin-key") || new URL(request.url).searchParams.get("key");
  if (!env.ADMIN_API_KEY || authKey !== env.ADMIN_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = env.DB;
    const now = new Date();

    // Today range (UTC)
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();

    // Yesterday range
    const yesterdayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)).toISOString();

    // This month range
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    // Today's removals (registered + guest)
    const todayUsage = await db.prepare(
      `SELECT COUNT(*) AS c FROM usage_logs WHERE action='remove_bg' AND created_at >= ? AND created_at < ?`
    ).bind(todayStart, todayEnd).first();
    const todayGuest = await db.prepare(
      `SELECT COUNT(*) AS c FROM guest_usage_logs WHERE action='remove_bg' AND created_at >= ? AND created_at < ?`
    ).bind(todayStart, todayEnd).first();

    // Yesterday's removals
    const yesterdayUsage = await db.prepare(
      `SELECT COUNT(*) AS c FROM usage_logs WHERE action='remove_bg' AND created_at >= ? AND created_at < ?`
    ).bind(yesterdayStart, todayStart).first();
    const yesterdayGuest = await db.prepare(
      `SELECT COUNT(*) AS c FROM guest_usage_logs WHERE action='remove_bg' AND created_at >= ? AND created_at < ?`
    ).bind(yesterdayStart, todayStart).first();

    // This month's removals
    const monthUsage = await db.prepare(
      `SELECT COUNT(*) AS c FROM usage_logs WHERE action='remove_bg' AND created_at >= ?`
    ).bind(monthStart).first();
    const monthGuest = await db.prepare(
      `SELECT COUNT(*) AS c FROM guest_usage_logs WHERE action='remove_bg' AND created_at >= ?`
    ).bind(monthStart).first();

    // Total all time
    const totalUsage = await db.prepare(`SELECT COUNT(*) AS c FROM usage_logs WHERE action='remove_bg'`).first();
    const totalGuest = await db.prepare(`SELECT COUNT(*) AS c FROM guest_usage_logs WHERE action='remove_bg'`).first();

    // Users
    const totalUsers = await db.prepare(`SELECT COUNT(*) AS c FROM users`).first();
    const todayNewUsers = await db.prepare(
      `SELECT COUNT(*) AS c FROM users WHERE created_at >= ? AND created_at < ?`
    ).bind(todayStart, todayEnd).first();
    const yesterdayNewUsers = await db.prepare(
      `SELECT COUNT(*) AS c FROM users WHERE created_at >= ? AND created_at < ?`
    ).bind(yesterdayStart, todayStart).first();

    // Plan distribution
    const plans = await db.prepare(
      `SELECT plan, COUNT(*) AS c FROM users GROUP BY plan`
    ).all();

    // Revenue (paid orders)
    const todayRevenue = await db.prepare(
      `SELECT SUM(CAST(amount_usd AS REAL)) AS total FROM payment_orders WHERE status='paid' AND paid_at >= ? AND paid_at < ?`
    ).bind(todayStart, todayEnd).first();
    const monthRevenue = await db.prepare(
      `SELECT SUM(CAST(amount_usd AS REAL)) AS total FROM payment_orders WHERE status='paid' AND paid_at >= ?`
    ).bind(monthStart).first();
    const totalRevenue = await db.prepare(
      `SELECT SUM(CAST(amount_usd AS REAL)) AS total FROM payment_orders WHERE status='paid'`
    ).first();
    const totalOrders = await db.prepare(
      `SELECT COUNT(*) AS c FROM payment_orders WHERE status='paid'`
    ).first();

    return Response.json({
      date: todayStart.split("T")[0],
      removals: {
        today: Number(todayUsage?.c || 0) + Number(todayGuest?.c || 0),
        todayRegistered: Number(todayUsage?.c || 0),
        todayGuest: Number(todayGuest?.c || 0),
        yesterday: Number(yesterdayUsage?.c || 0) + Number(yesterdayGuest?.c || 0),
        thisMonth: Number(monthUsage?.c || 0) + Number(monthGuest?.c || 0),
        allTime: Number(totalUsage?.c || 0) + Number(totalGuest?.c || 0),
      },
      users: {
        total: Number(totalUsers?.c || 0),
        newToday: Number(todayNewUsers?.c || 0),
        newYesterday: Number(yesterdayNewUsers?.c || 0),
        plans: Object.fromEntries((plans?.results || []).map((r) => [r.plan, r.c])),
      },
      revenue: {
        today: Number(todayRevenue?.total || 0),
        thisMonth: Number(monthRevenue?.total || 0),
        allTime: Number(totalRevenue?.total || 0),
        totalOrders: Number(totalOrders?.c || 0),
      },
    });
  } catch (err) {
    console.error("Admin report error:", err);
    return Response.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
