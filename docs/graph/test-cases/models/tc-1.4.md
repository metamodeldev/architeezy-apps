# TC-1.4: Navigation

**System Requirement**: [SR-1.4](../../system-requirements/models.md#sr-14-navigation)

## TC-1.4.1: Model switch adds new history entry

### Preconditions

- Model `e-commerce` is currently loaded in the app
- Browser history is at some position N

### Steps

1. Open the model selector and switch to model `hr-system`
   - Model loads; URL updates to include `?model=hr-system` (or equivalent)
2. Open browser DevTools → Application/History panel (or manually check)
   - A new history entry has been added (URL changed via `pushState`)
3. Click the browser's Back button
   - The app navigates back to the previous state: model `e-commerce` is restored with its previous
     view settings
4. Click Forward button
   - Navigation forward returns to `hr-system`
   - Model switching creates navigable history entries
   - Back/forward buttons work between model changes

### Test Data

| From model | To model  | History action |
| ---------- | --------- | -------------- |
| e-commerce | hr-system | pushState      |

## TC-1.4.2: View mode switch (Graph ↔ Table) adds new history entry

### Preconditions

- Model `e-commerce` is loaded in Graph view mode

### Steps

1. Switch to Table view (via UI control)
   - URL updates to reflect new view mode (e.g., `&view=table`); browser history extends with a new
     entry
2. Click Back button
   - App returns to Graph view mode; model data remains the same
3. Click Forward button
   - Returns to Table view
   - View mode changes are tracked in history as distinct entries
   - Back/forward toggles the view mode

### Test Data

| Initial view | New view | History?  |
| ------------ | -------- | --------- |
| graph        | table    | pushState |

## TC-1.4.3: Filter changes use replaceState (no history extension)

### Preconditions

- Model `e-commerce` is loaded in Graph view

### Steps

1. Apply a filter `Microservice`
   - URL updates to include `&entities=Microservice`; history is updated in-place (replaceState), no
     new entry is added
2. Apply another filter (uncheck previous, check different)
   - URL changes accordingly (e.g., to `&entities=ApplicationService`); still no new history entry,
     the same history entry is replaced
3. Click Back button
   - The browser navigates to the previous major state (e.g., previous model or view mode) BEFORE
     the filters were applied, skipping intermediate filter states
   - Alternatively, if no prior major state exists, back may exit the app or go to external page
   - Filter adjustments do not clutter the navigation history
   - Back button skips over filter changes and lands on the last major state change

### Test Data

| Action   | History method | Back behavior                  |
| -------- | -------------- | ------------------------------ |
| Filter A | replaceState   | skips to previous major change |
| Filter B | replaceState   | same                           |

**Note**: Filters refer to entity type visibility toggles (entities parameter).

## TC-1.4.4: Rapid navigation clicks resolve only final destination

### Preconditions

- Multiple models loaded quickly via UI or programmatic navigation
- Network requests may be in flight

### Steps

1. Rapidly click on model A, then model B, then model C in quick succession (< 300ms between clicks)
   - The app processes navigation requests sequentially or with cancellation; only the final target
     model (C) is displayed at the end
2. Observe network traffic (in DevTools)
   - Requests for models A and B may be sent but responses are either ignored or aborted when model
     C is requested; the UI reflects only model C
3. Wait for final load to complete
   - Model C is fully displayed; history contains entries for A, B, C (or optimized, but back
     navigation should go through B→A)
   - Rapid clicks don't leave the app in a broken state
   - Only the intended final model appears
   - Navigation remains responsive

### Test Data

| Clicks sequence | Final displayed model |
| --------------- | --------------------- |
| A → B → C       | C                     |

## TC-1.4.5: Drill-down navigation adds a history entry; Back and Forward work correctly

### Preconditions

- Model `e-commerce` is loaded in Graph view with some nodes

### Steps

1. Double-click on a node (e.g., `OrderService`) to enter drill-down mode
   - URL updates (e.g., `&entity=order-id&depth=1`); history entry added (pushState); UI shows
     drill-down view with the navigation bar
2. Click the browser's Back button
   - Drill-down mode exits; returns to the previous graph state (full model)
   - Drill-down navigation bar disappears; full model is restored
3. Immediately after step 2, click the browser's Forward button
   - The application navigates forward to the drill-down state
   - Drill-down mode re-activates with the same root entity and depth as before
   - Navigation bar reappears showing the same root and depth
   - URL restores the drill-down parameters
   - Back exits drill-down cleanly
   - Forward returns to drill-down state; it does not disappear after becoming available

### Test Data

| Action           | History method | Expected UI state             |
| ---------------- | -------------- | ----------------------------- |
| Enter drill-down | pushState      | drill-down active             |
| Click Back       | popState       | full model view               |
| Click Forward    | popState       | drill-down active (same root) |

## TC-1.4.6: URL always reflects the current application state

### Preconditions

- Model `e-commerce` with filter `type:microservice` in graph view

### Steps

1. Update the filter to show only specific entity types (e.g., uncheck some, leave others)
   - URL query parameter `entities` updates accordingly
2. Switch to Table view via UI
   - URL parameter `view` changes to `table`
3. Manually edit the URL parameters in the address bar (e.g., change `view=table` to `view=graph`
   and press Enter)
   - The app reads the URL and updates the view mode to Graph without requiring UI interaction
4. Verify UI matches URL
   - Graph view is active; the filter remains `layer:presentation`
   - The URL is the single source of truth for state
   - Manual URL edits can control the app state

### Test Data

| URL change                             | Expected UI change                         |
| -------------------------------------- | ------------------------------------------ |
| entities=ApplicationComponent          | only ApplicationComponent entities visible |
| entities=ApplicationService,DataObject | only those entity types visible            |
| view=table                             | switches to Table                          |
| view=graph                             | switches to Graph                          |

## TC-1.4.7: Back button after filter sequence lands on correct prior state

**Related to**: TC-1.4.3

### Preconditions

- App at state: model `e-commerce`, Graph view, no filters

### Steps

1. Apply filter (uncheck all except ApplicationComponent) (replaceState)
   - URL updates to `&entities=ApplicationComponent`; history position still at base
2. Apply different filter (uncheck ApplicationComponent, check ApplicationService) (replaceState)
   - URL updates to `&entities=ApplicationService`; history position unchanged
3. Apply another different filter (uncheck ApplicationService, check Database) (replaceState)
   - URL updates to `&entities=Database`; history position unchanged
4. Click Back button once
   - Navigates to the previous major state (Graph view with no filters), not one of the intermediate
     filter steps
   - Filters are transparent to the back button when they use replaceState
   - The user's back navigation expectation is preserved (back goes to last intentional destination)

### Test Data

| Filter changes (entities) | History depth change | Back result          |
| ------------------------- | -------------------- | -------------------- |
| 3 times                   | none (0 new entries) | previous major state |

## TC-1.4.8: Navigation with model change while filters active

### Preconditions

- Model `A` loaded with active entities filter (e.g., `entities=ApplicationComponent`)
- User switches to model `B`

### Steps

1. While entities filter is active on model `A`, switch to model `B` (pushState)
   - Model `B` loads with either:
     - Its own persisted filter (if view state is namespaced by model type) OR
     - No filter (clean state), depending on implementation
   - Entities filter from model `A` should NOT carry over if model types differ
2. Click Back button
   - Return to model `A` with filter `x` restored
   - Model switching isolates view state appropriately (based on namespace rules)
   - Back navigation restores the exact previous state

### Test Data

| Model A type | Model B type | Entities filter on A | Entities filter on B after switch |
| ------------ | ------------ | -------------------- | --------------------------------- |
| Type X       | Type X       | specific types       | same (shared namespace)           |
| Type X       | Type Y       | specific types       | none (separate)                   |
