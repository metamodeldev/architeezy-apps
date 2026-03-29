# TC-4.9: Count Badges Reflect Drill Scope and Active Filters

**System Requirement**: [SR-4.9](../../system-requirements/drill-down.md)

## TC-4.9.1: Entering drill mode updates element count badges to reflect the drill scope

**Functional Requirements**: [FR-4.2](../../functional-requirements.md#fr-4-drill-down-analysis),
[FR-3.1](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all types checked; no drill mode; the Entities count badge shows
  **3** (all 3 elements visible); Table view is active

### Test Steps

1. Switch to Graph view; navigate to `/graph/?model=model-test&entity=svc-x&depth=1`
   - **Expected**: Drill mode is active on **Service X**; only nodes within 1 hop of Service X are
     visible (**Service X** and **Component A**); the Entities count badge updates to show a count
     that reflects the drill scope (2 ApplicationComponent/ApplicationService nodes visible)
2. Switch to Table view
   - **Expected**: Only 2 rows are visible (Service X + Component A); the table count badge shows
     **2 / 3**

### Post-conditions

- Drill mode active on Service X at depth 1; 2 elements visible

### Test Data

| Field         | Value             |
| ------------- | ----------------- |
| Model         | Test Architecture |
| Drill root    | Service X (svc-x) |
| Depth         | 1                 |
| Visible count | 2                 |
| Total count   | 3                 |
| Table badge   | 2 / 3             |
