# TC-1.5: Deep Links

**System Requirement**: [SR-1.5](../../system-requirements/model.md)

## TC-1.5.1: URL `?model=` loads the specified model without opening the selector

**Functional Requirements**: [FR-1.2](../../functional-requirements.md#fr-1-model-management),
[FR-9.2](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- Browser storage is empty; browser navigates to `/graph/?model=model-test`

### Test Steps

1. Application initialises
   - **Expected**: A loading indicator appears; the model selector modal does **not** open
2. Model finishes loading
   - **Expected**: The loading spinner disappears; the graph canvas renders; the header shows **Test
     Architecture**

### Post-conditions

- Test Architecture model is loaded; selector modal was never shown

### Test Data

| Field         | Value               |
| ------------- | ------------------- |
| URL parameter | `?model=model-test` |
| Header text   | Test Architecture   |

## TC-1.5.2: URL `?entities=` pre-applies an element type filter on load

**Functional Requirements**: [FR-1.2](../../functional-requirements.md#fr-1-model-management),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url),
[FR-9.2](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- Browser storage is empty; browser navigates to
  `/graph/?model=model-test&entities=ApplicationComponent`

### Test Steps

1. Model loads
   - **Expected**: In the Entities filter panel the **ApplicationService** checkbox is unchecked;
     **Component A** and **Component B** (ApplicationComponent) are visible in the graph; **Service
     X** (ApplicationService) is not visible

### Post-conditions

- ApplicationService is filtered out; only ApplicationComponent nodes are visible

### Test Data

| Field         | Value                           |
| ------------- | ------------------------------- |
| URL parameter | `entities=ApplicationComponent` |
| Visible type  | ApplicationComponent            |
| Hidden type   | ApplicationService              |
| Hidden node   | Service X                       |
