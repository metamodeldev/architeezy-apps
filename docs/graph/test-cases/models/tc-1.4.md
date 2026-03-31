# TC-1.4: Navigation

**System Requirement**: [SR-1.4](../../system-requirements/models.md#sr-14-navigation)

## TC-1.4.1: Model switch adds new history entry

### Preconditions

- Model `e-commerce` is currently loaded in the app
- Browser history is at some position N

### Test Steps

1. Open the model selector and switch to model `hr-system`
   - **Expected**: Model loads; URL updates to include `?model=hr-system` (or equivalent)
2. Open browser DevTools → Application/History panel (or manually check)
   - **Expected**: A new history entry has been added (URL changed via `pushState`)
3. Click the browser's Back button
   - **Expected**: The app navigates back to the previous state: model `e-commerce` is restored with its previous view settings
4. Click Forward button
   - **Expected**: Navigation forward returns to `hr-system`

### Post-conditions

- Model switching creates navigable history entries
- Back/forward buttons work between model changes

### Test Data

| From model | To model   | History action |
| ---------- | ---------- | -------------- |
| e-commerce | hr-system  | pushState      |

## TC-1.4.2: View mode switch (Graph ↔ Table) adds new history entry

### Preconditions

- Model `e-commerce` is loaded in Graph view mode

### Test Steps

1. Switch to Table view (via UI control)
   - **Expected**: URL updates to reflect new view mode (e.g., `&view=table`); browser history extends with a new entry
2. Click Back button
   - **Expected**: App returns to Graph view mode; model data remains the same
3. Click Forward button
   - **Expected**: Returns to Table view

### Post-conditions

- View mode changes are tracked in history as distinct entries
- Back/forward toggles the view mode

### Test Data

| Initial view | New view | History? |
| -------------| -------- | -------- |
| graph        | table    | pushState |

## TC-1.4.3: Filter changes use replaceState (no history extension)

### Preconditions

- Model `e-commerce` is loaded in Graph view

### Test Steps

1. Apply a filter `type:microservice`
   - **Expected**: URL updates to include `&filter=type:microservice`; history is updated in-place (replaceState), no new entry is added
2. Apply another filter `layer:presentation`
   - **Expected**: URL changes to `&filter=layer:presentation`; still no new history entry, the same history entry is replaced
3. Click Back button
   - **Expected**: The browser navigates to the previous major state (e.g., previous model or view mode) BEFORE the filters were applied, skipping intermediate filter states
   - Alternatively, if no prior major state exists, back may exit the app or go to external page

### Post-conditions

- Filter adjustments do not clutter the navigation history
- Back button skips over filter changes and lands on the last major state change

### Test Data

| Action      | History method | Back behavior                   |
| ------------| -------------- | ------------------------------- |
| Filter A    | replaceState   | skips to previous major change  |
| Filter B    | replaceState   | same                            |

## TC-1.4.4: Rapid navigation clicks resolve only final destination

### Preconditions

- Multiple models loaded quickly via UI or programmatic navigation
- Network requests may be in flight

### Test Steps

1. Rapidly click on model A, then model B, then model C in quick succession (< 300ms between clicks)
   - **Expected**: The app processes navigation requests sequentially or with cancellation; only the final target model (C) is displayed at the end
2. Observe network traffic (in DevTools)
   - **Expected**: Requests for models A and B may be sent but responses are either ignored or aborted when model C is requested; the UI reflects only model C
3. Wait for final load to complete
   - **Expected**: Model C is fully displayed; history contains entries for A, B, C (or optimized, but back navigation should go through B→A)

### Post-conditions

- Rapid clicks don't leave the app in a broken state
- Only the intended final model appears
- Navigation remains responsive

### Test Data

| Clicks sequence | Final displayed model |
| --------------- | --------------------- |
| A → B → C      | C                     |

## TC-1.4.5: Drill-down navigation adds a history entry

### Preconditions

- Model `e-commerce` is loaded in Graph view with some nodes

### Test Steps

1. Click on a node to enter drill-down mode
   - **Expected**: URL updates (e.g., `&drill=node-id`); history entry added (pushState); UI shows drill-down view
2. Click Back button
   - **Expected**: Drill-down mode exits; returns to the previous graph state

### Post-conditions

- Drill-down is part of navigation history
- Back exits drill-down cleanly

### Test Data

| Action   | History method |
| -------- | -------------- |
| Drill in | pushState      |
| Drill out| back/navigate  |

## TC-1.4.6: URL always reflects the current application state

### Preconditions

- Model `e-commerce` with filter `type:microservice` in graph view

### Test Steps

1. Update the filter to `layer:presentation` via UI
   - **Expected**: URL query parameter `filter` changes to `layer:presentation`
2. Switch to Table view via UI
   - **Expected**: URL parameter `view` changes to `table`
3. Manually edit the URL parameters in the address bar (e.g., change `view=table` to `view=graph` and press Enter)
   - **Expected**: The app reads the URL and updates the view mode to Graph without requiring UI interaction
4. Verify UI matches URL
   - **Expected**: Graph view is active; the filter remains `layer:presentation`

### Post-conditions

- The URL is the single source of truth for state
- Manual URL edits can control the app state

### Test Data

| URL change            | Expected UI change          |
| --------------------- | --------------------------- |
| filter=layer:presentation | filter updates         |
| view=table            | switches to Table           |
| view=graph            | switches to Graph           |

## TC-1.4.7: Back button after filter sequence lands on correct prior state

**Related to**: TC-1.4.3

### Preconditions

- App at state: model `e-commerce`, Graph view, no filters

### Test Steps

1. Apply filter `type:microservice` (replaceState)
   - **Expected**: URL updates; history position still at base
2. Apply filter `layer:presentation` (replaceState)
   - **Expected**: URL updates; history position unchanged
3. Apply filter `status:active` (replaceState)
   - **Expected**: URL updates; history position unchanged
4. Click Back button once
   - **Expected**: Navigates to the previous major state (Graph view with no filters), not one of the intermediate filter steps

### Post-conditions

- Filters are transparent to the back button when they use replaceState
- The user's back navigation expectation is preserved (back goes to last intentional destination)

### Test Data

| Filters applied | History depth change | Back result        |
| --------------- | -------------------- | ------------------ |
| 3 times        | none (0 new entries) | previous major state|

## TC-1.4.8: Navigation with model change while filters active

### Preconditions

- Model `A` loaded with active filter `x`
- User switches to model `B`

### Test Steps

1. While filter `x` is active on model `A`, switch to model `B` (pushState)
   - **Expected**: Model `B` loads with either:
     - Its own persisted filter (if view state is namespaced by type) OR
     - No filter (clean state), depending on implementation
   - Filter `x` should NOT carry over if model types differ
2. Click Back button
   - **Expected**: Return to model `A` with filter `x` restored

### Post-conditions

- Model switching isolates view state appropriately (based on namespace rules)
- Back navigation restores the exact previous state

### Test Data

| Model A type | Model B type | Filter on A | Filter on B after switch |
| ------------ | ------------ | ----------- | ------------------------ |
| Type X       | Type X       | x           | x (shared namespace)     |
| Type X       | Type Y       | x           | none (separate)          |
