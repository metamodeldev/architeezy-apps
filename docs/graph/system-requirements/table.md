# SR-5: Table View

**Functional Requirements**:
[FR-5.1, FR-5.2, FR-5.3, FR-5.4](../functional-requirements.md#fr-5-table-view)

## User Story

As a user, I want to switch between graph and table views to explore the model in a structured
tabular format, with sorting, searching, and row count statistics that respect the current filter
and drill state.

## Acceptance Criteria

- SR-5.1: Tab buttons switch between Graph and Table views
- SR-5.2: Table has separate tabs for Elements and Relationships
- SR-5.3: Table includes search functionality and row count statistics
- SR-5.4: Columns are sortable (ascending/descending)
- SR-5.5: Row clicks select corresponding nodes in the graph
- SR-5.6: Switching views preserves state (filters, drill, selections)
- SR-5.7: Active view and table tab are clearly indicated
- SR-5.8: Table respects active filters and drill mode scope

## Scenario

### Preconditions

- Model is loaded
- Graph view is currently active

### Steps

1. **Switch to Table View**
   - User clicks the "Table" button in the view switcher
   - The active button changes from "Graph" to "Table"
   - Graph is hidden and table view becomes visible
   - Default active table tab is "Elements"
   - Search input is cleared
   - Sort is reset (no column initially sorted)

2. **Elements Table Renders**
   - Table headers display column names (e.g., Name, Type, Documentation)
   - Table body populates with rows for elements matching:
     - Element type is in the active element types
     - Element is within the current drill scope if drill mode is active
   - Count badge shows visible rows over total elements, or just the count if all are visible
   - Rows initially appear in data insertion order

3. **Sort Table**
   - User clicks a column header (e.g., "Type")
   - The column indicates sorted state with a visual indicator (up or down arrow)
   - Table re-sorts in ascending order based on the column values
   - Clicking the same header again toggles to descending order
   - Further clicking may return to unsorted (or typically cycles between ascending/descending)

4. **Search Table**
   - User enters text in the search input
   - Table filters in real-time
   - Rows are included where any searchable field (name, type, namespace, etc.) contains the search
     text (case-insensitive)
   - Count updates to show matching rows over total
   - Current sort order is preserved for the filtered results

5. **Switch to Relationships Tab**
   - User clicks the "Relationships" tab
   - Active tab indicator switches
   - Headers change to show relationship-specific columns (e.g., Source, Relationship Type, Target,
     Relationship Name)
   - Search input clears
   - Table populates with relationships where:
     - Relationship type is active
     - Both source and target element types are active
     - If drill mode is active, both endpoints are within the drill scope
   - Count badge updates for relationships

6. **Navigate from Table Row to Graph**
   - User on the Elements tab clicks a row for a specific element
   - The application switches to Graph view
   - The graph is prepared
   - The corresponding node is centered in the view with smooth animation
   - The node is selected and shown in the details panel

7. **Return to Graph**
   - User clicks the "Graph" button
   - Table hides, Graph shows
   - Graph state is preserved (same zoom, pan, and selection as before switching)

### Expected Results

- View switching is instantaneous
- No data or state is lost when switching views
- Active tab is clearly indicated
- Table scroll position is preserved when switching views
- Row click reliably switches to graph and focuses the node
- Animation is smooth
- Node is found and centered even if it was outside the viewport
- Count badge accurately reflects current table content relative to total model size
- Sorting responds quickly
- Search filtering is responsive
- Combined filter state (element types, relationship types, drill scope, search) correctly
  determines table content

### Edge Cases

- **Switch before model loaded**
  - Tabs are present but table may show empty or placeholder content
  - This is acceptable for initial version

- **Rapid tab switching**
  - Each switch clears search and re-renders table
  - Performance may be impacted with large tables; debouncing could be considered

- **Row click for node not in current graph view**
  - If a row exists in the table, the node should be present in the graph (table and graph respect
    same filters)
  - If node lookup fails, the action silently fails; could log a warning for debugging

- **Large table** (many rows)
  - Rendering all rows may cause noticeable UI pause
  - Current approach renders all filtered rows at once
  - Future versions may implement virtual scrolling for better performance with large datasets

- **Counting logic**
  - Elements: visible count equals rows after applying active element types and drill scope; total
    equals all elements in the model
  - Relationships: visible count equals rows after applying active relationship types, endpoint
    element type filters, drill scope, and search; total equals all relationships in the model
  - Format shows "N" when all are visible, or "M / N" when some are filtered

- **Empty search results**
  - Table body shows no rows
  - Count shows "0 / total"
  - This is acceptable

- **Special characters in cell text**
  - Proper escaping prevents security issues
  - Search matches the raw data, not rendered HTML

- **Rapid double-clicks in table**
  - Multiple animations could queue
  - Acceptable for initial version; debouncing could improve experience

## Business Rules

### View Switching

- View state indicates either graph or table.
- Table has its own tab state indicating elements or relationships.
- Switching to table clears search input and resets sort.
- Clicking a table row triggers graph view activation and focuses the corresponding node.
- Focus animation smoothly centers the node with a zoom level suitable for detail viewing.
- Table rendering populates the entire table body in a single operation for simplicity in the
  initial version.
- The active view can be encoded in the URL for sharing.

### Elements Table

- Displays element name, type, and documentation.
- Column clicks toggle sorting between ascending and descending order.
- Search operates on element name, type, and potentially other fields using case-insensitive
  substring matching.
- Row click navigates to graph and focuses the node.
- Count shows either a single number (all visible) or visible over total format.
- Counting considers active element types, drill scope (if active), and table search.

### Relationships Table

- Displays source element, relationship type, target element, and relationship name.
- Sorting and search behavior matches elements table.
- Row click selects the source element in the graph.
- Count calculation considers active relationship types, element type filters on both endpoints,
  drill scope, and search.
- Source and target cells show element names with type indicators for visual identification.

### Row Count Display

- Count badge appears in the table toolbar.
- Shows visible row count relative to total items in the model.
- Updates immediately on any change affecting table content (filter, search, tab switch, model
  load).
- Format uses single number when all rows are visible, or "visible / total" when filtered.

## UI/UX

- View switcher: buttons labeled "Graph" and "Table" clearly indicating the current active view.
- Table sub-tabs: "Elements" and "Relationships" to switch table content type.
- Search input in table toolbar with magnifying glass icon and descriptive placeholder.
- Count badge in toolbar showing current count in a compact style.
- Sortable column headers indicate sort state with up/down arrows and visual styling when active.
- Rows have hover highlighting and pointer cursor to indicate clickability.
- Clicking a row switches to graph view with smooth camera movement to the node.
- Returning to graph preserves all graph state including zoom, pan, and selection.
- Tab switching between views maintains scroll position in the table.

## Technical Notes

### View Management

- CSS toggles visibility between graph container and table container based on view state.
- Tab state determines which data source populates the table.
- Switching to table resets transient state like search text and sort order.
- State shared with graph (filters, drill) is preserved without modification.

### Table Rendering

- Data retrieval obtains elements or relationships from the model.
- Data is filtered based on active element types, active relationship types, drill scope, and search
  text.
- Sorting rearranges the filtered data array according to the selected column and direction.
- Rendering constructs HTML for all rows in a single operation for efficiency with moderate table
  sizes.
- Text content is properly escaped to prevent security issues.
- Count calculation tracks both filtered (visible) and total item counts.
- Relationships require joining element data to display element names in source/target cells.

### Row Interaction

- Row click triggers view switch to graph.
- A frame callback ensures the graph is ready before attempting to interact with it.
- Graph node is located by identifier.
- Camera animation centers on the node with appropriate zoom level.
- Node selection occurs as part of the focus action.

### URL Integration

- View mode is encoded in the URL (e.g., parameter indicating table view).
- Changing views updates the URL accordingly.
- Returning to graph removes the view parameter.
- Table-specific transient state (sort, search) is not encoded in the URL; only the view mode and
  underlying filter/drill state are.

### Cross-Cutting Concerns

- Table filtering uses the same active element and relationship types as the graph view.
- Drill mode restricts table rows to nodes within the drill scope, consistent with graph behavior.
- Large tables may need optimization; virtual scrolling could be implemented to render only visible
  rows.
- Accessibility: proper table markup, header definitions, and keyboard navigation support should be
  considered.
