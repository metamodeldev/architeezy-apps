# SR-1: Model Management

**Functional Requirements**:
[FR-1.1, FR-1.2, FR-1.3](../functional-requirements.md#fr-1-model-management)

## User Stories

- As a user, I want to load any model from the Architeezy repository so I can explore it in
  Architeezy Graph.
- As a user, I want to open a shared link that directly loads a specific model with pre-applied
  filters.
- As a user, I want Architeezy Graph to remember my last-viewed model across sessions.

## Acceptance Criteria

- [SR-1.1](#sr-11-a-model-selector-interface-allows-browsing-and-selecting-from-available-models): A
  model selector interface allows browsing and selecting from available models
- [SR-1.2](#sr-12-model-selector-displays-model-information): Model selector displays model
  information
- [SR-1.3](#sr-13-search-can-filter-the-model-list): Search can filter the model list
- [SR-1.4](#sr-14-loading-indicators-appear-during-fetch-operations): Loading indicators appear
  during fetch operations
- [SR-1.5](#sr-15-deep-links-load-specified-model-with-url-parameters-for-view-mode-filters-and-drill-state):
  Deep links load specified model with URL parameters for view mode, filters, and drill state
- [SR-1.6](#sr-16-url-state-is-preserved-during-browser-navigation): URL state is preserved during
  browser navigation
- [SR-1.7](#sr-17-invalid-deep-links-fall-back-to-model-selection): Invalid deep links fall back to
  model selection
- [SR-1.8](#sr-18-last-viewed-model-and-filter-state-persist-across-sessions): Last-viewed model and
  filter state persist across sessions
- [SR-1.9](#sr-19-if-stored-model-is-unavailable-user-is-prompted-to-select-a-new-model): If stored
  model is unavailable, user is prompted to select a new model

## Scenarios

### SR-1.1: A model selector interface allows browsing and selecting from available models

#### Preconditions

- User opens Architeezy Graph for the first time or after clearing browser storage
- No model is currently loaded in the viewer
- The model list is available from the API

#### Steps

1. **App initialization without stored model**
   - User navigates to Architeezy Graph
   - Application finds no stored model reference and no URL model identifier
   - Model selector modal opens automatically

2. **Model selector opens**
   - A modal appears with the title "Select Model"
   - The application fetches the list of available models
   - The model list renders in the modal once fetched

3. **Select a model**
   - User clicks on a model card
   - The modal closes
   - A loading spinner appears while the model content is fetched

4. **Model loads successfully**
   - The graph renders with nodes and edges
   - Sidebar filter panels populate with element and relationship types
   - The header displays the model name
   - The loading spinner disappears

#### Edge Cases

- **Model fetch fails** — an error notification appears; if no model was loaded, the selector
  re-opens automatically.
- **Model has no elements** — an error notification indicates the model is empty; the user can
  select a different model.
- **Network timeout** — an error appears after a reasonable timeout period; the user can retry by
  re-opening the selector.

### SR-1.2: Model selector displays model information

#### Preconditions

- Model selector modal is open
- The model list has been successfully fetched from the API
- At least one model is available

#### Steps

1. **View model list**
   - The modal displays a list of model cards
   - Each card shows an icon, name, type badge, and description

2. **Review a model card**
   - User reads the model name and type badge
   - User reads the description for context
   - All information is visible without additional interaction

3. **Select a model to confirm information is correct**
   - User clicks the desired model card
   - Model loads and the header confirms the model name matches the card

#### Edge Cases

- **Model with missing description** — card displays available fields; missing fields are omitted or
  shown as empty without error.
- **Large model list** — all cards are accessible via scrolling within the modal.

### SR-1.3: Search can filter the model list

#### Preconditions

- Model selector modal is open
- The model list has been fetched and rendered
- Multiple models are available

#### Steps

1. **Focus the search field**
   - User clicks or tabs into the search input field
   - The field receives focus with a visible indicator

2. **Type search text**
   - User types characters into the search field
   - The list filters in real time based on the entered text
   - Only models whose name or description matches the search remain visible

3. **Clear search**
   - User clears the search field
   - The full model list is restored

#### Edge Cases

- **Search with no matches** — the list shows an empty state or "No models found" message; no error
  occurs.
- **Very long search string** — input is accepted and filtering continues to work correctly.

### SR-1.4: Loading indicators appear during fetch operations

#### Preconditions

- Application is in a state where a fetch operation will be triggered (initial load, model
  selection, or deep link resolution)
- Network response is not instantaneous

#### Steps

1. **Trigger a fetch operation**
   - User selects a model or the application begins loading a model automatically
   - A loading spinner or indicator appears promptly

2. **Wait for the operation to complete**
   - The loading indicator remains visible throughout the fetch
   - The UI remains responsive (not frozen)

3. **Fetch completes**
   - The loading indicator disappears
   - The result (loaded model or error notification) is displayed

#### Edge Cases

- **Very fast response** — loading indicator may appear briefly; no jarring flash if response is
  near-instant.
- **Fetch fails** — loading indicator disappears and an error notification is shown in its place.

### SR-1.5: Deep links load specified model with URL parameters for view mode, filters, and drill state

#### Preconditions

- User opens Architeezy Graph via a shared URL containing a model identifier and optional parameters
- The specified model exists in the repository

#### Steps

1. **App initialization with deep link**
   - User navigates to Architeezy Graph using the shared URL
   - Application detects a model identifier in the URL parameters
   - Model list is fetched eagerly to resolve the identifier

2. **Model loads from URL**
   - The specified model is fetched and rendered
   - URL parameters (view mode, filters, drill state) are applied after the model content loads
   - URL parameters override any previously stored settings

3. **Verify applied state**
   - The graph or table reflects the view mode specified in the URL
   - Filters match those encoded in the URL
   - Drill state is entered if specified

#### Edge Cases

- **Model identifier not found in deep link** — the application falls back to any previously stored
  model; if no fallback exists, the model selector opens; an error notification informs the user.
- **URL parameters without model identifier** — parameters are ignored; normal model selection flow
  proceeds.
- **Invalid drill parameters in URL** — drill mode is not entered; other URL parameters are still
  applied.

### SR-1.6: URL state is preserved during browser navigation

#### Preconditions

- A model is loaded with specific filters or view state applied
- The user intends to use browser back/forward navigation

#### Steps

1. **Apply state that updates the URL**
   - User applies filters or changes the view mode
   - The URL updates to reflect the current application state

2. **Navigate back**
   - User clicks the browser's back button
   - The application transitions to the previous state encoded in the URL

3. **Navigate forward**
   - User clicks the browser's forward button
   - The application transitions to the next state in the history stack

#### Edge Cases

- **Multiple browser tabs** — each tab operates independently; changes in one tab do not affect
  others; minor inconsistencies in persisted state are acceptable.

### SR-1.7: Invalid deep links fall back to model selection

#### Preconditions

- User opens Architeezy Graph via a URL that contains an unrecognized or unavailable model
  identifier
- No valid stored model is available as a fallback

#### Steps

1. **App initialization with invalid deep link**
   - User navigates to Architeezy Graph using the invalid URL
   - Application attempts to resolve the model identifier

2. **Resolution fails**
   - The specified model is not found in the model list
   - An error notification informs the user that the linked model is unavailable

3. **Fallback to model selection**
   - The model selector modal opens
   - User can browse and select an available model normally

#### Edge Cases

- **Stored model available as fallback** — the application loads the stored model instead of opening
  the selector; user is still notified about the invalid link.

### SR-1.8: Last-viewed model and filter state persist across sessions

#### Preconditions

- User has previously loaded a model and applied filters
- User is returning to Architeezy Graph after closing and reopening the browser or tab

#### Steps

1. **Return to the application**
   - User navigates to Architeezy Graph without a deep link URL
   - Application finds a stored model reference

2. **Stored model loads automatically**
   - A loading indicator appears
   - The previously viewed model is fetched and rendered

3. **Filter state is restored**
   - Previously applied filters are restored to their saved state
   - The graph reflects the filters as they were when the session ended

#### Edge Cases

- **Browser storage full or disabled** — model preference may not persist; application continues
  without crashing.
- **Corrupted data in browser storage** — falls back to default state (model selection).

### SR-1.9: If stored model is unavailable, user is prompted to select a new model

#### Preconditions

- User returns to Architeezy Graph after a previous session
- The previously stored model has since been removed from the repository or is otherwise
  inaccessible

#### Steps

1. **App initialization with stored model**
   - Application finds a stored model reference and attempts to load it
   - The fetch for the stored model fails

2. **Stored reference is cleared**
   - Application clears the invalid stored reference to prevent repeated failures
   - An error notification informs the user that the previous model is no longer available

3. **User is prompted to select a new model**
   - The model selector modal opens automatically
   - User can browse and select an available model

#### Edge Cases

- **Model becomes unavailable on return** — the stored reference is cleared after a failed load
  attempt; the application does not enter an error loop.

## Business Rules

### Model Loading

- Model list is fetched lazily (only when the user opens the selector), except when a deep link with
  a model identifier is present, which requires an eager fetch.
- Model reference is persisted only after successful load.

### Deep Linking

- URL parameters override stored model preference on initial load.
- URL parameters are applied only after model content loads.
- Unknown or invalid parameter values are ignored without error.

### Session Persistence

- Model reference is saved only after the model loads successfully.
- Filter state is stored separately and associated with the model identifier.
- If stored model loads fail, the stored reference is cleared to prevent repeated failures.
- The initialization sequence checks for stored model before falling back to the selector.

## UI/UX

### Responsiveness

- Search in the model selector uses debounced input (200ms delay after typing stops) for real-time
  filtering.
- Loading indicators appear during fetch operations to provide feedback.
- Model list filters in real-time based on search text.

### Visual Design

- The model selector appears as a centered modal with backdrop.
- Model items display an icon, name, type badge, and description.
- Loading spinners indicate ongoing operations.
- Toast notifications provide feedback about errors and status changes.
- The model name appears in the header once determined.
- During auto-load from persistence, a loading message indicates progress.

## Technical Notes

### API Integration

- Model list is retrieved from `GET /api/models`.
- Model content URL is provided in the model metadata; model content is fetched from that URL.

### Storage

- Browser storage is used to persist model references and filter state across sessions.
- Storage keys include:
  - Model identifier or URL
  - Model display name
  - Filter state (namespaced per model)

### State Management

- The application maintains a unified state representation including current model, view mode,
  filters, and drill parameters.
- This state is synchronized with URL parameters to enable sharing and navigation.
- Initialization logic checks multiple sources in order: URL parameters, stored model, then
  selector.

### Performance

- Large models may require extended load times.
- Graph rendering should remain responsive during loading.
- Progressive rendering may be used for very large models.
