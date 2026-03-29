# TC-4.5: Only Edges Connecting Visible Nodes Are Shown

**System Requirement**: [SR-4.5](../../system-requirements/drill-down.md)

## TC-4.5.1: Edges outside the drill scope are hidden

**Functional Requirements**: [FR-4.2](../../functional-requirements.md#fr-4-drill-down-analysis)

### Preconditions

- **Test Architecture** is loaded via `/graph/?model=model-test&entity=svc-x&depth=1`; drill root is
  **Service X** (svc-x), depth is 1
- Service X → Component A (ServingRelationship, 1 hop); Component A → Component B
  (AssociationRelationship, 2 hops)

### Test Steps

1. Switch to Table view and click the Relationships tab
   - **Expected**: Only the **ServingRelationship** (Service X → Component A) row is visible; the
     **AssociationRelationship** (Component A → Component B) row is **not** visible because
     **Component B** is 2 hops from **Service X** and outside the depth-1 scope

### Post-conditions

- 1 relationship visible (ServingRelationship); AssociationRelationship is hidden

### Test Data

| Field        | Value                                     |
| ------------ | ----------------------------------------- |
| Model        | Test Architecture                         |
| Drill root   | Service X (svc-x)                         |
| Depth        | 1                                         |
| Visible edge | ServingRelationship (svc-x → comp-a)      |
| Hidden edge  | AssociationRelationship (comp-a → comp-b) |
