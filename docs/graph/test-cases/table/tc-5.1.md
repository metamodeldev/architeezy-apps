# TC-5.1: Tab Buttons Switch Between Views

**System Requirement**: [SR-5.1](../../system-requirements/table.md)

## TC-5.1.1: Clicking "Table" switches to table view; clicking "Graph" returns

**Functional Requirements**: [FR-5.1](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Graph view is active; the **Graph** tab button has the `active`
  class

### Test Steps

1. Click the **Table** button (`#tab-table`)
   - **Expected**: The table view (`#table-view`) becomes visible; the graph canvas (`#cy`) is
     hidden; the **Table** button has the `active` class; the **Graph** button does not have the
     `active` class
2. Click the **Graph** button (`#tab-graph`)
   - **Expected**: The graph canvas (`#cy`) becomes visible; the table view is hidden; the **Graph**
     button has the `active` class; the **Table** button does not

### Post-conditions

- Graph view is active; Graph tab button is highlighted

### Test Data

| Field       | Value             |
| ----------- | ----------------- |
| Model       | Test Architecture |
| Initial tab | Graph (active)    |
