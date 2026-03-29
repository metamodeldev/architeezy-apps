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

- SR-10.1: Application works fully in anonymous mode without authentication
- SR-10.2: A sign-in control is visible in the header when not authenticated
- SR-10.3: User can initiate authentication from the header
- SR-10.4: After successful authentication, the user's display name appears in the header with a
  sign-out option
- SR-10.5: Sign-out clears the authentication state and returns UI to anonymous state
- SR-10.6: Sign-out does NOT clear unrelated persisted state
- SR-10.7: If authentication fails or expires, the UI resets to anonymous state

## Scenario

### Preconditions

- User has Architeezy Graph open in a browser
- No authentication token is stored in memory (anonymous state)
- A private model is available in the repository that requires authentication

### Steps

1. **Anonymous Browsing**
   - User sees the application header with a "Sign in" button on the far right
   - User can browse public models, use graph and table views without restriction
   - If user attempts to load a private model, it appears in the model selector but load attempt
     returns 401
   - Application shows error notification and continues in anonymous state

2. **Initiate Sign-In**
   - User clicks the "Sign in" button in the header
   - A popup window opens to the authentication endpoint URL
   - Popup opens in a new window with appropriate size and position
   - If popup is blocked, show an error message with a link to open in new tab manually

3. **Authenticate in Popup**
   - User completes login flow in the popup (enter credentials, consent, etc.)
   - Auth service redirects to success callback
   - Auth service securely transmits tokens to the opener window using cross-origin messaging
   - Popup closes itself

4. **Receive Tokens in Opener**
   - Main application window listens for secure cross-origin messaging events
   - Validates event origin matches expected auth service domain
   - Checks for the expected message type indicating successful authentication
   - Extracts tokens from the message
   - Stores token in memory (not in persistent storage)
   - Closes popup reference if still open

5. **Fetch User Profile**
   - Immediately after storing token, application calls the user profile API endpoint
   - Request includes authentication credentials in the headers
   - On success, extracts display name from response
   - On failure, shows warning and may proceed with placeholder name

6. **Update UI to Authenticated State**
   - Header changes: "Sign in" button disappears
   - In its place, user avatar or name appears (e.g., "John Doe")
   - "Sign out" button appears next to the name
   - User can now load private models that previously returned 401
   - Application may automatically refresh the model list to include private models

7. **Authentication in Multiple Tabs**
   - If user opens a second tab without token, it remains anonymous
   - Tabs do not automatically share memory state
   - User may need to sign-in separately in each tab (acceptable for initial version)

8. **Sign-Out**
   - User clicks "Sign out" button in header
   - Token is removed from memory
   - Header updates: "Sign out" button disappears, "Sign in" reappears
   - If current model is private and was loaded due to auth, it remains visible
   - User can continue viewing current model but cannot load additional private models
   - A toast notification confirms "Signed out successfully"

9. **Token Expiry During Session**
   - User is working with an authenticated view
   - Some API request returns 401 Unauthorized
   - Central API client detects 401
   - Token is cleared from memory immediately
   - UI resets to anonymous state (header shows "Sign in")
   - Notification appears: "Session expired. Please sign in again."
   - Current model data stays visible but may become stale/incomplete

### Expected Results

- Anonymous mode works identically to authenticated mode except for access to private resources
- Sign-in flow is smooth and returns user to the app with proper UI state
- User identity is clearly visible when authenticated
- Sign-out is quick and does not disrupt the user's current work unnecessarily
- Unauthorized requests are handled gracefully without confusing the user
- All token handling complies with security principles (memory-only storage)

### Edge Cases

- **Popup blocked by browser**
  - Detect that the popup failed to open
  - Show inline message with instructions
  - Provide fallback: link that opens auth flow in current tab (redirect flow)

- **Auth service origin mismatch**
  - secure cross-origin messaging arrives from unexpected domain
  - Ignore message; log warning in development
  - Do not accept tokens from unknown sources

- **secure cross-origin messaging data malformed or missing token**
  - Check required fields
  - If missing, ignore message and close popup if possible
  - Show error toast: "Authentication failed. Please try again."

- **Token is null/empty**
  - Reject and clear any existing state
  - Notify user of authentication failure

- **Profile fetch fails (token valid but profile endpoint error)**
  - Continue in authenticated state with placeholder name (e.g., "User")
  - Show warning toast: "Could not load profile"
  - Token remains valid; user can still access protected resources

- **User signs out while an API request is in flight**
  - Request continues but may fail with 401
  - Upon 401, token already cleared, no additional action needed
  - UI already shows anonymous state

- **Multiple sign-in attempts**
  - Only latest token is kept
  - Previous token is discarded (race condition managed by overwriting)

- **Private model loaded, then user signs out**
  - Model remains visible (default behavior)
  - Subsequent actions that require auth (e.g., refreshing data, searching) may fail
  - Consider showing subtle indicator that content is read-only

- **Token leaked in browser console**
  - Since token is in memory, it may be visible in debugger
  - Document this risk: development tools can inspect memory; production builds minify/obfuscate
  - Use short-lived tokens to mitigate

- **User leaves tab open overnight; token expires**
  - Next API call that requires auth returns 401
  - Application clears token and shows authentication prompt
  - User's view state otherwise preserved

- **Browser reload/refresh**
  - Token stored in memory is lost
  - Application returns to anonymous state
  - User sees "Sign in" button
  - (Optional future enhancement: use refresh token in httpOnly cookie to restore session)

## Business Rules

### Authentication Scope

- The application is fully functional without authentication (anonymous mode).
- Authentication is only required for accessing private models or user-specific content.
- Public model list includes both public and private models, but loading private models triggers
  auth requirement.
- Sign-in is optional and non-blocking.

### Token Storage Policy

- Tokens MUST be stored in in-memory storage only (not persisted to browser storage).
- Tokens are cleared when the page is reloaded or the browser tab is closed.
- Memory-only storage aligns with security requirements for token handling.
- On page reload, token is lost; user must authenticate again.

### Token Transmission

- All authenticated API requests include authentication credentials in request headers with Bearer
  token.
- API client must conditionally add the header only if token is present in memory.
- All requests must use HTTPS.
- If using cookie-based sessions (alternative implementation), use appropriate credentials
  configuration.

### Token Expiry

- Backend controls token lifetime.
- Frontend does not attempt token refresh automatically.
- On 401 response: clear token, reset UI to anonymous, prompt user to sign in.

### Sign-Out Behavior

- Token is removed from memory.
- UI updates to show anonymous state (sign-in button visible).
- Persisted non-auth state (filters, theme, current model view) is NOT cleared.
- Cached private data may optionally be cleared if security policy demands.
- No page reload occurs; user remains in current view.

### Cross-Tab Auth

- Initial version does not synchronize auth state across tabs.
- Each tab maintains independent memory state.
- Optional enhancement: use storage events or BroadcastChannel to propagate sign-out events.

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
