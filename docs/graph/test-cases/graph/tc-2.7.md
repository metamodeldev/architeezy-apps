# TC-2.7: Containment Visualization Modes

**System Requirement**: [SR-2.7](../../system-requirements/graph.md)

## TC-2.7.1: "Edges" containment mode adds synthetic diamond-marker edges

**Functional Requirements**: [FR-7.3](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- A model is loaded that contains a parent–child containment relationship; the parent element is
  **Inventory System** (ApplicationComponent) and the child is **Payment Service**
  (ApplicationComponent)
- Containment mode is **none**; no containment edge is visible between these two nodes

### Test Steps

1. Open the Settings section; change the **Nesting** dropdown to **edges ◆**
   - **Expected**: A synthetic containment edge appears from **Inventory System** to **Payment
     Service** with a filled **diamond marker** at the source end; the edge is visually distinct
     from regular directed edges
2. Switch the **Nesting** dropdown back to **none**
   - **Expected**: The diamond-marker containment edge disappears; only regular edges remain

### Post-conditions

- Nesting mode is **none**; no synthetic containment edges are visible

### Test Data

| Field       | Value                    |
| ----------- | ------------------------ |
| Parent node | Inventory System         |
| Child node  | Payment Service          |
| Edge marker | Filled diamond at source |

## TC-2.7.2: "Compound" containment mode nests child nodes inside parent nodes

**Functional Requirements**: [FR-7.3](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- The same model from TC-2.7.1 is loaded; containment mode is **none**

### Test Steps

1. Change the **Nesting** dropdown to **shapes ⬚**
   - **Expected**: **Payment Service** appears visually nested inside **Inventory System**;
     **Inventory System** renders as a rounded rectangle (compound node) that contains **Payment
     Service** within its bounding box

### Post-conditions

- Nesting mode is **compound**; Payment Service is nested inside Inventory System

### Test Data

| Field       | Value            |
| ----------- | ---------------- |
| Parent node | Inventory System |
| Child node  | Payment Service  |

## TC-2.7.3: In compound mode, child remains as a top-level node when its parent is filtered out

**Functional Requirements**: [FR-7.3](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- Nesting mode is **compound**; **Payment Service** is nested inside **Inventory System**; both are
  ApplicationComponent

### Test Steps

1. Uncheck **ApplicationComponent** in the Entities filter
   - **Expected**: **Inventory System** is hidden (its type is filtered); **Payment Service**
     becomes a **top-level node** on the canvas — it is no longer nested and remains visible

### Post-conditions

- Inventory System is hidden; Payment Service is visible as a top-level node

### Test Data

| Field         | Value                       |
| ------------- | --------------------------- |
| Filtered type | ApplicationComponent        |
| Hidden node   | Inventory System            |
| Promoted node | Payment Service (top-level) |
