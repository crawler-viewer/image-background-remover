/**
 * Public counters for the homepage.
 *
 * These are three unbounded `COUNT(*)`s, and the homepage calls this on every
 * visit, so the result is cached at the edge. `Cache-Control` alone was not
 * enough: it only tells the *browser* to hold the response, so every new
 * visitor still hit D1. The Cache API puts one copy in front of the colo.
 */
import { EXCLUDE_IP_MIRROR_SQL } from "./guest-usage-sql.js";

const CACHE_TTL_SECONDS = 300;

/** Stable key so all visitors of a colo share one cached copy. */
function cacheKeyFor(request) {
  const url = new URL(request.url);
  url.search = "";
  return new Request(url.toString(), { method: "GET" });
}

async function countAll(db) {
  // Both removal counts in one round trip; `ip:*` mirror rows excluded or every
  // guest removal would be counted twice (see guest-usage-sql.js)
  const removals = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM usage_logs
           WHERE action = 'remove_bg')
       + (SELECT COUNT(*) FROM guest_usage_logs
           WHERE action = 'remove_bg'
             AND ${EXCLUDE_IP_MIRROR_SQL}) AS count`
    )
    .first();

  const usersRow = await db.prepare(`SELECT COUNT(*) AS count FROM users`).first();

  return {
    totalProcessed: Number(removals?.count || 0),
    totalUsers: Number(usersRow?.count || 0),
  };
}

export async function onRequestGet(context) {
  const { env, request } = context;

  // Absent in unit tests; the handler still has to work without a cache
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = cache && request ? cacheKeyFor(request) : null;

  if (cacheKey) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  try {
    const stats = await countAll(env.DB);

    const response = Response.json(stats, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (cacheKey) {
      const store = cache.put(cacheKey, response.clone());
      // Call through `context` — destructuring waitUntil can unbind it
      if (typeof context.waitUntil === "function") context.waitUntil(store);
      else await store;
    }

    return response;
  } catch (err) {
    console.error("Stats API error:", err);
    // Never cache a failure — the next request should retry
    return Response.json(
      { totalProcessed: 0, totalUsers: 0 },
      { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } }
    );
  }
}
