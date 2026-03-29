# TC-4.4: Graph Shows Nodes Within Configurable Depth

**System Requirement**: [SR-4.4](../../system-requirements/drill-down.md)

## TC-4.4.1: Graph shows only nodes within the configured depth from the drill root

**Functional Requirements**: [FR-4.2](../../functional-requirements.md#fr-4-drill-down-analysis)

### Preconditions

- **Test Architecture** is loaded via `/graph/?model=model-test&entity=comp-a&depth=1`; model has:
  **Component A** → **Component B** (AssociationRelationship), **Service X** → **Component A**
  (ServingRelationship)
- Depth is 1

### Test Steps

1. Observe the visible nodes at depth 1
   - **Expected**: **Component A** (drill root), **Component B** (1 hop via
     AssociationRelationship), and **Service X** (1 hop via ServingRelationship) are all visible
     (all model nodes are within 1 hop of Component A in this model)

### Post-conditions

- All 3 nodes visible at depth 1 for this model

### Test Data

| Field      | Value                                       |
| ---------- | ------------------------------------------- |
| Model      | Test Architecture                           |
| Drill root | Component A (comp-a)                        |
| Depth      | 1                                           |
| Visible    | Component A, Component B, Service X (all 3) |
