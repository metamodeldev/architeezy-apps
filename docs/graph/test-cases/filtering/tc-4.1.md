# TC-4.1: Visibility

**System Requirement**: [SR-4.1](../../system-requirements/filtering.md#sr-41-visibility)

## TC-4.1.1: Toggle entity type visibility

### Preconditions

- Graph view active
- Filter panel is accessible
- Model contains entity types: `Microservice`, `Database`, `Queue`, `ExternalAPI`
- All entity types are currently checked (visible)

### Steps

1. Open the filtering panel
   - Two lists appear: "Entities" and "Relationships"; each type has a checkbox and a count
   - When available count equals total, only a single number is displayed (e.g., "30"); when they
     differ, both are shown separated by a slash (e.g., "15 / 30")
2. Uncheck the "Database" entity type
   - All Database nodes disappear from the graph; edges connected to them also disappear
   - In Full Model, entity available count always equals total count, so entity counts remain
     unchanged (Database still shows its total count)
   - The "Available" count for relationship types with Database as an endpoint drops to 0; those
     types remain visible in the list, now showing "0 / total" (dimmed)
   - Relationship types whose endpoints are still visible retain their available count
3. Re-check "Database"
   - Database nodes reappear; related relationships restore
   - Entity type visibility toggles correctly
   - Graph updates in real-time

### Test Data

| Entity types | Initial visible | After uncheck Database |
| ------------ | --------------- | ---------------------- |
| Microservice | ✓               | ✓                      |
| Database     | ✓               | ✗                      |
| Queue        | ✓               | ✓                      |
| ExternalAPI  | ✓               | ✓                      |

| Relationship   | Before (display) | After uncheck DB (display) | In list?     |
| -------------- | ---------------- | -------------------------- | ------------ |
| Calls (MS→MS)  | "8"              | "8" (unchanged)            | yes          |
| Stores (MS→DB) | "5"              | "0 / 5"                    | yes (dimmed) |

## TC-4.1.2: Toggle relationship type visibility

### Preconditions

- Graph view active
- Filter panel open
- Relationship types: `Calls`, `DependsOn`, `Produces`, `Triggers`

### Steps

1. Uncheck "DependsOn" relationship type
   - All DependsOn edges disappear from the graph
   - Connected nodes remain visible (unless they become unreachable in Drill-down mode, in which
     case they would also disappear)
2. Re-check "DependsOn"
   - DependsOn edges reappear
   - Relationship visibility toggles correctly
   - Node visibility unaffected by relationship filters alone

### Test Data

| Relationship type | Action    | Visual result            |
| ----------------- | --------- | ------------------------ |
| DependsOn         | unchecked | edges hidden, nodes keep |

## TC-4.1.3: Relationship type with available count 0 remains visible in the filter list

### Preconditions

- Full Model (not Drill-down)
- Graph shows entities: 5 Microservices, 3 Databases
- Relationship "Calls" connects Microservice→Microservice (8 edges)
- Relationship "Stores" connects Microservice→Database (5 edges)
- All entity and relationship types are checked

### Steps

1. Note the counts for relationship types (available = total → displayed as single number):
   - "Calls" shows "8"
   - "Stores" shows "5"
2. Uncheck "Database" entity type
   - "Stores" available count drops to 0 (no visible Database endpoints)
   - "Stores" total count remains 5 (Full Model total = count in the model, unchanged)
   - "Stores" **remains visible** in the Relationships list, now showing "0 / 5" and appearing
     dimmed
   - "Calls" count remains "8" (both Microservice endpoints are still visible)
3. Re-check "Database"
   - "Stores" available count restores to 5; display reverts to single number "5"
   - The type was never removed from the list

### Test Data

| Filter action        | Relationship | Total | Available | Count display | Visible in list? |
| -------------------- | ------------ | ----- | --------- | ------------- | ---------------- |
| All entities visible | Calls        | 8     | 8         | "8"           | yes              |
|                      | Stores       | 5     | 5         | "5"           | yes              |
| Database unchecked   | Calls        | 8     | 8         | "8"           | yes              |
|                      | Stores       | 5     | 0         | "0 / 5"       | yes (dimmed)     |
| Database re-checked  | Stores       | 5     | 5         | "5"           | yes              |

## TC-4.1.4: Relationship type disappears from filter list when total count is 0 in Drill-down

### Preconditions

- Drill-down mode active on node "OrderService"
- Drill-down scope contains only Microservice nodes connected by "Calls" relationships
- Relationship type "Stores" (Microservice→Database) exists in the full model but has no instances
  within the current drill-down scope (in-scope total = 0)
- All entity and relationship types are checked

### Steps

1. Open the filter panel in Drill-down mode
   - "Calls" relationship type is visible: its in-scope total count (relationships of this type
     reachable in scope with all filters enabled) > 0
   - "Stores" relationship type is **not visible**: its in-scope total = 0 (no Database nodes or
     Stores edges exist within the scope regardless of filter state)
2. Toggle "Show all" ON
   - "Stores" appears in the list, dimmed, with a 0 count
3. Toggle "Show all" OFF
   - "Stores" disappears again (total count = 0 in scope)
   - A relationship type is hidden from the filter list if and only if its total count in the
     current scope equals 0

### Test Data

| Relationship type | In-scope total | Visible in list (Show all OFF)? |
| ----------------- | -------------- | ------------------------------- |
| Calls (MS→MS)     | > 0            | yes                             |
| Stores (MS→DB)    | 0              | no (hidden)                     |

## TC-4.1.5: Visibility changes apply to both graph and table

### Preconditions

- Table view is active (Entities tab)
- Graph view is not visible but exists in the same session

### Steps

1. Uncheck an entity type (e.g., "Database") in the filter panel
   - Graph (if switched to) would hide Database nodes
   - Table immediately filters out Database rows; count updates
2. Switch to Graph view
   - Database nodes are already hidden (state persisted)
3. Switch back to Table
   - Database rows remain hidden
   - Filter state is global and synchronized across views
   - Views respect current filter configuration

### Test Data

| Entity type filtered | Table rows affected | Graph nodes affected |
| -------------------- | ------------------- | -------------------- |
| Database             | removed             | hidden               |

## TC-4.1.6: Unchecking relationship does not affect entity visibility

### Preconditions

- Graph shows 5 Microservice nodes and 3 Database nodes
- Relationship "Calls" (8 edges connecting Microservices) is visible

### Steps

1. Uncheck "Calls" relationship type
   - Microservice and Database nodes remain visible; only Calls edges disappear
2. Verify counts
   - Node counts unchanged; relationship count becomes 0
   - Entity and relationship filters are independent

### Test Data

| Filter action            | Nodes visible? | Edges visible? |
| ------------------------ | -------------- | -------------- |
| Uncheck Calls (rel type) | yes (8)        | no (0 Calls)   |
