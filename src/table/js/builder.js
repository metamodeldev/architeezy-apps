// ── BUILDER SIDEBAR ────────────────────────────────────────────────────────
//
// Three sections: Rows, Columns, Data.
//
// Rows / Columns — each has N axis level cards (unified element+relation list).
// Data — has N data item cards (same filter UI + name input + mode selector).
//
// Level/data-item cards:
//   • Default collapsed = true (all cards start closed on page load).
//   • Collapse state stored in WeakMap<object, boolean> — survives re-renders,
//     Adding/removing items does not collapse/expand siblings.
//   • Header label: comma-separated selected type/relation names.
//   • Eye button (👁) on level cards: toggles level.hidden.
//
// Selection changes in level cards → notifyChange() re-renders both axis
// Sections (live count update) + calls _onDefChange.
// Selection changes in data item cards → _onDefChange only (counts are global).
//
// Data items define what to count/show per row/col/intersection:
//   ElementTypes + relationItems → navigation from the row/col leaf element
//   Mode: "count" | "presence" | "names"

import { buildAxisContexts, getAxisElements } from './compute.js';
import { t } from './i18n.js';
import { blankDataItem, blankLevel } from './matrix.js';
import { state } from './state.js';
import { elemColor, relColor } from './utils.js';

/** @type {(def: object) => void} */
// eslint-disable-next-line func-style
let _onDefChange = () => {};

export function initBuilder(onDefChange) {
  _onDefChange = onDefChange;
}

// ── COLLAPSE STATE ────────────────────────────────────────────────────────────

/**
 * Keyed by level / data-item object reference. Default is TRUE (collapsed) — all cards start closed
 * on page load. Never serialised; GC'd automatically when objects are removed.
 */
const cardCollapsed = new WeakMap();

// ── MODEL TYPE LISTS ──────────────────────────────────────────────────────────

function allElemTypes() {
  return [...new Set(state.allElements.map((e) => e.type))].toSorted();
}

function allRelTypes() {
  return [...new Set(state.allRelations.map((r) => r.type))].toSorted();
}

// ── COUNT HELPERS ─────────────────────────────────────────────────────────────

function countElemType(type, parentNodes) {
  if (!parentNodes) {
    return state.allElements.filter((e) => e.type === type).length;
  }
  const elemParents = parentNodes.filter((p) => !p._isRel);
  const relParents = parentNodes.filter((p) => p._isRel);
  const found = new Set();
  if (elemParents.length) {
    const pids = new Set(elemParents.map((p) => p.id));
    for (const e of state.allElements) {
      if (e.type === type && pids.has(e.parent)) {
        found.add(e.id);
      }
    }
  }
  for (const rel of relParents) {
    const connId = rel._traverseDir === 'out' ? rel.target : rel.source;
    if (connId) {
      const e = state.elemMap[connId];
      if (e && e.type === type) {
        found.add(e.id);
      }
    }
  }
  return found.size;
}

function countRelType(type, dir, parentNodes) {
  if (!parentNodes) {
    return state.allRelations.filter((r) => !type || r.type === type).length;
  }
  const elemParents = parentNodes.filter((p) => !p._isRel);
  if (!elemParents.length) {
    return 0;
  }
  const pids = new Set(elemParents.map((p) => p.id));
  if (dir === 'out') {
    return state.allRelations.filter((r) => (!type || r.type === type) && pids.has(r.source))
      .length;
  }
  return state.allRelations.filter((r) => (!type || r.type === type) && pids.has(r.target)).length;
}

// ── DATA ITEM COUNT HELPERS ───────────────────────────────────────────────────

function _collectConnectedIds(relItems, nodeId, found, filterByType) {
  for (const ri of relItems) {
    for (const rel of state.allRelations) {
      if (ri.type && rel.type !== ri.type) {
        continue;
      }
      const connId =
        ri.dir === 'out' && rel.source === nodeId
          ? rel.target
          : ri.dir === 'in' && rel.target === nodeId
            ? rel.source
            : undefined;
      if (connId) {
        const e = state.elemMap[connId];
        if (e && filterByType(e)) {
          found.add(e.id);
        }
      }
    }
  }
}

