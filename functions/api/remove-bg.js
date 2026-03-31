import { getUserWithSession } from "./auth/db";
import { json, readSession } from "./auth/_lib";
import { getPlanConfig } from "./plan-config";
import {
  assertMonthlyLimit,
  assertGuestMonthlyLimit,
  getGuestKey,
  recordGuestUsage,
  recordUsage,
} from "./usage";

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.CLIPDROP_API_KEY || env.REMOVE_BG_API_KEY;
  const useClipdrop = !!env.CLIPDROP_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Service temporarily unavailable." },
      { status: 503 }
    );
  }

  try {
    const session = await readSession(request, env);
    const user = await getUserWithSession(env, session);
    let planCode = user?.plan || (user ? "free" : "guest");

    // Check subscription expiry
    if (user && (planCode === "pro" || planCode === "business") && user.plan_expires_at) {
      if (new Date(user.plan_expires_at) < new Date()) {
        // Plan expired, downgrade to free
        planCode = "free";
        await env.DB
          .prepare(`UPDATE users SET plan = 'free', plan_expires_at = NULL, updated_at = ? WHERE google_sub = ?`)
          .bind(new Date().toISOString(), user.google_sub)
          .run()
          .catch((e) => console.error("Failed to downgrade expired plan:", e));
      }
    }

    const plan = getPlanConfig(planCode);

    let useCredits = false;

    if (user?.google_sub) {
      const quota = await assertMonthlyLimit(env, user.google_sub, planCode);
      if (!quota.allowed) {
        // Check if user has credits
        const creditRow = await env.DB
          .prepare(`SELECT balance FROM user_credits WHERE google_sub = ? LIMIT 1`)
          .bind(user.google_sub)
          .first();
        const creditBalance = Number(creditRow?.balance || 0);

        if (creditBalance > 0) {
          useCredits = true;
        } else {
          return json(
            {
              error: "Monthly limit reached. Buy credits or upgrade your plan.",
              code: "MONTHLY_LIMIT_REACHED",
              used: quota.used,
              limit: quota.limit,
              plan: planCode,
              credits: 0,
            },
            { status: 429 }
          );
        }
      }
    } else {
      const guestKey = getGuestKey(request);
      const quota = await assertGuestMonthlyLimit(env, guestKey);
      if (!quota.allowed) {
        return json(
          {
            error: "Guest monthly limit reached. Sign in to unlock more removals.",
            code: "GUEST_MONTHLY_LIMIT_REACHED",
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

    let response;

    if (useClipdrop) {
      // Clipdrop Remove Background API
      const clipdropForm = new FormData();
      clipdropForm.append("image_file", file);

      response = await fetch("https://clipdrop-api.co/remove-background/v1", {
        method: "POST",
        headers: { "x-api-key": apiKey },
        body: clipdropForm,
      });
    } else {
      // Fallback: Remove.bg API
      const rbFormData = new FormData();
      rbFormData.append("image_file", file);
      rbFormData.append("size", "auto");

      response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: rbFormData,
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`BG removal API error [${response.status}]:`, errText);

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

    try {
      if (user?.google_sub) {
        if (useCredits) {
          // Deduct 1 credit
          await env.DB
            .prepare(`UPDATE user_credits SET balance = balance - 1, updated_at = ? WHERE google_sub = ? AND balance > 0`)
            .bind(new Date().toISOString(), user.google_sub)
            .run();
        }
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
    } catch (usageError) {
      console.error("Failed to record usage after successful remove-bg:", usageError);
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
