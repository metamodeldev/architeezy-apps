/**
 * Detail panel showing selected node and its connections.
 *
 * @module view/detail-panel
 */

import { drillNodeId, onNodeDrill } from '../drill/index.js';
import { getCy, focusCyNode } from '../graph/index.js';
import { t } from '../i18n.js';
import {
  getElemMap,
  getRelations,
  getRelationshipsForElement,
  hasElement,
} from '../model/index.js';
import {
  selectedEdgeId,
  selectedNodeId,
  setSelectedEdgeId,
  setSelectedNodeId,
} from '../selection/index.js';
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
        if (drillNodeId.value) {
          onNodeDrill(targetId);
        } else {
          const cy = getCy();
          if (cy) {
            cy.elements().unselect();
          }
          setSelectedEdgeId(undefined);
          setSelectedNodeId(targetId);
          focusCyNode(targetId);
        }
      }
    });
  }
}

/**
 * Renders the detail panel for the edge with the given `id`.
 *
 * @param {string} id - ID of the relationship to display.
 */
export function showEdgeDetail(id) {
  const rel = getRelations().find((r) => r.id === id);
  if (!rel) {
    return;
  }

  const elemMap = getElemMap();
  const sourceName = elemMap.get(rel.source)?.name ?? rel.source;
  const targetName = elemMap.get(rel.target)?.name ?? rel.target;
  const relLabel = rel.name || rel.type;

  document.getElementById('detail-panel').innerHTML = `
    <div class="detail-name">${escHtml(relLabel)}</div>
    <div class="detail-type">${escHtml(rel.type)}</div>
    <div class="detail-section-title">${t('detailSource')}</div>
    <div class="detail-edge-entity" data-node-id="${escHtml(rel.source)}">${escHtml(sourceName)}</div>
    <div class="detail-section-title">${t('detailTarget')}</div>
    <div class="detail-edge-entity" data-node-id="${escHtml(rel.target)}">${escHtml(targetName)}</div>
  `;

  const panel = document.getElementById('detail-panel');
  for (const el of panel.querySelectorAll('.detail-edge-entity[data-node-id]')) {
    el.addEventListener('click', () => {
      const nodeId = el.dataset.nodeId;
      if (!hasElement(nodeId)) {
        return;
      }
      const cy = getCy();
      if (cy) {
        cy.elements().unselect();
        cy.$id(nodeId).select();
      }
      setSelectedEdgeId(undefined);
      setSelectedNodeId(nodeId);
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
  // React to node/edge selection changes
  effect(() => {
    const edgeId = selectedEdgeId.value;
    const nodeId = selectedNodeId.value;
    if (edgeId) {
      showEdgeDetail(edgeId);
    } else if (nodeId) {
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
