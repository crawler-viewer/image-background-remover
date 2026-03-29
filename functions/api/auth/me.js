import { ensureEnv, json, readSession } from "./_lib";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    ensureEnv(env);
    const session = await readSession(request, env);
    return json({ user: session || null });
  } catch (error) {
    console.error(error);
    return json({ user: null }, { status: 200 });
  }
}
