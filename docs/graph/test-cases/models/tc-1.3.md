# TC-1.3: Persistence

**System Requirement**: [SR-1.3](../../system-requirements/models.md#sr-13-persistence)

## TC-1.3.1: Last active session is restored on app reload

### Preconditions

- User has previously loaded a model (`e-commerce`) and applied some filters (`type:microservice`) and view mode (Graph)
- The persistence mechanism saved the model ID and view state to `localStorage`
- Browser is currently open with the app tab

### Test Steps

1. Close the browser tab (or quit the browser entirely)
2. Reopen the browser and navigate to `/graph/` (without any URL parameters)
   - **Expected**: The application reads from `localStorage`, finds the last session, and automatically begins loading the stored model (`e-commerce`)
3. Wait for the data to load
   - **Expected**: The model `e-commerce` appears in the header; the graph view is active with the filter `type:microservice` already applied
4. Verify the filter state
   - **Expected**: An active filter badge or indicator shows "type:microservice"; only matching nodes are visible

### Post-conditions

- The previously active model and its view state (filters, view mode) are restored exactly
- The user can continue work seamlessly

### Test Data

| Storage key               | Value                                         |
| ------------------------- | --------------------------------------------- |
| lastModel                 | e-commerce                                   |
| viewState                 | { mode: "graph", filter: "type:microservice" } |

## TC-1.3.2: Persistence does not restore if localStorage is empty

### Preconditions

- `localStorage` is cleared (no saved model or viewState)
- User opens the app at `/graph/`

### Test Steps

1. Load the application
   - **Expected**: No restoration occurs; the model selection modal opens (as per startup loading priority: URL params → localStorage → manual selector)

### Post-conditions

- The manual selection interface is presented
- No model is loaded

### Test Data

| Storage state | empty/cleared |
| Expected UI   | Select Model modal |

## TC-1.3.3: Model that was previously saved is no longer available

### Preconditions

- `localStorage` contains: `lastModel = "old-model"`
- Model `old-model` has been deleted or the user's access has been revoked (API returns 404 or empty for this model)
- User opens the app at `/graph/`

### Test Steps

1. Application attempts to restore from storage
   - **Expected**: System attempts to fetch `old-model` and receives an error (404 or access denied)
2. Observe the behavior
   - **Expected**: The stored reference to `old-model` is cleared from `localStorage`; the model selection modal opens
3. Try to select a different model
   - **Expected**: The selector works normally; new selection saves correctly

### Post-conditions

- Invalid model reference removed from storage
- User can select an available model
- New selection will be persisted going forward

### Test Data

| Storage model | API response | Expected outcome                    |
| ------------- | ------------ | ----------------------------------- |
| old-model     | 404/401      | clear storage + open selector      |

## TC-1.3.4: Persistence saves state only after successful data fetch

### Preconditions

- Fresh session with empty storage
- User selects a model from the selector (modal closes, fetch starts)

### Test Steps

1. Select a model; before the fetch completes, close the browser tab
   - **Expected**: If the fetch fails or is incomplete, the state (model ID, viewState) is NOT saved to `localStorage`
2. Reopen the app at `/graph/`
   - **Expected**: No restoration occurs because nothing was saved; the selection modal opens

### Post-conditions

- Incomplete/failed fetches leave no persistent state
- Storage is only updated with valid, loaded model data

### Test Data

| Scenario    | Fetch completed? | Storage saved? |
| ----------- | ---------------- | -------------- |
| Success     | yes              | yes            |
| Failure     | no               | no             |

## TC-1.3.5: Persistence is per-browser, not per-user account

### Preconditions

- User is authenticated
- Storage currently has saved state for model `model-A`
- User signs out

### Test Steps

1. While signed out (anonymous), reopen the app
   - **Expected**: If storage still contains the model ID and viewState, restoration will attempt to load it
   - **However**, if the model `model-A` is private and the user is now anonymous, the Access Denied flow occurs (TC-1.2.2)
2. Observe the actual behavior
   - **Expected**: Public models can still be restored from storage even when signed out; private models will trigger access denial because storage is not tied to account session, only to the browser

### Post-conditions

- Storage survives logout (browser-level persistence)
- Access controls are enforced at fetch time based on auth state

### Test Data

| Model type   | Auth state | Can restore from storage? |
| ------------ | ---------- | ------------------------- |
| Public       | signed out | yes (load succeeds)       |
| Private      | signed out | no (access denied)        |

## TC-1.3.6: Multi-tab: "last write wins" persistence policy

### Preconditions

- Two browser tabs (Tab A and Tab B) are open on the app, both initially showing the same model or different models
- Both tabs use the same `localStorage` (same browser profile)

### Test Steps

1. In Tab A, load model `A` with filter `x`
   - **Expected**: Tab A saves `{model: A, viewState: {filter: x}}` to `localStorage`
2. In Tab B, load model `B` with filter `y`
   - **Expected**: Tab B saves `{model: B, viewState: {filter: y}}` to `localStorage`
3. Close both tabs and reopen the app (new tab or refreshed)
   - **Expected**: The state from Tab B is restored because it was the last write; the model `B` with filter `y` loads

### Post-conditions

- The last tab to modify storage determines the persisted state
- Tabs do not synchronize in real-time; each operates independently until storage is written

### Test Data

| Tab | Model | Filter | Saved? |
| ----| ------| -------| ------ |
| A   | A     | x      | yes    |
| B   | B     | y      | yes (last)|
| New tab restore | B | y | expected |

## TC-1.3.7: Persistence does not include transient UI state

### Preconditions

- Model is loaded with filter `type:api` in graph view
- User has zoomed in, panned, and opened a sidebar panel

### Test Steps

1. Refresh the browser or close and reopen the app (with persistence enabled)
   - **Expected**: Model and view state (filters, view mode) are restored, but:
     - Zoom level is reset to default
     - Pan position is reset
     - Sidebar state (open/closed) is reset to default (usually closed)
2. Verify the restored state
   - **Expected**: Only the "View State" (model ID, filters, mode, drill-down) persists; transient UI like zoom/pan/sidebar scroll is not persisted

### Post-conditions

- Non-essential UI state is not saved
- Restoration provides a clean, consistent view

### Test Data

| State type   | Persists? |
| ------------ | --------- |
| Model ID     | yes       |
| Filters      | yes       |
| View mode    | yes       |
| Zoom         | no        |
| Sidebar open | no        |
| Pan offset   | no        |

## TC-1.3.8: View state is namespaced by model type

**Business Rule**: "View settings are namespaced by model type. Filters applied to one model automatically apply to all other models of the same type but do not affect models of a different type."

### Preconditions

- Model `e-commerce` is of type `ApplicationArchitecture`
- Model `hr-system` is also of type `ApplicationArchitecture`
- Model `network-diagram` is of type `NetworkDiagram`

### Test Steps

1. Load `e-commerce`, apply filter `layer:presentation`
   - **Expected**: Filter is applied; view state saved with namespace for `ApplicationArchitecture` type
2. Switch to model `hr-system` (same type)
   - **Expected**: The filter `layer:presentation` automatically applies to `hr-system` because it's the same type (namespace shared)
3. Switch to model `network-diagram` (different type)
   - **Expected**: No filter is applied; the view state for `NetworkDiagram` type is either default or its own stored state
4. Verify persistence behavior
   - **Expected**: Switching back to `e-commerce` or `hr-system` restores the `layer:presentation` filter; `network-diagram` uses its own separate namespace

### Post-conditions

- View settings are correctly namespaced by model type
- Filters do not leak across model type boundaries

### Test Data

| Model        | Type                  | Filter               |
| ------------ | --------------------- | -------------------- |
| e-commerce   | ApplicationArchitecture | layer:presentation |
| hr-system    | ApplicationArchitecture | inherits from above  |
| network-diagram | NetworkDiagram     | separate namespace   |
