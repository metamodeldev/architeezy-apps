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

- SR-11.1: CSV export is accessible when the table view is active
- SR-11.2: CSV export includes all currently visible rows
- SR-11.3: CSV format uses standard formatting with proper escaping of special characters
- SR-11.4: Image export is accessible when the graph view is active
- SR-11.5: Image export supports both PNG and SVG formats
- SR-11.6: Exported images may include an optional title/legend
- SR-11.7: Export provides progress feedback for large datasets
- SR-11.8: Export respects current filters

## Scenario

### CSV Export Scenario

#### Preconditions

- Table view is active
- Model is loaded with elements and/or relationships
- Filters may be applied; table shows subset of data

#### Steps

1. User clicks the "Export" button in the table toolbar
2. Dropdown menu appears with options: "Export to CSV"
3. User selects "Export to CSV"
4. A loading indicator appears (for large tables, >10,000 rows)
5. Application collects data from the current table view:
   - Visible rows only (respecting filters and search)
   - All columns currently displayed (sort order preserved)
   - For elements: name, type, documentation, properties
   - For relationships: source, target, type, name, documentation
6. Data is converted to CSV format:
   - Header row with column names
   - Data rows with values
   - Special characters (quotes, commas, newlines) are escaped per RFC 4180
   - UTF-8 encoding with BOM for Excel compatibility
7. Browser triggers download via a temporary download element or Blob URL
8. Filename is generated: `architeezy-{modelName}-elements-{timestamp}.csv`
9. Toast notification appears: "CSV exported successfully"
10. Loading indicator disappears

#### Expected Results

- CSV file downloads to user's default download folder
- File can be opened in Excel, Google Sheets, or text editor
- Only filtered/visible data is included
- Column order matches the table's current display
- Non-ASCII characters display correctly
- Large exports complete within reasonable time (progress indicator shown)

#### Edge Cases

- **Empty table (no visible rows after filters)**
  - Export still produces a CSV with headers only
  - Notification: "Exported 0 rows"

- **Very large table (100,000+ rows)**
  - May take several seconds; progress indicator shown
  - Browser may warn about slow performance; acceptable
  - Memory consumption: stream processing may be needed for extreme cases

- **Special characters in data**
  - Embedded commas, quotes, newlines properly escaped
  - Example: `"He said, ""Hello"""` becomes quoted and doubled

- **Unicode characters (emojis, non-Latin scripts)**
  - UTF-8 with BOM ensures Excel compatibility
  - Without BOM, some apps may misinterpret encoding

- **Export while table is still loading/filtering**
  - Disable export button until data stable
  - Or queue export to run after filtering completes

### Image Export Scenario

#### Preconditions

- Graph view is active
- Graph is fully rendered with nodes and edges
- User may have zoomed, panned, or selected specific nodes

#### Steps

1. User clicks the "Export" button in the graph toolbar
2. Dropdown menu appears with options: "Export as PNG", "Export as SVG"
3. User selects desired format
4. Loading indicator appears
5. Application captures graph canvas:
   - For PNG: Render to off-screen canvas at 2× resolution
   - For SVG: Generate SVG markup from graph elements
   - Capture includes visible nodes and edges within the viewport (or full graph, depending on
     settings)
6. For PNG:
   - Create canvas element with scaled dimensions
   - Render graph at high resolution
   - Convert to Blob with image/png type
7. For SVG:
   - Generate SVG using graph library's export method
   - Inline styles or include CSS stylesheet reference
   - Ensure text labels are rendered as text elements (not converted to paths)
8. Browser triggers download with appropriate extension (.png or .svg)
9. Filename generated: `architeezy-{modelName}-graph-{timestamp}.{ext}`
10. Toast: "Graph exported as PNG/SVG"
11. Loading indicator disappears

#### Expected Results

- Image file downloads successfully
- PNG is crisp, high-resolution (at least 2× screen resolution)
- SVG is vector-based, scales without loss, editable in tools like Inkscape/Illustrator
- Graph captures exactly what is visible in the viewport (current zoom/pan) unless "export all"
  option exists
- Node colors, shapes, edge styles match on-screen appearance
- Text labels are readable and selectable (in SVG)

#### Edge Cases

- **Graph not fully rendered**
  - Export disabled until graph layout completes
  - Or show warning: "Graph still loading; export may be incomplete"

- **Very large graph (10,000+ nodes)**
  - PNG export may take time; show progress
  - Memory usage may be high; consider tiling or simplifying for export
  - SVG size may become huge (>10 MB); warn user or offer "visible only" option

- **Graph with complex edge labels or overlapping nodes**
  - Rendered image may show visual clutter (acceptable; what you see is what you get)
  - Could offer "simplified" export mode with cleaner layout (future)

- **SVG text fonts not available on viewer**
  - Use web-safe fonts or inline font-family
  - Or convert text to paths (but loses editability)

- **SVG cross-origin image restrictions**
  - Graph uses no external images (node icons); all are drawn shapes, so no CORS issues

- **Browser memory limits for large canvas**
  - Export of huge PNG may fail due to canvas size limits
  - Catch errors and show user-friendly message

## Business Rules

### CSV Export Scope

- Export includes only the data currently displayed in the active table tab (elements or
  relationships).
- Active filters (type filters, search) reduce the exported set.
- Column order follows the table's current display order.
- All data properties are included where available.
- Empty/missing values export as empty fields.

### Image Export Scope

- Image export captures the entire graph, including all nodes and edges that satisfy active filters.
- The exported image includes all nodes, edges, and labels.
- Selection state is preserved in the exported image (selected nodes show highlight).
- Exported image includes:
  - Nodes with their shapes, colors, labels
  - Edges with lines, arrowheads, labels
  - Background color (theme-dependent)
- Excluded:
  - UI overlay elements (sidebar, header, tooltips, selection handles)
  - Canvas grid if shown in UI (usually hidden in export)
  - Scrollbars, zoom controls

### File Naming Conventions

- CSV: `architeezy-{modelName}-elements-{YYYYMMDD-HHMM}.csv` or `-relationships-`
- Image: `architeezy-{modelName}-graph-{YYYYMMDD-HHMM}.png` or `.svg`
- Model name is sanitized (remove filesystem-invalid characters) for safe filename.
- Timestamp uses local time in UTC format to avoid ambiguity.

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
- Exported images may include an optional title/legend, configurable in the export settings.

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

Filename format follows the convention defined in Business Rules (File Naming Conventions section).
The `{type}` component is either `elements` or `relationships` depending on the active table tab.

### PNG Export (Graph Library)

PNG export uses the graph visualization library's built-in export method or manual canvas rendering.
Exported PNG has sufficient resolution (at least 2× display size for clarity). Background color
should match the current theme's background.

### SVG Export (Graph Library)

SVG export generates vector markup from graph elements. SVG export preserves vector quality for
scaling and print. Text labels should remain as text elements for editability. Consider inline
styles for standalone SVG files.

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