/**
 * Mirrors resolveDataItemElements logic for one axis node, returning a Set of element IDs of the
 * given type.
 *
 * RelNode → endpoints of the relation (+ further nav if relItems configured). Element → navigate
 * via relItems (no containment fallback for counts).
 *
 * @param {object} dataItem - The data item definition containing relation items.
 * @param {object} node - The axis node (element or relation node) to resolve from.
 * @param {string} type - The element type to filter by.
 * @returns {Set<string>} Set of matching element IDs reachable from the node.
 */
function resolveDataItemIds(dataItem, node, type) {
  const found = new Set();
  const relItems = dataItem.relationItems ?? [];
  /**
   * @param {{ type: string }} e - The element to test.
   * @returns {boolean} True if the element matches the type filter.
   */
  function filterByType(e) {
    return !type || e.type === type;
  }

  if (node._isRel) {
    // Same direction logic as resolveDataItemElements:
    //   _traverseDir="out" → foreign = target; _traverseDir="in" → foreign = source
    const foreignId = node._traverseDir === 'out' ? node.target : node.source;
    const foreign = foreignId ? state.elemMap[foreignId] : undefined;
    if (foreign) {
      if (relItems.length) {
        _collectConnectedIds(relItems, foreign.id, found, filterByType);
      } else if (filterByType(foreign)) {
        found.add(foreign.id);
      }
    }
  } else {
    // Element: navigate via relItems only — no containment fallback for counts
    _collectConnectedIds(relItems, node.id, found, filterByType);
  }
  return found;
}

/**
 * Element count for data item filter.
 *
 * Mirrors actual cell logic: Element×Element: how many col elements of type T are reachable from
 * any row element? RelNode×RelNode: how many elements of type T are common to both sides' resolved
 * sets? One axis only: size of resolved set for that axis. Neither: global count.
 *
 * @param {object} dataItem - The data item definition.
 * @param {string} type - The element type to count.
 * @param {object[]} rowNodes - The current row axis nodes.
 * @param {object[]} colNodes - The current column axis nodes.
 * @returns {number} The count of matching elements.
 */
function countDataElemType(dataItem, type, rowNodes, colNodes) {
  const hasRows = rowNodes.length > 0;
  const hasCols = colNodes.length > 0;
  if (!hasRows && !hasCols) {
    return state.allElements.filter((e) => e.type === type).length;
  }

  /**
   * @param {object[]} nodes - The axis nodes to resolve from.
   * @returns {Set<string>} Set of reachable element IDs.
   */
  function reachableFrom(nodes) {
    const ids = new Set();
    for (const n of nodes) {
      for (const id of resolveDataItemIds(dataItem, n, type)) {
        ids.add(id);
      }
    }
    return ids;
  }

  if (hasRows && hasCols) {
    const fromRows = reachableFrom(rowNodes);
    // Col candidates: for Element nodes the node itself; for RelNodes their resolved set
    const colCandidates = new Set();
    for (const n of colNodes) {
      if (n._isRel) {
        for (const id of resolveDataItemIds(dataItem, n, type)) {
          colCandidates.add(id);
        }
      } else if (n.type === type) {
        colCandidates.add(n.id);
      }
    }
    let n = 0;
    for (const id of fromRows) {
      if (colCandidates.has(id)) {
        n++;
      }
    }
    return n;
  }
  return reachableFrom(hasRows ? rowNodes : colNodes).size;
}

/**
 * Relation count for data item filter. rows+cols (Element×Element): cross-axis relations
 * (source∈rows, target∈cols or reversed). rows+cols with RelNodes on either side: 0
 * (relation-of-relation navigation not supported). One axis (element nodes): relations connecting
 * to that axis. Neither: global count.
 *
 * @param {string} type - The relation type to count (empty string = all types).
 * @param {string} dir - Traversal direction: "out" or "in".
 * @param {object[]} rowNodes - The current row axis nodes.
 * @param {object[]} colNodes - The current column axis nodes.
 * @returns {number} The count of matching relations.
 */
