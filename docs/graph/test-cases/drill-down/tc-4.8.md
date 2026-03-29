# TC-4.8: Drill Mode Respects Active Filters

**System Requirement**: [SR-4.8](../../system-requirements/drill-down.md)

## TC-4.8.1: Element type filter applies within drill scope; hidden types are excluded

**Functional Requirements**: [FR-4.4](../../functional-requirements.md#fr-4-drill-down-analysis),
[FR-3.1](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded via `/graph/?model=model-test&entity=comp-a`; drill mode is active
  on **Component A** (ApplicationComponent) at depth 1; Table view is active showing **Component
  A**, **Component B**, and **Service X**

### Test Steps

1. Uncheck **ApplicationService** in the Entities filter
   - **Expected**: **Service X** disappears from the table; only **Component A** and **Component B**
     remain (2 rows); **Component A** (drill root) remains visible

### Post-conditions

- ApplicationService unchecked; 2 rows visible; Component A still visible as drill root

### Test Data

| Field          | Value              |
| -------------- | ------------------ |
| Model          | Test Architecture  |
| Drill root     | Component A        |
| Filtered type  | ApplicationService |
| Hidden node    | Service X          |
| Remaining rows | 2                  |

## TC-4.8.2: Relationship type filter hides edges within drill scope

**Functional Requirements**: [FR-4.4](../../functional-requirements.md#fr-4-drill-down-analysis),
[FR-3.2](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded via `/graph/?model=model-test&entity=comp-a`; Relationships tab is
  active showing **AssociationRelationship** and **ServingRelationship**

### Test Steps

1. Uncheck **ServingRelationship** in the Relationships filter
   - **Expected**: The **ServingRelationship** row disappears from the Relationships table; only
     **AssociationRelationship** remains (1 row)

### Post-conditions

- ServingRelationship unchecked; 1 relationship row visible

### Test Data

| Field     | Value                       |
| --------- | --------------------------- |
| Unchecked | ServingRelationship         |
| Remaining | AssociationRelationship (1) |
