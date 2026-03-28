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

- SR-1.1: A model selector interface allows browsing and selecting from available models
- SR-1.2: Model selector displays model information (icon, name, type, description)
- SR-1.3: Search filters the model list in real-time
- SR-1.4: Loading indicators appear during fetch operations
- SR-1.5: Deep links load specified model with URL parameters for view mode, filters, and drill
  state
- SR-1.6: URL state is preserved during browser navigation (back/forward)
- SR-1.7: Invalid deep links fall back to model selection
- SR-1.8: Last-viewed model and filter state persist across sessions via browser storage
- SR-1.9: If stored model is unavailable, user is prompted to select a new model

## Scenario

### Preconditions

- User opens Architeezy Graph for the first time, after clearing browser storage, or with a shared
  URL
- No model currently loaded in the viewer (or returning to a previous session)

### Steps

1. **App Initialization**
   - User navigates to Architeezy Graph
   - Application checks for stored model reference and URL parameters
   - If URL contains model identifier, fetch model list eagerly
   - If stored model exists and no URL override, attempt to load stored model
   - Otherwise, open model selector

2. **Open Model Selector (if needed)**
   - A modal appears with the title "Select Model"
   - The application fetches the list of available models
   - The model list renders in the modal once fetched

3. **Search for Model (optional)**
   - User enters search text into the search field
   - The list filters in real-time based on the search text
   - Only matching models remain visible

4. **Select Model**
   - User clicks on a model card
   - The modal closes
   - A loading spinner appears
   - The application fetches the selected model content

5. **Apply State from URL (if present)**
   - If URL parameters specify filters or drill state, they are applied
   - URL parameters override stored settings

6. **Model Displays**
   - The graph renders with nodes and edges
   - Sidebar filter panels populate with element and relationship types
   - The header displays the model name
   - The loading spinner disappears
   - The model selection and filter state are saved to browser storage for future sessions

7. **Success Handling**
   - If returning to a previously viewed model, filter state is restored
   - If model load fails, fallback to model selector with error notification
   - If stored model is no longer available, clear storage and prompt selection

### Expected Results

- The graph displays all elements and relationships (subject to any URL-specified filters)
- Filters show correct options and counts
- The user can proceed to exploration activities
- The model selection button displays the loaded model name
- URL parameters correctly encode shareable state
- Browser storage maintains model preference and filter state across sessions
- Errors are handled gracefully with clear feedback

### Edge Cases

- **Model fetch fails**
  - An error notification appears
  - The current model (if any) remains visible
  - If no model was loaded, the selector re-opens automatically

- **Model has no elements**
  - An error notification indicates the model is empty
  - The user can select a different model

- **Network timeout**
  - An error appears after a reasonable timeout period
  - The user can retry by re-opening the selector

- **Large model**
  - Loading may take longer
  - The interface remains responsive
  - The graph renders progressively

- **Model identifier not found in deep link**
  - The application falls back to any previously stored model
  - If no fallback exists, the model selector opens
  - An error notification informs the user

- **URL parameters without model identifier**
  - Parameters are ignored
  - Normal model selection flow proceeds

- **Invalid drill parameters in URL**
  - Drill mode is not entered
  - Other URL parameters are still applied

- **Multiple browser tabs**
  - Each tab operates independently
  - Changes in one tab do not affect others
  - This may cause minor inconsistencies, which is acceptable for the initial version

- **Model becomes unavailable on return**
  - The stored reference is cleared after a failed load attempt
  - The user can select an alternative model
  - The application does not enter an error loop

- **Browser storage full or disabled**
  - Model preference may not persist but application continues without crashing

- **Corrupted data in browser storage**
  - Falls back to default state (model selection)

## Business Rules

### Model Loading

- Model list is fetched lazily (only when the user opens the selector), except when a deep link with
  a model identifier is present, which requires an eager fetch.
- Model selection is saved to browser storage only after successful load.
- Search in the model selector uses debounced input (200ms).
- Model list endpoint: GET /api/models
- Model content is fetched following the content URL from the model metadata.

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

- The model selector appears as a centered modal with backdrop.
- Model items display an icon, name, type badge, and description.
- Loading spinners indicate ongoing operations.
- Toast notifications provide feedback about errors and status changes.
- The model name appears in the header once determined.
- During auto-load from persistence, a loading message indicates progress.

## Technical Notes

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
