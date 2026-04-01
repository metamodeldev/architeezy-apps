# TC-2.7: Drill-down

**System Requirement**: [SR-2.7](../../system-requirements/graph.md#sr-27-drill-down)

## TC-2.7.1: Enter drill-down mode on a node (double-click)

### Preconditions

- Graph view active
- Model with many nodes, connections
- Normal graph view showing full model

### Steps

1. Double-click on a specific node (e.g., "OrderService")
   - Graph clears everything except:
     - The root node (OrderService)
     - Its immediate neighbors (directly connected nodes)
     - Edges connecting root to neighbors
   - A drill-down navigation bar appears, showing:
     - Current root name
     - Depth indicator (initially 1)
     - Controls to increase/decrease depth
     - Close button or breadcrumb to exit
2. Verify URL update
   - URL contains drill-down parameters (e.g., `?entity=order-service-id&depth=1`)
3. Verify history entry added
   - Browser history includes the drill-down state
   - Drill-down mode active
   - Scope restricted to root + depth=1 neighbors
   - Navigation bar visible

### Test Data

| Action            | Result (graph content)     | URL change      |
| ----------------- | -------------------------- | --------------- |
| double-click root | root + neighbors (depth 1) | yes (pushState) |

## TC-2.7.2: Increase drill-down depth expands the scope

### Preconditions

- Drill-down mode active on node A (depth=1)
- Visible: node A + its direct neighbors (say 5 nodes)

### Steps

1. Click "Increase depth" button (or use `+` if bound)
   - Graph adds neighbors of the current visible set (depth=2)
   - Total visible nodes increase (e.g., from 6 to 20)
   - Layout recalculates to accommodate new nodes
2. Increase depth again to 3
   - Further expansion to depth 3 nodes
3. Continue to maximum depth (5)
   - Graph expands to include all nodes within 5 hops of root
   - Depth control works smoothly
   - Layout updates with each expansion

### Test Data

| Depth | Approximate visible node count (depends on connectivity) |
| ----- | -------------------------------------------------------- |
| 1     | 1 (root) + degree(root) = ~6                             |
| 2     | root + depth1 + depth2 = ~20                             |
| 3     | ... up to max 5                                          |

## TC-2.7.3: Decrease depth shrinks the scope

### Preconditions

- Drill-down depth=3 (many nodes visible)

### Steps

1. Click "Decrease depth" button (or `-`)
   - Nodes at depth=3 are removed from view
   - Graph layout recalculates for remaining nodes (depth≤2)
2. Decrease to depth=2, then 1
   - Graph shrinks accordingly
3. At depth=1, further decrease is not possible (or stays at 1)
   - Depth control may disable decrease at minimum
   - Depth can be reduced stepwise
   - Minimum depth=1 (root + immediate neighbors)

### Test Data

| Depth change | Nodes removed? | Layout recalc? |
| ------------ | -------------- | -------------- |
| 3 → 2        | depth 3 nodes  | yes            |
| 2 → 1        | depth 2 nodes  | yes            |

## TC-2.7.4: Exit drill-down via application name in header

### Preconditions

- Drill-down mode active
- Drill-down navigation bar visible with root name

### Steps

1. Click on the application name/logo in the header (or a breadcrumb labeled with app name)
   - Drill-down mode exits
   - Graph returns to full model view (all nodes that match current filters)
   - Drill-down navigation bar disappears
   - URL updates (drill-down parameters removed)
   - History: either pushState new full view or pop to previous? Usually clicking the root navigator
     exits drill-down.
   - Full model restored
   - Drill-down UI cleared

### Test Data

| Action                | Exit drill-down? | Graph content             |
| --------------------- | ---------------- | ------------------------- |
| click header/app name | yes              | full model (post-filters) |

## TC-2.7.5: Drill-down uses BFS to compute visible set

**Technical note**: Should use breath-first search up to specified depth.

### Preconditions

- Complex graph with branching
- Root node with multiple neighbors, second-level neighbors, etc.

### Steps

1. Enable drill-down depth=2 on a root
   - All nodes reachable within ≤2 edges from root are included
   - No node at distance 3 appears
2. Verify by checking a specific node at distance 2 from root
   - That node is visible
3. Verify a node at distance 3 from root
   - That node is NOT visible
   - BFS correctly limits to N hops

### Test Data

| Root | Depth limit | Nodes at distance ≤N included? |
| ---- | ----------- | ------------------------------ |
| A    | 2           | yes (distance 1 & 2 nodes)     |
| A    | 2           | no (distance 3 nodes)          |

## TC-2.7.6: Drill-down respects current entity filters

### Preconditions

- Entity filters: only `Microservice` and `Queue` checked; `Database` unchecked
- Drill-down not active yet

### Steps

1. Enter drill-down on a `Microservice` node
   - Root: the Microservice node
   - Neighbors: only those that are `Microservice` or `Queue` (since Database is filtered)
   - Even if a `Database` node is directly connected, it is excluded from the drill-down scope
2. Increase depth
   - At each depth step, only entities of allowed types appear
   - Drill-down scope = (BFS from root) ∩ (Active Entity Types)
   - Filters apply even within drill-down

### Test Data

| Entity filter            | Root type    | Expected neighbor types at depth 1 |
| ------------------------ | ------------ | ---------------------------------- |
| Microservice, Queue only | Microservice | Microservice, Queue (no Database)  |

## TC-2.7.7: Drill-down URL parameters encode entity and depth

### Preconditions

- Graph view, drill-down not active

### Steps

1. Double-click node with ID "order-123"
   - URL updates to include `?entity=order-123&depth=1` (or similar)
2. Increase depth to 3 via UI
   - URL updates to `&depth=3` (replaceState)
3. Copy the URL and open in a new tab
   - New tab loads directly into drill-down mode with that entity and depth
   - Deep linking to drill-down state works

### Test Data

| URL format example                  | Loads?                             |
| ----------------------------------- | ---------------------------------- |
| `/graph/?entity=order-123&depth=2`  | yes                                |
| `/graph/?entity=invalid-id&depth=1` | no (error or fallback to selector) |

## TC-2.7.8: Breadcrumb/navigation bar shows current root and depth

### Preconditions

- Drill-down active on node "PaymentService" at depth=2

### Steps

1. Observe the drill-down navigation bar (usually at top of graph or below main header)
   - Shows:
     - Root name: "PaymentService"
     - Breadcrumb or title indicating drill-down mode
     - Depth indicator: "Depth: 2" or "Level 2"
     - Buttons: Increase depth (+), Decrease depth (-)
     - Close/exit button (X or "Back to full model")
2. Change depth to 3
   - Depth indicator updates to "3"
3. Click close/exit
   - Bar disappears, full model loads
   - User can see current drill-down context
   - Controls are accessible

### Test Data

| UI element      | Expected content       |
| --------------- | ---------------------- |
| Root name       | PaymentService         |
| Depth indicator | "Depth: 2" or similar  |
| Depth controls  | + and - buttons        |
| Exit control    | X or "Exit drill-down" |

## TC-2.7.9: Drill-down on a node already in drill-down scope changes root

### Preconditions

- Drill-down active on root A, depth=2
- Several neighbor nodes visible within scope

### Steps

1. Double-click on a different visible node B (which is currently a neighbor within the scope)
   - Drill-down root changes from A to B
   - Scope resets to B's immediate neighbors (depth effectively becomes 1, or retained?
     Implementation choice)
   - Navigation bar updates to show root B
   - URL updates to reflect new root entity
