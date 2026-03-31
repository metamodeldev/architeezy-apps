# TC-2.1: Representation

**System Requirement**: [SR-2.1](../../system-requirements/graph.md#sr-21-representation)

## TC-2.1.1: Entities render as nodes with visual encoding by type

### Preconditions

- Model loaded with entity types: `Microservice` (color: blue), `Database` (color: green), `Queue` (color: orange)
- Graph view active

### Test Steps

1. Observe the graph canvas
   - **Expected**: Entities are rendered as nodes (shapes: circles or rounded rectangles)
   - Each node displays:
     - Shape/color matching its type
     - Label: entity name (if defined), fallback to entity type if name is missing
2. Verify different types have distinct colors
   - **Expected**: Microservice nodes are blue; Database nodes are green; Queue nodes are orange
3. Verify entity with missing name
   - **Expected**: Node shows its type label (e.g., "Microservice") instead of blank

### Post-conditions

- Visual encoding is consistent across model

### Test Data

| Entity type   | Expected color | Label fallback behavior |
| ------------- | -------------- | ----------------------- |
| Microservice  | blue           | name or "Microservice"  |
| Database      | green          | name or "Database"      |
| Queue         | orange         | name or "Queue"         |

## TC-2.1.2: Relationships render as directed edges with labels

### Preconditions

- Model with relationships of types: `Calls`, `DependsOn`, `Produces`
- Entities are visible

### Test Steps

1. Observe edges between nodes
   - **Expected**: Relationships rendered as lines/arrows connecting source to target
   - Arrowhead indicates direction (source → target)
   - Edge label displays relationship name when available (e.g., "Calls", "HTTP")
   - If name missing, may show type or be unlabeled
2. Verify directionality
   - **Expected**: Arrow points from source entity to target entity; direction matches data model
3. Check label positioning
   - **Expected**: Labels placed near the middle of the edge, not overlapping nodes excessively

### Post-conditions

- Edges clearly show relationships and direction

### Test Data

| Relationship type | Expected visual |
| ----------------- | --------------- |
| Calls             | arrow + label   |
| DependsOn         | arrow + label   |

## TC-2.1.3: Different relationship types have distinct visual styles

### Preconditions

- Model has `Calls` (solid line), `DependsOn` (dashed line), `Produces` (dotted line)

### Test Steps

1. Compare edges of different types
   - **Expected**: Each type has a unique visual marker:
     - Line style (solid, dashed, dotted, etc.)
     - Color (optional)
     - Arrowhead shape (optional)
2. Verify legend (if enabled) matches styles
   - **Expected**: Legend correctly describes each type's edge appearance

### Post-conditions

- Types are distinguishable by edge style

### Test Data

| Type       | Line style  |
| ---------- | ----------- |
| Calls      | solid       |
| DependsOn  | dashed      |
| Produces   | dotted      |

## TC-2.1.4: Empty model shows empty canvas without errors

### Preconditions

- Model has no entities and no relationships

### Test Steps

1. Load the model and switch to Graph view
   - **Expected**: Canvas is empty (no nodes, no edges)
   - No error messages or broken rendering
   - Possibly a placeholder message: "This model contains no data"
2. Interact with zoom/pan
   - **Expected**: Canvas is empty but controls work normally

### Post-conditions

- Empty state handled gracefully

### Test Data

| Model content | Expected graph state |
| ------------- | ------------------- |
| no entities   | empty canvas        |

## TC-2.1.5: Node labels do not overlap excessively

### Preconditions

- Graph with many nodes placed close together (dense area)

### Test Steps

1. Observe label rendering
   - **Expected**: Labels are positioned to minimize overlap:
     - May be rendered outside node bounds
     - May be truncated with ellipsis if too long
     - May be hidden if severe overlap (depending on implementation)
2. Zoom in
   - **Expected**: Labels remain readable, or become fully visible as space allows

### Post-conditions

- Graph remains readable at various zoom levels

### Test Data

| Node density | Label behavior                     |
| ------------ | ---------------------------------- |
| high         | minimal overlap, maybe truncated  |

## TC-2.1.6: Edge labels follow edge path

### Preconditions

- Curved edges or edges with bends

### Test Steps

1. Observe edge labels
   - **Expected**: Labels are placed along the edge path (centered), not floating far away
2. Zoom and pan
   - **Expected**: Labels maintain correct position relative to edge

### Post-conditions

- Labels stay attached to edges

### Test Data

| Edge curvature | Label placement       |
| -------------- | --------------------- |
| curved        | along the curve       |
