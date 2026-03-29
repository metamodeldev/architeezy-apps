# TC-3.1: Filter Panel Displays Types with Counts and Checkboxes

**System Requirement**: [SR-3.1](../../system-requirements/filtering.md)

## TC-3.1.1: Sidebar displays all element types with color indicator, name, and count

**Functional Requirements**: [FR-3.1](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all 3 elements are visible; no filters applied

### Test Steps

1. Observe the **Entities** filter panel in the sidebar
   - **Expected**: Two element types are listed — **ApplicationComponent** (count 2) and
     **ApplicationService** (count 1); each entry shows a color indicator matching the corresponding
     node color in the graph, the type name, and the count; all checkboxes are checked

### Post-conditions

- All element types are listed and checked

### Test Data

| Field         | Value                                            |
| ------------- | ------------------------------------------------ |
| Model         | Test Architecture                                |
| Element types | ApplicationComponent (2), ApplicationService (1) |

## TC-3.1.2: Sidebar displays all relationship types with color indicator, name, and count

**Functional Requirements**: [FR-3.2](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; all 2 relationships are visible; no filters applied

### Test Steps

1. Observe the **Relationships** filter panel in the sidebar
   - **Expected**: Two relationship types are listed — **AssociationRelationship** (count 1) and
     **ServingRelationship** (count 1); each entry shows a color indicator, the type name, and the
     count; all checkboxes are checked

### Post-conditions

- All relationship types are listed and checked

### Test Data

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Model              | Test Architecture                                    |
| Relationship types | AssociationRelationship (1), ServingRelationship (1) |
