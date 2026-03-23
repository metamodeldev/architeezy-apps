// ── CONSTANTS ──────────────────────────────────────────────────────────────

export const BASE = "https://architeezy.com";
export const MODELS_API = `${BASE}/api/models?size=100`;
export const AUTH_URL = `${BASE}/-/auth`;

// Deterministic color palette for element and relationship types
export const PALETTE = [
  "#1a5e8a",
  "#1a6e40",
  "#7c4a00",
  "#7a6400",
  "#52366a",
  "#6e5200",
  "#3a5a7c",
  "#8a1a3e",
  "#1a4a6b",
  "#4a7a1a",
  "#7a2a5a",
  "#2a7a7a",
  "#5a3a7a",
  "#7a5a2a",
  "#2a5a4a",
  "#6a3a2a",
];

export const UUID_RE = /^[0-9a-f]{8,}(-[0-9a-f]+)*$/i;

// Full URI of the ecore namespace used in EMF models
export const ECORE_NS = "http://www.eclipse.org/emf/2002/Ecore";

// ── UI TIMING & SIZING CONSTANTS ────────────────────────────────────────────

// Delay (ms) before treating a single tap as a click, allowing double-tap detection
export const TAP_DELAY_MS = 180;

// Node count below which layout runs with animation; above this, skip animation for speed
export const LAYOUT_ANIM_THRESHOLD = 400;

// Max text-wrap width for node labels (px); must stay in sync with text-max-width in graph-styles.js
export const LABEL_WRAP_W = 120;

// Text outline width for node labels (px); used in node size calculation to pad the bounding box
export const LABEL_OUTLINE = 2;

// Padding around the graph when fitting to the viewport (px)
export const FIT_PADDING = 40;

// Zoom level applied when focusing a node from the table view
export const FOCUS_ZOOM = 1.5;
