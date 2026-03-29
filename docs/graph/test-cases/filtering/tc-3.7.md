# TC-3.7: URL Encoding of Filter State

**System Requirement**: [SR-3.7](../../system-requirements/filtering.md)

## TC-3.7.1: URL `?entities=` parameter overrides stored filter state on load

**Functional Requirements**: [FR-3.4](../../functional-requirements.md#fr-3-filtering-system),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url),
[FR-9.2](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- Browser storage has **ApplicationService** checked (all types visible) for **Test Architecture**
- Browser navigates to `/graph/?model=model-test&entities=ApplicationComponent`

### Test Steps

1. Application loads
   - **Expected**: **ApplicationService** is unchecked (URL parameter overrides stored state); only
     **Component A** and **Component B** are visible; **Service X** is hidden

### Post-conditions

- ApplicationService is unchecked; URL parameter took precedence over stored setting

### Test Data

| Field         | Value                           |
| ------------- | ------------------------------- |
| URL parameter | `entities=ApplicationComponent` |
| Visible type  | ApplicationComponent            |
| Hidden type   | ApplicationService              |

## TC-3.7.2: URL `?relationships=` parameter overrides stored relationship filter on load

**Functional Requirements**: [FR-3.4](../../functional-requirements.md#fr-3-filtering-system),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url),
[FR-9.2](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- Browser storage has all relationship types checked for **Test Architecture**
- Browser navigates to `/graph/?model=model-test&relationships=AssociationRelationship`

### Test Steps

1. Application loads
   - **Expected**: **ServingRelationship** is unchecked (URL parameter contains only active types;
     ServingRelationship is absent so it is excluded); the **ServingRelationship** edge is not
     visible

### Post-conditions

- ServingRelationship is unchecked; AssociationRelationship is checked

### Test Data

| Field         | Value                                   |
| ------------- | --------------------------------------- |
| URL parameter | `relationships=AssociationRelationship` |
| Active type   | AssociationRelationship                 |
| Excluded type | ServingRelationship                     |

## TC-3.7.3: Unchecking an element type encodes active types into the URL

**Functional Requirements**: [FR-3.4](../../functional-requirements.md#fr-3-filtering-system),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- **Test Architecture** is loaded; all element types are checked; URL has no `entities` parameter

### Test Steps

1. Uncheck **ApplicationService** in the Entities filter
   - **Expected**: The URL updates to include `entities=ApplicationComponent`; the page is not
     reloaded (no full navigation); **Service X** is hidden

### Post-conditions

- URL contains `entities=ApplicationComponent`; ApplicationService is unchecked

### Test Data

| Field          | Value                           |
| -------------- | ------------------------------- |
| Model          | Test Architecture               |
| Unchecked type | ApplicationService              |
| URL parameter  | `entities=ApplicationComponent` |

## TC-3.7.4: Re-checking all element types removes the `entities` URL parameter

**Functional Requirements**: [FR-3.4](../../functional-requirements.md#fr-3-filtering-system),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- **Test Architecture** is loaded; **ApplicationService** is unchecked; URL contains
  `entities=ApplicationComponent`

### Test Steps

1. Re-check **ApplicationService** in the Entities filter
   - **Expected**: The `entities` parameter is removed from the URL (all types active — no parameter
     needed); all 3 elements are visible

### Post-conditions

- URL has no `entities` parameter; all element types are checked

### Test Data

| Field           | Value                           |
| --------------- | ------------------------------- |
| Model           | Test Architecture               |
| Re-checked type | ApplicationService              |
| URL before      | `entities=ApplicationComponent` |
| URL after       | no `entities` parameter         |

## TC-3.7.5: Unchecking a relationship type encodes active types into the URL

**Functional Requirements**: [FR-3.4](../../functional-requirements.md#fr-3-filtering-system),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- **Test Architecture** is loaded; all relationship types are checked; URL has no `relationships`
  parameter

### Test Steps

1. Uncheck **ServingRelationship** in the Relationships filter
   - **Expected**: The URL updates to include `relationships=AssociationRelationship`; the page is
     not reloaded; **ServingRelationship** edge is hidden

### Post-conditions

- URL contains `relationships=AssociationRelationship`; ServingRelationship is unchecked

### Test Data

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Model          | Test Architecture                       |
| Unchecked type | ServingRelationship                     |
| URL parameter  | `relationships=AssociationRelationship` |
