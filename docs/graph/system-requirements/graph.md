# SR-2: Graph

## Scenarios

### SR-2.1: Representation

The system visualizes the model using consistent visual markers for nodes and edges.

#### Functional Requirements

- [FR-2.1](../functional-requirements.md#fr-2-graph): Render entities as nodes and relationships as
  edges.

#### User Story

As a user, I want to see a graph where nodes represent entities and edges represent relationships
with clear labels.

#### Preconditions

- A model is loaded and the Graph view is active.

#### Steps

1. Observe the graph canvas.
   - Entities are rendered as nodes and relationships as directed edges.
   - Nodes of the same type share the same color; different types are visually distinct.
   - Node labels display the entity name, or the entity type if the name is missing.
2. Inspect relationship markers.
   - Edges connect source and target nodes with arrowheads indicating direction.
   - Edge labels display the relationship name when available.

#### Edge Cases

- **Empty Model**: An empty canvas is displayed without errors.
- **Missing Names**: Nodes display their type name as a fallback label.

### SR-2.2: Legend

The system provides a legend to explain the visual encoding of model elements.

#### Functional Requirements

- [FR-2.8](../functional-requirements.md#fr-2-graph): Provide a legend for entity and relationship
  types.

#### User Story

As a user, I want a legend that identifies the colors and markers used for each entity and
relationship type.

#### Preconditions

- A model is loaded and the Graph view is active.

#### Steps

1. Toggle the legend display.
   - A legend panel appears on the canvas listing only the types currently visible.
   - Each entry displays a color marker matching the elements on the canvas.
2. Reposition the legend by dragging it across the canvas.
   - The legend moves to the new position and remains there globally across all models and sessions.
3. Filter out an entity type using global filters.
   - The legend updates automatically to remove the hidden type.

#### Edge Cases

- **Out of Bounds**: If the canvas is resized, the system ensures the legend remains within the
  visible boundaries.

### SR-2.3: Navigation

The system provides interactive controls to move and scale the view.

#### Functional Requirements

- [FR-2.3](../functional-requirements.md#fr-2-graph): Enable interactive panning and zooming.

#### User Story

As a user, I want to pan, zoom, and fit the model to the view to navigate through the canvas.

#### Preconditions

- A model is loaded and the Graph view is active.

#### Steps

1. Scale the view (zoom).
   - The graph enlarges or shrinks centered on the cursor position.
2. Move the canvas (pan).
   - The view shifts to reveal different parts of the model.
3. Trigger the "Fit to View" command.
   - The system centers and scales the graph to display all visible nodes with padding.

#### Edge Cases

- **Zoom Limits**: Zooming stops at predefined minimum and maximum thresholds.

### SR-2.4: Layouts

The system organizes the spatial arrangement of elements using automated algorithms.

#### Functional Requirements

- [FR-2.2](../functional-requirements.md#fr-2-graph): Provide multiple automated layout algorithms.

#### User Story

As a user, I want to switch between layout algorithms and refresh them to keep the model organized.

#### Preconditions

- A model is loaded and the Graph view is active.

#### Steps

1. Choose a different layout algorithm from the settings.
   - Nodes smoothly transition to new positions based on the selected logic.
2. Manually reposition nodes by dragging.
3. Trigger the layout refresh command.
   - The system re-applies the current algorithm, returning nodes to their calculated positions.

#### Edge Cases

- **Performance Threshold**: For very large models, animations are disabled during layout
  transitions to maintain responsiveness.

### SR-2.5: Selection

The system provides detailed information for selected graph elements.

#### Functional Requirements

- [FR-2.4](../functional-requirements.md#fr-2-graph): Display entity and relationship properties in
  a dedicated panel.

#### User Story

As a user, I want to select an element to see its properties and navigate to related entities.

#### Preconditions

- A model is loaded and the Graph view is active.

#### Steps

1. Select a node or an edge on the canvas.
   - The element receives a visual highlight and the properties panel opens.
2. Select a related entity link within the properties panel.
   - The system updates the selection and performs a smooth centering animation on the target node.
3. Deselect the element by clicking the canvas background.
   - The highlight is removed and the properties panel clears.

### SR-2.6: Highlight Mode

The system provides a visual focus by dimming unrelated elements when a node is selected.

#### Functional Requirements

- [FR-2.5](../functional-requirements.md#fr-2-graph): Support focus modes to highlight local
  neighborhoods.

#### User Story

As a user, I want to highlight a selected node's neighborhood while fading the rest of the model
without repositioning elements.

#### Preconditions

- A model is loaded and the Graph view is active.

#### Steps

1. Enable the "Highlight" toggle in the visualization settings.
2. Select a node on the canvas.
   - The selected node and its connections (based on the current depth) remain fully visible.
   - All other visible model elements are dimmed.
3. Adjust the exploration depth while Highlight is active.
   - The set of fully visible nodes and edges expands or shrinks, but their spatial positions remain
     unchanged.

### SR-2.7: Drill-down

The system provides a specialized exploration mode focused on the local context of a root node.

#### Functional Requirements

- [FR-2.6](../functional-requirements.md#fr-2-graph): Enable neighborhood drill-down with
  configurable relationship depth.

#### User Story

As a user, I want to enter a dedicated view for an entity and control its neighborhood with an
automatic layout.

#### Preconditions

- A model is loaded and the Graph view is active.

#### Steps

1. Activate drill-down for a specific node (e.g., via double-click).
   - The view clears everything except the root node and its neighbors within the current depth.
   - A drill-down navigation bar appears with depth controls.
2. Increase or decrease the exploration depth.
   - The graph expands or shrinks, and the system automatically recalculates the layout.
3. Exit drill-down mode by clicking the application name in the header.
   - The system restores the full model view and performs a layout recalculation.

### SR-2.8: Containment

The system supports different visual representations for parent-child hierarchies.

#### Functional Requirements

- [FR-2.7](../functional-requirements.md#fr-2-graph): Support alternative containment visualizations
  (e.g., nested nodes vs. edges).

#### User Story

As a user, I want to choose how physical containment is visualized: as edges or as nested nodes.

#### Preconditions

- A model is loaded and the Graph view is active.

#### Steps

1. Switch containment mode to "Edge-based".
   - Physical containment is represented by synthetic edges with distinctive markers.
2. Switch containment mode to "Compound".
   - Child nodes are visually nested inside their parent nodes, and the layout re-calculates.

#### Edge Cases

- **Orphaned Entities**: If a parent node is hidden, its child nodes are rendered as top-level
  nodes, and the layout is recalculated.

## Business Rules

- **Containment Definition**: Physical containment is a structural hierarchy
  (Composition/Parent-Child), distinct from standard relationships.
- **Relayout Policy**: The system recalculates the layout whenever the set of **visible** entities
  or relationships changes (e.g., changing filters, containment modes, or entering/exiting
  Drill-down).
- **Highlight Exception**: Changes in the Highlight scope (including depth) **do not** trigger a
  relayout.
- **Neighborhood Logic**: Relationships between nodes at the same distance level $N$ from the root
  are hidden. They are only displayed if the exploration depth is increased to $N+1$.
- **Depth Limit**: The maximum exploration depth for Drill-down and Highlight modes is 5 levels.
- **Legend Persistence**: The legend position is global for the application and remains constant
  across all models.
- **Reset Trigger**: The application name in the header (accompanied by a dropdown/switch icon) acts
  as the trigger for model switching and exits any active Drill-down mode.
- **Navigation Sync**: Selecting a record in the Table view or a link in the Properties panel
  triggers a smooth centering animation on the corresponding node. Standard clicks on the canvas
  background or nodes do not move the camera.

## UI/UX Functional Details

- **Feedback**: A loading indicator is displayed for any operation exceeding 200ms.
- **Keyboard Navigation**: `Esc` (Clear selection/Exit modes), `+`/`-` (Zoom), `Arrows` (Pan).
- **Animations**: Node movements are animated only when the visible node count is below 400.
- **Highlight Opacity**: Faded nodes use 35% opacity; faded edges use 15%.

## Technical Notes

- **URL Contract**: Only `entity` (root ID) and `depth` for Drill-down are encoded in the URL.
- **State Management**:
  - `pushState`: Major transitions (Model switch, Graph/Table switch, entering Drill-down).
  - `replaceState`: Minor adjustments (filters, sorting, Drill-down depth).
  - **Transient state**: Pan and Zoom levels are session-only and are **lost upon page refresh**.
- **Security**: All in-memory data is purged upon user logout.
