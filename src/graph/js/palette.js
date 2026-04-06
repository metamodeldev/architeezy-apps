/**
 * Color palette with categorical colors in bit-reversal hue order. Provides maximum perceptual
 * separation for up to 12 types.
 *
 * @module palette
 * @package
 */

export const PALETTE = [
  '#c0474a', // H=  1° red
  '#2e9898', // H=180° teal
  '#5a9e2c', // H= 96° green
  '#6646b8', // H=258° violet
  '#a08e22', // H= 56° gold
  '#2e58b0', // H=224° blue
  '#229868', // H=156° emerald
  '#a83070', // H=330° berry
  '#b05e28', // H= 26° rust
  '#2878b0', // H=210° sky-blue
  '#349040', // H=127° forest
  '#9428a4', // H=297° plum
];

/**
 * Fast deterministic string hash (djb2 variant).
 *
 * @param {string} s - The string to hash.
 * @returns {number} Unsigned 32-bit integer.
 */
export function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    // oxlint-disable-next-line no-bitwise
    h = Math.trunc((h * 33) ^ s.codePointAt(i));
  }
  return Math.abs(h); // Unsigned — prevents negative palette indices
}

/** @type {Map<string, string>} */
let _elemColorMap = new Map();

/** @type {Map<string, string>} */
let _relColorMap = new Map();

/**
 * Builds a color map that assigns palette colors consecutively to types sorted alphabetically.
 * Because PALETTE is ordered in "bit-reversal" hue sequence, consecutive entries are maximally
 * spread: the first N types always receive the N most-perceptually-distinct colors available.
 *
 * @param {string[]} types - Unique type names.
 * @param {string[]} palette - Array of CSS color strings in bit-reversal hue order.
 * @returns {Map<string, string>} Type → color.
 */
function buildColorMap(types, palette) {
  const sorted = [...types].toSorted();
  const map = new Map();
  for (let i = 0; i < sorted.length; i++) {
    map.set(sorted[i], palette[i % palette.length]);
  }
  return map;
}

/**
 * Initialises the element and relationship color maps from the loaded model data. Must be called
 * once after each model load, before any call to `elemColor` or `relColor`.
 *
 * @param {{ type: string }[]} allElements - All model elements.
 * @param {{ type: string }[]} allRelations - All model relationships.
 */
export function initColorMaps(allElements, allRelations) {
  const elemTypes = [...new Set(allElements.map((e) => e.type))];
  const relTypes = [...new Set(allRelations.map((r) => r.type))];
  _elemColorMap = buildColorMap(elemTypes, PALETTE);
  _relColorMap = buildColorMap(relTypes, PALETTE);
}

/**
 * Maps an element type name to a palette color. Requires `initColorMaps` to have been called first.
 *
 * @param {string} typ - Element type name.
 * @returns {string} CSS color string.
 */
export function elemColor(typ) {
  return _elemColorMap.get(typ) ?? PALETTE[hashStr(typ) % PALETTE.length];
}

/**
 * Maps a relationship type name to a palette color. Requires `initColorMaps` to have been called
 * first.
 *
 * @param {string} typ - Relationship type name.
 * @returns {string} CSS color string.
 */
export function relColor(typ) {
  return _relColorMap.get(typ) ?? PALETTE[(hashStr(typ) + 7) % PALETTE.length];
}
