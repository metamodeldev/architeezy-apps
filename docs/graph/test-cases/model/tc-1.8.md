# TC-1.8: Session Persistence

**System Requirement**: [SR-1.8](../../system-requirements/model.md)

## TC-1.8.1: Last-viewed model is auto-loaded on the next session

**Functional Requirements**: [FR-1.3](../../functional-requirements.md#fr-1-model-management)

### Preconditions

- **Test Architecture** was previously loaded and saved to browser storage
- The browser tab is closed and reopened (new page load at `/graph/`)

### Test Steps

1. Open the application
   - **Expected**: A loading indicator appears; the model selector modal does **not** open; **Test
     Architecture** loads automatically from the stored reference
2. Loading completes
   - **Expected**: The graph renders; the header shows **Test Architecture**

### Post-conditions

- Test Architecture is loaded; selector was never shown

### Test Data

| Field        | Value             |
| ------------ | ----------------- |
| Stored model | Test Architecture |
| Header text  | Test Architecture |

## TC-1.8.2: Filter state for a model persists across page reloads

**Functional Requirements**: [FR-1.3](../../functional-requirements.md#fr-1-model-management),
[FR-3.4](../../functional-requirements.md#fr-3-filtering-system)

### Preconditions

- **Test Architecture** is loaded; **ApplicationService** is unchecked in the Entities filter

### Test Steps

1. Reload the page (navigate to `/graph/?model=model-test`)
   - **Expected**: **Test Architecture** loads; **ApplicationService** is still unchecked; **Service
     X** is not visible; **Component A** and **Component B** are visible

### Post-conditions

- Filter state is identical to the pre-reload state

### Test Data

| Field       | Value              |
| ----------- | ------------------ |
| Model       | Test Architecture  |
| Hidden type | ApplicationService |
| Hidden node | Service X          |
