# SR-3: Filtering System

**Functional Requirements**:
[FR-3.1, FR-3.2, FR-3.3, FR-3.4](../functional-requirements.md#fr-3-filtering-system)

## User Story

As a user, I want to show/hide elements and relationships by type, search within filter lists, have
my filter choices remembered across sessions, and share views with specific filters applied via URL.

## Acceptance Criteria

- [SR-3.1](#sr-31-element-and-relationship-types-are-displayed-with-counts-and-selection-controls):
  Element and relationship types are displayed with counts and selection controls
- [SR-3.2](#sr-32-search-inputs-can-filter-the-type-lists): Search inputs can filter the type lists
- [SR-3.3](#sr-33-bulk-selection-controls-for-select-all-and-select-none-are-available): Bulk
  selection controls for "select all" and "select none" are available
- [SR-3.4](#sr-34-changing-filter-settings-updates-the-graph-and-table-views-accordingly): Changing
  filter settings updates the graph and table views accordingly
- [SR-3.5](#sr-35-count-badges-show-visibletotal-counts): Count badges show visible/total counts
- [SR-3.6](#sr-36-filter-state-persists-to-browser-storage-per-model): Filter state persists to
  browser storage per model
- [SR-3.7](#sr-37-url-parameters-can-encode-active-filter-types-for-sharing): URL parameters can
  encode active filter types for sharing

## Scenarios

### SR-3.1: Element and relationship types are displayed with counts and selection controls

#### Preconditions

- Model is loaded with multiple element types (e.g., components, services, databases) and
  relationship types (e.g., flows, dependencies, ownership)
- Sidebar is open and filter panels are visible
- All types are checked

#### Steps

1. **View Entities Filter Panel**
   - User opens the sidebar
   - Entities filter list shows each element type with a color indicator, name, and count
   - All checkboxes are checked
   - Count reflects total elements per type

2. **View Relationships Filter Panel**
   - Relationships filter list shows each relationship type with a color indicator, name, and count
   - All checkboxes are checked
   - Count reflects total relationships per type

3. **Toggle a Checkbox**
   - User unchecks an element type (e.g., "Database")
   - Checkbox state changes to unchecked
   - The change is immediately reflected in the graph

#### Edge Cases

- **Type with zero elements** — only types present in the model appear in the filter list; items
  with zero count are dimmed or hidden

### SR-3.2: Search inputs can filter the type lists

#### Preconditions

- Model is loaded with multiple element types
- Filter panel is visible with all types listed
- Search input is empty

#### Steps

1. **Type Search Text**
   - User types search text into the Entities search field
   - The list filters in real-time
   - Only types containing the search text remain visible in the list

2. **Verify Hidden Items Retain State**
   - Non-matching items are hidden from the list
   - Their checkbox states are preserved and unaffected by the search

3. **Clear the Search**
   - User clears the search input
   - All types are visible again with their previous checkbox states intact

#### Edge Cases

- **Many types (50+)** — search filter helps find specific types; scrolling remains manageable

### SR-3.3: Bulk selection controls for "select all" and "select none" are available

#### Preconditions

- Model is loaded
- Filter panel is visible
- Some types are checked and some are unchecked

#### Steps

1. **Select All**
   - User clicks the "Select all" button above the Entities section
   - All visible types in the list become checked
   - Graph shows all elements and edges

2. **Select None**
   - User clicks the "Select none" button
   - All types are unchecked
   - Graph becomes empty (except for drill root if drill mode is active)
   - Count badges show zero visible

3. **Verify Relationship Types Bulk Controls**
   - User clicks "Select all" in the Relationships section
   - All relationship types become checked
   - User clicks "Select none" in the Relationships section
   - All relationship types become unchecked and edges disappear

#### Edge Cases

- **Drill mode active** — drill root remains visible when all types are deselected; counts show
  visible over total where visible accounts for both filter and drill scope

### SR-3.4: Changing filter settings updates the graph and table views accordingly

#### Preconditions

- Model is loaded with multiple element and relationship types
- Graph displays all elements and relationships
- All checkboxes are checked

#### Steps

1. **Filter an Element Type**
   - User unchecks an element type (e.g., "Database") in the Entities filter
   - All elements of that type disappear from the graph immediately
   - Edges incident to those elements also disappear
   - If table view is visible, its rows update to exclude the filtered type

2. **Filter a Relationship Type**
   - User unchecks a relationship type (e.g., "Depends") in the Relationships filter
   - All edges of that type disappear, provided their endpoints are still visible
   - Graph updates immediately
   - Note: Containment edges bypass relationship type filters and remain visible if their endpoints
     are visible

3. **Re-enable a Type**
   - User re-checks the previously unchecked type
   - Elements and edges of that type reappear in the graph
   - Graph, table (if visible), and count badges all update in sync with no visual flicker

#### Edge Cases

- **Rapid filter changes** — each change applies immediately; performance adequate for typical
  models

### SR-3.5: Count badges show visible/total counts

#### Preconditions

- Model is loaded
- Filter panel is visible with count badges shown
- All types are active

#### Steps

1. **View Initial Count**
   - User sees count badges showing total counts (single number when all are visible)
   - Badges appear for both element types and relationship types

2. **Filter to Reduce Visible Items**
   - User unchecks one or more element types
   - Count badges update immediately to show "visible / total" format
   - Relationship counts also update to reflect reduced edge visibility

3. **Verify Drill Mode Interaction**
   - User activates drill mode
   - Count badges update to reflect the intersection of element type filter and drill scope

#### Edge Cases

- **Drill mode active** — counts show visible over total where visible accounts for both filter and
  drill scope

### SR-3.6: Filter state persists to browser storage per model

#### Preconditions

- Model is loaded
- User has previously changed filter settings (some types unchecked)
- Browser storage is available

#### Steps

1. **Observe Current Filter State**
   - User sees specific types unchecked in the filter panel
   - Graph reflects the filtered state

2. **Refresh the Page**
   - User refreshes the browser
   - App loads and reads filter state from browser storage (isolated per model)
   - Checkboxes restore to the previous settings
   - Graph reflects the same filtered view as before

3. **Verify Model Isolation**
   - User loads a different model
   - Filter state is independent from the first model's saved state
   - Each model's filter preferences are stored separately

#### Edge Cases

- **Browser storage full or disabled** — filter state may not persist but application continues
  without crashing
- **Corrupted data in browser storage** — falls back to default state (all types visible)

### SR-3.7: URL parameters can encode active filter types for sharing

#### Preconditions

- Model is loaded
- Some element or relationship types are currently filtered out

#### Steps

1. **Observe URL Update on Filter Change**
   - User toggles a filter checkbox
   - URL updates automatically to include parameters for the active element and relationship types
   - URL parameters are present when not all types are visible

2. **Share the URL**
   - User copies the URL and shares it with a colleague
   - Colleague opens the link in a new browser session
   - Filters are set to match the URL parameters on load

3. **Verify URL Override of Stored State**
   - Colleague had different stored filter preferences for the same model
   - URL parameters take precedence over stored settings on initial load
   - Subsequent filter changes save to both URL and browser storage

#### Edge Cases

- **URL parameter with type not in current model** — parameter is ignored; filter set may become
  empty resulting in a blank view
- **Malformed URL parameters** — handled gracefully without errors

## Business Rules

### Element Type Filter

- Filter state is keyed by model identifier to isolate per-model preferences.
- In drill mode, the drill root node remains visible regardless of element type filter.
- The set of active element type names determines visibility.
- Elements are visible if their type is in the active set or if they are the drill root.
- "Select all" checks all types currently present in the model.
- "Select none" unchecks all; the graph may become empty except for drill root if present.
- Count badges reflect the intersection of element type filter and drill scope when applicable.

### Relationship Type Filter

- Relationship type filter operates on edges that have both endpoints visible after element
  filtering.
- Edges are visible only when both endpoints are visible and the relationship type is active, or
  when the edge is a containment edge.
- Containment edges bypass relationship type filters and are always shown if endpoints are visible.

### Filter Search

- Search input is present in both Entities and Relationships filter panels.
- Search filters the list items in the user interface, not the underlying active type sets.
- Checkbox states are preserved even when items are hidden by search.
- Search does not affect graph visibility; it only filters which types are shown in the UI list.
- Search is case-insensitive and matches substrings in the type display name.

### Filter Persistence

- On each filter change, the entire filter state is saved to browser storage.
- The state is organized per model using the model identifier as a key.
- Filter state is loaded after model parsing, before the first render.
- Active element types are initially set to all types from the model, then any hidden types are
  removed.
- Active relationship types are derived similarly.
- URL parameters override stored settings when present during startup.

### URL Encoding

- URL parameters include element types and relationship types (comma-separated) when not all are
  visible.
- Only types that are actively filtered out are omitted from the URL.
- The order of types in the URL does not matter.
- Filter changes persist to both URL and browser storage independently.

## UI/UX

### Responsiveness

- Filtering is instantaneous.
- Search is real-time with debounced input (200ms delay after typing stops).
- Graph, table (if visible), and count badges all update in sync with no visual flicker.

### Visual Design

- Each type displays with a color indicator (matching the graph), name, and count.
- Checkboxes enable selection.
- "Select all" and "Select none" buttons appear above each section.
- Search input field with placeholder text.
- Active filters are visually distinguished through checked checkboxes.
- Count badge displays visible count over total or a single number when all are visible.
- Updates to filters reflect immediately in the graph and table views.

## Technical Notes

### Storage

- Browser storage is used to persist filter state across sessions.
- Storage is namespaced by model identifier to maintain separate preferences for each model.
- Data structure maps model identifiers to sets of hidden element and relationship types.

### State Management

- The application maintains sets of active element types and relationship types.
- These sets drive visibility of nodes and edges in the graph and rows in the table.
- Filter changes trigger immediate recalculation of visible elements and edges.

### Performance

- For very large graphs, filter operations should remain responsive.
- Current implementation processes synchronously; future optimization may include asynchronous
  processing or web workers.

### URL Integration

- The URL parameter system enables sharing of filtered views.
- On initial load, URL parameters override stored preferences.
- As users interact with filters, the URL updates to reflect the current state.
- Filter changes use `replaceState` and do not add entries to the browser history; pressing Back
  navigates away from the application rather than to a previous filter state.

### Edge Visibility Logic

Edge visibility rules are defined in Business Rules (Relationship Type Filter section).
Implementation notes:

- Visibility is evaluated after element type filtering, combining both conditions in a single pass.
- Visibility changes are applied without rebuilding the graph structure.

### Cross-Cutting Concerns

- Filter interaction with drill mode: drill root visibility exception is defined in Business Rules
  (Element Type Filter section).
- Filter integration with table view: table respects the same active types as the graph.
- Accessibility: search inputs have proper labels; checkboxes have associated labels; keyboard
  navigation is supported.
