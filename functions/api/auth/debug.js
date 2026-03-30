import { debugSession, json } from "./_lib";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const result = await debugSession(request, env);
    return json(result);
  } catch (error) {
    console.error(error);
    return json({ error: "debug_failed" }, { status: 500 });
  }
}
