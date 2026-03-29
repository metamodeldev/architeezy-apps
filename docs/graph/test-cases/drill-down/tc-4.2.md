# TC-4.2: Drill Bar Shows Selected Node and Exit Option

**System Requirement**: [SR-4.2](../../system-requirements/drill-down.md)

## TC-4.2.1: Drill bar is visible with the node label and exit button when drill mode is active

**Functional Requirements**: [FR-4.3](../../functional-requirements.md#fr-4-drill-down-analysis)

### Preconditions

- **e-commerce** model is loaded; drill mode is activated on **Payment Service** (via deep link
  `/graph/?model=model-ecommerce&entity=pay-svc` or double-click)

### Test Steps

1. Observe the breadcrumb/drill bar area
   - **Expected**: The drill bar separator (`#crumb-entity-sep`) is visible and does not have the
     `hidden` class; the drill label (`#drill-label`) is visible and shows the text **Payment
     Service**
2. Verify the exit button is present
   - **Expected**: The **drill-exit-btn** button is accessible in the breadcrumb

### Post-conditions

- Drill bar is visible with Payment Service label and exit button

### Test Data

| Field       | Value           |
| ----------- | --------------- |
| Drill root  | Payment Service |
| Drill label | Payment Service |
| Exit button | visible         |
