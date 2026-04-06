/**
 * Detail panel showing selected node and its connections.
 *
 * @module ui/detail
 * @package
 */

import { t } from '../i18n.js';
import { getRelationshipsForElement, getElemMap, hasElement } from '../model/index.js';
import { escHtml } from '../utils.js';
import { focusCyNode } from '../graph/index.js';

/**
 * Renders the detail panel for the element with the given `id`. Internal function. To show detail
 * from other modules, dispatch `detail:requestShow` with `{ nodeId }`.
 *
 * @param {string} id - ID of the element to display.
 */
export function showDetail(id) {
  const elemMap = getElemMap();
  const elem = elemMap[id];
  if (!elem) {
    return;
  }

  // Ensure the details section is expanded
  const section = document.getElementById('sec-detail');
  if (section && section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
    const toggleBtn = document.querySelector('.sidebar-toggle-btn[data-section="sec-detail"]');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
    const icon = document.getElementById('icon-sec-detail');
    if (icon) {
      icon.classList.remove('rotated');
    }
  }

  const conns = getRelationshipsForElement(id);
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
    <div class="detail-conn">${connItems || `<span class="detail-no-relations">${t('detailNoRelations')}</span>`}</div>
  `;

  // Connection select: show detail for connected node and focus it in the graph
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

// ============ EVENT HANDLING ============

/** Initializes detail module: registers global listeners. */
export function init() {
  document.addEventListener('graph:nodeTap', (e) => {
    showDetail(e.detail.nodeId);
  });
  document.addEventListener('drill:entered', (e) => {
    showDetail(e.detail.nodeId);
  });
  document.addEventListener('graph:canvasTap', clearDetail);
  document.addEventListener('detail:requestShow', (e) => {
    showDetail(e.detail.nodeId);
  });
}
