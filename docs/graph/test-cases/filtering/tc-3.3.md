# TC-3.3: Select All and Select None Bulk Controls

**System Requirement**: [SR-3.3](../../system-requirements/filtering.md)

## TC-3.3.1: "Select none" unchecks all element types and empties the table

**Functional Requirements**: [FR-3.1](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all element types are checked; Table view is active showing 3
  rows

### Test Steps

1. Click the **✗ (Select none)** button in the Entities filter panel
   - **Expected**: All element type checkboxes become unchecked; the table shows 0 rows

### Post-conditions

- No element types are active; table is empty

### Test Data

| Field       | Value             |
| ----------- | ----------------- |
| Model       | Test Architecture |
| Rows before | 3                 |
| Rows after  | 0                 |

## TC-3.3.2: "Select all" restores all element types after deselecting

**Functional Requirements**: [FR-3.1](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all element types are unchecked (following TC-3.3.1); Table view
  is active showing 0 rows

### Test Steps

1. Click the **✓ (Select all)** button in the Entities filter panel
   - **Expected**: All element type checkboxes become checked; the table shows all 3 rows again

### Post-conditions

- All element types are active; 3 rows are visible in the table

### Test Data

| Field       | Value             |
| ----------- | ----------------- |
| Model       | Test Architecture |
| Rows before | 0                 |
| Rows after  | 3                 |

## TC-3.3.3: "Select none" unchecks all relationship types and hides all edges

**Functional Requirements**: [FR-3.2](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all relationship types are checked; Relationships tab is active
  in the table showing 2 rows (**AssociationRelationship**, **ServingRelationship**)

### Test Steps

1. Click the **✗ (Select none)** button in the Relationships filter panel
   - **Expected**: All relationship type checkboxes become unchecked; the Relationships table shows
     0 rows; all nodes remain visible in the graph

### Post-conditions

- No relationship types are active; relationship table is empty; nodes are unaffected

### Test Data

| Field       | Value             |
| ----------- | ----------------- |
| Model       | Test Architecture |
| Rows before | 2                 |
| Rows after  | 0                 |

## TC-3.3.4: "Select all" restores all relationship types after deselecting

**Functional Requirements**: [FR-3.2](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all relationship types are unchecked (following TC-3.3.3);
  Relationships tab is active showing 0 rows

### Test Steps

1. Click the **✓ (Select all)** button in the Relationships filter panel
   - **Expected**: All relationship type checkboxes become checked; the Relationships table shows
     all 2 rows again

### Post-conditions

- All relationship types are active; 2 rows are visible in the Relationships table

### Test Data

| Field       | Value             |
| ----------- | ----------------- |
| Model       | Test Architecture |
| Rows before | 0                 |
| Rows after  | 2                 |
