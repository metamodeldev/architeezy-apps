# TC-4.7: Exiting Drill Mode Restores Full Model View

**System Requirement**: [SR-4.7](../../system-requirements/drill-down.md)

## TC-4.7.1: Clicking the exit button exits drill mode and restores all nodes

**Functional Requirements**: [FR-4.3](../../functional-requirements.md#fr-4-drill-down-analysis)

### Preconditions

- **Test Architecture** is loaded via `/graph/?model=model-test&entity=comp-a`; drill mode is active
  on **Component A**; the drill bar is visible

### Test Steps

1. Click the **drill-exit-btn** button in the breadcrumb
   - **Expected**: The drill bar label (`#drill-label`) receives the `hidden` class and is no longer
     visible; the drill separator (`#crumb-entity-sep`) receives the `hidden` class; the depth
     picker row in Settings is hidden
2. Observe the URL
   - **Expected**: The URL does not contain `entity=` or `depth=` parameters
3. Observe the table (switch to Table view if needed)
   - **Expected**: All 3 elements are visible; no drill-scope restriction applies

### Post-conditions

- Drill mode is inactive; all nodes visible; drill bar is hidden; URL has no drill params

### Test Data

| Field      | Value                                 |
| ---------- | ------------------------------------- |
| Model      | Test Architecture                     |
| Drill root | Component A                           |
| After exit | drill bar hidden, all 3 nodes visible |
