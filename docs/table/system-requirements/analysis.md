# SR-3: Analysis

## Scenarios

### SR-3.1: Matrix Computation

The system computes the complete matrix based on row axis, column axis, and data item definitions.

#### Functional Requirements

- [FR-2.1](../functional-requirements.md#fr-2-builder): Construct matrix axes using multi-level
  hierarchical definitions.
- [FR-3.1](../functional-requirements.md#fr-3-analysis): Render matrices with optional sticky
  headers for row and column axes.
- [FR-4.1](../functional-requirements.md#fr-4-export): Export the matrix to CSV format.

#### User Story

As a user, I want to see a matrix where rows represent a hierarchy of entities, columns represent
another hierarchy, and cells show data derived from relationships between them.

#### Preconditions

- A model is loaded.
- Row axis and/or column axis have at least one active level (non-blank).
- At least one data item is defined (required for `rows_data` and `cols_data` modes; optional for
  `full` mode but provides cell values).

#### Steps

1. The system invokes `computeMatrix(def)`.
2. Row axis is built via `buildAxis(def.rowAxis, state)`.
   - Each level resolves nodes from its parent set using element types and relation items.
   - A hierarchical tree is constructed and flattened into `flatRows` with group information.
3. Column axis is built similarly via `buildAxis(def.colAxis, state)`.
4. Grid is computed based on layout mode:
   - **`full`** (both axes have levels): `grid[ri][ci]` = data item value for `(rowLeaf, colLeaf)`
     pair.
   - **`rows_data`** (only rows have levels): Data items become virtual columns; each data item
     defines what to show.
   - **`cols_data`** (only cols have levels): Data items become virtual rows.
5. If settings request subtotals or totals, `buildAugmentedMatrix` extends the grid with subtotal
   rows/columns and grand totals.
6. The table renderer receives the result and generates HTML with sticky headers.

#### Edge Cases

- **Empty Axes**: If both axes have no active levels, the table shows an empty state.
- **No Data Items in Full Mode**: If both axes are configured but no data item is active, cell
  values are empty strings (the matrix structure exists but without content).
- **Very Deep Hierarchy**: The system supports arbitrary nesting depth. Browser rendering may become
  slow with 10+ group levels (performance degrades).
- **Large Grid**: For a 1000×1000 matrix, computation should complete within 500ms.

### SR-3.2: Axis Resolution

The system resolves hierarchical axes from the model graph.

#### Functional Requirements

- [FR-2.1](../functional-requirements.md#fr-2-builder): Construct matrix axes using multi-level
  hierarchical definitions.
- [FR-4.2](../functional-requirements.md#fr-4-export): Copy matrix data to the clipboard for
  compatibility with spreadsheet applications.

#### User Story

As a user, I want my matrix rows and columns to reflect the containment and relationship structure
of the model, with multiple levels of grouping.

#### Steps

1. Define an axis with multiple levels in the builder.
   - Level 0: "Application" element types.
   - Level 1: "contains" outgoing relationship + "Service" element types.
   - Level 2: "dependsOn" outgoing relationship + "Database" element types.
2. The system resolves:
   - Level 0: All Applications.
   - Level 1: For each Application, follow `dependsOn` relations to reach Services, filter by type.
   - Level 2: For each Service, follow `dependsOn` to reach Databases, filter by type.
3. The table renders with three group header columns (or rows in compact mode), showing the
   containment hierarchy.

#### Edge Cases

- **Missing Intermediate Nodes**: If a level selects relationships but the parent node has no such
  relationships, that branch ends. The parent may still appear as a leaf if it is at the deepest
  active level and has no children.
- **Cycles**: The model graph should be acyclic by design (EMF containment). The resolution
  algorithm does not detect cycles; infinite loops would be catastrophic. Assumes well-formed model.
- **Blank Level**: A level with no types or relations is skipped; it does not contribute to the
  hierarchy depth (`numGroupLevels` counts only active levels).
- **Hidden Level**: A level with `hidden: true` still participates in traversal but its header cells
  are not rendered. This is useful for intermediate navigation steps that should not clutter the
  display.

### SR-3.3: Cell Computation Modes

The system computes cell values differently based on the layout mode and data item configuration.

#### Functional Requirements

- [FR-2.6](../functional-requirements.md#fr-2-builder): Configure cell content to display presence,
  counts, or entity names.
- [FR-3.7](../functional-requirements.md#fr-3-analysis): Support drill-down from cells to underlying
  entities or relationships.

#### User Story

As a user, I want to control what data appears in each cell—whether it's a count of relationships, a
checkmark indicating existence, or a list of entity names.

#### Steps (Full Mode)

1. Configure rows axis to show "Applications".
2. Configure columns axis to show "Databases".
3. Configure first data item with:
   - Element types: "Service"
   - Relation items: `→ uses` (outgoing)
4. The system computes cell `(app, db)` as:
   - Resolve elements reachable from `app` via `uses` → get Services.
   - From those Services, check if `db` is reachable (i.e., any Service uses that Database).
   - If `mode="count"`: count of Services that connect app to db.
   - If `mode="presence"`: "✓" if count > 0.
   - If `mode="names"`: comma-separated Service names.

#### Steps (Rows Data Mode)

1. Configure rows axis to show "Applications".
2. Do not configure columns axis (leave empty).
3. Configure multiple data items:
   - Item 1: Element types "Service" → shows number of Services per Application.
   - Item 2: Element types "Database" → shows number of Databases per Application.
4. The table renders with Application as row headers and two data columns (Service Count, Database
   Count).

#### Edge Cases

- **RelNode × RelNode**: In `full` mode with RelNodes on both axes, the cell computes intersection
  of element sets reachable from each side. Direction matters:
  - `out` × `out`: intersection of target sets (common targets).
  - `out` × `in`: target of row matches source of column.
  - `in` × `out`: source of row matches target of column.
  - `in` × `in`: intersection of source sets (common sources).
- **Mixed Axis Types**: Element × RelNode or RelNode × Element is not supported in `full` mode
  (empty cell).
- **Containment Fallback**: In `resolveDataItemElements`, when navigating from an Element and no
  `relationItems` are configured, the system falls back to containment (children with matching
  `parent`). This fallback is NOT used for data item counts in the builder to avoid misleading
  previews.

### SR-3.4: Subtotals and Totals

The system can augment the matrix with subtotal and grand total rows/columns.

#### Functional Requirements

- [FR-3.4](../functional-requirements.md#fr-3-analysis): Display subtotals and grand totals for
  hierarchical groups.
- [FR-3.5](../functional-requirements.md#fr-3-analysis): Manage expandable and collapsible
  hierarchical groups.

#### User Story

As a user, I want to see aggregated values at group boundaries and overall summaries to understand
roll-up metrics.

#### Preconditions

- At least one axis has `numGroupLevels > 0` (at least one non-hidden active level that is not the
  leaf level).
- At least one data item is active.
- Subtotals/totals are enabled in settings.

#### Steps

1. Enable "Row subtotals" in settings.
   - After each row group (at the deepest group level), a subtotal row is inserted.
2. Enable "Column subtotals".
   - After each column group, a subtotal column is inserted.
3. Enable "Row totals" and/or "Column totals".
   - Grand total row appears at the bottom; grand total column at the right.

The system computes subtotal/total cells by:

- Collecting all leaf elements belonging to the group (or all leaves for grand total).
- Including the group element's own participation in relationships (not just its descendants).
- Calling `computeCellValue` for each `(groupOrTotalElem, colOrTotalElem)` pair using the first data
  item's rules.
- Aggregating results by data item mode (sum for count, any for presence, union+join for names).

#### Edge Cases

- **Empty Groups with Subtotals**: When `showEmptyRows=false` and a group's leaf rows are all empty,
  the group would normally be pruned. But if `rowSubtotals=true` and the group element itself has
  data that would appear in the subtotal row, the group must be kept. The system applies special
  keep-rules before empty filtering to preserve such groups.
- **Compact Mode**: In compact mode, subtotal rows/columns are not added as separate entries.
  Instead, group rows themselves carry the aggregated data. The `rowSubtotals`/`colSubtotals`
  setting is implicitly considered enabled in compact mode.
- **No Group Levels**: If `numGroupLevels == 0`, subtotals are silently ignored (there is no
  grouping to subtotal over).
- **Grand Total Position**: Grand totals appear after all groups, as the last row/column. They
  aggregate over all visible leaves.

### SR-3.5: Empty Filtering

The system removes rows and columns that have no data in any cell, unless the user explicitly
requests to show all structural nodes.

#### Functional Requirements

- [FR-3.3](../functional-requirements.md#fr-3-analysis): Toggle the visibility of empty rows and
  columns for gap analysis.

#### User Story

As a user, I want to hide rows and columns that contain no data to focus on meaningful
intersections, or show all structural nodes for gap analysis.

#### Preconditions

- At least one data item is active (otherwise empty filtering is skipped).

#### Steps

1. By default (`showEmptyRows=false`, `showEmptyCols=false`), the system removes any row where every
   cell is empty, and any column where every cell is empty.
   - This happens after grid computation but before subtotal/total augmentation.
2. Enable "Show empty rows".
   - Structural nodes with no leaf data are preserved. Their cells remain empty.
3. Enable "Show empty columns".
   - Similarly preserves empty column groups.

#### Edge Cases

- **Subtotal Preservation**: When subtotals are enabled, a group whose leaf rows are all empty may
  still need to be kept if the group element itself has data that would appear in the subtotal row.
  The empty filtering logic includes extra keep-rules for this case before pruning.
- **Both Axes Empty**: If both axes evaluate to no nodes after filtering, the table shows an empty
  state (not an error).
- **Data Item Activation**: Empty filtering only applies when at least one data item is configured.
  If there are no data items, all axis nodes are shown (even if they produce no cell content).

### SR-3.6: Expand and Collapse Groups

The system allows users to collapse and expand hierarchical groups in the table.

#### Functional Requirements

- [FR-3.5](../functional-requirements.md#fr-3-analysis): Manage expandable and collapsible
  hierarchical groups.

#### User Story

As a user, I want to collapse groups to simplify the view and expand them to see details, without
losing my place.

#### Preconditions

- In tabular mode: A group header cell has `rowSpan > 1` (or `colSpan > 1` for column groups).
- In compact mode: A group row has children with greater indent.

#### Steps (Tabular Mode)

1. Click the group header cell (e.g., a `<th>` spanning multiple rows).
   - A toggle button (▼/▶) appears on the header.
2. Click the header or the toggle button.
   - The group collapses: all rows except the first are hidden with an opacity animation; header's
     `rowSpan` reduces to 1; descendant group headers are set to `rowSpan=1` to avoid overflow.
   - The toggle button changes to ▶.
3. Click again to expand.
   - All hidden rows become visible with fade-in; `rowSpan` and descendant spans are restored;
     original cell content in the first row is restored (subtotal values replaced with leaf values).

#### Steps (Compact Mode)

1. Click a group row (indented with a toggle button).
   - All subsequent rows with a deeper indent level are hidden/shown.
   - The toggle button toggles between ▼ and ▶.
2. Collapse does not affect sibling groups at the same indent level.

#### Edge Cases

- **Ancestor RowSpans**: Collapsing an outer group must adjust the `rowSpan` of inner group headers
  in the first visible row. The system recomputes ancestor spans on every toggle.
- **Subtotal Restoration**: In tabular mode, when a group is collapsed, the first row's leaf cell
  content is replaced with the subtotal values (if subtotals are enabled). When expanded, the
  original leaf content is restored from a snapshot.
- **Animation**: Hiding/showing uses 150ms opacity transitions. The `rowSpan` adjustment happens
  after the animation completes to avoid layout jitter.
- **State Persistence**: Collapse state is NOT persisted across definition changes or reloads. It is
  purely in-session.

### SR-3.7: Cell Popover

The system displays a popover with details when a table cell is clicked.

#### Functional Requirements

- [FR-3.7](../functional-requirements.md#fr-3-analysis): Support drill-down from cells to underlying
  entities or relationships.

#### User Story

As a user, I want to click on a cell to see which specific entities or relationships contribute to
that cell's value.

#### Preconditions

- The cell corresponds to a row element × column element intersection.
- The cell has qualifying elements or relationships (the popover shows meaningful content).

#### Steps

1. Click on a data cell (`<td>`).
   - The system looks up the qualifier index (`qualIdx`) for that `(rowElem, colElem)` pair.
   - If the data item mode resolves to elements, qualifiers are Element objects; if it resolves to
     relations (legacy), qualifiers are Relation objects.
2. A popover appears above the cell showing:
   - Title: `Row Entity × Column Entity`.
   - List of qualifying items with type badges and optional names.
3. Click outside or the ✕ button to close the popover.

#### Edge Cases

- **Empty Cell**: If no qualifiers exist, the popover shows "No relationships".
- **Popover Positioning**: The popover is centered horizontally relative to the cell, with a small
  gap. It is constrained to stay within viewport bounds.
- **Multiple Clicks**: Clicking another cell closes the current popover and opens a new one.
- **Scroll**: The popover is positioned absolutely relative to the viewport; scrolling the table
  does not move the popover (it may become misaligned). The system does not track scroll to
  reposition—the popover is transient.

## Business Rules

- **Mode Determination**:
  - `full`: both rowAxis and colAxis have at least one active (non-blank) level.
  - `rows_data`: rowAxis active, colAxis empty.
  - `cols_data`: rowAxis empty, colAxis active.
  - `rows_only`: rowAxis active, colAxis empty, and no active data items (just list rows).
  - `cols_only`: colAxis active, rowAxis empty, and no active data items.
- **Traversal Order**: Level resolution respects the order in the builder. The parent set for level
  `i` is exactly the nodes produced by level `i-1` (after filtering).
- **Empty Leaf Handling**: When a non-leaf level produces no children for a parent, that parent may
  become a leaf at the deepest active level. If `showEmpty*` is false AND all cells in that
  row/column will be empty AND no subtotal needs it, it gets pruned.
- **Subtotal Aggregation**: The aggregation function is mode-dependent:
  - `count`: sum of numeric values; if no numeric values, count of non-empty strings.
  - `presence`: '✓' if any value is non-empty, else ''.
  - `names`: split each string by `joinSep`, collect unique names across all cells, rejoin.
- **Cell Caching**: The computed `grid` is a 2D array of display strings. It is NOT memoized across
  definition changes; each `computeMatrix` call produces a fresh grid.
- **Sticky Headers**: The renderer sets `position: sticky` on header cells. For row headers, `left`
  style is set inline per column offset. For column headers, `top` is handled via CSS `top: 0` for
  the entire `thead`.
- **Virtual Scrolling**: Not implemented. Tables with >10,000 rows may cause performance issues;
  user is expected to filter to a manageable size.

## UI/UX Functional Details

- **Table Structure**:
  - Tabular mode: Group header rows/columns with `rowSpan`/`colSpan`; leaf headers; data cells.
  - Compact mode: Single header row/column with indentation; group rows (not separate headers).
- **Group Toggle**: In tabular mode, a toggle button (▼/▶) is added to any group header cell with
  `rowSpan > 1` (or `colSpan > 1`). The button has `aria-label` for accessibility.
- **Subtotal Styling**: Subtotals get `.table-subtotal` CSS class; grand totals get `.table-total`.
  They are visually distinct (e.g., bold, background).
- **Empty Row Styling**: When a row is structurally empty (all cells blank), it may still appear if
  `showEmptyRows` is true. The cells have the `has-value` class only when the displayed value is
  non-empty.
- **Cell Popover**: The popover is absolutely positioned, has a close button, and closes on outside
  click. It shows type badges with color coding matching the graph legend.
- **Loading**: A full-table overlay spinner is shown during initial model load. During matrix
  recomputation (triggered by builder changes), the table is cleared or shows a loading indicator
  only if computation exceeds 200ms.

## Technical Notes

- **computeMatrix Pipeline**:
  1. `buildAxis(axis, state)` → `{ flatRows, numGroupLevels, leafHidden }`
  2. `buildAugmentedMatrix(...)` if subtotals/totals requested.
  3. `compactifyAxis(...)` if tabular mode is false.
- **buildAxis** calls `buildTree(levels, parentNodes, 0)` which recursively resolves nodes and
  builds parent-child relationships. The tree is then flattened by `flattenTree` into `flatRows`
  with group cell information.
- **Cell Computation** (`computeGrid`):
  - For `full` mode: calls `resolveDataItemElements` from row leaf to get candidate elements,
    filters by membership in column leaf set.
  - For `rows_data`: each data item becomes a column; resolve from row leaf and display.
  - For `cols_data`: each data item becomes a row.
- **Subtotal Augmentation**:
  - `buildAugmentedMatrix` first scans `flatRows` and `flatCols` to identify group boundaries at the
    deepest level.
  - Builds `rowItems` and `colItems` arrays mixing `type: 'leaf'`, `'subtotal'`, `'total'`.
  - Constructs new `flatRows`, `flatCols`, and `grid` by walking the item arrays and computing
    aggregated cells.
  - Calls `recomputeAxisSpans` to fix `rowSpan`/`colSpan` values on group headers.
- **Contextual Counts in Builder**: `resolveDataItemIds` mirrors `resolveDataItemElements` but
  returns a Set of IDs (for counting) and does NOT fall back to containment for Element parents (to
  avoid false positives when no relation steps are configured).
- **URL Sync**: The complete matrix definition (including axis levels, data items, settings) is
  encoded into the URL's `matrix` parameter via `btoa(encodeURIComponent(JSON.stringify(def)))`. The
  system uses `replaceState` on every change to keep the URL current.
