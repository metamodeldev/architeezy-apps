# TC-2.7: Drill-down

**System Requirement**: [SR-2.7](../../system-requirements/graph.md#sr-27-drill-down)

## TC-2.7.1: Enter drill-down mode on a node (double-click)

### Preconditions

- Graph view active
- Model with many nodes, connections
- Normal graph view showing full model

### Test Steps

1. Double-click on a specific node (e.g., "OrderService")
   - **Expected**:
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
   - **Expected**: URL contains drill-down parameters (e.g., `?entity=order-service-id&depth=1`)
3. Verify history entry added
   - **Expected**: Browser history includes the drill-down state

### Post-conditions

- Drill-down mode active
- Scope restricted to root + depth=1 neighbors
- Navigation bar visible

### Test Data

| Action          | Result (graph content)                 | URL change |
| --------------- | -------------------------------------- | ---------- |
| double-click root | root + neighbors (depth 1)           | yes (pushState) |

## TC-2.7.2: Increase drill-down depth expands the scope

### Preconditions

- Drill-down mode active on node A (depth=1)
- Visible: node A + its direct neighbors (say 5 nodes)

### Test Steps

1. Click "Increase depth" button (or use `+` if bound)
   - **Expected**: Graph adds neighbors of the current visible set (depth=2)
   - Total visible nodes increase (e.g., from 6 to 20)
   - Layout recalculates to accommodate new nodes
2. Increase depth again to 3
   - **Expected**: Further expansion to depth 3 nodes
3. Continue to maximum depth (5)
   - **Expected**: Graph expands to include all nodes within 5 hops of root

### Post-conditions

- Depth control works smoothly
- Layout updates with each expansion

### Test Data

| Depth | Approximate visible node count (depends on connectivity) |
| ----- | ------------------------------------------------------- |
| 1     | 1 (root) + degree(root) = ~6                           |
| 2     | root + depth1 + depth2 = ~20                           |
| 3     | ... up to max 5                                        |

## TC-2.7.3: Decrease depth shrinks the scope

### Preconditions

- Drill-down depth=3 (many nodes visible)

### Test Steps

1. Click "Decrease depth" button (or `-`)
   - **Expected**: Nodes at depth=3 are removed from view
   - Graph layout recalculates for remaining nodes (depth≤2)
2. Decrease to depth=2, then 1
   - **Expected**: Graph shrinks accordingly
3. At depth=1, further decrease is not possible (or stays at 1)
   - **Expected**: Depth control may disable decrease at minimum

### Post-conditions

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

### Test Steps

1. Click on the application name/logo in the header (or a breadcrumb labeled with app name)
   - **Expected**: Drill-down mode exits
   - Graph returns to full model view (all nodes that match current filters)
   - Drill-down navigation bar disappears
   - URL updates (drill-down parameters removed)
   - History: either pushState new full view or pop to previous? Usually clicking the root navigator exits drill-down.

### Post-conditions

- Full model restored
- Drill-down UI cleared

### Test Data

| Action               | Exit drill-down? | Graph content              |
| -------------------- | ---------------- | -------------------------- |
| click header/app name| yes              | full model (post-filters)  |

## TC-2.7.5: Drill-down uses BFS to compute visible set

**Technical note**: Should use breath-first search up to specified depth.

### Preconditions

- Complex graph with branching
- Root node with multiple neighbors, second-level neighbors, etc.

### Test Steps

1. Enable drill-down depth=2 on a root
   - **Expected**: All nodes reachable within ≤2 edges from root are included
   - No node at distance 3 appears
2. Verify by checking a specific node at distance 2 from root
   - **Expected**: That node is visible
3. Verify a node at distance 3 from root
   - **Expected**: That node is NOT visible

### Post-conditions

- BFS correctly limits to N hops

### Test Data

| Root | Depth limit | Nodes at distance ≤N included? |
| ---- | ----------- | ----------------------------- |
| A    | 2           | yes (distance 1 & 2 nodes)    |
| A    | 2           | no (distance 3 nodes)         |

## TC-2.7.6: Drill-down respects current entity filters

### Preconditions

- Entity filters: only `Microservice` and `Queue` checked; `Database` unchecked
- Drill-down not active yet

### Test Steps

1. Enter drill-down on a `Microservice` node
   - **Expected**:
     - Root: the Microservice node
     - Neighbors: only those that are `Microservice` or `Queue` (since Database is filtered)
     - Even if a `Database` node is directly connected, it is excluded from the drill-down scope
2. Increase depth
   - **Expected**: At each depth step, only entities of allowed types appear

### Post-conditions

- Drill-down scope = (BFS from root) ∩ (Active Entity Types)
- Filters apply even within drill-down

### Test Data

| Entity filter | Root type | Expected neighbor types at depth 1 |
| ------------- | --------- | --------------------------------- |
| Microservice, Queue only | Microservice | Microservice, Queue (no Database) |

## TC-2.7.7: Drill-down URL parameters encode entity and depth

### Preconditions

- Graph view, drill-down not active

### Test Steps

1. Double-click node with ID "order-123"
   - **Expected**: URL updates to include `?entity=order-123&depth=1` (or similar)
2. Increase depth to 3 via UI
   - **Expected**: URL updates to `&depth=3` (replaceState)
3. Copy the URL and open in a new tab
   - **Expected**: New tab loads directly into drill-down mode with that entity and depth

### Post-conditions

- Deep linking to drill-down state works

### Test Data

| URL format example                        | Loads? |
| ----------------------------------------- | ------ |
| `/graph/?entity=order-123&depth=2`       | yes    |
| `/graph/?entity=invalid-id&depth=1`      | no (error or fallback to selector) |

## TC-2.7.8: Breadcrumb/navigation bar shows current root and depth

### Preconditions

- Drill-down active on node "PaymentService" at depth=2

### Test Steps

1. Observe the drill-down navigation bar (usually at top of graph or below main header)
   - **Expected**: Shows:
     - Root name: "PaymentService"
     - Breadcrumb or title indicating drill-down mode
     - Depth indicator: "Depth: 2" or "Level 2"
     - Buttons: Increase depth (+), Decrease depth (-)
     - Close/exit button (X or "Back to full model")
2. Change depth to 3
   - **Expected**: Depth indicator updates to "3"
3. Click close/exit
   - **Expected**: Bar disappears, full model loads

### Post-conditions

- User can see current drill-down context
- Controls are accessible

### Test Data

| UI element          | Expected content                    |
| ------------------- | ----------------------------------- |
| Root name           | PaymentService                     |
| Depth indicator     | "Depth: 2" or similar              |
| Depth controls      | + and - buttons                   |
| Exit control        | X or "Exit drill-down"            |

## TC-2.7.9: Drill-down on a node already in drill-down scope changes root

### Preconditions

- Drill-down active on root A, depth=2
- Several neighbor nodes visible within scope

### Test Steps

1. Double-click on a different visible node B (which is currently a neighbor within the scope)
   - **Expected**:
     - Drill-down root changes from A to B
     - Scope resets to B's immediate neighbors (depth effectively becomes 1, or retained? Implementation choice)
     - Navigation bar updates to show root B
     - URL updates to reflect new root entity
2. Can continue drilling from B
   - **Expected**: Depth controls still work; can increase from B's default (likely depth=1)

### Post-conditions

- User can re-root drill-down to a different node within current view

### Test Data

| Initial root | Double-click on | New root? | Depth reset? |
| ------------ | --------------- | --------- | ------------ |
| A            | B (neighbor)   | B         | usually yes (to 1) or optional keep? |