function countDataRelType(type, dir, rowNodes, colNodes) {
  const hasRows = rowNodes.length > 0;
  const hasCols = colNodes.length > 0;
  if (!hasRows && !hasCols) {
    return state.allRelations.filter((r) => !type || r.type === type).length;
  }

  const rowElemIds = new Set(rowNodes.filter((n) => !n._isRel).map((n) => n.id));
  const colElemIds = new Set(colNodes.filter((n) => !n._isRel).map((n) => n.id));

  if (hasRows && hasCols) {
    if (!rowElemIds.size || !colElemIds.size) {
      return 0;
    }
    if (dir === 'out') {
      return state.allRelations.filter(
        (r) => (!type || r.type === type) && rowElemIds.has(r.source) && colElemIds.has(r.target),
      ).length;
    }
    return state.allRelations.filter(
      (r) => (!type || r.type === type) && rowElemIds.has(r.target) && colElemIds.has(r.source),
    ).length;
  }

  const ctxIds = hasRows ? rowElemIds : colElemIds;
  if (!ctxIds.size) {
    return 0;
  }
  if (dir === 'out') {
    return state.allRelations.filter((r) => (!type || r.type === type) && ctxIds.has(r.source))
      .length;
  }
  return state.allRelations.filter((r) => (!type || r.type === type) && ctxIds.has(r.target))
    .length;
}

// ── LABEL HELPERS ─────────────────────────────────────────────────────────────

function levelHeaderLabel(level) {
  const parts = [];
  for (const type of level.elementTypes) {
    parts.push(type);
  }
  for (const ri of level.relationItems) {
    parts.push(`${ri.dir === 'out' ? '→' : '←'} ${ri.type}`);
  }
  return parts.join(', ') || '…';
}

function dataItemLabel(dataItem) {
  if (dataItem.name?.trim()) {
    return dataItem.name.trim();
  }
  return levelHeaderLabel(dataItem); // Same shape: elementTypes + relationItems
}

// ── SHARED CARD PARTS ─────────────────────────────────────────────────────────

/**
 * @param {string} labelText - The group header label text.
 * @returns {HTMLElement} The group header element.
 */
function makeGroupHeader(labelText) {
  const hdr = document.createElement('div');
  hdr.className = 'bl-drop-group-hdr';
  hdr.textContent = labelText;
  return hdr;
}

function _buildItemDefs(data, getElemCount, getRelCount, elemTypes, relTypes) {
  const defs = [];
  for (const type of elemTypes) {
    defs.push({
      label: type,
      count: getElemCount(type),
      color: elemColor(type),
      isChecked: () => data.elementTypes.includes(type),
      onToggle: (checked) => {
        if (checked) {
          if (!data.elementTypes.includes(type)) {
            data.elementTypes = [...data.elementTypes, type];
          }
        } else {
          data.elementTypes = data.elementTypes.filter((x) => x !== type);
        }
      },
    });
  }
  for (const type of relTypes) {
    for (const dir of ['out', 'in']) {
      const arrow = dir === 'out' ? '→' : '←';
      defs.push({
        label: `${arrow} ${type}`,
        count: getRelCount(type, dir),
        color: relColor(type),
        isChecked: () => data.relationItems.some((ri) => ri.type === type && ri.dir === dir),
        onToggle: (checked) => {
          if (checked) {
            if (!data.relationItems.some((ri) => ri.type === type && ri.dir === dir)) {
              data.relationItems = [...data.relationItems, { type, dir }];
            }
          } else {
            data.relationItems = data.relationItems.filter(
              (ri) => !(ri.type === type && ri.dir === dir),
            );
          }
        },
      });
    }
  }
  return defs;
}

/**
 * Builds a collapsible body + filter row + item list shared by both level cards and data item
 * cards.
 *
 * @param {object} data – level or data item object (mutated)
 * @param {Function} getElemCount – (type) => number
 * @param {Function} getRelCount – (type, dir) => number
 * @param {Function} onToggleCb – called after any checkbox toggle
 * @returns {{ body: HTMLElement; filterInput: HTMLInputElement }} The card body element and the
 *   filter text input.
 */
