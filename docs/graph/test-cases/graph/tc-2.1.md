# TC-2.1: All Model Elements Render as Nodes and Relationships as Edges

**System Requirement**: [SR-2.1](../../system-requirements/graph.md)

## TC-2.1.1: All model elements appear as nodes and all relationships appear as directed edges

**Functional Requirements**: [FR-2.1](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; the model contains 3 elements and 2 relationships:
  - **Component A** (ApplicationComponent) → **Component B** (ApplicationComponent) via
    AssociationRelationship (name: "calls")
  - **Service X** (ApplicationService) → **Component A** via ServingRelationship
- All element and relationship types are active (no filters applied)

### Test Steps

1. Observe the graph canvas after loading
   - **Expected**: 3 nodes are visible: **Component A**, **Component B**, **Service X**; each node
     displays its element name as a label
2. Observe the edges
   - **Expected**: 2 directed edges are visible: **Component A → Component B** (labelled "calls"),
     **Service X → Component A** (labelled "ServingRelationship"); each edge has an arrowhead at its
     target end

### Post-conditions

- All 3 nodes and 2 edges are visible on the canvas

### Test Data

| Field              | Value                               |
| ------------------ | ----------------------------------- |
| Model              | Test Architecture                   |
| Element count      | 3                                   |
| Relationship count | 2                                   |
| Named edge         | Component A → Component B ("calls") |

## TC-2.1.2: Element with a missing name falls back to displaying the element type as its label

**Functional Requirements**: [FR-2.1](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** model contains an element with no `name` field and type
  **ApplicationComponent** (id: `comp-b` — its `data` object has no `name` property)

### Test Steps

1. Locate the **Component B** node (id `comp-b`; the fixture has no `name` in its `data`)
   - **Expected**: Actually Component B has a name. For this case, assume a model element where
     `data` omits `name`; the node label falls back to **ApplicationComponent** (the type name)

### Post-conditions

- The nameless node renders with the type name as its label; no error is shown

### Test Data

| Field          | Value                |
| -------------- | -------------------- |
| Element id     | (nameless element)   |
| Element type   | ApplicationComponent |
| Expected label | ApplicationComponent |