2. Can continue drilling from B
   - Depth controls still work; can increase from B's default (likely depth=1)
   - User can re-root drill-down to a different node within current view

### Test Data

| Initial root | Double-click on | New root? | Depth reset?                         |
| ------------ | --------------- | --------- | ------------------------------------ |
| A            | B (neighbor)    | B         | usually yes (to 1) or optional keep? |

## TC-2.7.10: Exit drill-down preserves previous layout state

### Preconditions

- Graph view with a loaded model
- A custom layout (different from default) has been applied
- User manually positioned some nodes or ran a specific layout algorithm (e.g., Dagre)
- Node positions are stable

### Steps

1. Note the current node positions (layout state)
2. Double-click a node to enter drill-down mode
   - Drill-down layout applied (nodes arranged around drill root)
3. Exit drill-down by clicking the application name in the header
   - Graph returns to full model view
   - **Verify node positions match the layout state from step 1** (preserved)
   - Viewport (zoom/pan) should also be preserved if it existed before drill-down
4. Change the layout algorithm (e.g., from Dagre to FCose) and apply it
5. Re-enter drill-down on the same or different node
6. Exit drill-down again
   - **Verify node positions reflect the most recent layout** (Dagre → FCose pattern)
   - Viewport updated accordingly

### Expected Results

- When drill-down is exited, the graph **preserves** the layout that was active before entering
  drill-down
- Layout positions and viewport are **not lost** during drill-down transition
- The layout algorithm selected by the user remains respected after exit

### Test Data

| Scenario                       | Layout preservation expected? |
| ------------------------------ | ----------------------------- |
| Normal drill-down enter → exit | Yes (previous layout kept)    |
| Via URL (no previous state)    | No (apply fresh layout)       |

## TC-2.7.11: Exit drill-down with no previous state applies fresh layout

### Preconditions

- Graph view with a loaded model
- Drill-down mode was **entered via direct URL** (e.g., user opened
  `/graph/?entity=node-id&depth=2`)
- No prior graph state or layout positions existed in the session

### Steps

1. Observe the graph in drill-down mode (loaded via URL)
2. Click the application name to exit drill-down
   - Full model view is restored
   - **Verify layout algorithm runs** to arrange the full graph
   - Nodes should be positioned according to the current layout setting (not stuck in a
     minimal/default state)
3. Verify the graph is fully visible and nodes are properly arranged
   - No overlapping or collapsed nodes
   - Layout consistent with selected algorithm

### Expected Results

- When exiting drill-down that was opened without a previous graph state (e.g., direct link), the
  system **applies the current layout algorithm** to the full model
- Graph shapes are properly displayed with correct positioning
- The behavior ensures a good user experience even when drill-down is the entry point
