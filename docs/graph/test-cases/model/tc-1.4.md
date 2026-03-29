# TC-1.4: Loading Indicators

**System Requirement**: [SR-1.4](../../system-requirements/model.md)

## TC-1.4.1: Loading indicator appears after model selection and disappears when the model is ready

**Functional Requirements**: [FR-1.1](../../functional-requirements.md#fr-1-model-management)

### Preconditions

- The "Select Model" modal is open; **e-commerce** is listed

### Test Steps

1. Click the **e-commerce** model card
   - **Expected**: The modal closes immediately; a loading spinner appears in the main area before
     the graph renders
2. Wait for loading to complete
   - **Expected**: The loading spinner disappears; the graph canvas shows nodes for **Payment
     Service** and **Order Database**; the header displays **e-commerce**

### Post-conditions

- e-commerce is loaded; no spinner is visible

### Test Data

| Field   | Value            |
| ------- | ---------------- |
| Model   | e-commerce       |
| Spinner | visible → hidden |
