# TC-3.5: Graph navigation

**System Requirement**: [SR-3.5](../../system-requirements/table.md#sr-35-graph-navigation)

## TC-3.5.1: Click table row to switch to Graph view and select corresponding node

### Preconditions

- Table view active, Entities tab
- Table displays entities, row for entity "PaymentService" is visible

### Test Steps

1. Click on the "PaymentService" row (anywhere except on a link if any)
   - **Expected**:
     - View switches to Graph mode (Graph view becomes visible, Table hides)
     - URL updates with view=graph
     - Graph renders (if not already)
     - Camera animates smoothly to center on the node representing "PaymentService"
     - That node becomes selected (highlighted)
     - Properties panel opens showing PaymentService details

### Post-conditions

- Graph view active
- Target node centered and selected

### Test Data

| Table row clicked | Expected view | Expected camera action | Selection |
| ----------------- | ------------- | ---------------------- | --------- |
| PaymentService row | Graph        | smooth centering on node | PaymentService selected |

## TC-3.5.2: Navigation respects current filters (row may be hidden)

### Preconditions

- Global filter: only `Microservice` entities visible
- Table shows only Microservice rows
- Graph currently in Graph view (but user is in Table view now)

### Test Steps

1. In Table, click on a Microservice row
   - **Expected**: Graph shows only Microservices (due to filter), target node is visible and selected
2. If a row is for an entity that is currently filtered out (shouldn't appear in table) - not applicable because row wouldn't exist.

### Post-conditions

- Navigation consistent with filter state

### Test Data

| Filter state | Table row exists? | Graph view after click |
| ------------ | ----------------- | ---------------------- |
| Microservice only | PaymentService (a Microservice) | only Microservices visible; PaymentService selected |

## TC-3.5.3: Row hover indicates clickability

### Preconditions

- Table view active, Entities tab
- Rows displayed

### Test Steps

1. Hover mouse over a table row
   - **Expected**: Row background changes color (e.g., light gray) to indicate it's interactive
   - Cursor changes to pointer (hand) icon
2. Move mouse off row
   - **Expected**: Hover state clears

### Post-conditions

- Visual affordance that row is clickable

### Test Data

| Hover over row | Cursor       | Background |
| -------------- | ------------ | ---------- |
| yes           | pointer      | highlighted|

## TC-3.5.4: Clicking a relationship row navigates to target? (optional)

**Note**: The requirement says "Click on a row in the 'Entities' table." So navigation is defined for Entities tab. For Relationships tab, it might also be desirable to navigate to either source or target. Let's define one if applicable.

### Preconditions

- Table view, Relationships tab active
- Row: Source: ServiceA, Type: Calls, Target: ServiceB

### Test Steps

1. Click on the row (or maybe on the Source/Target cells individually)
   - **Expected**:
     - If whole row clickable: view switches to Graph and selects ServiceA (or ServiceB)? Need definition.
     - Perhaps only clicking on Source or Target cell links navigates.
   - Assume: clicking on a relationship row selects one of the endpoints (maybe the source) or perhaps it selects the relationship itself (highlight edge). Depending on product design, this may not be defined.
   - If defined as: clicking row selects the source node.

### Post-conditions

- Relationship navigation behavior defined (or N/A if not supported)

### Test Data

| Relationship row click | Graph action |
| ---------------------- | ------------ |
| ServiceA→ServiceB     | select ServiceA (or B) |

## TC-3.5.5: Smooth centering animation duration and ease

### Preconditions

- Graph view active (or switching from Table)
- Target node is off-screen (panned away)

### Test Steps

1. Click a table row that corresponds to a distant node
   - **Expected**: Camera moves to target node with a smooth animation (not instant jump)
   - Animation duration: ~300-500ms
   - Easing: ease-in-out or similar
   - Animation is not janky (maintains 60fps)

### Post-conditions

- Pleasant smooth transition

### Test Data

| Animation spec (typical) |
| ------------------------ |
| duration: 300-500ms, eased |

## TC-3.5.6: After navigation, node is fully within viewport

### Preconditions

- Graph canvas larger than viewport; node is at the far right edge

### Test Steps

1. Click its table row
   - **Expected**: Node is centered (or near-center) in the viewport; node not clipped at edge
   - Zoom level remains unchanged (unless node is very far and zoom-out is needed? Typically centering retains zoom)

### Post-conditions

- Node clearly visible

### Test Data

| Node position before | After centering |
| -------------------- | --------------- |
| far off-screen      | centered in viewport |

## TC-3.5.7: Navigation does not change current filters or drill-down

### Preconditions

- Filters: all entity types visible
- Drill-down active on node X
- In Table view

### Test Steps

1. Click on a table row for an entity Y that is within current drill-down scope (if drill-down active) OR if no drill-down, any visible row.
   - **Expected**: Graph view switches, but:
     - Global filters remain unchanged
     - Drill-down state (if any) remains? Actually, navigating to a node from Table might clear drill-down? The spec says: "The system switches the view mode to 'Graph'. The corresponding node is selected and highlighted. The camera performs a smooth centering animation on the selected node." It doesn't say it clears drill-down. If drill-down was active, navigating to a node outside the drill-down scope would be impossible (row wouldn't exist). If within scope, drill-down stays.
2. Verify filters unchanged
   - **Expected**: Filter settings same as before

### Post-conditions

- Only selection and view change; other state preserved

### Test Data

| Pre-nav state            | After nav to row   | Filters/drill unchanged? |
| ------------------------ | ------------------ | ------------------------ |
| filter: all types, no drill | row click      | yes                      |
| drill-down on X, row=Y (Y in scope) | click Y | drill-down still active? Possibly yes; but drill-down root might stay X. Navigation to Y just selects it, doesn't change root. |

## TC-3.5.8: Navigation from table row updates URL with entity selection

### Preconditions

- Table view, Entities tab

### Test Steps

1. Click row for entity ID "node-123"
   - **Expected**: URL updates to include selection parameter? Not required but could be `&select=node-123` to allow deep linking to selected node.
   - Check URL: may add `?selected=node-123` or similar
2. Copy URL and open new tab
   - **Expected**: App loads in Graph view with that node selected and centered (if deep linking supports selected state)

### Post-conditions

- Selection state is shareable via URL (optional, but good to verify)

### Test Data

| URL param for selection | Deep link works? |
| ----------------------- | ---------------- |
| &selected=node-123      | yes (if implemented) |
