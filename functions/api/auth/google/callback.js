import {
  clearStateHeader,
  createSessionCookie,
  ensureEnv,
  exchangeCode,
  fetchGoogleProfile,
  readState,
} from "../_lib";
import { upsertUser } from "../db";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    ensureEnv(env);
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const savedState = readState(request);

    if (!code || !state || !savedState || state !== savedState) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/?auth_error=state",
          "Set-Cookie": clearStateHeader(),
        },
      });
    }

    const tokenData = await exchangeCode(request, env, code);
    const profile = await fetchGoogleProfile(tokenData.access_token);
    await upsertUser(env, profile);
    const headers = new Headers({ Location: "/" });
    headers.append("Set-Cookie", clearStateHeader());
    headers.append("Set-Cookie", await createSessionCookie(env, profile));
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/?auth_error=google",
        "Set-Cookie": clearStateHeader(),
      },
    });
  }
}
