# SR-5: Table View

**Functional Requirements**:
[FR-5.1, FR-5.2, FR-5.3, FR-5.4](../functional-requirements.md#fr-5-table-view)

## User Story

As a user, I want to switch between graph and table views to explore the model in a structured
tabular format, with sorting, searching, and row count statistics that respect the current filter
and drill state.

## Acceptance Criteria

- [SR-5.1](#sr-51-view-switching-controls-allow-toggling-between-graph-and-table-views): View
  switching controls allow toggling between Graph and Table views
- [SR-5.2](#sr-52-table-has-separate-tabs-for-elements-and-relationships): Table has separate tabs
  for Elements and Relationships
- [SR-5.3](#sr-53-table-includes-search-functionality-and-row-count-statistics): Table includes
  search functionality and row count statistics
- [SR-5.4](#sr-54-columns-are-sortable): Columns are sortable
- [SR-5.5](#sr-55-row-clicks-select-corresponding-nodes-in-the-graph): Row clicks select
  corresponding nodes in the graph
- [SR-5.6](#sr-56-switching-views-preserves-graph-state-zoom-pan-and-selection-and-table-scroll-position):
  Switching views preserves graph state (zoom, pan, and selection) and table scroll position
- [SR-5.7](#sr-57-table-respects-active-filters-and-drill-mode-scope): Table respects active filters
  and drill mode scope

## Scenarios

### SR-5.1: View switching controls allow toggling between Graph and Table views

#### Preconditions

- Model is loaded
- Graph view is currently active
- View switcher buttons ("Graph" and "Table") are visible in the header

#### Steps

1. **Switch to Table View**
   - User clicks the "Table" button in the view switcher
   - The active button changes from "Graph" to "Table"
   - Graph is hidden and table view becomes visible
   - Default active table tab is "Elements"
   - Search input is cleared and sort is reset

2. **Switch Back to Graph**
   - User clicks the "Graph" button in the view switcher
   - Table hides and graph becomes visible
   - Graph state is restored exactly as it was before switching

3. **Verify Switching is Instantaneous**
   - User toggles between views repeatedly
   - Each switch is immediate with no loading delay
   - No data or state is lost when switching views

#### Edge Cases

- **Switch before model loaded** — tabs are present but table may show empty or placeholder content;
  acceptable for initial version

### SR-5.2: Table has separate tabs for Elements and Relationships

#### Preconditions

- Model is loaded with both elements and relationships
- Table view is active

#### Steps

1. **View Elements Tab**
   - User sees "Elements" tab active by default
   - Table headers display element-specific columns (e.g., Name, Type, Documentation)
   - Table body populates with rows for all visible elements
   - Active tab is clearly indicated

2. **Switch to Relationships Tab**
   - User clicks the "Relationships" tab
   - Active tab indicator switches to "Relationships"
   - Headers change to show relationship-specific columns (e.g., Source, Relationship Type, Target,
     Relationship Name)
   - Search input clears
   - Table populates with visible relationships

3. **Switch Back to Elements Tab**
   - User clicks the "Elements" tab
   - Active tab indicator returns to "Elements"
   - Elements content is rendered fresh with cleared search

#### Edge Cases

- **Rapid tab switching** — each switch clears search and re-renders table; performance may be
  impacted with large tables

### SR-5.3: Table includes search functionality and row count statistics

#### Preconditions

- Model is loaded with multiple elements of varying types
- Table view is active on the Elements tab

#### Steps

1. **View Initial Count**
   - User sees a count badge in the table toolbar
   - Badge shows a single number when all rows are visible, or "visible / total" when filtered
   - Count accurately reflects current table content relative to total model size

2. **Enter Search Text**
   - User types text into the search input
   - Table filters in real-time as the user types
   - Rows are included where any searchable field (name, type, namespace, etc.) contains the search
     text (case-insensitive)
   - Count badge updates to show matching rows over total

3. **Clear Search**
   - User clears the search input
   - All rows matching other active filters are restored
   - Count badge returns to the pre-search value

#### Edge Cases

- **Empty search results** — table body shows no rows; count shows "0 / total"; acceptable behavior
- **Special characters in cell text** — search matches raw data correctly; rendering handles
  characters safely

### SR-5.4: Columns are sortable

#### Preconditions

- Model is loaded with multiple elements
- Table view is active and populated with rows
- No column is currently sorted

#### Steps

1. **Sort Ascending**
   - User clicks a column header (e.g., "Type")
   - The column header shows an ascending sort indicator (up arrow)
   - Table rows re-order in ascending order based on that column's values

2. **Sort Descending**
   - User clicks the same column header again
   - The sort indicator changes to descending (down arrow)
   - Table rows re-order in descending order

3. **Sort a Different Column**
   - User clicks a different column header (e.g., "Name")
   - The previous sort indicator clears
   - The new column shows the ascending sort indicator
   - Rows re-order by the new column

#### Edge Cases

- **Large table** — sorting responds quickly; noticeable pause possible with very many rows

### SR-5.5: Row clicks select corresponding nodes in the graph

#### Preconditions

- Model is loaded
- Table view is active on the Elements tab
- At least one element row is visible

#### Steps

1. **Click a Row**
   - User clicks a row for a specific element
   - The application switches to Graph view

2. **Node is Centered**
   - The corresponding node is centered in the viewport with smooth animation
   - Zoom level is adjusted to a level suitable for detail viewing

3. **Node is Selected**
   - The node is selected
   - The details panel shows the selected node's information

#### Edge Cases

- **Row click for node not in current graph view** — if a row exists in the table, the node should
  be present in the graph (table and graph respect same filters); if node lookup fails, the action
  silently fails and may log a warning
- **Rapid double-clicks in table** — multiple animations could queue; acceptable for initial
  version; debouncing could improve experience

### SR-5.6: Switching views preserves graph state (zoom, pan, and selection) and table scroll position

#### Preconditions

- Model is loaded
- User has navigated the graph (zoomed in, panned, and selected a node)
- User has scrolled the table to a non-default position

#### Steps

1. **Switch from Graph to Table**
   - User clicks the "Table" button
   - Table view becomes active
   - Graph state (zoom level, pan position, selected node) is retained in memory

2. **Scroll the Table**
   - User scrolls the table to a specific row
   - Table scroll position changes

3. **Switch Back to Graph**
   - User clicks the "Graph" button
   - Graph view becomes active
   - Zoom, pan, and selection are exactly as left before switching
   - No state is lost or reset

#### Edge Cases

- **Switch before model loaded** — no graph state to preserve; behaves as initial load

### SR-5.7: Table respects active filters and drill mode scope

#### Preconditions

- Model is loaded with multiple element types and relationship types
- At least one element type is currently filtered out
- Table view is active

#### Steps

1. **Observe Filtered Elements Table**
   - User sees the Elements table
   - Only elements whose type is in the active element types appear as rows
   - Count badge reflects the filtered visible count versus total elements in the model

2. **Observe Filtered Relationships Table**
   - User switches to the Relationships tab
   - Only relationships where the type is active and both endpoint element types are active appear
     as rows
   - Count badge reflects the filtered visible count versus total relationships

3. **Observe Drill Mode Scope**
   - User activates drill mode on a node (if not already active)
   - Table rows are further restricted to elements within the drill scope
   - Count badge updates accordingly

#### Edge Cases

- **Counting logic** — elements: visible count equals rows after applying active element types and
  drill scope; relationships: visible count equals rows after applying active relationship types,
  endpoint element type filters, drill scope, and search; format shows "N" when all are visible, or
  "M / N" when some are filtered

## Business Rules

### View Switching

- View state indicates either graph or table.
- Table has its own tab state indicating elements or relationships.
- Switching to table clears search input and resets sort.
- Clicking a table row triggers graph view activation and focuses the corresponding node.
- Focus animation smoothly centers the node with a zoom level suitable for detail viewing.
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
