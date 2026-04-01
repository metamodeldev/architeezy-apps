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
   - Two lists appear: "Entities" and "Relationships"; each type has a checkbox and an "Available /
     Total" count
2. Uncheck the "Database" entity type
   - All Database nodes disappear from the graph; edges connected to them also disappear (or become
     dangling/hidden according to rules)
   - The "Available" count for relationship types that depend on Database decreases accordingly
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

## TC-4.1.2: Toggle relationship type visibility

### Preconditions

- Graph view active
- Filter panel open
- Relationship types: `Calls`, `DependsOn`, `Produces`, `Triggers`

### Steps

1. Uncheck "DependsOn" relationship type
   - All DependsOn edges disappear from the graph
   - Nodes remain visible (unless they were also filtered by entity type)
2. Re-check "DependsOn"
   - DependsOn edges reappear
   - Relationship visibility toggles correctly
   - Node visibility unaffected by relationship filters alone

### Test Data

| Relationship type | Action    | Visual result            |
| ----------------- | --------- | ------------------------ |
| DependsOn         | unchecked | edges hidden, nodes keep |

## TC-4.1.3: "Available" count updates dynamically

### Preconditions

- Graph shows entities: 5 Microservices, 3 Databases
- Relationship "Calls" connects Microservice→Microservice (8 edges)
- Relationship "Stores" connects Microservice→Database (5 edges)
- All entity and relationship types are checked

### Steps

1. Note the "Available" counts for relationship types:
   - "Calls" shows 8 (total and available same if all endpoints visible)
   - "Stores" shows 5
2. Uncheck "Database" entity type
   - "Stores" available count drops to 0 (because Database endpoint is hidden)
   - "Calls" count remains 8 (endpoints still visible)
3. Note the UI behavior for relationship types with 0 available count
   - If "Stores" was unchecked, it disappears from the list
   - If "Stores" was checked, it remains visible but becomes dimmed (grayed out) with count 0/5
   - Available counts reflect current visible endpoints
   - Dynamic hiding/dimming based on counts

### Test Data

| Filter action                        | Relationship | Total | Available | Visibility in list |
| ------------------------------------ | ------------ | ----- | --------- | ------------------ |
| All entities visible                 | Calls        | 8     | 8         | visible            |
|                                      | Stores       | 5     | 5         | visible            |
| Database unchecked (endpoint hidden) | Stores       | 5     | 0         | dimmed or hidden   |

## TC-4.1.4: Relationship types hidden or dimmed when count is 0

### Preconditions

- All entity types are unchecked (completely filtered out)
- This means no nodes are visible

### Steps

1. Observe the "Relationships" filter list
   - All relationship types show count 0/Total
   - Types that were previously checked remain visible but are dimmed (grayed out)
   - Types that were unchecked are hidden from the list entirely
   - User can still find hidden types via search or "Show all" toggle
   - Checkboxes remain interactive; types are hidden based on rule, not disabled

### Test Data

| Entity visibility | Relationship checkboxes state                              |
| ----------------- | ---------------------------------------------------------- |
| none              | hidden (count=0 & unchecked) OR dimmed (count=0 & checked) |

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
