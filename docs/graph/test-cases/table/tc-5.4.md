# TC-5.4: Sortable Columns

**System Requirement**: [SR-5.4](../../system-requirements/table.md)

## TC-5.4.1: Clicking a column header sorts rows ascending; clicking again sorts descending

**Functional Requirements**: [FR-5.2](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Table view active; Elements tab showing 3 rows in default order

### Test Steps

1. Click the first column header (`#table-head th:first-child`)
   - **Expected**: The column header receives the `sorted` class; the sort icon shows **▲**
     (ascending)
2. Click the same column header again
   - **Expected**: The sort icon changes to **▼** (descending); the column still has the `sorted`
     class

### Post-conditions

- First column is sorted descending

### Test Data

| Field       | Value             |
| ----------- | ----------------- |
| Model       | Test Architecture |
| Sort column | first column      |
| Asc icon    | ▲                 |
| Desc icon   | ▼                 |

## TC-5.4.2: Clicking a different column clears the sort on the previous column

**Functional Requirements**: [FR-5.2](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Table view active; first column is sorted (ascending)

### Test Steps

1. Click the second column header
   - **Expected**: The second column receives the `sorted` class and shows **▲**; the first column
     loses the `sorted` class

### Post-conditions

- Second column is sorted; first column is unsorted

### Test Data

| Field        | Value                              |
| ------------ | ---------------------------------- |
| Model        | Test Architecture                  |
| Initial sort | column 1                           |
| After click  | column 2 sorted, column 1 unsorted |

## TC-5.4.3: Sorting by Type column reorders rows accordingly

**Functional Requirements**: [FR-5.2](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Table view active; Elements tab showing rows in default order:
  **Component A**, **Component B**, **Service X**

### Test Steps

1. Click the **Type** column header once (ascending)
   - **Expected**: Rows are reordered so **ApplicationComponent** rows appear before
     **ApplicationService**: **Component A**, **Component B**, then **Service X**
2. Click the **Type** column header again (descending)
   - **Expected**: Rows are reordered so **ApplicationService** appears first: **Service X**, then
     **Component A**, **Component B**

### Post-conditions

- Type column is sorted descending; Service X is the first row

### Test Data

| Field            | Value                               |
| ---------------- | ----------------------------------- |
| Model            | Test Architecture                   |
| Sort column      | Type                                |
| Ascending order  | Component A, Component B, Service X |
| Descending order | Service X, Component A, Component B |
