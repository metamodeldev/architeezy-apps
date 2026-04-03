// ── TABULAR COLLAPSE HELPERS ────────────────────────────────────────────────

/**
 * Computes the correct rowSpan for a group header cell by counting how many of its rows are
 * currently visible (i.e. not display:none).
 *
 * Always returns at least 1 (the header row itself is never hidden via this mechanism, but we guard
 * defensively).
 *
 * @param {{ style: { display: string } }[]} rows - All `<tr>` elements belonging to this group, in
 *   order.
 * @returns {number} The number of visible rows, at minimum 1.
 */
export function computeGroupRowSpan(rows) {
  return Math.max(1, rows.filter((r) => r.style.display !== 'none').length);
}
