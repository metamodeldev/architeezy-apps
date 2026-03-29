# TC-5.2: Elements and Relationships Table Tabs

**System Requirement**: [SR-5.2](../../system-requirements/table.md)

## TC-5.2.1: Elements tab lists all model elements with correct columns

**Functional Requirements**: [FR-5.2](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Table view is active; **Elements** tab is selected by default

### Test Steps

1. Observe the table
   - **Expected**: Column headers include **Name** (or equivalent), **Type**, and **Documentation**;
     3 rows are visible: **Component A**, **Component B**, **Service X**

### Post-conditions

- Elements tab is active; 3 rows are visible

### Test Data

| Field | Value                               |
| ----- | ----------------------------------- |
| Model | Test Architecture                   |
| Rows  | Component A, Component B, Service X |

## TC-5.2.2: Relationships tab lists all model relationships with correct columns

**Functional Requirements**: [FR-5.3](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Table view is active; Elements tab is currently active

### Test Steps

1. Click the **Relationships** tab (`#ttab-rels`)
   - **Expected**: The active tab indicator moves to **Relationships**; the table shows 2 rows: one
     for **AssociationRelationship** and one for **ServingRelationship**; columns show source
     element, relationship type, target element, and relationship name

### Post-conditions

- Relationships tab is active; 2 rows visible

### Test Data

| Field | Value                                        |
| ----- | -------------------------------------------- |
| Model | Test Architecture                            |
| Rows  | AssociationRelationship, ServingRelationship |
