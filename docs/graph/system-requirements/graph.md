# SR-2: Graph Interactions and Visualization

**Functional Requirements**:
[FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5](../functional-requirements.md#fr-2-graph-visualization)

## User Story

As a user, I want to visualize my model as an interactive graph, navigate efficiently, explore node
details, and customize the layout and containment visualization to understand the architecture.

## Acceptance Criteria

- SR-2.1: All model elements render as nodes, all relationships as edges
- SR-2.2: Colors are consistent based on element/relationship types
- SR-2.3: User can switch between multiple layout algorithms
- SR-2.4: User can zoom and pan to navigate the graph
- SR-2.5: Single-click on a node selects it and shows details in the panel
- SR-2.6: Double-click on a node triggers drill-down mode
- SR-2.7: Containment relationships can be displayed as synthetic edges or nested compound nodes
- SR-2.8: Selection, zoom, and pan state are preserved when switching between graph and table views
- SR-2.9: User can show or hide the legend on the graph canvas
- SR-2.10: User can refresh the current layout to re-apply the layout algorithm

## Scenario

### Preconditions

- Model is successfully loaded with elements and relationships
- Graph view is active and initialized

### Steps

1. **Initial Render**
   - Graph canvas displays with nodes and edges arranged according to the current layout algorithm
   - Each node shows a colored symbol or shape based on its element type
   - Node labels display the element name (or type if name is unavailable)
   - Edges connect nodes with arrowheads indicating direction
   - Edge labels show relationship names when available
   - Edge colors derive from relationship types
   - Containment relationships appear according to the current containment mode

2. **Change Layout**
   - User opens the graph settings
   - A dropdown presents available layout algorithms
   - The current layout is indicated as selected
   - User chooses a different layout
   - Graph restructures immediately using the selected algorithm
   - Animations may be used for smoother transitions when performance allows
   - After layout completes, any compound node labels are adjusted for readability

3. **Navigate Graph**
   - User zooms using mouse wheel or zoom controls
   - Zooming centers on the cursor position or control focus
   - Zoom respects reasonable minimum and maximum limits
   - User pans by dragging with an appropriate mouse button
   - User clicks fit button to automatically scale the view to fit all visible nodes with padding
   - All navigation operations respond quickly

4. **Refresh Layout**
   - User has manually adjusted node positions by dragging
   - User clicks the layout refresh button in the controls area
   - The graph re-applies the current layout algorithm
   - Nodes reposition according to the layout while preserving zoom and pan state
   - Animations may smooth the transition if performance permits

5. **Select Node**
   - User single-clicks on a node
   - After a brief delay to distinguish from double-click, the node is selected
   - The selected node receives visual emphasis (highlighted border or glow)
   - A details panel opens showing:
     - Element name and type
     - Documentation if available
     - List of related elements with relationship types
   - Clicking a related element in the details panel enters drill mode on that node

6. **Enter Drill Mode**
   - User double-clicks on a node
   - Single-click action is cancelled
   - Drill mode activates
   - Drill bar appears with exit option and the selected node label
   - Selected node receives special highlighting
   - Graph updates to show the neighborhood around the selected node at the current drill depth

7. **Adjust Depth in Drill**
   - Depth control becomes visible in settings
   - Buttons for depth levels (1-5) show current selection
   - User chooses a different depth
   - Drill scope recalculates, showing more or fewer nodes
   - Count badges update accordingly

8. **Switch Containment Mode**
   - User opens settings and finds the containment mode option
   - Choices may include: no special containment visualization, synthetic containment edges, or
     nested compound nodes
   - User selects a different mode
   - Graph updates to reflect the chosen containment representation
   - Switching between modes preserves current element visibility
   - In compound mode, child nodes appear nested inside parent nodes
   - Parent-child relationships are handled correctly when parents are filtered

9. **Deselect**
   - User clicks on empty canvas area
   - Selection clears
   - Details panel returns to initial placeholder state

10. **Navigate from Table**

- While in table view, user clicks a row
- View switches to graph
- The corresponding node is centered with smooth animation
- The node is selected

1. **Toggle Legend**
   - User opens graph settings and enables the "Legend" toggle
   - A legend shape appears on the graph canvas listing all visible element types followed by all
     visible relationship types
   - Each entry shows a color circle matching the type's color in the graph and filter panel,
     followed by the type name
   - User drags the legend to a more convenient position on the canvas
   - User hides a relationship type using the filter panel
   - The legend updates to no longer show that relationship type
   - User disables the "Legend" toggle in settings
   - The legend disappears from the canvas

### Expected Results

- All model elements appear as nodes in the graph
- All relationships with both endpoints present are rendered as edges
- Colors are consistent and deterministic for each type
- Labels are readable and properly positioned
- Layout algorithm arranges nodes meaningfully
- Layout switching completes within a reasonable time
- Node and edge positions transition smoothly during layout changes
- Navigation operations feel responsive
- Zoom respects established limits
- Single-click selection is reliable
- Details panel shows accurate information
- Double-click successfully triggers drill mode
- Containment visualization renders correctly according to selected mode
- No layout glitches occur when switching modes
- Legend is visible on the canvas when enabled and absent when disabled
- Legend content reflects only types that are currently visible in the graph
- Legend can be freely repositioned by dragging
- Layout refresh button re-applies the current layout algorithm correctly
- Refresh operation maintains current zoom and pan state

### Edge Cases

- **Model with zero elements**
  - Graph displays empty canvas without errors

- **Element with missing name**
  - Falls back to displaying the element type name

- **Relationship with missing endpoint**
  - Edge is not rendered

- **Circular parent references** (containment)
  - Handled gracefully without infinite loops

- **Child without parent in graph** (compound mode)
  - Child node remains visible as top-level if its parent is filtered out

- **Deep nesting** (multiple levels)
  - Nested compound nodes display correctly; labels may require text wrapping

- **Layout switching during another layout**
  - Previous layout continues briefly; new layout applies on top, which may cause temporary flicker
  - This is acceptable for initial implementation

- **Large graph** (many nodes)
  - Animation may be disabled for performance
  - Layout completes without smooth transitions but faster

- **Rapid clicking**
  - Single-click delay prevents multiple rapid selections
  - Double-click reliably cancels single-click timer

- **Legend enabled with all types filtered out**
  - Legend is shown but displays no entries

- **Legend enabled with only one type visible**
  - Legend shows a single entry

- **Graph not yet rendered**
  - Early interactions are ignored without errors

- **Very large model** (many thousands of nodes)
  - Initial rendering may take several seconds
  - Future improvements could include progressive rendering

- **Refresh during layout computation**
  - Refresh request is ignored until current layout completes
  - Or: Refresh cancels current layout and starts a new one (implementation choice)

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
- Each entry is preceded by a filled color circle using the same color as the corresponding type in
  the graph and filter panel.
- The legend is rendered as a shape directly on the graph canvas, so it can be dragged and is
  captured in image exports.
- The legend updates automatically whenever the set of visible types changes due to filter
  adjustments.
- The legend's position on the canvas persists across sessions (stored as JSON in localStorage).
- When the persisted position would place the legend outside the canvas, the legend is clamped to
  stay within the canvas bounds with a minimum 5 px margin on every side. The same clamping applies
  after each drag operation and automatically whenever the canvas changes size (e.g., window resize
  or sidebar toggle). Position adjustments caused by canvas resize are not persisted — the saved
  position reflects the user's last drag and is re-evaluated against the actual canvas size on each
  load and resize.
- Legend visibility preference persists across sessions (stored as `true` / `false` in
  localStorage).

### Layout Switching

- Multiple layout algorithms are available, each with characteristics suitable for different model
  structures.
- Layout selection triggers immediate application of the new layout.
- The current layout preference is stored in memory for the session.
- A manual refresh option may be available to re-apply the current layout.

### Navigation

- Zoom changes by a consistent factor per increment.
- Minimum and maximum zoom levels are enforced.
- Fit-to-view scales to show all visible nodes with appropriate padding.
- Mouse wheel zooms centered at cursor position.
- Middle mouse button or equivalent pans the view.

### Selection and Details

- Double-click cancels single-click timer and enters drill mode.
- Details panel shows comprehensive information about the selected element.
- Related elements are discovered through graph connections.
- Clicking a related element in the details panel enters drill mode on that node.
- Clicking empty canvas clears the selection.

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
- Layout refresh button positioned immediately after fit button
- Download diagram button positioned after layout refresh, with a format selector (PNG, SVG)
  displayed to its left
- See also: [Data Export](../export.md) for full specification of the diagram download functionality

### Legend

- The legend is rendered as a floating panel shape on the graph canvas with a visible border and
  background fill matching the current theme.
- Two sections are displayed: "Entities" listing element types, and "Relationships" listing
  relationship types, each with a section label.
- Each row shows a small filled circle in the type's color (identical in style to the color
  indicators in the filter panel) followed by the type name.
