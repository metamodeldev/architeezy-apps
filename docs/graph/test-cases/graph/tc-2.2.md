# TC-2.2: Consistent Node and Edge Colors by Type

**System Requirement**: [SR-2.2](../../system-requirements/graph.md)

## TC-2.2.1: Same-type nodes share the same color; colors are stable across page reloads

**Functional Requirements**: [FR-2.1](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; all 3 nodes and 2 edges are visible; no filters applied

### Test Steps

1. Note the background color of **Component A** (ApplicationComponent)
2. Note the background color of **Component B** (ApplicationComponent)
   - **Expected**: **Component A** and **Component B** have the **same color** because they share
     the type ApplicationComponent
3. Note the background color of **Service X** (ApplicationService)
   - **Expected**: **Service X** has a **different color** from the ApplicationComponent nodes
4. Note the color of the **AssociationRelationship** edge (Component A → Component B)
5. Reload the page; wait for **Test Architecture** to auto-load
   - **Expected**: All node and edge colors are identical to those noted in steps 1–4 (colors are
     deterministic based on type name hashing, not random)

### Post-conditions

- Colors are identical before and after reload

### Test Data

| Field                | Value                                               |
| -------------------- | --------------------------------------------------- |
| Model                | Test Architecture                                   |
| Same-color nodes     | Component A, Component B (ApplicationComponent)     |
| Different-color node | Service X (ApplicationService)                      |
| Edge for color check | Component A → Component B (AssociationRelationship) |
