# TC-2.2: Legend

**System Requirement**: [SR-2.2](../../system-requirements/graph.md#sr-22-legend)

## TC-2.2.1: Toggle legend display on/off

### Preconditions

- Graph view active, model loaded
- Legend panel is currently hidden

### Steps

1. Open graph settings or toolbar
2. Find the "Legend" toggle/button
3. Click to enable legend
   - Legend panel appears on the canvas (e.g., top-right corner by default)
4. Toggle legend off
   - Legend panel disappears from view
   - Legend visibility is controllable
   - State persists across sessions? (Check persistence)

### Test Data

| Action     | Legend visible? |
| ---------- | --------------- |
| toggle ON  | yes             |
| toggle OFF | no              |

## TC-2.2.2: Legend lists only types currently visible

### Preconditions

- Model has entity types: `Microservice` (visible), `Database` (unchecked via filter), `Queue`
  (visible)
- Legend is enabled

### Steps

1. Observe the legend content
   - Legend shows only `Microservice` and `Queue` entries
   - `Database` is absent because it's filtered out (count=0 and unchecked)
2. Re-check `Database` in filter panel
   - Legend updates to include `Database` entry
3. Uncheck `Queue` (make it hidden)
   - `Queue` disappears from legend
   - Legend reflects current filter visibility

### Test Data

| Filter state (entity types)         | Legend entries      |
| ----------------------------------- | ------------------- |
| Microservice ✓, Database ✗, Queue ✓ | Microservice, Queue |
| All checked                         | all types           |

## TC-2.2.3: Each legend entry shows color marker and type name

### Preconditions

- Graph with `Microservice` (blue), `Database` (green)
- Legend enabled

### Steps

1. Inspect the `Microservice` legend entry
   - Entry consists of:
     - Color swatch/marker (blue circle or square)
     - Text label: "Microservice"
2. Inspect `Database` entry
   - Green marker, "Database" text
   - Legend clearly maps colors to types

### Test Data

| Type         | Color marker | Label text   |
| ------------ | ------------ | ------------ |
| Microservice | blue         | Microservice |
| Database     | green        | Database     |

## TC-2.2.4: Legend position is draggable and persists globally

### Preconditions

- Legend is visible
- Initial position: top-right corner

### Steps

1. Drag the legend panel to the bottom-left corner
   - Legend moves smoothly to new location
2. Switch to a different model (or reload)
   - Legend appears in the same saved position (bottom-left), not default top-right
3. Restart the application
   - Legend position is remembered globally across models and sessions
   - Legend position is user-customizable and persistent

### Test Data

| Action                | Legend position saved? |
| --------------------- | ---------------------- |
| Drag to new location  | yes                    |
| Reload / model change | same location          |

## TC-2.2.5: Legend updates on filter changes (removes hidden types)

### Preconditions

- Legend showing: Microservice, Database, Queue
- All entity types checked

### Steps

1. Uncheck `Database` in filter panel
   - Legend updates immediately to remove `Database` entry
2. Re-check `Database`
   - Legend updates to add `Database` back (with correct color marker)
   - Legend stays in sync with filter state

### Test Data

| Filter change: Database unchecked | Legend shows Database? |
| --------------------------------- | ---------------------- |
| Yes → no entry                    | no                     |
| Re-check → yes                    | yes                    |

## TC-2.2.6: Relationship types may also appear in legend (if applicable)

### Preconditions

- Legend is configured to show relationships optionally
- Model has relationship types: `Calls`, `DependsOn`
- These relationship types have distinct visual styles (colors or line patterns)

### Steps

1. If legend has separate section or toggle for relationships, enable it
   - Legend shows entries for relationship types with their style markers (line pattern sample or
     color dot)
2. Verify relationship entries
   - Each relationship type displays:
     - Visual sample (e.g., dashed line icon for DependsOn)
     - Type name (e.g., "DependsOn")
3. Filter out a relationship type using relationship filter panel
   - That relationship type disappears from legend (if implementation includes relationships in
     legend)
   - Legend may cover both entities and relationships depending on settings

### Test Data

| Legend settings               | Expected content  |
| ----------------------------- | ----------------- |
| Show entities only            | entity types list |
| Show entities + relationships | both lists        |

## TC-2.2.7: Canvas resize keeps legend within bounds

### Preconditions

- Legend positioned near the right edge of the canvas
- Window is resized narrower

### Steps

1. Note legend position (e.g., x=950px from left)
2. Resize browser window to be narrower (canvas width reduces)
   - Legend automatically repositions to stay fully within visible canvas area (e.g., moves left)
   - No part of legend is clipped outside the viewport
   - Legend remains accessible after resize

### Test Data

| Initial position | After resize (smaller width) |
| ---------------- | ---------------------------- |
| near right edge  | adjusted leftwards           |

## TC-2.2.8: Legend does not interfere with node interactions

### Preconditions

- Legend panel is visible and positioned over the graph canvas (e.g., top-right)

### Steps

1. Try to click on a node that is partially behind the legend panel
   - Node is not clickable if covered by legend (or legend has pointer-events: none if designed to
     be non-blocking)
2. Pan/zoom the graph
   - If legend is part of the canvas overlay (not a fixed DOM element), it should move with the
     graph or stay fixed in screen coordinates depending on implementation
   - Typically, legend is a fixed overlay that does not pan with the graph
   - Legend does not block important interactions

### Test Data

| Legend overlay behavior | Nodes behind legend clickable? |
| ----------------------- | ------------------------------ |
| blocking (DOM overlay)  | no (legend consumes click)     |
| non-blocking            | yes (pass through)             |
