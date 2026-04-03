# Architeezy Table — Specification

## Overview

**Architeezy Table** is a single-page web application for analysing any Architeezy model through
interactive tables and matrices. Typical use cases include RACI matrices, traceability matrices, and
dependency charts, but the matrix builder is fully generic. No build step; all code is vanilla ES
modules.

## Authentication

- Token stored **in memory only** — never in `localStorage` or cookies (XSS protection).
- **Anonymous** access: public models are available without signing in.
- **Sign-in flow**: header button → opens popup to `https://architeezy.com/-/auth` → popup posts
  `{ type: "AUTH_SUCCESS", token, idToken }` via `window.postMessage` → token saved in module-level
  variable → UI updates to show user name.
- Every API request goes through `apiFetch(url)`, which adds `Authorization: Bearer <token>` when a
  token is present and `credentials: "include"` for cookie-based sessions.
- HTTP 401 response → token cleared → auth UI reset.
- **Sign-out**: clears in-memory token; the matrix remains visible.
- `fetchCurrentUser()` calls `GET /api/users/current` to populate the displayed user name after
  sign-in or startup.

## Data Sources

### Model list

```http
GET https://architeezy.com/api/models?size=100
```

All pages are fetched automatically until `_links.next` is absent. Response format: Spring HATEOAS /
HAL — `_embedded.models[]`. Each model object includes `id`, `name`, `description`, `contentType`,
`scopeSlug`, `projectSlug`, `projectVersion`, `slug`, and `_links`.

### Model content

```http
GET https://architeezy.com/api/models/{scopeSlug}/{projectSlug}/{projectVersion}/{slug}/content?format=json
```

Resolved from `model._links.content[0].href` (HAL link). All models share the same envelope:

```json
{ "content": [ { "id": "…", "eClass": "ns:TypeName", "data": { … } } ] }
```

## Universal Parser

The parser is fully structural and hardcodes no type names or property keys.

### Classification rules (applied to every node in the `content` tree)

1. `data.source` + `data.target` present → **standalone edge** (relation).
2. `data.target` present + parent element exists, `data.source` absent → **embedded reference edge**
   (relation with implicit source = parent).
3. Everything else → **node** (element).

### Traversal

- `content[0]` (the model root) is always skipped as a node; only its `data` is traversed.
- All array-valued properties of `data` are walked recursively.
- Object values with an `eClass` property are walked as nested nodes.
- String values that look like UUIDs (`/^[0-9a-f]{8,}(-[0-9a-f]+)*/i`) become implicit edges from
  the parent node to the referenced node.
- `EStringToStringMapEntry` entries with the Ecore namespace URI are silently filtered (EMF internal
  metadata).

### Output

After parsing, `state` contains:

- `allElements` — array of `{ id, type, ns, name, doc, parent }`. `name` is resolved as
  `data.name ?? data.label ?? data.title ?? typeName`. `parent` is the ID of the containing element
  (from EMF containment).
- `allRelations` — array of `{ id, type, ns, name, source, target }`.
- `elemMap` — `{ [id]: element }` for O(1) lookup.
- `modelNsMap` — `{ [prefix]: fullURI }` namespace mappings.
- `currentModelNs` — the model's root namespace URI (used as storage key).
- `currentModelContentType` — the model's `contentType` URI (used for templates).

## Layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│ [← Gallery]  Architeezy Table  [⊞ model name]  [user]  [🌙 ☀️ 🖥]   │
├──────────────────────────────────────────────────────────────────────┤
│ [name input]  [New]  [Save]  [Save as template]  [Saved ▾]           │
│               [Templates ▾]  —————  [↓ CSV]  [⧉ Copy]               │
├────────────────────┬─────────────────────────────────────────────────┤
│ ‹ BUILDER          │                                                  │
│                    │  ← TABLE →                                │
│ Rows ▼             │                                                  │
│  [level card]      │  (column group headers, sticky top)             │
│  [+ Add level]     │  (column leaf headers, sticky top)              │
│                    │  (row group + leaf headers, sticky left)        │
│ Columns ▼          │  (data cells)                                   │
│  [level card]      │                                                  │
│  [+ Add level]     │                                                  │
│                    │                                                  │
│ Data ▼             │                                                  │
│  [data item card]  │                                                  │
│  [+ Data]          │                                                  │
│                    │                                                  │
│ Settings ▼         │                                                  │
│  [checkboxes]      │                                                  │
└────────────────────┴─────────────────────────────────────────────────┤
│ stats: R rows · C columns · V non-empty cells                         │
└──────────────────────────────────────────────────────────────────────┘
```

### Header

Left: back link to gallery. Centre: app title + model selector button. Right: auth controls + theme
switcher (🌙 ☀️ 🖥).

### Toolbar

Matrix name input · New · Save · Save as template · Saved ▾ · Templates ▾ · (separator) · ↓ CSV · ⧉
Copy.

### Builder sidebar

Collapsible via ‹ / › toggle button. Four collapsible sections: **Rows**, **Columns**, **Data**,
**Settings**. Each section can be expanded/collapsed via its header.

### Main area

`overflow: auto` in both axes, inside a `flex: 1` container. Sticky first row(s)
(`position: sticky; top: 0`) and first column(s) (`position: sticky; left: Npx`) using inline styles
set by `table.js`.

### Stats bar

Pinned at bottom of main area. Format: `{R} rows · {C} columns · {V} non-empty cells`.

## Data Model

### Node types

The model is represented as a directed graph with three node types:

**Element** `{ id, type, name, parent, … }` Plain model object. `parent` is the id of the containing
element (or null).

**Relation** `{ id, type, name, source, target, … }` Directed edge from `source` element to `target`
element.

**RelNode** `{ …Relation, _isRel: true, _traverseDir: "out"|"in" }` A relation exposed as an axis
node. Carries a traversal direction:

- `"out"` — relation was reached by following an outgoing edge from the source element. The "home"
  element is source; the **foreign endpoint** is target.
- `"in"` — relation was reached by following an incoming edge from the target element. The "home"
  element is target; the **foreign endpoint** is source.

**DataItemNode**
`{ _isDataItem: true, id, name, elementTypes, relationItems, filter, mode, joinSep, emptyValue }`
Virtual leaf produced from a data item definition. Used only in `rows_data` / `cols_data` layout
modes.

## Matrix Definition Data Model

```js
{
  id:      string,           // UUID (generated on creation/clone)
  name:    string,
  rowAxis: { levels: Level[] },
  colAxis: { levels: Level[] },
  cells:   DataItem[],       // array of data item definitions
  rowSort: { by: "label", dir: "asc" | "desc" },
  colSort: { by: "label", dir: "asc" | "desc" },
  settings: MatrixSettings,  // optional display settings
}
```

### Level

```js
{
  elementTypes:  string[],                           // element types to collect; [] = none
  relationItems: { type: string, dir: "out"|"in" }[], // relation traversals; [] = none
  filter:        string,                             // substring match on node name
  hidden:        boolean,                            // omit this level's header cells from table
}
```

A level with both `elementTypes` and `relationItems` empty is **blank** and treated as transparent —
it is skipped as if it did not exist. Adding a blank level does not clear the table.

### DataItem

```js
{
  id:           string,   // UUID
  name:         string,   // optional label shown in table header
  elementTypes: string[], // element types to navigate to; [] = any
  relationItems: { type: string, dir: "out"|"in" }[], // relation steps to traverse; [] = no steps
  filter:       string,   // substring match on resolved element names
  mode:         "count" | "presence" | "names",
  joinSep:      string,   // separator for mode="names"; default ", "
  emptyValue:   string,   // shown when nothing resolved; default ""
}
```

An **active** data item has at least one `elementType` or `relationItem` set. Blank data items are
ignored when determining layout mode.

## Axis Level Resolution

### `resolveLevel(level, parentNodes, sort)`

**parentNodes = null** (root level):

- `elementTypes` → all model elements of those types.
- `relationItems` → all relations matching each `{type, dir}`, wrapped as RelNodes.

**parentNodes = Element[]**:

- `elementTypes` → elements whose `parent` is in the parent set, matching type.
- `relationItems` → outgoing (`dir="out"`, `rel.source ∈ parentIds`) or incoming (`dir="in"`,
  `rel.target ∈ parentIds`) relations, wrapped as RelNodes.

**parentNodes = RelNode[]** (when the previous level produced RelNodes):

- `elementTypes` → the foreign endpoint of each RelNode, filtered by type. (`_traverseDir="out"` →
  endpoint is `rel.target`; `"in"` → endpoint is `rel.source`).
- `relationItems` — not currently supported for RelNode parents.

Level `filter` is applied after resolution: nodes whose name doesn't match are excluded.

### Empty levels

A blank level (no elementTypes, no relationItems) is stripped before traversal. `buildAxis` filters
to active levels only, then calls `buildTree` with that filtered list. Empty trailing levels added
via "+ Add level" are completely invisible to the table.

### `buildAxis` output

```js
{
  (numGroupLevels, flatRows, leafHidden);
}
```

- `numGroupLevels` — count of non-hidden active levels except the last.
- `flatRows` — `FlatRow[]`, one per leaf node.
- `leafHidden` — whether the last active level has `hidden: true`.

```js
FlatRow  = { groups: GroupCell[], leafElem: Element | RelNode | DataItemNode }
GroupCell = { elem, span, first }
```

## Data Items

### `resolveDataItemElements(dataItem, parentNode) → Element[]`

Returns elements reachable from `parentNode` as defined by the data item.

**parentNode is Element**:

1. With `relationItems`: for each `{type, dir}` step, follow relations of that type in that
   direction from `parentNode`, collect the connected elements. Filter results by `elementTypes` (if
   any) and name `filter`.
2. Without `relationItems` (containment fallback): return direct children (elements whose
   `parent === parentNode.id`) matching `elementTypes`. If `elementTypes` is also empty, returns
   nothing.

**parentNode is RelNode**:

The foreign endpoint is direction-dependent:

- `_traverseDir="out"` → foreign = `target` element
- `_traverseDir="in"` → foreign = `source` element

1. Without `relationItems`: return the foreign element itself (filtered by `elementTypes`, if any).
2. With `relationItems`: navigate further from the foreign element using the same `{type, dir}` step
   logic as for Element parents.

### Cell display

`mode` controls the displayed value:

| Mode       | Cell displays                                |
| ---------- | -------------------------------------------- |
| `count`    | Number of resolved elements (default)        |
| `presence` | `✓` if any elements resolved, `""` otherwise |
| `names`    | Resolved element names joined by `joinSep`   |

## Layout Modes

Determined by which axes and data items are configured (have at least one active level / data item):

| rows | cols | data items | Mode        | Description                                            |
| ---- | ---- | ---------- | ----------- | ------------------------------------------------------ |
| ✓    | ✓    | (any)      | `full`      | rows × cols grid; first data item used for cell values |
| ✓    |      | ✓          | `rows_data` | data items become virtual column axis                  |
|      | ✓    | ✓          | `cols_data` | data items become virtual row axis                     |
| ✓    |      |            | `rows_only` | rows listed, no columns                                |
|      | ✓    |            | `cols_only` | columns listed, no rows                                |

## Settings

Matrix definitions can include an optional `settings` object controlling display behaviour:

```js
settings: {
  rowTabular:    boolean,   // tabular form for rows — each level in its own column (default true)
  colTabular:    boolean,   // tabular form for columns — each level in its own row (default true)
  showEmptyRows: boolean,   // include row axis nodes with no children (default false)
  showEmptyCols: boolean,   // include col axis nodes with no children (default false)
  rowSubtotals:  boolean,   // add a subtotal row after each row-axis group (default false)
  colSubtotals:  boolean,   // add a subtotal column after each col-axis group (default false)
  rowTotals:     boolean,   // add a grand-total row at the bottom (default false)
  colTotals:     boolean,   // add a grand-total column at the right (default false)
}
```

### Tabular vs compact form

Each axis independently supports two layout modes:

**Tabular form** (`rowTabular: true`, the default):

- Each group level occupies a separate sticky header column (rows) or header row (columns), matching
  the current "multi-column" behaviour.
- Subtotals (when enabled) appear as dedicated rows/columns inserted after each group's leaves.
- Expand/collapse: a toggle button (▼/▶) is placed on every group header cell that spans more than
  one row/column. Collapsing hides all rows/columns of the group except the first (the header
  row/column) and adjusts the cell's `rowSpan`/`colSpan` accordingly.

**Compact form** (`rowTabular: false`):

- All group levels and leaves share a single header column (rows) or header row (columns).
- Each entry is indented by `_compactIndent × 20 px` (rows) or `× 16 px` (columns) so the hierarchy
  is visible.
- Group rows appear **before** their children (unlike tabular subtotal rows which appear after).
- Group rows carry aggregated data: the same aggregate that would be shown in a tabular subtotal
  row. `rowSubtotals` / `colSubtotals` are therefore implicitly forced on in compact mode.
- Dedicated subtotal rows/columns are **not** added in compact mode (the group row already serves
  that role).
- Grand-total rows/columns (when `rowTotals`/`colTotals` is enabled) are still added after all
  groups.
- Expand/collapse: a toggle button (▼/▶) on each group row hides/shows all subsequent rows with a
  deeper `_compactIndent` until the next row at the same or outer indent level.

#### Compact axis data structure

`computeMatrix` post-processes the augmented result via `compactifyAxis`:

```js
FlatRow (compact) = {
  leafElem:       Element | CompactGroupNode | GrandTotalNode,
  groups:         [],          // always empty — no multi-column group headers
  _compactIndent: number,      // 0 = outermost group, N = leaf at depth N
}