function makeFilterBody(data, getElemCount, getRelCount, onToggleCb) {
  const body = document.createElement('div');
  body.className = 'bl-level-body';

  // ── Filter row ─────────────────────────────────────────────────────────
  const filterRow = Object.assign(document.createElement('div'), {
    className: 'bl-level-filter-row',
  });

  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.className = 'bl-level-filter';
  filterInput.placeholder = t('filterPh');
  filterInput.value = data.filter ?? '';
  filterRow.append(filterInput);

  const showAllLabel = document.createElement('label');
  showAllLabel.className = 'bl-show-all';
  const showAllChk = Object.assign(document.createElement('input'), { type: 'checkbox' });
  const showAllSpan = Object.assign(document.createElement('span'), { textContent: t('showAll') });
  showAllLabel.append(showAllChk, showAllSpan);
  filterRow.append(showAllLabel);
  body.append(filterRow);

  // ── Unified item list ──────────────────────────────────────────────────
  const list = document.createElement('div');
  list.className = 'bl-drop-list bl-level-list';

  const elemTypes = allElemTypes(),
    relTypes = allRelTypes();
  const itemDefs = _buildItemDefs(data, getElemCount, getRelCount, elemTypes, relTypes);

  const listItems = itemDefs.map((def, i) => {
    // Insert group headers before the first item of each group
    if (i === 0 && elemTypes.length > 0) {
      list.append(makeGroupHeader(t('sectionElements')));
    } else if (i === elemTypes.length && relTypes.length > 0) {
      list.append(makeGroupHeader(t('sectionRelations')));
    }

    const lbl = document.createElement('label');
    lbl.className = 'bl-drop-item';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = def.isChecked();
    chk.addEventListener('change', () => {
      def.onToggle(chk.checked);
      onToggleCb();
    });

    const dot = document.createElement('span');
    dot.className = 'bl-drop-dot';
    dot.style.background = def.color;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'bl-drop-label';
    labelSpan.textContent = def.label;

    const countSpan = document.createElement('span');
    countSpan.className = 'bl-drop-count';
    countSpan.textContent = String(def.count);

    lbl.append(chk, dot, labelSpan, countSpan);

    if (def.count === 0 && !def.isChecked()) {
      lbl.style.display = 'none';
    }
    list.append(lbl);
    return { el: lbl, def };
  });

  function applyVisibilityFilter() {
    const text = filterInput.value.trim().toLowerCase();
    const showAll = showAllChk.checked;
    for (const { el, def } of listItems) {
      const nameMatch = !text || def.label.toLowerCase().includes(text);
      const visible = text ? nameMatch : def.count > 0 || def.isChecked() || showAll;
      el.style.display = visible ? '' : 'none';
    }
  }

  filterInput.addEventListener('input', () => {
    data.filter = filterInput.value;
    _onDefChange(state.currentDef);
    applyVisibilityFilter();
  });
  showAllChk.addEventListener('change', applyVisibilityFilter);

  body.append(list);
  return { body, filterInput };
}

/**
 * Attaches collapse toggle behaviour to header/body/icon.
 *
 * @param {HTMLElement} header - The card header element that triggers toggling.
 * @param {HTMLElement} body - The card body element to collapse or expand.
 * @param {HTMLElement} toggleIcon - The icon element whose class reflects collapse state.
 * @param {object} cardObj - The card data object used as a WeakMap key for collapse state.
 */
function attachCollapse(header, body, toggleIcon, cardObj) {
  const isCollapsed = cardCollapsed.get(cardObj) ?? true; // Default: collapsed
  if (isCollapsed) {
    body.classList.add('bl-collapsed');
    toggleIcon.classList.add('bl-collapsed');
  }
  header.addEventListener('click', () => {
    const collapsed = body.classList.toggle('bl-collapsed');
    toggleIcon.classList.toggle('bl-collapsed', collapsed);
    cardCollapsed.set(cardObj, collapsed);
  });
}

// ── NOTIFY CHANGE ─────────────────────────────────────────────────────────────

