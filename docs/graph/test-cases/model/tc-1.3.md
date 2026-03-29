# TC-1.3: Model List Search

**System Requirement**: [SR-1.3](../../system-requirements/model.md)

## TC-1.3.1: Typing in the search field filters the model list in real-time

**Functional Requirements**: [FR-1.1](../../functional-requirements.md#fr-1-model-management)

### Preconditions

- The "Select Model" modal is open; both **e-commerce** and **hr-system** are visible

### Test Steps

1. Type `comm` into the search field
   - **Expected**: Only **e-commerce** remains visible; **hr-system** is hidden
2. Append `X` so the field reads `commX`
   - **Expected**: No model cards are visible; the list is empty

### Post-conditions

- Search field contains `commX`; no models are visible

### Test Data

| Field         | Value      |
| ------------- | ---------- |
| Search text 1 | comm       |
| Match         | e-commerce |
| Search text 2 | commX      |
| Match count   | 0          |

## TC-1.3.2: Clearing the search field restores all models

**Functional Requirements**: [FR-1.1](../../functional-requirements.md#fr-1-model-management)

### Preconditions

- The "Select Model" modal is open; search field contains `hr` so only **hr-system** is visible

### Test Steps

1. Clear the search field completely
   - **Expected**: Both **e-commerce** and **hr-system** reappear in the list with their original
     order and metadata intact

### Post-conditions

- Search field is empty; both models are visible

### Test Data

| Field          | Value                 |
| -------------- | --------------------- |
| Initial search | hr                    |
| After clear    | e-commerce, hr-system |
