# TC-5.1: Entity table export

**System Requirement**: [SR-5.1](../../system-requirements/export.md#sr-51-entity-table-export)

## TC-5.1.1: Export entities table to CSV with all visible columns

### Preconditions

- Table view is active
- "Entities" tab is selected
- Table displays columns: Name, Type, Status, Owner (in that order)
- Model has 10 entity rows matching current filters

### Steps

1. Open the export menu in the table toolbar
   - Dropdown appears with "Export to CSV" option
2. Select "Export to CSV"
   - Loading indicator appears if generation exceeds 200ms
3. Wait for download to complete
   - CSV file downloads automatically with name pattern: `{modelName}-entities-{timestamp}.csv`
4. Open the CSV file
   - File contains exactly 4 columns (Name, Type, Status, Owner) in that order
   - Header row contains plain text column names (no sorting icons)
   - All 10 entity rows are present with correct data
   - Export completed successfully
   - File saved to user's machine

### Test Data

| Field     | Value                                  |
| --------- | -------------------------------------- |
| Columns   | Name, Type, Status, Owner              |
| Row count | 10                                     |
| Filename  | `{model}-entities-YYYYMMDD-HHMMSS.csv` |
| Encoding  | UTF-8 with BOM                         |

## TC-5.1.2: Export only currently visible columns

### Preconditions

- Table view active, Entities tab
- User has customized visible columns: only Name and Type are shown; Status and Owner are hidden

### Steps

1. Click "Export to CSV"
   - CSV contains only Name and Type columns
2. Verify exported columns
   - No Status or Owner columns appear in the file
   - Export respects current column visibility

### Test Data

| Visible columns | Expected CSV columns |
| --------------- | -------------------- |
| Name, Type      | Name, Type           |

## TC-5.1.3: Export with special characters (commas, quotes, newlines)

### Preconditions

- Table contains entities with special characters in their data:
  - Name: `"Acme, Corp"` (contains comma)
  - Owner: `"John "The Man" Doe"` (contains quotes)
  - Description field (if visible): `"Line 1\nLine 2"` (contains newline)

### Steps

1. Ensure all relevant columns are visible
2. Export to CSV
   - File downloads successfully
3. Open CSV in a spreadsheet program (Excel, Google Sheets)
   - Data is correctly parsed:
     - `"Acme, Corp"` appears in one cell (comma doesn't split)
     - `"John "The Man" Doe"` appears correctly (quotes escaped per RFC 4180)
     - Multi-line text stays in single cell with line break
   - CSV follows RFC 4180 standard for field escaping

### Test Data

| Field | Test value                   |
| ----- | ---------------------------- |
| Name  | `"Acme, Corp"` (with quotes) |
| Owner | `John "The Man" Doe`         |
| Notes | `Line 1\nLine 2`             |

## TC-5.1.4: Export empty table produces headers only

### Preconditions

- Table view active, Entities tab
- Current filters result in zero visible rows (table shows "No data available")

### Steps

1. Click "Export to CSV"
   - File downloads
2. Open the CSV file
   - File contains only the header row with column names; no data rows
   - Empty export succeeds with headers only

### Test Data

| Filter condition | Expected rows |
| ---------------- | ------------- |
| status:archived  | 0 rows        |
| CSV content      | headers only  |

## TC-5.1.5: Export respects current sorting order

### Preconditions

- Table sorted by Type (ascending), then by Name (ascending)
- 10+ rows visible

### Steps

1. Export to CSV
   - CSV rows appear in the same order as displayed in the table
2. Verify row order in file
   - Sorting order matches UI exactly
   - CSV preserves UI sorting

### Test Data

| Sort order     | Expected CSV order |
| -------------- | ------------------ |
| Type ↑, Name ↑ | same as UI         |

## TC-5.1.6: Column order in CSV matches display order

### Preconditions

- User has reordered table columns: Owner, Name, Type, Status (dragged to rearrange)

### Steps

1. Export to CSV
   - CSV columns appear in the order: Owner, Name, Type, Status
2. Check header row
   - Column order matches current display order
   - CSV column order reflects UI column arrangement

### Test Data

| Display order             | Expected CSV order |
| ------------------------- | ------------------ |
| Owner, Name, Type, Status | same               |

## TC-5.1.7: Export during loading shows indicator

### Preconditions

- Table data is being fetched (loading state)
- Export menu is accessible

### Steps

1. Click "Export to CSV" while loading spinner is visible
   - Either:
     - Export is disabled until loading completes, OR
     - Export initiates and the generated CSV reflects the data that finishes loading first (race
       condition handled)
   - Export behavior is deterministic (either waits or uses completed data)

### Test Data

| Scenario          | Expected behavior                |
| ----------------- | -------------------------------- |
| Click during load | export waits or uses loaded data |

## TC-5.1.8: Export can be cancelled if takes too long

### Preconditions

- Very large table (10,000+ rows) that may take >5 seconds to generate CSV

### Steps

1. Click "Export to CSV"
   - Loading indicator appears with a "Cancel" button (as per UX details)
2. Click "Cancel" before generation completes
   - Export process aborts; no file downloaded
3. UI returns to normal state
   - User can interact with table again
   - Long-running export is interruptible
   - No partial file is saved

### Test Data

| Table size   | Export time | Cancel available |
| ------------ | ----------- | ---------------- |
| 10,000+ rows | >5s         | yes              |

## TC-5.1.9: Export respects global filters

### Preconditions

- Global filters are active: only entities of type "Microservice" are visible (100 out of 500 total)

### Steps

1. Click "Export to CSV"
   - CSV contains only the 100 visible microservice entities
2. Verify the exported data
   - All rows have type "Microservice"; no other types appear
   - Export only includes currently visible rows (post-filter)

### Test Data

| Global filter     | Total entities | Visible entities |
| ----------------- | -------------- | ---------------- |
| type:Microservice | 500            | 100              |
