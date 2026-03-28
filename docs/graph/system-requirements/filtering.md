# SR-3: Filtering System

**Functional Requirements**:
[FR-3.1, FR-3.2, FR-3.3, FR-3.4](../functional-requirements.md#fr-3-filtering-system)

## User Story

As a user, I want to show/hide elements and relationships by type, search within filter lists, have
my filter choices remembered across sessions, and share views with specific filters applied via URL.

## Acceptance Criteria

- SR-3.1: Sidebar displays element and relationship types with counts and checkboxes
- SR-3.2: Search inputs filter the type lists in real-time
- SR-3.3: "Select all" and "Select none" buttons for bulk operations
- SR-3.4: Filter changes apply immediately to graph and table views
- SR-3.5: Count badges show visible/total counts
- SR-3.6: Filter state persists to browser storage per model
- SR-3.7: URL parameters encode active filter types and override stored settings on load

## Scenario

### Preconditions

- Model is loaded with multiple element types (e.g., components, services, databases) and
  relationship types (e.g., flows, dependencies, ownership)
- Graph displays all elements and relationships
- Sidebar shows filter panels with all types checked

### Steps

1. **Initial State**
   - User sees all elements and relationships in the graph
   - Entities filter list shows each element type with color indicator, name, and count
   - Relationships filter list shows each relationship type with color indicator, name, and count
   - All checkboxes are checked
   - Count badges show total counts

2. **Filter Element Types**
   - User unchecks an element type (e.g., "Database") in the Entities filter
   - All elements of that type disappear from the graph
   - Edges incident to those elements also disappear
   - Count badge updates to show visible elements versus total
   - Relationship counts update automatically to reflect reduced edge visibility

3. **Search Within Filter List**
   - User types search text into the Entities search field
   - The list filters in real-time
   - Only types containing the search text remain visible in the list
   - Non-matching items are hidden from the list but their checkbox states are preserved
   - Clearing the search reveals all types again with states intact

4. **Filter Relationship Types**
   - User unchecks a relationship type (e.g., "Depends") in the Relationships filter
   - All edges of that type disappear, provided their endpoints are still visible
   - Graph updates
   - Edge count badges reflect the change
   - Note: Containment edges bypass relationship type filters and remain visible if their endpoints
     are visible

5. **Select All / None**
   - User clicks "Select all" button — all visible types in the list become checked
   - Graph shows all elements and edges
   - User clicks "Select none" — all types unchecked
   - Graph becomes empty (except possibly a drill root if in drill mode)
   - Count badges show zero visible

6. **URL Encoding**
   - As user toggles filters, the URL updates automatically
   - URL includes parameters for active element types and relationship types when not all are
     visible
   - User copies the URL and shares with colleague

7. **Persistence Across Sessions**
   - User refreshes the page
   - App loads and reads filter state from browser storage (isolated per model)
   - Checkboxes restore to previous settings
   - Graph reflects the same filtered view

8. **Deep Link Override**
   - User opens a shared link with filter parameters in the URL
   - On startup with URL params, they override stored settings
   - Filters are set to match the URL parameters
   - Subsequent changes save to both URL and browser storage

### Expected Results

- Filtering is instantaneous
- Search is instant after user stops typing
- Graph, table (if visible), and count badges all update in sync
- No visual flicker or intermediate states
- Filter state persists to browser storage with model isolation
- URL updates with active filter types when not all are visible
- Shared link reproduces exact filter state
- URL parameters take precedence over stored settings on initial load
- Count badges accurately reflect visible count versus total model size

### Edge Cases

- **Type with zero elements**
  - Only types present in the model appear in the filter list
  - Items with zero count are dimmed or hidden

- **Drill mode active**
  - Counts show visible over total where visible accounts for both filter and drill scope
  - Drill root remains visible regardless of element type filter

- **Many types (50+)**
  - Search filter helps find specific types
  - Scrolling remains manageable

- **URL parameter with type not in current model**
  - Parameter is ignored; filter set may become empty resulting in blank view

- **Malformed URL parameters**
  - Handled gracefully without errors

- **Browser storage full or disabled**
  - Filter state may not persist but application continues without crashing

- **Corrupted data in browser storage**
  - Falls back to default state (all types visible)

- **Rapid filter changes**
  - Each change applies immediately; performance adequate for typical models

## Business Rules

### Element Type Filter

- Filter state is keyed by model identifier to isolate per-model preferences.
- Counts in filter UI show visible over total format.
- In drill mode, the drill root node remains visible regardless of element type filter.
- The set of active element type names determines visibility.
- Elements are visible if their type is in the active set or if they are the drill root.
- "Select all" checks all types currently present in the model.
- "Select none" unchecks all; the graph may become empty except for drill root if present.
- Count badges reflect the intersection of element type filter and drill scope when applicable.

### Relationship Type Filter

- Relationship type filter operates on edges that have both endpoints visible after element
  filtering.
- Count badge shows count of visible edges.
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
- URL updates use a method that does not add entries to browser history.
- Filter changes persist to both URL and browser storage independently.

## UI/UX

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
- Navigation using browser back/forward buttons restores the corresponding filter state.

### Edge Visibility Logic

Edges are rendered based on both relationship type filters and the visibility of their endpoint
nodes:

- An edge is visible only when:
  - Its relationship type is active (not filtered out), AND
  - Both its source and target nodes are visible (have not been filtered out by element type)
- **Containment edge exception**: Containment edges (representing parent-child relationships) remain
  visible even when the parent node is filtered out, to maintain structural context and show
  orphaned children. These bypass relationship type filters but still respect endpoint visibility
  (target child must be visible or also be a drill root).
- Edge visibility calculation happens after element type filtering and relationship type filtering
  are applied, combining both conditions.

### Cross-Cutting Concerns

- Filter interaction with drill mode: the drill root is always visible regardless of element type
  filter.
- Filter integration with table view: table respects the same active types as the graph.
- Accessibility: search inputs have proper labels; checkboxes have associated labels; keyboard
  navigation is supported.
