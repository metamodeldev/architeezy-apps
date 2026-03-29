# TC-2.5: Node Selection

**System Requirement**: [SR-2.5](../../system-requirements/graph.md)

## TC-2.5.1: Single-click on a node selects it and shows details panel

**Functional Requirements**: [FR-2.4](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- Model **e-commerce** is loaded; the graph contains nodes **Payment Service**
  (ApplicationComponent) and **Order Database** (DataObject) connected by a **UsedByRelationship**
- The Graph view is active and both nodes are visible on the canvas
- No node is currently selected; the details panel shows its initial placeholder state

### Test Steps

1. Single-click on the **Payment Service** node
2. Wait ~150–200 ms
   - **Expected**: **Payment Service** becomes selected and receives a visible highlight (border or
     glow effect); no other node is highlighted
3. Observe the details panel
   - **Expected**: The panel shows name **Payment Service**, type **ApplicationComponent**,
     documentation **"Handles payment processing"**, and a related element **Order Database** with
     relationship type **UsedByRelationship**
4. Click on an empty area of the canvas
   - **Expected**: The highlight on **Payment Service** disappears; the details panel returns to its
     initial placeholder state

### Post-conditions

- No node is selected
- The details panel is in its initial placeholder state

### Test Data

| Field           | Value                                  |
| --------------- | -------------------------------------- |
| Model           | e-commerce                             |
| Target node     | Payment Service (ApplicationComponent) |
| Documentation   | "Handles payment processing"           |
| Related element | Order Database (DataObject)            |
| Relationship    | UsedByRelationship                     |
