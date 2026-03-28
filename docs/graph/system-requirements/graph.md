# SR-2: Graph Interactions and Visualization

**Functional Requirements**:
[FR-2.1, FR-2.2, FR-2.3, FR-2.4](../functional-requirements.md#fr-2-graph-visualization)

## User Story

As a user, I want to visualize my model as an interactive graph, navigate efficiently, explore node
details, and customize the layout and containment visualization to understand the architecture.

## Acceptance Criteria

- SR-2.1: All model elements render as nodes, all relationships as edges
- SR-2.2: Colors are consistent based on element/relationship types
- SR-2.3: Multiple layout algorithms available (force-directed, hierarchical, grid, circle, etc.)
- SR-2.4: Zoom and pan navigation for exploring large graphs
- SR-2.5: Single-click selects nodes and shows details; double-click triggers drill-down
- SR-2.6: Containment relationships display as synthetic edges or nested compound nodes
- SR-2.7: Layout changes and containment mode switches are smooth
- SR-2.8: Selection, zoom, and pan state preserved across view switches

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
   - A dropdown presents available layout algorithms (force-directed, hierarchical, grid, circle,
     etc.)
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

4. **Select Node**
   - User single-clicks on a node
   - After a brief delay to distinguish from double-click, the node is selected
   - The selected node receives visual emphasis (highlighted border or glow)
   - A details panel opens showing:
     - Element name and type
     - Documentation if available
     - List of related elements with relationship types
   - Clicking a related element in the details panel enters drill mode on that node

5. **Enter Drill Mode**
   - User double-clicks on a node
   - Single-click action is cancelled
   - Drill mode activates
   - Drill bar appears with exit option and the selected node label
   - Selected node receives special highlighting
   - Graph updates to show the neighborhood around the selected node at the current drill depth

6. **Adjust Depth in Drill**
   - Depth control becomes visible in settings
   - Buttons for depth levels (1-5) show current selection
   - User chooses a different depth
   - Drill scope recalculates, showing more or fewer nodes
   - Count badges update accordingly

7. **Switch Containment Mode**
   - User opens settings and finds the containment mode option
   - Choices may include: no special containment visualization, synthetic containment edges, or
     nested compound nodes
   - User selects a different mode
   - Graph updates to reflect the chosen containment representation
   - Switching between modes preserves current element visibility
   - In compound mode, child nodes appear nested inside parent nodes
   - Parent-child relationships are handled correctly when parents are filtered

8. **Deselect**
   - User clicks on empty canvas area
   - Selection clears
   - Details panel returns to initial placeholder state

9. **Navigate from Table**
   - While in table view, user clicks a row
   - View switches to graph
   - The corresponding node is centered with smooth animation
   - The node is selected

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

- **Graph not yet rendered**
  - Early interactions are ignored without errors

- **Very large model** (many thousands of nodes)
  - Initial rendering may take several seconds
  - Future improvements could include progressive rendering

## Business Rules

### Graph Rendering

- Node colors are derived from element types using a deterministic method for consistency.
- Edge colors are derived from relationship types similarly.
- Node sizes accommodate label text with appropriate padding.
- Edge labels are shown only when a relationship name exists.
- Containment relationships are handled through one of three modes: no visualization, synthetic
  edges, or compound nodes.
- Containment modes:
  - None: no special representation of parent-child relationships
  - Edges: synthetic edges with special markers show containment
  - Compound: child nodes visually nested inside parent nodes

### Layout Switching

- Multiple layout algorithms are available, each with characteristics suitable for different model
  structures.
- Layout selection triggers immediate application of the new layout.
- Animations are used for smoother transitions when node count is within performance thresholds.
- The current layout preference is stored in memory for the session.
- A manual refresh option may be available to re-apply the current layout.

### Navigation

- Zoom changes by a consistent factor per increment.
- Minimum and maximum zoom levels are enforced.
- Fit-to-view scales to show all visible nodes with appropriate padding.
- Mouse wheel zooms centered at cursor position.
- Middle mouse button or equivalent pans the view.
- Smooth animated transitions enhance the navigation experience.

### Selection and Details

- Single-click has a delay to distinguish from double-click.
- Double-click cancels single-click timer and enters drill mode.
- Selected nodes receive visual highlighting.
- Details panel shows comprehensive information about the selected element.
- Related elements are discovered through graph connections.
- Clicking a related element in the details panel enters drill mode on that node.
- Clicking empty canvas clears the selection.

## UI/UX

- Graph canvas occupies the main content area.
- Nodes are styled consistently (typically circular with centered labels and type-based colors).
- Edges are lines with arrowheads pointing to target nodes; labels may appear near edges.
- Selected nodes have prominent highlighting (border or glow effect).
- Hovering over nodes shows a tooltip with element name, type, and documentation summary when
  tooltips are enabled in visualization settings.
- Drill root nodes have distinctive styling.
- Depth picker displays buttons for available levels with the current level highlighted (visible
  during drill mode only).
- Containment mode selector in settings shows available options with icons.
- Zoom controls positioned for easy access (typically bottom-right corner): zoom in, zoom out,
  fit-to-view.
- Cursor changes indicate available interactions (grab for panning, pointer for nodes).

## Technical Notes

### Graph Implementation

- The graph visualization library used is Cytoscape.js.
- The graph is initialized with configured styles and initial layout.
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

- **fcose** (force-directed): Default for general graphs, provides quality layouts with configurable
  trade-offs
- **dagre** (hierarchical): Best for directed flows and tree-like structures, arranges nodes in
  layers
- **cose** (compact force-directed): Faster but lower quality, suitable for dense graphs
- **breadthfirst**: Radial layout from a root node, used for drill mode
- **grid**: Uniform grid placement for structured graphs
- **circle**: Nodes arranged on a circle perimeter, mainly for decorative purposes

Layout selection triggers immediate application. Animations are used for smoother transitions when
node count is within performance thresholds. The current layout preference persists for the session.

### Node Styling

- **Shape**: Circle for simple nodes; rectangle (rounded) for compound nodes containing children
- **Size**: Auto-adjusts based on label text length; minimum 20×20px, maximum reasonable (around
  100px)
- **Labels**: Display element name, falling back to type if name missing; font size ~12px; wraps to
  stay within node bounds
- **Colors**: Deterministic based on element type - each type gets a consistent color using hash of
  type name (saturation and lightness fixed; only hue varies)

### Edge Styling

- **Color**: Deterministic based on relationship type using similar hashing as nodes
- **Width**: Default 2px, may vary by relationship importance
- **Labels**: Relationship name centered on edge with background knockout for readability; font size
  ~10px
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

- **Single-click**: After ~150-200ms delay to distinguish from double-click; selects node and shows
  details panel
- **Double-click**: Cancels single-click timer; triggers drill mode expansion
- **Background click**: Deselects all nodes, closes details panel
- **Zoom**: By factor ~1.3× per step; min 0.1×, max 5×; centered at cursor for mouse wheel
- **Pan**: Middle mouse drag or equivalent
- **Fit**: Centers graph with 10% padding, showing all visible nodes

### Filtering and Visibility

Visibility of nodes and edges is controlled based on active element and relationship type filters:

- Nodes hidden when their element type is filtered out (`display: none`)
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
- Visibility filtering uses Cytoscape's built-in `display` property for efficiency (no element
  removal)
- For very large graphs (>1000 nodes), consider progressive loading or Web Worker optimizations

### State Persistence

- Zoom level and pan position are preserved across view switches
- Current layout preference persists for the session
- Containment mode preference persists across sessions via localStorage

### Theme Integration

Graph styles reference CSS custom properties for colors that need to support theming. When the theme
changes, Cytoscape does not automatically refresh styles. An explicit `cy.style().update()` call is
required to pick up changed CSS variable values - this is needed for canvas background, edge label
backgrounds (knockout effect), and other theme-dependent styles.

### Accessibility

The graph container element should have a meaningful `aria-label` describing the diagram (e.g.,
"Architecture diagram with X nodes and Y edges") for screen reader users.