- The legend is draggable; a grab cursor indicates it can be repositioned.
- The legend does not interfere with graph navigation controls or the sidebar.

### Responsiveness and Smoothness

- Layout changes and containment mode switches are smooth.
- Navigation (zoom, pan) uses smooth animated transitions.
- Single-click selection has a delay of ~150-200ms to distinguish from double-click.
- Zoom factor is ~1.3× per step.
- Animations are enabled for graphs with fewer than 400 visible nodes; disabled for larger graphs to
  maintain performance.
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
- **Colors**: Deterministic based on element type - each type gets a consistent color using hash of
  type name (saturation and lightness fixed; only hue varies)

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

The containment mode preference is stored per session. Switching modes rebuilds the graph with new
configuration. In compound mode, child nodes remain visible as top-level if their parent is filtered
out.

### Interaction Handling

Event listeners handle taps, double-clicks, wheel events, and drag operations:

- **Single-click**: After a short delay to distinguish from double-click; selects node and shows
  details panel. Exact delay is specified in UI/UX.
- **Double-click**: Cancels single-click timer; triggers drill mode expansion.
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
- Changes apply immediately; no need to rebuild graph

### Performance Considerations

- **Animation threshold**: Animations enabled for graphs with < 400 visible nodes; disabled for
  larger graphs
- Layout computation is synchronous and may block the main thread for large graphs
- Visibility filtering uses the library's built-in `display` property for efficiency (no element
  removal)
- For very large graphs (>1000 nodes), consider progressive loading or Web Worker optimizations

### State Persistence

- Zoom level and pan position are preserved across view switches
- Current layout preference persists for the session
- Containment mode preference persists across sessions via localStorage

### Theme Integration

Graph styles reference CSS custom properties for colors that need to support theming. When the theme
changes, the graph library does not automatically refresh styles. An explicit refresh is required to
pick up changed CSS variable values - this is needed for canvas background, edge label backgrounds
(knockout effect), and other theme-dependent styles.

### Layout Refresh

- The layout refresh button re-applies the currently selected layout algorithm without changing the
  selection
- This is useful when the user has made manual adjustments (node dragging) and wants to return to
  the automated layout
- The refresh operation uses the same layout algorithm with the same configuration parameters as
  initially applied
- The refresh may include smooth animations if the node count is below the performance threshold

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
