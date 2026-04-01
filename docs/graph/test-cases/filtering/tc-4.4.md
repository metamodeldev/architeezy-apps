# TC-4.4: Global search

**System Requirement**: [SR-4.4](../../system-requirements/filtering.md#sr-44-global-search)

## TC-4.4.1: Global search in Graph view dims non-matching elements

### Preconditions

- Graph view active
- Model contains:
  - Entity types: `Microservice` (20 nodes), `Database` (10 nodes), `Queue` (5 nodes)
  - All types currently visible (checked in filter panel)
- No local filters applied

### Steps

1. Enter query "payment" into the global search field in the header
   - Graph updates to show:
     - Nodes matching "payment" (either by name or type) remain fully opaque (100%)
     - All other nodes become dimmed (35% opacity)
     - Edges connected to non-matching nodes are dimmed (15% opacity), unless connected to a
       matching node
2. Clear the search field
   - All nodes and edges return to full opacity; graph returns to previous state
   - Search acts as a visual spotlight on matching elements
   - Non-matching elements are not removed, only dimmed

### Test Data

| Query     | Matching entity types | Expected opacity: matching | Expected opacity: non-matching |
| --------- | --------------------- | -------------------------- | ------------------------------ |
| "payment" | maybe 3 nodes         | 100%                       | nodes 35%, edges 15%           |

## TC-4.4.2: Global search in Table view filters to matching rows

### Preconditions

- Table view active, "Entities" tab
- Table displays 100 rows with columns: Name, Type, Owner

### Steps

1. Enter query "john" into global search field
   - Table updates in real-time (debounced 300ms) to show only rows where any cell contains "john"
   - Only matching rows are visible; others are hidden
2. Clear search
   - All 100 rows restore
   - Table local filtering works alongside global entity filters
   - Search is a subset of active types

### Test Data

| Query  | Total rows | Expected visible rows |
| ------ | ---------- | --------------------- |
| "john" | 100        | rows with "john"      |

## TC-4.4.3: Search results respect active entity filters

### Preconditions

- Entity filter: only `Microservice` is checked; Database and Queue unchecked (hidden)
- Global search field is empty
- Graph shows only Microservice nodes (15 visible)

### Steps

1. Enter query "auth"
   - Search results are a **subset** of currently visible Microservice nodes
   - No Database or Queue nodes appear even if their names match "auth" (they're filtered out by
     entity type)
2. Clear search and uncheck all entity filters (or check all)
   - All entity types become visible
3. Search "auth" again
   - Now matches can come from any entity type, because all are visible
   - Search scope = (Active Types) AND (Query)
   - Entity filter is pre-requisite; search cannot override it

### Test Data

| Entity filter visibility | Search query | Result scope                     |
| ------------------------ | ------------ | -------------------------------- |
| Only Microservice        | "auth"       | Microservice nodes matching auth |
| All entities             | "auth"       | any entity matching auth         |

## TC-4.4.4: Search with no results shows hint

### Preconditions

- Active filters: only `Microservice` visible
- No Microservice entity has name containing "xyz123"

### Steps

1. Enter "xyz123" into global search
   - Graph: all nodes dimmed (or empty) because no matches
   - OR Table: shows "No results found in the current scope. Check your filters." message
2. Observe UI hint
   - A helpful prompt suggests checking filters
   - User understands why no results appeared

### Test Data

| Query  | Expected outcome          |
| ------ | ------------------------- |
| xyz123 | no matches + hint message |

## TC-4.4.5: Search is debounced by 300ms

### Preconditions

- Graph with 1000+ nodes (slow to filter)
- DevTools network/throttle available

### Steps

1. Type quickly: "a", "b", "c" (each within <100ms of previous)
   - No filter/redraw occurs after each keystroke
2. Wait 300ms after last keystroke
   - Single filter operation runs with the final query "abc"
3. Verify only one filter cycle occurred
   - Graph rendered once with final query
   - Debouncing prevents excessive re-renders during typing

### Test Data

| Typing pattern | Filter triggered? |
| -------------- | ----------------- |
| fast "abc"     | once after 300ms  |

## TC-4.4.6: Search respects Drill-down scope

### Preconditions

- Drill-down mode active on node "OrderService"
- Drill-down scope includes: OrderService, PaymentService, TransactionDatabase
- Only these 3 nodes visible

### Steps

1. Search for "Service"
   - Matches: OrderService, PaymentService (both visible); TransactionDatabase does not match
   - Result: these two nodes fully opaque; drill-down root (OrderService) is also a match?
2. Search for "Database"
   - Only TransactionDatabase matches (still within scope)
3. Search for "User" (not in scope)
   - No results; hint may appear
   - Search scope is limited to currently visible entities (due to filters + drill-down)

### Test Data

| Drill-down scope visible nodes                    | Query     | Expected matches within scope |
| ------------------------------------------------- | --------- | ----------------------------- |
| OrderService, PaymentService, TransactionDatabase | "Service" | OrderService, PaymentService  |

## TC-4.4.7: Clear button resets search

### Preconditions

- Global search field contains text "payment"

### Steps

1. Click the "Clear" (×) button inside the search input
   - Text clears instantly
   - Graph/table returns to pre-search state (all visible elements full opacity, no filtering)
2. Verify UI
   - No query remains; spotlight effect removed
   - Quick reset available

### Test Data

| Action             | Search field | Graph/Table state    |
| ------------------ | ------------ | -------------------- |
| Click Clear button | empty        | restored to baseline |

## TC-4.4.8: Search matches on any cell/field

### Preconditions

- Table has columns: Name, Type, Owner, Status
- Row contains:
  - Name: "Payment Service"
  - Type: "Microservice"
  - Owner: "john.doe"
  - Status: "active"

### Steps

1. Search "Microservice"
   - Row is visible (matches on Type)
2. Search "john"
   - Row is visible (matches on Owner)
3. Search "Payment"
   - Row is visible (matches on Name)
   - Search is full-text across all displayed fields

### Test Data

| Search term  | Matching field(s) | Row visible? |
| ------------ | ----------------- | ------------ |
| Microservice | Type              | yes          |
| john         | Owner             | yes          |
| Payment      | Name              | yes          |

## TC-4.4.9: Edge case: case sensitivity

### Preconditions

- Model contains entity "PaymentService"

### Steps

1. Search "payment" (lowercase)
   - Depending on implementation, either:
     - Case-insensitive: matches (recommended)
     - Case-sensitive: no match
2. If case-sensitive is implemented, search "Payment" (capitalized)
   - Match
   - Case sensitivity policy is consistent and documented

### Test Data

| Query case | Expected match?                        |
| ---------- | -------------------------------------- |
| "payment"  | if insensitive: yes; if sensitive: no  |
| "Payment"  | if insensitive: yes; if sensitive: yes |
