# TC-5.7: Table Respects Active Filters and Drill Mode

**System Requirement**: [SR-5.7](../../system-requirements/table.md)

## TC-5.7.1: Table excludes rows for element types that are filtered out

**Functional Requirements**: [FR-5.2](../../functional-requirements.md#fr-5-table-view),
[FR-3.1](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; Table view active; Elements tab showing all 3 rows

### Test Steps

1. Uncheck **ApplicationService** in the Entities filter
   - **Expected**: The **Service X** row disappears from the table immediately; only **Component A**
     and **Component B** remain (2 rows); the table count badge updates to **2 / 3**
2. Re-check **ApplicationService**
   - **Expected**: **Service X** reappears; all 3 rows are visible; count badge returns to **3**

### Post-conditions

- All types checked; 3 rows visible

### Test Data

| Field         | Value              |
| ------------- | ------------------ |
| Model         | Test Architecture  |
| Filtered type | ApplicationService |
| Hidden row    | Service X          |
| Count badge   | 2 / 3              |

## TC-5.7.2: Table excludes rows for elements outside the active drill scope

**Functional Requirements**: [FR-5.2](../../functional-requirements.md#fr-5-table-view),
[FR-4.2](../../functional-requirements.md#fr-4-drill-down-analysis)

### Preconditions

- **Test Architecture** is loaded; Table view active; Elements tab showing all 3 rows; drill mode is
  **inactive**

### Test Steps

1. Switch to Graph view; navigate to `/graph/?model=model-test&entity=svc-x&depth=1`
   - **Expected**: Drill mode is active on **Service X**; only **Service X** and **Component A** are
     within depth 1
2. Switch to Table view
   - **Expected**: The Elements table shows only 2 rows: **Service X** and **Component A**;
     **Component B** row is **not** present; count badge shows **2 / 3**

### Post-conditions

- Table shows 2 rows; Component B is absent due to drill scope restriction

### Test Data

| Field             | Value                  |
| ----------------- | ---------------------- |
| Model             | Test Architecture      |
| Drill root        | Service X (svc-x)      |
| Depth             | 1                      |
| In-scope rows     | Service X, Component A |
| Out-of-scope rows | Component B            |
| Count badge       | 2 / 3                  |
