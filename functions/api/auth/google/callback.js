import {
  clearReturnHeader,
  clearStateHeader,
  createSessionCookie,
  ensureEnv,
  exchangeCode,
  fetchGoogleProfile,
  readReturnPath,
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
      const headers = new Headers({
        Location: "/?auth_error=state",
      });
      headers.append("Set-Cookie", clearStateHeader());
      headers.append("Set-Cookie", clearReturnHeader());
      return new Response(null, { status: 302, headers });
    }

    const tokenData = await exchangeCode(request, env, code);
    const profile = await fetchGoogleProfile(tokenData.access_token);

    try {
      await upsertUser(env, profile);
    } catch (dbError) {
      console.error("Failed to persist Google user in D1:", dbError);
    }

    // Resume checkout / original page when login was started with ?return=
    const returnPath = readReturnPath(request) || "/account/";
    const headers = new Headers({ Location: returnPath });
    headers.append("Set-Cookie", clearStateHeader());
    headers.append("Set-Cookie", clearReturnHeader());
    headers.append("Set-Cookie", await createSessionCookie(env, profile));
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error(error);
    const headers = new Headers({ Location: "/?auth_error=google" });
    headers.append("Set-Cookie", clearStateHeader());
    headers.append("Set-Cookie", clearReturnHeader());
    return new Response(null, { status: 302, headers });
  }
}
