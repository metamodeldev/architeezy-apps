# TC-3.6: Filter State Persistence

**System Requirement**: [SR-3.6](../../system-requirements/filtering.md)

## TC-3.6.1: Unchecked element type persists across page reloads

**Functional Requirements**: [FR-3.1](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; **ApplicationService** is unchecked in the Entities filter

### Test Steps

1. Navigate to `/graph/?model=model-test` (reload)
   - **Expected**: **Test Architecture** loads; the **ApplicationService** checkbox is still
     unchecked; **Service X** is not visible in the table; **Component A** and **Component B** are
     visible

### Post-conditions

- After reload: ApplicationService remains unchecked

### Test Data

| Field       | Value              |
| ----------- | ------------------ |
| Model       | Test Architecture  |
| Hidden type | ApplicationService |
| Hidden node | Service X          |

## TC-3.6.2: Unchecked relationship type persists across page reloads

**Functional Requirements**: [FR-3.2](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; **AssociationRelationship** is unchecked in the Relationships
  filter

### Test Steps

1. Navigate to `/graph/?model=model-test` (reload)
   - **Expected**: **Test Architecture** loads; the **AssociationRelationship** checkbox is still
     unchecked; the **AssociationRelationship** row does not appear in the Relationships table

### Post-conditions

- After reload: AssociationRelationship remains unchecked

### Test Data

| Field       | Value                   |
| ----------- | ----------------------- |
| Model       | Test Architecture       |
| Hidden type | AssociationRelationship |
