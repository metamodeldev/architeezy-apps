# SR-2: Builder

## Scenarios

### SR-2.1: Axis Construction

The system allows constructing row and column axes using hierarchical levels with flexible
navigation rules.

#### Functional Requirements

- [FR-2.1](../functional-requirements.md#fr-2-builder): Construct matrix axes using multi-level
  hierarchical definitions.
- [FR-2.2](../functional-requirements.md#fr-2-builder): Support multi-hop relationship traversal
  across architectural layers.
- [FR-2.3](../functional-requirements.md#fr-2-builder): Specify relationship traversal direction
  (incoming or outgoing) for each level.

#### User Story

As a user, I want to define what appears on the rows and columns of my matrix by specifying which
entity types and relationships to follow.

#### Preconditions

- A model is loaded and the Table view is active.
- The builder sidebar is visible (can be toggled collapsed).

#### Steps

1. Add a level to the Rows section.
   - Click the "+ Add level" button.
   - A new level card appears with an element types dropdown and a relationship items dropdown.
2. Select entity types in the level's element types filter.
   - Check the desired types from the list (shows available counts).
   - The level header updates to show selected types.
3. Add relationship traversal to the level.
   - In the relationship items dropdown, check "→ RelationshipType" for outgoing or "←
     RelationshipType" for incoming.
   - The level will follow these relationships from parent nodes to reach child nodes.
4. Add another level to build hierarchy.
   - The second level's element types will be filtered to only those that are children (by
     containment) or connected via the previous level's relationships.
5. Repeat for Columns section.
   - Define an independent hierarchy for column headers.

#### Edge Cases

- **Blank Level**: Adding a level with no types or relationships selected does not affect the matrix
  (transparent level). The level can be left in place for future configuration without clearing the
  table.
- **Level Reordering**: Levels are processed in order from top to bottom. The hierarchy reflects the
  order of levels in the builder.
- **Hidden Level**: Setting a level's "hidden" flag removes its header cells from the table display
  but still uses it for traversal logic (useful for intermediate navigation without display).

### SR-2.2: Data Item Configuration

The system allows defining what data to display in each table cell.

#### Functional Requirements

- [FR-2.6](../functional-requirements.md#fr-2-builder): Configure cell content to display presence,
  counts, or entity names.

#### User Story

As a user, I want to specify what information appears in the matrix cells—whether to count
relationships, check for presence, or list entity names.

#### Preconditions

- At least one active row or column axis is defined (otherwise data items have no context).

#### Steps

1. Add a data item in the Data section.
   - Click the "+ Data" button.
   - A new data item card appears with element types, relationship items, mode selector, and name
     input.
2. Configure the data item's navigation.
   - Select element types and/or relationship items to determine which entities to resolve from each
     row/column intersection.
   - The contextual counts show how many elements would be found given the current row and column
     configurations.
3. Choose the display mode.
   - **Count**: Shows the number of resolved entities (default).
   - **Presence**: Shows "✓" if any entities are resolved, blank otherwise.
   - **Names**: Shows a comma-separated list of entity names (configurable separator).
4. Optionally provide a custom name.
   - The name appears as a column header in `rows_data` mode or row header in `cols_data` mode.

#### Edge Cases

- **No Navigation**: If neither element types nor relationship items are selected, the data item is
  considered inactive and ignored in layout mode determination.
- **Contextual Counts Inaccurate**: When both rows and columns are configured, counts reflect the
  intersection logic (elements reachable from row that also appear in column set), which may differ
  from global counts.
- **Mode Inheritance**: The first active data item is used for cell computation in `full` mode
  (rows×columns).

### SR-2.3: Name Filtering

The system allows filtering nodes by name at each level of the axis hierarchy.

#### Functional Requirements

- [FR-2.4](../functional-requirements.md#fr-2-builder): Filter entities by name within each level of
  the axis hierarchy.

#### User Story

As a user, I want to narrow down the nodes at a particular level by typing a substring that matches
their names.

#### Steps

1. In a level card, enter text into the filter input field.
   - The list of entity and relationship types below updates to show only those whose labels contain
     the typed text (case-insensitive).
2. Select types from the filtered list.
   - Only matching types are shown, but counts still reflect the full available set.
3. Clear the filter.
   - The full list of types reappears.

#### Edge Cases

- **Empty Filter**: When the filter is empty and "Show all" is unchecked, the list shows only types
  that have a non-zero count (hiding unavailable types).
- **Show All**: Checking "Show all" displays every type in the model regardless of count, even those
  with zero available elements.

### SR-2.4: Settings Management

The system provides global display settings that affect table rendering.

#### Functional Requirements

Settings toggles in the builder control:

- Tabular vs. compact layout for rows and columns
- Visibility of empty rows and columns
- Subtotal and grand total display

#### User Story

As a user, I want to control how the matrix is presented—whether as a traditional multi-column table
or an indented hierarchy, and whether to show summary rows and empty structural nodes.

#### Steps

1. Open the Settings section in the builder sidebar.
2. Toggle "Row tabular form" or "Column tabular form".
   - When enabled (default), each group level gets its own header column/row.
   - When disabled, all levels share a single header column/row with indentation (compact mode).
3. Toggle "Show empty rows" or "Show empty columns".
   - When enabled, structural nodes with no leaf children (or all-empty cells) are preserved in the
     table.
4. Toggle "Row subtotals", "Column subtotals", "Row totals", or "Column totals".
   - Subtotals appear after each group (only in tabular mode or as group rows in compact mode).
   - Grand totals appear at the end of the axis.

#### Edge Cases

- **Compact Mode Override**: In compact mode, subtotals are implicitly enabled and the dedicated
  subtotal rows/columns are not added (the group rows serve that role).
- **Subtotal Preconditions**: Subtotals require at least one group level (`numGroupLevels > 0`).
  They are silently skipped if no grouping exists.

### SR-2.5: Builder State Synchronization

The system keeps the builder UI, the matrix definition, and the URL in sync at all times.

#### Functional Requirements

- [FR-1.2](../functional-requirements.md#fr-1-models): Synchronize the matrix configuration with URL
  parameters for sharing.

#### User Story

As a user, I want my matrix configuration to be shareable via URL and restored correctly when
reopening the app.

#### Steps

1. Change any builder setting (add level, select types, toggle mode).
   - The matrix definition updates immediately.
   - The URL is synchronized using `history.replaceState` with the base64-encoded definition.
   - The table re-renders to reflect the change.
2. Copy the URL from the address bar.
3. Open the URL in a new tab or share with a colleague.
   - The application loads the model and applies the exact matrix configuration from the URL.
4. Modify the matrix after loading from URL.
   - The new changes overwrite the URL; the original shared configuration is no longer present
     unless the user manually reverts.

#### Edge Cases

- **URL Size Limits**: Very complex matrices with many levels and data items can produce large URLs.
  The system should handle typical use cases (<10 levels, <5 data items) gracefully. Extremely long
  URLs may be rejected by browsers or servers.
- **Invalid Definition**: If the URL contains a corrupted matrix parameter, the system falls back to
  a blank matrix definition and shows an error toast.
- **Storage vs URL**: URL parameters take precedence over persisted state in localStorage on
  startup.

## Business Rules

- **Level Processing Order**: Levels are traversed in order from first to last. The first level
  resolves from the root; each subsequent level resolves from the nodes produced by the previous
  level.
- **Blank Level Transparency**: A level with no `elementTypes` and no `relationItems` is completely
  ignored during axis building—as if it did not exist. Adding a blank level does not clear the
  table.
- **Parent-Child Containment**: When resolving from Element parent nodes with no `relationItems`,
  the system falls back to containment: elements whose `parent` field equals the parent element's
  ID.
- **Relation Directions**:
  - `dir: "out"` means the relation's source is in the parent set; we follow to the target.
  - `dir: "in"` means the relation's target is in the parent set; we follow to the source.
- **RelNode Navigation**: When a level produces RelNodes (from previous level's relation items), the
  next level's `elementTypes` resolve to the foreign endpoint of each RelNode (direction-dependent).
  `relationItems` on RelNode parents are currently unsupported (no further navigation from relations
  to other relations).
- **Data Item First**: In `full` mode (both axes configured with at least one active level), only
  the **first** active data item is used for cell computation. Additional data items are ignored in
  this mode (they would produce extra virtual rows/columns in `rows_data`/`cols_data` modes).
- **Collapse State**: Level and data item cards start collapsed on page load. Collapse state is
  stored in a `WeakMap` keyed by the card object, so it survives re-renders but is cleared when the
  card is removed.

## UI/UX Functional Details

- **Sidebar Toggle**: The builder sidebar can be collapsed/expanded via a toggle button (‹ / ›) to
  maximize table viewing area.
- **Section Collapse**: Each builder section (Rows, Columns, Data, Settings) has a collapsible
  header. Collapsed sections show only the header bar.
- **Count Badges**: Every type in the dropdown shows an available count. For level element types,
  the count is the number of elements of that type that would appear at that level given current
  parent nodes. For data items, counts are contextual (see SR-2.2).
- **Empty State**: If no elements match a level's selection, the table shows an empty state message.
- **Remove Button**: Every level and data item has a permanent remove button (✕). Removing the last
  level leaves a blank placeholder (transparent, not fatal).
- **Feedback**: Changes trigger immediate recomputation. If computation exceeds 200ms, a loading
  indicator is shown.
- **Dirty Indicator**: An unsaved-changes indicator (dot) appears on the Save button when the matrix
  definition has unsaved changes.

## Technical Notes

- **Builder Initialization**: `initBuilder(onDefChange)` sets the callback that is invoked on any
  definition change. `renderBuilder(def)` renders all sections based on the current definition.
- **Level Card Structure**:

  ```js
  {
    elementTypes: string[],           // selected entity type names
    relationItems: [{ type, dir }],  // selected relation types with direction
    filter: string,                  // name substring filter
    hidden: boolean                  // omit from table display
  }
  ```

- **Data Item Card Structure**:

  ```js
  {
    id: string,           // UUID
    name: string,         // optional custom label
    elementTypes: string[],
    relationItems: [{ type, dir }],
    filter: string,
    mode: "count" | "presence" | "names",
    joinSep: string       // separator for names mode (default ", ")
  }
  ```

- **Count Computation**: `countElemType` and `countRelType` compute available counts for level
  dropdowns. `countDataElemType` and `countDataRelType` compute contextual counts for data item
  dropdowns based on current row/column axis nodes. These functions mirror the actual resolution
  logic to provide accurate previews.
- **Change Propagation**: Any modification to the definition calls `notifyChange()` which re-renders
  the builder axis sections (to update counts and labels), the data section, and then invokes
  `_onDefChange` to trigger matrix recomputation and URL sync.
- **Performance**: Builder interactions must remain responsive (<100ms) even for large models. Count
  queries are O(n) over the relevant state sets but are optimized with caching where possible.
