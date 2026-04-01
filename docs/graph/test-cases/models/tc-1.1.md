# TC-1.1: Selection

**System Requirement**: [SR-1.1](../../system-requirements/models.md#sr-11-selection)

## TC-1.1.1: Model selector opens automatically when no model is stored

### Preconditions

- Browser storage (`localStorage`) is empty or contains no saved model
- User accesses the application at the main entry point (e.g., `/graph/`)
- API returns at least one accessible model

### Steps

1. Open the application at `/graph/`
   - The "Select Model" modal appears centered on the screen with a backdrop; the main content area
     (graph/table) is not visible or is blocked
2. Observe the modal header
   - Modal displays a title like "Select Model" or "Choose a Model"
3. Observe the model list
   - The list displays all available models with their names, icons, and descriptions
   - The model selection modal is visible
   - No model is currently loaded in the main view

### Test Data

| Field       | Value                   |
| ----------- | ----------------------- |
| Storage     | empty/no model          |
| Modal state | visible                 |
| API models  | at least 1 public model |

## TC-1.1.2: Selecting a model from the selector loads it and closes the modal

### Preconditions

- The "Select Model" modal is open
- API returns models: **e-commerce** and **hr-system**

### Steps

1. Click on the **e-commerce** model card
   - The modal closes immediately with a smooth animation (if configured)
2. Wait for the data fetch to complete
   - The graph or table view renders with model data; a loading indicator may show during fetch
3. Observe the application header
   - The header displays "e-commerce" as the current model name
4. Verify model data is displayed
   - Nodes/edges (graph) or rows (table) corresponding to the e-commerce model are visible
   - Model **e-commerce** is loaded and displayed
   - The modal is hidden
   - URL contains the model identifier (e.g., `?model=e-commerce`)

### Test Data

| Field          | Value      |
| -------------- | ---------- |
| Selected model | e-commerce |
| Header text    | e-commerce |
| API response   | model data |

## TC-1.1.3: Filtering the model list using search

### Preconditions

- The "Select Model" modal is open
- API returns multiple models: **e-commerce**, **hr-system**, **finance-app**, **legacy-monolith**

### Steps

1. Type "e-commerce" into the search input field
   - The model list updates in real-time to show only models matching the query; **e-commerce** is
     visible, others are hidden
2. Clear the search input
   - All models become visible again
3. Type "xyz" (a query with no matches)
   - A message "No models found" or equivalent is displayed; the list is empty
   - Search filtering works correctly
   - Users can narrow down model selection

### Test Data

| Field      | Value                                               |
| ---------- | --------------------------------------------------- |
| Search 1   | "e-commerce" → matches 1                            |
| Search 2   | "" (empty) → shows all models                       |
| Search 3   | "xyz" → no matches                                  |
| Model list | e-commerce, hr-system, finance-app, legacy-monolith |

## TC-1.1.4: Handling an empty model repository

### Preconditions

- The API returns an empty list of models (or the user has no access to any models)
- Application is loaded

### Steps

1. Observe the application behavior
   - The model selection modal opens (as per startup priority)
2. Observe the modal content
   - A message "No models available" or similar is displayed; the model list is empty or shows a
     placeholder state
3. Attempt to interact with the main view
   - Main view remains blocked or displays an empty state; user cannot proceed without selecting a
     model
   - User is informed about the absence of models
   - Application remains in a blocked state until models become available

### Test Data

| Field      | Value            |
| ---------- | ---------------- |
| API models | [] (empty array) |

## TC-1.1.5: Model has no elements - handle empty model data

### Preconditions

- The "Select Model" modal is open
- API returns a model **empty-model** with no nodes/edges/entities
- User clicks to select this model

### Steps

1. Select **empty-model** from the list
   - Modal closes, data fetch initiates
2. Wait for the graph/table to render
   - An empty state is shown with a message like "This model contains no data" or a placeholder
     illustration
3. Verify the model name in header
   - Header shows "empty-model"
4. Try to access model selection again
   - The selection interface remains accessible; user can switch to another model
   - The empty model state is displayed
   - User can still navigate to other models

### Test Data

| Field          | Value               |
| -------------- | ------------------- |
| Model name     | empty-model         |
| Model content  | no nodes/edges      |
| Expected state | empty state message |

## TC-1.1.6: Keyboard navigation in the selection modal

### Preconditions

- The "Select Model" modal is open
- Multiple models are listed

### Steps

1. Press the `Down Arrow` key
   - The first model card receives focus (highlighted)
2. Press `Down Arrow` multiple times
   - Focus moves down through the list of model cards
3. Press `Up Arrow`
   - Focus moves up the list
4. Press `Enter` on a focused model card
   - The modal closes and the selected model loads
5. Press `Esc`
   - The modal closes; if no model was selected, the application remains in its current state or
     falls back to a default
   - Keyboard navigation works as expected
   - Modal can be dismissed with `Esc`

### Test Data

| Field       | Value              |
| ----------- | ------------------ |
| Models list | 3+ models          |
| Navigation  | arrows, Enter, Esc |

## TC-1.1.7: Real-time search filtering with multiple queries

### Preconditions

- The "Select Model" modal is open
- API returns models: **e-commerce**, **e-com**, **test-model**, **demo**

### Steps

1. Type the letter "e" into the search field
   - Models matching "e" are shown (e-commerce, e-com)
2. Type "-com" (so full query is "e-com")
   - Only **e-com** and **e-commerce** remain visible
3. Type "model" (full query now "e-com-model")
   - Only **test-model** matches (if search logic treats space as AND) or none matches (if it's a
     continuous string); test accordingly
   - Search updates in real-time as the user types
   - Partial and complete queries are handled correctly

### Test Data

| Models | e-commerce, e-com, test-model, demo | | Query 1 | "e" → 2 matches | | Query 2 | "e-com" →
2 matches | | Query 3 | "model" → 1 match (test-model) |
