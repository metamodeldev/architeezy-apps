# TC-4.3: Dynamic filter management

**System Requirement**: [SR-4.3](../../system-requirements/filtering.md#sr-43-dynamic-filter-management)

## TC-4.3.1: Type disappears from filter list when count=0 AND unchecked

### Preconditions

- Model contains entity types: `Microservice`, `Database`, `Queue`
- Initially all checked and visible
- Relationship type `Connects` depends on `Database` and `Queue` both being present

### Test Steps

1. Uncheck `Database` entity type
   - **Expected**: All Database nodes disappear
   - `Connects` relationship available count drops to 0 (because one endpoint vanished)
   - If `Connects` was **unchecked**, it disappears from the Relationships list entirely
   - If `Connects` was **checked**, it stays in the list but becomes dimmed with "0 / Total"
2. Uncheck `Queue` as well (now both `Database` and `Queue` are unchecked)
   - **Expected**: `Connects` remains dimmed or hidden (still count 0)

### Post-conditions

- Types with 0 available count AND unchecked → hidden from list
- Types with 0 available count AND checked → dimmed but remain visible in list

### Test Data

| Entity filter | Relationship type `Connects` checked? | `Connects` available count | `Connects` visibility in list |
| ------------- | ------------------------------------- | -------------------------- | ----------------------------- |
| Database unchecked | yes                               | 0                          | dimmed (visible)              |
| Database unchecked | no                                | 0                          | hidden (disappears)           |

## TC-4.3.2: Type remains in list (dimmed) when checked but count=0

### Preconditions

- Entity type `LegacySystem` is checked
- Relationship type `DependsOn` requires `LegacySystem` and `Microservice`
- Currently, no `LegacySystem` nodes are in the visible scope (e.g., filtered out by a previous filter or drill-down)

### Test Steps

1. Observe `LegacySystem` in the Entities filter list
   - **Expected**: Checkbox is checked; count shows "0 / 5" (0 available out of 5 total)
   - The row is dimmed (grayed out), indicating no visible instances
2. The graph shows no LegacySystem nodes (because 0 available)
   - **Expected**: The type is pinned in the list because it's checked
3. Clear filters to make all entities visible
   - **Expected**: `LegacySystem` nodes appear; count updates to "5 / 5" and row becomes normal (not dimmed)

### Post-conditions

- Checked types with 0 count remain visible (pinned) to preserve user intent

### Test Data

| Entity type   | Checked? | Available count | Visibility in list |
| ------------- | -------- | --------------- | ------------------ |
| LegacySystem  | ✓        | 0               | dimmed but visible |
| Microservice  | ✓        | 50              | normal             |

## TC-4.3.3: Drill-down scope hides types not present in scope

### Preconditions

- Full model contains entity types: `Microservice`, `Database`, `Queue`, `ExternalAPI`
- Drill-down mode is NOT active (full model visible)

### Test Steps

1. Enter drill-down on a node that has only `Microservice` and `Queue` in its neighborhood (no Database, no ExternalAPI)
   - **Expected**: Graph clears; only root + Microservice + Queue nodes visible
2. Open filter panel
   - **Expected**: Entities list shows:
     - `Microservice` and `Queue`: normal visibility, counts > 0
     - `Database` and `ExternalAPI`: if unchecked → hidden from list; if checked → dimmed with count 0/Total
3. Observe relationship filters
   - **Expected**: Only relationship types that have both endpoints within the drill-down scope have >0 available count; others are dimmed or hidden

### Post-conditions

- Filter list reflects current drill-down scope
- Hidden types are those with 0 count AND unchecked

### Test Data

| Drill-down scope visible types | Unchecked types with count=0 | Visibility in filter list |
| ----------------------------- | --------------------------- | ------------------------- |
| Microservice, Queue           | Database, ExternalAPI      | hidden (if unchecked)     |

## TC-4.3.4: Enabling a dimmed type (checked with 0 count) pins it

### Preconditions

- Drill-down mode active on a node with only Microservice and Queue
- `Database` entity type is unchecked and hidden from the list (count=0)

### Test Steps

1. Search in the Entities filter list: type "Database"
   - **Expected**: `Database` appears in search results (even though count=0)
2. Check the checkbox next to `Database`
   - **Expected**: `Database` becomes checked
   - Row becomes dimmed (still count=0) but now **stays visible** even when search is cleared
   - The checkbox is pinned in the "on" position
3. Clear the search field
   - **Expected**: `Database` remains in the list (pinned) because it's checked, despite 0 count
4. Exit drill-down (return to full model)
   - **Expected**: `Database` count updates to >0; row becomes normal visibility; checkbox remains checked

### Post-conditions

- User can "pin" hidden types by checking them
- Pinned types stay visible across search clear and scope changes (until unchecked)

### Test Data

| Action                         | Database checked? | Visible in list after action? |
| ------------------------------ | ----------------- | ----------------------------- |
| Hidden (unchecked, count=0)    | ✗                 | hidden (unless searched)      |
| Search → check                 | ✓                 | pinned (visible)              |
| Clear search                   | ✓                 | still visible (pinned)        |
| Exit drill-down (count >0)     | ✓                 | normal visible               |

## TC-4.3.5: Checked relationship remains when dependent entity is unchecked

### Preconditions

- Entity filters: `Microservice` and `Database` both checked
- Relationship `Connects` (requires Microservice and Database) is checked and visible with count >0

### Test Steps

1. Uncheck `Database` entity type
   - **Expected**: `Connects` available count drops to 0
   - Because `Connects` was **checked**, it remains in the Relationships list but becomes dimmed
2. Verify graph
   - **Expected**: `Connects` edges disappear (no visible endpoints)
3. Re-check `Database`
   - **Expected**: `Connects` count restores; edges reappear; checkbox remains checked

### Post-conditions

- Checked relationships are not automatically unchecked when their count drops; they become dimmed but persisted

### Test Data

| Entity filter | Relationship `Connects` | Count | Dimmed? |
| ------------- | ----------------------- | ----- | ------- |
| Database ✓    | checked                | >0    | no      |
| Database ✗    | checked                | 0     | yes     |

## TC-4.3.6: Unchecked relationship disappears when count drops to 0

### Preconditions

- Entity filters: all entities checked
- Relationship `Uses` is unchecked (hidden)
- Count is currently >0 (visible in list as unchecked)

### Test Steps

1. Uncheck an entity type that `Uses` depends on (e.g., `ExternalAPI`)
   - **Expected**: `Uses` available count drops to 0
   - Because `Uses` was **unchecked**, it disappears from the Relationships list entirely
2. Search for `Uses` in the filter list
   - **Expected**: `Uses` appears in search results (hidden types are discoverable via search)
   - Checkbox is unchecked; count shows 0/Total; row is dimmed
3. Re-check `ExternalAPI` entity
   - **Expected**: `Uses` count becomes >0; checkbox remains unchecked; row reappears in the list (no longer hidden)

### Post-conditions

- Unchecked relationships with count=0 are hidden but searchable

### Test Data

| Entity filter | Relationship `Uses` checked? | Count | In list? |
| ------------- | ---------------------------- | ----- | -------- |
| ExternalAPI ✓ | ✗                           | >0    | yes (unchecked) |
| ExternalAPI ✗ | ✗                           | 0     | hidden (unless searched) |
| ExternalAPI ✓ | ✗                           | >0    | yes (unchecked) |
