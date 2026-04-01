# TC-4.5: Filter list discovery

**System Requirement**: [SR-4.5](../../system-requirements/filtering.md#sr-45-filter-list-discovery)

## TC-4.5.1: Search reveals hidden types with 0 available count

### Preconditions

- Drill-down mode active on a node with only `Microservice` and `Queue` in scope
- Entity type `Database` is unchecked and hidden from the list (count = 0/Total)
- Filter panel "Entities" section is expanded

### Steps

1. Enter "Database" into the search field within the Entities filter list
   - The list updates to show `Database` even though its count is 0
   - Row appears dimmed; checkbox is unchecked; count shows "0 / X"
2. See "Show all" switch next to search field (if present)
   - Switch may be off by default; search is already showing hidden types
3. Clear the search field
   - `Database` disappears from the list again (unless it gets checked while visible)
   - Hidden types are discoverable via search
   - Search temporarily overrides dynamic hiding

### Test Data

| Hidden type                   | Search query | Appears in list? | Dimmed? |
| ----------------------------- | ------------ | ---------------- | ------- |
| Database (unchecked, count=0) | "Database"   | yes              | yes     |

## TC-4.5.2: "Show all" switch displays every type in the model metadata

### Preconditions

- Filter panel Entities section is collapsed or not showing all types due to dynamic hiding
- Some types are hidden (unchecked + count=0)

### Steps

1. Expand filter panel to Entities section
2. Observe the search field
   - Next to it is a toggle switch labeled "Show all" or "Show hidden"
3. Toggle "Show all" to ON
   - The entity list expands to show **every** entity type present in the model metadata, regardless
     of current count or checked state
   - Types with 0 available count appear dimmed; unchecked types are unchecked
4. Toggle "Show all" to OFF
   - List returns to normal dynamic visibility rules (hides unchecked + count=0)
   - User can view the complete type catalog
   - "Show all" is a temporary override

### Test Data

| Show all switch | List content                            |
| --------------- | --------------------------------------- |
| OFF (default)   | only types with count>0 or checked=true |
| ON              | all types from model metadata           |

## TC-4.5.3: Checking a dimmed type with 0 count pins it to the list

### Preconditions

- Entity type `LegacySystem` is hidden (unchecked, count=0) OR visible but dimmed (checked with
  count=0)
- Search is active for "Legacy" or "Show all" is ON

### Steps

1. Find `LegacySystem` in the list (it may be dimmed)
2. Check the checkbox next to `LegacySystem`
   - Checkbox becomes checked
   - Row becomes "pinned": it will remain visible in the list even after search/Show all is cleared
   - Count remains 0 (dimmed) until scope changes to make it >0
3. Clear the search field (or turn OFF "Show all")
   - `LegacySystem` stays in the list because it's checked (pinned)
4. Later, if scope changes to make `LegacySystem` visible (count >0)
   - Row becomes normal (not dimmed); count updates
   - Checked types are never hidden, even with count=0
   - User can explicitly "pin" types to keep them in view

### Test Data

| Action on LegacySystem (initially unchecked, count=0) | Checked? | After search cleared / Show all OFF | In list? |
| ----------------------------------------------------- | -------- | ----------------------------------- | -------- |
| Check it while visible                                | ✓        | yes (pinned)                        | yes      |

## TC-4.5.4: Unchecking a pinned type allows it to hide again

### Preconditions

- Entity type `LegacySystem` is pinned (checked, count=0, visible in list)
- Search is cleared, Show all is OFF

### Steps

1. Uncheck `LegacySystem`
   - Checkbox becomes unchecked
   - Since count is still 0 and checkbox is now unchecked, the type becomes eligible for dynamic
     hiding
   - `LegacySystem` immediately disappears from the list
2. Search for "Legacy" to bring it back
   - Type appears dimmed and unchecked
   - Can be re-checked to re-pin
   - Unchecking a type with count=0 hides it (unless search is active)

### Test Data

| Pinned type (checked, count=0) | Uncheck? | Result (with search cleared) |
| ------------------------------ | -------- | ---------------------------- |
| LegacySystem                   | yes      | hidden from list             |

## TC-4.5.5: Relationship types follow same discovery rules

### Preconditions

- Some relationship types have count=0 and are unchecked (hidden)
- Relationships filter list is collapsed or hidden types are not visible

### Steps

1. Open Relationships filter section
2. Use search within Relationships list for a hidden type ("DependsOn")
   - Hidden type appears dimmed, unchecked, with count 0/Total
3. Check that type while it's visible
   - It becomes pinned (checked, stays visible after search cleared)
4. Clear search
   - Type remains (pinned)
5. Uncheck it
   - If count still 0, it hides again
   - Discovery and pinning work identically for Relationships section

### Test Data

| Hidden rel type                        | Search → check? | After clear search? | Uncheck → hide?      |
| -------------------------------------- | --------------- | ------------------- | -------------------- |
| DependsOn (hidden, unchecked, count=0) | check           | stays (pinned)      | hides (if unchecked) |

## TC-4.5.6: "Show all" shows all types, including those with count>0

### Preconditions

- Normal state: only types with count>0 or checked=true are visible
- Some types are normally hidden (unchecked + count=0)
- Some types are normally visible (checked or count>0)

### Steps

1. Toggle "Show all" ON
   - Complete list of all entity/relationship types from model metadata appears
   - This includes:
     - Normals (visible already)
     - Hidden (unchecked+count=0) now visible dimmed
2. Toggle OFF
   - List reverts to normal dynamic visibility
   - "Show all" is a superset of normal list

### Test Data

| Normal list size | Show all list size (should be ≥) |
| ---------------- | -------------------------------- |
| e.g., 8 types    | all N types in model metadata    |
