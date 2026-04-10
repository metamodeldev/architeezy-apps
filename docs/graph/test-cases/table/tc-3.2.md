# TC-3.2: Tabular display

**System Requirement**: [SR-3.2](../../system-requirements/table.md#sr-32-tabular-display)

## TC-3.2.1: Entities tab shows entity list with default columns

### Preconditions

- Table view active
- "Entities" tab is selected (default)

### Steps

1. Observe the table header
   - Columns displayed (at minimum):
     - Name
     - Type
     - Additional properties (depending on configuration, e.g., Status, Owner, Layer)
   - Column headers have sorting arrows (clickable)
2. Observe table rows
   - Each row represents an entity that matches current global filters and drill-down scope
   - Cells show entity data: name, type, etc.
   - Entities tab displays entity data correctly

### Test Data

| Columns shown (default) | Filtered entities |
| ----------------------- | ----------------- |
| Name, Type, ...         | current scope     |

## TC-3.2.2: Relationships tab shows relationship list

### Preconditions

- Table view active
- "Entities" tab is currently selected

### Steps

1. Click on "Relationships" tab
   - Table content switches to show relationships
   - Columns displayed:
     - Source (entity name or ID)
     - Type (relationship type)
     - Target (entity name or ID)
     - Name (relationship name, if any)
2. Verify rows
   - Each row represents a relationship whose both endpoints are visible according to current
     filters and drill-down scope
   - Relationships tab active
   - Relationship data displayed

### Test Data

| Columns (Relationships)    |
| -------------------------- |
| Source, Type, Target, Name |

## TC-3.2.3: Default tab is Entities on first switch from Graph

### Preconditions

- Graph view active
- User has never switched to Table in this session (or session reset)

### Steps

1. Switch from Graph to Table (first time in session)
   - "Entities" tab is automatically selected
2. Switch to Graph, then back to Table again (subsequent)
   - Last active tab may be remembered (Entities or Relationships), depending on persistence. The
     first-switch default is Entities.
   - Entities is default on initial view switch

### Test Data

| Scenario                         | Initial Table tab |
| -------------------------------- | ----------------- |
| First time from Graph in session | Entities          |

## TC-3.2.4: Empty table state (no entities)

### Preconditions

- Global filters hide all entities (or drill-down scope is empty)
- Table view active, Entities tab

### Steps

1. Observe the table
   - Message "No data available" or similar is displayed
   - Table body is empty (no rows)
   - User is informed that there is no data

### Test Data

| Filter condition  | Expected table state |
| ----------------- | -------------------- |
| hide all entities | empty message        |

## TC-3.2.5: Empty relationships state

### Preconditions

- No relationships match current filters/scope
- Table view active, Relationships tab

### Steps

1. Observe the table
   - "No data available" message; empty rows
   - Empty state for relationships clear

### Test Data

| Condition                | Expected |
| ------------------------ | -------- |
| no relationships visible | empty    |

## TC-3.2.6: Table respects global filters

### Preconditions

- Global filter: only entities of type `Microservice` are visible
- There are 100 total entities, but only 25 are Microservices

### Steps

1. Switch to Table view (Entities tab)
   - Table shows exactly 25 rows (only Microservices)
2. Switch to Relationships tab
   - Only relationships where both source and target are Microservices are shown
   - Filter-driven visibility respected in table

### Test Data

| Filter: type=Microservice | Expected entity rows | Expected relationships               |
| ------------------------- | -------------------- | ------------------------------------ |
|                           | 25                   | only Microservice→Microservice edges |

## TC-3.2.7: Table respects drill-down scope

### Preconditions

- Drill-down mode active on node OrderService
- Drill-down scope includes: OrderService, PaymentService, Database (3 nodes)
- Relationships: Calls(Order→Payment), DependsOn(Order→Database)

### Steps

1. Go to Table view, Entities tab
   - Only the 3 drill-down scope entities are visible
2. Relationships tab
   - Only relationships where both endpoints are in scope (the 2 mentioned)
   - Drill-down scope enforced in table

### Test Data

| Drill-down scope | Entities visible | Relationships visible           |
| ---------------- | ---------------- | ------------------------------- |
| 3 nodes          | 3 rows           | 2 rows (endpoint both in scope) |

## TC-3.2.9: Entity table columns are derived from model metadata

### Preconditions

- Table view active, Entities tab
- Model A contains entity types with properties: `name`, `type`, `description`, `url`
- Model B contains entity types with properties: `name`, `type`, `title`, `version`

### Steps

1. Load model A and switch to Table view → Entities tab
   - Columns displayed: Name, Type, Description, URL
   - No columns appear that are absent from model A's metadata
2. Switch to model B
   - Columns update to: Name, Type, Title, Version
   - The column set reflects model B's metadata, not model A's
3. Load a model that has no additional properties (only `name` and `type`)
   - Table shows only Name and Type columns
   - Columns are always derived from the active model's metadata

### Test Data

| Model properties             | Expected columns             |
| ---------------------------- | ---------------------------- |
| name, type, description, url | Name, Type, Description, URL |
| name, type, title, version   | Name, Type, Title, Version   |
| name, type                   | Name, Type                   |

## TC-3.2.8: Switching tabs (Entities ↔ Relationships) does not refetch data

### Preconditions

- Model data already loaded in memory

### Steps

1. In Table view, Entities tab is active
2. Click Relationships tab
   - Relationships data appears immediately (from in-memory relationships list)
   - No network loading spinner
3. Switch back to Entities
   - Data immediate
   - Tabs share same cached model data

### Test Data

| Precondition   | Tab switch               | API call? |
| -------------- | ------------------------ | --------- |
| data in memory | Entities → Relationships | no        |
