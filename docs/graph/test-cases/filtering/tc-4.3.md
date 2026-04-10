# TC-4.3: Dynamic filter management

**System Requirement**:
[SR-4.3](../../system-requirements/filtering.md#sr-43-dynamic-filter-management)

## TC-4.3.1: Relationship available count drops to 0 when endpoint entity type is unchecked

### Preconditions

- Full Model (not Drill-down)
- Model contains entity types: `Microservice`, `Database`, `Queue`
- Relationship type `Connects` requires both `Database` and `Queue` as endpoints
- All entity and relationship types are checked; `Connects` shows count > 0

### Steps

1. Uncheck `Database` entity type
   - All Database nodes disappear
   - `Connects` available count drops to 0 (one endpoint is no longer visible)
   - `Connects` total count remains unchanged (total = count in the full model)
   - `Connects` **remains visible** in the Relationships list, showing "0 / total" (dimmed),
     regardless of whether its checkbox is checked or unchecked
2. Uncheck `Queue` as well (now both `Database` and `Queue` are unchecked)
   - `Connects` remains visible (still showing "0 / total"); total count > 0 keeps it in the list

### Test Data

| Entity filter      | Relationship `Connects` checked? | Available count | Total count | Visible in list? |
| ------------------ | -------------------------------- | --------------- | ----------- | ---------------- |
| Database unchecked | yes                              | 0               | > 0         | yes (dimmed)     |
| Database unchecked | no                               | 0               | > 0         | yes (dimmed)     |

## TC-4.3.2: Entity types in Drill-down: visible when in scope (total > 0), hidden when not in scope (total = 0)

### Preconditions

- Drill-down mode active on a root node
- Drill-down scope (at configured depth) contains: `Microservice` (10 nodes), `Database` (3 nodes)
- `LegacySystem` exists in the full model (count = 5) but has no instances within the drill-down
  scope
- All entity and relationship types are checked

### Steps

1. Open the filter panel and observe the Entities list
   - `Microservice`: in-scope total = 10, available = 10; displays "10"
   - `Database`: in-scope total = 3, available = 3; displays "3"
   - `LegacySystem`: **not visible** in the list — its total count in scope = 0 (no instances within
     the drill-down depth, regardless of filter state); the full model count does not influence
     visibility in Drill-down mode
2. Toggle "Show all" ON
   - `LegacySystem` appears in the list, dimmed, showing count "0"
3. Toggle "Show all" OFF
   - `LegacySystem` disappears again (in-scope total remains 0)
4. Uncheck `Microservice` entity type (path to `Database` nodes is now blocked)
   - `Database` available count drops to 0; in-scope total stays 3
   - `Database` **remains visible** in the list, now showing "0 / 3" (dimmed)
   - Contrast: `LegacySystem` (total = 0) is hidden; `Database` (total = 3) stays visible

### Test Data

| Mode                               | Entity type  | Full model total | In-scope total | Available | Visible in list? | Display |
| ---------------------------------- | ------------ | ---------------- | -------------- | --------- | ---------------- | ------- |
| Drill-down, all checked            | Microservice | > 0              | 10             | 10        | yes              | "10"    |
| Drill-down, all checked            | Database     | > 0              | 3              | 3         | yes              | "3"     |
| Drill-down, all checked            | LegacySystem | 5                | 0              | 0         | no (hidden)      | —       |
| Drill-down, Microservice unchecked | Database     | > 0              | 3              | 0         | yes (dimmed)     | "0 / 3" |

## TC-4.3.3: Drill-down scope: entity types stay visible; relationship types with 0 in-scope total are hidden

### Preconditions

- Full model contains entity types: `Microservice`, `Database`, `Queue`, `ExternalAPI`
- Full model contains relationship types: `Calls` (MS→MS), `Stores` (MS→DB)
- Drill-down mode is NOT active (full model visible)

### Steps

1. Enter drill-down on a node that has only `Microservice` nodes in its neighborhood (no Database,
   no ExternalAPI, no Queue)
   - Graph clears; only root + Microservice nodes visible
2. Open filter panel and observe the Entities list
   - `Microservice`: visible, available count > 0
   - `Database`, `ExternalAPI`, `Queue`: **hidden** from the list — their total count in the
     drill-down scope is 0 (no instances within the current scope regardless of filter state)
3. Observe the Relationships list
   - `Calls` (MS→MS): visible, in-scope total > 0
   - `Stores` (MS→DB): **hidden** from the list (in-scope total = 0; no Database nodes in scope, so
     no Stores edges can exist regardless of filter state)

### Test Data

| Type                  | In drill-down scope? | Full model total | In-scope total | Visible in list? | Display        |
| --------------------- | -------------------- | ---------------- | -------------- | ---------------- | -------------- |
| Microservice (entity) | yes                  | > 0              | > 0            | yes              | "A / T" or "A" |
| Database (entity)     | no                   | > 0              | 0              | no (hidden)      | —              |
| Calls (rel)           | yes                  | > 0              | > 0            | yes              | count          |
| Stores (rel)          | no                   | > 0              | 0              | no (hidden)      | —              |

Entity types and relationship types behave identically in Drill-down: both are hidden from the
filter list when their in-scope total count is 0.

## TC-4.3.4: Relationship total count in Drill-down reflects scope count, not full model count

### Preconditions

- Full model contains:
  - 8 `Calls` relationships (Microservice→Microservice)
  - 5 `Stores` relationships (Microservice→Database)
- Drill-down mode activated on "OrderService" (2-hop depth)
- Drill-down scope contains only:
  - 3 `Calls` relationships reachable from OrderService
  - 1 `Stores` relationship reachable from OrderService
- All entity and relationship types are checked

### Steps

1. Open the filter panel in Drill-down mode
   - `Calls` relationship type displays total count **3**, not 8
   - `Stores` relationship type displays total count **1**, not 5
   - Because available equals total, each displays as a single number: `"3"` and `"1"`
2. Verify full model counts are irrelevant
   - The total count shown in Drill-down mode is always the number of relationships reachable within
     the current scope, ignoring filter settings
   - The full model count is not used in this context

### Test Data

| Relationship | Full model count | Drill-down scope count | Total count displayed | Available count |
| ------------ | ---------------- | ---------------------- | --------------------- | --------------- |
| Calls        | 8                | 3                      | 3                     | 3               |
| Stores       | 5                | 1                      | 1                     | 1               |

## TC-4.3.5: Relationship type with available count 0 stays visible regardless of checked state

### Preconditions

- Full Model (not Drill-down)
- Entity filters: `Microservice` and `Database` both checked
- Relationship `Connects` (requires Microservice and Database) is visible with count > 0

### Steps

1. Uncheck `Database` entity type
   - `Connects` available count drops to 0
   - `Connects` total count remains > 0 (total = count in the full model)
   - `Connects` **remains visible** in the Relationships list, showing "0 / total" (dimmed),
     **regardless of whether its checkbox is checked or unchecked**
2. Verify graph
   - `Connects` edges disappear (no visible endpoints)
3. Re-check `Database`
   - `Connects` available count restores; display reverts to single number or "A / T"
   - Checkbox state and graph visibility are restored

### Test Data

| Entity filter | Relationship `Connects` checked? | Available | Total | Count display | Visible in list? |
| ------------- | -------------------------------- | --------- | ----- | ------------- | ---------------- |
| Database ✓    | yes                              | > 0       | > 0   | "A" or "A/T"  | yes              |
| Database ✗    | yes                              | 0         | > 0   | "0 / T"       | yes (dimmed)     |
| Database ✗    | no                               | 0         | > 0   | "0 / T"       | yes (dimmed)     |
| Database ✓    | yes                              | > 0       | > 0   | "A" or "A/T"  | yes (restored)   |

## TC-4.3.6: Unchecking a relationship type in Drill-down does not change entity total counts

### Preconditions

- Drill-down mode active on "OrderService" (2-hop depth)
- Drill-down scope contains:
  - 5 Microservice nodes (in-scope total = 5)
  - 2 Database nodes, reachable **only** through `Stores` edges (in-scope total = 2)
- All entity and relationship types are checked
- `Stores` (Microservice→Database) has 2 edges in scope

### Steps

1. Record initial counts:
   - `Microservice`: total = 5, available = 5; displays `"5"`
   - `Database`: total = 2, available = 2; displays `"2"`
   - `Stores`: total = 2, available = 2; displays `"2"`
2. Uncheck `Stores` relationship type
   - Stores edges disappear from the canvas
   - Database nodes become unreachable (their only path was via Stores edges) and disappear from the
     canvas
   - `Database` total count remains **2** (total count ignores filter settings)
   - `Database` available count drops to **0** (reachability path broken)
   - `Database` row remains visible in the filter list, now showing `"0 / 2"` (dimmed)
   - `Microservice` total = 5 (unchanged), available = 5 (unchanged); displays `"5"`
3. Re-check `Stores` relationship type
   - Stores edges reappear; Database nodes reappear on the canvas
   - All counts restore to initial values

### Expected results

- Unchecking a relationship type does **not** change entity total counts.
- Entity total counts in Drill-down mode always reflect the scope count computed ignoring filter
  settings.
- Only available counts may decrease when a relationship type is disabled.

### Test Data

| Action                      | Entity type  | Total | Available | Display   |
| --------------------------- | ------------ | ----- | --------- | --------- |
| Initial (all checked)       | Microservice | 5     | 5         | `"5"`     |
|                             | Database     | 2     | 2         | `"2"`     |
| Uncheck `Stores` (rel type) | Microservice | 5     | 5         | `"5"`     |
|                             | Database     | 2     | 0         | `"0 / 2"` |
| Re-check `Stores`           | Microservice | 5     | 5         | `"5"`     |
|                             | Database     | 2     | 2         | `"2"`     |

## TC-4.3.7: Unchecking an entity type in Drill-down does not change its own available count

### Preconditions

- Drill-down mode active on a root node
- Scope contains: 2 Microservice nodes, 1 Database node
- The only path to the Database node goes through a Microservice node
- Entity types `Microservice` and `Database` are both checked

### Steps

1. Record the counts:
   - `Microservice`: in-scope total = 2, available = 2; displays `2` (single number, total equals
     available)
   - `Database`: in-scope total = 1, available = 1; displays `1`
2. Uncheck the `Microservice` entity type
   - All Microservice nodes disappear from the graph
   - The available count for `Microservice` in the filter list **remains unchanged** (the type is
     not disabled for its own reachability computation)
   - The `Microservice` row remains visible in the filter list (unchecked, not dimmed, because
     total > 0)
   - Because the only path to `Database` goes through Microservice nodes (now disabled), `Database`
     available count **drops** (the reachability path is broken)
3. Re-check the `Microservice` entity type
   - Microservice nodes reappear
   - `Database` available count restores
   - Counts return to prior values

### Expected results

- Unchecking an entity type does **not** change its own available count.
- Unchecking an entity type **can** change the available count of **other** types whose reachability
  path goes through it (disabled types break BFS traversal).
- Unchecked entity types with total > 0 remain visible in the filter list.

### Test Data

| Action                | Microservice checked? | Microservice avail | Database avail  | Database row visible? |
| --------------------- | --------------------- | ------------------ | --------------- | --------------------- |
| Drill-down entered    | ✓                     | 2                  | 1               | yes                   |
| Uncheck Microservice  | ✗                     | 2 (unchanged)      | 0 (path broken) | yes                   |
| Re-check Microservice | ✓                     | 2                  | 1 (restored)    | yes                   |
