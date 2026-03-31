# TC-4.1: Visibility

**System Requirement**: [SR-4.1](../../system-requirements/filtering.md#sr-41-visibility)

## TC-4.1.1: Toggle entity type visibility

### Preconditions

- Graph view active
- Filter panel is accessible
- Model contains entity types: `Microservice`, `Database`, `Queue`, `ExternalAPI`
- All entity types are currently checked (visible)

### Test Steps

1. Open the filtering panel
   - **Expected**: Two lists appear: "Entities" and "Relationships"; each type has a checkbox and an "Available / Total" count
2. Uncheck the "Database" entity type
   - **Expected**: All Database nodes disappear from the graph; edges connected to them also disappear (or become dangling/hidden according to rules)
   - The "Available" count for relationship types that depend on Database decreases accordingly
3. Re-check "Database"
   - **Expected**: Database nodes reappear; related relationships restore

### Post-conditions

- Entity type visibility toggles correctly
- Graph updates in real-time

### Test Data

| Entity types  | Initial visible | After uncheck Database |
| ------------- | --------------- | ---------------------- |
| Microservice  | ✓              | ✓                     |
| Database      | ✓              | ✗                     |
| Queue         | ✓              | ✓                     |
| ExternalAPI   | ✓              | ✓                     |

## TC-4.1.2: Toggle relationship type visibility

### Preconditions

- Graph view active
- Filter panel open
- Relationship types: `Calls`, `DependsOn`, `Produces`, `Triggers`

### Test Steps

1. Uncheck "DependsOn" relationship type
   - **Expected**: All DependsOn edges disappear from the graph
   - Nodes remain visible (unless they were also filtered by entity type)
2. Re-check "DependsOn"
   - **Expected**: DependsOn edges reappear

### Post-conditions

- Relationship visibility toggles correctly
- Node visibility unaffected by relationship filters alone

### Test Data

| Relationship type | Action    | Visual result           |
| ----------------- | --------- | ----------------------- |
| DependsOn         | unchecked | edges hidden, nodes keep|

## TC-4.1.3: "Available" count updates dynamically

### Preconditions

- Graph shows entities: 5 Microservices, 3 Databases
- Relationship "Calls" connects Microservice→Microservice (8 edges)
- Relationship "Stores" connects Microservice→Database (5 edges)
- All entity and relationship types are checked

### Test Steps

1. Note the "Available" counts for relationship types:
   - "Calls" shows 8 (total and available same if all endpoints visible)
   - "Stores" shows 5
2. Uncheck "Database" entity type
   - **Expected**: "Stores" available count drops to 0 (because Database endpoint is hidden)
   - "Calls" count remains 8 (endpoints still visible)
3. Note the UI behavior for relationship types with 0 available count
   - **Expected**:
     - If "Stores" was unchecked, it disappears from the list
     - If "Stores" was checked, it remains visible but becomes dimmed (grayed out) with count 0/5

### Post-conditions

- Available counts reflect current visible endpoints
- Dynamic hiding/dimming based on counts

### Test Data

| Filter action             | Relationship | Total | Available | Visibility in list |
| ------------------------- | ------------ | ----- | --------- | ------------------ |
| All entities visible      | Calls        | 8     | 8         | visible            |
|                           | Stores       | 5     | 5         | visible            |
| Database unchecked (endpoint hidden) | Stores | 5     | 0         | dimmed or hidden  |

## TC-4.1.4: Relationship checkboxes disabled when all endpoints hidden

### Preconditions

- All entity types are unchecked (completely filtered out)
- This means no nodes are visible

### Test Steps

1. Observe the "Relationships" filter list
   - **Expected**: All relationship types show count 0/Total
   - Checkboxes are either disabled or the entire list is dimmed/grayed out
   - User cannot check relationships because there are no visible endpoints

### Post-conditions

- UI reflects the dependency: no entities = relationships meaningless

### Test Data

| Entity visibility | Relationship checkboxes enabled? |
| ----------------- | -------------------------------- |
| none              | no (disabled)                   |

## TC-4.1.5: Visibility changes apply to both graph and table

### Preconditions

- Table view is active (Entities tab)
- Graph view is not visible but exists in the same session

### Test Steps

1. Uncheck an entity type (e.g., "Database") in the filter panel
   - **Expected**: Graph (if switched to) would hide Database nodes
   - Table immediately filters out Database rows; count updates
2. Switch to Graph view
   - **Expected**: Database nodes are already hidden (state persisted)
3. Switch back to Table
   - **Expected**: Database rows remain hidden

### Post-conditions

- Filter state is global and synchronized across views
- Views respect current filter configuration

### Test Data

| Entity type filtered | Table rows affected | Graph nodes affected |
| -------------------- | ------------------- | -------------------- |
| Database             | removed            | hidden              |

## TC-4.1.6: Unchecking relationship does not affect entity visibility

### Preconditions

- Graph shows 5 Microservice nodes and 3 Database nodes
- Relationship "Calls" (8 edges connecting Microservices) is visible

### Test Steps

1. Uncheck "Calls" relationship type
   - **Expected**: Microservice and Database nodes remain visible; only Calls edges disappear
2. Verify counts
   - **Expected**: Node counts unchanged; relationship count becomes 0

### Post-conditions

- Entity and relationship filters are independent

### Test Data

| Filter action           | Nodes visible? | Edges visible? |
| ----------------------- | -------------- | -------------- |
| Uncheck Calls (rel type)| yes (8)       | no (0 Calls)   |
