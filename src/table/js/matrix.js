// ── MATRIX DEFINITION ──────────────────────────────────────────────────────

function genId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for plain HTTP (no secure context)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16);
    // oxlint-disable-next-line no-bitwise
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
//
// A MatrixDefinition is a plain, fully serialisable JS object.
//
// Each axis has an array of levels.  There is no forced alternation between
// Object and relation levels — every level is the same shape:
//
//   Level:
//     {
//       ElementTypes:  string[],                          // element type names; [] = none
//       RelationItems: { type: string, dir: "out"|"in" }[], // relation traversals; [] = none
//       Filter:        string,                            // substring filter on element name
//     }
//
// Level semantics:
//   Level 0 (root):
//     ElementTypes → collect all model elements of those types globally.
//     RelationItems → ignored (no parent context exists at root).
//
//   Level N > 0:
//     ElementTypes  → elements contained by a parent element (e.parent ∈ parentIds)
//                     Whose type matches any of the listed types.
//     RelationItems → elements reachable from parent elements via explicit relations:
//                     Dir="out" → follow relation FROM parent (rel.source ∈ parentIds)
//                     Dir="in"  → follow relation TO parent   (rel.target ∈ parentIds)
//     Both sources are unioned; a union of both is used when both are set.
//
// The last level's elements are the leaf row/column elements.
// All intermediate levels become sticky group-header columns/rows.

/**
 * Creates a fresh empty MatrixDefinition.
 *
 * @param {string} [name] - Optional name for the new definition.
 * @returns {object} A new empty MatrixDefinition with default settings.
 */
export function createDef(name = '') {
  return {
    id: genId(),
    name,
    rowAxis: { levels: [blankLevel()] },
    colAxis: { levels: [blankLevel()] },
    cells: [blankDataItem()],
    rowSort: { by: 'label', dir: 'asc' },
    colSort: { by: 'label', dir: 'asc' },
    settings: {
      rowTabular: true,
      colTabular: true,
      showEmptyRows: false,
      showEmptyCols: false,
      rowSubtotals: false,
      colSubtotals: false,
      rowTotals: false,
      colTotals: false,
    },
  };
}

/**
 * Returns a blank (unconfigured) data item. A data item defines what elements to count/show for
 * each row, column, or row-column intersection: elementTypes – element types to navigate to
 * relationItems – relations to traverse FROM the row/col element filter – substring filter on
 * matched element names mode – "count" | "presence" | "names" joinSep – separator for mode="names"
 *
 * @returns {object} A new blank data item definition with default mode "count".
 */
export function blankDataItem() {
  return {
    id: genId(),
    name: '',
    elementTypes: [],
    relationItems: [],
    filter: '',
    mode: 'count',
    joinSep: ', ',
    emptyValue: '',
  };
}

/**
 * Deep-clones a definition, assigning a new UUID.
 *
 * @param {object} def - The definition to clone.
 * @param {string} [newName] - Optional new name for the cloned definition.
 * @returns {object} A deep clone of the definition with a new UUID.
 */
export function cloneDef(def, newName) {
  const clone = structuredClone(def);
  clone.id = genId();
  if (newName !== undefined) {
    clone.name = newName;
  }
  return clone;
}

/**
 * Returns true when at least one axis has a non-empty selection. The table renders with a partial
 * result when only one axis is configured. A level is "active" when elementTypes.length > 0 OR
 * relationItems.length > 0.
 *
 * @param {object} def - The matrix definition to check.
 * @returns {boolean} True if the definition has at least one configured axis
 * level.
 */
/** @param {object} axis - The axis definition to check. */
function check(axis) {
  return (axis?.levels ?? []).some(
    (l) => l.elementTypes?.length > 0 || l.relationItems?.length > 0,
  );
}

export function isDefReady(def) {
  if (!def) {
    return false;
  }
  return check(def.rowAxis) || check(def.colAxis);
}

/**
 * Returns a new blank (unconfigured) level.
 *
 * @returns {object} A new blank axis level with empty elementTypes and
 * relationItems.
 */
export function blankLevel() {
  return { elementTypes: [], relationItems: [], filter: '', hidden: false };
}

// ── MIGRATION ────────────────────────────────────────────────────────────────

/**
 * Migrates any legacy MatrixDefinition format to the current one. Safe to call on an
 * already-current def (no-op).
 *
 * @param {object} def - The definition to normalize (mutated in place).
 * @returns {object | null} The normalized definition, or undefined if def is
 * falsy.
 */
