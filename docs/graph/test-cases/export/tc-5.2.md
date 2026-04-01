# TC-5.2: Relationship table export

**System Requirement**:
[SR-5.2](../../system-requirements/export.md#sr-52-relationship-table-export)

## TC-5.2.1: Export relationships table to CSV

### Preconditions

- Table view is active
- "Relationships" tab is selected
- Table displays relationships with columns: Source, Type, Target, Name

### Steps

1. Open export menu in table toolbar
   - Dropdown shows "Export to CSV"
2. Select "Export to CSV"
   - File downloads with name: `{modelName}-relationships-{timestamp}.csv`
3. Open the CSV file
   - Contains columns: Source, Type, Target, Name
   - All visible relationship rows are included
   - Relationships exported successfully

### Test Data

| Columns          | Source, Type, Target, Name       |
| ---------------- | -------------------------------- |
| Filename pattern | `{model}-relationships-{ts}.csv` |

## TC-5.2.2: Export respects current filters

### Preconditions

- Global filter active: only entities of type "API" are visible
- Relationships table shows only relationships where both source and target are "API" entities

### Steps

1. Export relationships to CSV
   - CSV contains only relationships that match the current visibility (both endpoints visible)
2. Count rows
   - Row count matches table display count
   - Filtered relationships only

### Test Data

| Filter condition | Visible relationships |
| ---------------- | --------------------- |
| type:API         | only API→API edges    |

## TC-5.2.3: Empty relationships export

### Preconditions

- No relationships match current filters (e.g., filter hides all relationship types)
- Relationships tab shows empty state

### Steps

1. Export to CSV
   - File downloads with headers only, no data rows
   - Empty export succeeds

### Test Data

| State            | Expected rows |
| ---------------- | ------------- |
| No relationships | 0             |

## TC-5.2.4: Special characters in relationship names

### Preconditions

- Relationship data includes:
  - Name: `"Uses, Depends On"` (comma)
  - Type: `"↔"` (unicode symbol)
  - Source/Target names with quotes

### Steps

1. Export to CSV
   - File downloads without errors
2. Open in spreadsheet
   - Special characters preserved correctly; fields properly escaped
   - Unicode and special chars handled per RFC 4180

### Test Data

| Field | Test value           |
| ----- | -------------------- |
| Name  | `"Uses, Depends On"` |
| Type  | `↔` (unicode)        |

## TC-5.2.5: Export respects table sorting

### Preconditions

- Relationships table sorted by Type (asc)
- Multiple relationships visible

### Steps

1. Export to CSV
   - Rows in CSV match UI sort order
   - Sorting preserved

### Test Data

| Sort order | Expected CSV order |
| ---------- | ------------------ |
| Type ↑     | same as UI         |

## TC-5.2.6: Export uses correct file naming pattern

### Preconditions

- Model name: "e-commerce"
- Current timestamp

### Steps

1. Export relationships
   - Filename matches pattern: `e-commerce-relationships-YYYYMMDD-HHMMSS.csv`
2. Verify filename
   - Model name is sanitized (special chars removed/replaced); timestamp is in correct format
   - Naming convention followed

### Test Data

| Model name  | Expected filename fragment    |
| ----------- | ----------------------------- |
| e-commerce  | `e-commerce-relationships-`   |
| my-app v2.0 | sanitized → `my-app-v2-0-...` |
