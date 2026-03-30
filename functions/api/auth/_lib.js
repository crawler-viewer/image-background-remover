const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const STATE_COOKIE = "bg_auth_state";
const SESSION_COOKIE = "bg_session";
const SESSION_TTL = 60 * 60 * 24 * 7;

function getBaseUrl(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const parts = cookie.split(/;\s*/);
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index);
    const value = part.slice(index + 1);
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}

function serializeCookie(name, value, options = {}) {
  const attrs = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) attrs.push(`Max-Age=${options.maxAge}`);
  attrs.push(`Path=${options.path || "/"}`);
  if (options.httpOnly !== false) attrs.push("HttpOnly");
  if (options.sameSite) attrs.push(`SameSite=${options.sameSite}`);
  if (options.secure !== false) attrs.push("Secure");
  return attrs.join("; ");
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSign(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(new Uint8Array(sig));
}

async function signSession(secret, session) {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(session)));
  const signature = await hmacSign(secret, payload);
  return `${payload}.${signature}`;
}

async function verifySession(secret, token) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = await hmacSign(secret, payload);
  if (signature !== expected) return null;

  let json;
  try {
    json = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
  } catch (error) {
    console.error("Failed to decode session payload:", error);
    return null;
  }

  if (!json?.exp || Date.now() > json.exp) return null;
  return json;
}

async function createStateCookie() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return toBase64Url(bytes);
}

export async function buildGoogleAuthUrl(request, env) {
  const state = await createStateCookie();
  const redirectUri = `${getBaseUrl(request)}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return {
    state,
    url: `${GOOGLE_OAUTH_URL}?${params.toString()}`,
  };
}

export async function exchangeCode(request, env, code) {
  const redirectUri = `${getBaseUrl(request)}/api/auth/google/callback`;
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Google token exchange failed: ${text || response.status}`);
  }

  return response.json();
}

export async function fetchGoogleProfile(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Google profile fetch failed: ${text || response.status}`);
  }

  return response.json();
}

export async function createSessionCookie(env, profile) {
  const now = Date.now();
  const session = {
    sub: profile.sub,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    exp: now + SESSION_TTL * 1000,
  };
  const token = await signSession(env.AUTH_SECRET, session);
  return serializeCookie(SESSION_COOKIE, token, {
    maxAge: SESSION_TTL,
    sameSite: "Lax",
  });
}

export function clearSessionCookie() {
  return serializeCookie(SESSION_COOKIE, "", { maxAge: 0, sameSite: "Lax" });
}

export function createStateHeader(state) {
  return serializeCookie(STATE_COOKIE, state, {
    maxAge: 600,
    sameSite: "Lax",
  });
}

export function clearStateHeader() {
  return serializeCookie(STATE_COOKIE, "", { maxAge: 0, sameSite: "Lax" });
}

export function readState(request) {
  return getCookie(request, STATE_COOKIE);
}

export async function readSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  return verifySession(env.AUTH_SECRET, token);
}

export async function debugSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) {
    return {
      hasCookie: false,
      tokenPreview: null,
      verified: false,
      reason: "missing_cookie",
    };
  }

  const [payload, signature] = token.includes(".") ? token.split(".") : [null, null];
  if (!payload || !signature) {
    return {
      hasCookie: true,
      tokenPreview: token.slice(0, 24),
      verified: false,
      reason: "invalid_token_shape",
    };
  }

  const expected = await hmacSign(env.AUTH_SECRET, payload);
  const signatureValid = signature === expected;

  let decoded = null;
  let decodeError = null;
  try {
    decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
  } catch (error) {
    decodeError = error instanceof Error ? error.message : String(error);
  }

  return {
    hasCookie: true,
    tokenPreview: token.slice(0, 24),
    signatureValid,
    decodeError,
    decoded,
    verified: signatureValid && !!decoded,
    reason: signatureValid ? (decoded ? null : "decode_failed") : "signature_mismatch",
  };
}

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export function ensureEnv(env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.AUTH_SECRET) {
    throw new Error("Missing Google auth environment variables.");
  }
}
