# TC-2.3: Navigation

**System Requirement**: [SR-2.3](../../system-requirements/graph.md#sr-23-navigation)

## TC-2.3.1: Zoom in and out centered on cursor

### Preconditions

- Graph view active
- Model with nodes rendered
- Current zoom level: 100%

### Test Steps

1. Position mouse cursor over a specific node
2. Zoom in using mouse wheel (scroll up) or `+` key
   - **Expected**: Graph zooms in (scale increases) centered around cursor position
   - The point under cursor remains stationary relative to viewport
3. Zoom out using mouse wheel (scroll down) or `-` key
   - **Expected**: Graph zooms out centered on cursor

### Post-conditions

- Zoom control works smoothly
- Zoom respects cursor as focal point

### Test Data

| Action    | Zoom change | Center point |
| --------- | ----------- | ------------ |
| wheel up  | + (in)      | cursor       |
| wheel down| - (out)     | cursor       |

## TC-2.3.2: Pan the canvas via drag

### Preconditions

- Graph zoomed in (>100%)
- Canvas larger than viewport

### Test Steps

1. Click and hold on empty canvas area (not on a node)
2. Drag the mouse in any direction
   - **Expected**: Canvas translates (pans) smoothly in the drag direction
   - Nodes move opposite to drag (like moving a map)
3. Release mouse
   - **Expected**: Pan stops; graph remains at new offset

### Post-conditions

- Panning is smooth and responsive
- No inertia or momentum scrolling (unless specified)

### Test Data

| Drag direction | Canvas movement  |
| -------------- | ---------------- |
| left           | content moves right |
| up             | content moves down  |

## TC-2.3.3: "Fit to View" centers and scales graph

### Preconditions

- Graph zoomed in or panned such that not all nodes are visible
- Model has many nodes spread out

### Test Steps

1. Click "Fit to View" button in toolbar (or press keyboard shortcut if available)
   - **Expected**: Graph animates (or immediately sets) to:
     - Optimal zoom level that fits all visible nodes within viewport with padding
     - Graph centered in the canvas
2. Verify all nodes are visible
   - **Expected**: All nodes (currently visible after filters) appear within the viewport

### Post-conditions

- Entire visible graph is displayed optimally

### Test Data

| Before fit           | After fit                    |
| -------------------- | ---------------------------- |
| zoomed/panned partial| all nodes visible, centered  |

## TC-2.3.4: Zoom respects min/max limits

### Preconditions

- Graph at default zoom (100%)

### Test Steps

1. Zoom in repeatedly (or use zoom to max)
   - **Expected**: ZOoming stops at a maximum threshold (e.g., 500% or 10x); cannot zoom infinitely
2. Zoom out repeatedly
   - **Expected**: Zooming stops at a minimum threshold (e.g., 10% or 0.1x); cannot zoom out to nothing
3. Attempt to programmatically set zoom beyond limits
   - **Expected**: System clamps zoom to allowed range

### Post-conditions

- Zoom range is bounded for usability and performance

### Test Data

| Zoom limits (example) |
| --------------------- |
| min: 10%, max: 500%   |

## TC-2.3.5: Keyboard navigation (arrows for pan, +/- for zoom)

### Preconditions

- Graph active, focused

### Test Steps

1. Press `Up Arrow`
   - **Expected**: Graph pans downward (view moves up)
2. Press `Down Arrow`
   - **Expected**: Graph pans upward (view moves down)
3. Press `Left Arrow`
   - **Expected**: Graph pans rightward (view moves left)
4. Press `Right Arrow`
   - **Expected**: Graph pans leftward (view moves right)
5. Press `+` (or `=`) key
   - **Expected**: Zoom in
6. Press `-` key
   - **Expected**: Zoom out

### Post-conditions

- Keyboard controls work as standard

### Test Data

| Key          | Action   |
| ------------ | -------- |
| Up Arrow     | pan down |
| Down Arrow   | pan up   |
| Left Arrow   | pan right|
| Right Arrow  | pan left |
| +            | zoom in  |
| -            | zoom out |

## TC-2.3.6: Pan/zoom state is transient (not persisted)

**Related to**: Technical note: "Transient state: Pan and Zoom levels are session-only and are lost upon page refresh."

### Preconditions

- Graph has been panned and zoomed to a specific view

### Test Steps

1. Note the current pan (offset) and zoom level
2. Refresh the browser page (F5)
   - **Expected**: Graph reloads and:
     - Pan is reset to default (centered or origin 0,0)
     - Zoom is reset to default (100% or fit-to-view)
     - Manual pan/zoom is **not** restored from storage

### Post-conditions

- Pan and zoom do not survive reload
- Only model and filters persist, not camera

### Test Data

| Before refresh | After refresh (expected) |
| -------------- | ------------------------ |
| zoom=200%, panned right | zoom=default (100% or fit), pan=centered |

## TC-2.3.7: Keyboard arrow pan speed is consistent

### Preconditions

- Graph with standard node count

### Test Steps

1. Press and hold Up Arrow for 1 second
   - **Expected**: Graph pans continuously at a constant speed (not accelerating)
2. Repeat for other arrows
   - **Expected**: Same speed in all directions

### Post-conditions

- Arrow pan speed is predictable

### Test Data

| Held duration | Pan distance (approx) |
| ------------- | --------------------- |
| 1 second      | consistent pixels    |

## TC-2.3.8: Zoom direction is towards/away from center if no cursor

### Preconditions

- Graph focused but mouse not over canvas (or zoom via keyboard only)

### Test Steps

1. Press `+` to zoom in
   - **Expected**: Graph zooms towards the center of the viewport
2. Press `-` to zoom out
   - **Expected**: Graph zooms away from center

### Post-conditions

- Keyboard zoom uses center as focal point when cursor not over canvas

### Test Data

| Zoom input   | Focal point       |
| ------------ | ----------------- |
| keyboard +/- | viewport center   |
