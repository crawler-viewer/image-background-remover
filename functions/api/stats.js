export async function onRequestGet(context) {
  const { env } = context;

  try {
    const db = env.DB;

    // Total successful removals
    const totalRow = await db
      .prepare(`SELECT COUNT(*) AS count FROM usage_logs WHERE action = 'remove_bg'`)
      .first();
    const guestRow = await db
      .prepare(`SELECT COUNT(*) AS count FROM guest_usage_logs WHERE action = 'remove_bg'`)
      .first();

    const totalProcessed = Number(totalRow?.count || 0) + Number(guestRow?.count || 0);

    // Total registered users
    const usersRow = await db
      .prepare(`SELECT COUNT(*) AS count FROM users`)
      .first();
    const totalUsers = Number(usersRow?.count || 0);

    return Response.json({
      totalProcessed,
      totalUsers,
    }, {
      headers: {
        "Cache-Control": "public, max-age=300", // cache 5 min
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return Response.json({ totalProcessed: 0, totalUsers: 0 });
  }
}
