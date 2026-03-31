# TC-3.3: Sorting

**System Requirement**: [SR-3.3](../../system-requirements/table.md#sr-33-sorting)

## TC-3.3.1: Click column header to sort ascending

### Preconditions

- Table view active, Entities tab
- Table displays 20+ rows with columns: Name, Type, Owner
- Current sort: none (default order, perhaps by ID)

### Test Steps

1. Click on the "Type" column header
   - **Expected**:
     - Table rows reorder
     - Type column header shows an upward arrow (ascending indicator)
     - Rows are sorted alphabetically A→Z by Type
     - Secondary sort may be by Name or ID (if same Type)
2. Verify order
   - **Expected**: Scanning rows, Type values appear in ascending order

### Post-conditions

- Single column sorted ascending

### Test Data

| Initial order | Sort column | Sort direction | Expected order by column |
| ------------- | ----------- | -------------- | ----------------------- |
| unsorted      | Type        | asc (↑)       | A, B, C... alphabetically |

## TC-3.3.2: Click same header again to reverse sort direction

### Preconditions

- Table sorted by "Type" ascending (from TC-3.3.1)

### Test Steps

1. Click the "Type" header again
   - **Expected**:
     - Sort direction reverses to descending
     - Header arrow points down
     - Rows now sorted Z→A by Type

### Post-conditions

- Sort toggles between asc and desc on repeated clicks

### Test Data

| Action           | New direction |
| ---------------- | ------------- |
| click Type again | descending ↓  |

## TC-3.3.3: Click different column to change sort

### Preconditions

- Table sorted by "Type" ascending

### Test Steps

1. Click on "Owner" column header
   - **Expected**:
     - Previous sort indicator (on Type) clears
     - Owner header gets ascending arrow
     - Rows reorder sorted by Owner A→Z
     - Type order is no longer guaranteed (unless secondary sort)

### Post-conditions

- Sort column switches
- Only one column sorted at a time

### Test Data

| From column | To column | Expected order by |
| ----------- | --------- | ----------------- |
| Type asc    | Owner asc | Owner A→Z        |

## TC-3.3.4: Sorting handles empty values (null/undefined) by placing them at the end

### Preconditions

- Table with entities, some have empty Owner field (null)
- Column: Owner

### Test Steps

1. Sort by Owner ascending
   - **Expected**:
     - Rows with non-empty Owner appear first (A→Z)
     - Rows with null/empty Owner appear at the very end (after Z)
2. Sort by Owner descending
   - **Expected**: Non-empty names Z→A first; nulls still at the end (regardless of asc/desc, nulls are last)

### Post-conditions

- Empty values consistently placed at end

### Test Data

| Owner values (some null) | Sort Owner asc | null position |
| ------------------------ | -------------- | ------------- |
| Alice, Bob, null, Carol | Alice, Bob, Carol, null | last |

## TC-3.3.5: Sorting respects filter Drives

### Preconditions

- Global filter active: only Microservice entities visible (25 rows)
- Table sorted by Name asc

### Test Steps

1. Apply a change in sorting (e.g., click Type asc)
   - **Expected**: Sorting operates only on the 25 visible rows
   - No hidden rows appear
2. Verify order
   - **Expected**: The 25 rows are sorted by Type

### Post-conditions

- Sort scope = visible rows after filters/drill-down

### Test Data

| Filtered count | Sort column | Sorted row count |
| -------------- | ----------- | ---------------- |
| 25            | Type        | 25               |

## TC-3.3.6: Sorting does not affect filter/drill-down state

### Preconditions

- Global filters active; drill-down active
- Table currently sorted by one column

### Test Steps

1. Change sort order (different column or direction)
   - **Expected**: Filters remain; drill-down scope unchanged
   - Only row order changes
2. Switch to Graph and back
   - **Expected**: Filters, drill-down still active; sort order should be preserved (per persistence spec: sorting may be local to table view and reset on tab switch? Check business rule: "Switching tabs (Entities/Relationships) resets the sort order to default." This is about switching between Entities and Relationships, not Graph/Table. Sorting in Entities should persist across Graph/Table switches, but switching tabs within Table resets sort.)

### Post-conditions

- Sorting isolated to table's current state

### Test Data

| Other state | Sort change | Effect on other state? |
| ----------- | ----------- | ---------------------- |
| filters     | sort        | none (filters persist) |

## TC-3.3.7: Visual indicator (arrow) in sorted column header

### Preconditions

- Table with sortable columns

### Test Steps

1. Sort by a column
   - **Expected**: Column header displays an arrow:
     - Up arrow (▲) for ascending
     - Down arrow (▼) for descending
   - Arrow may be accompanied by "sorted" styling (bold, highlighted)
2. Change to another column
   - **Expected**: Previous column's arrow clears; new column gets arrow

### Post-conditions

- Clear visual feedback

### Test Data

| Sorted column | Direction | Expected indicator |
| ------------- | --------- | ------------------ |
| Type          | asc       | ▲ up arrow         |
| Owner         | desc      | ▼ down arrow       |

## TC-3.3.8: Sorting algorithm handles strings, numbers, dates correctly

### Preconditions

- Table with mixed type columns:
  - "Name" (string)
  - "Created" (date)
  - "Version" (number as string or number)
- Sample data

### Test Steps

1. Sort numeric column "Version"
   - **Expected**: 1, 2, 10 (numeric order), not 1, 10, 2 (lexical)
2. Sort date column "Created"
   - **Expected**: chronological order (oldest→newest for asc)
3. Sort string column "Name"
   - **Expected**: alphabetical A→Z

### Post-conditions

- Appropriate collation per data type

### Test Data

| Column     | Data types           | Sort order expected   |
| ---------- | -------------------- | --------------------- |
| Version    | 1, 2, 10            | 1, 2, 10 (numeric)   |
| Created    | dates               | chronological        |
| Name       | strings             | alphabetical         |