/**
 * Re-renders both axis sections (live count/label refresh) then notifies app.js to recompute and
 * re-render the table.
 *
 * @param {object} def - The current matrix definition.
 */
function notifyChange(def) {
  renderAxisSection(document.getElementById('bl-rows-sec'), def, 'row');
  renderAxisSection(document.getElementById('bl-cols-sec'), def, 'col');
  renderDataSection(def);
  _onDefChange(def);
}

// ── LEVEL CARD ────────────────────────────────────────────────────────────────

function _makeLevelRemoveBtn(axis, idx) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bl-remove-btn';
  btn.title = t('removeLevel');
  btn.textContent = '✕';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeLevel(axis, idx);
  });
  return btn;
}

function makeLevelRow(level, idx, axis, canRemove, parentNodes) {
  const card = document.createElement('div');
  card.className = `bl-level-row${level.hidden ? ' bl-level-hidden' : ''}`;

  const header = document.createElement('div');
  header.className = 'bl-level-main';

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'bl-level-toggle';
  toggleIcon.textContent = '▾';
  header.append(toggleIcon);

  const titleLabel = document.createElement('span');
  titleLabel.className = 'bl-level-title';
  titleLabel.textContent = levelHeaderLabel(level);
  header.append(titleLabel);

  const eyeBtn = document.createElement('button');
  eyeBtn.type = 'button';
  eyeBtn.className = `bl-eye-btn${level.hidden ? ' bl-eye-hidden' : ''}`;
  eyeBtn.title = level.hidden ? 'Show in table' : 'Hide from table';
  eyeBtn.textContent = '👁';
  eyeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    level.hidden = !level.hidden;
    notifyChange(state.currentDef);
  });
  header.append(eyeBtn);

  if (canRemove) {
    header.append(_makeLevelRemoveBtn(axis, idx));
  }
  card.append(header);

  const { body } = makeFilterBody(
    level,
    (type) => countElemType(type, parentNodes),
    (type, dir) => countRelType(type, dir, parentNodes),
    () => {
      titleLabel.textContent = levelHeaderLabel(level);
      notifyChange(state.currentDef);
    },
  );

  attachCollapse(header, body, toggleIcon, level);
  card.append(body);
  return card;
}

// ── DATA ITEM CARD ────────────────────────────────────────────────────────────

function _makeDataItemCardHeader(dataItem, idx, canRemove) {
  const card = document.createElement('div');
  card.className = 'bl-level-row';

  const header = document.createElement('div');
  header.className = 'bl-level-main';

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'bl-level-toggle';
  toggleIcon.textContent = '▾';
  header.append(toggleIcon);

  const titleLabel = document.createElement('span');
  titleLabel.className = 'bl-level-title';
  titleLabel.textContent = dataItemLabel(dataItem);
  header.append(titleLabel);

  if (canRemove) {
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'bl-remove-btn';
    removeBtn.title = t('removeLevel');
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeDataItem(idx);
    });
    header.append(removeBtn);
  }
  card.append(header);

  return { card, header, titleLabel, toggleIcon };
}

function _makeModeAndSepRows(dataItem) {
  // Separator row declared first so the mode-change listener can close over it.
  const sepRow = document.createElement('div');
  sepRow.className = 'bl-field bl-sep-row';
  sepRow.style.display = dataItem.mode === 'names' ? '' : 'none';
  const sepLabel = Object.assign(document.createElement('label'), {
    className: 'bl-label',
    textContent: t('joinSep'),
  });
  const sepInput = document.createElement('input');
  sepInput.type = 'text';
  sepInput.className = 'bl-input bl-sep-input';
  sepInput.value = dataItem.joinSep ?? ', ';
  sepInput.addEventListener('input', () => {
    dataItem.joinSep = sepInput.value;
    _onDefChange(state.currentDef);
  });
  sepRow.append(sepLabel, sepInput);

  const modeRow = document.createElement('div');
  modeRow.className = 'bl-field';
  const modeLabel = document.createElement('label');
  modeLabel.className = 'bl-label';
  modeLabel.textContent = t('cellMode');
  const modeSelect = document.createElement('select');
  modeSelect.className = 'bl-select';
  for (const [val, lbl] of [
    ['count', t('modeCount')],
    ['presence', t('modePresence')],
    ['names', t('modeNames')],
  ]) {
    const opt = Object.assign(document.createElement('option'), {
      value: val,
      textContent: lbl,
      selected: val === dataItem.mode,
    });
    modeSelect.append(opt);
  }
  modeSelect.addEventListener('change', () => {
    dataItem.mode = modeSelect.value;
    sepRow.style.display = dataItem.mode === 'names' ? '' : 'none';
    _onDefChange(state.currentDef);
  });
  modeRow.append(modeLabel, modeSelect);

  return { modeRow, sepRow };
}

