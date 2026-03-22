// ── TABLE VIEW ─────────────────────────────────────────────────────────────

import { state } from "./state.js";
import { elemColor, relColor, escHtml } from "./utils.js";
import { t } from "./i18n.js";
import { switchView } from "./ui.js";

export function switchTableTab(tab) {
  state.currentTTab = tab;
  state.tableSortCol = null;
  document.getElementById("ttab-elements").classList.toggle("active", tab === "elements");
  document.getElementById("ttab-rels").classList.toggle("active", tab === "relationships");
  document.getElementById("table-search").value = "";
  renderTable();
}

export function renderTable() {
  const q = document.getElementById("table-search").value.toLowerCase();
  const head = document.getElementById("table-head");
  const body = document.getElementById("table-body");
  if (state.currentTTab === "elements") {
    renderElemsTable(q, head, body);
  } else {
    renderRelsTable(q, head, body);
  }
}

function thHtml(cols) {
  return (
    "<tr>" +
    cols
      .map((c, i) => {
        const sorted = state.tableSortCol === i;
        return `<th class="${sorted ? "sorted" : ""}" data-col="${i}">
      ${escHtml(c)} <span class="sort-icon">${sorted ? (state.tableSortAsc ? "▲" : "▼") : "⇅"}</span></th>`;
      })
      .join("") +
    "</tr>"
  );
}

function bindSortClicks() {
  document.querySelectorAll("#table-head th").forEach((th) =>
    th.addEventListener("click", () => {
      const col = +th.dataset.col;
      state.tableSortAsc = state.tableSortCol === col ? !state.tableSortAsc : true;
      state.tableSortCol = col;
      renderTable();
    }),
  );
}

function renderElemsTable(q, head, body) {
  head.innerHTML = thHtml([t("colName"), t("colType"), t("colDoc")]);
  bindSortClicks();

  let rows = state.allElements.filter(
    (e) =>
      state.activeElemTypes.has(e.type) &&
      (!state.drillVisibleIds || state.drillVisibleIds.has(e.id)) &&
      (!q || [e.name, e.type, e.ns, e.doc].some((v) => v.toLowerCase().includes(q))),
  );

  if (state.tableSortCol !== null) {
    const keys = ["name", "type", "doc"];
    const k = keys[state.tableSortCol] ?? "name";
    rows = [...rows].sort((a, b) => {
      const c = (a[k] ?? "").localeCompare(b[k] ?? "");
      return state.tableSortAsc ? c : -c;
    });
  }

  document.getElementById("table-count").textContent =
    `${rows.length} / ${state.allElements.length}`;
  body.innerHTML = rows
    .map((e) => {
      const c = elemColor(e.type);
      return `<tr data-id="${e.id}">
      <td>${escHtml(e.name)}</td>
      <td><span class="type-badge" style="background:${c}33;color:${c}">${escHtml(e.type)}</span></td>
      <td class="wrap">${escHtml(e.doc) || "—"}</td>
    </tr>`;
    })
    .join("");

  body
    .querySelectorAll("tr[data-id]")
    .forEach((tr) => tr.addEventListener("click", () => focusNode(tr.dataset.id)));
}

function renderRelsTable(q, head, body) {
  head.innerHTML = thHtml([t("colSource"), t("colRelType"), t("colTarget"), t("colRelName")]);
  bindSortClicks();

  let rows = state.allRelations.filter((r) => {
    if (!state.activeRelTypes.has(r.type)) return false;
    const srcType = state.elemMap[r.source]?.type;
    const tgtType = state.elemMap[r.target]?.type;
    if (srcType && !state.activeElemTypes.has(srcType)) return false;
    if (tgtType && !state.activeElemTypes.has(tgtType)) return false;
    if (
      state.drillVisibleIds &&
      (!state.drillVisibleIds.has(r.source) || !state.drillVisibleIds.has(r.target))
    )
      return false;
    if (!q) return true;
    const src = state.elemMap[r.source]?.name ?? "";
    const tgt = state.elemMap[r.target]?.name ?? "";
    return [src, r.type, tgt, r.name].some((v) => v.toLowerCase().includes(q));
  });

  if (state.tableSortCol !== null) {
    rows = [...rows].sort((a, b) => {
      const av =
        [state.elemMap[a.source]?.name ?? "", a.type, state.elemMap[a.target]?.name ?? "", a.name][
          state.tableSortCol
        ] ?? "";
      const bv =
        [state.elemMap[b.source]?.name ?? "", b.type, state.elemMap[b.target]?.name ?? "", b.name][
          state.tableSortCol
        ] ?? "";
      return state.tableSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  document.getElementById("table-count").textContent =
    `${rows.length} / ${state.allRelations.length}`;
  body.innerHTML = rows
    .map((r) => {
      const src = state.elemMap[r.source]?.name ?? r.source;
      const tgt = state.elemMap[r.target]?.name ?? r.target;
      const c = relColor(r.type);
      return `<tr data-id="${r.source}">
      <td>${escHtml(src)}</td>
      <td><span class="type-badge" style="background:${c}33;color:${c}">${escHtml(r.type)}</span></td>
      <td>${escHtml(tgt)}</td>
      <td>${escHtml(r.name) || "—"}</td>
    </tr>`;
    })
    .join("");

  body
    .querySelectorAll("tr[data-id]")
    .forEach((tr) => tr.addEventListener("click", () => focusNode(tr.dataset.id)));
}

export function focusNode(id) {
  switchView("graph", null);
  requestAnimationFrame(() => {
    state.cy?.resize();
    const node = state.cy?.$id(id);
    if (!node?.length) return;
    state.cy.animate(
      { center: { eles: node }, zoom: Math.max(state.cy.zoom(), 1.5) },
      { duration: 400 },
    );
    node.select();
    // Import showDetail lazily to avoid circular: table → detail is fine, detail → drill → table is fine
    import("./detail.js").then(({ showDetail }) => showDetail(id, null));
  });
}
