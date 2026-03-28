# Authentication Specification

## Overview

This document defines standards for authentication mechanisms in web applications built with this
framework. It covers secure token handling, user experience patterns, and integration requirements.

**Scope:** Client-side authentication flows, token management, and API request authentication.

**Out of scope:** Backend authentication implementation, OAuth provider configuration, password
policies.

## Security Principles

### Token Storage

- **Memory-only storage:** Authentication tokens should be stored in JavaScript variables, not in
  `localStorage` or cookies, to prevent XSS-driven theft via persistent storage.
- **Trade-off:** Users must authenticate again on each page load (session not persistent).
- **Alternative for low-risk environments:** For internal deployments with low XSS risk, session
  storage or secure HttpOnly cookies may be appropriate.

### Token Transmission

- Use `Authorization: Bearer <token>` header for API requests when a token is present.
- Use `credentials: 'include'` for same-origin deployments with cookie-based sessions.
- All traffic must use HTTPS exclusively.

### Token Lifetime

- Backend manages token expiry; frontend does not refresh tokens automatically.
- Expired tokens result in HTTP 401 responses; the application should clear the token and prompt the
  user to re-authenticate.

## User Interface

### Anonymous State

- Show a "Sign in" or "Log in" button in a consistent location (typically header).

### Authenticated State

- Display the current user's display name (fetched from a user profile endpoint).
- Show a "Sign out" or "Log out" button.

## Authentication Flow

### Popup-Based Flow (Recommended for Cross-Origin)

1. User clicks "Sign in" → application opens a popup window to the authentication endpoint.
2. User authenticates in the popup (enter credentials, consent, etc.).
3. Upon success, the auth service delivers tokens to the opener via `postMessage`:

   ```javascript
   window.opener.postMessage(
     { type: 'AUTH_SUCCESS', token: accessToken, idToken: idToken },
     expectedOrigin, // use specific origin in production, not '*'
   );
   ```

4. The opener receives the tokens:
   - Stores the token in memory.
   - Closes the popup.
   - Fetches the user's profile to display name.
   - Updates the UI to authenticated state.
   - May refresh data that depends on authentication context.

### Iframe-Based Flow (Alternative)

- Load the auth service in a hidden iframe and communicate via `postMessage`.
- Advantage: no popup blockers; disadvantage: more complex state management.

### Redirect-Based Flow (For Server-Side Auth)

- Application redirects to auth endpoint; upon success, the server redirects back with a one-time
  code or token in the URL fragment or query parameter.
- The application exchanges the code for a token via a backend endpoint (recommended) or extracts
  token directly if safe.

### Edge Cases

- **Popup blocked:** Detect when popup fails to open and inform the user to enable popups or use an
  alternative flow.
- **postMessage from unexpected origin:** Validate the origin before accepting auth messages.
- **Network failure during profile fetch:** Proceed in authenticated state with a placeholder name
  rather than blocking the user.
- **Multiple tabs:** Each tab maintains its own auth state. Broadcast channels or storage events can
  be used to synchronize auth state across tabs if needed.

## Token Expiry Handling

When an API request returns HTTP 401 Unauthorized:

1. Clear the token from memory immediately.
2. Reset the UI to anonymous state.
3. Optionally, show a notification prompting the user to sign in again.
4. If a model or data is currently displayed, keep it visible (do not force a reload).

## Sign-Out

User clicks "Sign out":

1. Remove the token from memory.
2. Update the UI to show the anonymous state.
3. Optionally clear cached data that requires authentication to access.
4. Do not clear unrelated persisted state (e.g., filter preferences, theme).

## API Integration

### Authenticated Requests

All API requests should be routed through a central client function:

- If a token exists in memory, include `Authorization: Bearer <token>` header.
- For anonymous requests, omit the Authorization header.
- Include `credentials: 'include'` when using cookie-based sessions on same origin.
- Centralize error handling to catch 401 responses and trigger token clearance.

### User Profile Endpoint

To display the signed-in user's name, applications may call:

- `GET /api/users/current` (or equivalent) returns the current user's display name and profile.
- This call should be made after successful authentication to populate the UI.

## State Persistence Considerations

- Authentication state is typically volatile and cleared on page reload for security.
- UI preferences (filters, theme, layout) are independent and may be persisted via localStorage or
  sessionStorage.
- If a persisted model reference exists, application may automatically load it after sign-in if it
  was previously inaccessible anonymously.

## Business Rules

- Sign-in is required only for resources with restricted access; public resources remain accessible
  anonymously.
- The application never stores user credentials; only tokens provided by an authentication service.
- All authentication communication should occur over HTTPS.
- Tokens should have appropriate lifetimes and scopes defined by the backend.
- Consider implementing refresh token flows if persistent sessions are required (use secure
  storage).
