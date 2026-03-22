// ── DETAIL PANEL ───────────────────────────────────────────────────────────

import { state } from "./state.js";
import { escHtml } from "./utils.js";
import { t } from "./i18n.js";

export function showDetail(id, drillCallback) {
  const elem = state.elemMap[id];
  if (!elem) return;

  const conns = state.allRelations.filter((r) => r.source === id || r.target === id);
  const connItems = conns
    .map((r) => {
      const otherId = r.source === id ? r.target : r.source;
      const dir = r.source === id ? "→" : "←";
      const peerName = state.elemMap[otherId]?.name ?? otherId;
      const relLabel = r.name ? `${escHtml(r.type)}: ${escHtml(r.name)}` : escHtml(r.type);
      return `<div class="detail-conn-item" data-target="${otherId}">
      <span class="conn-name">${dir} ${escHtml(peerName)}</span>
      <span class="conn-rel">${relLabel}</span>
    </div>`;
    })
    .join("");

  const nsLabel = elem.ns ? `${escHtml(elem.ns)}:` : "";
  document.getElementById("detail-panel").innerHTML = `
    <div class="detail-name">${escHtml(elem.name)}</div>
    <div class="detail-type">${nsLabel}${escHtml(elem.type)}</div>
    ${elem.doc ? `<div class="detail-doc">${escHtml(elem.doc)}</div>` : ""}
    <div class="detail-section-title">${t("detailRelations", conns.length)}</div>
    <div class="detail-conn">${connItems || `<span style="color:var(--text-muted)">${t("detailNoRelations")}</span>`}</div>`;

  if (drillCallback) {
    document.querySelectorAll(".detail-conn-item[data-target]").forEach((el) =>
      el.addEventListener("click", () => {
        const n = state.cy?.$id(el.dataset.target);
        if (n?.length) {
          clearTimeout(state.tapTimer);
          drillCallback(n);
        }
      }),
    );
  }
}

export function clearDetail() {
  document.getElementById("detail-panel").innerHTML =
    `<div class="detail-empty">${t("detailEmpty")}</div>`;
}
