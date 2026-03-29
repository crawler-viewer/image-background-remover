import { buildGoogleAuthUrl, createStateHeader, ensureEnv } from "../_lib";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    ensureEnv(env);
    const { state, url } = await buildGoogleAuthUrl(request, env);
    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        "Set-Cookie": createStateHeader(state),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 302,
      headers: { Location: "/?auth_error=config" },
    });
  }
}
