# TC-5.3: Table Search and Row Count

**System Requirement**: [SR-5.3](../../system-requirements/table.md)

## TC-5.3.1: Search filters table rows in real-time

**Functional Requirements**: [FR-5.2](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Table view is active; Elements tab shows 3 rows

### Test Steps

1. Type `Component` into the table search input (`#table-search`)
   - **Expected**: Only **Component A** and **Component B** rows remain; **Service X** row is
     hidden; 2 rows total
2. Clear the search input
   - **Expected**: All 3 rows reappear (**Component A**, **Component B**, **Service X**)

### Post-conditions

- Search is empty; all 3 rows visible

### Test Data

| Field       | Value                    |
| ----------- | ------------------------ |
| Model       | Test Architecture        |
| Search text | Component                |
| Matches     | Component A, Component B |
| Hidden      | Service X                |

## TC-5.3.2: Table count badge (`#table-count`) reflects the current number of visible rows

**Functional Requirements**: [FR-5.4](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Table view active; Elements tab; all 3 rows visible

### Test Steps

1. Observe the count badge (`#table-count`)
   - **Expected**: The badge shows **3** (all rows visible; no fraction format)
2. Type `Service` into the search input
   - **Expected**: The count badge updates to **1 / 3** (1 row matches out of 3 total)
3. Clear the search
   - **Expected**: The count badge returns to **3**

### Post-conditions

- Search is empty; count shows 3

### Test Data

| Field           | Value |
| --------------- | ----- |
| Initial count   | 3     |
| After "Service" | 1 / 3 |
| After clear     | 3     |
