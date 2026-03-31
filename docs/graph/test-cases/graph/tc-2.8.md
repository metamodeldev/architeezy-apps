# TC-2.8: Containment

**System Requirement**: [SR-2.8](../../system-requirements/graph.md#sr-28-containment)

## TC-2.8.1: Switch containment mode to "Edge-based"

### Preconditions

- Graph view active
- Model contains parent-child containment relationships (e.g., `System` contains `Service`)
- Current containment mode: default (probably "Edge-based" or previous setting)

### Test Steps

1. Open graph settings or containment controls
2. Select "Edge-based" containment mode
   - **Expected**:
     - Physical containment is represented by synthetic edges (special relationship type) connecting parent to child
     - These edges have distinctive visual markers (dashed line, different color, or special arrow)
     - Nodes are laid out as separate entities (not nested)
     - Layout recalculates to accommodate separate nodes

### Post-conditions

- Containment shown as edges
- Nodes not nested visually

### Test Data

| Containment mode | Visual representation of parent-child |
| ----------------- | ------------------------------------- |
| Edge-based       | synthetic edges between nodes       |

## TC-2.8.2: Switch containment mode to "Compound" (nested)

### Preconditions

- Currently in "Edge-based" mode
- Model has containment hierarchy

### Test Steps

1. Switch containment mode to "Compound"
   - **Expected**:
     - Child nodes are visually nested inside their parent nodes
     - Parent node becomes a container (larger shape or bounding box)
     - Child nodes appear inside the parent's bounds
     - Layout recalculates to place parent nodes with children grouped
     - Containment edges may disappear or be replaced by nesting visual
2. Verify nesting
   - **Expected**: Child node coordinates are within parent node's area

### Post-conditions

- Nested (compound) layout active
- Children visually grouped inside parents

### Test Data

| Parent | Children | Visual result                 |
| ------ | -------- | ----------------------------- |
| System | S1, S2   | System box contains S1,S2 icons|

## TC-2.8.3: Orphaned children when parent hidden become top-level

### Preconditions

- Compound mode active (nested)
- Parent P visible with children C1, C2 nested inside
- Filters: all entity types visible

### Test Steps

1. Uncheck the parent's entity type (or filter it out via some other means)
   - **Expected**:
     - Parent node P disappears
     - Children C1, C2 become "orphaned" and are rendered as top-level nodes (not inside any container)
     - Layout recalculates to position these orphaned nodes alongside other top-level nodes
2. Verify C1, C2 are now separate, independent-looking nodes
   - **Expected**: They are no longer contained visually; they have their own positions

### Post-conditions

- Orphan logic handled correctly
- Layout adapts to new hierarchy-free arrangement

### Test Data

| Parent visibility | Children visibility | Children layout        |
| ----------------- | ------------------- | ---------------------- |
| visible          | nested inside P    | inside parent bounds   |
| hidden (removed) | top-level nodes    | independent positions  |

## TC-2.8.4: Switching containment modes triggers layout recalculation

### Preconditions

- Model with containment hierarchy
- Some layout currently applied

### Test Steps

1. Note current node positions (positions set by current layout)
2. Switch from Edge-based to Compound mode
   - **Expected**: Layout is recalculated to accommodate nesting; nodes move to new coordinates
3. Switch back to Edge-based
   - **Expected**: Layout recalculates again to separate nodes

### Post-conditions

- Layout is always fresh after mode change

### Test Data

| Mode change             | Layout recalc? |
| ----------------------- | -------------- |
| Edge → Compound         | yes            |
| Compound → Edge         | yes            |

## TC-2.8.5: Visibility of containment relationships

### Preconditions

- Edge-based mode active
- Containment edges are shown with distinct style (dashed purple line)

### Test Steps

1. Observe containment edges between parent and child nodes
   - **Expected**: They are clearly distinguishable from regular relationships (e.g., Calls)
2. Check legend (if legend includes containment type)
   - **Expected**: Legend shows containment visual style and label (e.g., "contains" or "parent-child")
3. Switch to Compound mode
   - **Expected**: Containment edges disappear; nesting shows the relationship spatially

### Post-conditions

- Containment is visually clear in either mode

### Test Data

| Mode           | Containment visual                          |
| -------------- | ------------------------------------------ |
| Edge-based     | special edges                             |
| Compound       | nested nodes (spatial)                    |

## TC-2.8.6: Containment mode change respects current filters

### Preconditions

- Filter: only `Microservice` and `System` entity types visible
- Model contains `System` (parent) containing `Microservice` (child) and `Database` (child)
- In Compound mode, `System` normally contains both children

### Test Steps

1. In Compound mode, with filter as stated
   - **Expected**: `System` node is visible; inside it, only `Microservice` child is visible (because `Database` is filtered out)
   - The `Database` child does not appear at all
2. Switch to Edge-based mode
   - **Expected**: `System` node visible; `Microservice` node visible; containment edge from `System` to `Microservice` visible
   - No edge to `Database` because that node is filtered out

### Post-conditions

- Filtering applies to child nodes as well
- Containment relationships to filtered-out children are not rendered

### Test Data

| Filter types visible | Child types | Visible in containment? |
| -------------------- | ----------- | ----------------------- |
| System, Microservice | Microservice, Database | only Microservice appears |

## TC-2.8.7: Drill-down with Compound mode: child nodes inside parent still part of scope?

### Preconditions

- Compound mode active
- Drill-down not active

### Test Steps

1. Double-click on a `System` parent node to enter drill-down
   - **Expected**: Drill-down root becomes that `System` node
   - Initially depth=1 shows:
     - Root (System) at center?
     - Its immediate neighbors: possibly including relationships to other top-level nodes AND its child nodes?
   - The interpretation: drill-down DFS/BFS includes both graph relationships and containment children as "neighbors"
   - If children are considered neighbors (distance=1), they should appear as separate nodes (even if in Compound mode they'd be nested). Usually in drill-down, you want to see the immediate connections.
   - Implementation note: In drill-down, nested children may be shown as separate nodes to enable navigation, OR remain nested but their internal structure becomes visible.
2. Increase depth to 2
   - **Expected**: Children of children (if any) appear; also neighbors-of-neighbors

### Post-conditions

- Drill-down works with containment hierarchies

### Test Data

| Mode   | Drill-down root | Expected depth=1 visible elements |
| ------ | --------------- | --------------------------------- |
| Compound| Parent P       | P + its child nodes + its graph neighbors? clarify. |

## TC-2.8.8: Legend shows containment mode indicator (optional)

### Preconditions

- Legend is enabled

### Test Steps

1. Switch containment modes and observe legend
   - **Expected**: Legend may include an entry indicating which containment mode is active, OR it may show a special symbol for containment edges when in Edge-based mode. Alternatively, legend may just list entity types and relationship types and not mention containment separately.
2. This is optional depending on design; if legend is not required to show mode, skip.

### Post-conditions

- Legend reflects mode if applicable

### Test Data

| Containment mode | Legend entry? |
| ----------------- | ------------- |
| Edge-based       | special item for "contains" relationship |
| Compound         | no special entry (nesting is spatial) |
