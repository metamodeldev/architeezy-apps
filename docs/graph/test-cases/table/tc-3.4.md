# TC-3.4: Filtering (Local table search)

**System Requirement**: [SR-3.4](../../system-requirements/table.md#sr-34-filtering)

## TC-3.4.1: Table search filters rows by matching any cell

### Preconditions

- Table view active, Entities tab
- Table displays 50 rows with columns: Name, Type, Owner, Status

### Test Steps

1. Enter query "john" into the table's search field
   - **Expected**: Table updates in real-time (after 300ms debounce)
   - Only rows where any cell contains "john" (case-insensitive?) remain visible
   - Row count updates to show X matching rows (e.g., "Showing 5 of 50")
2. Clear search
   - **Expected**: All 50 rows return

### Post-conditions

- Local table search works as expected

### Test Data

| Query  | Matching rows | Non-matching rows hidden? |
| ------ | ------------- | ------------------------ |
| "john" | 5             | yes                      |

## TC-3.4.2: Search is isolated to table (does not affect Graph)

### Preconditions

- Split view or ability to quickly switch? Actually, Graph not visible while Table is active. But the key is: table search is local and does not modify global filters.

### Test Steps

1. In Table view, apply local search "active"
   - **Expected**: Table shows filtered rows
2. Switch to Graph view
   - **Expected**: Graph shows all entities matching global filters and drill-down (local table search is NOT applied)
3. Switch back to Table
   - **Expected**: Local search is still active (persisted in table view state) and rows remain filtered

### Post-conditions

- Table search does not impact global filtering

### Test Data

| Table search | Graph view effect | Back to Table |
| ------------ | ----------------- | ------------- |
| "active"     | none (global unchanged) | search still applied |

## TC-3.4.3: Clear button resets search

### Preconditions

- Table search field contains text "microservice"

### Test Steps

1. Click the "Clear" (×) button inside the search input
   - **Expected**: Text clears immediately
   - Table restores all rows (that match global filters)
   - Row count returns to pre-search total

### Post-conditions

- Quick reset works

### Test Data

| Action    | Search field | Rows shown |
| --------- | ------------ | ---------- |
| Click ×   | empty        | all        |

## TC-3.4.4: Search debounced by 300ms

### Preconditions

- Table with 1000 rows (could be slow to filter)
- Search field

### Test Steps

1. Type quickly: "a", "b", "c" (each within <100ms)
   - **Expected**: No intermediate filtering occurs immediately after each keystroke
2. Wait 300ms after last keystroke
   - **Expected**: Single filter operation runs with final query "abc"
3. Observe network or CPU if needed
   - **Expected**: Only one filter cycle, not three

### Post-conditions

- Debounce prevents excessive re-renders

### Test Data

| Typing speed       | Filter triggered count |
| ------------------ | ---------------------- |
| fast "abc"         | 1 (after 300ms delay) |

## TC-3.4.5: Search matches any cell (full-text across visible columns)

### Preconditions

- Table rows with varied data:
  - Row1: Name="Payment Service", Type="Microservice", Owner="john.doe"
  - Row2: Name="User API", Type="API", Owner="alice"

### Test Steps

1. Search "Microservice"
   - **Expected**: Row1 appears (matches Type)
2. Search "john"
   - **Expected**: Row1 appears (matches Owner)
3. Search "Payment"
   - **Expected**: Row1 appears (matches Name)

### Post-conditions

- Search is across all displayed columns

### Test Data

| Query        | Matching column(s) | Row(s) visible |
| ------------ | ----------------- | -------------- |
| Microservice | Type              | Row1           |
| john         | Owner             | Row1           |
| Payment      | Name              | Row1           |

## TC-3.4.6: Search respects current global filters

### Preconditions

- Global filter: only `Microservice` entities visible (25 rows)
- Table search cleared initially

### Test Steps

1. Search "api" within Table
   - **Expected**: Search is applied to the 25 visible Microservices only
   - Results are subset of those 25
   - Entities not of type Microservice cannot appear because they're already hidden by global filter

### Post-conditions

- Search scope = (Global Filter Results) ∩ (Query)

### Test Data

| Global filter | Table search | Expected matches |
| ------------- | ------------ | ---------------- |
| Microservice only | "api"     | Microservices with "api" in any cell |

## TC-3.4.7: No results message with hint

### Preconditions

- Current global filters produce 50 visible entities
- None of them contain the string "xyz123" in any cell

### Test Steps

1. Search "xyz123"
   - **Expected**: Table shows "No matching records" or "No results found"
   - Additional hint: "Check your filters" or similar suggestion
   - Row count shows "0 of 50"

### Post-conditions

- User guided why no results

### Test Data

| Query    | Expected message                    |
| -------- | ----------------------------------- |
| xyz123   | "No results. Check your filters."  |

## TC-3.4.8: Search is case-insensitive? (based on implementation)

### Preconditions

- Entity with Name="PaymentService" (capital P and S)

### Test Steps

1. Search "payment" (lowercase)
   - **Expected**: If case-insensitive, row appears; if case-sensitive, no match
2. Search "PAYMENT" (uppercase)
   - **Expected**: If case-insensitive, row appears; if case-sensitive, may appear if stored in uppercase? Usually case-insensitive search is UX best practice.

### Post-conditions

- Case sensitivity policy consistent

### Test Data

| Query case  | Match? (if case-insensitive) |
| ----------- | ---------------------------- |
| payment     | yes                          |
| PAYMENT     | yes                          |

## TC-3.4.9: Switching to Relationships tab resets local search (per business rule)

### Preconditions

- Entities tab active, local search "microservice" entered (rows filtered)
- Table search field contains "microservice"

### Test Steps

1. Switch to Relationships tab
   - **Expected**: Table shows relationships; local search field may be empty or cleared (reset)
   - Because local search is isolated to the tab
2. Switch back to Entities tab
   - **Expected**: Search field is empty (reset) or retains previous? Business rule says: "Switching tabs (Entities/Relationships) resets the sort order to default." It doesn't explicitly say about search, but typically search should also reset or be per-tab. Assume per-tab independence or reset.
   - If design says search does not persist across tab switches, it should be cleared.

### Post-conditions

- Tab切换 clears local search context

### Test Data

| Entity search active | Switch to Relationships | Back to Entities | Search still "microservice"? |
| -------------------- | ----------------------- | ---------------- | ---------------------------- |
| yes                  | maybe cleared          | no (reset)       | no                          |
