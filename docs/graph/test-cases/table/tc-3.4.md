# TC-3.4: Filtering (Global search in table view)

**System Requirement**: [SR-3.4](../../system-requirements/table.md#sr-34-filtering)

## TC-3.4.1: Global search filters table rows by matching any cell

### Preconditions

- Table view active, Entities tab
- Table displays rows with columns: Name, Type, Owner, Status

### Steps

1. Enter query "john" into the global search field in the header
   - Table updates in real-time (after 300ms debounce)
   - Only rows where any cell contains "john" (case-insensitive) remain visible
   - Other rows are hidden (display: none)
2. Switch to Graph view and back
   - The same search query persists and continues to filter the table
3. Clear the global search (click × button)
   - All rows (that match global filters) return
   - Search uses the same mechanism as in Graph view

### Test Data

| Query  | Matching rows | Non-matching rows hidden? |
| ------ | ------------- | ------------------------- |
| "john" | at least 1    | yes                       |

## TC-3.4.2: Search respects current global filters and drill-down

### Preconditions

- Global filter: only `Microservice` entities visible
- Table search cleared initially

### Steps

1. Enter global search "api"
   - Search is applied to the currently visible Microservices only
   - Results are subset of those visible entities
   - Entities not of type Microservice cannot appear (already hidden by global filter)
   - Search scope = (Active global filters + Drill scope) ∩ (Query)

### Test Data

| Global filter     | Global search | Expected matches                           |
| ----------------- | ------------- | ------------------------------------------ |
| Microservice only | "api"         | Microservices with "api" in any cell/field |

## TC-3.4.3: Clear button in global search resets table filtering

### Preconditions

- Global search field contains text "payment"

### Steps

1. Click the "Clear" (×) button inside the global search input
   - Text clears immediately
   - Table restores all rows (that match global filters)
   - Clear button is part of global search, not table-specific

### Test Data

| Action  | Global search | Table rows shown       |
| ------- | ------------- | ---------------------- |
| Click × | empty         | all (matching filters) |

## TC-3.4.4: Search debounced by 300ms

### Preconditions

- Table with many rows
- Global search field

### Steps

1. Type quickly: "a", "ab", "abc"
   - No intermediate filtering after each keystroke
2. Wait 300ms after last keystroke
   - Single filter operation runs with final query "abc"
3. Observe
   - Only one filter cycle occurred
   - Debounce prevents excessive re-renders

### Test Data

| Typing pattern | Filter triggered? |
| -------------- | ----------------- |
| fast "abc"     | once after 300ms  |

## TC-3.4.5: Search matches any cell (full-text across all columns)

### Preconditions

- Table rows with varied data in different columns

### Steps

1. Search a value that matches the "Type" column
   - Row appears
2. Search a value that matches the "Owner" column
   - Row appears
3. Search a value that matches the "Name" column
   - Row appears
   - Search is across all displayed columns (Name, Type, Status, Owner for entities; Source, Type,
     Target, Name for relationships)

### Test Data

| Query        | Matching column(s) | Row visible? |
| ------------ | ------------------ | ------------ |
| Microservice | Type               | yes          |
| john         | Owner              | yes          |
| Payment      | Name               | yes          |

## TC-3.4.6: No results message shown when nothing matches

### Preconditions

- Current global filters produce some visible entities
- None contain the string "xyz123" in any cell

### Steps

1. Enter "xyz123" into global search
   - Table shows "No results found" message
   - Hint may appear: "Check your filters"
   - User understands why no results appeared

### Test Data

| Query  | Expected outcome          |
| ------ | ------------------------- |
| xyz123 | no matches + hint message |

## TC-3.4.7: Search is case-insensitive

### Preconditions

- Entity with Name="PaymentService"

### Steps

1. Search "payment" (lowercase)
   - Row appears (case-insensitive match)
2. Search "PAYMENT" (uppercase)
   - Row appears
   - Case-insensitive matching works consistently

### Test Data

| Query case | Expected match? |
| ---------- | --------------- |
| payment    | yes             |
| PAYMENT    | yes             |

## TC-3.4.8: Switching table tabs does NOT reset global search

### Preconditions

- Table in Entities tab, global search "microservice" active
- Global search field contains "microservice"

### Steps

1. Switch to Relationships tab
   - Table shows relationships; global search "microservice" is still active
   - Same query applies to relationships table (filtered by relationship fields)
2. Switch back to Entities tab
   - Search field still contains "microservice"
   - Search persists across tab switches because it's global
   - Only switching to Graph view and back does not clear search either

### Test Data

| Search active  | Switch to Relationships | Back to Entities | Search persists? |
| -------------- | ----------------------- | ---------------- | ---------------- |
| "microservice" | filter applies to rels  | filter applies   | yes              |
