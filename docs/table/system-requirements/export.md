# SR-4: Export

## Scenarios

### SR-4.1: CSV Export

The system exports the current matrix view to a CSV file.

#### Functional Requirements

- [FR-4.1](../functional-requirements.md#fr-4-export): Export the matrix to CSV format.

#### User Story

As a user, I want to download my matrix as a CSV file so I can analyze it in external spreadsheet
software or share it with colleagues.

#### Preconditions

- A model is loaded and the Table view is active.
- A matrix definition is configured (rows and/or columns with at least one data item).
- The matrix has been computed and is displayed (not in an error state).

#### Steps

1. Click the "↓ CSV" export button in the toolbar.
   - If the matrix name is set, it is used in the filename; otherwise, a placeholder name is used.
2. The system generates a CSV file:
   - Includes all column headers: row axis group headers (if `rowTabular=true`) and data item names.
   - Includes all row headers: column axis group headers (if `colTabular=true`) and leaf/group row
     labels.
   - The grid data values are placed in their respective cells.
   - Unicode text is encoded as UTF-8 with BOM for Excel compatibility.
3. The file downloads automatically with a name like `{matrixName}-{YYYYMMDD-HHMMSS}.csv`.

#### Edge Cases

- **Empty Matrix**: If the matrix has no rows or no columns, the CSV contains only column headers
  (with no data rows) or is essentially empty.
- **Special Characters**: Values containing commas, quotes, or newlines are properly escaped using
  double quotes and quote doubling according to RFC 4180.
- **Large Matrix**: For very large matrices (e.g., 10,000+ rows), the CSV generation should complete
  within 1 second on modern hardware. Memory consumption should be reasonable (streaming not
  required, but avoid excessive string concatenation overhead).
- **Hidden Levels**: Hidden levels are excluded from the CSV headers; only visible headers and leaf
  labels appear.
- **Subtotals and Totals**: If enabled, subtotal and total rows/columns are included in the export
  as regular data rows/columns. The labels "Subtotal" and "Total" appear in appropriate header
  cells.

### SR-4.2: Clipboard Copy

The system copies the current matrix data to the clipboard for pasting into spreadsheets.

#### Functional Requirements

- [FR-4.2](../functional-requirements.md#fr-4-export): Copy matrix data to the clipboard for
  compatibility with spreadsheet applications.

#### User Story

As a user, I want to quickly copy my matrix to the clipboard and paste it directly into Excel,
Google Sheets, or another spreadsheet application without creating a file.

#### Preconditions

- A model is loaded and the Table view is active.
- A matrix definition is configured and displayed.
- The browser supports the Clipboard API (most modern browsers).

#### Steps

1. Click the "⧉ Copy" button in the toolbar.
2. The system copies the matrix to the clipboard as tab-separated values (TSV).
   - The format mirrors the visual table: row headers (group and leaf) followed by data cells.
   - Tabs separate columns; newlines separate rows.
3. A toast notification "✓ Copied" appears briefly.
4. The user switches to their spreadsheet application and pastes (Ctrl+V / Cmd+V).
   - The data appears in cells with proper row and column structure.

#### Edge Cases

- **Copy Failure**: If the Clipboard API rejects (e.g., insecure context, permissions denied), the
  system shows "Copy failed" toast and does not throw an uncaught error.
- **Very Large Table**: Copying >100,000 cells may be slow or exceed clipboard size limits. The
  system should not freeze the UI; the operation is synchronous but should be reasonably fast
  (<500ms for typical matrices).
- **Hidden Levels**: Hidden levels are excluded from the copied data, consistent with the CSV
  export.
- **Format**: TSV is used instead of CSV to avoid ambiguity with commas in data. Spreadsheet
  applications automatically parse TSV on paste.

### SR-4.3: Matrix Identification in Exports

The system includes meaningful identifiers in exported files.

#### Functional Requirements

- [FR-4.1](../functional-requirements.md#fr-4-export): Export the matrix to CSV format.
- [FR-4.2](../functional-requirements.md#fr-4-export): Copy matrix data to the clipboard for
  compatibility with spreadsheet applications.

#### User Story

As a user, I want exported files to have descriptive names and the matrix name to appear in the data
so I can identify the source later.

#### Steps

1. Set a matrix name in the toolbar name input (optional but recommended).
2. Perform a CSV export.
   - The downloaded filename includes the matrix name (sanitized) and a timestamp.
   - The first row of the CSV includes column headers; the matrix name does not need to appear in
     the data itself, as the filename carries it.
3. Copy to clipboard.
   - The clipboard data does NOT include the matrix name; only the visible table content is copied.

#### Edge Cases

- **Missing Matrix Name**: If the matrix has no name, the filename uses a default placeholder like
  "Matrix" or "Untitled".
- **Filename Sanitization**: The matrix name is sanitized to remove filesystem-unsafe characters (/,
  \, :, \*, ?, ", <, >, |) and replaced with underscores or omitted.
- **Timestamp Format**: Timestamp is `YYYYMMDD-HHMMSS` in local time. This ensures uniqueness and
  chronological ordering.

## Business Rules

- **Export Consistency**:
  - CSV export and clipboard copy must exactly match the current visual table state (including any
    folding/unfolding of groups—note: when groups are collapsed, only visible leaf rows are
    exported; the subtotal row replaces the hidden leaves in the collapsed group's first row
    position).
  - Subtotals and totals are included if they are currently displayed.
  - Hidden levels (via `hidden: true`) are excluded from headers.
  - The export respects `showEmptyRows`/`showEmptyCols`: if hidden, empty structural rows/columns
    are omitted.
- **File Naming**:
  - Pattern: `{matrixName}-{timestamp}.csv`.
  - `timestamp`: current date and time in format `YYYYMMDD-HHMMSS`.
  - `matrixName`: user-provided name or "Matrix".
- **Clipboard Format**: Tab-separated values, with rows separated by `\n` (LF). No trailing tab on
  lines. The clipboard MIME type is `text/plain` (not `text/csv`). Applications like Excel and
  Google Sheets recognize TSV on paste.
- **Encoding**: CSV file uses UTF-8 with BOM (`\uFEFF` prefix) to ensure Excel correctly interprets
  Unicode characters. Clipboard text uses UTF-16 or platform-native encoding (handled by the
  Clipboard API).
- **Error Handling**: Any error during export (generation, file creation, clipboard write) must be
  caught and shown as a user-friendly toast message. The application must not crash.
- **Concurrency**: Multiple export operations can be initiated, but they should not run concurrently
  on the same data (unlikely due to button clicks). Each operation uses the current matrix state at
  the time of click.

## UI/UX Functional Details

- **Button Placement**: The CSV and Copy buttons are in the toolbar to the right of the view mode
  switcher, visually grouped as export actions.
- **Feedback**: For synchronous exports that complete quickly (<200ms), no loading indicator is
  shown; only a success toast ("✓ Copied" or a checkmark). If generation exceeds 200ms, a loading
  indicator should appear (optional; division of labor: `exportCsv` is synchronous and could be slow
  for large tables—consider Web Worker in future, but for now acceptable to block slightly).
- **Toast Notifications**:
  - CSV export: download happens silently; no toast needed (browser shows download UI). If error,
    show "Export failed".
  - Clipboard: show "✓ Copied" for 3 seconds on success; "Copy failed" on error.
- **Export Disabled State**: The export buttons are disabled when no matrix is ready (no data to
  export). They become enabled once a matrix is rendered.

## Technical Notes

- **CSV Generation** (`exportCsv(result, name)`):
  - Builds a 2D array of strings representing rows.
  - Header rows: for tabular mode, include group header rows (`result.rowAxis.numGroupLevels` rows
    for row groups + 1 for leaf headers if `rowLeafHidden` is false). For compact mode, only one
    header row with indentation.
  - Data rows: for each `flatRow` in `result.rowAxis.flatRows` (or `result.rowAxis.flatRows` after
    augmentation with subtotals/totals), emit a row consisting of:
    - Row header cells (group headers or compact label) for each column header row (spanning handled
      by empty strings for spanned cells).
    - Data cells from `grid[ri]`.
  - Uses a simple CSV serializer that wraps fields containing commas, quotes, or newlines in double
    quotes and doubles internal quotes.
  - Creates a `Blob` with type `text/csv;charset=utf-8`, adds BOM prefix (`\uFEFF`), and triggers
    download via `<a download>`.
- **Clipboard Copy** (`copyToClipboard(result)`):
  - Constructs a TSV string: for each row, join header cells (if visible) and data cells with `\t`.
  - Uses `navigator.clipboard.writeText(text)`.
  - Must be called from a user gesture (the button click) to avoid permission errors.
- **Matrix Identity**: The export functions receive the `result` object from `computeMatrix` which
  includes `rowAxis`, `colAxis`, `grid`, and `qualIdx` (not used in export). They also receive the
  matrix `name` for CSV filename.
- **Performance**: CSV generation is O(R×C) and may be slow for large tables (>50k cells). Consider
  chunking or Web Worker if this becomes a user-reported issue. Current threshold of 10k rows should
  be acceptable (<500ms).
- **Consistency with Graph**: The CSV export format should be consistent with any future Graph table
  export (same column ordering, same headers). But currently Table is independent.

## Related Work

- **Graph Export**: Graph image export is covered in a separate SR for Graph module. Table only
  handles CSV and clipboard.
- **Future Enhancements**:
  - Excel (.xlsx) export with formatting.
  - JSON export for programmatic consumption.
  - Incremental rendering for large exports.
  - User-configurable column selection in export (choose which data items to include).
