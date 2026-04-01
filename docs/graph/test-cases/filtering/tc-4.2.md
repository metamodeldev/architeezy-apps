# TC-4.2: Bulk actions

**System Requirement**: [SR-4.2](../../system-requirements/filtering.md#sr-42-bulk-actions)

## TC-4.2.1: "Uncheck all" in Entities hides all entity types

### Preconditions

- Filter panel open
- Entities list shows multiple entity types, all checked:
  - Microservice (✓, count: 50)
  - Database (✓, count: 30)
  - Queue (✓, count: 20)
  - API (✓, count: 15)

### Steps

1. Click "Uncheck all" button in the Entities section
   - All entity checkboxes become unchecked
   - Graph view becomes empty (or shows only drill-down root if in drill-down mode)
   - All relationships disappear because their endpoints are hidden (available counts drop to 0)
   - Relationship type list updates: counts show 0/Total; some relationships may become dimmed or
     disappear based on their checked state
   - No entities are visible
   - Relationships are all hidden due to lack of endpoints
   - "Uncheck all" state is reflected in UI and URL (if applicable)

### Test Data

| Entity types (before) | After "Uncheck all" |
| --------------------- | ------------------- |
| All checked           | all unchecked       |

## TC-4.2.2: "Check all" in Entities restores all entity types

### Preconditions

- All entity types are unchecked (TC-4.2.1 state)

### Steps

1. Click "Check all" in the Entities section
   - All entity checkboxes become checked
   - All entities reappear on the graph
   - Relationships reappear as their endpoints become visible
   - Relationship available counts restore to match visible endpoints
2. Verify visibility
   - Graph shows all entities and relationships according to relationship type filters (if any)
   - All entities visible again
   - Filter state returns to "all checked"

### Test Data

| Action    | Entity checkboxes | Graph content                                |
| --------- | ----------------- | -------------------------------------------- |
| Check all | all checked       | full model (subject to relationship filters) |

## TC-4.2.3: "Check all" in Relationships shows all relationship types

### Preconditions

- Some relationship types are unchecked (e.g., only "Calls" is checked)
- Graph shows only Calls edges

### Steps

1. Click "Check all" in the Relationships section
   - All relationship checkboxes become checked
   - All relationship types become visible on the graph (provided their entity endpoints are
     visible)
2. Verify graph
   - All edges appear, not just Calls
   - All relationships visible (if entities are visible)

### Test Data

| Relationships before | After "Check all" |
| -------------------- | ----------------- |
| Calls only (✓)       | All checked       |

## TC-4.2.4: Bulk actions do not clear search field

### Preconditions

- Filter panel open
- Search field within the Entities list contains query: "micro"
- The list is filtered to show only matching entity types (e.g., "Microservice")

### Steps

1. Click "Uncheck all" in Entities
   - All checkboxes (including those not visible in search) become unchecked
   - Search field still shows "micro" (text not cleared)
   - List remains filtered to show only matching types
2. Clear search manually
   - Full list reappears with all types unchecked
   - Search state preserved during bulk actions

### Test Data

| Search query | Bulk action | Search cleared? |
| ------------ | ----------- | --------------- |
| "micro"      | Uncheck all | no              |
| "micro"      | Check all   | no              |

## TC-4.2.5: Bulk action on Relationships with mixed visibility

### Preconditions

- Entity filters: all entities are visible (checked)
- Relationship filters: only "Calls" and "DependsOn" are checked; others unchecked (hidden)
- Some unchecked relationship types have 0 available count (hidden from list); others are dimmed

### Steps

1. Click "Check all" in Relationships
   - ALL relationship types become checked
   - Previously hidden types (with 0 count) reappear in the list if they now have >0 available
     endpoints
   - All edges become visible on the graph
2. Click "Uncheck all" in Relationships
   - All relationship checkboxes become unchecked
   - All edges disappear; nodes remain (if entities still checked)
   - Bulk actions affect all relationship types regardless of current visibility in the list

### Test Data

| Initial state  | After "Check all" relationships | After "Uncheck all" relationships |
| -------------- | ------------------------------- | --------------------------------- |
| Some unchecked | all checked                     | all unchecked                     |

## TC-4.2.6: Bulk actions affect all relationship types regardless of current visibility

### Preconditions

- All entity types are unchecked (entities section is "uncheck all" state)
- All relationship types have count 0/Total and are hidden from the list (if unchecked) or dimmed
  (if checked)

### Steps

1. Open filter panel and note Relationships list
   - No relationship types are visible (all hidden because count=0 and unchecked) OR only previously
     checked ones are visible but dimmed
2. Click "Check all" in Relationships
   - All relationship types become checked (including those that were hidden)
   - Hidden relationship types with count=0 become visible in the list, dimmed with count 0/Total
   - Even though all relationships are now checked, no edges appear on the graph (because no
     entities are visible)
3. Observe "Uncheck all" in Relationships
   - All relationship types become unchecked
   - Those with count=0 may become hidden again (if no other reason to stay visible)
   - Bulk actions apply to all relationship types, regardless of whether they have available
     endpoints

### Test Data

| Entity state     | Relationship list visibility | "Check all" behavior                     |
| ---------------- | ---------------------------- | ---------------------------------------- |
| all unchecked    | all hidden or dimmed only    | checks all types (including hidden ones) |
| some/all checked | some visible with count >0   | checks all types                         |
