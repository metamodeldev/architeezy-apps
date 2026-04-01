# SR-5: Export

## Scenarios

### SR-5.1: Entity table export

The system allows exporting the list of entities currently displayed in the table to a CSV file.

#### Functional Requirements

- [FR-5.1](../functional-requirements.md#fr-5-export): Export the table view to CSV format.

#### User Story

As a user, I want to export the filtered list of entities to CSV so I can process the data in
external spreadsheet software.

#### Preconditions

- The Table view is active and the "Entities" tab is selected.

#### Steps

1. Open the export menu in the table toolbar.
   - A dropdown menu appears with the "Export to CSV" option.
2. Select the CSV export option.
   - The system generates a CSV file containing **only the currently visible columns** in their
     exact display order.
   - A loading indicator appears if the generation process exceeds 200ms.
   - The file downloads automatically to the local machine.

#### Edge Cases

- **Empty Table**: If no entities match the current filters, the export produces a file containing
  only the column headers.
- **Special Characters**: Data containing commas, quotes, or newlines is properly escaped according
  to the CSV standard.

### SR-5.2: Relationship table export

The system allows exporting the list of relationships currently displayed in the table to a CSV
file.

#### Functional Requirements

- [FR-5.1](../functional-requirements.md#fr-5-export): Export the table view to CSV format.

#### User Story

As a user, I want to export the filtered list of relationships to CSV to analyze the connectivity
data externally.

#### Preconditions

- The Table view is active and the "Relationships" tab is selected.

#### Steps

1. Open the export menu in the table toolbar.
   - A dropdown menu appears with the "Export to CSV" option.
2. Select the CSV export option.
   - The system generates a CSV file with columns for source, relationship type, target, and name.
   - The file downloads automatically.

### SR-5.3: Graph image export

The system allows capturing the full graph visualization as a high-quality image file.

#### Functional Requirements

- [FR-5.2](../functional-requirements.md#fr-5-export): Export graph visualizations as image files.

#### User Story

As a user, I want to export the graph as a PNG or SVG image to include it in presentations or
documentation.

#### Preconditions

- The Graph view is active and the model is fully rendered.

#### Steps

1. Open the export menu in the graph toolbar.
   - A dropdown menu appears with "Export as PNG" and "Export as SVG" options.
2. Select the desired image format.
   - The system captures the entire graph (all visible nodes and edges), including the legend and
     visual effects like dimming.
   - A loading indicator appears during the generation process.
   - The image file is downloaded with the appropriate extension.

#### Edge Cases

- **Large Graph**: If the graph exceeds browser canvas limits for high-resolution PNG, a
  notification suggests using the SVG format instead.
- **Export Cancellation**: If the process takes too long, the user can cancel the operation via the
  loading indicator.

## Business Rules

- **CSV Consistency**:
  - Export includes **only currently visible columns** of the table view.
  - Column order and sorting in the CSV exactly match the current state of the table UI.
  - Dynamic entity properties are exported as separate columns only if they are **currently
    displayed** in the table view.
  - Column headers in the CSV contain only plain text (no UI symbols or sorting icons).
  - Containment metadata (Parent/Container ID) is excluded from the export.
- **Image Consistency**:
  - The exported image faithfully reproduces the current visual state, including the active
    Drill-down scope and Highlight mode (dimmed elements).
  - The legend is included in the export only if it is currently enabled. It is rendered at its
    **specific canvas coordinates** as a part of the diagram.
  - **Background**: PNG exports always use a **solid white background** to ensure suitability for
    printing and documentation.
- **File Naming Pattern**: Exported files use the format: `{modelName}-{type}-{timestamp}`.
  - `{type}` is "entities", "relationships", or "graph".
  - `{timestamp}` format: `YYYYMMDD-HHMMSS`.
  - `{modelName}` is sanitized for filesystem compatibility.
- **Data Integrity**: CSV exports use UTF-8 encoding with a Byte Order Mark (BOM) to ensure
  compatibility with spreadsheet software.

## UI/UX Functional Details

- **Table Export Button Placement**: The CSV export button is positioned in the top-right corner of
  the table view, aligned horizontally with the Entities/Relationships tab switcher on the same
  toolbar line.
- **Feedback**: A loading indicator is displayed for any export exceeding 200ms.
- **Export Interruption**: If an export operation lasts longer than 5 seconds, a "Cancel" button is
  provided.
- **Legend Positioning**: Users are responsible for positioning the legend to avoid overlapping
  critical data in full-graph exports.
- **Visual Context**: Image exports (PNG) are rendered at 2x resolution. All transient UI chrome
  (toolbars, sidebar, tooltips) is excluded from the image.

## Technical Notes

- **CSV Generation**: Performed on the client side using a Blob. Field escaping follows the RFC 4180
  standard.
- **Image Capture**:
  - **PNG**: Uses the engine’s ability to export a full-model raster blob with a forced white
    background.
  - **Resolution Scaling**: The 2x resolution scaling is automatically reduced to 1x if the
    resulting image dimensions exceed browser-specific canvas limits.
  - **SVG**: Generates a scalable vector representation with text labels as editable elements.
- **Memory Management**: Generated Blobs and Data URLs are revoked immediately after the download
  starts.
- **Concurrency**: Multiple export operations can be initiated independently.