function makeDataItemCard(dataItem, idx, canRemove, rowElems, colElems) {
  const { card, header, titleLabel, toggleIcon } = _makeDataItemCardHeader(
    dataItem,
    idx,
    canRemove,
  );

  // ── Body ─────────────────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'bl-level-body';
  attachCollapse(header, body, toggleIcon, dataItem);

  // Name input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'bl-level-filter bl-data-name-input';
  nameInput.placeholder = t('dataNamePh');
  nameInput.value = dataItem.name ?? '';
  nameInput.addEventListener('click', (e) => e.stopPropagation());
  nameInput.addEventListener('input', () => {
    dataItem.name = nameInput.value;
    titleLabel.textContent = dataItemLabel(dataItem);
    _onDefChange(state.currentDef);
  });
  body.append(nameInput);

  const { modeRow, sepRow } = _makeModeAndSepRows(dataItem);
  body.append(modeRow);
  body.append(sepRow);

  // Filter + item list with contextual counts from row/col axis elements
  function getElemCount(type) {
    return countDataElemType(dataItem, type, rowElems ?? [], colElems ?? []);
  }
  function getRelCount(type, dir) {
    return countDataRelType(type, dir, rowElems ?? [], colElems ?? []);
  }
  const { body: filterBody } = makeFilterBody(dataItem, getElemCount, getRelCount, () => {
    titleLabel.textContent = dataItemLabel(dataItem);
    _onDefChange(state.currentDef);
  });
  // Splice filterBody's children into body (skip the outer div wrapper)
  while (filterBody.firstChild) {
    body.append(filterBody.firstChild);
  }

  card.append(body);
  return card;
}

// ── AXIS SECTION RENDER ───────────────────────────────────────────────────────

function renderAxisSection(sectionEl, def, axisKey) {
  if (!sectionEl) {
    return;
  }
  const axis = axisKey === 'row' ? def.rowAxis : def.colAxis;
  const levels = axis.levels;
  const list = sectionEl.querySelector('.bl-levels-list');
  list.innerHTML = '';
  const contexts = buildAxisContexts(axis);
  for (let idx = 0; idx < levels.length; idx++) {
    const row = makeLevelRow(levels[idx], idx, axisKey, true, contexts[idx]);
    list.append(row);
  }
}

// ── DATA SECTION RENDER ───────────────────────────────────────────────────────

function renderDataSection(def) {
  const list = document.getElementById('bl-data-list');
  if (!list) {
    return;
  }
  list.innerHTML = '';
  const cells = def.cells ?? [];
  const rowElems = getAxisElements(def.rowAxis);
  const colElems = getAxisElements(def.colAxis);
  for (let idx = 0; idx < cells.length; idx++) {
    list.append(makeDataItemCard(cells[idx], idx, true, rowElems, colElems));
  }
}

// ── SETTINGS SECTION RENDER ───────────────────────────────────────────────────

