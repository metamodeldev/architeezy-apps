# SR-4: Drill-Down Analysis

**Functional Requirements**:
[FR-4.1, FR-4.2, FR-4.3, FR-4.4](../functional-requirements.md#fr-4-drill-down-analysis)

## User Story

As a user, I want to focus on a specific node and its surroundings to analyze a subset of the model
in detail, controlling the depth of the drill and being able to return to the full model view.

## Acceptance Criteria

- SR-4.1: Double-click activates drill mode from any node
- SR-4.2: Drill bar shows selected node and exit option
- SR-4.3: Selected node remains visible even if its type is filtered
- SR-4.4: Graph shows nodes within configurable depth from selected node
- SR-4.5: Only edges connecting visible nodes are shown
- SR-4.6: Depth adjustable (typically 1-5 levels)
- SR-4.7: Exiting drill returns to full model view with current filters
- SR-4.8: Drill mode respects active element and relationship type filters
- SR-4.9: Count badges update to show visible/total considering drill scope and filters
- SR-4.10: Drill state persists in URL for sharing

## Scenario

### Preconditions

- Model is loaded with graph displaying multiple nodes and relationships
- User has identified a node of interest

### Steps

1. **Enter Drill Mode**
   - User double-clicks on a node of interest
   - Drill bar appears showing a "Full model" or "Exit drill" button and the selected node name
   - The selected node receives special visual highlighting
   - Graph updates to show:
     - The selected node (always visible, even if its type is normally filtered)
     - Nodes within the current depth level (number of connection hops) from the selected node
     - Edges connecting visible nodes, subject to relationship type filters
   - The scope of visible nodes is calculated using a graph traversal algorithm

2. **Adjust Drill Depth**
   - Depth control becomes visible in the settings area
   - The depth picker shows buttons for available depth levels (e.g., 1-5) with the current level
     highlighted
   - User selects a different depth level
   - The traversal recalculates with the new depth
   - Graph updates to show more or fewer nodes based on the new depth
   - Count badges update to reflect the current visible count over total
   - Edges are pruned according to the depth boundary

3. **Apply Filters While in Drill**
   - User toggles element or relationship type filters
   - The drill scope recalculates, taking filters into account
   - Nodes that no longer match type filters disappear
   - Their neighbors may become unreachable and also be removed (transitive effect)
   - Graph updates
   - Count decreases accordingly
   - The selected node remains visible regardless of type filter

4. **Exit Drill Mode**
   - User clicks the exit drill button on the drill bar
   - Drill bar hides
   - Drill state is cleared
   - Graph restores to full model view (subject only to current element and relationship filters)
   - All appropriate edges become visible again
   - Count badges show counts without drill scope limitations
   - The selected node loses special highlighting
   - URL updates to remove drill parameters

5. **Scope Calculation Logic**
   - Traversal starts from the selected node
   - Traversal follows edges of active relationship types and containment edges
   - A node is added to the visible set if it is the selected node or if its element type is active
   - Edges are shown when both endpoints are in the visible set and the endpoint depths are within
     the drill depth

### Expected Results

- Drill mode activates quickly
- Selected node is distinctly highlighted
- Only expected nodes are visible based on traversal from the selected node
- Counts update accurately as depth or filters change
- Depth adjustment responds immediately
- Filter changes propagate correctly through the drill scope calculation
- Exit is instantaneous
- No drill state remains after exiting
- URL correctly represents drill state when active

### Edge Cases

- **Drill root's type is filtered out**
  - The selected node remains visible as an exception to element type filters
  - Edges from the selected node are subject to relationship type filters as usual
  - The selected node is counted in the visible count

- **Filter makes drill root isolated**
  - If the selected node's outgoing edges are all filtered out, only the selected node remains
    visible
  - This is acceptable — user has filtered out all connections

- **Large drill depth on large graph**
  - Traversal may explore many nodes
  - Performance should remain acceptable for typical models; may briefly affect responsiveness

- **Multi-component graph (disconnected sections)**
  - Traversal only explores the component containing the selected node
  - Other components remain hidden
  - This is expected — drill provides focused exploration

- **Cyclic graphs**
  - Traversal uses a visited set to avoid infinite loops
  - Cycles within the drill depth are all visible if reachable

- **Exit while graph is updating**
  - State cleanup should proceed normally
  - No race conditions

- **Exit and immediately re-enter drill on same node**
  - This is allowed and works correctly
  - Depth resets to default value

## Business Rules

- Drill mode is activated by double-click; single-click has a delay to distinguish from
  double-click.
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

- A drill bar appears below the header, containing a "Full model" or "Exit drill" button and the
  selected node label.
- Selected node is visually distinguished (e.g., with a distinctive border color).
- Graph zoom and pan position are preserved when entering and exiting drill mode.
- Depth picker buttons appear in settings when drill mode is active; the current level is
  highlighted.
- Transitions are smooth; no confirmation dialogs are required.

## Technical Notes

### Scope Calculation

- A breadth-first traversal algorithm starting from the selected node determines which nodes are
  within drill scope.
- Traversal tracks the depth (distance) of each node from the root.
- The traversal respects active relationship type filters and always includes containment edges.
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

### Drill Root Styling

- The selected drill root node receives distinct visual styling to emphasize its importance:
  - Different border color or glow effect
  - May have special shadow or highlight
  - Remains distinctly styled throughout drill mode
- This styling should be consistent with the overall selection highlight but sufficiently
  distinguishable.

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
