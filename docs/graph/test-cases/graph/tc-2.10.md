# TC-2.10: Layout Refresh

**System Requirement**: [SR-2.10](../../system-requirements/graph.md)

## TC-2.10.1: Layout refresh re-applies the current layout algorithm

**Functional Requirements**: [FR-2.2](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; graph is displayed with a layout algorithm applied (default
  force-directed); nodes are in positioned state (layout completed)

### Test Steps

1. Record the current positions of several nodes (e.g., Component A, Component B, Service X)
2. Click the **layout refresh** button
   - **Expected**: The layout algorithm starts; nodes may animate to new positions; the layout
     follows the same algorithm and parameters as the initial layout
3. Wait for layout to complete
   - **Expected**: Graph stabilizes with nodes in a new arrangement following the current layout
     algorithm's logic

### Post-conditions

- Graph displays with nodes positioned by the current layout algorithm (may be different from
  initial positions)

### Test Data

| Field  | Value             |
| ------ | ----------------- |
| Model  | Test Architecture |
| Layout | Force-directed    |

## TC-2.10.2: Layout refresh preserves current zoom and pan state

**Functional Requirements**: [FR-2.2](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; user has zoomed in to ~2.5× and panned so the graph is not
  centered
- Layout is completed and graph is stable

### Test Steps

1. Record the current zoom level via `cy.zoom()` and note the pan position (e.g., by checking a
   node's rendered position relative to viewport)
2. Click the **layout refresh** button
   - **Expected**: Layout re-applies; nodes reposition; zoom level and pan position remain unchanged
     from before the refresh
3. After layout completes, check the zoom level
   - **Expected**: Zoom level is the same as before the refresh
4. Check the position of a specific node relative to the viewport
   - **Expected**: The overall view (pan) is preserved; nodes moved relative to each other according
     to layout, but the camera viewport remains at the same zoom and pan

### Post-conditions

- Graph is at the same zoom level and pan position as before the refresh; only node positions
  changed

### Test Data

| Field        | Value             |
| ------------ | ----------------- |
| Model        | Test Architecture |
| Initial zoom | ~2.5×             |
| Layout       | Force-directed    |

## TC-2.10.3: Layout refresh after manual node dragging resets dragged nodes to layout positions

**Functional Requirements**: [FR-2.2](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; layout is completed; user manually drags **Component A** to a
  different position

### Test Steps

1. Drag **Component A** to a new location on the canvas (e.g., far from its original position);
   release
   - **Expected**: **Component A** stays at the dragged position (temporarily)
2. Click the **layout refresh** button
   - **Expected**: All nodes, including **Component A**, participate in the layout; **Component A**
     animates back toward a layout-determined position
3. After layout completes, check **Component A** position
   - **Expected**: **Component A** is positioned according to the layout algorithm; it is no longer
     at the manually dragged location

### Post-conditions

- All nodes follow the current layout; manual adjustments are overridden

### Test Data

| Field        | Value             |
| ------------ | ----------------- |
| Model        | Test Architecture |
| Dragged node | Component A       |
| Layout       | Force-directed    |

## TC-2.10.4: Refresh during active layout cancels or postpones previous layout

**Functional Requirements**: [FR-2.2](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded with a large graph (e.g., 500+ nodes) where layout computation
  takes several seconds
- User triggers a layout refresh (first refresh) and the layout is still running

### Test Steps

1. Initiate layout refresh by clicking the button
2. Before the first layout completes, click the **layout refresh** button again quickly
   - **Expected**: The second refresh either:
     - Option A (ignore): The second click is ignored; the first layout continues uninterrupted; no
       additional layout starts
     - Option B (cancel and restart): The first layout is cancelled; a new layout starts from the
       current state
3. Observe the behavior and verify that after completion, the graph shows a valid layout
   - **Expected**: Final layout corresponds to one of the refresh operations (either the first or
     the second); graph is stable

### Post-conditions

- Graph is positioned according to a layout algorithm; no layout is running

### Test Data

| Field  | Value                           |
| ------ | ------------------------------- |
| Model  | Large architecture (500+ nodes) |
| Layout | Force-directed                  |
