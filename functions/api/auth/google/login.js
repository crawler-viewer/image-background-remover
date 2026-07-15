import {
  buildGoogleAuthUrl,
  createReturnHeader,
  createStateHeader,
  ensureEnv,
  sanitizeReturnPath,
} from "../_lib";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    ensureEnv(env);
    const { state, url } = await buildGoogleAuthUrl(request, env);
    const reqUrl = new URL(request.url);
    const returnPath = sanitizeReturnPath(
      reqUrl.searchParams.get("return") || reqUrl.searchParams.get("next")
    );

    const headers = new Headers({
      Location: url,
      "Cache-Control": "no-store",
    });
    // Multiple Set-Cookie: Headers.append is required
    headers.append("Set-Cookie", createStateHeader(state));
    if (returnPath) {
      const returnCookie = createReturnHeader(returnPath);
      if (returnCookie) headers.append("Set-Cookie", returnCookie);
    }

    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 302,
      headers: { Location: "/?auth_error=config" },
    });
  }
}
