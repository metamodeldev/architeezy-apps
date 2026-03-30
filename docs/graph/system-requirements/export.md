# SR-11: Data Export

**Functional Requirements**: [FR-11.1, FR-11.2](../functional-requirements.md#fr-11-data-export)

**Note**: This feature is marked as "Future" in the functional requirements and is not yet
implemented. This document provides the planned specifications for a future development iteration.

## User Stories

- As an analyst, I want to export the current table view to CSV so I can analyze data in Excel or
  other tools.
- As a presenter, I want to export the graph visualization as a PNG or SVG image so I can include it
  in documentation or presentations.

## Acceptance Criteria

- [SR-11.1](#sr-111-csv-export-is-accessible-when-the-table-view-is-active): CSV export is
  accessible when the table view is active
- [SR-11.2](#sr-112-csv-export-includes-all-currently-visible-rows): CSV export includes all
  currently visible rows
- [SR-11.3](#sr-113-csv-format-uses-standard-formatting-with-proper-escaping-of-special-characters):
  CSV format uses standard formatting with proper escaping of special characters
- [SR-11.4](#sr-114-image-export-is-accessible-when-the-graph-view-is-active): Image export is
  accessible when the graph view is active
- [SR-11.5](#sr-115-image-export-supports-both-png-and-svg-formats): Image export supports both PNG
  and SVG formats
- [SR-11.6](#sr-116-exported-image-faithfully-reproduces-the-visible-graph-canvas-including-any-overlays-present-on-it):
  Exported image faithfully reproduces the visible graph canvas, including any overlays present on
  it
- [SR-11.7](#sr-117-export-provides-progress-feedback-for-large-datasets): Export provides progress
  feedback for large datasets
- [SR-11.8](#sr-118-export-respects-current-filters): Export respects current filters

## Scenarios

### SR-11.1: CSV export is accessible when the table view is active

#### Preconditions

- Table view is active and a model is loaded
- The export button is visible in the table toolbar
- At least some data is present in the table

#### Steps

1. **Locate the export button**
   - User looks at the table toolbar
   - An "Export" button (download icon or label) is visible in the toolbar

2. **Open the export menu**
   - User clicks the "Export" button
   - A dropdown menu appears with the option "Export to CSV"

3. **Confirm accessibility**
   - The option is selectable via keyboard (Tab to button, Enter/Space to open, arrow keys to
     navigate)
   - The button has a descriptive label accessible to screen readers

#### Edge Cases

- **No model loaded** — export button is disabled; no dropdown appears.
- **Export already in progress** — button is disabled until the current export completes.

### SR-11.2: CSV export includes all currently visible rows

#### Preconditions

- Table view is active
- Model is loaded with elements and/or relationships
- Filters may be applied; the table shows a subset of data

#### Steps

1. **Apply filters to reduce visible rows**
   - User applies type filters or a search term
   - The table updates to show only matching rows

2. **Initiate CSV export**
   - User clicks the "Export" button and selects "Export to CSV"
   - Export process begins

3. **Download and verify the file**
   - The CSV file downloads to the user's default download folder
   - Opening the file shows only the rows that were visible in the table at the time of export
   - Column order matches the table's current display order

#### Edge Cases

- **Empty table (no visible rows after filters)** — export still produces a CSV with headers only;
  notification reads "Exported 0 rows".
- **Export while table is still loading/filtering** — export button is disabled until data is
  stable, or the export is queued to run after filtering completes.

### SR-11.3: CSV format uses standard formatting with proper escaping of special characters

#### Preconditions

- Table view is active with data that includes special characters (commas, quotes, newlines,
  Unicode)
- User initiates a CSV export

#### Steps

1. **Initiate export with special character data**
   - User clicks "Export to CSV"
   - Export process begins

2. **File downloads**
   - The CSV file downloads successfully
   - A toast notification confirms success

3. **Open the file and verify formatting**
   - The file opens correctly in Excel, Google Sheets, or a text editor
   - Special characters (commas, quotes, newlines) are properly escaped
   - Non-ASCII and Unicode characters display correctly

#### Edge Cases

- **Special characters in data** — embedded commas, quotes, and newlines are properly escaped per
  RFC 4180; e.g., a field containing a comma is wrapped in double quotes.
- **Unicode characters (emojis, non-Latin scripts)** — characters display correctly when the file is
  opened in compatible applications.
- **Very large table (100,000+ rows)** — may take several seconds; progress indicator is shown;
  browser may warn about performance but export completes.

### SR-11.4: Image export is accessible when the graph view is active

#### Preconditions

- Graph view is active and a model is loaded
- The graph has finished rendering
- The export button is visible in the graph toolbar

#### Steps

1. **Locate the export button**
   - User looks at the graph toolbar
   - An "Export" button is visible

2. **Open the export menu**
   - User clicks the "Export" button
   - A dropdown menu appears with options: "Export as PNG" and "Export as SVG"

3. **Confirm accessibility**
   - Options are navigable via keyboard
   - Buttons have descriptive labels accessible to screen readers

#### Edge Cases

- **Graph not fully rendered** — export button is disabled until graph layout completes, or a
  warning is shown: "Graph still loading; export may be incomplete".
- **No model loaded** — export button is disabled.

### SR-11.5: Image export supports both PNG and SVG formats

#### Preconditions

- Graph view is active and fully rendered
- User has opened the export dropdown

#### Steps

1. **Select PNG format**
   - User selects "Export as PNG" from the dropdown
   - A loading indicator appears
   - A PNG file downloads with the appropriate filename and `.png` extension
   - A toast notification confirms success

2. **Select SVG format**
   - User selects "Export as SVG" from the dropdown
   - A loading indicator appears
   - An SVG file downloads with the appropriate filename and `.svg` extension
   - A toast notification confirms success

3. **Verify file quality**
   - The PNG opens as a high-resolution raster image
   - The SVG opens as a scalable vector image, editable in tools like Inkscape or Illustrator

#### Edge Cases

- **Very large graph (10,000+ nodes)** — PNG export may take time; progress indicator is shown; SVG
  file size may become very large (>10 MB) and the user may be warned.
- **SVG text fonts not available on viewer** — web-safe fonts or inline font-family are used; text
  remains as editable text elements.
- **Browser memory limits for large canvas** — if PNG export fails due to canvas size limits, a
  user-friendly error message is shown.

### SR-11.6: Exported image faithfully reproduces the visible graph canvas, including any overlays present on it

#### Preconditions

- Graph view is active and fully rendered
- The legend overlay is enabled and visible on the graph canvas
- User initiates an image export (PNG or SVG)

#### Steps

1. **Initiate image export**
   - User selects "Export as PNG" or "Export as SVG"
   - A loading indicator appears

2. **File downloads**
   - The image file downloads
   - A toast notification confirms success

3. **Verify exported image contents**
   - The exported image includes all nodes, edges, and labels across the entire graph — not just the
     current viewport
   - Node colors, shapes, and edge styles match the on-screen appearance
   - The legend appears in the exported image at the same position it occupied on screen
   - The legend appearance (colors, proportions, text) is consistent with the on-screen legend
   - UI chrome (sidebar, header, tooltips, zoom controls, scrollbars) is absent from the export

#### Edge Cases

- **Legend extends beyond the graph bounding box** — exported image dimensions are expanded to
  ensure the legend is fully visible and not clipped.
- **Graph with complex edge labels or overlapping nodes** — rendered image may show visual clutter;
  this is acceptable as the export faithfully represents the canvas state.
- **SVG cross-origin image restrictions** — not applicable; all node icons are drawn shapes with no
  external image dependencies.

### SR-11.7: Export provides progress feedback for large datasets

#### Preconditions

- A large dataset is loaded (e.g., table with many thousands of rows, or graph with thousands of
  nodes)
- User initiates an export

#### Steps

1. **Initiate export**
   - User clicks the appropriate export option
   - A loading indicator appears within 100ms of starting

2. **Monitor progress**
   - For operations taking longer than 1 second, the progress indicator or spinner remains
     continuously visible
   - The UI remains responsive during processing

3. **Export completes**
   - The loading indicator disappears
   - A toast notification confirms success or describes any failure

#### Edge Cases

- **Export of 50,000+ rows or 5,000+ nodes** — a warning dialog appears: "Exporting X rows. This may
  take a while." with "Continue" and "Cancel" buttons.
- **Export fails mid-operation** — loading indicator disappears; an actionable error message is
  shown (e.g., "Graph too large to export as SVG; try PNG instead").

### SR-11.8: Export respects current filters

#### Preconditions

- A model is loaded with filters applied (type filters, search, etc.)
- The current view shows a filtered subset of data

#### Steps

1. **Verify filtered state**
   - User confirms that the current view shows only filtered data
   - The table or graph reflects the active filters

2. **Initiate export**
   - User initiates a CSV or image export

3. **Verify exported content reflects filters**
   - For CSV: the downloaded file contains only the rows visible in the filtered table
   - For image: the downloaded image shows only the nodes and edges visible in the filtered graph
     view

#### Edge Cases

- **All data filtered out** — CSV export produces headers only with "Exported 0 rows" notification;
  image export may show an empty or minimal graph.

## Business Rules

### CSV Export Scope

- Export includes only the data currently displayed in the active table tab (elements or
  relationships).
- Active filters (type filters, search) reduce the exported set.
- Column order follows the table's current display order.
- All data properties are included where available.
- Empty/missing values export as empty fields.

### Image Export Scope

- Image export captures the **entire graph** — all visible nodes and edges regardless of the current
  pan/zoom state. Elements outside the visible viewport are included.
- The exported image includes all nodes, edges, and labels.
- Exported image includes:
  - Nodes with their shapes, colors, labels
  - Edges with lines, arrowheads, labels
  - The legend overlay (if enabled), placed at the same position it occupies on screen at the time
    of export; if the legend extends beyond the graph's bounding box, the exported image dimensions
    are expanded to ensure the legend is fully visible and never clipped
  - Background color (theme-dependent)
- Excluded:
  - UI overlay elements (sidebar, header, tooltips, selection handles)
  - Canvas grid if shown in UI (usually hidden in export)
  - Scrollbars, zoom controls

### File Naming Conventions

- CSV files use the model name and a timestamp component, with a type segment indicating elements or
  relationships.
- Image files use the model name and a timestamp component, with the appropriate extension.
- Model name is sanitized (remove filesystem-invalid characters) for safe filename.
- Timestamp uses local time to avoid ambiguity.

### User Feedback

- Errors are shown with actionable message (e.g., "Graph too large to export as SVG; try PNG
  instead").

## UI/UX

### Visibility and Accessibility

- Export button is always visible in the appropriate view (table/graph for CSV/image respectively).
- Button icon: download arrow (⬇️) or "Export" text label.
- Clicking button reveals a small dropdown menu with format options.
- Buttons are keyboard focusable (Tab) with descriptive labels.

### Responsiveness and Feedback

- Export operation shows a loading indicator within 100ms of starting.
- For operations taking longer than 1 second, a progress indicator or spinner remains visible.
- On completion, a toast notification confirms success (or failure).
- Export operations are non-blocking; UI remains responsive during processing.

### Image Quality

- Exported PNG has sufficient resolution (at least 2× display size for clarity).
- SVG export preserves vector quality for scaling and print.
- Exported image reproduces the full graph faithfully — all visible elements are present, not just
  those in the current viewport.
- When the legend is included in an export, its appearance in the exported image must exactly match
  the on-screen legend. The legend is rendered at the position it occupies on screen at the time of
  export.

### Performance Expectations

- CSV export of 10,000 rows should complete in under 2 seconds.
- PNG export of graph with 1,000 nodes should complete in under 3 seconds.
- SVG export of graph with 1,000 nodes should complete in under 4 seconds.
- Larger exports are allowed to take longer, but a progress indicator must be visible.

### Disabled State

- Export button is disabled when:
  - No model loaded
  - Graph is still rendering (for image export)
  - No data visible in table (empty after filters)
  - Export operation already in progress

## Technical Notes

### Export UI Placement

- Export button is in the view-specific toolbar:
  - Table view: toolbar above the table (with column picker, search, etc.)
  - Graph view: toolbar near zoom controls or in the header/settings panel
- Dropdown format options (see UI/UX for button appearance):
  - Table view: "CSV" only
  - Graph view: "PNG", "SVG"
  - Future: "PDF", "JSON" (out of scope)

### Dialogs/Confirmation

- No confirmation dialogs for standard export (users should be able to export in one click).
- For large exports (>50,000 rows or >5,000 nodes), show a warning: "Exporting X rows. This may take
  a while." with "Continue" / "Cancel" buttons.
- Optional: "Include headers" checkbox default checked; can be toggled (advanced).

### Accessibility

- Export buttons are keyboard focusable (Tab).
- Buttons have descriptive labels: "Export to CSV", "Export graph as PNG" (via aria-label if only
  icon is shown).
- Dropdown menus can be opened with Enter/Space and navigated with arrow keys.

### CSV Format

CSV export follows RFC 4180 standard: comma-separated values with proper escaping of special
characters. UTF-8 encoding with BOM ensures compatibility with Excel. The first row contains column
headers.

### CSV Filename Convention

Filename format: `architeezy-{modelName}-elements-{YYYYMMDD-HHMM}.csv` or `-relationships-`
depending on the active table tab.

### PNG Export (Graph Library)

PNG export uses Cytoscape's built-in full-graph rasterizer (`full: true`). The canvas is sized to
the element bounding box, not the browser viewport, ensuring the entire graph is captured. Exported
PNG has sufficient resolution (at least 2× display size for clarity). Background color should match
the current theme's background.

### SVG Export (Graph Library)

SVG export uses graph (model) coordinates so all visible elements are included regardless of
pan/zoom. The SVG `viewBox` is computed from the bounding box of all visible nodes. SVG export
preserves vector quality for scaling and print. Text labels should remain as text elements for
editability. Consider inline styles for standalone SVG files.

### Legend Rendering in Exports

When the legend overlay is included, it must be rendered at the same position it occupies on screen.
The legend appearance must exactly match the on-screen version: section headers at 0.65 rem, rows at
0.75 rem, letter-spacing on section headers at 0.05 em, muted color (`--text-muted`) for section
labels and type names, 6 px gap before the second section, and 10 × 10 px circles for dots.

### Image Filename Convention

Filename format: `architeezy-{modelName}-graph-{YYYYMMDD-HHMM}.png` or `.svg`.

### Performance Considerations

- CSV: For large datasets, building a single string in memory may be acceptable for moderate sizes
  (10k-100k rows). For extreme cases, streaming may be needed.
- PNG: Offscreen canvas at 2× may exceed browser canvas size limits for very large viewports. Cap
  dimensions or export at 1× if necessary.
- SVG: SVG size grows with number of elements. 10,000 nodes may produce large files (>20 MB).
  Consider simplifying or falling back to PNG for huge graphs.

### Framework Integration

If using a frontend framework (Vue, React, etc.), wrap exports in component methods or actions that
access the appropriate data (table data or graph instance) and trigger the export process.

### Testing

- Verify CSV opens correctly in Excel, Google Sheets, LibreOffice Calc
- Test special character escaping: commas, quotes, newlines, Unicode
- Verify PNG resolution by inspecting image dimensions and sharpness
- Verify SVG is valid XML, contains text elements for labels, and renders correctly
- Test edge case: empty graph/table → appropriate message
- Test large data export: does not crash browser, shows progress indicator

## Future Enhancements (Out of Scope)

- Export to PDF (require layout engine)
- Export to JSON (serialize model data)
- Export graph as interactive HTML (self-contained)
- Batch export multiple models
- Scheduled exports via email
- Custom export templates
- Watermarking or branding on exports (configurable)
