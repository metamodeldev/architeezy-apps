# TC-3.4: Filter Changes Apply Immediately

**System Requirement**: [SR-3.4](../../system-requirements/filtering.md)

## TC-3.4.1: Unchecking an element type immediately hides those nodes and their incident edges

**Functional Requirements**: [FR-3.1](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all element types are checked; Table view is active showing 3
  rows (**Component A**, **Component B**, **Service X**)

### Test Steps

1. Uncheck **ApplicationService** in the Entities filter
   - **Expected**: **Service X** disappears from the table immediately (no delay); the row count
     drops to 2; switching to Graph view shows that the **Service X** node and the
     **ServingRelationship** edge (Service X → Component A) are both hidden

### Post-conditions

- ApplicationService is unchecked; Service X is hidden; 2 rows in the table

### Test Data

| Field          | Value               |
| -------------- | ------------------- |
| Model          | Test Architecture   |
| Unchecked type | ApplicationService  |
| Hidden node    | Service X           |
| Hidden edge    | ServingRelationship |
| Table rows     | 2                   |

## TC-3.4.2: Unchecking a relationship type immediately hides only those edges

**Functional Requirements**: [FR-3.2](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all types checked; Relationships tab is active in the table
  showing 2 rows

### Test Steps

1. Uncheck **AssociationRelationship** in the Relationships filter
   - **Expected**: The **AssociationRelationship** row (Component A → Component B "calls")
     disappears from the table immediately; the **ServingRelationship** row remains; the count drops
     to 1; the nodes **Component A** and **Component B** remain visible

### Post-conditions

- AssociationRelationship is unchecked; 1 relationship row visible; both nodes visible

### Test Data

| Field           | Value                     |
| --------------- | ------------------------- |
| Model           | Test Architecture         |
| Unchecked type  | AssociationRelationship   |
| Hidden edge     | Component A → Component B |
| Remaining edges | 1 (ServingRelationship)   |