function renderSettingsSection(def) {
  const list = document.getElementById('bl-settings-list');
  if (!list) {
    return;
  }
  if (!def.settings) {
    def.settings = {};
  }
  const settings = def.settings;
  // [settingKey, i18nLabelKey, defaultValue]
  const items = [
    ['rowTabular', 'settingRowTabular', true],
    ['colTabular', 'settingColTabular', true],
    ['showEmptyRows', 'settingShowEmptyRows', false],
    ['showEmptyCols', 'settingShowEmptyCols', false],
    ['rowSubtotals', 'settingRowSubtotals', false],
    ['colSubtotals', 'settingColSubtotals', false],
    ['rowTotals', 'settingRowTotals', false],
    ['colTotals', 'settingColTotals', false],
  ];
  list.innerHTML = '';
  for (const [key, i18nKey, defaultValue] of items) {
    const label = document.createElement('label');
    label.className = 'bl-setting-item';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = key in settings ? Boolean(settings[key]) : defaultValue;
    // oxlint-disable-next-line no-loop-func
    chk.addEventListener('change', () => {
      settings[key] = chk.checked;
      _onDefChange(def);
    });
    const span = document.createElement('span');
    span.textContent = t(i18nKey);
    label.append(chk);
    label.append(span);
    list.append(label);
  }
}

// ── FULL BUILDER RENDER ───────────────────────────────────────────────────────

export function renderBuilder(def) {
  if (!def) {
    return;
  }
  renderAxisSection(document.getElementById('bl-rows-sec'), def, 'row');
  renderAxisSection(document.getElementById('bl-cols-sec'), def, 'col');
  renderDataSection(def);
  renderSettingsSection(def);
  const nameInput = document.getElementById('matrix-name-input');
  if (nameInput && nameInput.value !== def.name) {
    nameInput.value = def.name ?? '';
  }
}

// ── ADD / REMOVE LEVELS ───────────────────────────────────────────────────────

export function addLevel(axis) {
  const def = state.currentDef;
  if (!def) {
    return;
  }
  const levels = axis === 'row' ? def.rowAxis?.levels : def.colAxis?.levels;
  if (!levels) {
    return;
  }
  const newLevel = blankLevel();
  cardCollapsed.set(newLevel, false); // Start expanded so the user sees the filter immediately
  levels.push(newLevel);
  notifyChange(def);
}

export function removeLevel(axis, idx) {
  const def = state.currentDef;
  if (!def) {
    return;
  }
  const levels = axis === 'row' ? def.rowAxis?.levels : def.colAxis?.levels;
  if (!levels) {
    return;
  }
  levels.splice(idx, 1);
  notifyChange(def);
}

// ── ADD / REMOVE DATA ITEMS ───────────────────────────────────────────────────

export function addDataItem() {
  const def = state.currentDef;
  if (!def) {
    return;
  }
  if (!def.cells) {
    def.cells = [];
  }
  const newDataItem = blankDataItem();
  cardCollapsed.set(newDataItem, false); // Start expanded so the user sees the filter immediately
  def.cells.push(newDataItem);
  renderDataSection(def);
  _onDefChange(def);
}

export function removeDataItem(idx) {
  const def = state.currentDef;
  if (!def?.cells) {
    return;
  }
  def.cells.splice(idx, 1);
  renderDataSection(def);
  _onDefChange(def);
}

// ── EVENT WIRING ──────────────────────────────────────────────────────────────

export function attachBuilderEvents() {
  const nameInput = document.getElementById('matrix-name-input');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (state.currentDef) {
        state.currentDef.name = nameInput.value;
        state.isDirty = true;
        updateDirtyIndicator();
      }
    });
  }
}

// ── DIRTY INDICATOR ───────────────────────────────────────────────────────────

export function updateDirtyIndicator() {
  const btn = document.getElementById('save-btn');
  if (btn) {
    btn.classList.toggle('dirty', state.isDirty);
  }
}

// ── TOOLBAR DROPDOWNS ─────────────────────────────────────────────────────────

export function toggleDropdown(id) {
  const target = id ? document.getElementById(id) : undefined;
  const wasOpen = target?.classList.contains('open');
  for (const d of document.querySelectorAll('.toolbar-dropdown')) {
    d.classList.remove('open');
  }
  if (target && !wasOpen) {
    target.classList.add('open');
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.toolbar-btn-wrap')) {
    for (const d of document.querySelectorAll('.toolbar-dropdown')) {
      d.classList.remove('open');
    }
  }
});
