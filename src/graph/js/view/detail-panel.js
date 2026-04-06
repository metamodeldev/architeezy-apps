/**
 * Detail panel showing selected node and its connections.
 *
 * @module view/detail-panel
 */

import { drillNodeId } from '../drill/index.js';
import { focusCyNode } from '../graph/index.js';
import { t } from '../i18n.js';
import { getElemMap, getRelationshipsForElement, hasElement } from '../model/index.js';
import { selectedNodeId } from '../selection/index.js';
import { effect } from '../signals/index.js';
import { escHtml } from '../utils.js';

/**
 * Renders the detail panel for the element with the given `id`.
 *
 * @param {string} id - ID of the element to display.
 */
export function showDetail(id) {
  const elemMap = getElemMap();
  const elem = elemMap.get(id);
  if (!elem) {
    return;
  }

  const conns = getRelationshipsForElement(id);
  const connItems = conns
    .map((r) => {
      const otherId = r.source === id ? r.target : r.source;
      const dir = r.source === id ? '→' : '←';
      const peerName = elemMap.get(otherId)?.name ?? otherId;
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
    <div class="detail-conn">${connItems || `<span class="detail-no-relations">${t('detailNoRelations')}</span>`}</div>
  `;

  const connectionsEl = document.querySelector('#detail-panel .detail-conn');
  if (connectionsEl) {
    connectionsEl.addEventListener('click', (e) => {
      const item = e.target.closest('.detail-conn-item[data-target]');
      if (!item) {
        return;
      }
      const targetId = item.dataset.target;
      if (hasElement(targetId)) {
        showDetail(targetId);
        focusCyNode(targetId);
      }
    });
  }
}

/** Resets the detail panel to its empty placeholder state. */
export function clearDetail() {
  document.getElementById('detail-panel').innerHTML =
    `<div class="detail-empty">${t('detailEmpty')}</div>`;
}

// ── REACTIVE WIRING ───────────────────────────────────────────────────────────

/** Initializes detail module: registers reactive effects. */
export function init() {
  // React to node selection changes (tap/clear)
  effect(() => {
    const nodeId = selectedNodeId.value;
    if (nodeId) {
      showDetail(nodeId);
    } else {
      clearDetail();
    }
  });

  // Show detail when drill-down activates on a node
  let prevDrillNodeId;
  effect(() => {
    const nodeId = drillNodeId.value;
    if (nodeId && nodeId !== prevDrillNodeId) {
      showDetail(nodeId);
    }
    prevDrillNodeId = nodeId;
  });
}
