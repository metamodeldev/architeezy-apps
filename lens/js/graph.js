// ── CYTOSCAPE ──────────────────────────────────────────────────────────────

import { state } from "./state.js";
import { elemColor, relColor } from "./utils.js";
import { t } from "./i18n.js";

// Measure label dimensions using an off-screen canvas so nodes can be given
// explicit numeric width/height that fit their text — avoids the deprecated
// Node sizing via a hidden DOM span — uses the browser's actual font rendering,
// which matches Cytoscape's canvas text rendering far better than canvas.measureText.
// The span is styled to match the Cytoscape node label font exactly.
const _WRAP_W = 120; // must match text-max-width in buildCyStyles
const _OUTLINE = 2; // must match text-outline-width in buildCyStyles
export const _NODE_FONT_FAMILY = "system-ui, -apple-system, sans-serif";

const _labelSpan = (() => {
  const el = document.createElement("span");
  el.style.cssText =
    "position:absolute;top:-9999px;left:-9999px;visibility:hidden;" +
    "white-space:nowrap;font-size:10px;font-family:" +
    _NODE_FONT_FAMILY +
    ";";
  document.body.appendChild(el);
  return el;
})();

function _measureText(text) {
  _labelSpan.textContent = text;
  return _labelSpan.getBoundingClientRect().width;
}

function _wrapLines(words, maxW) {
  const lines = [];
  let cur = "";
  for (const w of words) {
    const txt = cur ? `${cur} ${w}` : w;
    if (cur && _measureText(txt) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = txt;
  }
  if (cur) lines.push(cur);
  return lines;
}

function labelSize(text) {
  const lineH = 13; // 10 px font + 3 px line gap
  const words = String(text || "").split(/\s+/);
  const lines = _wrapLines(words, _WRAP_W);
  const tw = Math.max(1, ...lines.map((l) => _measureText(l)));
  const th = lines.length * lineH;
  const hPad = 10;
  const vPad = 6;
  return {
    nw: Math.ceil(tw + _OUTLINE * 2 + hPad * 2),
    nh: Math.ceil(th + _OUTLINE * 2 + vPad * 2),
  };
}

export function cyBg() {
  return getComputedStyle(document.documentElement).getPropertyValue("--cy-bg").trim() || "#12172b";
}

function buildCyStyles() {
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "background-color": "data(color)",
        color: "#fff",
        "text-outline-color": "data(color)",
        "text-outline-width": 2,
        "font-size": "10px",
        "font-family": _NODE_FONT_FAMILY,
        "line-height": 1.3,
        shape: "round-rectangle",
        "text-halign": "center",
        "text-valign": "center",
        "text-wrap": "wrap",
        "text-max-width": "120px",
        "min-zoomed-font-size": 5,
        "border-width": 1,
        "border-color": "rgba(255,255,255,0.18)",
      },
    },
    {
      // Leaf nodes only: apply canvas-measured dimensions.
      // Compound (:parent) nodes are excluded — they auto-size to fit children.
      selector: "node:childless",
      style: { width: "data(nw)", height: "data(nh)" },
    },
    {
      // Compound (container) nodes: label pinned to top, padding-top reserves space for it
      selector: ":parent",
      style: {
        "text-valign": "top",
        "text-halign": "center",
        "text-margin-y": 6,
        "text-wrap": "wrap",
        "text-max-width": "120px", // updated per-node after layout
        "padding-top": "50px", // room for up to ~3 label lines
        "padding-right": "12px",
        "padding-bottom": "12px",
        "padding-left": "12px",
        "background-opacity": 0.12,
        "border-style": "dashed",
        "border-width": 2,
        "min-width": 60, // stay visible even when all children are hidden
        "min-height": 30,
      },
    },
    {
      // Drill-root node — green border regardless of selection
      selector: "node.drill-root",
      style: { "border-width": 3, "border-color": "#22c55e", "z-index": 9998 },
    },
    {
      // Selected node — red border; overrides green when node is both drill-root and selected
      selector: "node:selected",
      style: { "border-width": 3, "border-color": "#e94560", "z-index": 9999 },
    },
    {
      selector: "edge",
      style: {
        "line-color": "data(color)",
        "target-arrow-color": "data(color)",
        "target-arrow-shape": "triangle",
        "arrow-scale": 0.8,
        width: 1.5,
        "curve-style": "bezier",
        opacity: 0.75,
      },
    },
    {
      selector: "edge[label]",
      style: {
        label: "data(label)",
        "font-size": "8px",
        color: "#aaa",
        "text-outline-width": 0,
        "text-background-color": cyBg(),
        "text-background-opacity": 0.7,
        "text-background-padding": "2px",
        "min-zoomed-font-size": 7,
      },
    },
    {
      selector: "edge:selected",
      style: { width: 3, opacity: 1, "z-index": 9999 },
    },
    {
      // Containment (composition) edges: filled diamond at source (parent) end
      selector: "edge[?isContainment]",
      style: {
        "source-arrow-shape": "diamond",
        "source-arrow-color": "data(color)",
        "source-arrow-fill": "filled",
        "target-arrow-shape": "none",
        "line-color": "data(color)",
        width: 2,
        opacity: 0.55,
        "curve-style": "bezier",
      },
    },
  ];
}

