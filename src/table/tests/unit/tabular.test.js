import { computeGroupRowSpan } from '../../js/tabular.js';

function makeRows(...displays) {
  return displays.map((d) => ({ style: { display: d } }));
}

describe(computeGroupRowSpan, () => {
  it('returns rows.length when all rows are visible', () => {
    expect(computeGroupRowSpan(makeRows('', '', ''))).toBe(3);
  });

  it('returns 1 when only the header row (rows[0]) is visible', () => {
    expect(computeGroupRowSpan(makeRows('', 'none', 'none', 'none'))).toBe(1);
  });

  it('counts only visible rows when some are hidden', () => {
    // 4 rows: header visible, 1 hidden, 2 visible → 3 visible
    expect(computeGroupRowSpan(makeRows('', 'none', '', ''))).toBe(3);
  });

  it('returns 1 for a single-row group', () => {
    expect(computeGroupRowSpan(makeRows(''))).toBe(1);
  });

  it('returns 1 defensively when every row is hidden', () => {
    expect(computeGroupRowSpan(makeRows('none', 'none', 'none'))).toBe(1);
  });

  it('returns 1 for an empty array', () => {
    expect(computeGroupRowSpan([])).toBe(1);
  });

  it('treats any display value other than "none" as visible', () => {
    // Rows with display='' (browser default), 'table-row', etc. are visible.
    expect(computeGroupRowSpan(makeRows('', 'table-row', 'none', ''))).toBe(3);
  });
});
