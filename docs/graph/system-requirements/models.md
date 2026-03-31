# SR-1: Models

## Scenarios

### SR-1.1: Selection

The system provides an interface to browse the repository and switch between accessible models.

#### Functional Requirements

- [FR-1.1](../functional-requirements.md#fr-1-models): Load models from the repository via a
  selection interface.

#### User Story

As a user, I want to explore available models and find the one I need, or replace my current model
with a different one.

#### Steps

1. Open the model selection interface.
   - The system displays models available to the current session (public models plus private models
     if authenticated).
2. Filter the list by entering a query in the search field.
   - The list updates in real-time to show matching results.
3. Select a specific model.
   - The interface closes, the model name appears in the header, and the graph and table views
     populate with the data.

#### Edge Cases

- **No Search Matches**: A "No models found" message is displayed.
- **Empty Repository**: If no models are accessible, a notification is shown and the selection
  interface remains empty.
- **Model has no elements**: If the selected model is empty, a notification is displayed and the
  selection interface remains accessible.

### SR-1.2: Deep links

The system resolves the model from URL parameters and handles authentication for restricted content.

#### Functional Requirements

- [FR-1.2](../functional-requirements.md#fr-1-models): Synchronize application state with URL
  parameters for deep linking and sharing.

#### User Story

As a user, I want to open a shared link that loads a specific model, even if I need to sign in
first.

#### Steps

1. Navigate to a deep link containing a model identifier and optional state parameters.
   - If the model is public or the user is already authenticated, the system loads the model
     directly.
   - If the model is restricted and the user is anonymous, an "Access Denied" screen is shown with a
     "Sign In" option.
2. Complete the authentication flow (if required).
   - Upon successful login, the system automatically redirects back to the original deep link and
     loads the requested model.

#### Edge Cases

- **Invalid Link**: If the model identifier is unrecognized, an error notification is shown and the
  manual selection interface opens.
- **Session Expiration**: If the session expires while working on a private model, the next data
  request triggers an "Access Denied" screen or a login prompt.
- **Missing Parameters**: If the deep link contains a model identifier but no view parameters
  (filters, mode), the model loads with **clean default settings**, ignoring any previously saved
  state in browser storage.

### SR-1.3: Persistence

The system remembers the last active session to allow seamless continuation of work.

#### Functional Requirements

- [FR-1.3](../functional-requirements.md#fr-1-models): Persist and restore the last-active session
  state.

#### User Story

As a user, I want the application to remember my work so I can continue where I left off after a
browser restart.

#### Steps

1. Load a model and apply specific filters or change the view mode.
   - The system saves the model identifier and the current view configuration to browser storage.
2. Close the application and reopen it without any model-specific parameters in the URL.
   - The system identifies the last active session from storage and automatically initiates the
     loading process.
3. Observe the restored interface.
   - The application displays the previously viewed model with all filters and view settings exactly
     as they were at the end of the previous session.

#### Edge Cases

- **Model No Longer Available**: If the stored model is missing or access is revoked, the stored
  reference is cleared and the manual selection interface opens.
- **Inaccessible Storage**: If storage is empty or blocked, the manual selection interface opens.

### SR-1.4: Navigation

The system synchronizes the application state with the browser's history, enabling "Back" and
"Forward" navigation.

#### Functional Requirements

- [FR-1.4](../functional-requirements.md#fr-1-models): Provide navigation history to move between
  previously viewed states.

#### User Story

As a user, I want to use browser navigation buttons to move between different view modes and models.

#### Steps

1. Switch the view mode (e.g., from Graph to Table or enter Drill-down).
   - The URL updates and a new entry is added to the navigation history.
2. Adjust filters or sorting parameters.
   - The URL updates to reflect the change, but the browser's navigation history is not extended.
3. Click the browser's "Back" button.
   - The system reverts to the previous view mode or model. Minor adjustments (filters) made before
     the view switch are skipped.

#### Edge Cases

- **Rapid Navigation**: If navigation buttons are clicked multiple times quickly, the system
  resolves only the final destination state.

### SR-1.5: Access

The system manages user sessions and session-dependent model visibility.

#### Functional Requirements

- [FR-1.5](../functional-requirements.md#fr-1-models): Manage anonymous and authenticated access to
  model repositories.
- [FR-1.6](../functional-requirements.md#fr-1-models): Provide session management and user identity
  display.

#### User Story

As a user, I want to manage my login status and see which models are available to me.

#### Steps

1. Observe the identity status in the header.
   - The header displays the user's name/avatar or a guest status.
2. Sign out of the current session.
   - If a private model was open, the system closes it, clears its data from memory, and opens the
     selection interface.
   - If a public model was open, it remains visible.

## Business Rules

- **Startup Loading Priority**:
  1. URL parameters (Deep link).
  2. Local browser storage (Persistence).
  3. Manual selection interface (Fallback).
- **View State Definition**: The "View State" consists of active filters, view mode (Graph or
  Table), and the drill-down context. It does not include transient UI data such as zoom level or
  sidebar scroll position.
- **Persistence Policy**: The current model identifier and its View State are saved to
  `localStorage` only after a successful data fetch. These settings are tied to the **browser**, not
  the user account; signing out does not clear saved filter preferences for public models.
- **State Isolation**: View settings are namespaced by **model type**. Filters applied to one model
  automatically apply to all other models of the same type but do not affect models of a different
  type.
- **Multi-Tab Behavior**:
  - Each browser tab operates independently. Changes in one tab do not trigger updates in other open
    tabs.
  - Persistence follows a "last write wins" policy: the last tab to modify the state determines what
    will be restored upon the next application launch.
- **Single Source of Truth**: The URL must always be synchronized with the current application state
  to ensure shareability.

## UI/UX Functional Details

- **Feedback**: A loading indicator is displayed for any operation exceeding 200ms.
- **Filter Visibility**: Active filters must be clearly indicated in the UI (e.g., via badges or
  highlighted sidebar sections) so that the user is aware of the current view constraints when
  switching models.
- **Context Visibility**: The name of the currently loaded model is permanently displayed in the
  header and serves as the trigger for model switching.
- **Identity Display**: The user’s login status is permanently visible in the header.
- **Keyboard Support**: The selection interface supports full keyboard navigation (Arrows, Enter,
  Esc).

## Technical Notes

- **Navigation**: `pushState` is used for major transitions (Model change, Graph/Table switch,
  Drill-down). `replaceState` is used for minor adjustments (filters, sorting).
- **Storage**: `localStorage` is used for all persistent settings.
- **Auth Redirect**: The system stores the target URL during the authentication flow to enable
  redirection back to the deep link.
- **Security**: Upon Logout, all non-public model data must be explicitly purged from the
  application memory.
- **Concurrency**: Each fetch request uses a unique ID or abort controller to ignore outdated
  responses.
