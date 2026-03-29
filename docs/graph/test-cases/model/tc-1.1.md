# TC-1.1: Model Selector Interface

**System Requirement**: [SR-1.1](../../system-requirements/model.md)

## TC-1.1.1: Model selector opens automatically when no model is stored

**Functional Requirements**: [FR-1.1](../../functional-requirements.md#fr-1-model-management)

### Preconditions

- Browser storage is empty (fresh session)
- The API returns models: **e-commerce** and **hr-system**

### Test Steps

1. Open the application at `/graph/`
   - **Expected**: The "Select Model" modal appears centered on the screen with a backdrop; the
     graph canvas is not visible behind it

### Post-conditions

- The modal is open; no model is loaded

### Test Data

| Field   | Value   |
| ------- | ------- |
| Storage | empty   |
| Modal   | visible |

## TC-1.1.2: Selecting a model from the selector loads it and closes the modal

**Functional Requirements**: [FR-1.1](../../functional-requirements.md#fr-1-model-management)

### Preconditions

- The "Select Model" modal is open; **e-commerce** and **hr-system** are listed

### Test Steps

1. Click on the **e-commerce** model card
   - **Expected**: The modal closes immediately
2. Wait for the graph to render
   - **Expected**: The graph canvas displays nodes; the application header shows **e-commerce**; the
     model selector is not visible

### Post-conditions

- e-commerce model is loaded; the modal is hidden

### Test Data

| Field          | Value      |
| -------------- | ---------- |
| Selected model | e-commerce |
| Header text    | e-commerce |
