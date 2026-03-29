# TC-1.7: Invalid Deep Link Fallback

**System Requirement**: [SR-1.7](../../system-requirements/model.md)

## TC-1.7.1: Unknown model ID in `?model=` falls back to the model selector with an error

**Functional Requirements**: [FR-1.2](../../functional-requirements.md#fr-1-model-management)

### Preconditions

- Browser storage is empty; browser navigates to `/graph/?model=nonexistent-model`

### Test Steps

1. Application initialises
   - **Expected**: A loading indicator appears; the model selector does **not** open immediately
     (the app attempts the load first)
2. The fetch returns no matching model
   - **Expected**: An error notification appears informing the user that the model was not found;
     the "Select Model" modal opens so the user can choose a valid model

### Post-conditions

- No model is loaded; the model selector is open

### Test Data

| Field         | Value                               |
| ------------- | ----------------------------------- |
| URL parameter | `?model=nonexistent-model`          |
| Outcome       | Error notification + selector opens |
