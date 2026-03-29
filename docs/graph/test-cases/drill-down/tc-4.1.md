# TC-4.1: Double-Click Activates Drill Mode

**System Requirement**: [SR-4.1](../../system-requirements/drill-down.md)

## TC-4.1.1: Double-clicking a node activates drill mode and cancels the single-click timer

**Functional Requirements**: [FR-4.1](../../functional-requirements.md#fr-4-drill-down-analysis)

### Preconditions

- **e-commerce** model is loaded; both **Payment Service** and **Order Database** are visible; drill
  mode is inactive; no node is selected

### Test Steps

1. Double-click on the **Payment Service** node
   - **Expected**: Drill mode activates; the single-click timer is cancelled (the details panel does
     not open via the single-click handler before drill mode activates); the graph updates to show
     only the neighbourhood of **Payment Service**
2. Observe the URL
   - **Expected**: The URL contains `entity=pay-svc`
3. Observe the graph
   - **Expected**: **Payment Service** is visible with drill-root highlighting (distinctive border
     color or glow); **Order Database** (connected via UsedByRelationship) is visible; the drill bar
     is shown with the label **Payment Service**

### Post-conditions

- Drill mode is active on Payment Service; URL contains entity=pay-svc

### Test Data

| Field         | Value                                  |
| ------------- | -------------------------------------- |
| Model         | e-commerce                             |
| Drill root    | Payment Service (ApplicationComponent) |
| Drill root ID | pay-svc                                |
| URL expected  | contains `entity=pay-svc`              |
