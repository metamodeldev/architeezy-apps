# TC-4.5: Filter list discovery

**System Requirement**: [SR-4.5](../../system-requirements/filtering.md#sr-45-filter-list-discovery)

## TC-4.5.1: Search reveals relationship types hidden due to 0 total count in Drill-down

### Preconditions

- Drill-down mode active on a node with only `Microservice` nodes in scope
- Relationship type `Stores` (Microservice→Database) exists in the full model but has no instances
  within the current drill-down scope (in-scope total count = 0); it is hidden from the
  Relationships filter list
- Filter panel "Relationships" section is expanded

### Steps

1. Enter "Stores" into the search field within the Relationships filter list
   - The list updates to show `Stores` even though its total count in scope is 0
   - Row appears dimmed; checkbox shows its current checked state; count shows "0"
2. Clear the search field
   - `Stores` disappears from the list again (total count = 0 in scope; no search active)
   - Hidden types are discoverable via search
   - Search temporarily overrides dynamic hiding

### Test Data

| Hidden type                             | Search query | Appears in list? | Dimmed? |
| --------------------------------------- | ------------ | ---------------- | ------- |
| Stores (in-scope total = 0, Drill-down) | "Stores"     | yes              | yes     |

## TC-4.5.2: "Show all" switch displays every type in the model metadata

### Preconditions

- Filter panel Entities section is open
- Some relationship types are hidden (in Drill-down: in-scope total = 0)

### Steps

1. Observe the search field in the filter section
   - Next to it is a toggle switch labeled "Show all" or "Show hidden"
2. Toggle "Show all" to ON
   - The list expands to show **every** entity or relationship type present in the model metadata,
     regardless of current count or checked state
   - Types with total count 0 appear dimmed; unchecked types are unchecked
3. Toggle "Show all" to OFF
   - List returns to normal dynamic visibility rules (hides types with total count = 0)
   - User can view the complete type catalog
   - "Show all" is a temporary override

### Test Data

| Show all switch | List content                    |
| --------------- | ------------------------------- |
| OFF (default)   | only types with total count > 0 |
| ON              | all types from model metadata   |

## TC-4.5.3: Checking a type with 0 total count enables it but does not pin it in the list

### Preconditions

- Drill-down mode active
- Relationship type `Archives` has no instances in the current scope (total count = 0); it is hidden
  from the Relationships list
- Search is active for "Archives" or "Show all" is ON

### Steps

1. Find `Archives` in the list (dimmed, unchecked, count shows 0)
2. Check the checkbox next to `Archives`
   - Checkbox becomes checked
   - The type is now enabled: when scope changes to include Archives edges, they will appear on the
     canvas
   - Row remains visible only because search/Show all is still active; total count remains 0
3. Clear the search field (or turn OFF "Show all")
   - `Archives` disappears from the list (total count = 0 in scope; no other visibility condition
     active)
   - Checking a type does not pin it in the list
4. Later, if scope changes to include `Archives` edges (total count > 0)
   - `Archives` reappears in the list with its updated count; checkbox remains checked

### Test Data

| Action on Archives (initially unchecked, total = 0 in scope) | Checked? | After search cleared / Show all OFF | In list? |
| ------------------------------------------------------------ | -------- | ----------------------------------- | -------- |
| Check it while visible via search                            | ✓        | no (hidden — total count still 0)   | no       |
| Scope changes to include Archives (total count > 0)          | ✓        | yes (total count > 0)               | yes      |

## TC-4.5.4: A checked type with total count 0 is hidden when no search is active

### Preconditions

- Drill-down mode active
- Relationship type `Archives` was checked via search while its total count in scope was 0
- Search has since been cleared; Show all is OFF
- `Archives` is not visible in the filter list

### Steps

1. Observe the Relationships filter list
   - `Archives` is absent from the list (total count = 0 in scope; no search; Show all off)
   - Being checked does not keep it visible
2. Search for "Archives"
   - Type appears dimmed and checked (total count = 0)
3. Uncheck `Archives`
   - Checkbox becomes unchecked
4. Clear the search field
   - `Archives` is still absent from the list (total count = 0; unchecked; no search)
   - Both checked and unchecked types with total count = 0 are hidden when no search is active

### Test Data

| Archives state       | Search active?   | Show all? | Visible in list? |
| -------------------- | ---------------- | --------- | ---------------- |
| checked, total = 0   | no               | no        | no               |
| checked, total = 0   | yes ("Archives") | no        | yes (dimmed)     |
| unchecked, total = 0 | no               | no        | no               |
| unchecked, total = 0 | yes ("Archives") | no        | yes (dimmed)     |

## TC-4.5.5: Relationship types follow same discovery rules

### Preconditions

- Drill-down mode active
- Some relationship types have total count = 0 in the current scope (hidden from list)
- Relationships filter list is expanded

### Steps

1. Use search within Relationships list for a hidden type ("DependsOn")
   - Hidden type appears dimmed, unchecked, with total count 0
2. Check that type while it's visible
   - Checkbox becomes checked; the type will apply when scope changes to include matching elements
3. Clear search
   - Type disappears from the list (total count = 0; no search active; Show all off)
   - Checking does not pin it in the list
4. Toggle "Show all" ON
   - Type reappears, dimmed and checked with total count 0
   - Discovery and visibility rules work identically for the Relationships section

### Test Data

| Hidden rel type                            | Search → check? | After clear search? | Show all ON? |
| ------------------------------------------ | --------------- | ------------------- | ------------ |
| DependsOn (total = 0 in scope, Drill-down) | check           | hidden (total = 0)  | visible      |

## TC-4.5.6: "Show all" shows all types, including those with total count > 0

### Preconditions

- Normal state: only types with total count > 0 are visible
- Some types are hidden (total count = 0 in scope)
- Some types are normally visible (total count > 0)

### Steps

1. Toggle "Show all" ON
   - Complete list of all entity/relationship types from model metadata appears
   - This includes:
     - Normally visible types (total count > 0)
     - Hidden types (total count = 0) now visible and dimmed
2. Toggle OFF
   - List reverts to normal dynamic visibility (only total count > 0)
   - "Show all" is a superset of the normal list

### Test Data

| Normal list size | Show all list size (should be ≥) |
| ---------------- | -------------------------------- |
| e.g., 8 types    | all N types in model metadata    |
