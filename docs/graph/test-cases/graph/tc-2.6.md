# TC-2.6: Highlight Mode

**System Requirement**: [SR-2.6](../../system-requirements/graph.md#sr-26-highlight-mode)

## TC-2.6.1: Enable Highlight mode via toggle

### Preconditions

- Graph view active
- Highlight mode is currently off

### Steps

1. Locate the "Highlight" toggle in visualization settings or toolbar
2. Turn it ON
   - Toggle changes to active state (e.g., colored/pressed)
   - No visible change until a node is selected, but the mode is now active
   - Highlight mode is enabled; subsequent selections will trigger dimming

### Test Data

| Action     | Highlight toggle state |
| ---------- | ---------------------- |
| toggle ON  | on                     |
| toggle OFF | off                    |

## TC-2.6.2: Selected node's neighborhood remains visible; others dim

### Preconditions

- Highlight mode is ON
- A node is selected (from TC-2.5)

### Steps

1. With a node selected, observe the graph
   - Selected node: 100% opacity (fully opaque)
   - Neighbors (nodes directly connected by an edge): 100% opacity
   - All other nodes: 35% opacity (dimmed)
   - Edges:
     - Edges connecting selected node to neighbors: 100% opacity
     - Edges between neighbors: 100% opacity (if direct connections)
     - All other edges: 15% opacity (more dimmed)
2. Deselect
   - All elements return to 100% opacity (unless other filters cause dimming)
   - Spotlight effect on selected subgraph
   - Opacity values match specification (nodes 35%, edges 15% for dimmed)

### Test Data

| Element type              | Opacity (dimmed state) |
| ------------------------- | ---------------------- |
| non-neighbor nodes        | 35%                    |
| non-neighbor edges        | 15%                    |
| selected node + neighbors | 100%                   |
| edges among neighbors     | 100%                   |

## TC-2.6.3: Adjust exploration depth while Highlight is active

### Preconditions

- Highlight mode is ON
- A node is selected (depth=1 by default)

### Steps

1. Locate depth control (e.g., slider, "+"/"-" buttons, or input field labeled "Depth")
2. Increase depth to 2
   - The highlight region expands to include:
     - Selected node (depth 0)
     - Its immediate neighbors (depth 1) - already visible
     - Neighbors of neighbors (depth 2) - now showing at 100% opacity
     - Nodes at depth >2 become dimmed (35%)
3. Decrease depth to 1
   - Region shrinks; depth 2 nodes become dimmed again
4. Increase depth to 3, then 4, up to maximum 5
   - Region expands stepwise; at depth 5, all nodes within distance 5 are fully opaque
   - Depth control adjusts highlight scope dynamically
   - Maximum depth is 5 levels

### Test Data

| Depth | Nodes with 100% opacity                       |
| ----- | --------------------------------------------- |
| 1     | selected + direct neighbors                   |
| 2     | selected + neighbors + neighbors-of-neighbors |
| 3     | ... up to distance 3                          |
| 5     | max allowed depth                             |

## TC-2.6.4: Depth change does not trigger layout recalculation

**Related to**: Business rule: "Highlight Exception: Changes in the Highlight scope (including
depth) do not trigger a relayout."

### Preconditions

- Highlight mode ON
- Node selected, depth=1
- Layout algorithm: Force-Directed (nodes in certain positions)

### Steps

1. While watching for any node movement, increase Highlight depth to 2
   - Oppacity changes, but node positions remain exactly the same; no animation for layout
2. Change depth to 3, 4
   - Same: visual dimming changes, but layout preserved
   - Node positions static during depth changes
   - Performance: no expensive layout ops

### Test Data

| Depth change | Layout recalculated? |
| ------------ | -------------------- |
| 1 → 3        | no                   |

## TC-2.6.5: Maximum depth is 5 levels

### Preconditions

- Highlight mode ON, node selected
- Depth control available

### Steps

1. Attempt to increase depth beyond 5 (e.g., try setting to 6 or using + when at 5)
   - Depth stops at 5; UI either disables the increase control or shows maximum reached
2. Verify depth=5 includes all nodes within 5 hops
   - Nodes up to 5 edges away from selected node are fully opaque
   - Depth limit enforced at 5

### Test Data

| Max depth allowed | Allowed? |
| ----------------- | -------- |
| 5                 | yes      |
| 6                 | no       |

## TC-2.6.6: Highlight respects drill-down scope? (Edge case)

### Preconditions

- Drill-down mode is active (different scope)
- Highlight mode also ON

### Steps

1. Set Highlight depth to 1 while in drill-down
   - Behavior: maybe Highlight is disabled during drill-down? Or it operates within the drill-down
     subgraph only?
   - Document whichever is implemented: if Highlight adds to drill-down, the combined scope =
     drill-down scope + highlight neighbors within it
2. Exit drill-down, return to full graph, keep Highlight on
   - Highlight operates on full graph scope again
   - Interaction between Highlight and Drill-down is clear

### Test Data

| Scenario               | Expected highlight behavior           |
| ---------------------- | ------------------------------------- |
| Drill-down + Highlight | defined by implementation (see notes) |

## TC-2.6.7: Toggle Highlight OFF restores normal view

### Preconditions

- Highlight mode is ON
- A node is selected, showing dimming effect

### Steps

1. Turn Highlight toggle OFF
   - All nodes return to 100% opacity immediately
   - Selection highlight may remain on the node (if separate from highlight dimming), or selection
     may also be cleared
2. Verify no dimming persists
   - Graph returns to pre-highlight appearance (except any active filters)
   - Highlight can be disabled at any time

### Test Data

| Action               | Dimming persists? |
| -------------------- | ----------------- |
| Highlight toggle OFF | no                |

## TC-2.6.8: Highlight mode works with filter changes

### Preconditions

- Highlight mode ON
- Node A selected

### Steps

1. While highlight active, uncheck an entity type that includes some highlighted nodes
   - Those nodes disappear (due to filter), highlight region recalculates among remaining visible
     nodes
2. Re-check that entity type
   - Nodes reappear and are dimmed or highlighted based on their distance from selected node
   - Highlight scope respects filter-driven visibility changes

### Test Data

| Filter change during highlight | Effect on highlight region               |
| ------------------------------ | ---------------------------------------- |
| hide some neighbor nodes       | region shrinks to visible neighbors      |
| show hidden nodes              | nodes added, opacity determined by depth |
