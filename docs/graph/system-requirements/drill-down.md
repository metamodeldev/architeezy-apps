# SR-4: Drill-Down Analysis

**Functional Requirements**:
[FR-4.1, FR-4.2, FR-4.3, FR-4.4](../functional-requirements.md#fr-4-drill-down-analysis)

## User Story

As a user, I want to focus on a specific node and its surroundings to analyze a subset of the model
in detail, controlling the depth of the drill and being able to return to the full model view.

## Acceptance Criteria

- [SR-4.1](#sr-41-drill-mode-can-be-activated-from-any-node): Drill mode can be activated from any
  node
- [SR-4.2](#sr-42-drill-bar-shows-selected-node-and-exit-option): Drill bar shows selected node and
  exit option
- [SR-4.3](#sr-43-selected-node-remains-visible-even-if-its-type-is-filtered): Selected node remains
  visible even if its type is filtered
- [SR-4.4](#sr-44-graph-shows-nodes-within-configurable-depth-from-selected-node): Graph shows nodes
  within configurable depth from selected node
- [SR-4.5](#sr-45-only-edges-connecting-visible-nodes-are-shown): Only edges connecting visible
  nodes are shown
- [SR-4.6](#sr-46-depth-is-adjustable-within-a-defined-range): Depth is adjustable within a defined
  range
- [SR-4.7](#sr-47-exiting-drill-returns-to-full-model-view-with-current-filters): Exiting drill
  returns to full model view with current filters
- [SR-4.8](#sr-48-drill-mode-respects-active-element-and-relationship-type-filters): Drill mode
  respects active element and relationship type filters
- [SR-4.9](#sr-49-count-badges-update-to-show-visibletotal-considering-drill-scope-and-filters):
  Count badges update to show visible/total considering drill scope and filters
- [SR-4.10](#sr-410-drill-state-persists-in-url-for-sharing): Drill state persists in URL for
  sharing

## Scenarios

### SR-4.1: Drill mode can be activated from any node

#### Preconditions

- Model is loaded with graph displaying multiple nodes and relationships
- User has identified a node of interest
- No drill mode is currently active

#### Steps

1. **Double-click a node**
   - The selected node receives special visual highlighting (border color or glow effect)
   - A drill bar appears below the header

2. **Observe the updated graph**
   - Nodes within the default depth level from the selected node become visible
   - Nodes outside that depth are hidden
   - The selected node is always visible regardless of its element type filter

3. **Observe edges**
   - Only edges connecting currently visible nodes are displayed
   - Edges to hidden nodes disappear

#### Edge Cases

- **Exit and immediately re-enter drill on same node** — drill activates correctly; depth resets to
  default value

### SR-4.2: Drill bar shows selected node and exit option

#### Preconditions

- Drill mode is active on a selected node
- The drill bar is visible below the header

#### Steps

1. **Inspect the drill bar**
   - The drill bar displays the selected node's label
   - A "Full model" or "Exit drill" button is present in the drill bar

2. **Verify label accuracy**
   - The node name shown matches the node that was double-clicked to enter drill mode

3. **Interact with the exit button**
   - The exit button is clickable and accessible

#### Edge Cases

- **Node label is very long** — label truncates or wraps within the drill bar without breaking the
  layout

### SR-4.3: Selected node remains visible even if its type is filtered

#### Preconditions

- Drill mode is active on a selected node
- The element type of the selected node is currently toggled off in filters

#### Steps

1. **Observe the selected node**
   - The selected node appears in the graph despite its element type being filtered out

2. **Toggle the element type filter off**
   - Other nodes of that type disappear from the graph
   - The selected (drill root) node remains visible

3. **Toggle the element type filter back on**
   - Other nodes of that type reappear
   - The selected node was already visible and continues to be highlighted

#### Edge Cases

- **Drill root's type is filtered out** — the selected node remains visible as an exception to
  element type filters; edges from the selected node are still subject to relationship type filters;
  the selected node is counted in the visible count
- **Filter makes drill root isolated** — if all outgoing edges of the selected node are filtered
  out, only the selected node remains visible; this is acceptable

### SR-4.4: Graph shows nodes within configurable depth from selected node

#### Preconditions

- Drill mode is active
- Default depth level is applied

#### Steps

1. **Observe initial drill scope**
   - Nodes directly connected to the selected node (depth 1) are visible
   - Nodes beyond the current depth are hidden

2. **Increase the depth level**
   - The graph expands to show nodes further from the selected node
   - Newly reachable nodes appear in the graph

3. **Decrease the depth level**
   - Nodes that are now beyond the new depth limit disappear
   - The graph contracts to the closer neighborhood

#### Edge Cases

- **Large drill depth on large graph** — traversal explores many nodes; performance remains
  acceptable for typical models but may briefly affect responsiveness
- **Multi-component graph (disconnected sections)** — traversal only explores the component
  containing the selected node; other components remain hidden
- **Cyclic graphs** — cycles within the drill depth are all visible if reachable; visited node
  tracking prevents infinite loops

### SR-4.5: Only edges connecting visible nodes are shown

#### Preconditions

- Drill mode is active with a set of visible nodes determined by depth and filters

#### Steps

1. **Observe edges in drill mode**
   - Only edges where both endpoints are currently visible are displayed
   - Edges to hidden nodes are not shown

2. **Change depth to hide some nodes**
   - Nodes that drop out of the visible set disappear
   - Edges to those nodes also disappear immediately

3. **Change depth to reveal more nodes**
   - Newly visible nodes appear
   - Edges connecting them to the rest of the visible set appear as well

#### Edge Cases

- **Relationship type filter active** — edges of filtered-out types are hidden even if both
  endpoints are visible

### SR-4.6: Depth is adjustable within a defined range

#### Preconditions

- Drill mode is active
- Depth picker is visible in the settings area

#### Steps

1. **Inspect the depth picker**
   - Buttons for available depth levels (e.g., 1–5) are displayed
   - The current depth level is highlighted

2. **Select a different depth level**
   - The graph updates to reflect the new depth
   - Count badges update to show the new visible/total counts

3. **Attempt to go beyond the maximum depth**
   - No option beyond the defined maximum is available
   - The picker does not allow out-of-range selection

#### Edge Cases

- **Depth at minimum (1)** — only direct neighbors of the selected node are visible
- **Depth at maximum (5)** — the widest neighborhood within the model is visible

### SR-4.7: Exiting drill returns to full model view with current filters

#### Preconditions

- Drill mode is active
- Some element and/or relationship type filters may be toggled on or off

#### Steps

1. **Click the exit drill button on the drill bar**
   - The drill bar hides
   - The selected node loses its special highlighting

2. **Observe the restored graph**
   - The full model becomes visible, subject only to the currently active filters
   - All edges that were hidden by the drill scope reappear if their endpoints are visible

3. **Inspect count badges**
   - Count badges now reflect the full model counts without drill scope limitations

#### Edge Cases

- **Exit while graph is updating** — state cleanup proceeds normally with no visual artifacts
- **Exit and immediately re-enter drill on same node** — this is allowed and works correctly; depth
  resets to default

### SR-4.8: Drill mode respects active element and relationship type filters

#### Preconditions

- Drill mode is active
- At least one element or relationship type filter is toggled off

#### Steps

1. **Observe drill scope with filters applied**
   - Nodes whose element types are filtered out do not appear in the drill scope (except the
     selected node)
   - Edges of filtered-out relationship types are not shown

2. **Toggle an element type filter off while in drill mode**
   - Nodes of that type disappear from the drill scope
   - Nodes that were only reachable through those now-hidden nodes may also disappear

3. **Toggle a relationship type filter off while in drill mode**
   - Edges of that type disappear
   - Nodes only reachable via those edges may also disappear from the drill scope

#### Edge Cases

- **All filters toggled off** — only the selected node remains visible (it is always shown)

### SR-4.9: Count badges update to show visible/total considering drill scope and filters

#### Preconditions

- Drill mode is active
- Count badges are visible in the UI

#### Steps

1. **Observe count badges on entering drill mode**
   - Each count badge shows the number of visible elements over the total (e.g., "3/12")
   - The visible count reflects the drill scope combined with active filters

2. **Adjust drill depth**
   - Count badges update immediately to reflect the new number of visible nodes

3. **Toggle a filter while in drill mode**
   - Count badges update to reflect the intersection of filter state and drill scope

#### Edge Cases

- **All nodes filtered out except selected node** — count badge shows "1/N"

### SR-4.10: Drill state persists in URL for sharing

#### Preconditions

- Drill mode is active on a selected node with a specific depth

#### Steps

1. **Inspect the browser URL while in drill mode**
   - The URL contains parameters representing the selected node and current depth

2. **Copy and open the URL in a new browser tab**
   - The application loads and enters drill mode on the same node at the same depth

3. **Exit drill mode**
   - The URL updates to remove the drill parameters

#### Edge Cases

- **URL contains drill state for a node that no longer exists in the model** — drill state is
  ignored and full model view is shown

## Business Rules

- The drill scope is computed via graph traversal from the selected node.
- Depth has a defined range (typically 1-5) with a default of 1.
- The selected node is always included in the visible set regardless of element type filter.
- Traversal follows edges that are of active relationship types or are containment edges.
- Nodes beyond the selected node are included only if their element type is active.
- Edges are shown when both endpoints are in the visible set and within the depth constraint.
- URL includes drill parameters when drill mode is active.
- Exiting drill clears all drill-related state and restores the full view.
- Drill state synchronizes with URL when changes occur.
- Initial application startup or deep link handling reads drill parameters from the URL.

## UI/UX

### Responsiveness and Smoothness

- Drill mode activates quickly.
- Depth adjustment responds immediately.
- Filter changes propagate correctly through the drill scope calculation.
- Exiting drill is instantaneous.
- All transitions are smooth without jarring movements.

### Visual Design

- A drill bar appears below the header, containing a "Full model" or "Exit drill" button and the
  selected node label.
- The drill root node is distinctly highlighted with a border color or glow effect, optionally with
  a shadow, to differentiate it from regular selection; this styling persists throughout drill mode.
- Graph zoom and pan position are preserved when entering and exiting drill mode.
- Depth picker buttons appear in settings when drill mode is active; the current level is
  highlighted.
- No confirmation dialogs are required for drill mode actions.

## Technical Notes

### Scope Calculation

Scope rules are defined in Business Rules. Implementation uses a breadth-first traversal:

- Traversal tracks the depth (distance) of each node from the root.
- Node visibility condition: node is the root OR (node type is active AND depth ≤ current drill
  depth).
- Edge visibility condition: both endpoints are visible AND at least one endpoint has depth less
  than the drill depth.

### Layout During Drill Mode

- When drill mode activates, the graph layout is reapplied using the **breadthfirst** algorithm with
  the selected (drill root) node positioned at the center.
- This radial layout arrangement helps visualize the neighborhood around the drill root.
- After drill mode exit, the previous layout algorithm is restored.
- Layout animation may be used if node count is within the performance threshold (< 400 visible
  nodes).

### State Management

- Variables track the selected node identifier, current depth, and set of visible node identifiers.
- Drill state is applied after filter visibility calculations.
- Changes to filters or depth trigger recalculation of the drill scope.

### URL Integration

- Drill parameters are included in the URL when drill mode is active.
- On initial load or when navigating with browser back/forward buttons, drill parameters are read
  from the URL and applied.
- Drill state is validated against the current graph before being applied.

### Integration with Other Features

- **Filter interaction**: Filters affect drill scope; the selected node is an exception to element
  type filtering.
- **Graph rendering**: Node and edge visibility is controlled based on the intersection of filter
  state and drill scope.
- **Table view**: Table rows are filtered to show only elements within the current drill scope.
- **Containment mode**: Compound node parents are handled correctly when the parent is filtered out.

### Performance

- Traversal is synchronous; for very large graphs, consider optimization techniques.
- Current implementation is acceptable for typical model sizes.
