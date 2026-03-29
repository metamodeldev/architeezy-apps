# TC-2.6: Drill-Down Mode Activation

**System Requirement**: [SR-2.6](../../system-requirements/graph.md)

## TC-2.6.1: Double-click on a node triggers drill-down mode

**Functional Requirements**: [FR-4.1](../../functional-requirements.md#fr-4-drill-down-analysis)

### Preconditions

- Model **e-commerce** is loaded; the graph contains nodes **Payment Service**
  (ApplicationComponent) and **Order Database** (DataObject)
- The Graph view is active and both nodes are visible on the canvas
- No node is currently selected

### Test Steps

1. **Trigger drill mode**
   - Single-click on **Payment Service** and immediately double-click it before the selection delay
     expires
   - **Expected**: The single-click action is cancelled; the details panel does not open via the
     single-click handler
2. **Verify drill mode activation**
   - Observe the graph
   - **Expected**: Drill mode activates for **Payment Service**; the URL contains `entity=pay-svc`;
     the drill bar appears with an exit option and the label **Payment Service**; the node receives
     drill-root highlighting; the details panel shows **Payment Service** details (opened by drill
     mode)
3. **Exit drill mode**
   - Click the exit option in the drill bar
   - **Expected**: Drill mode exits; the drill bar and separator are hidden; the graph returns to
     the full model view

### Post-conditions

- Drill mode is inactive
- The graph displays the full **e-commerce** model

### Test Data

| Field       | Value                                  |
| ----------- | -------------------------------------- |
| Model       | e-commerce                             |
| Target node | Payment Service (ApplicationComponent) |
