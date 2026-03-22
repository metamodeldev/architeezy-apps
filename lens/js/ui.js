// ── UI UTILITIES ───────────────────────────────────────────────────────────

import { state } from "./state.js";
import { cyBg } from "./graph.js";

export function showLoading(text) {
  document.getElementById("loading-text").textContent = text;
  document.getElementById("loading").style.display = "flex";
}

export function hideLoading() {
  document.getElementById("loading").style.display = "none";
}

// Full-screen error — used only when no model is loaded yet (fatal / initial failure)
export function showError(msg) {
  document.getElementById("error-detail").textContent = msg;
  document.getElementById("error-msg").style.display = "flex";
  document.getElementById("loading").style.display = "none";
}

// Dismissible toast — used when a model load fails but a previous model is still shown
export function showToast(msg) {
  clearTimeout(state.toastTimer);
  document.getElementById("toast-msg").textContent = msg;
  document.getElementById("toast").classList.add("visible");
  state.toastTimer = setTimeout(hideToast, 7000);
}

export function hideToast() {
  clearTimeout(state.toastTimer);
  document.getElementById("toast").classList.remove("visible");
}

// ── SIDEBAR TOGGLE ─────────────────────────────────────────────────────────

export function toggleSection(id) {
  const collapsed = document.getElementById(id).classList.toggle("collapsed");
  document.getElementById(`icon-${id}`).textContent = collapsed ? "▶" : "▼";
}

// ── VIEW SWITCHING ─────────────────────────────────────────────────────────

export function switchView(view, afterSwitch) {
  state.currentView = view;
  const g = view === "graph";
  document.getElementById("tab-graph").classList.toggle("active", g);
  document.getElementById("tab-table").classList.toggle("active", !g);
  document.getElementById("cy").style.display = g ? "block" : "none";
  document.getElementById("cy-controls").style.display = g ? "flex" : "none";
  document.getElementById("table-view").classList.toggle("visible", !g);
  if (!g && afterSwitch) afterSwitch();
}

// ── THEME ──────────────────────────────────────────────────────────────────

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("architeezyTheme", theme);
  document
    .querySelectorAll(".theme-btn")
    .forEach((b) => b.classList.toggle("active", b.id === `theme-btn-${theme}`));
  if (state.cy)
    requestAnimationFrame(() =>
      state.cy.style().selector("edge").style("text-background-color", cyBg()).update(),
    );
}
