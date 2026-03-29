# TC-3.2: Filter List Search

**System Requirement**: [SR-3.2](../../system-requirements/filtering.md)

## TC-3.2.1: Typing in the Entities search field hides non-matching types

**Functional Requirements**: [FR-3.3](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; both **ApplicationComponent** and **ApplicationService** are
  visible in the Entities filter panel

### Test Steps

1. Type `Component` into the Entities search field (using key-by-key input)
   - **Expected**: The **ApplicationComponent** filter item remains visible; the
     **ApplicationService** filter item is hidden (has a `hidden` CSS class)

### Post-conditions

- Search field contains `Component`; only ApplicationComponent is visible in the list

### Test Data

| Field       | Value                |
| ----------- | -------------------- |
| Search text | Component            |
| Visible     | ApplicationComponent |
| Hidden      | ApplicationService   |

## TC-3.2.2: Clearing the search field restores all types with checkbox states intact

**Functional Requirements**: [FR-3.3](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; the Entities search field contains `Component`; only
  **ApplicationComponent** is visible in the list; **ApplicationService** was manually unchecked
  before typing (so its checkbox is unchecked but hidden)

### Test Steps

1. Clear the Entities search field and trigger the input event
   - **Expected**: Both **ApplicationComponent** and **ApplicationService** reappear in the list;
     the **ApplicationService** checkbox remains unchecked (state was not lost while item was hidden
     by search)

### Post-conditions

- Search field is empty; both types are visible; ApplicationService is still unchecked

### Test Data

| Field              | Value                 |
| ------------------ | --------------------- |
| Pre-clear hidden   | ApplicationService    |
| ApplicationService | unchecked (preserved) |

## TC-3.2.3: Search in the Relationships panel hides non-matching relationship types

**Functional Requirements**: [FR-3.3](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; both **AssociationRelationship** and **ServingRelationship** are
  visible in the Relationships filter panel

### Test Steps

1. Type `Association` into the Relationships search field
   - **Expected**: **AssociationRelationship** remains visible; **ServingRelationship** is hidden

### Post-conditions

- Only AssociationRelationship is visible in the Relationships list

### Test Data

| Field       | Value                   |
| ----------- | ----------------------- |
| Search text | Association             |
| Visible     | AssociationRelationship |
| Hidden      | ServingRelationship     |
