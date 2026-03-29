# TC-3.5: Count Badges Show Visible/Total

**System Requirement**: [SR-3.5](../../system-requirements/filtering.md)

## TC-3.5.1: Entities count badge updates when an element type is filtered out

**Functional Requirements**: [FR-3.1](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all 3 elements visible; the Entities count badge in the sidebar
  header shows **3**

### Test Steps

1. Uncheck **ApplicationService** in the Entities filter
   - **Expected**: The Entities count badge updates to **2 / 3** (2 visible out of 3 total)
2. Re-check **ApplicationService**
   - **Expected**: The Entities count badge returns to **3** (all visible; no fraction format)

### Post-conditions

- All types are checked; badge shows 3

### Test Data

| Field          | Value             |
| -------------- | ----------------- |
| Model          | Test Architecture |
| Initial badge  | 3                 |
| After uncheck  | 2 / 3             |
| After re-check | 3                 |

## TC-3.5.2: Relationships count badge updates when a relationship type is filtered out

**Functional Requirements**: [FR-3.2](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all 2 relationships visible; Relationships count badge shows
  **2**

### Test Steps

1. Uncheck **ServingRelationship** in the Relationships filter
   - **Expected**: The Relationships count badge updates to **1 / 2**
2. Re-check **ServingRelationship**
   - **Expected**: The Relationships count badge returns to **2**

### Post-conditions

- All types checked; badge shows 2

### Test Data

| Field         | Value             |
| ------------- | ----------------- |
| Model         | Test Architecture |
| Initial badge | 2                 |
| After uncheck | 1 / 2             |
| After recheck | 2                 |
