# TC-1.9: Unavailable Stored Model

**System Requirement**: [SR-1.9](../../system-requirements/model.md)

## TC-1.9.1: Unavailable stored model shows an error and opens the selector

**Functional Requirements**: [FR-1.3](../../functional-requirements.md#fr-1-model-management)

### Preconditions

- Browser storage references **legacy-model** which is not returned by the API
- The API model list contains only **e-commerce** and **hr-system**

### Test Steps

1. Open the application
   - **Expected**: A loading indicator appears; the app attempts to load **legacy-model** without
     opening the selector first
2. The fetch fails (model not found)
   - **Expected**: An error notification appears stating the previously saved model is unavailable;
     the "Select Model" modal opens; the stored reference to **legacy-model** is cleared from
     browser storage
3. Select **e-commerce** from the modal
   - **Expected**: **e-commerce** loads normally; the header shows **e-commerce**; browser storage
     now references **e-commerce** (not **legacy-model**)

### Post-conditions

- e-commerce is loaded; browser storage no longer contains a reference to legacy-model

### Test Data

| Field          | Value                          |
| -------------- | ------------------------------ |
| Stored model   | legacy-model                   |
| API models     | e-commerce, hr-system          |
| Expected toast | model unavailable notification |
