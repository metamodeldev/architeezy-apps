# TC-2.9: Legend Visibility and Content

**System Requirement**: [SR-2.9](../../system-requirements/graph.md)

## TC-2.9.1: Enabling the Legend setting makes the legend appear on the canvas

**Functional Requirements**: [FR-2.5](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; the graph view is active with 3 element types
  (**ApplicationComponent**, **ApplicationService**, **DataObject**) and 2 relationship types
  (**AssociationRelationship**, **ServingRelationship**) all visible
- The **Legend** toggle in Settings is **disabled**; no legend is visible on the canvas

### Test Steps

1. Open the Settings section and enable the **Legend** toggle
   - **Expected**: A legend shape appears on the graph canvas; it contains a section listing element
     types — **ApplicationComponent**, **ApplicationService**, **DataObject** — each preceded by a
     filled color circle; it also contains a section listing relationship types —
     **AssociationRelationship**, **ServingRelationship** — each preceded by a filled color circle
2. Compare the color circles in the legend with the color indicators in the Entities filter panel
   - **Expected**: The color for each type in the legend is identical to the color shown next to
     that type in the filter panel

### Post-conditions

- The legend is visible on the canvas

### Test Data

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Model              | Test Architecture                                    |
| Element types      | ApplicationComponent, ApplicationService, DataObject |
| Relationship types | AssociationRelationship, ServingRelationship         |

## TC-2.9.2: Legend lists only types that are currently visible in the graph

**Functional Requirements**: [FR-2.5](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; the legend is **enabled** and visible; all types are shown in the
  legend — **ApplicationComponent**, **ApplicationService**, **DataObject**,
  **AssociationRelationship**, **ServingRelationship**

### Test Steps

1. In the Entities filter panel, uncheck **DataObject**
   - **Expected**: All **DataObject** nodes disappear from the graph; the legend no longer contains
     an entry for **DataObject**; all other entries remain unchanged
2. In the Relationships filter panel, uncheck **AssociationRelationship**
   - **Expected**: All **AssociationRelationship** edges disappear; the legend no longer contains an
     entry for **AssociationRelationship**

### Post-conditions

- The legend shows **ApplicationComponent**, **ApplicationService**, and **ServingRelationship**
  only

### Test Data

| Field               | Value                   |
| ------------------- | ----------------------- |
| Model               | Test Architecture       |
| Filtered out (type) | DataObject              |
| Filtered out (rel)  | AssociationRelationship |

## TC-2.9.3: Disabling the Legend setting removes the legend from the canvas

**Functional Requirements**: [FR-2.5](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; the legend is **enabled** and visible on the canvas

### Test Steps

1. Open the Settings section and disable the **Legend** toggle
   - **Expected**: The legend shape disappears from the graph canvas immediately; no legend-related
     shape or overlay remains visible

### Post-conditions

- The canvas shows only graph nodes and edges; no legend is present

### Test Data

| Field  | Value             |
| ------ | ----------------- |
| Model  | Test Architecture |
| Toggle | Disabled          |

## TC-2.9.4: Legend can be repositioned by dragging

**Functional Requirements**: [FR-2.5](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; the legend is **enabled**; the legend is positioned in its
  default location on the canvas

### Test Steps

1. Note the current position of the legend on the canvas
2. Drag the legend to a different position (e.g., top-left corner of the canvas)
   - **Expected**: The legend moves with the drag gesture and settles at the new position; it does
     not snap back to its original location
3. Zoom and pan the graph
   - **Expected**: The legend remains at its new canvas position relative to the graph; it moves
     with the canvas as expected for a canvas-native element

### Post-conditions

- The legend is at the new dragged position on the canvas

### Test Data

| Field | Value             |
| ----- | ----------------- |
| Model | Test Architecture |

## TC-2.9.7: Legend is re-clamped automatically when the canvas shrinks

**Functional Requirements**: [FR-2.5](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; the legend is **enabled** and positioned near the right edge of
  the canvas (within bounds for the current canvas size)

### Test Steps

1. Reduce the canvas width (e.g., by shrinking the browser window) so the legend's current position
   would extend beyond the new right boundary
   - **Expected**: The legend is automatically repositioned to stay within the new canvas bounds
     with at least 5 px margin; no user interaction is required; the adjustment is immediate

### Post-conditions

- The legend is fully visible within the resized canvas area

### Test Data

| Field  | Value             |
| ------ | ----------------- |
| Model  | Test Architecture |
| Resize | Viewport shrinks  |

## TC-2.9.6: Legend is clamped to canvas bounds when dragged beyond the edge

**Functional Requirements**: [FR-2.5](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; the legend is **enabled** and visible on the canvas

### Test Steps

1. Drag the legend far past the right and bottom edges of the graph canvas
   - **Expected**: After releasing the drag, the legend is repositioned to stay within the canvas
     boundaries; at least 5 px of spacing separates each edge of the legend from the corresponding
     canvas boundary; the legend is never partially clipped outside the canvas

### Post-conditions

- The legend is fully visible within the canvas area with the minimum 5 px margin preserved

### Test Data

| Field  | Value             |
| ------ | ----------------- |
| Model  | Test Architecture |
| Margin | 5 px              |

## TC-2.9.5: Legend shows no entries when all types are filtered out

**Functional Requirements**: [FR-2.5](../../functional-requirements.md#fr-2-graph-visualization)

### Preconditions

- **Test Architecture** is loaded; the legend is **enabled**; all element and relationship types are
  visible

### Test Steps

1. Click **Select none** in the Entities filter and **Select none** in the Relationships filter
   - **Expected**: All nodes and edges disappear from the canvas; the legend remains visible on the
     canvas but contains no type entries (the legend shape is present but empty or shows only
     section headers with no rows)

### Post-conditions

- The canvas is empty; the legend is visible but contains no entries

### Test Data

| Field | Value             |
| ----- | ----------------- |
| Model | Test Architecture |