function setupPointerInteractions() {
  const container = document.getElementById("cy");

  // Middle-mouse pan
  container.addEventListener(
    "mousedown",
    (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      const panStart = { ...state.cy.pan() };
      const mouseStart = { x: e.clientX, y: e.clientY };
      const onMove = (mv) =>
        state.cy.pan({
          x: panStart.x + mv.clientX - mouseStart.x,
          y: panStart.y + mv.clientY - mouseStart.y,
        });
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    { passive: false },
  );
  container.addEventListener("auxclick", (e) => e.preventDefault());

  // Custom wheel zoom — intercept before Cytoscape to control sensitivity
  // without triggering the "custom wheelSensitivity" warning.
  container.addEventListener(
    "wheel",
    (e) => {
      if (!state.cy) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
      const level = Math.max(
        state.cy.minZoom(),
        Math.min(state.cy.maxZoom(), state.cy.zoom() * factor),
      );
      state.cy.zoom({ level, renderedPosition: { x: e.offsetX, y: e.offsetY } });
    },
    { passive: false, capture: true },
  );
}

export function buildCytoscape({ onNodeTap, onNodeDblTap, onCanvasTap }) {
  const elemIds = new Set(state.allElements.map((e) => e.id));

  const nodes = state.allElements.map((e) => {
    const { nw, nh } = labelSize(e.name || e.type);
    const data = {
      id: e.id,
      label: e.name,
      type: e.type,
      ns: e.ns,
      color: elemColor(e.type),
      nw,
      nh,
    };
    if (state.containmentMode === "compound" && e.parent && elemIds.has(e.parent)) {
      data.parent = e.parent;
      data.modelParent = e.parent;
    }
    return { group: "nodes", data };
  });

  const edges = state.allRelations
    .filter((r) => elemIds.has(r.source) && elemIds.has(r.target))
    .map((r) => ({
      group: "edges",
      data: {
        id: r.id,
        source: r.source,
        target: r.target,
        type: r.type,
        label: r.name,
        color: relColor(r.type),
      },
    }));

  // Containment (edge mode): synthetic composition edges from parent to child
  if (state.containmentMode === "edge") {
    state.allElements.forEach((e) => {
      if (e.parent && elemIds.has(e.parent)) {
        edges.push({
          group: "edges",
          data: {
            id: `_c_${e.id}`,
            source: e.parent,
            target: e.id,
            type: "_containment",
            label: "",
            color: "#9ca3af",
            isContainment: true,
          },
        });
      }
    });
  }

  if (state.cy) {
    state.cy.destroy();
    state.cy = null;
  }

  state.cy = cytoscape({
    container: document.getElementById("cy"),
    elements: { nodes, edges },
    style: buildCyStyles(),
    layout: { name: "grid" },
    userZoomingEnabled: true,
    minZoom: 0.04,
    maxZoom: 6,
  });

  state.cy.on("tap", "node", (e) => {
    clearTimeout(state.tapTimer);
    state.tapTimer = setTimeout(() => onNodeTap(e.target.id()), 180);
  });
  state.cy.on("dbltap", "node", (e) => {
    clearTimeout(state.tapTimer);
    onNodeDblTap(e.target);
  });
  state.cy.on("tap", (e) => {
    if (e.target === state.cy) onCanvasTap();
  });

  // Cytoscape re-evaluates styles on unselect and can drop dynamic classes —
  // re-assert the drill-root class immediately after any selection change.
  state.cy.on("unselect", () => {
    if (state.drillNodeId) state.cy.$id(state.drillNodeId).addClass("drill-root");
  });

  setupPointerInteractions();
  updateStats();
}

export function applyLayout() {
  if (!state.cy) return;
  const name = document.getElementById("layout-select").value;
  // Run layout only on visible elements — on large models hidden nodes would
  // otherwise dominate the computation and produce wrong positions for the
  // visible subset (especially noticeable in drill-down mode).
  const eles = state.cy.elements(":visible");
  const anim = eles.nodes().length < 400;

  const cfgMap = {
    fcose: {
      name: "fcose",
      quality: "default",
      randomize: true,
      animate: anim,
      animationDuration: 800,
      fit: true,
      padding: 50,
      nodeDimensionsIncludeLabels: true,
      uniformNodeDimensions: false,
      packComponents: true,
      nodeRepulsion: () => 9000,
      idealEdgeLength: () => 90,
      edgeElasticity: () => 0.45,
      gravity: 0.2,
      gravityRange: 3.8,
      numIter: 2500,
      tile: true,
      tilingPaddingVertical: 15,
      tilingPaddingHorizontal: 15,
    },
    dagre: {
      name: "dagre",
      nodeDimensionsIncludeLabels: true,
      rankDir: "TB",
      rankSep: 60,
      nodeSep: 40,
      edgeSep: 10,
      ranker: "longest-path",
      animate: anim,
      animationDuration: 600,
      fit: true,
      padding: 40,
    },
    cose: {
      name: "cose",
      nodeDimensionsIncludeLabels: true,
      idealEdgeLength: 80,
      nodeOverlap: 20,
      fit: true,
      padding: 40,
      randomize: true,
      componentSpacing: 80,
      nodeRepulsion: () => 700000,
      edgeElasticity: () => 100,
      gravity: 80,
      numIter: 1000,
      animate: anim,
      animationDuration: 600,
    },
    breadthfirst: {
      name: "breadthfirst",
      directed: true,
      padding: 40,
      spacingFactor: 1.6,
      fit: true,
      animate: anim,
      animationDuration: 600,
      nodeDimensionsIncludeLabels: true,
    },
    grid: {
      name: "grid",
      padding: 30,
      fit: true,
      animate: anim,
      animationDuration: 400,
      nodeDimensionsIncludeLabels: true,
    },
    circle: {
      name: "circle",
      padding: 40,
      fit: true,
      animate: anim,
      animationDuration: 400,
      nodeDimensionsIncludeLabels: true,
    },
  };

  const layoutInst = eles.layout(cfgMap[name] ?? { name, fit: true, padding: 30 });
  layoutInst.on("layoutstop", () => {
    state.cy.nodes(":parent:visible").forEach((n) => {
      n.style("text-max-width", Math.max(n.width() - 24, 40) + "px");
    });
  });
  layoutInst.run();
}

export function fitGraph() {
  state.cy?.fit(undefined, 40);
}

export function updateStats() {
  if (!state.cy) return;
  const vis = state.cy.elements(":visible");
  const visN = vis.nodes().length;
  const visE = vis.edges().filter((e) => !e.data("isContainment")).length;
  const totN = state.allElements.length;
  const totE = state.allRelations.length;

  if (state.drillNodeId) {
    // In drill mode: show visible/total for both nodes and edges
    document.getElementById("stat-nodes").textContent = t("statNodes", `${visN} / ${totN}`);
    document.getElementById("stat-edges").textContent = t("statEdges", `${visE} / ${totE}`);
    document.getElementById("stat-visible").textContent = "";
  } else {
    document.getElementById("stat-nodes").textContent = t("statNodes", totN);
    document.getElementById("stat-edges").textContent = t("statEdges", totE);
    document.getElementById("stat-visible").textContent = t("statVisible", visN, visE);
  }
}
