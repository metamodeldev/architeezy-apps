# TC-2.4: Layouts

**System Requirement**: [SR-2.4](../../system-requirements/graph.md#sr-24-layouts)

## TC-2.4.1: Switch layout algorithm via settings

### Preconditions

- Graph view active with model loaded (e.g., 20 nodes)
- Current layout: "Force-Directed" (default)

### Steps

1. Open graph settings/layout controls
2. Select a different layout algorithm (e.g., "Hierarchical")
   - Nodes smoothly animate to new positions according to the selected algorithm's logic
   - Edges re-route accordingly
   - Layout type indicator updates in UI
3. Verify layout change
   - Hierarchical layout shows nodes in layers/tiers; Force-Directed spreads nodes organically, etc.
   - Layout algorithm is changed
   - Graph is organized according to new algorithm

### Test Data

| Initial layout | New layout   | Expected change               |
| -------------- | ------------ | ----------------------------- |
| Force-Directed | Hierarchical | nodes arrange in layers/tiers |

## TC-2.4.2: Manual node repositioning overrides automatic layout

### Preconditions

- Force-Directed layout active
- Nodes are initially auto-positioned

### Steps

1. Click and drag a specific node to a new location
   - Node moves with cursor; when released, it stays at that position (becomes "fixed")
2. Observe other nodes
   - They may adjust slightly due to force simulation, but the manually moved node remains near its
     drop location
3. Switch to a different layout algorithm and back
   - Manual positions are preserved (or optionally reset if design says layout override clears on
     switch)
   - User can fine-tune node positions
   - Manual positions persist (unless explicitly reset)

### Test Data

| Action                 | Node position after action |
| ---------------------- | -------------------------- |
| drag node to (100,100) | stays near (100,100)       |

## TC-2.4.3: Layout refresh re-applies current algorithm

### Preconditions

- Layout algorithm: Force-Directed
- Some nodes have been manually repositioned (overridden)
- Graph has become somewhat disorganized

### Steps

1. Trigger "Refresh Layout" command (button or menu)
   - The system re-runs the current layout algorithm from scratch
   - Manual overrides may be cleared (nodes return to algorithm-calculated positions)
   - Animation occurs if node count <400
2. Verify nodes are reorganized
   - Graph looks tidier, following the layout logic
   - Layout is recalculated
   - Manual tweaks may be reset (per product decision)

### Test Data

| Before refresh | After refresh               |
| -------------- | --------------------------- |
| manual tweaks  | algorithm positions applied |

## TC-2.4.4: Animations disabled for large graphs (>400 nodes)

### Preconditions

- Model with 500+ nodes
- Layout algorithm change or refresh triggered

### Steps

1. Switch layout or refresh
   - Nodes jump to new positions immediately without smooth animation
   - Why: To maintain performance and avoid long animation times
2. Observe performance
   - Operation is fast and responsive; no sluggishness
   - Animation policy respected for performance

### Test Data

| Node count | Animation expected? |
| ---------- | ------------------- |
| 400        | yes (smooth)        |
| 500+       | no (instant)        |

## TC-2.4.5: Layout recalculation on filter/drill-down changes

**Related to**: Business rule: "The system recalculates the layout whenever the set of visible
entities or relationships changes (e.g., changing filters, containment modes, or entering/exiting
Drill-down)."

### Preconditions

- Model with 30 nodes laid out
- Filter: all entity types visible

### Steps

1. Uncheck an entity type ( hides 10 nodes)
   - Layout is recalculated for remaining 20 nodes; graph rearranges
2. Re-check that entity type (shows 10 nodes)
   - Layout recalculates again to accommodate 30 nodes
3. Enter drill-down on a node
   - Layout recalculates for the drill-down scope (smaller subgraph)
4. Exit drill-down
   - Layout recalculates for full graph again
   - Layout stays optimal as visible set changes

### Test Data

| Visible set change | Trigger relayout? |
| ------------------ | ----------------- |
| filter hide nodes  | yes               |
| filter show nodes  | yes               |
| drill-down enter   | yes               |
| drill-down exit    | yes               |

## TC-2.4.6: Highlight mode depth change does NOT trigger relayout

### Preconditions

- Graph with layout active
- Highlight mode enabled with depth=1

### Steps

1. Change Highlight depth from 1 to 2 (using depth control)
   - Graph updates to show more neighbors in full opacity (or less dimmed)
   - **BUT**: Node positions remain unchanged; no layout recalculation occurs
2. Change depth to 3
   - Same: visual highlight changes, but node positions static
   - Highlight scope changes without disturbing layout

### Test Data

| Highlight depth change | Relayout triggered? |
| ---------------------- | ------------------- |
| 1 → 2                  | no                  |
| 2 → 3                  | no                  |

## TC-2.4.7: Containment mode change triggers relayout

### Preconditions

- Model with parent-child containment relationships
- Current containment mode: "Edge-based" (shows synthetic edges for containment)

### Steps

1. Switch containment mode to "Compound" (nested nodes)
   - Layout recalculates to position child nodes inside parent boundaries
   - Visual hierarchy changes
2. Switch back to "Edge-based"
   - Layout recalculates to separate nodes with containment edges
   - Containment mode changes cause layout adjustment

### Test Data

| Containment mode | Layout behavior                      |
| ---------------- | ------------------------------------ |
| Edge-based       | nodes separate, edges show hierarchy |
| Compound         | nodes nested, different layout       |

## TC-2.4.8: Orphaned children when parent hidden => recalc layout

### Preconditions

- Model: Parent node has 3 child nodes
- Current layout: Compound (nested)
- Parent is visible, children visible inside

### Steps

1. Uncheck the parent's entity type (or filter it out)
   - Parent node disappears
   - Child nodes become "orphaned" and are re-rendered as top-level nodes
   - Layout recalculates to position these orphaned children appropriately (as independent nodes)
   - Orphans get proper layout without parent

### Test Data

| Parent visibility | Child visibility | Layout treatment                  |
| ----------------- | ---------------- | --------------------------------- |
| visible           | nested inside    | as children of parent             |
| hidden            | top-level        | orphans, positioned independently |
