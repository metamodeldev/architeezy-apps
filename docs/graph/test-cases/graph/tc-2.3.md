# TC-2.3: Multiple Layout Algorithms

**System Requirement**: [SR-2.3](../../system-requirements/graph.md)

## TC-2.3.1: Layout dropdown shows all available algorithms with the current one selected

**Functional Requirements**: [FR-2.2](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; the Settings section is visible in the sidebar

### Test Steps

1. Observe the **Layout** dropdown in the Settings section
   - **Expected**: The dropdown is visible; the options include **fCoSE**, **Dagre**, **CoSE**,
     **Breadthfirst**, **Grid**, and **Circle**; **fCoSE** is selected by default

### Post-conditions

- Layout dropdown is visible; fCoSE is selected

### Test Data

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Model          | Test Architecture                              |
| Default layout | fCoSE                                          |
| Available      | fCoSE, Dagre, CoSE, Breadthfirst, Grid, Circle |

## TC-2.3.2: Selecting a different layout algorithm immediately rerenders the graph

**Functional Requirements**: [FR-2.2](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; current layout is **fCoSE**

### Test Steps

1. Open the Settings section; change the Layout dropdown to **Dagre**
   - **Expected**: The graph restructures with nodes arranged in a hierarchical layered pattern; the
     layout completes without errors
2. Change the Layout dropdown to **Grid**
   - **Expected**: Nodes rearrange into a uniform grid pattern; no node overlaps another

### Post-conditions

- Layout is **Grid**

### Test Data

| Field          | Value             |
| -------------- | ----------------- |
| Model          | Test Architecture |
| Initial layout | fCoSE             |
| Second layout  | Dagre             |
| Third layout   | Grid              |
