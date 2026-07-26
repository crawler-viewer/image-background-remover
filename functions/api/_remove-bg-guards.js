/**
 * Phase 1 of /api/remove-bg: traffic guards + upload validation.
 *
 * Every function returns either `{ response }` (short-circuit, already shaped
 * for the client) or the data the next phase needs. Nothing here touches quota.
 */
import { json } from "./auth/_lib.js";
import { assertRateLimit } from "./usage.js";
import { assertDailyUpstreamBudget } from "./cost-guard.js";
import { logEvent } from "./log.js";

export const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/** Slack over the plan cap for multipart framing before we buffer the body. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/**
 * Global daily spend cap + per-IP burst limit.
 * @returns {Promise<{ response: Response } | { budget: object }>}
 */
export async function checkTrafficGuards(env, { requestId, clientIp }) {
  const budget = await assertDailyUpstreamBudget(env);
  if (!budget.allowed) {
    logEvent("warn", "daily_budget_exceeded", {
      requestId,
      used: budget.used,
      limit: budget.limit,
      error: budget.error || false,
    });
    return {
      response: json(
        {
          error: "Service is at capacity for today. Please try again tomorrow.",
          code: "DAILY_BUDGET_EXCEEDED",
          used: budget.used,
          limit: budget.limit,
        },
        { status: 503 }
      ),
    };
  }

  const rate = await assertRateLimit(env, { clientIp });
  if (!rate.allowed) {
    logEvent("info", "rate_limited", {
      requestId,
      used: rate.used,
      limit: rate.limit,
      retryAfterSec: rate.retryAfterSec,
      error: rate.error || false,
    });
    return {
      response: new Response(
        JSON.stringify({
          error: "Too many requests. Please wait a moment and try again.",
          code: "RATE_LIMITED",
          limit: rate.limit,
          retryAfterSec: rate.retryAfterSec,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rate.retryAfterSec || 60),
          },
        }
      ),
    };
  }

  return { budget };
}

function tooLargeResponse(plan, status) {
  return json(
    {
      error: `File too large. Maximum size is ${Math.round(
        plan.maxFileSizeBytes / (1024 * 1024)
      )}MB for your current plan.`,
      code: "FILE_TOO_LARGE",
    },
    { status }
  );
}

/**
 * Parse the multipart body and validate the image against the plan.
 * Runs before any quota claim or credit deduction.
 *
 * @returns {Promise<{ response: Response } | { file: File }>}
 */
export async function readUploadedImage(request, { plan, planCode, requestId }) {
  // Reject oversized uploads before buffering the body into Worker memory
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > plan.maxFileSizeBytes + MULTIPART_OVERHEAD_BYTES
  ) {
    logEvent("info", "upload_rejected_by_content_length", {
      requestId,
      plan: planCode,
      declaredKb: Math.round(declaredLength / 1024),
      limitMb: Math.round(plan.maxFileSizeBytes / (1024 * 1024)),
    });
    return { response: tooLargeResponse(plan, 413) };
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return {
      response: json(
        { error: "Expected multipart form data with an image file.", code: "INVALID_BODY" },
        { status: 400 }
      ),
    };
  }

  const file = formData.get("image");

  if (!file || typeof file === "string") {
    return {
      response: json({ error: "No image provided.", code: "NO_IMAGE" }, { status: 400 }),
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      response: json(
        { error: "Unsupported format. Please upload PNG, JPG, or WebP." },
        { status: 400 }
      ),
    };
  }

  if (file.size > plan.maxFileSizeBytes) {
    return { response: tooLargeResponse(plan, 413) };
  }

  return { file };
}
