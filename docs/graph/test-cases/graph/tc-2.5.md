# TC-2.5: Selection

**System Requirement**: [SR-2.5](../../system-requirements/graph.md#sr-25-selection)

## TC-2.5.1: Select a node to highlight and show properties

### Preconditions

- Graph view active
- Model with several nodes visible

### Steps

1. Click on a specific node
   - Node receives visual highlight (e.g., thicker border, different fill)
   - Properties panel opens (if not already open)
   - Properties panel displays entity details: name, type, attributes, relationships
   - The camera does not move (viewport stays unchanged)
2. Verify properties panel content
   - Panel shows correct data for the selected entity
3. Select a different node
   - Previous node loses highlight; new node gets highlight; properties panel updates to show new
     entity's data
   - The camera does not move
   - Single selection works; properties panel synchronized with selection

### Test Data

| Selected node ID | Expected entity name in properties |
| ---------------- | ---------------------------------- |
| node-123         | PaymentService                     |

## TC-2.5.2: Select an edge to show relationship properties

### Preconditions

- Graph with visible edges (relationships)

### Steps

1. Click on an edge (not a node)
   - Edge becomes highlighted (thicker line, different color)
   - Properties panel opens showing:
     - Relationship name (if present; omitted otherwise)
     - Relationship type (e.g., "Calls")
     - Source entity as a clickable link (navigates to and selects the source node)
     - Target entity as a clickable link (navigates to and selects the target node)
2. Click the source entity link in the properties panel
   - Camera centers on the source node; source node becomes selected; edge highlight clears
3. Click on a different edge
   - Edge highlight clears from the previous edge; new edge gets highlight; properties panel updates
   - The camera does not move
   - Edge selection is distinct from node selection
   - Relationship properties displayed correctly, including interactive links

### Test Data

| Edge: source→target | Expected props panel content                                                            |
| ------------------- | --------------------------------------------------------------------------------------- |
| ServiceA→ServiceB   | type: Calls, source link: ServiceA, target link: ServiceB (name omitted if not present) |
| A→B (name: "uses")  | name: "uses", type: Calls, source link: A, target link: B                               |

## TC-2.5.3: Deselect by clicking canvas background

### Preconditions

- A node is selected (highlighted, properties panel open)

### Steps

1. Click on empty canvas area (not on any node or edge)
   - Highlight is removed from node/edge
   - Properties panel clears or shows "No selection" state
2. Verify no residual selection
   - No element is highlighted; properties panel is empty or shows generic instructions
   - Selection can be cleared

### Test Data

| Action           | Selection afterwards |
| ---------------- | -------------------- |
| click background | none                 |

## TC-2.5.4: Click related entity link in properties panel to select it

### Preconditions

- Node A is selected and highlighted
- Properties panel shows relationships from Node A to Node B

### Steps

1. In the properties panel, locate a related entity link (e.g., "ServiceB" under "Outgoing Calls")
2. Click on that link
   - **Node A loses its highlight** (previous selection is cleared)
   - Node B becomes selected (highlighted)
   - Properties panel updates to show Node B's details
   - The camera centers on Node B
3. Verify that no two nodes are simultaneously highlighted
   - Only Node B is highlighted; Node A appears in its normal (unselected) visual state
   - Selection is always singular; clicking a link replaces the current selection

### Test Data

| From node | Click linked entity | Node A highlight after | Node B highlight after |
| --------- | ------------------- | ---------------------- | ---------------------- |
| Node A    | Node B (link)       | removed                | active                 |

## TC-2.5.5: Selection persists during view mode switch (Graph ↔ Table)

### Preconditions

- Node X is selected in Graph view
- Table view is accessible

### Steps

1. Switch to Table view
   - Table loads; the row corresponding to Node X may be highlighted or scrolled into view
     (depending on implementation)
2. Switch back to Graph view
   - Node X is still selected (highlighted), properties panel still shows Node X
   - Selection survives view mode changes

### Test Data

| Selection state before switch | After switch back to Graph |
| ----------------------------- | -------------------------- |
| Node X selected               | Node X still selected      |

## TC-2.5.6: Selection cleared on model change

### Preconditions

- Node is selected in current model

### Steps

1. Switch to a different model
   - Selection is cleared; no node/edge remains highlighted
   - Properties panel shows empty or "Select an element" prompt
   - Old model's selection state does not carry over
   - Fresh model starts with no selection

### Test Data

| Action       | Selection in new model |
| ------------ | ---------------------- |
| model switch | none                   |

## TC-2.5.7: Multiple selection not supported (single only)

### Preconditions

- Graph active

### Steps

1. Select a node (Node A)
2. Hold Ctrl/Cmd and click another node (Node B)
   - Only Node B becomes selected; Node A is deselected
   - OR: System does not support Ctrl-multi-select and simply selects the clicked node, replacing
     previous
   - Only one element selected at a time

### Test Data

| Click sequence | Final selection |
| -------------- | --------------- |
| A, then B      | B               |
