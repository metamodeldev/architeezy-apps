# TC-1.5: Access

**System Requirement**: [SR-1.5](../../system-requirements/models.md#sr-15-access)

## TC-1.5.1: User identity status is always visible in the header

### Preconditions

- Application is loaded (either with a model or in selection state)

### Steps

1. Observe the application header
   - The header contains an element showing user identity:
     - If user is signed in: avatar or username (e.g., "John Doe")
     - If user is anonymous/guest: "Guest" or "Not signed in" or a generic icon
2. Verify position and prominence
   - Identity indicator is in the top-right or top-left corner, clearly visible on all pages
     (selection modal, main view)
   - Identity status is persistently displayed
   - User can always check their auth state

### Test Data

| Auth state | Expected display    |
| ---------- | ------------------- |
| Signed in  | username/avatar     |
| Anonymous  | Guest / Sign in CTA |

## TC-1.5.2: Sign out while viewing a private model closes the model and clears data

### Preconditions

- User is authenticated
- Private model `private-dashboard` is currently loaded
- Model data is in memory and possibly in browser storage/cache

### Steps

1. Click the user avatar/name in the header and select "Sign Out" or "Logout"
   - The logout process initiates; session is terminated on the server
2. Observe the main view after logout
   - The private model is closed; its data is purged from application memory; the model selection
     modal opens
3. Check browser storage (DevTools)
   - Any sensitive data related to the private model is removed from memory/state, though
     non-sensitive public model preferences may remain (depending on security policy)
4. Verify identity display
   - Header now shows "Guest" or the sign-in prompt
   - User is signed out (session ended)
   - Private model data cleared
   - Selection modal open

### Test Data

| Before logout            | After logout             |
| ------------------------ | ------------------------ |
| model: private-dashboard | modal: Select Model open |
| identity: John           | identity: Guest          |

## TC-1.5.3: Sign out clears all model data and opens selector

### Preconditions

- User is authenticated
- Any model (public or private) is loaded

### Steps

1. Sign out via the logout action
   - Session ends; identity display changes to Guest
2. Verify the main view
   - All model data is cleared from memory
   - The model selector modal opens
   - The URL is cleared of model parameters
3. Attempt to load a model
   - User must select a model from the selector
   - User is signed out
   - No model data persists after logout

### Test Data

| Before logout | After logout  |
| ------------- | ------------- |
| any model     | selector open |

## TC-1.5.4: Access control respects private model visibility in selector

### Preconditions

- User is anonymous (not signed in)
- The server returns only public models for anonymous users

### Steps

1. Open the model selector
   - Only public models are displayed in the list because the server filters out private models for
     anonymous users
2. Attempt to select a model
   - All displayed models are selectable
   - No private models appear in the list

### Test Data

| API response (anonymous) | Selector shows |
| ------------------------ | -------------- |
| only public models       | only public    |

## TC-1.5.5: After login, private models become visible in selector

### Preconditions

- User is anonymous
- Selector is open, showing only public models

### Steps

1. Initiate login from the selector (via "Sign in" link or button)
2. Authenticate with valid credentials for an account that has access to private models
3. After login, return to the selector (or observe it automatically)
   - Private models that the user is authorized to access are now displayed alongside public models
4. Select a private model
   - Model loads successfully
   - User is authenticated
   - Private models are visible and selectable
   - Access is granted based on permissions

### Test Data

| Before login (selector) | After login (selector) |
| ----------------------- | ---------------------- |
| 3 public models         | 3 public + 2 private   |

## TC-1.5.6: Session expiration triggers access denial on next private model request

### Preconditions

- User is authenticated with a valid session
- A private model is loaded and displayed

### Steps

1. Simulate session expiration (e.g., wait for token expiry, or server returns 401 on any API call)
2. Trigger any data request (e.g., apply a filter, expand a node, refresh)
   - The API call fails with 401; the app detects authentication failure
3. Observe the response
   - The app shows an "Access Denied" screen or prompts the user to re-authenticate
   - The current model view may be cleared or replaced with a login prompt
4. Re-authenticate
   - After login, the previously requested operation or model view is restored
   - Session is refreshed
   - User can continue working
   - Any failed request can be retried after auth

### Test Data

| API response     | Expected UI behavior              |
| ---------------- | --------------------------------- |
| 401 Unauthorized | show Access Denied / login prompt |

## TC-1.5.7: Logout clears all non-public model data from memory

### Preconditions

- User has loaded multiple models: `private-A`, `public-B`, `private-C`
- All model data is in the application's state/cache

### Steps

1. Sign out
2. Inspect the application state (via DevTools or internal state inspection)
   - All data related to `private-A` and `private-C` is removed from memory (state, caches,
     component stores)
   - Data for `public-B` may remain if it's allowed to persist for anonymous users (but depends on
     implementation)
3. Ensure no residual private data persists
   - Attempting to access internal state for private models returns `null` or empty results
   - No private model data remains in memory after logout
   - Security requirement satisfied

### Test Data

| Model types loaded  | After logout - private models | After logout - public models |
| ------------------- | ----------------------------- | ---------------------------- |
| 2 private, 1 public | cleared                       | may remain (optional)        |

## TC-1.5.8: Identity display updates immediately after login/logout

### Preconditions

- User is currently signed out (showing "Guest")

### Steps

1. Click "Sign In" and complete authentication
   - Without requiring a page reload, the header updates to show the user's name/avatar immediately
     upon successful login
2. While signed in, click the avatar dropdown and select "Sign Out"
   - Header updates instantly to show "Guest" or sign-in prompt; no page reload required
   - Identity indicator reflects the current auth state in real-time
   - UI remains responsive; no full page refresh needed

### Test Data

| Transition | UI update timing |
| ---------- | ---------------- |
| Login      | immediate        |
| Logout     | immediate        |

## TC-1.5.9: Access to private model is denied after session expiry, even if model is cached

### Preconditions

- Private model `private-report` is loaded and its data is cached in memory or localStorage
- Session token expires or is revoked

### Steps

1. Wait for session to expire (or simulate 401 on next request)
2. Try to interact with the model (e.g., apply a filter, navigate to a different view)
   - The app attempts to fetch data, server returns 401; access is denied regardless of cached data
3. Observe behavior
   - The cached data may be cleared or shown as inaccessible; user is prompted to log in; no private
     data remains visible or usable while unauthenticated
   - Expired session enforces access control
   - Cached private data does not bypass authentication

### Test Data

| Cached data | Session | Access allowed? |
| ----------- | ------- | --------------- |
| yes         | expired | no              |
