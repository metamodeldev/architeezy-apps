// ── DETAIL PANEL ───────────────────────────────────────────────────────────

import { cancelTapTimer, hasGraphNode } from './graph.js';
import { t } from './i18n.js';
import { getAllRelations, getElemMap } from './model.js';
import { escHtml } from './utils.js';

/**
 * Renders the detail panel for the element with the given `id`. Lists the element's name, type,
 * optional documentation, and all connections. Each connection item fires `drillCallback` when
 * clicked if provided.
 *
 * @param {string} id - ID of the element to display.
 * @param {function(string): void | null} drillCallback - Called with the target node ID when a
 *   connection item is clicked, or null to disable drill navigation from the panel.
 */
export function showDetail(id, drillCallback) {
  const elemMap = getElemMap();
  const elem = elemMap[id];
  if (!elem) {
    return;
  }

  const conns = getAllRelations().filter((r) => r.source === id || r.target === id);
  const connItems = conns
    .map((r) => {
      const otherId = r.source === id ? r.target : r.source;
      const dir = r.source === id ? '→' : '←';
      const peerName = elemMap[otherId]?.name ?? otherId;
      const relLabel = r.name ? `${escHtml(r.type)}: ${escHtml(r.name)}` : escHtml(r.type);
      return `<div class="detail-conn-item" data-target="${escHtml(otherId)}">
      <span class="conn-name">${dir} ${escHtml(peerName)}</span>
      <span class="conn-rel">${relLabel}</span>
    </div>`;
    })
    .join('');

  const nsLabel = elem.ns ? `${escHtml(elem.ns)}:` : '';
  document.getElementById('detail-panel').innerHTML = `
    <div class="detail-name">${escHtml(elem.name)}</div>
    <div class="detail-type">${nsLabel}${escHtml(elem.type)}</div>
    ${elem.doc ? `<div class="detail-doc">${escHtml(elem.doc)}</div>` : ''}
    <div class="detail-section-title">${t('detailRelations', conns.length)}</div>
    <div class="detail-conn">${connItems || `<span class="detail-no-relations">${t('detailNoRelations')}</span>`}</div>`;

  if (drillCallback) {
    document.querySelector('#detail-panel .detail-conn').addEventListener('click', (e) => {
      const item = e.target.closest('.detail-conn-item[data-target]');
      if (!item) {
        return;
      }
      const targetId = item.dataset.target;
      if (hasGraphNode(targetId)) {
        cancelTapTimer();
        drillCallback(targetId);
      }
    });
  }
}

/** Resets the detail panel to its empty placeholder state. */
export function clearDetail() {
  document.getElementById('detail-panel').innerHTML =
    `<div class="detail-empty">${t('detailEmpty')}</div>`;
}