export function normalizeDef(def) {
  if (!def) {
    return;
  }

  // ── Format 1: top-level rowLevels / colLevels arrays (very old) ──────────
  if (def.rowLevels !== undefined || def.colLevels !== undefined) {
    def.rowAxis = { levels: _migrateAxisLevels(def.rowLevels ?? []) };
    def.colAxis = { levels: _migrateAxisLevels(def.colLevels ?? []) };
    delete def.rowLevels;
    delete def.colLevels;
  }

  // ── Format 2: kind-based levels inside rowAxis / colAxis ─────────────────
  if (def.rowAxis?.levels) {
    def.rowAxis.levels = _migrateAxisLevels(def.rowAxis.levels);
  }
  if (def.colAxis?.levels) {
    def.colAxis.levels = _migrateAxisLevels(def.colAxis.levels);
  }

  // ── Format 3: old single def.cell → def.cells[0] ─────────────────────────
  if (def.cell && !def.cells) {
    def.cells = [_migrateCellToDataItem(def.cell)];
    delete def.cell;
  }
  if (!def.cells) {
    def.cells = [blankDataItem()];
  }

  if (!def.settings) {
    def.settings = {};
  }

  return def;
}

/**
 * Converts the legacy single cell definition to a DataItem. Best-effort migration: relation types +
 * direction → relationItems.
 *
 * @param {object} cell - The legacy cell definition object.
 * @returns {object} A new data item definition in the current format.
 */
function _migrateCellToDataItem(cell) {
  if (!cell) {
    return blankDataItem();
  }
  const relTypes = cell.relTypes ?? [];
  let dirs = [];
  if (cell.direction === 'row_col') {
    dirs = ['out'];
  } else if (cell.direction === 'col_row') {
    dirs = ['in'];
  } else {
    dirs = ['out', 'in'];
  }
  const relationItems = relTypes.flatMap((t) => dirs.map((d) => ({ type: t, dir: d })));
  let mode = 'count';
  if (cell.mode === 'presence') {
    mode = 'presence';
  } else if (cell.mode === 'rel_name') {
    mode = 'names';
  }
  return {
    id: genId(),
    name: '',
    elementTypes: [],
    relationItems,
    filter: '',
    mode,
    joinSep: cell.joinSep ?? ', ',
    emptyValue: cell.emptyValue ?? '',
  };
}

/**
 * Migrates a flat array of old-format levels to new unified format.
 *
 * Old alternating model: [obj, rel, obj, rel, obj, …] → Pair-based collapse: each pair (obj[i],
 * rel[i+1]) is merged so that the next new level carries rel[i+1]'s traversal rules. obj[0] → new
 * level 0 (root, no relation items) rel[1] + obj[2] → new level 1 (elementTypes from obj[2],
 * relationItems from rel[1]) rel[3] + obj[4] → new level 2 (elementTypes from obj[4], relationItems
 * from rel[3])
 *
 * @param {object[]} oldLevels - The legacy level array to migrate.
 * @returns {object[]} The migrated array of levels in the current unified
 * format.
 */
function _migrateAxisLevels(oldLevels) {
  if (!oldLevels?.length) {
    return [blankLevel()];
  }

  // Already new format (all levels have a relationItems array)
  if (oldLevels.every((l) => Array.isArray(l?.relationItems))) {
    return oldLevels;
  }

  const newLevels = [];
  let i = 0;

  while (i < oldLevels.length) {
    const level = oldLevels[i];

    if (level.kind === 'object' || !level.kind) {
      // Push this object level as-is (no relation items from it)
      newLevels.push({
        elementTypes: level.elementTypes ?? [],
        relationItems: [],
        filter: level.filter ?? '',
        hidden: level.hidden ?? false,
      });
      i++;
    } else if (level.kind === 'relation') {
      // Merge this relation level into the NEXT object level
      const relItems = _relLevelToItems(level);
      if (i + 1 < oldLevels.length) {
        const next = oldLevels[i + 1];
        newLevels.push({
          elementTypes: next.elementTypes ?? [],
          relationItems: relItems,
          filter: next.filter ?? '',
          hidden: next.hidden ?? false,
        });
        i += 2; // Consumed both the relation level and the next object level
      } else {
        i++; // Orphaned relation level at end — skip
      }
    } else {
      // Fallback: treat as a generic old level
      newLevels.push({
        elementTypes: level.elementType ? [level.elementType] : (level.elementTypes ?? []),
        relationItems: [],
        filter: level.filter ?? '',
      });
      i++;
    }
  }

  return newLevels.length ? newLevels : [blankLevel()];
}

function _relLevelToItems(relLevel) {
  const types = relLevel.relationTypes ?? [];
  if (!types.length) {
    return [];
  } // "all relation types" can't be represented; user must reconfigure

  if (relLevel.direction === 'both') {
    return types.flatMap((t) => [
      { type: t, dir: 'out' },
      { type: t, dir: 'in' },
    ]);
  }
  const dir = relLevel.direction === 'incoming' ? 'in' : 'out';
  return types.map((t) => ({ type: t, dir }));
}
