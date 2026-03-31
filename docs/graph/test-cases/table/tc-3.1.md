# TC-3.1: View switching

**System Requirement**: [SR-3.1](../../system-requirements/table.md#sr-31-view-switching)

## TC-3.1.1: Switch from Graph to Table view

### Preconditions

- Graph view is active
- Model is loaded with data

### Test Steps

1. Click "Table" in the application header (view mode toggle)
   - **Expected**:
     - Graph canvas hides (or is replaced)
     - Table view becomes visible
     - Two tabs appear: "Entities" and "Relationships" (Entities active by default)
     - Table displays entities according to current global filters and drill-down state
     - URL updates with view parameter (e.g., `&view=table`)
     - Browser history entry added (pushState)

### Post-conditions

- Table view active
- Graph view hidden

### Test Data

| Initial view | Action  | New view | URL change? |
| ------------ | ------- | -------- | ----------- |
| Graph        | switch to Table | Table  | yes (pushState) |

## TC-3.1.2: Switch from Table to Graph view

### Preconditions

- Table view active (Entities tab)
- Model data present

### Test Steps

1. Click "Graph" in the header view toggle
   - **Expected**:
     - Table hides
     - Graph canvas becomes visible
     - Graph renders with current filters, drill-down state
     - URL updates to `view=graph`
     - History entry added

### Post-conditions

- Graph view active
- Graph retains previous pan/zoom/selection (transient state per technical notes)

### Test Data

| Initial view | Action  | New view | History? |
| ------------ | ------- | -------- | -------- |
| Table        | switch to Graph | Graph  | pushState |

## TC-3.1.3: View switch preserves global filters and drill-down

### Preconditions

- Graph view active
- Global filters: only `Microservice` visible
- Drill-down active on node X, depth=2

### Test Steps

1. Switch to Table view
   - **Expected**: Table shows only entities that match filters AND are within drill-down scope
   - Row count = number of visible Microservice entities within drill-down
2. Switch back to Graph
   - **Expected**: Graph still shows Microservice filter active; drill-down still active with same root and depth
3. Check URL parameters
   - **Expected**: Filter parameters and drill-down parameters persist through view switches

### Post-conditions

- Global state (filters, drill-down) is consistent across views

### Test Data

| State           | Switch to Table               | Back to Graph                |
| --------------- | ----------------------------- | ---------------------------- |
| filter + drill  | table reflects same scope     | graph retains scope          |

## TC-3.1.4: View switch preserves table scroll position on return

### Preconditions

- Table view active
- Table has many rows (scrollable)
- User has scrolled to row 500 (middle of table)

### Test Steps

1. While scrolled down, switch to Graph view
2. Switch back to Table view
   - **Expected**: Table returns with scroll position approximately where it was (near row 500)
   - Or at least at the top of the currently visible rows

### Post-conditions

- User's scroll context is preserved (UX detail)

### Test Data

| Scroll position before switch | After switch back to Table |
| ----------------------------- | -------------------------- |
| row 500 visible              | row 500 still visible/approx|

## TC-3.1.5: Switching during data load shows loading indicator

### Preconditions

- Model data is being fetched (loading spinner visible)

### Test Steps

1. While loading, click to switch views (Graph → Table or Table → Graph)
   - **Expected**:
     - View changes (canvas/table component swaps)
     - Loading indicator persists in the new view until data completes
     - Data appears in the new view when ready
     - No error or broken state

### Post-conditions

- Loading state crosses view boundary

### Test Data

| Scenario          | Expected behavior                    |
| ----------------- | ------------------------------------ |
| Switch during load | new view shows loading until data  |

## TC-3.1.6: View switch does not reset table sort order

### Preconditions

- Table view active, Entities tab
- Table sorted by "Type" ascending
- User switches to Graph view

### Test Steps

1. Switch to Graph
2. Switch back to Table
   - **Expected**: Table remains sorted by Type ascending (sort order persisted per view)

### Post-conditions

- Sort order persists within view mode

### Test Data

| Initial sort | After Graph→Table | Sort preserved? |
| ------------ | ----------------- | --------------- |
| Type ↑       | still Type ↑     | yes             |

## TC-3.1.7: View switch uses pushState (major transition)

### Preconditions

- Graph view active
- DevTools history panel open

### Test Steps

1. Switch to Table view
   - **Expected**: `history.pushState()` is called; a new history entry is created
2. Click browser Back button
   - **Expected**: App returns to Graph view

### Post-conditions

- Navigation history includes view switches as distinct entries

### Test Data

| Action              | History method |
| ------------------- | -------------- |
| Graph → Table       | pushState      |
| Table → Graph       | pushState      |

## TC-3.1.8: Table and Graph share same data source (no refetch)

### Preconditions

- Model data already loaded in memory (from previous Graph view or earlier Table view)

### Test Steps

1. Switch from Graph to Table
   - **Expected**: Table displays data immediately (or with minimal loading); no network fetch specifically for table
   - Data source is the same in-memory model
2. Switch back to Graph
   - **Expected**: Graph shows instantly, using same in-memory data

### Post-conditions

- No redundant API calls for view switching

### Test Data

| Precondition   | Switch view | API call? |
| -------------- | ----------- | -------- |
| data loaded    | to Table   | no        |
| data loaded    | to Graph   | no        |
