# TC-2.4: Zoom and Pan Navigation

**System Requirement**: [SR-2.4](../../system-requirements/graph.md)

## TC-2.4.1: Mouse-wheel zoom centers on cursor position

**Functional Requirements**: [FR-2.3](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; all 3 nodes are visible; zoom level is approximately 1× (default)

### Test Steps

1. Position the cursor over **Component A**; scroll the mouse wheel **up 3 times**
   - **Expected**: The graph zooms in; nodes appear larger; the zoom factor increases by
     approximately 1.3× per step (≈2.2× after 3 steps); **Component A** remains near the cursor
     position; it is still visible on the canvas
2. Scroll the mouse wheel **down 6 times**
   - **Expected**: The graph zooms out; zoom level decreases; the minimum zoom limit (0.1×) is not
     exceeded even if the user scrolls further down

### Post-conditions

- Graph is visible; zoom is at or above 0.1×

### Test Data

| Field         | Value             |
| ------------- | ----------------- |
| Model         | Test Architecture |
| Cursor target | Component A       |
| Scroll up     | 3 steps (~2.2×)   |
| Minimum zoom  | 0.1×              |
| Maximum zoom  | 5×                |

## TC-2.4.2: Fit-to-view button shows all visible nodes with padding

**Functional Requirements**: [FR-2.3](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; user has zoomed in to ~4× so only **Component A** is visible

### Test Steps

1. Click the **fit-to-view** button (⤢, bottom-right controls)
   - **Expected**: The camera adjusts to show all 3 nodes (**Component A**, **Component B**,
     **Service X**) within the viewport; approximately 10% padding is visible on all sides; no node
     is clipped by the viewport edge

### Post-conditions

- All 3 nodes are visible with padding

### Test Data

| Field          | Value             |
| -------------- | ----------------- |
| Model          | Test Architecture |
| Pre-zoom level | ~4×               |
| Expected nodes | 3 (all visible)   |
| Padding        | ~10%              |
