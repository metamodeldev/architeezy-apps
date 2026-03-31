# SR-3: Table

## Scenarios

### SR-3.1: View switching

The system allows toggling between the Graph visualization and the Tabular representation.

#### Functional Requirements

- [FR-3.1](../functional-requirements.md#fr-3-table): Provide a tabular representation of entities
  and relationships.

#### User Story

As a user, I want to switch to a table view to see model data in a structured format without losing
my current filters or drill-down context.

#### Preconditions

- A model is successfully loaded.

#### Steps

1. Select the "Table" view mode in the application header.
   - The graph canvas is hidden, and the tabular interface becomes visible.
   - The system displays two tabs: "Entities" and "Relationships".
   - Current global filters and drill-down state are applied to the table rows.
2. Switch back to the "Graph" view mode.
   - The table is hidden, and the graph canvas is restored.
   - The previous pan, zoom, and selection states in the graph are preserved.

#### Edge Cases

- **Switching during load**: If the view is switched while data is being fetched, the loading
  indicator persists across both views until completion.

### SR-3.2: Tabular display

The system provides separate lists for model entities and their relationships.

#### Functional Requirements

- [FR-3.1](../functional-requirements.md#fr-3-table): Provide a tabular representation of entities
  and relationships.

#### User Story

As a user, I want to browse entities and relationships in dedicated tabs with relevant columns for
each.

#### Preconditions

- The Table view is active.

#### Steps

1. Observe the "Entities" tab (active by default).
   - The table displays columns for entity name, type, and associated properties.
   - The row count indicates how many entities are visible relative to the total.
2. Select the "Relationships" tab.
   - The table updates to show columns for source entity, relationship type, target entity, and
     relationship name.
   - The row count updates to reflect visible relationships.

#### Edge Cases

- **No data**: If no entities or relationships match the current filters, the table displays a "No
  data available" message.

### SR-3.3: Sorting

The system allows organizing table data by specific attributes.

#### Functional Requirements

- [FR-3.2](../functional-requirements.md#fr-3-table): Support multi-column sorting and filtering
  within the table.

#### User Story

As a user, I want to sort the table by any column to group similar items or find specific entries.

#### Steps

1. Click a column header (e.g., "Type").
   - The table rows are reordered in ascending order based on the selected column.
   - A visual indicator (arrow) appears in the column header.
2. Click the same column header again.
   - The sort order reverses to descending.
3. Click a different column header.
   - The previous sort is cleared, and the new column is sorted in ascending order.

#### Edge Cases

- **Complex data**: Sorting handles empty values by placing them at the end of the list regardless
  of the sort direction.

### SR-3.4: Filtering

The system provides a local search to refine the table content.

#### Functional Requirements

- [FR-3.2](../functional-requirements.md#fr-3-table): Support multi-column sorting and filtering
  within the table.
- [FR-4.3](../functional-requirements.md#fr-4-filtering): Maintain consistent filtering and search
  results across graph and table views.

#### User Story

As a user, I want to search within the table to quickly find a specific row without changing the
global model filters.

#### Steps

1. Enter a query into the table search field.
   - The table updates in real-time to show only rows where any cell matches the query.
   - The row count updates to reflect the results of the local search.
2. Clear the search field.
   - The table restores all rows that match the global filters.

#### Edge Cases

- **No results**: If the search query matches nothing, the table shows a "No matching records"
  message and the row count shows zero.

### SR-3.5: Graph navigation

The system allows navigating from a specific table record to its visual representation.

#### Functional Requirements

- [FR-3.3](../functional-requirements.md#fr-3-table): Enable navigation from table records to
  corresponding graph nodes.

#### User Story

As a user, I want to click on a table row to quickly find and focus on that specific entity in the
graph.

#### Steps

1. Click on a row in the "Entities" table.
   - The system switches the view mode to "Graph".
   - The corresponding node is selected and highlighted.
   - The camera performs a smooth centering animation on the selected node.

#### Edge Cases

- **Hidden node**: Если узел скрыт глобальными фильтрами, переход невозможен (таблица и граф всегда
  синхронизированы по фильтрам).

---

## Business Rules

- **Global State Synchronization**: The Table view always respects global filters (FR-4) and the
  current Drill-down context (FR-2). If a node is hidden in the Graph, it is hidden in the Table.
- **Search Isolation**: The search field within the Table view is a local filter. It does not affect
  the Graph visualization or the global filtering state.
- **Count Calculation**: The table header displays a count in the format "Visible / Total".
  "Visible" accounts for global filters, drill-down scope, and the local table search.
- **Default Tab**: The "Entities" tab is the default view when switching from Graph to Table for the
  first time in a session.
- **Sorting Logic**: Only one column can be sorted at a time. Switching tabs
  (Entities/Relationships) resets the sort order to default.

## UI/UX Functional Details

- **Feedback**: A loading indicator is displayed for any table refresh or view switch exceeding
  200ms.
- **Row Interaction**: Rows should change their visual state on hover to indicate they are
  clickable.
- **Search Interaction**: The search input includes a "Clear" button and is debounced by 300ms.
- **View Persistence**: Switching between Graph and Table must not reset the scroll position of the
  table or the transient UI state of the graph (zoom/pan).

## Technical Notes

- **State Management**:
  - `pushState`: Used when switching between Graph and Table view modes.
  - `replaceState`: Used for internal table adjustments (sorting, local search).
- **Navigation**: The smooth centering animation on the node uses the same camera logic as
  property-panel navigation in SR-2.
- **Performance**: For very large tables, virtual scrolling or pagination should be used to maintain
  60fps responsiveness.
- **Data Refresh**: Switching tabs in the table view does not trigger a new API fetch if the model
  data is already present in memory.
