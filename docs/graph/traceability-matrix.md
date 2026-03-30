# Traceability Matrix: Architeezy Graph

This document provides a complete traceability matrix mapping functional requirements (FR) to system
requirements (SR) and test cases (TC). It serves as a single source of truth for understanding the
complete coverage of all requirements and their validation status.

| FR group                                                             | FR count | SR count | TC count | Implemented TCs |
| -------------------------------------------------------------------- | :------: | :------: | :------: | :-------------: |
| [FR-1: Model Management](#fr-1-model-management)                     |    3     |    8     |    12    |       12        |
| [FR-2: Graph Visualization](#fr-2-graph-visualization)               |    5     |    6     |    15    |       15        |
| [FR-3: Filtering System](#fr-3-filtering-system)                     |    4     |    14    |    29    |       29        |
| [FR-4: Drill-Down Analysis](#fr-4-drill-down-analysis)               |    4     |    12    |    15    |       15        |
| [FR-5: Table View](#fr-5-table-view)                                 |    4     |    8     |    16    |       16        |
| [FR-6: Theme Management](#fr-6-theme-management)                     |    2     |    5     |    10    |       10        |
| [FR-7: Sidebar and UI Controls](#fr-7-sidebar-and-ui-controls)       |    3     |    4     |    12    |       12        |
| [FR-8: Internationalization (i18n)](#fr-8-internationalization-i18n) |    2     |    3     |    6     |        6        |
| [FR-9: Shareable Views via URL](#fr-9-shareable-views-via-url)       |    2     |    5     |    11    |       11        |
| [FR-10: Authentication](#fr-10-authentication)                       |    3     |    7     |    14    |       14        |
| [FR-11: Data Export](#fr-11-data-export)                             |    2     |    8     |    16    |       16        |
| **Total**                                                            |  **34**  |  **68**  | **136**  |     **136**     |

## FR-1: Model Management

### [FR-1.1](functional-requirements.md#fr-1-model-management): Load model from repository via selector modal

- [SR-1.1](system-requirements/model.md): A model selector interface allows browsing and selecting
  from available models
  - [TC-1.1.1](test-cases/model/tc-1.1.md#tc-111-model-selector-opens-automatically-when-no-model-is-stored):
    Model selector opens automatically when no model is stored
  - [TC-1.1.2](test-cases/model/tc-1.1.md#tc-112-selecting-a-model-from-the-selector-loads-it-and-closes-the-modal):
    Selecting a model from the selector loads it and closes the modal

- [SR-1.2](system-requirements/model.md): Model selector displays model information
  - [TC-1.2.1](test-cases/model/tc-1.2.md#tc-121-model-cards-display-icon-name-type-badge-and-description):
    Model cards display icon, name, type badge, and description

- [SR-1.3](system-requirements/model.md): Search can filter the model list
  - [TC-1.3.1](test-cases/model/tc-1.3.md#tc-131-typing-in-the-search-field-filters-the-model-list-in-real-time):
    Typing in the search field filters the model list in real-time
  - [TC-1.3.2](test-cases/model/tc-1.3.md#tc-132-clearing-the-search-field-restores-all-models):
    Clearing the search field restores all models

- [SR-1.4](system-requirements/model.md): Loading indicators appear during fetch operations
  - [TC-1.4.1](test-cases/model/tc-1.4.md#tc-141-loading-indicator-appears-after-model-selection-and-disappears-when-the-model-is-ready):
    Loading indicator appears after model selection and disappears when the model is ready

### [FR-1.2](functional-requirements.md#fr-1-model-management): Load model from URL parameters (deep linking)

- [SR-1.5](system-requirements/model.md): Deep links load specified model with URL parameters for
  view mode, filters, and drill state
  - [TC-1.5.1](test-cases/model/tc-1.5.md#tc-151-url-model-loads-the-specified-model-without-opening-the-selector):
    URL `?model=` loads the specified model without opening the selector
  - [TC-1.5.2](test-cases/model/tc-1.5.md#tc-152-url-entities-pre-applies-an-element-type-filter-on-load):
    URL `?entities=` pre-applies an element type filter on load

- [SR-1.7](system-requirements/model.md): Invalid deep links fall back to model selection
  - [TC-1.7.1](test-cases/model/tc-1.7.md#tc-171-unknown-model-id-in-model-falls-back-to-the-model-selector-with-an-error):
    Unknown model ID in `?model=` falls back to the model selector with an error

### [FR-1.3](functional-requirements.md#fr-1-model-management): Persist and recall last-viewed model across sessions

- [SR-1.8](system-requirements/model.md): Last-viewed model and filter state persist across sessions
  - [TC-1.8.1](test-cases/model/tc-1.8.md#tc-181-last-viewed-model-is-auto-loaded-on-the-next-session):
    Last-viewed model is auto-loaded on the next session
  - [TC-1.8.2](test-cases/model/tc-1.8.md#tc-182-filter-state-for-a-model-persists-across-page-reloads):
    Filter state for a model persists across page reloads

- [SR-1.9](system-requirements/model.md): If stored model is unavailable, user is prompted to select
  a new model
  - [TC-1.9.1](test-cases/model/tc-1.9.md#tc-191-unavailable-stored-model-shows-an-error-and-opens-the-selector):
    Unavailable stored model shows an error and opens the selector

## FR-2: Graph Visualization

### [FR-2.1](functional-requirements.md#fr-2-graph-visualization): Render elements as nodes and relationships as edges

- [SR-2.1](system-requirements/graph.md): All model elements render as nodes, all relationships as
  edges
  - [TC-2.1.1](test-cases/graph/tc-2.1.md#tc-211-all-model-elements-appear-as-nodes-and-all-relationships-appear-as-directed-edges):
    All model elements appear as nodes and all relationships appear as directed edges
  - [TC-2.1.2](test-cases/graph/tc-2.1.md#tc-212-element-with-a-missing-name-falls-back-to-displaying-the-element-type-as-its-label):
    Element with a missing name falls back to displaying the element type as its label

- [SR-2.2](system-requirements/graph.md): Colors are consistent based on element/relationship types
  - [TC-2.2.1](test-cases/graph/tc-2.2.md#tc-221-same-type-nodes-share-the-same-color-colors-are-stable-across-page-reloads):
    Same-type nodes share the same color; colors are stable across page reloads

### [FR-2.2](functional-requirements.md#fr-2-graph-visualization): Provide multiple layout algorithms

- [SR-2.3](system-requirements/graph.md): User can switch between multiple layout algorithms
  - [TC-2.3.1](test-cases/graph/tc-2.3.md#tc-231-layout-dropdown-shows-all-available-algorithms-with-the-current-one-selected):
    Layout dropdown shows all available algorithms with the current one selected
  - [TC-2.3.2](test-cases/graph/tc-2.3.md#tc-232-selecting-a-different-layout-algorithm-immediately-rerenders-the-graph):
    Selecting a different layout algorithm immediately rerenders the graph

### [FR-2.3](functional-requirements.md#fr-2-graph-visualization): Support zoom and pan navigation

- [SR-2.4](system-requirements/graph.md): User can zoom and pan to navigate the graph
  - [TC-2.4.1](test-cases/graph/tc-2.4.md#tc-241-mouse-wheel-zoom-centers-on-cursor-position):
    Mouse-wheel zoom centers on cursor position
  - [TC-2.4.2](test-cases/graph/tc-2.4.md#tc-242-fit-to-view-button-shows-all-visible-nodes-with-padding):
    Fit-to-view button shows all visible nodes with padding

### [FR-2.4](functional-requirements.md#fr-2-graph-visualization): Select nodes and display details

- [SR-2.5](system-requirements/graph.md): Single-click on a node selects it and shows details in the
  panel
  - [TC-2.5.1](test-cases/graph/tc-2.5.md#tc-251-single-click-on-a-node-selects-it-and-shows-details-panel):
    Single-click on a node selects it and shows details panel

### [FR-2.5](functional-requirements.md#fr-2-graph-visualization): Display a legend explaining node and edge type visual encodings

- [SR-2.9](system-requirements/graph.md): User can show or hide the legend on the graph canvas
  - [TC-2.9.1](test-cases/graph/tc-2.9.md#tc-291-enabling-the-legend-setting-makes-the-legend-appear-on-the-canvas):
    Enabling the Legend setting makes the legend appear on the canvas
  - [TC-2.9.2](test-cases/graph/tc-2.9.md#tc-292-legend-lists-only-types-that-are-currently-visible-in-the-graph):
    Legend lists only types that are currently visible in the graph
  - [TC-2.9.3](test-cases/graph/tc-2.9.md#tc-293-disabling-the-legend-setting-removes-the-legend-from-the-canvas):
    Disabling the Legend setting removes the legend from the canvas
  - [TC-2.9.4](test-cases/graph/tc-2.9.md#tc-294-legend-can-be-repositioned-by-dragging): Legend can
    be repositioned by dragging
  - [TC-2.9.5](test-cases/graph/tc-2.9.md#tc-295-legend-shows-no-entries-when-all-types-are-filtered-out):
    Legend shows no entries when all types are filtered out
  - [TC-2.9.6](test-cases/graph/tc-2.9.md#tc-296-legend-is-clamped-to-canvas-bounds-when-dragged-beyond-the-edge):
    Legend is clamped to canvas bounds when dragged beyond the edge
  - [TC-2.9.7](test-cases/graph/tc-2.9.md#tc-297-legend-is-re-clamped-automatically-when-the-canvas-shrinks):
    Legend is re-clamped automatically when the canvas shrinks

## FR-3: Filtering System

### [FR-3.1](functional-requirements.md#fr-3-filtering-system): Filter element types

- [SR-3.1](system-requirements/filtering.md): Element and relationship types are displayed with
  counts and selection controls
  - [TC-3.1.1](test-cases/filtering/tc-3.1.md#tc-311-sidebar-displays-all-element-types-with-color-indicator-name-and-count):
    Sidebar displays all element types with color indicator, name, and count

- [SR-3.3](system-requirements/filtering.md): Bulk selection controls for "select all" and "select
  none" are available
  - [TC-3.3.1](test-cases/filtering/tc-3.3.md#tc-331-select-none-unchecks-all-element-types-and-empties-the-table):
    "Select none" unchecks all element types and empties the table
  - [TC-3.3.2](test-cases/filtering/tc-3.3.md#tc-332-select-all-restores-all-element-types-after-deselecting):
    "Select all" restores all element types after deselecting

- [SR-3.4](system-requirements/filtering.md): Changing filter settings updates the graph and table
  views accordingly
  - [TC-3.4.1](test-cases/filtering/tc-3.4.md#tc-341-unchecking-an-element-type-immediately-hides-those-nodes-and-their-incident-edges):
    Unchecking an element type immediately hides those nodes and their incident edges

- [SR-3.5](system-requirements/filtering.md): Count badges show visible/total counts
  - [TC-3.5.1](test-cases/filtering/tc-3.5.md#tc-351-entities-count-badge-updates-when-an-element-type-is-filtered-out):
    Entities count badge updates when an element type is filtered out

- [SR-3.6](system-requirements/filtering.md): Filter state persists to browser storage per model
  - [TC-3.6.1](test-cases/filtering/tc-3.6.md#tc-361-unchecked-element-type-persists-across-page-reloads):
    Unchecked element type persists across page reloads

- [SR-4.8](system-requirements/drill-down.md): Drill mode respects active element and relationship
  type filters
  - [TC-4.8.1](test-cases/drill-down/tc-4.8.md#tc-481-element-type-filter-applies-within-drill-scope-hidden-types-are-excluded):
    Element type filter applies within drill scope; hidden types are excluded

- [SR-4.9](system-requirements/drill-down.md): Count badges update to show visible/total considering
  drill scope and filters
  - [TC-4.9.1](test-cases/drill-down/tc-4.9.md#tc-491-entering-drill-mode-updates-element-count-badges-to-reflect-the-drill-scope):
    Entering drill mode updates element count badges to reflect the drill scope

- [SR-5.6](system-requirements/table.md): Switching views preserves graph state (zoom, pan, and
  selection) and table scroll position
  - [TC-5.6.2](test-cases/table/tc-5.6.md#tc-562-active-filters-are-preserved-when-switching-between-views):
    Active filters are preserved when switching between views

- [SR-5.7](system-requirements/table.md): Table respects active filters and drill mode scope
  - [TC-5.7.1](test-cases/table/tc-5.7.md#tc-571-table-excludes-rows-for-element-types-that-are-filtered-out):
    Table excludes rows for element types that are filtered out

- [SR-11.8](system-requirements/export.md): Export respects current filters
  - [TC-11.8.1](test-cases/export/tc-11.8.md#tc-1181-csv-export-with-applicationservice-unchecked-excludes-service-x-from-the-output):
    CSV export with ApplicationService unchecked excludes Service X from the output
  - [TC-11.8.2](test-cases/export/tc-11.8.md#tc-1182-graph-image-export-captures-only-visible-nodes-those-not-filtered-out):
    Graph image export captures only visible nodes (those not filtered out)

### [FR-3.2](functional-requirements.md#fr-3-filtering-system): Filter relationship types

- [SR-3.1](system-requirements/filtering.md): Element and relationship types are displayed with
  counts and selection controls
  - [TC-3.1.2](test-cases/filtering/tc-3.1.md#tc-312-sidebar-displays-all-relationship-types-with-color-indicator-name-and-count):
    Sidebar displays all relationship types with color indicator, name, and count

- [SR-3.3](system-requirements/filtering.md): Bulk selection controls for "select all" and "select
  none" are available
  - [TC-3.3.3](test-cases/filtering/tc-3.3.md#tc-333-select-none-unchecks-all-relationship-types-and-hides-all-edges):
    "Select none" unchecks all relationship types and hides all edges
  - [TC-3.3.4](test-cases/filtering/tc-3.3.md#tc-334-select-all-restores-all-relationship-types-after-deselecting):
    "Select all" restores all relationship types after deselecting

- [SR-3.4](system-requirements/filtering.md): Changing filter settings updates the graph and table
  views accordingly
  - [TC-3.4.2](test-cases/filtering/tc-3.4.md#tc-342-unchecking-a-relationship-type-immediately-hides-only-those-edges):
    Unchecking a relationship type immediately hides only those edges

- [SR-3.5](system-requirements/filtering.md): Count badges show visible/total counts
  - [TC-3.5.2](test-cases/filtering/tc-3.5.md#tc-352-relationships-count-badge-updates-when-a-relationship-type-is-filtered-out):
    Relationships count badge updates when a relationship type is filtered out

- [SR-3.6](system-requirements/filtering.md): Filter state persists to browser storage per model
  - [TC-3.6.2](test-cases/filtering/tc-3.6.md#tc-362-unchecked-relationship-type-persists-across-page-reloads):
    Unchecked relationship type persists across page reloads

- [SR-4.8](system-requirements/drill-down.md): Drill mode respects active element and relationship
  type filters
  - [TC-4.8.2](test-cases/drill-down/tc-4.8.md#tc-482-relationship-type-filter-hides-edges-within-drill-scope):
    Relationship type filter hides edges within drill scope

- [SR-5.6](system-requirements/table.md): Switching views preserves graph state (zoom, pan, and
  selection) and table scroll position
  - [TC-5.6.2](test-cases/table/tc-5.6.md#tc-562-active-filters-are-preserved-when-switching-between-views):
    Active filters are preserved when switching between views

### [FR-3.3](functional-requirements.md#fr-3-filtering-system): Search within filter lists

- [SR-3.2](system-requirements/filtering.md): Search inputs can filter the type lists
  - [TC-3.2.1](test-cases/filtering/tc-3.2.md#tc-321-typing-in-the-entities-search-field-hides-non-matching-types):
    Typing in the Entities search field hides non-matching types
  - [TC-3.2.2](test-cases/filtering/tc-3.2.md#tc-322-clearing-the-search-field-restores-all-types-with-checkbox-states-intact):
    Clearing the search field restores all types with checkbox states intact
  - [TC-3.2.3](test-cases/filtering/tc-3.2.md#tc-323-search-in-the-relationships-panel-hides-non-matching-relationship-types):
    Search in the Relationships panel hides non-matching relationship types

### [FR-3.4](functional-requirements.md#fr-3-filtering-system): Encode filters in URL for sharing

- [SR-1.6](system-requirements/model.md): URL state is preserved during browser navigation
  - [TC-1.6.1](test-cases/model/tc-1.6.md#tc-161-filter-changes-update-the-url-in-place-without-adding-browser-history-entries):
    Filter changes update the URL in-place without adding browser history entries

- [SR-1.8](system-requirements/model.md): Last-viewed model and filter state persist across sessions
  - [TC-1.8.2](test-cases/model/tc-1.8.md#tc-182-filter-state-for-a-model-persists-across-page-reloads):
    Filter state for a model persists across page reloads

- [SR-3.7](system-requirements/filtering.md): URL parameters can encode active filter types for
  sharing
  - [TC-3.7.1](test-cases/filtering/tc-3.7.md#tc-371-url-entities-parameter-overrides-stored-filter-state-on-load):
    URL `?entities=` parameter overrides stored filter state on load
  - [TC-3.7.2](test-cases/filtering/tc-3.7.md#tc-372-url-relationships-parameter-overrides-stored-relationship-filter-on-load):
    URL `?relationships=` parameter overrides stored relationship filter on load
  - [TC-3.7.3](test-cases/filtering/tc-3.7.md#tc-373-unchecking-an-element-type-encodes-active-types-into-the-url):
    Unchecking an element type encodes active types into the URL
  - [TC-3.7.4](test-cases/filtering/tc-3.7.md#tc-374-re-checking-all-element-types-removes-the-entities-url-parameter):
    Re-checking all element types removes the `entities` URL parameter
  - [TC-3.7.5](test-cases/filtering/tc-3.7.md#tc-375-unchecking-a-relationship-type-encodes-active-types-into-the-url):
    Unchecking a relationship type encodes active types into the URL

## FR-4: Drill-Down Analysis

### [FR-4.1](functional-requirements.md#fr-4-drill-down-analysis): Enter drill mode by double-clicking a node

- [SR-2.6](system-requirements/graph.md): Double-click on a node triggers drill-down mode
  - [TC-2.6.1](test-cases/graph/tc-2.6.md#tc-261-double-click-on-a-node-triggers-drill-down-mode):
    Double-click on a node triggers drill-down mode

- [SR-4.1](system-requirements/drill-down.md): Drill mode can be activated from any node
  - [TC-4.1.1](test-cases/drill-down/tc-4.1.md#tc-411-double-clicking-a-node-activates-drill-mode-and-cancels-the-single-click-timer):
    Double-clicking a node activates drill mode and cancels the single-click timer

- [SR-4.10](system-requirements/drill-down.md): Drill state persists in URL for sharing
  - [TC-4.10.1](test-cases/drill-down/tc-4.10.md#tc-4101-deep-link-with-entity-restores-drill-mode-on-load):
    Deep link with `?entity=` restores drill mode on load
  - [TC-4.10.2](test-cases/drill-down/tc-4.10.md#tc-4102-deep-link-with-entity-and-depth-restores-the-specified-depth):
    Deep link with `?entity=` and `?depth=` restores the specified depth

### [FR-4.2](functional-requirements.md#fr-4-drill-down-analysis): Control drill depth (1-5 levels)

- [SR-4.4](system-requirements/drill-down.md): Graph shows nodes within configurable depth from
  selected node
  - [TC-4.4.1](test-cases/drill-down/tc-4.4.md#tc-441-graph-shows-only-nodes-within-the-configured-depth-from-the-drill-root):
    Graph shows only nodes within the configured depth from the drill root

- [SR-4.5](system-requirements/drill-down.md): Only edges connecting visible nodes are shown
  - [TC-4.5.1](test-cases/drill-down/tc-4.5.md#tc-451-edges-outside-the-drill-scope-are-hidden):
    Edges outside the drill scope are hidden

- [SR-4.6](system-requirements/drill-down.md): Depth is adjustable within a defined range
  - [TC-4.6.1](test-cases/drill-down/tc-4.6.md#tc-461-depth-picker-shows-buttons-15-with-the-active-depth-highlighted):
    Depth picker shows buttons 1–5 with the active depth highlighted
  - [TC-4.6.2](test-cases/drill-down/tc-4.6.md#tc-462-clicking-a-depth-button-changes-the-active-depth-and-updates-the-url):
    Clicking a depth button changes the active depth and updates the URL

- [SR-4.9](system-requirements/drill-down.md): Count badges update to show visible/total considering
  drill scope and filters
  - [TC-4.9.1](test-cases/drill-down/tc-4.9.md#tc-491-entering-drill-mode-updates-element-count-badges-to-reflect-the-drill-scope):
    Entering drill mode updates element count badges to reflect the drill scope

- [SR-4.10](system-requirements/drill-down.md): Drill state persists in URL for sharing
  - [TC-4.10.2](test-cases/drill-down/tc-4.10.md#tc-4102-deep-link-with-entity-and-depth-restores-the-specified-depth):
    Deep link with `?entity=` and `?depth=` restores the specified depth

- [SR-5.7](system-requirements/table.md): Table respects active filters and drill mode scope
  - [TC-5.7.2](test-cases/table/tc-5.7.md#tc-572-table-excludes-rows-for-elements-outside-the-active-drill-scope):
    Table excludes rows for elements outside the active drill scope

### [FR-4.3](functional-requirements.md#fr-4-drill-down-analysis): Exit drill mode to return to full model

- [SR-4.2](system-requirements/drill-down.md): Drill bar shows selected node and exit option
  - [TC-4.2.1](test-cases/drill-down/tc-4.2.md#tc-421-drill-bar-is-visible-with-the-node-label-and-exit-button-when-drill-mode-is-active):
    Drill bar is visible with the node label and exit button when drill mode is active

- [SR-4.7](system-requirements/drill-down.md): Exiting drill returns to full model view with current
  filters
  - [TC-4.7.1](test-cases/drill-down/tc-4.7.md#tc-471-clicking-the-exit-button-exits-drill-mode-and-restores-all-nodes):
    Clicking the exit button exits drill mode and restores all nodes

### [FR-4.4](functional-requirements.md#fr-4-drill-down-analysis): Apply filters within drill mode

- [SR-4.3](system-requirements/drill-down.md): Selected node remains visible even if its type is
  filtered
  - [TC-4.3.1](test-cases/drill-down/tc-4.3.md#tc-431-drill-root-node-stays-visible-even-when-its-element-type-is-unchecked):
    Drill root node stays visible even when its element type is unchecked

- [SR-4.8](system-requirements/drill-down.md): Drill mode respects active element and relationship
  type filters
  - [TC-4.8.1](test-cases/drill-down/tc-4.8.md#tc-481-element-type-filter-applies-within-drill-scope-hidden-types-are-excluded):
    Element type filter applies within drill scope; hidden types are excluded
  - [TC-4.8.2](test-cases/drill-down/tc-4.8.md#tc-482-relationship-type-filter-hides-edges-within-drill-scope):
    Relationship type filter hides edges within drill scope

## FR-5: Table View

### [FR-5.1](functional-requirements.md#fr-5-table-view): Switch between graph and table views

- [SR-2.8](system-requirements/graph.md): Selection, zoom, and pan state are preserved when
  switching between graph and table views
  - [TC-2.8.1](test-cases/graph/tc-2.8.md#tc-281-zoom-and-pan-state-are-preserved-when-switching-to-table-view-and-back):
    Zoom and pan state are preserved when switching to table view and back
  - [TC-2.8.2](test-cases/graph/tc-2.8.md#tc-282-selected-node-state-is-preserved-when-switching-to-table-view-and-back):
    Selected node state is preserved when switching to table view and back

- [SR-5.1](system-requirements/table.md): View switching controls allow toggling between Graph and
  Table views
  - [TC-5.1.1](test-cases/table/tc-5.1.md#tc-511-clicking-table-switches-to-table-view-clicking-graph-returns):
    Clicking "Table" switches to table view; clicking "Graph" returns

- [SR-5.5](system-requirements/table.md): Row clicks select corresponding nodes in the graph
  - [TC-5.5.1](test-cases/table/tc-5.5.md#tc-551-clicking-an-element-row-switches-to-graph-view):
    Clicking an element row switches to graph view

- [SR-5.6](system-requirements/table.md): Switching views preserves graph state (zoom, pan, and
  selection) and table scroll position
  - [TC-5.6.1](test-cases/table/tc-5.6.md#tc-561-returning-to-graph-view-preserves-the-previous-zoom-and-pan-state):
    Returning to graph view preserves the previous zoom and pan state
  - [TC-5.6.2](test-cases/table/tc-5.6.md#tc-562-active-filters-are-preserved-when-switching-between-views):
    Active filters are preserved when switching between views
  - [TC-5.6.3](test-cases/table/tc-5.6.md#tc-563-switching-to-table-view-clears-the-search-input-and-resets-sort-order):
    Switching to table view clears the search input and resets sort order

### [FR-5.2](functional-requirements.md#fr-5-table-view): Display elements in sortable, filterable table

- [SR-5.2](system-requirements/table.md): Table has separate tabs for Elements and Relationships
  - [TC-5.2.1](test-cases/table/tc-5.2.md#tc-521-elements-tab-lists-all-model-elements-with-correct-columns):
    Elements tab lists all model elements with correct columns

- [SR-5.3](system-requirements/table.md): Table includes search functionality and row count
  statistics
  - [TC-5.3.1](test-cases/table/tc-5.3.md#tc-531-search-filters-table-rows-in-real-time): Search
    filters table rows in real-time

- [SR-5.4](system-requirements/table.md): Columns are sortable
  - [TC-5.4.1](test-cases/table/tc-5.4.md#tc-541-clicking-a-column-header-sorts-rows-ascending-clicking-again-sorts-descending):
    Clicking a column header sorts rows ascending; clicking again sorts descending
  - [TC-5.4.2](test-cases/table/tc-5.4.md#tc-542-clicking-a-different-column-clears-the-sort-on-the-previous-column):
    Clicking a different column clears the sort on the previous column
  - [TC-5.4.3](test-cases/table/tc-5.4.md#tc-543-sorting-by-type-column-reorders-rows-accordingly):
    Sorting by Type column reorders rows accordingly

- [SR-5.7](system-requirements/table.md): Table respects active filters and drill mode scope
  - [TC-5.7.1](test-cases/table/tc-5.7.md#tc-571-table-excludes-rows-for-element-types-that-are-filtered-out):
    Table excludes rows for element types that are filtered out
  - [TC-5.7.2](test-cases/table/tc-5.7.md#tc-572-table-excludes-rows-for-elements-outside-the-active-drill-scope):
    Table excludes rows for elements outside the active drill scope

### [FR-5.3](functional-requirements.md#fr-5-table-view): Display relationships in table

- [SR-5.2](system-requirements/table.md): Table has separate tabs for Elements and Relationships
  - [TC-5.2.2](test-cases/table/tc-5.2.md#tc-522-relationships-tab-lists-all-model-relationships-with-correct-columns):
    Relationships tab lists all model relationships with correct columns

### [FR-5.4](functional-requirements.md#fr-5-table-view): Show row count statistics

- [SR-5.3](system-requirements/table.md): Table includes search functionality and row count
  statistics
  - [TC-5.3.2](test-cases/table/tc-5.3.md#tc-532-table-count-badge-table-count-reflects-the-current-number-of-visible-rows):
    Table count badge (`#table-count`) reflects the current number of visible rows

## FR-6: Theme Management

### [FR-6.1](functional-requirements.md#fr-6-theme-management): Switch between dark, light, and system themes

- [SR-6.1](system-requirements/theme.md): Theme switcher UI allows selection of dark, light, or
  "system" mode
  - [TC-6.1.1](test-cases/theme/tc-6.1.md#tc-611-theme-switcher-shows-three-options-light-dark-system):
    Theme switcher shows three options: Light, Dark, System
  - [TC-6.1.2](test-cases/theme/tc-6.1.md#tc-612-current-theme-selection-is-visually-indicated-as-active):
    Current theme selection is visually indicated as active

- [SR-6.3](system-requirements/theme.md): All UI components respect the selected theme with
  consistent colors
  - [TC-6.3.1](test-cases/theme/tc-6.3.md#tc-631-switching-to-dark-theme-applies-dark-colors-to-sidebar-header-and-table):
    Switching to dark theme applies dark colors to sidebar, header, and table
  - [TC-6.3.2](test-cases/theme/tc-6.3.md#tc-632-switching-to-light-theme-applies-light-colors-throughout-the-application):
    Switching to light theme applies light colors throughout the application

- [SR-6.4](system-requirements/theme.md): User can switch themes and see the change apply across the
  application
  - [TC-6.4.1](test-cases/theme/tc-6.4.md#tc-641-selecting-dark-theme-applies-immediately-without-page-reload):
    Selecting Dark theme applies immediately without page reload
  - [TC-6.4.2](test-cases/theme/tc-6.4.md#tc-642-selecting-system-theme-follows-the-os-color-scheme):
    Selecting System theme follows the OS color scheme

- [SR-6.5](system-requirements/theme.md): Graph elements remain clearly visible in both themes
  - [TC-6.5.1](test-cases/theme/tc-6.5.md#tc-651-nodes-and-edges-are-visually-distinct-after-switching-to-dark-theme):
    Nodes and edges are visually distinct after switching to dark theme
  - [TC-6.5.2](test-cases/theme/tc-6.5.md#tc-652-nodes-and-edges-are-visually-distinct-after-switching-to-light-theme):
    Nodes and edges are visually distinct after switching to light theme

### [FR-6.2](functional-requirements.md#fr-6-theme-management): Persist theme selection across sessions

- [SR-6.2](system-requirements/theme.md): Theme preference persists across browser sessions
  - [TC-6.2.1](test-cases/theme/tc-6.2.md#tc-621-selected-dark-theme-is-restored-after-page-reload):
    Selected dark theme is restored after page reload
  - [TC-6.2.2](test-cases/theme/tc-6.2.md#tc-622-corrupted-theme-value-in-storage-falls-back-to-system-default-without-error):
    Corrupted theme value in storage falls back to system default without error

## FR-7: Sidebar and UI Controls

### [FR-7.1](functional-requirements.md#fr-7-sidebar-and-ui-controls): Collapse/expand sidebar

- [SR-7.1](system-requirements/sidebar.md): Sidebar supports two functional states: expanded and
  collapsed
  - [TC-7.1.1](test-cases/sidebar/tc-7.1.md#tc-711-clicking-the-toggle-button-collapses-the-sidebar-to-icon-only-width-60px):
    Clicking the toggle button collapses the sidebar to icon-only width (~60px)
  - [TC-7.1.2](test-cases/sidebar/tc-7.1.md#tc-712-clicking-the-toggle-button-again-expands-the-sidebar-to-full-width):
    Clicking the toggle button again expands the sidebar to full width
  - [TC-7.1.3](test-cases/sidebar/tc-7.1.md#tc-713-main-content-area-resizes-to-fill-available-space-when-sidebar-collapses):
    Main content area resizes to fill available space when sidebar collapses

- [SR-7.3](system-requirements/sidebar.md): Sidebar configuration must persist across sessions
  - [TC-7.3.1](test-cases/sidebar/tc-7.3.md#tc-731-collapsed-sidebar-state-is-restored-after-page-reload):
    Collapsed sidebar state is restored after page reload
  - [TC-7.3.2](test-cases/sidebar/tc-7.3.md#tc-732-individual-panel-collapsedexpanded-states-are-restored-after-page-reload):
    Individual panel collapsed/expanded states are restored after page reload
  - [TC-7.3.3](test-cases/sidebar/tc-7.3.md#tc-733-storage-unavailable-falls-back-to-default-expanded-state-without-error):
    Storage unavailable falls back to default expanded state without error

### [FR-7.2](functional-requirements.md#fr-7-sidebar-and-ui-controls): Toggle sidebar section visibility

- [SR-7.2](system-requirements/sidebar.md): Sidebar manages multiple independent panels that can be
  toggled individually
  - [TC-7.2.1](test-cases/sidebar/tc-7.2.md#tc-721-collapsing-the-entities-filter-panel-hides-its-content-without-affecting-other-panels):
    Collapsing the Entities filter panel hides its content without affecting other panels
  - [TC-7.2.2](test-cases/sidebar/tc-7.2.md#tc-722-collapsed-panel-controls-are-removed-from-keyboard-tab-order):
    Collapsed panel controls are removed from keyboard tab order
  - [TC-7.2.3](test-cases/sidebar/tc-7.2.md#tc-723-expanding-a-collapsed-panel-restores-its-content-and-returns-controls-to-tab-order):
    Expanding a collapsed panel restores its content and returns controls to tab order

- [SR-7.3](system-requirements/sidebar.md): Sidebar configuration must persist across sessions
  - [TC-7.3.2](test-cases/sidebar/tc-7.3.md#tc-732-individual-panel-collapsedexpanded-states-are-restored-after-page-reload):
    Individual panel collapsed/expanded states are restored after page reload

### [FR-7.3](functional-requirements.md#fr-7-sidebar-and-ui-controls): Configure visualization settings (layout, containment, depth, node tooltips)

- [SR-2.7](system-requirements/graph.md): Containment relationships can be displayed as synthetic
  edges or nested compound nodes
  - [TC-2.7.1](test-cases/graph/tc-2.7.md#tc-271-edges-containment-mode-adds-synthetic-diamond-marker-edges):
    "Edges" containment mode adds synthetic diamond-marker edges
  - [TC-2.7.2](test-cases/graph/tc-2.7.md#tc-272-compound-containment-mode-nests-child-nodes-inside-parent-nodes):
    "Compound" containment mode nests child nodes inside parent nodes
  - [TC-2.7.3](test-cases/graph/tc-2.7.md#tc-273-in-compound-mode-child-remains-as-a-top-level-node-when-its-parent-is-filtered-out):
    In compound mode, child remains as a top-level node when its parent is filtered out

## FR-8: Internationalization (i18n)

### [FR-8.1](functional-requirements.md#fr-8-internationalization-i18n): Detect and switch UI language

- [SR-8.1](system-requirements/i18n.md): Application detects browser language preference on first
  load
  - [TC-8.1.1](test-cases/i18n/tc-8.1.md#tc-811-browser-set-to-german-de-loads-the-application-in-german-on-first-visit):
    Browser set to German (de) loads the application in German on first visit
  - [TC-8.1.2](test-cases/i18n/tc-8.1.md#tc-812-browser-set-to-unsupported-language-falls-back-to-english):
    Browser set to unsupported language falls back to English

- [SR-8.3](system-requirements/i18n.md): Translations fall back to English if a string is missing
  for a locale
  - [TC-8.3.2](test-cases/i18n/tc-8.3.md#tc-832-translation-file-fails-to-load--application-falls-back-to-english-without-crashing):
    Translation file fails to load — application falls back to English without crashing

### [FR-8.2](functional-requirements.md#fr-8-internationalization-i18n): Translate UI strings without affecting model data

- [SR-8.2](system-requirements/i18n.md): UI strings are fully localized — no interface text remains
  in a fixed language when a supported locale is active
  - [TC-8.2.1](test-cases/i18n/tc-8.2.md#tc-821-all-visible-ui-labels-buttons-and-placeholders-are-in-german-when-german-is-active):
    All visible UI labels, buttons, and placeholders are in German when German is active
  - [TC-8.2.2](test-cases/i18n/tc-8.2.md#tc-822-error-and-notification-messages-are-translated-in-the-active-locale):
    Error and notification messages are translated in the active locale

- [SR-8.3](system-requirements/i18n.md): Translations fall back to English if a string is missing
  for a locale
  - [TC-8.3.1](test-cases/i18n/tc-8.3.md#tc-831-a-translation-key-missing-from-the-german-bundle-is-displayed-in-english):
    A translation key missing from the German bundle is displayed in English
  - [TC-8.3.2](test-cases/i18n/tc-8.3.md#tc-832-translation-file-fails-to-load--application-falls-back-to-english-without-crashing):
    Translation file fails to load — application falls back to English without crashing

## FR-9: Shareable Views via URL

### [FR-9.1](functional-requirements.md#fr-9-shareable-views-via-url): The application automatically encodes the current view state (including active filters, drill-down context, and visualization settings) in the URL

- [SR-1.5](system-requirements/model.md): Deep links load specified model with URL parameters for
  view mode, filters, and drill state
  - [TC-1.5.2](test-cases/model/tc-1.5.md#tc-152-url-entities-pre-applies-an-element-type-filter-on-load):
    URL `?entities=` pre-applies an element type filter on load

- [SR-1.6](system-requirements/model.md): URL state is preserved during browser navigation
  - [TC-1.6.1](test-cases/model/tc-1.6.md#tc-161-filter-changes-update-the-url-in-place-without-adding-browser-history-entries):
    Filter changes update the URL in-place without adding browser history entries

- [SR-3.7](system-requirements/filtering.md): URL parameters can encode active filter types for
  sharing
  - [TC-3.7.1](test-cases/filtering/tc-3.7.md#tc-371-url-entities-parameter-overrides-stored-filter-state-on-load):
    URL `?entities=` parameter overrides stored filter state on load
  - [TC-3.7.2](test-cases/filtering/tc-3.7.md#tc-372-url-relationships-parameter-overrides-stored-relationship-filter-on-load):
    URL `?relationships=` parameter overrides stored relationship filter on load
  - [TC-3.7.3](test-cases/filtering/tc-3.7.md#tc-373-unchecking-an-element-type-encodes-active-types-into-the-url):
    Unchecking an element type encodes active types into the URL
  - [TC-3.7.4](test-cases/filtering/tc-3.7.md#tc-374-re-checking-all-element-types-removes-the-entities-url-parameter):
    Re-checking all element types removes the `entities` URL parameter
  - [TC-3.7.5](test-cases/filtering/tc-3.7.md#tc-375-unchecking-a-relationship-type-encodes-active-types-into-the-url):
    Unchecking a relationship type encodes active types into the URL

- [SR-4.6](system-requirements/drill-down.md): Depth is adjustable within a defined range
  - [TC-4.6.2](test-cases/drill-down/tc-4.6.md#tc-462-clicking-a-depth-button-changes-the-active-depth-and-updates-the-url):
    Clicking a depth button changes the active depth and updates the URL

- [SR-4.10](system-requirements/drill-down.md): Drill state persists in URL for sharing
  - [TC-4.10.1](test-cases/drill-down/tc-4.10.md#tc-4101-deep-link-with-entity-restores-drill-mode-on-load):
    Deep link with `?entity=` restores drill mode on load
  - [TC-4.10.2](test-cases/drill-down/tc-4.10.md#tc-4102-deep-link-with-entity-and-depth-restores-the-specified-depth):
    Deep link with `?entity=` and `?depth=` restores the specified depth

### [FR-9.2](functional-requirements.md#fr-9-shareable-views-via-url): Users can bookmark or share URLs that restore the exact same view

- [SR-1.5](system-requirements/model.md): Deep links load specified model with URL parameters for
  view mode, filters, and drill state
  - [TC-1.5.1](test-cases/model/tc-1.5.md#tc-151-url-model-loads-the-specified-model-without-opening-the-selector):
    URL `?model=` loads the specified model without opening the selector
  - [TC-1.5.2](test-cases/model/tc-1.5.md#tc-152-url-entities-pre-applies-an-element-type-filter-on-load):
    URL `?entities=` pre-applies an element type filter on load

- [SR-3.7](system-requirements/filtering.md): URL parameters can encode active filter types for
  sharing
  - [TC-3.7.1](test-cases/filtering/tc-3.7.md#tc-371-url-entities-parameter-overrides-stored-filter-state-on-load):
    URL `?entities=` parameter overrides stored filter state on load
  - [TC-3.7.2](test-cases/filtering/tc-3.7.md#tc-372-url-relationships-parameter-overrides-stored-relationship-filter-on-load):
    URL `?relationships=` parameter overrides stored relationship filter on load

- [SR-4.10](system-requirements/drill-down.md): Drill state persists in URL for sharing
  - [TC-4.10.1](test-cases/drill-down/tc-4.10.md#tc-4101-deep-link-with-entity-restores-drill-mode-on-load):
    Deep link with `?entity=` restores drill mode on load
  - [TC-4.10.2](test-cases/drill-down/tc-4.10.md#tc-4102-deep-link-with-entity-and-depth-restores-the-specified-depth):
    Deep link with `?entity=` and `?depth=` restores the specified depth

## FR-10: Authentication

### [FR-10.1](functional-requirements.md#fr-10-authentication): Optional authentication — the app works fully in anonymous mode; signing in may provide access to additional private models or content

- [SR-10.1](system-requirements/authentication.md): Application works fully in anonymous mode
  without authentication
  - [TC-10.1.1](test-cases/authentication/tc-10.1.md#tc-1011-application-loads-without-any-token-and-all-public-models-are-accessible):
    Application loads without any token and all public models are accessible
  - [TC-10.1.2](test-cases/authentication/tc-10.1.md#tc-1012-attempting-to-load-a-private-model-in-anonymous-mode-shows-a-401-error-notification):
    Attempting to load a private model in anonymous mode shows a 401 error notification

- [SR-10.7](system-requirements/authentication.md): If authentication fails or expires, the UI
  resets to anonymous state
  - [TC-10.7.1](test-cases/authentication/tc-10.7.md#tc-1071-a-401-response-during-an-api-call-clears-the-token-and-shows-sign-in):
    A 401 response during an API call clears the token and shows "Sign in"
  - [TC-10.7.2](test-cases/authentication/tc-10.7.md#tc-1072-session-expired-please-sign-in-again-notification-appears-after-401):
    "Session expired. Please sign in again." notification appears after 401

### [FR-10.2](functional-requirements.md#fr-10-authentication): The header displays a sign-in button when not authenticated, and shows the current user's name with a sign-out option when authenticated

- [SR-10.2](system-requirements/authentication.md): A sign-in control is visible in the header when
  not authenticated
  - [TC-10.2.1](test-cases/authentication/tc-10.2.md#tc-1021-header-shows-a-sign-in-button-when-no-token-is-present):
    Header shows a "Sign in" button when no token is present
  - [TC-10.2.2](test-cases/authentication/tc-10.2.md#tc-1022-sign-in-button-is-keyboard-focusable-and-has-a-visible-focus-style):
    "Sign in" button is keyboard-focusable and has a visible focus style

- [SR-10.3](system-requirements/authentication.md): User can initiate authentication from the header
  - [TC-10.3.1](test-cases/authentication/tc-10.3.md#tc-1031-clicking-sign-in-opens-an-authentication-popup-window):
    Clicking "Sign in" opens an authentication popup window
  - [TC-10.3.2](test-cases/authentication/tc-10.3.md#tc-1032-blocked-popup-shows-an-inline-error-with-a-fallback-link):
    Blocked popup shows an inline error with a fallback link

- [SR-10.4](system-requirements/authentication.md): After successful authentication, the user's
  display name appears in the header with a sign-out option
  - [TC-10.4.1](test-cases/authentication/tc-10.4.md#tc-1041-after-token-receipt-and-profile-fetch-header-shows-john-doe-and-sign-out):
    After token receipt and profile fetch, header shows "John Doe" and "Sign out"
  - [TC-10.4.2](test-cases/authentication/tc-10.4.md#tc-1042-profile-fetch-failure-shows-placeholder-name-user-and-still-shows-sign-out):
    Profile fetch failure shows placeholder name "User" and still shows "Sign out"

### [FR-10.3](functional-requirements.md#fr-10-authentication): Sign-out returns the app to anonymous mode without affecting the current model view

- [SR-10.5](system-requirements/authentication.md): Sign-out clears the authentication state and
  returns UI to anonymous state
  - [TC-10.5.1](test-cases/authentication/tc-10.5.md#tc-1051-clicking-sign-out-removes-the-token-hides-user-name-and-shows-sign-in):
    Clicking "Sign out" removes the token, hides user name, and shows "Sign in"
  - [TC-10.5.2](test-cases/authentication/tc-10.5.md#tc-1052-after-sign-out-a-confirmation-toast-signed-out-successfully-appears):
    After sign-out a confirmation toast "Signed out successfully" appears

- [SR-10.6](system-requirements/authentication.md): Sign-out does NOT clear unrelated persisted
  state
  - [TC-10.6.1](test-cases/authentication/tc-10.6.md#tc-1061-active-filters-and-selected-model-remain-unchanged-after-signing-out):
    Active filters and selected model remain unchanged after signing out
  - [TC-10.6.2](test-cases/authentication/tc-10.6.md#tc-1062-theme-preference-is-preserved-after-signing-out):
    Theme preference is preserved after signing out

- [SR-10.7](system-requirements/authentication.md): If authentication fails or expires, the UI
  resets to anonymous state
  - [TC-10.7.1](test-cases/authentication/tc-10.7.md#tc-1071-a-401-response-during-an-api-call-clears-the-token-and-shows-sign-in):
    A 401 response during an API call clears the token and shows "Sign in"
  - [TC-10.7.2](test-cases/authentication/tc-10.7.md#tc-1072-session-expired-please-sign-in-again-notification-appears-after-401):
    "Session expired. Please sign in again." notification appears after 401

## FR-11: Data Export

### [FR-11.1](functional-requirements.md#fr-11-data-export): Export table view to CSV

- [SR-11.1](system-requirements/export.md): CSV export is accessible when the table view is active
  - [TC-11.1.1](test-cases/export/tc-11.1.md#tc-1111-an-export-csv-button-is-visible-in-the-table-toolbar-when-table-view-is-active):
    An "Export CSV" button is visible in the table toolbar when table view is active
  - [TC-11.1.2](test-cases/export/tc-11.1.md#tc-1112-export-csv-button-is-disabled-when-no-model-is-loaded):
    "Export CSV" button is disabled when no model is loaded

- [SR-11.2](system-requirements/export.md): CSV export includes all currently visible rows
  - [TC-11.2.1](test-cases/export/tc-11.2.md#tc-1121-csv-export-with-filters-applied-includes-only-the-visible-filtered-rows):
    CSV export with filters applied includes only the visible filtered rows
  - [TC-11.2.2](test-cases/export/tc-11.2.md#tc-1122-csv-export-with-no-filters-includes-all-elements-in-the-model):
    CSV export with no filters includes all elements in the model

- [SR-11.3](system-requirements/export.md): CSV format uses standard formatting with proper escaping
  of special characters
  - [TC-11.3.1](test-cases/export/tc-11.3.md#tc-1131-special-characters-in-element-names-are-correctly-escaped-in-csv-output):
    Special characters in element names are correctly escaped in CSV output
  - [TC-11.3.2](test-cases/export/tc-11.3.md#tc-1132-exported-csv-file-uses-utf-8-with-bom-encoding):
    Exported CSV file uses UTF-8 with BOM encoding

- [SR-11.7](system-requirements/export.md): Export provides progress feedback for large datasets
  - [TC-11.7.1](test-cases/export/tc-11.7.md#tc-1171-a-loading-indicator-appears-within-100ms-of-starting-a-large-csv-export-10000-rows):
    A loading indicator appears within 100ms of starting a large CSV export (>10,000 rows)
  - [TC-11.7.2](test-cases/export/tc-11.7.md#tc-1172-a-success-toast-notification-appears-after-export-completes):
    A success toast notification appears after export completes

- [SR-11.8](system-requirements/export.md): Export respects current filters
  - [TC-11.8.1](test-cases/export/tc-11.8.md#tc-1181-csv-export-with-applicationservice-unchecked-excludes-service-x-from-the-output):
    CSV export with ApplicationService unchecked excludes Service X from the output

### [FR-11.2](functional-requirements.md#fr-11-data-export): Export graph as image (PNG/SVG)

- [SR-11.4](system-requirements/export.md): Image export is accessible when the graph view is active
  - [TC-11.4.1](test-cases/export/tc-11.4.md#tc-1141-an-export-image-button-is-visible-in-the-graph-toolbar-when-graph-view-is-active):
    An "Export Image" button is visible in the graph toolbar when graph view is active
  - [TC-11.4.2](test-cases/export/tc-11.4.md#tc-1142-export-image-button-is-disabled-when-no-model-is-loaded):
    "Export Image" button is disabled when no model is loaded

- [SR-11.5](system-requirements/export.md): Image export supports both PNG and SVG formats
  - [TC-11.5.1](test-cases/export/tc-11.5.md#tc-1151-export-dropdown-presents-both-export-as-png-and-export-as-svg-options):
    Export dropdown presents both "Export as PNG" and "Export as SVG" options
  - [TC-11.5.2](test-cases/export/tc-11.5.md#tc-1152-selecting-export-as-svg-downloads-a-file-with-svg-extension):
    Selecting "Export as SVG" downloads a file with .svg extension

- [SR-11.6](system-requirements/export.md): Exported image faithfully reproduces the visible graph
  canvas, including any overlays present on it
  - [TC-11.6.1](test-cases/export/tc-11.6.md#tc-1161-exported-png-includes-the-legend-when-it-is-visible-on-the-canvas):
    Exported PNG includes the legend when it is visible on the canvas
  - [TC-11.6.2](test-cases/export/tc-11.6.md#tc-1162-exported-png-does-not-include-the-legend-when-it-is-hidden):
    Exported PNG does not include the legend when it is hidden

- [SR-11.8](system-requirements/export.md): Export respects current filters
  - [TC-11.8.2](test-cases/export/tc-11.8.md#tc-1182-graph-image-export-captures-only-visible-nodes-those-not-filtered-out):
    Graph image export captures only visible nodes (those not filtered out)
