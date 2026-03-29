# TC-5.6: View Switch Preserves State

**System Requirement**: [SR-5.6](../../system-requirements/table.md)

## TC-5.6.1: Returning to graph view preserves the previous zoom and pan state

**Functional Requirements**: [FR-5.1](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; user has zoomed to approximately 2.5× and panned so **Component
  A** is centered in the viewport

### Test Steps

1. Click the **Table** button to switch to table view
   - **Expected**: Table is shown; graph is hidden
2. Click the **Graph** button to return
   - **Expected**: Graph canvas reappears at the same ~2.5× zoom level; **Component A** is at the
     same on-screen position; no automatic fit-to-view or zoom reset occurred

### Post-conditions

- Graph active; zoom and pan state are unchanged

### Test Data

| Field         | Value             |
| ------------- | ----------------- |
| Model         | Test Architecture |
| Zoom level    | ~2.5×             |
| Centered node | Component A       |

## TC-5.6.2: Active filters are preserved when switching between views

**Functional Requirements**: [FR-5.1](../../functional-requirements.md#fr-5-table-view),
[FR-3.1](../../functional-requirements.md#fr-3-filtering-system),
[FR-3.2](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; **ApplicationService** is unchecked; Table view shows only
  **Component A** and **Component B**

### Test Steps

1. Click the **Graph** button
   - **Expected**: Graph canvas shows only **Component A** and **Component B** (Service X is still
     hidden); **ApplicationService** remains unchecked
2. Click the **Table** button
   - **Expected**: Table still shows only 2 rows; the filter state is preserved

### Post-conditions

- ApplicationService unchecked in both views

### Test Data

| Field       | Value              |
| ----------- | ------------------ |
| Hidden type | ApplicationService |
| Hidden node | Service X          |

## TC-5.6.3: Switching to table view clears the search input and resets sort order

**Functional Requirements**: [FR-5.1](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Table view is active; Elements tab shows **Component A**,
  **Component B**, **Service X**; the **Type** column is sorted descending (**Service X** first);
  the search input contains `Component`

### Test Steps

1. Click the **Graph** button to switch to Graph view
   - **Expected**: Graph canvas is shown
2. Click the **Table** button to return to Table view
   - **Expected**: The search input (`#table-search`) is empty; all 3 rows are visible in default
     (unsorted) order: **Component A**, **Component B**, **Service X**; no column header has the
     `sorted` class

### Post-conditions

- Table is in default state: no active search, no active sort, all 3 rows visible

### Test Data

| Field        | Value                                |
| ------------ | ------------------------------------ |
| Model        | Test Architecture                    |
| Pre-switch   | Type sorted desc, search "Component" |
| Post-switch  | search empty, no sort                |
| Visible rows | Component A, Component B, Service X  |
