# SR-2: Graph Interactions and Visualization

**Functional Requirements**:
[FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5](../functional-requirements.md#fr-2-graph-visualization)

## User Story

As a user, I want to visualize my model as an interactive graph, navigate efficiently, explore node
details, and customize the layout and containment visualization to understand the architecture.

## Acceptance Criteria

- [SR-2.1](#sr-21-all-model-elements-render-as-nodes-all-relationships-as-edges): All model elements
  render as nodes, all relationships as edges
- [SR-2.2](#sr-22-colors-are-consistent-based-on-elementrelationship-types): Colors are consistent
  based on element/relationship types
- [SR-2.3](#sr-23-user-can-switch-between-multiple-layout-algorithms): User can switch between
  multiple layout algorithms
- [SR-2.4](#sr-24-user-can-zoom-and-pan-to-navigate-the-graph): User can zoom and pan to navigate
  the graph
- [SR-2.5](#sr-25-single-click-on-a-node-selects-it-and-shows-details-in-the-panel): Single-click on
  a node selects it and shows details in the panel
- [SR-2.6](#sr-26-double-click-on-a-node-triggers-drill-down-mode): Double-click on a node triggers
  drill-down mode
- [SR-2.7](#sr-27-containment-relationships-can-be-displayed-as-synthetic-edges-or-nested-compound-nodes):
  Containment relationships can be displayed as synthetic edges or nested compound nodes
- [SR-2.8](#sr-28-selection-zoom-and-pan-state-are-preserved-when-switching-between-graph-and-table-views):
  Selection, zoom, and pan state are preserved when switching between graph and table views
- [SR-2.9](#sr-29-user-can-show-or-hide-the-legend-on-the-graph-canvas): User can show or hide the
  legend on the graph canvas
- [SR-2.10](#sr-210-user-can-refresh-the-current-layout-to-re-apply-the-layout-algorithm): User can
  refresh the current layout to re-apply the layout algorithm

## Scenarios

### SR-2.1: All model elements render as nodes, all relationships as edges

#### Preconditions

- Model is loaded with elements and relationships
- Graph view is active

#### Steps

1. **Open graph view**
   - Canvas renders without errors
   - A node appears for each model element
   - An edge appears for each relationship whose both endpoints are present

2. **Inspect node representations**
   - Each node displays a symbol or shape reflecting its element type
   - Node label shows the element name, falling back to the element type if name is absent

3. **Inspect edge representations**
   - Each edge connects its source and target nodes with an arrowhead indicating direction
   - Edge label shows the relationship name when available

#### Edge Cases

- **Model with zero elements** — graph displays an empty canvas without errors
- **Element with missing name** — node label falls back to the element type name
- **Relationship with missing endpoint** — edge is not rendered
- **Graph not yet rendered** — early interactions are ignored without errors
- **Very large model** (many thousands of nodes) — initial rendering may take several seconds;
  future improvements could include progressive rendering

### SR-2.2: Colors are consistent based on element/relationship types

#### Preconditions

- Model is loaded with multiple element types and relationship types
- Graph view is active

#### Steps

1. **Observe nodes across the graph**
   - All nodes of the same element type display the same color
   - Colors differ visibly between distinct element types

2. **Observe edges across the graph**
   - All edges of the same relationship type display the same color
   - Colors differ visibly between distinct relationship types

3. **Switch to a different layout and observe colors**
   - Node and edge colors remain unchanged after the layout change
   - Colors are independent of node position or graph structure

### SR-2.3: User can switch between multiple layout algorithms

#### Preconditions

- Model is loaded
- Graph view is active

#### Steps

1. **Open graph settings**
   - A dropdown lists available layout algorithms
   - The current algorithm is indicated as selected

2. **Select a different layout algorithm**
   - Graph immediately begins restructuring using the selected algorithm
   - Animations smooth the transition when the node count allows

3. **Wait for the layout to complete**
   - Nodes settle into their new positions
   - Compound node labels adjust for readability within their containers

#### Edge Cases

- **Layout switching during another layout** — new layout applies on top; temporary flicker is
  acceptable for the initial implementation
- **Large graph** (many nodes) — animations are disabled for performance; layout still completes

### SR-2.4: User can zoom and pan to navigate the graph

#### Preconditions

- Model is loaded
- Graph view is active and displaying nodes

#### Steps

1. **Scroll the mouse wheel over the canvas**
   - Graph zooms in or out centered on the cursor position
   - Zoom does not exceed the minimum or maximum limit

2. **Drag with the middle mouse button**
   - Canvas pans in the drag direction
   - Motion feels responsive

3. **Click the fit button**
   - Graph scales and centers to show all visible nodes with padding

### SR-2.5: Single-click on a node selects it and shows details in the panel

#### Preconditions

- Model is loaded with at least two related elements
- Graph view is active

#### Steps

1. **Single-click a node**
   - After a brief delay, the node is selected
   - The node receives visual emphasis (highlighted border or glow)

2. **Observe the details panel**
   - Panel opens showing element name and type
   - Documentation is shown if available
   - A list of related elements with their relationship types is shown

3. **Click a related element in the details panel**
   - Drill mode activates on that node
   - The graph narrows to that node's neighborhood

4. **Click an empty area of the canvas**
   - Selection clears
   - Details panel returns to its placeholder state

#### Edge Cases

- **Rapid clicking** — single-click delay prevents interference; double-click reliably cancels the
  single-click action

### SR-2.6: Double-click on a node triggers drill-down mode

#### Preconditions

- Model is loaded with connected elements
- Graph view is active

#### Steps

1. **Double-click a node**
   - Single-click action is cancelled before it fires
   - Drill mode activates immediately

2. **Observe the drill UI**
   - Drill bar appears showing the selected node label and an exit option
   - The drill root node receives distinctive highlighting
   - Graph narrows to the node's neighborhood at the current depth

3. **Change the drill depth in settings**
   - Depth buttons (1–5) reflect the new selection
   - Drill scope recalculates to include more or fewer nodes
   - Count badges update to reflect the new scope

#### Edge Cases

- **Rapid clicking** — double-click reliably cancels the single-click action

### SR-2.7: Containment relationships can be displayed as synthetic edges or nested compound nodes

#### Preconditions

- Model is loaded with elements that have parent-child containment relationships
- Graph view is active

#### Steps

1. **Open containment mode settings**
   - Three options are shown: none, synthetic edges, compound nodes
   - The current mode is indicated as selected

2. **Switch to synthetic edge mode**
   - Graph updates to represent containment as edges with diamond markers
   - Current element visibility is preserved during the switch

3. **Switch to compound node mode**
   - Child nodes appear nested inside their parent nodes on the canvas
   - Current element visibility is preserved during the switch

4. **Switch back to no containment mode**
   - Graph returns to a flat representation without any containment visualization

#### Edge Cases

- **Circular parent references** — handled gracefully without infinite loops
- **Child without parent in graph** (compound mode) — child remains visible as a top-level node if
  its parent is filtered out
- **Deep nesting** (multiple levels) — nested compound nodes display correctly; labels may wrap

### SR-2.8: Selection, zoom, and pan state are preserved when switching between graph and table views

#### Preconditions

- Model is loaded
- Both graph and table views are available

#### Steps

1. **Set a zoom level and pan position in the graph view**
   - Canvas reflects the applied zoom and pan offset

2. **Select a node in the graph view**
   - The node is highlighted; details panel opens

3. **Switch to table view**
   - Table view loads; graph is no longer visible

4. **Click a row in the table**
   - View switches back to the graph
   - The clicked row's node is selected and centered on screen
   - Zoom and pan match the state from step 1

### SR-2.9: User can show or hide the legend on the graph canvas

#### Preconditions

- Model is loaded with multiple element and relationship types
- Graph view is active

#### Steps

1. **Enable the Legend toggle in settings**
   - A legend shape appears on the canvas
   - The legend lists all visible element types, then all visible relationship types
   - Each entry shows a color circle matching the type's color in the filter panel

2. **Drag the legend to a new position**
   - Legend moves to the chosen position and stays there

3. **Hide a relationship type using the filter panel**
   - The legend removes that type's entry automatically

4. **Disable the Legend toggle**
   - The legend disappears from the canvas

#### Edge Cases

- **Legend enabled with all types filtered out** — legend is shown but contains no entries
- **Legend enabled with only one type visible** — legend shows a single entry

### SR-2.10: User can refresh the current layout to re-apply the layout algorithm

#### Preconditions

- Model is loaded
- Graph view is active
- User has manually repositioned nodes by dragging

#### Steps

1. **Note the current zoom level and pan position**
   - Current zoom and pan serve as the baseline for verification after refresh

2. **Click the layout refresh button**
   - The graph re-applies the current layout algorithm
   - Nodes reposition according to the algorithm's arrangement
   - Animations smooth the transition if the node count allows

3. **Verify zoom and pan state**
   - Zoom level and pan position are unchanged from step 1

#### Edge Cases

- **Refresh during layout computation** — request is ignored until the current layout completes, or
  cancels it and starts a new one (implementation choice)

## Business Rules

### Graph Rendering

- Node colors are derived from element types using a deterministic method for consistency.
- Edge colors are derived from relationship types similarly.
- Containment relationships are handled through one of three modes: no visualization, synthetic
  edges, or compound nodes.
- Containment modes:
  - None: no special representation of parent-child relationships
  - Edges: synthetic edges with special markers show containment
  - Compound: child nodes visually nested inside parent nodes

### Legend

- Legend visibility is controlled by a dedicated toggle in the visualization settings.
- When visible, the legend lists all element types that have at least one visible node, followed by
  all relationship types that have at least one visible edge, in the order they appear in the filter
  panel.
- Each entry is preceded by a color indicator matching the type's color in the graph and filter
  panel.
- The legend can be repositioned by dragging and is included in image exports.
- The legend updates automatically whenever the set of visible types changes.
- The legend's position persists across sessions. When the persisted position would place the legend
  outside the canvas, the position is clamped to keep the legend within the canvas bounds. Clamping
  also applies after each drag and whenever the canvas is resized.
- Position adjustments caused by canvas resize are not persisted — the saved position reflects the
  user's last drag and is re-evaluated on each load and resize.
- Legend visibility preference persists across sessions.

### Layout Switching

- Multiple layout algorithms are available, each suited to different model structures.
- Layout selection triggers immediate application of the new layout.
- The current layout algorithm selection persists for the session.

### Navigation

- Zoom has minimum and maximum limits.
- Zoom increments are consistent and predictable.
- Fit-to-view scales the canvas to show all visible nodes with appropriate padding.

### Selection and Details

- Single-clicking a node selects it and shows its details in the panel.
- Double-click triggers drill mode; any pending single-click action is cancelled.
- Details panel shows the selected element's name, type, documentation, and related elements.
- Clicking a related element in the details panel triggers drill mode on that node.
- Clicking the empty canvas clears the selection.

## UI/UX

### Visual Design

- Graph canvas occupies the main content area.
- Nodes are styled consistently (circular with centered labels and type-based colors).
- Edges are lines with arrowheads pointing to target nodes; labels may appear near edges.
- Selected nodes have prominent highlighting (border or glow effect).
- Drill root nodes have distinctive styling.
- Cursor changes indicate available interactions (grab for panning, pointer for nodes).

### Typography and Sizing

- **Node sizes**: Auto-adjust based on label text length; minimum 20×20px, maximum around 100px.
- **Node label font size**: ~12px, wraps to stay within node bounds.
- **Edge width**: Default 2px, may vary by relationship importance.
- **Edge label font size**: ~10px, with background knockout for readability.

### Controls and Indicators

- Hovering over nodes shows a tooltip with element name, type, and documentation summary (when
  tooltips are enabled in settings).
- Depth picker displays buttons for available levels with the current level highlighted (visible
  during drill mode only).
- Containment mode selector in settings shows available options with icons.
- Zoom controls positioned for easy access (typically bottom-right corner): zoom in, zoom out,
  fit-to-view.
- Mouse wheel zooms the canvas centered on the cursor position.
- Middle mouse button (or equivalent) pans the canvas.
- Layout refresh button positioned immediately after fit button.
- Download diagram button positioned after layout refresh, with a format selector (PNG, SVG)
  displayed to its left.

### Legend

- The legend is rendered as a floating panel shape on the graph canvas with a visible border and
  background fill matching the current theme.
- Two sections are displayed: "Entities" listing element types, and "Relationships" listing
  relationship types, each with a section label.
- Each row shows a small filled circle in the type's color (identical in style to the color
  indicators in the filter panel) followed by the type name.
- The legend is draggable; a grab cursor indicates it can be repositioned.
- When clamped to the canvas boundary, a minimum margin of 5 px is maintained on all sides.
- The legend does not interfere with graph navigation controls or the sidebar.

### Responsiveness and Smoothness

- Layout changes and containment mode switches are smooth.
- Navigation (zoom, pan) uses smooth animated transitions.
- Single-click selection has a delay of ~150-200ms to distinguish from double-click.
- Zoom factor is ~1.3× per step.
- Animations may be disabled for very large graphs to maintain responsiveness.
- All navigation operations should feel responsive and quick.

## Technical Notes

### Graph Implementation

- The graph visualization library is initialized with configured styles and initial layout.
- Visual styles define node and edge appearance, including colors, shapes, and labels.
- Theme integration uses CSS custom properties for colors that need theming.

### Data Preparation

- Nodes are constructed from model elements with appropriate data fields.
- Edges are constructed from model relationships, with edges connecting corresponding nodes.
- Additional flags mark containment relationships for special handling.
- Color generation uses deterministic hashing of type names for consistency across renders.
- Node dimensions are computed to fit label text with padding.

### Layout Algorithms

Multiple layout algorithms are available, each suited for different model structures:

- **Force-directed** (force-directed): Default for general graphs, provides quality layouts with
  configurable trade-offs
- **Hierarchical** (hierarchical): Best for directed flows and tree-like structures, arranges nodes
  in layers
- **Compact force-directed** (compact force-directed): Faster but lower quality, suitable for dense
  graphs
- **Radial from root**: Radial layout from a root node, used for drill mode
- **Grid**: Uniform Grid placement for structured graphs
- **Circular**: Nodes arranged on a Circular perimeter, mainly for decorative purposes

Layout selection triggers immediate application. Animations are used for smoother transitions when
node count is within performance thresholds. The current layout preference persists for the session.

### Node Styling

- **Shape**: Circle for simple nodes; rectangle (rounded) for compound nodes containing children
- **Sizing**: Auto-adjusts based on label text length with appropriate padding. Specific dimensions
  are defined in the UI/UX section.
- **Labels**: Display element name, falling back to type if name missing; text wraps to stay within
  node bounds. Font sizes are specified in the UI/UX section.
- **Colors**: Deterministic based on element type — each type gets a consistent color using a hash
  of the type name (saturation and lightness fixed; only hue varies)

### Edge Styling

- **Color**: Deterministic based on relationship type using similar hashing as nodes
- **Width**: Varies by relationship importance to indicate edge prominence. Default width is
  specified in UI/UX.
- **Labels**: Relationship name centered on edge with background knockout for readability. Font size
  details are provided in UI/UX.
- **Markers**: Standard directed edges use arrowheads at target; containment edges use filled
  diamond markers

### Containment Handling

Three modes represent parent-child relationships:

- **none**: No special representation (flat graph)
- **edge**: Synthetic containment edges with diamond markers
- **compound**: Child nodes visually nested inside parent nodes (compound nodes)

The containment mode preference persists across sessions. Switching modes rebuilds the graph with
the new configuration. In compound mode, child nodes remain visible as top-level if their parent is
filtered out.

### Interaction Handling

Event listeners handle taps, double-clicks, wheel events, and drag operations:

- **Single-click**: After a short delay to distinguish from double-click; selects node and shows
  details panel. Exact delay is specified in UI/UX.
- **Double-click**: Cancels single-click action; triggers drill mode expansion.
- **Background click**: Deselects all nodes, closes details panel.
- **Zoom**: By a consistent factor per step; minimum and maximum limits enforced; centered at cursor
  for mouse wheel. Specific zoom parameters are defined in UI/UX.
- **Pan**: Middle mouse drag or equivalent.
- **Fit**: Centers graph with appropriate padding, showing all visible nodes.

### Filtering and Visibility

Visibility of nodes and edges is controlled based on active element and relationship type filters:

- Nodes hidden when their element type is filtered out
- Edges hidden when:
  - Their relationship type is filtered out, OR
  - Either source or target node is hidden
- **Containment edge exception**: Containment edges remain visible even when the parent node is
  filtered, to maintain structural context
- Changes apply immediately without rebuilding the graph structure

### Performance Considerations

- **Animation threshold**: Animations enabled for graphs with fewer than 400 visible nodes; disabled
  for larger graphs to maintain performance
- Layout computation is synchronous and may block the main thread for large graphs
- Visibility filtering avoids element removal; nodes and edges are shown or hidden using the graph
  library's display mechanism, preserving graph structure
- For very large graphs (>1000 nodes), consider progressive loading or Web Worker optimizations

### State Persistence

- Zoom level and pan position are preserved across view switches
- Current layout preference persists for the session
- Containment mode preference and legend position persist across sessions via localStorage

### Theme Integration

Graph styles reference CSS custom properties for colors that need to support theming. When the theme
changes, the graph library does not automatically refresh styles. An explicit refresh is required to
pick up changed CSS variable values — this is needed for canvas background, edge label backgrounds
(knockout effect), and other theme-dependent styles.

### Layout Refresh

- The layout refresh operation re-applies the currently selected algorithm with the same
  configuration, without changing the selection
- Refresh may include smooth animations if the node count is below the animation threshold

### Legend Implementation

- The legend is rendered as a native element within the graph canvas (not a DOM overlay) so that it
  is captured automatically in PNG and SVG exports.
- Its position is stored as canvas coordinates and persists via localStorage.
- Drag behavior is handled by the graph library's built-in node drag support or an equivalent
  canvas-level drag handler.
- Legend content is recomputed whenever the active element or relationship type sets change.
- Color circles reuse the same deterministic color generation logic used for nodes and edges.

### Accessibility

The graph container element should have a meaningful `aria-label` describing the diagram (e.g.,
"Architecture diagram with X nodes and Y edges") for screen reader users.
