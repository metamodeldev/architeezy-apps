# SR-10: Authentication

**Functional Requirements**:
[FR-10.1, FR-10.2, FR-10.3](../functional-requirements.md#fr-10-authentication)

## User Stories

- As a user, I want to optionally authenticate to access private models or personalized content
  while still being able to use the app anonymously.
- As a user, I want to see my identity clearly in the header when signed in, and be able to sign out
  easily.
- As a user, I want signing out to return me to anonymous mode without losing my current view or
  work session.

## Acceptance Criteria

- [SR-10.1](#sr-101-application-works-fully-in-anonymous-mode-without-authentication): Application
  works fully in anonymous mode without authentication
- [SR-10.2](#sr-102-a-sign-in-control-is-visible-in-the-header-when-not-authenticated): A sign-in
  control is visible in the header when not authenticated
- [SR-10.3](#sr-103-user-can-initiate-authentication-from-the-header): User can initiate
  authentication from the header
- [SR-10.4](#sr-104-after-successful-authentication-the-users-display-name-appears-in-the-header-with-a-sign-out-option):
  After successful authentication, the user's display name appears in the header with a sign-out
  option
- [SR-10.5](#sr-105-sign-out-clears-the-authentication-state-and-returns-ui-to-anonymous-state):
  Sign-out clears the authentication state and returns UI to anonymous state
- [SR-10.6](#sr-106-sign-out-does-not-clear-unrelated-persisted-state): Sign-out does NOT clear
  unrelated persisted state
- [SR-10.7](#sr-107-if-authentication-fails-or-expires-the-ui-resets-to-anonymous-state): If
  authentication fails or expires, the UI resets to anonymous state

## Scenarios

### SR-10.1: Application works fully in anonymous mode without authentication

#### Preconditions

- User has Architeezy Graph open in a browser
- No authentication session is active (anonymous state)
- A mix of public and private models is available in the repository

#### Steps

1. **Browse the application without signing in**
   - Graph view, table view, and all filtering controls are fully accessible
   - No authentication prompt appears during normal use

2. **Navigate to a public model**
   - The model loads and displays correctly
   - All application features work as expected

3. **Attempt to load a private model**
   - The model appears in the model selector
   - Loading the model returns an authorization error
   - An error notification is shown and the application remains in anonymous state

#### Edge Cases

- **Browser reload while anonymous** — application starts in anonymous state; no sign-in prompt is
  forced

### SR-10.2: A sign-in control is visible in the header when not authenticated

#### Preconditions

- User has Architeezy Graph open in a browser
- No authentication session is active

#### Steps

1. **Observe the application header**
   - A "Sign in" button is visible in the top-right corner of the header bar

2. **Verify button accessibility**
   - The "Sign in" button is reachable via keyboard navigation
   - The button has a visible focus style

3. **Confirm no authenticated controls are shown**
   - No user name, avatar, or "Sign out" button is visible in the header

#### Edge Cases

- **Multiple tabs open in anonymous state** — each tab independently shows the "Sign in" button

### SR-10.3: User can initiate authentication from the header

#### Preconditions

- User has Architeezy Graph open in a browser
- No authentication session is active
- The browser permits popup windows from the application origin

#### Steps

1. **Click the "Sign in" button in the header**
   - A popup window opens to the authentication endpoint
   - The popup is appropriately sized and positioned

2. **Complete the login flow in the popup**
   - User enters credentials and completes any consent steps in the popup
   - The popup closes itself after successful authentication

3. **Return to the main application window**
   - The main window transitions to authenticated state (see SR-10.4)

#### Edge Cases

- **Popup blocked by browser** — an inline error message appears with instructions; a fallback link
  lets the user open the auth flow in a new tab or the current tab

### SR-10.4: After successful authentication, the user's display name appears in the header with a sign-out option

#### Preconditions

- User has completed the sign-in flow via the popup
- Authentication was successful

#### Steps

1. **Observe the header after sign-in completes**
   - The "Sign in" button disappears
   - The user's display name (e.g., "John Doe") appears in its place
   - A "Sign out" button is visible next to the display name

2. **Verify access to private models**
   - Private models that previously returned an authorization error can now be loaded successfully

3. **Observe profile fallback**
   - If the user profile could not be fetched, a placeholder name (e.g., "User") appears instead
   - A warning notification is shown

#### Edge Cases

- **Profile fetch fails after successful token receipt** — user remains authenticated with a
  placeholder name; a warning toast is shown; private model access is unaffected
- **Multiple sign-in attempts** — only the latest authentication is active; the previous session is
  discarded

### SR-10.5: Sign-out clears the authentication state and returns UI to anonymous state

#### Preconditions

- User is currently authenticated
- The "Sign out" button is visible in the header

#### Steps

1. **Click the "Sign out" button in the header**
   - The authentication session is ended
   - The "Sign out" button and user display name disappear from the header

2. **Observe the header after sign-out**
   - The "Sign in" button reappears in the top-right corner
   - No user name or avatar is shown

3. **Confirm sign-out notification**
   - A toast notification confirms "Signed out successfully"
   - The page does not reload

#### Edge Cases

- **Sign out while an API request is in flight** — the in-flight request may fail; the UI already
  shows anonymous state; no additional sign-out action is needed
- **Private model loaded, then user signs out** — the currently loaded model remains visible;
  subsequent requests requiring authentication may fail; the user can continue viewing but cannot
  load additional private models

### SR-10.6: Sign-out does NOT clear unrelated persisted state

#### Preconditions

- User is authenticated
- Active filters, theme, and current model view have been configured by the user

#### Steps

1. **Note the current application state**
   - Observe which filters are active, the current theme, and the loaded model

2. **Click "Sign out"**
   - Authentication is cleared and the UI returns to anonymous state

3. **Verify non-auth state is preserved**
   - Active filters remain as configured before sign-out
   - Theme setting is unchanged
   - The current model view (graph position, zoom) is preserved

#### Edge Cases

- **Cached private data after sign-out** — private data may optionally be cleared if security policy
  demands, but non-authentication-related state is always preserved

### SR-10.7: If authentication fails or expires, the UI resets to anonymous state

#### Preconditions

- User is currently authenticated and working with a loaded model
- The authentication session is about to expire or has already expired

#### Steps

1. **An API request returns an authorization error**
   - The application detects the failed authorization response

2. **Observe the header**
   - The user display name and "Sign out" button disappear
   - The "Sign in" button reappears

3. **Observe the notification**
   - A notification appears: "Session expired. Please sign in again."
   - The current model data stays visible but may become stale or incomplete

#### Edge Cases

- **Auth service origin mismatch during sign-in** — the authentication response from an unexpected
  domain is ignored; no token is accepted; a warning is logged in development
- **Malformed authentication response** — required fields are checked; if missing, the response is
  ignored and the user sees an error toast: "Authentication failed. Please try again."
- **Token is null or empty** — any existing authentication state is cleared; the user is notified of
  authentication failure
- **User leaves tab open overnight; token expires** — the next API call that requires authentication
  returns an authorization error; the application clears the session and shows the sign-in prompt;
  the user's view state is otherwise preserved
- **Browser reload** — the authentication session is lost; the application starts in anonymous state
  with the "Sign in" button shown

## Business Rules

### Authentication Scope

- The application is fully functional without authentication (anonymous mode).
- Authentication is only required for accessing private models or user-specific content.
- Public model list includes both public and private models, but loading private models triggers
  auth requirement.
- Sign-in is optional and non-blocking.

### Token Storage Policy

- Tokens MUST be stored in memory only and are not persisted to browser storage.
- Tokens are cleared when the page is reloaded or the browser tab is closed.
- On page reload, token is lost; user must authenticate again.

### Token Transmission

- All authenticated API requests include authentication credentials in request headers.
- All requests must use HTTPS.

### Token Expiry

- Backend controls token lifetime.
- Frontend does not attempt token refresh automatically.
- On authorization error response: clear token, reset UI to anonymous, prompt user to sign in.

### Sign-Out Behavior

- Authentication session is ended.
- UI updates to show anonymous state (sign-in button visible).
- Persisted non-auth state (filters, theme, current model view) is NOT cleared.
- Cached private data may optionally be cleared if security policy demands.
- No page reload occurs; user remains in current view.

### Cross-Tab Auth

- Initial version does not synchronize auth state across tabs.
- Each tab maintains independent session state.

### User Identity Display

- After sign-in, fetch user profile to get user's display name.
- Display name appears in header, replacing "Sign in" button.
- If profile fetch fails, show a generic placeholder or the email prefix.
- Display name is read-only; no user profile editing in this feature.

## UI/UX

- **Header Location**: Authentication controls appear in the top-right corner of the header bar.
- **Anonymous State**: Shows a "Sign in" button (primary or secondary style).
- **Authenticated State**: Shows user display name or avatar, and a "Sign out" link/button.
- **Sign-in Button**: Clickable; accessible via keyboard; has focus style.
- **Sign-out Button**: Less prominent than sign-in; styled as a link or icon-button.
- **Dropdown Alternative**: Some designs use a user avatar with dropdown containing "Profile" and
  "Sign out" options. This is acceptable if clearer.
- **Popup**: When sign-in opens a popup, show a loading indicator in the opener? Usually not needed;
  popup is self-contained.
- **Error States**:
  - Popup blocked: Show inline error message with instructions.
  - Auth failure: Show toast notification; allow retry.
  - 401 during session: "Session expired. Sign in again." with button to open sign-in popup.

## Technical Notes

### Token Storage

Use a module-level variable that persists for page lifetime but is cleared on reload. Provide
getter/setter functions to manage the token securely.

### API Client Integration

The API client checks for an auth token before making requests and conditionally adds the
authentication credentials in request headers. The client should also detect 401 responses and
trigger token clearing with UI reset.

### Authentication Flow Implementation

- Sign-in opens a popup window to the authentication endpoint, sized appropriately and centered.
- Main window listens for secure cross-origin messaging from the popup; handler validates the
  origin, checks message type, extracts tokens, closes the popup, and initiates profile fetch.
- API client conditionally adds authentication credentials in request headers when a token is
  present in memory.
- On 401 response: clear token from memory, reset UI to anonymous state, show notification.

### Cross-Origin Considerations

- secure cross-origin messaging target origin must be explicitly validated (never wildcard in
  production)
- The auth service must be configured with the correct redirect URI/opener origin
- Use HTTPS for all auth-related communications

### Security Compliance

- Token persistence follows the policy defined in Business Rules (Token Storage Policy).
- Token transmission follows the policy defined in Business Rules (Token Transmission).
- No credentials are stored in application code or persistent browser storage.
- When using cookie-based sessions as an alternative, cookies must be HttpOnly, Secure, and have an
  appropriate SameSite attribute.

### Token Lifecycle

- Frontend does not attempt token refresh automatically.
- Backend controls token lifetime.

### Relation to Other Features

- Model loading must include authentication credentials in request headers for private models.
- When token expires during a model load, fall back to model selector with 401 handling.
- Graph, table, filtering features remain functional with the currently loaded data even after auth
  expires.