CompactGroupNode = {
  _isCompactGroup: true,
  _groupRef:       Element,    // the actual group element (for label + popover)
  id:              string,     // "cg::<groupElem.id>"
}
```

After compactification `rowAxis.numGroupLevels` (or `colAxis.numGroupLevels`) is reset to `0` so
that the renderer knows to use the single-column layout.

### Empty rows / columns

When `showEmptyRows` is `true`, `buildAxis` passes a `showEmpty` flag to `buildTree`. An
intermediate node that resolves no children at the next level is given a **virtual empty-leaf
child** at the deepest active level (`{ _isEmptyLeaf: true, id: "empty::<parentId>" }`) instead of
being pruned or made a direct leaf. This preserves the normal `flattenTree` group-building logic:
all ancestor nodes correctly populate the `groups` array of the empty row, so each group level's
header cell appears in the right column. `nodeLabel` returns `""` for `_isEmptyLeaf` nodes.
`resolveDataItemElements` returns `[]` for them, so all data cells in empty rows are blank.
`showEmptyCols` applies the same logic to the column axis.

### Subtotals and totals

`buildAugmentedMatrix(rowFlatRows, colFlatRows, grid, settings, rowNumGroups, colNumGroups, firstDataItem)`
is called after the regular grid is computed. It:

1. Identifies contiguous groups in `rowFlatRows` / `colFlatRows` at the deepest group level.
2. Builds `rowItems` / `colItems` — ordered lists of `{type: 'leaf'|'subtotal'|'total', ...}`
   entries.
3. Constructs new `flatRows`, `flatCols`, and `grid`:
   - **Leaf × Leaf**: uses the pre-computed grid value directly.
   - **Subtotal/Total × any** (or any × Subtotal/Total): collects all elements in the range via
     `collectAllElems()`, then calls `computeCellValue()` for every (rowElem, colElem) pair and
     aggregates the results with `aggregateValues()`.
4. Calls `recomputeAxisSpans()` to fix rowspan/colspan values.

**`collectAllElems(flatRows, indices, numGroupLevels)`**: for a set of flatRow indices, returns all
unique non-virtual elements — both the **leaf elements** and all **group-level ancestor elements**
at each group level. This ensures that a group element's own data (e.g. relations it participates in
directly) is included in the subtotal/total alongside its children's data.

**`computeCellValue(rowElem, colElem, firstDataItem)`**: mirrors the main grid-computation logic for
a single cell. Handles DataItemNode rows/cols, Element×Element via relations or containment, and
RelNode×RelNode intersection.

**`aggregateValues(vals, dataItem)`**: mode-aware aggregation driven by `dataItem.mode`:

- `count` — sums numeric values; counts non-empty strings when no numeric values present.
- `presence` — `'✓'` if any value is non-empty, otherwise `''`.
- `names` — splits each cell's value by `joinSep`, collects unique names, rejoins.

Subtotal leaf elements carry `_isSubtotal: true`, grand total elements carry `_isGrandTotal: true`.
`nodeLabel()` returns `t('subtotal')` / `t('grandTotal')` for these. The renderer applies
`.table-subtotal` / `.table-total` CSS classes for visual distinction.

Subtotals require at least one group level (`numGroupLevels > 0`); they are silently skipped
otherwise.

## Empty Row / Column Filtering

When at least one **active data item** is configured (`hasCells = true`), rows and columns whose
every cell is the empty string are removed from the axis after the grid is computed but **before**
subtotals/totals augmentation. This ensures:

- Subtotals and grand totals are computed only over visible (non-empty) leaf rows/columns.
- When `showEmptyRows` is on, row filtering is skipped — the user explicitly wants all structural
  row nodes visible regardless of data. Same for `showEmptyCols` and columns.

The filter is a single pass:

1. Remove every row `ri` where `grid[ri].every(v => v === '')`.
2. Remove every column `ci` where `grid[ri][ci] === ''` for all remaining rows `ri`.

When no active data items are configured the filter is skipped and all axis nodes are shown.

### Subtotal exception

When subtotals are enabled for an axis (`rowSubtotals = true` with at least one row group level, or
`colSubtotals = true` with at least one col group level), a group whose leaf rows (or columns) are
all empty must **not** be pruned if the group element itself has data — that data will surface in
the subtotal row (or column) after augmentation.

Concretely, two extra keep-rules are applied before pruning:

- **Row axis, `rowSubtotals` active**: keep row `ri` if any of its ancestor group elements produces
  a non-empty cell with at least one column leaf via
  `computeCellValue(groupElem, colLeaf, firstDataItem)`.
- **Col axis, `rowSubtotals` active**: keep column `ci` if any row group element produces a
  non-empty cell with `colLeaf` — these columns would appear in the (not-yet-built) row subtotal
  rows.
- **Col axis, `colSubtotals` active**: keep column `ci` if any of its ancestor group elements
  produces a non-empty cell with at least one row leaf.
- **Row axis, `colSubtotals` active**: keep row `ri` if any col group element produces a non-empty
  cell with `rowLeaf`.

This guarantees that a group element visible via its subtotal row/column is never incorrectly hidden
just because none of its leaf descendants have direct data.

## Cell Computation

### `rows_data` mode

`colLeaf` is a DataItemNode, `rowLeaf` is a real Element/RelNode:

```js
quals = resolveDataItemElements(colLeaf, rowLeaf);
val = dataItemDisplay(colLeaf, quals);
```

### `cols_data` mode

`rowLeaf` is a DataItemNode, `colLeaf` is a real Element/RelNode:

```js
quals = resolveDataItemElements(rowLeaf, colLeaf);
val = dataItemDisplay(rowLeaf, quals);
```

### `full` mode — Element × Element

Directional check: is `colLeaf` reachable from `rowLeaf` via `firstDataItem`?

```js
fromRow = resolveDataItemElements(firstDataItem, rowLeaf);
quals = fromRow.filter((e) => e.id === colLeaf.id);
val = dataItemDisplay(firstDataItem, quals);
```

`cell(A,B) ≠ cell(B,A)` in general (depends on relation direction configured in the data item). The
matrix is asymmetric.

### `full` mode — RelNode × RelNode

Intersection: elements resolved from `rowLeaf` ∩ elements from `colLeaf`.

```js
fromRow = resolveDataItemElements(firstDataItem, rowLeaf)
fromCol = resolveDataItemElements(firstDataItem, colLeaf)
quals   = fromRow.filter(e => fromCol includes e)
val     = dataItemDisplay(firstDataItem, quals)
```

Since each RelNode resolves to its direction-dependent foreign endpoint:

| rows axis | cols axis | matrix shape                            |
| --------- | --------- | --------------------------------------- |
| out (→)   | out (→)   | symmetric — common targets              |
| in (←)    | in (←)    | symmetric — common sources              |
| out (→)   | in (←)    | asymmetric — `row.target == col.source` |
| in (←)    | out (→)   | asymmetric — `row.source == col.target` |

### `full` mode — mixed (Element × RelNode or RelNode × Element)

Not supported → empty cell.

## Data Item Filter Counts (Builder)

The builder sidebar shows element/relation counts in each data item's filter dropdowns. Counts are
**contextual**: they reflect how many elements of a given type would actually appear in the matrix
cells, given the current row and column axis configuration.

### `getAxisElements(axis)`

Collects all nodes (Elements and RelNodes) across all active levels of an axis, following the same
empty-level-skip logic as `buildAxis`. Used as context for count computation.

### `resolveDataItemIds(dataItem, node, type) → Set<id>`

Mirrors `resolveDataItemElements` but returns a `Set` of element IDs for a single parent node.
Differences from `resolveDataItemElements`:

- **No containment fallback** for Element parents: if no `relationItems` are configured, returns an
  empty set. (Prevents misleading non-zero counts when no relation steps are configured.)
- RelNode parents: same foreign-endpoint + relation-step logic applies.

### `countDataElemType(dataItem, type, rowNodes, colNodes)`

| Axes configured        | Count                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Neither                | Global count of type-T elements in model                                            |
| Rows only              | Union of `resolveDataItemIds` across all row-axis nodes                             |
| Cols only              | Union of `resolveDataItemIds` across all col-axis nodes                             |
| Both (Element×Element) | Count col-axis elements of type T that appear in the row-axis union                 |
| Both (RelNode×RelNode) | Count type-T elements reachable from row-axis nodes ∩ reachable from col-axis nodes |

### `countDataRelType(type, dir, rowNodes, colNodes)`

| Axes configured         | Count                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Neither                 | Global count of matching relations                                                                                                            |
| Both (Element×Element)  | Cross-axis: relations where `source ∈ rowElemIds AND target ∈ colElemIds` (dir=out) or reversed. Out-count = In-count when row set = col set. |
| Either axis is RelNodes | 0 (relation-of-relation not supported)                                                                                                        |
| One Element axis        | Relations incident to that axis's element nodes                                                                                               |

## Builder Sidebar

### Rows and Columns sections

Each section shows a list of level cards. Every level card has:

- **Element types** multi-select dropdown (checkboxes + All/None shortcuts). Shows selected count or
  "All types ▾" when empty.
- **Relation items** multi-select dropdown — relation types with direction (→ Outgoing / ←
  Incoming), checkboxes per type×direction combination. Shows "Filter relations…" placeholder when
  empty.
- **Name filter** text input: substring match applied to node names.
- **Remove** button (always visible; removing the last level leaves an empty placeholder that is
  treated as transparent).

**+ Add level** button: appends a new blank level.

Every change immediately triggers matrix recomputation and re-render. Adding a blank level does not
clear the table.

### Data section

Shows a list of data item cards. Each card has:

- **Name** text input (optional label shown in table/header).
- **Element types** multi-select with contextual counts.
- **Relation items** multi-select with contextual counts.
- **Name filter** text input.
- **Mode** selector: Count / Presence / Names.
- **Join separator** (visible only when mode = Names).
- **Remove** button (always visible).

**+ Data** button: appends a new blank data item.

Contextual counts in data item dropdowns reflect how many elements/relations of each type would
contribute to actual table cells, given the current row and column axis configuration.

## Table Rendering

Table rendered as a standard HTML `<table>` with:

- `<thead>` containing `colHdrRows` rows (one per column group level, plus one leaf row unless leaf
  is hidden).
- `<tbody>` with one `<tr>` per leaf row element.
- Sticky column headers (`position: sticky; top: 0`).
- Sticky row headers (`position: sticky; left: Npx`, position set inline).
- Corner cell spanning all header rows and row-header columns.

### Column header rows

- Rows 0 … `cgLevels-1`: group tiers. For each group's first leaf column, emit `<th colspan=span>`
  with the group element name.
- Row `cgLevels`: leaf column names (omitted when `colLeafHidden`).

### Data rows

For each leaf row element, one `<tr>`:

- For each row group level `g`: if `flatRow.groups[g].first`, emit
  `<th rowspan=span class="table-row-group-{g}">` with the group element name.
- `<th class="table-row-leaf">` with the leaf element name (omitted when `rowLeafHidden`).
- One `<td class="table-cell">` per leaf column.

### Cell click

Click on any `<td>` opens a detail popover listing the qualifying elements or relations at that
intersection (type, name). Click outside or ✕ closes it.

## Functional Requirements

### FR-1: Model Selection

- On startup, fetch the full model list, paginated via `_links.next`.
- Display a modal with model name, type badge, and description. Search by name or type.
- Last-loaded model URL persisted to `localStorage` under `architeezyTableModelUrl`; restored
  automatically on next visit.
- When a new model is loaded the current matrix definition is preserved and re-rendered (types that
  no longer exist produce no rows/columns).

### FR-2: Data Loading

- Loading spinner (full-screen overlay) during fetch.
- **Model list failure**: full-screen error panel with Retry button.
- **Model content failure (no matrix rendered)**: saved URL removed, model selector reopened.
- **Model content failure (matrix visible)**: existing matrix kept; toast shown.

### FR-3: Matrix Templates

Templates are saved per model `contentType` URI in `localStorage` under `architeezyTableTemplates`.
Up to 20 per content type. **Save as template** toolbar button prompts for a name. **Templates ▾**
dropdown lists and applies them (with a new UUID). Toast "Template applied" shown for 4 s.

### FR-4: Save / Load Matrices

Matrices are saved per model namespace URI in `localStorage` under `architeezyTableMatrices`. Max 20
per namespace. **Save** button prompts for a name if unnamed. **Saved ▾** dropdown lists saved
matrices with Load and Delete. Unsaved-changes dot on the Save button.

### FR-5: Export

**↓ CSV**: UTF-8 with BOM, downloads as `{name}-{date}.csv`. **⧉ Copy**: tab-separated, written to
clipboard (Excel / Google Sheets compatible). Both reflect the full matrix including group headers.

### FR-6: URL State

`syncUrl()` encodes model UUID + matrix definition into the address bar via `history.replaceState`:

| Parameter | Value                                           |
| --------- | ----------------------------------------------- |
| `model`   | Model UUID                                      |
| `matrix`  | `btoa(encodeURIComponent(JSON.stringify(def)))` |

On startup `readUrlParams()` decodes both. If `matrix` is present it overrides any
`localStorage`-restored definition, enabling shared deep links.

### FR-7: Themes

Three modes: Dark, Light, System (`prefers-color-scheme`). Switcher: 🌙 ☀️ 🖥 in the header.
Persisted to `localStorage` under `architeezyTheme`. Applied via `data-theme` attribute on `<html>`.

### FR-8: Localisation

Auto-detected from `navigator.language`: Russian if starts with `"ru"`, otherwise English. No manual
switcher. All UI strings via bilingual table in `i18n.js`. `t(key, ...args)` looks up the string;
function-valued entries accept interpolation arguments. `applyLocale()` patches `data-i18n`,
`data-i18n-ph`, `data-i18n-tt` attributes at startup.

### FR-9: Filtering

Each level card has a text filter. Filters apply during axis traversal:

- **Element name filter**: elements whose `name` doesn't match are excluded.
- **Relation name filter**: relations whose `name` (or type as fallback) doesn't match are excluded.

### FR-10: Sorting

`{ by: "label", dir: "asc" | "desc" }` applies to all axis levels. Label = element/node `name`
field.

## Module Structure

| File              | Responsibility                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `js/constants.js` | API base URL, limits                                                                                  |
| `js/state.js`     | Single shared mutable state object                                                                    |
| `js/i18n.js`      | Language detection, bilingual string table, `t()`, `applyLocale()`                                    |
| `js/utils.js`     | `isUUID`, `hashStr`, `elemColor`, `relColor`, `escHtml`, `modelTypeLabel`, `modelContentUrl`          |
| `js/auth.js`      | In-memory token, `apiFetch`, `startAuth`, `signOut`, `fetchCurrentUser`                               |
| `js/models.js`    | `fetchModelList`, model selector modal, `filterModelList`                                             |
| `js/parser.js`    | `parseModel` — universal structural EMF/HAL parser, populates state                                   |
| `js/matrix.js`    | `createDef`, `cloneDef`, `normalizeDef`, `isDefReady`, `blankLevel`, `blankDataItem`, `blankSettings` |
| `js/compute.js`   | `computeMatrix`, `nodeLabel`, `getAxisElements`, `buildAxisContexts`                                  |
| `js/builder.js`   | Builder sidebar DOM: level cards, data item cards, dropdowns, counts                                  |
| `js/table.js`     | Table DOM rendering: N-level headers, sticky cells, cell popover                                      |
| `js/storage.js`   | `getSavedMatrices`, `saveMatrix`, `deleteMatrix`, `getTemplates`, `saveTemplate`, `deleteTemplate`    |
| `js/export.js`    | `exportCsv`, `copyToClipboard`                                                                        |
| `js/ui.js`        | `showLoading`, `hideLoading`, `showError`, `showToast`, `hideToast`, `setTheme`                       |
| `js/routing.js`   | `syncUrl`, `readUrlParams`                                                                            |
| `js/app.js`       | Entry point: `init`, `loadModel`, `rebuild`, toolbar actions, window globals                          |

### Import graph (acyclic)

```text
constants ← utils ← auth ← models
state ─────────────────────────────→ parser
                                  ↘ compute ← builder
                                  ↘ compute ← table
matrix ← compute
matrix ← builder
matrix ← table
storage ← (state, constants)
export
ui ← (state)
routing ← (state)
app ← (all of the above)
i18n (no imports)
```

## Migration

`normalizeDef(def)` handles three legacy formats:

1. **Top-level `rowLevels` / `colLevels`** (very old format).
2. **Kind-based levels** inside `rowAxis` / `colAxis` — alternating `{ kind: "object" }` and
   `{ kind: "relation" }` levels. Each `(relation, object)` pair is merged into a single unified
   level.
3. **Single `def.cell`** (old `CellConfig`) → converted to `def.cells[0]` (DataItem). Relation types
   and direction become `relationItems`; mode is mapped to the new values.
