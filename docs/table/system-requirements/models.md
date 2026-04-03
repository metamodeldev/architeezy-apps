# SR-1: Models

## Scenarios

### SR-1.1: Selection

The system provides an interface to browse the repository and switch between accessible models.

#### Functional Requirements

- [FR-1.1](../functional-requirements.md#fr-1-models): Load models from the repository via a
  selection interface.
- [FR-1.4](../functional-requirements.md#fr-1-models): Manage anonymous and authenticated access to
  model repositories.

#### User Story

As a user, I want to explore available models and find the one I need, or replace my current model
with a different one.

#### Steps

1. Open the model selection interface.
   - The system displays models available to the current session (public for guests, all accessible
     for authenticated users).
2. Filter the list by entering a query in the search field.
3. Select a specific model.
   - The interface closes, the model name appears in the header, and the table view populates.

#### Edge Cases

- **No Search Matches**: A "No models found" message is displayed.
- **Empty Repository**: If no models are accessible, a notification is shown.
- **Model has no entities**: If the selected model is empty, a notification is displayed and the
  selection interface remains accessible.

### SR-1.2: Deep links

The system resolves the model and matrix configuration from URL parameters.

#### Functional Requirements

- [FR-1.2](../functional-requirements.md#fr-1-models): Synchronize the matrix configuration with URL
  parameters for sharing.

#### User Story

As a user, I want to open a shared link that loads a specific model and a pre-configured matrix
definition.

#### Steps

1. Navigate to a deep link containing a model identifier and matrix definition.
2. If the model is not publicly accessible or not found:
   - The system displays a screen stating: "Access restricted or model not found."
   - If the user is anonymous, a **"Sign In"** button is provided.
   - A recommendation to **contact the model owner** to request access is displayed.
3. Complete authentication (if required).
   - Upon successful login, the system automatically redirects back to the original deep link and
     attempts to load the model.

#### Edge Cases

- **Invalid Matrix Definition**: If the model is found but the matrix definition is unrecognized, an
  error is shown and the model loads with a default blank matrix.
- **Missing Parameters**: If the link contains only a model identifier, the model loads with a
  default blank matrix definition.

### SR-1.3: Persistence

The system remembers the last active session to allow seamless continuation of work.

#### Functional Requirements

- [FR-1.3](../functional-requirements.md#fr-1-models): Persist and restore the last-active session
  state and model selection.

#### User Story

As a user, I want the application to remember my work so I can continue where I left off after a
browser restart.

#### Steps

1. Load a model and configure a matrix definition.
2. Close and reopen the application without any URL parameters.
   - The system restores the last active model and matrix configuration from storage.

#### Edge Cases

- **Model No Longer Available**: If access is revoked, the stored reference is cleared and the
  selection interface opens.

### SR-1.4: Templates

The system allows saving, reusing, and managing matrix configurations as templates.

#### Functional Requirements

- [FR-1.5](../functional-requirements.md#fr-1-models): Provide a library of saved matrix definitions
  and templates.

#### User Story

As a user, I want to save my matrix configuration as a template so I can apply it later or remove it
when no longer needed.

#### Steps

1. Configure a matrix and click "Save as Template".
   - The system prompts for a name and saves the definition.
2. Open the Template Library.
   - The system displays a list of templates.
   - **Compatible templates** (matching the current model type) are active for application.
   - **Incompatible templates** are displayed but disabled for application.
3. Apply, Rename, or Delete a template.
   - Selecting an active template applies its axes and data settings to the current model.
   - Templates can be renamed or deleted to keep the library organized.

### SR-1.5: Access

The system manages user sessions and model visibility.

#### Functional Requirements

- [FR-1.4](../functional-requirements.md#fr-1-models): Manage anonymous and authenticated access to
  model repositories.

#### User Story

As a user, I want to manage my login status and see which models are available to me.

#### Steps

1. Observe the identity status in the header.
2. Sign in to access private models.
3. Sign out of the current session.
   - The system clears all model data from memory and opens the selection interface.

## Business Rules

- **Startup Loading Priority**:
  1. **URL parameters** (always override any previously saved state).
  2. **Browser storage** (restored only if URL is clean).
  3. **Manual selection** (fallback if no state is found).
- **Security & Discovery**: To prevent model enumeration, the system does not distinguish between
  "Model not found" and "Access restricted" for unauthorized users.
- **Template Compatibility**: Templates are tied to the **model type**. Only templates where the
  defined entity and relationship types exist in the current model's metamodel are available for
  application.
- **Incompatible Templates**: Templates that do not match the current model type remain visible for
  management purposes (rename/delete) but cannot be applied.
- **State Isolation**: Each browser tab operates independently. Persistence follows a "last write
  wins" policy across tabs.
- **Single Source of Truth**: The URL must always stay synchronized with the current matrix
  configuration to ensure shareability.

## UI/UX Functional Details

- **Feedback**: A loading indicator is shown for any operation exceeding 200ms.
- **Context Visibility**: The name of the currently loaded model and the user's login status are
  permanently visible in the header.
- **Keyboard Support**: The selection interface and library support keyboard navigation (Arrows,
  Enter, Esc).

## Technical Notes

- **Navigation**: `replaceState` is used for matrix configuration changes; `pushState` is used for
  switching models.
- **Security**: All model data is purged from application memory upon logout.
- **Concurrency**: Each fetch request uses an abort controller to ignore outdated responses.
- **Parser**: A structural parser extracts entities and relationships regardless of the underlying
  model format.
