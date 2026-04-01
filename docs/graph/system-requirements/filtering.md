# SR-4: Filtering

## Scenarios

### SR-4.1: Visibility

The system allows toggling the visibility of model elements by their functional types.

#### Functional Requirements

- [FR-4.1](../functional-requirements.md#fr-4-filtering): Filter model visibility by entity and
  relationship types.

#### User Story

As a user, I want to hide or show specific types of entities and relationships to focus on relevant
layers of the architecture.

#### Steps

1. Open the filtering panel.
   - Two lists are displayed: "Entities" and "Relationships", with checkboxes for each type.
   - Each type displays an "Available / Total" count.
2. Uncheck an entity type.
   - All nodes of that type and their associated relationships disappear from the view.
   - The "Available" count for the unchecked entity type remains unchanged.
3. Uncheck a relationship type.
   - All edges of that type disappear, while the connected nodes remain visible.

### SR-4.2: Bulk actions

The system provides controls to quickly check or uncheck all types within a specific category.

#### Functional Requirements

- [FR-4.1](../functional-requirements.md#fr-4-filtering): Filter model visibility by entity and
  relationship types.

#### User Story

As a user, I want to reset the visibility of all entities or all relationships with a single action.

#### Steps

1. Click "Uncheck all" in the Entities section.
   - All entity checkboxes become unchecked; the graph becomes empty (except for the Drill-down
     root).
   - The "Available" counts for all relationship types drop to 0.
   - Relationship types that were unchecked disappear from the list; those that were checked become
     dimmed (grayed out).
2. Click "Check all" in the Entities section.
   - All entity types become checked and visible on the canvas.
   - The "Available" counts for relationship types are restored.
3. Click "Check all" in the Relationships section.
   - All relationship types become checked and visible.

#### Edge Cases

- **Search Preservation**: Clicking "Check/Uncheck all" affects all types in the category but does
  not clear the text in the search field.

### SR-4.3: Dynamic filter management

The system hides types from the list when they are unavailable in the current view or scope.

#### Functional Requirements

- [FR-4.1](../functional-requirements.md#fr-4-filtering): Filter model visibility by entity and
  relationship types.

#### User Story

As a user, I want the filter list to show only types that are relevant to the current model view or
drill-down scope.

#### Steps

1. Uncheck an entity type that is a mandatory endpoint for a specific relationship type.
   - The available count for that relationship type drops to 0.
   - If the relationship type was unchecked, it disappears from the list; if it was checked, it
     remains visible but dimmed.
2. Activate Drill-down mode on a specific node.
   - Types that do not exist within the current drill-down scope disappear from the filter lists (if
     unchecked).
   - Types that do not exist in the scope but are currently **checked** remain visible in the list
     but are displayed as dimmed with a 0 count.
   - Types that exist in the scope but are **unchecked** remain visible as normal unchecked items
     with their available count.

### SR-4.4: Global search

The system allows locating specific elements within the current view scope.

#### Functional Requirements

- [FR-4.2](../functional-requirements.md#fr-4-filtering): Search for specific entities and
  relationships within the model data.
- [FR-4.3](../functional-requirements.md#fr-4-filtering): Maintain consistent filtering and search
  results across graph and table views.

#### User Story

As a user, I want to search for specific entities to highlight them on the canvas or find them in
the table.

#### Steps

1. Enter a query into the global search field in the header.
   - In the **Graph view**, matching elements remain opaque; others are dimmed.
   - In the **Table view**, only matching rows are rendered.
2. Search for an element that is hidden by current filters or is outside the drill-down scope.
   - The system displays no results and provides a hint: "No results found in the current scope.
     Check your filters."
3. Clear the search field.
   - All currently visible elements return to their default opacity/visibility.

### SR-4.5: Filter list discovery

The system allows finding and enabling types that are currently hidden from the list.

#### Functional Requirements

- [FR-4.1](../functional-requirements.md#fr-4-filtering): Filter model visibility by entity and
  relationship types.

#### User Story

As a user, I want to find and enable a type that is hidden because it has no available elements in
the current scope.

#### Steps

1. Enter a query into the search field within a filter list.
   - The list updates to show matching types, including those that are currently hidden (with a 0
     available count).
2. Activate the "Show all" switch next to the search field.
   - The list expands to show every type present in the model metadata.
3. Check a dimmed type with a 0 available count.
   - The type is now "pinned" to the list (it will stay visible even after search is cleared),
     although no elements appear on the canvas until the scope changes.

## Business Rules

- **Available Count Definition**: The number of elements of a type that satisfy current spatial
  (Drill-down) and dependency (endpoint visibility) constraints, **regardless of whether the type is
  currently enabled in the filter**. In Drill-down mode, the spatial scope includes all elements
  reachable within the depth limit, following active relationship types and containment edges,
  **ignoring entity type filters**.
- **Dependency Rule**: The "Available Count" for a relationship type is 0 if any of its mandatory
  endpoint entity types are **unchecked** in the filter.
- **Dynamic Hiding Rule**:
  - A type is automatically hidden from the filter list if its "Available Count" is 0 AND its
    checkbox is unchecked.
  - If a type's checkbox is **checked**, it is never hidden from the list, even if its count is 0
    (it becomes dimmed instead).
- **URL Parameter Policy**:
  - If all types of a category (Entities or Relationships) are checked, no corresponding parameter
    is added to the URL.
  - If at least one type is unchecked, a parameter (e.g., `entities` or `rels`) containing the list
    of **checked** types is added to the URL.
  - If no parameters are present in the URL, the system assumes all types are visible.
- **Search Logic**:
  - **Global search** is a subset of active filters:
    `Result = (Active Types) AND (Active Scope) AND (Query)`.
  - **Bulk Actions**: "Check/Uncheck all" affect only checkbox states and do not clear search
    inputs.
- **Persistence**: Filter states are isolated by **model type** and stored in browser storage.

## UI/UX Functional Details

- **Feedback**: A loading indicator appears if recalculation exceeds 200ms.
- **Search Placement**: The global search field is positioned **before** the Graph/Table view toggle
  buttons in the header.
- **Search Interaction**: Filter list search is debounced by 300ms. All search fields include a
  "Clear" button.
- **Highlight Opacity**: In the Graph view, dimmed nodes use 35% opacity and dimmed edges use 15%
  opacity.
- **Empty States**: If global search returns no results, a hint suggesting a filter check is
  displayed.
- **Results Count**: The global search does **not** display a count of found objects.

## Technical Notes

- **URL Sync**: States are synchronized using `replaceState`. To keep URLs short, only the
  identifiers of **checked** types are listed.
- **Initialization**: Upon loading a link, the system must first restore the **Hidden/Checked
  Types** state from URL parameters (or storage) and only then calculate the **Available Counts**.
- **Table Rendering**: Visibility in the Table view is managed by **data array filtering**
  (re-rendering only matched rows).
- **Performance**: Graph visibility is managed by the rendering engine's display flags.
- **Storage**: Uses `localStorage`, keyed by the model type identifier.
- **BFS Consistency**: Filter counters in Drill-down mode use the same BFS algorithm as the Graph
  view.
