import { getUserWithSession } from "./auth/db";
import { json, readSession } from "./auth/_lib";
import { getPlanConfig } from "./plan-config";
import {
  assertDailyLimit,
  assertGuestDailyLimit,
  getGuestKey,
  recordGuestUsage,
  recordUsage,
} from "./usage";

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Service temporarily unavailable." },
      { status: 503 }
    );
  }

  try {
    const session = await readSession(request, env);
    const user = await getUserWithSession(env, session);
    const planCode = user?.plan || (user ? "free" : "guest");
    const plan = getPlanConfig(planCode);

    if (user?.google_sub) {
      const quota = await assertDailyLimit(env, user.google_sub, planCode);
      if (!quota.allowed) {
        return json(
          {
            error: "Daily limit reached. Please try again tomorrow.",
            code: "DAILY_LIMIT_REACHED",
            used: quota.used,
            limit: quota.limit,
            plan: planCode,
          },
          { status: 429 }
        );
      }
    } else {
      const guestKey = getGuestKey(request);
      const quota = await assertGuestDailyLimit(env, guestKey);
      if (!quota.allowed) {
        return json(
          {
            error: "Guest daily limit reached. Sign in to unlock more removals.",
            code: "GUEST_DAILY_LIMIT_REACHED",
            used: quota.used,
            limit: quota.limit,
            plan: "guest",
          },
          { status: 429 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return Response.json({ error: "No image provided." }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Unsupported format. Please upload PNG, JPG, or WebP." },
        { status: 400 }
      );
    }

    if (file.size > plan.maxFileSizeBytes) {
      return Response.json(
        {
          error: `File too large. Maximum size is ${Math.round(
            plan.maxFileSizeBytes / (1024 * 1024)
          )}MB for your current plan.`,
        },
        { status: 400 }
      );
    }

    // Forward to Remove.bg
    const rbFormData = new FormData();
    rbFormData.append("image_file", file);
    rbFormData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: rbFormData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`Remove.bg error [${response.status}]:`, errText);

      if (response.status === 402) {
        return Response.json(
          { error: "Service quota exceeded. Please try again later." },
          { status: 503 }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service is busy. Please try again." }),
          { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "30" } }
        );
      }

      return Response.json(
        { error: "Background removal failed. Please try a different image." },
        { status: 502 }
      );
    }

    const buffer = await response.arrayBuffer();

    if (user?.google_sub) {
      await recordUsage(env, {
        googleSub: user.google_sub,
        userId: user.id || null,
        sourceFilename: file?.name || null,
      });
    } else {
      await recordGuestUsage(env, {
        guestKey: getGuestKey(request),
        sourceFilename: file?.name || null,
      });
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("API error:", err);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
