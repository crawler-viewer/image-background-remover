import { clearSessionCookie } from "./_lib";

export async function onRequestPost() {
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": clearSessionCookie(),
      "Cache-Control": "no-store",
    },
  });
}
