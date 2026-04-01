# TC-5.3: Graph image export

**System Requirement**: [SR-5.3](../../system-requirements/export.md#sr-53-graph-image-export)

## TC-5.3.1: Export graph as PNG with 2x resolution

### Preconditions

- Graph view is active
- Model is fully rendered with nodes and edges
- Legend is enabled and positioned on canvas

### Steps

1. Open export menu in graph toolbar
   - Dropdown shows "Export as PNG" and "Export as SVG"
2. Select "Export as PNG"
   - Loading indicator appears during generation
3. Wait for download
   - PNG file downloads with name: `{modelName}-graph-{timestamp}.png`
4. Open the image file
   - Image shows:
     - Full graph with all visible nodes and edges
     - Legend included at its canvas position
     - White background (solid)
     - 2x resolution (crisp when zoomed)
5. Verify no UI chrome
   - Toolbars, sidebar, tooltips are NOT in the image
   - PNG export successful

### Test Data

| Format | Resolution | Background |
| ------ | ---------- | ---------- |
| PNG    | 2x         | white      |

## TC-5.3.2: Export graph as SVG (vector format)

### Preconditions

- Graph view active, model rendered

### Steps

1. Select "Export as SVG"
   - SVG file downloads: `{modelName}-graph-{timestamp}.svg`
2. Open SVG in a vector editor or browser
   - Image is scalable without loss of quality
   - Text labels are editable text elements (not outlines)
   - Legend and all graph elements are present
   - SVG export successful, vector quality preserved

### Test Data

| Format | Vector? | Text editable? |
| ------ | ------- | -------------- |
| SVG    | yes     | yes            |

## TC-5.3.3: PNG export respects Drill-down scope

### Preconditions

- Drill-down mode active on a specific node
- Only root and its neighborhood are visible

### Steps

1. Export as PNG
   - Exported image shows only the drill-down scope (root + neighbors), not the full model
   - Drill-down context respected in export

### Test Data

| Drill-down active? | Exported content |
| ------------------ | ---------------- |
| yes                | scoped subgraph  |

## TC-5.3.4: PNG export respects Highlight mode (dimming)

### Preconditions

- Highlight mode enabled
- A node is selected
- Non-neighbor nodes are dimmed (35% opacity)

### Steps

1. Export as PNG
   - Exported image shows the same visual state:
     - Selected node and connections at full opacity
     - Dimmed nodes at 35% opacity
     - Dimmed edges at 15% opacity
   - Highlight dimming preserved in export

### Test Data

| Mode      | Expected visual          |
| --------- | ------------------------ |
| Highlight | dimmed elements as in UI |

## TC-5.3.5: Legend inclusion/exclusion based on visibility

### Preconditions

- Legend is enabled and positioned on canvas

### Steps

1. Export as PNG with legend visible
   - Legend appears in the exported image at its canvas coordinates
2. Disable legend (toggle off)
3. Export as PNG again
   - Exported image does NOT include the legend
   - Legend state respected

### Test Data

| Legend state | Included in export? |
| ------------ | ------------------- |
| visible      | yes                 |
| hidden       | no                  |

## TC-5.3.6: Large graph triggers SVG recommendation

### Preconditions

- Very large graph that would exceed browser canvas limits for high-resolution PNG (e.g., 10,000+
  nodes)

### Steps

1. Try to export as PNG
   - System shows notification: "Graph is too large for PNG, consider using SVG format"
   - PNG export may be blocked or fall back to lower resolution (1x)
2. Export as SVG instead
   - SVG export succeeds without warnings
   - User guided to appropriate format for large graphs

### Test Data

| Graph size (nodes) | PNG allowed? | SVG recommended? |
| ------------------ | ------------ | ---------------- |
| >10,000            | no (or 1x)   | yes              |

## TC-5.3.7: Export can be cancelled for long operations

### Preconditions

- Very large graph causing export to take >5 seconds

### Steps

1. Click "Export as PNG"
   - Loading indicator appears with "Cancel" button
2. Click "Cancel" during generation
   - Export aborts; no file downloaded
3. UI returns to normal state
   - Cancellable exports work correctly

### Test Data

| Export duration | Cancel available? |
| --------------- | ----------------- |
| >5s             | yes               |

## TC-5.3.8: File naming follows pattern with sanitized model name

### Preconditions

- Model name contains special characters: `E-Commerce & Analytics v2.0`

### Steps

1. Export as PNG or SVG
   - Filename is sanitized for filesystem compatibility
   - Example: `E-Commerce-Analytics-v2-0-graph-YYYYMMDD-HHMMSS.png`
2. Verify timestamp format
   - Timestamp is `YYYYMMDD-HHMMSS` (24-hour format)
   - Files are saved with valid, consistent names

### Test Data

| Model name                    | Expected filename fragment   |
| ----------------------------- | ---------------------------- |
| `E-Commerce & Analytics v2.0` | `E-Commerce-Analytics-v2-0-` |

## TC-5.3.9: Multiple exports can run concurrently

### Preconditions

- Graph is loaded and responsive

### Steps

1. Initiate PNG export
2. Immediately initiate SVG export (before PNG completes)
   - Both operations run independently
3. Wait for both to complete
   - Both files download successfully; no interference
   - Concurrency handled correctly

### Test Data

| Action sequence | Downloads  |
| --------------- | ---------- |
| PNG, then SVG   | both files |

## TC-5.3.10: Blob/DataURL cleanup after download

### Technical test (automated)

### Preconditions

- Graph exported; browser DevTools open to Memory/Performance panel

### Steps

1. Initiate PNG export
2. Monitor memory for Blob URLs and object URLs
   - After download starts, `URL.revokeObjectURL()` is called; no memory leaks from lingering blobs
   - Memory is properly freed

### Test Data

| Metric                | Expected          |
| --------------------- | ----------------- |
| Blob URLs post-export | revoked / cleaned |
