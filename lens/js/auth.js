// ── AUTH ───────────────────────────────────────────────────────────────────

import { BASE, AUTH_URL } from "./constants.js";
import { t } from "./i18n.js";

let authToken = null; // Bearer token; kept in memory only
let cookieAuthed = false; // true when /api/users/current succeeds without a token (same-domain cookie session)
let authPopup = null;

export function isAuthed() {
  return cookieAuthed || !!authToken;
}

// Probe whether the browser already has a valid session cookie (same-domain hosting).
// Called once at startup before we know if a token is needed.
export async function probeAuth() {
  try {
    const r = await fetch(`${BASE}/api/users/current`, { credentials: "include" });
    if (r.ok) {
      const user = await r.json();
      cookieAuthed = true;
      document.getElementById("user-name").textContent =
        user.name || user.displayName || user.email || user.login || "";
    }
  } catch {
    /* offline or CORS — treat as anonymous */
  }
  updateAuthUI();
}

export function updateAuthUI() {
  const authed = cookieAuthed || !!authToken;
  document.getElementById("auth-btn").style.display = authed ? "none" : "";
  document.getElementById("user-info").style.display = authed ? "" : "none";
  // Sign-out button only shown for token auth; cookie sessions are managed server-side
  document.getElementById("signout-btn").style.display = !cookieAuthed && authToken ? "" : "none";
}

// Open auth popup (called by the Sign in button).
export function startAuth() {
  authPopup = window.open(
    AUTH_URL,
    "architeezy-auth",
    `width=480,height=640,left=${Math.round((screen.width - 480) / 2)},top=${Math.round((screen.height - 640) / 2)}`,
  );
}

export async function fetchCurrentUser() {
  try {
    const r = await apiFetch(`${BASE}/api/users/current`);
    if (!r.ok) return;
    const user = await r.json();
    document.getElementById("user-name").textContent =
      user.name || user.displayName || user.email || user.login || "";
  } catch {
    /* non-critical */
  }
  updateAuthUI();
}

export function signOut() {
  authToken = null;
  document.getElementById("user-name").textContent = "";
  updateAuthUI();
  // Caller (app.js) calls init() after signOut()
}

// Fetch wrapper: always sends cookies; adds Bearer token when present; clears token on 401.
export async function apiFetch(url) {
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const r = await fetch(url, { headers, credentials: "include" });
  if (r.status === 401) {
    authToken = null;
    updateAuthUI();
    throw new Error(t("authRequired"));
  }
  return r;
}

// Called from app.js when the AUTH_SUCCESS postMessage arrives from the popup.
export function handleAuthSuccess(token) {
  authToken = token;
  if (authPopup) {
    authPopup.close();
    authPopup = null;
  }
}
