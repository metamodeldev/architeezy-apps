# TC-1.2: Deep links

**System Requirement**: [SR-1.2](../../system-requirements/models.md#sr-12-deep-links)

## TC-1.2.1: Loading a public model from a deep link

### Preconditions

- User is not authenticated (anonymous session)
- Deep link URL: `/graph/?model=public-model-id`
- Model `public-model-id` exists and is marked as public in the API

### Steps

1. Navigate to the deep link URL
   - The application loads directly without showing the model selector; the model data is fetched
     and displayed
2. Observe the header
   - Header shows "public-model-id" (or the display name)
3. Verify the view
   - Graph or table displays the model content; filters are at their default state
   - Model `public-model-id` is loaded
   - URL contains the model parameter
   - User remains anonymous

### Test Data

| Field | Value                         |
| ----- | ----------------------------- |
| URL   | /graph/?model=public-model-id |
| Model | public-model-id (public)      |

## TC-1.2.2: Loading a private model requires authentication

### Preconditions

- User is not authenticated (anonymous session)
- Deep link URL: `/graph/?model=private-model-id`
- Model `private-model-id` exists but is marked as private/restricted

### Steps

1. Navigate to the deep link URL
   - An "Access Denied" screen or modal is displayed; the main graph/table view is not visible
2. Observe the access denied screen
   - Message indicates the model requires authentication; a "Sign In" or "Log in" button is present
3. Click the "Sign In" button
   - Authentication flow (login page or modal) opens
4. Complete authentication with valid credentials
   - Login succeeds; user is redirected back to the original deep link (or the app loads the
     requested model automatically)
5. Verify model loading
   - Model `private-model-id` loads and displays; user's identity is shown in the header
   - User is authenticated
   - Private model is loaded successfully
   - URL unchanged (still contains model parameter)

### Test Data

| Field       | Value                          |
| ----------- | ------------------------------ |
| URL         | /graph/?model=private-model-id |
| Model       | private-model-id (private)     |
| Auth method | login + credentials            |

## TC-1.2.3: Invalid model identifier in deep link

### Preconditions

- Deep link URL contains a model ID that does not exist: `/graph/?model=nonexistent-id`

### Steps

1. Navigate to the deep link URL
   - An error notification is displayed (toast/alert) indicating the model could not be found
2. Observe application behavior
   - The model selection modal opens automatically, allowing the user to choose an existing model
3. Verify no broken state
   - The main view remains blocked by the selection modal; no partial data is shown
   - Selection modal is open
   - No invalid model data remains in memory
   - User can select a valid model

### Test Data

| Field       | Value              |
| ----------- | ------------------ |
| Model ID    | nonexistent-id     |
| Expected UI | error + modal open |

## TC-1.2.4: Session expiration while accessing a private model from deep link

### Preconditions

- User is authenticated with a session that will expire soon (or is already expired)
- Deep link to a private model: `/graph/?model=private-model-id`

### Steps

1. Navigate to the deep link
   - If session is valid, model loads normally. If session expired, the Access Denied flow triggers
     (TC-1.2.2)
2. If session expires during this process, simulate a 401 response from the API
   - The application detects the authentication error and shows the "Access Denied" screen with
     login option
   - User is prompted to re-authenticate if needed
   - Original deep link is preserved for post-login redirection

### Test Data

| Field         | Value            |
| ------------- | ---------------- |
| Session state | expired          |
| Model         | private-model-id |
| API response  | 401 Unauthorized |

## TC-1.2.5: Deep link with missing view parameters loads with defaults

**Note**: View parameters include filters, view mode (graph/table), drill-down state, etc.

### Preconditions

- Deep link URL contains a model identifier but no view parameters: `/graph/?model=some-model`
- OR deep link contains only the model ID in a clean URL: `/graph/some-model` (depending on routing
  scheme)

### Steps

1. Navigate to the URL
   - Model loads successfully
2. Observe the view state
   - Graph mode is active by default (or table, depending on product defaults); no filters are
     applied; drill-down is not active
3. Check URL parameters
   - The URL contains the model parameter but no view-related parameters (filters, mode,
     drill-down). The view state is clean.
   - Model is loaded with default view settings
   - No residual state from previous sessions

### Test Data

| URL format               | Expected view state                     |
| ------------------------ | --------------------------------------- |
| /graph/?model=some-model | default mode, no filters, no drill-down |
| /graph/some-model        | same as above                           |

## TC-1.2.6: Deep link preserves view parameters

### Preconditions

- A deep link includes model and view state: `/graph/?model=e-commerce&entities=Microservice`
  - Note: `view=graph` is **not** included because `graph` is the default view; it is implied when
    absent.

### Steps

1. Navigate to the deep link
   - Model loads and the view state is restored according to parameters:
     - View mode = graph (default, inferred from absence of `view` parameter)
     - Filter = "Microservice" entity type is active and applied
     - Graph displays only filtered nodes
2. Verify filter UI
   - Active filter shows "Microservice" entity type is selected in the filter panel
3. Verify the graph content
   - Only nodes matching the filter are rendered
   - Model and view state are synchronized with URL parameters
   - Filters are applied correctly

### Test Data

| Parameter | Value        |
| --------- | ------------ |
| model     | e-commerce   |
| entities  | Microservice |

## TC-1.2.7: Deep link to a restricted model after successful login remembers original target

**Related to**: SR-1.2, authentication flow

### Preconditions

- User is not authenticated
- Deep link: `/graph/?model=private-dashboard`
- Model is restricted

### Steps

1. Navigate to the deep link
   - Access Denied screen appears with Sign In button
2. Click "Sign In" and authenticate
   - After successful login, the app redirects back to `/graph/?model=private-dashboard` (the
     original URL) and loads the model
3. Verify no redirect to a generic page
   - User lands exactly on the requested model, not on the model selector or a dashboard
   - User is authenticated
   - Requested private model is loaded
   - Original deep link preserved through the auth flow

### Test Data

| Field        | Value                           |
| ------------ | ------------------------------- |
| Original URL | /graph/?model=private-dashboard |
| After login  | same URL + model loaded         |

## TC-1.2.8: Deep link with multiple view state parameters

### Preconditions

- Deep link URL: `/graph/?model=inventory&view=table&sort=name&order=asc` (no entities filter, or
  with entities if needed)
- Model `inventory` exists and has data

### Steps

1. Navigate to the deep link
   - Model loads with:
     - View mode = table
     - Sorting by name ascending
     - (No filter applied, or entities filter if specified in URL)
2. Observe the table
   - Rows are sorted by name (A-Z); only active items are visible
3. Check URL
   - URL parameters match the deep link exactly
   - All view state parameters are applied
   - State is consistent with the URL

### Test Data

| Parameter | Value     |
| --------- | --------- |
| model     | inventory |
| view      | table     |
| sort      | name      |
| order     | asc       |
