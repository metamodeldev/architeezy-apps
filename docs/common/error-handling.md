# Error Handling & System Recovery Strategy

**Scope**: These standards define consistent approaches to error handling in web applications,
ensuring graceful degradation and clear user communication when failures occur.

## Core Principles

All error handling must follow these principles:

1. **Graceful Degradation**: Keep the application functional when possible; don't crash on
   recoverable errors
2. **User-Friendly Messages**: Avoid technical jargon in user-facing text; explain what happened in
   plain language
3. **Recovery Paths**: Guide users toward next steps; provide clear actions (Retry, Choose Again,
   etc.)
4. **Context Preservation**: Never lose user work without explicit confirmation; maintain current
   state on errors when possible
5. **Severity Distinction**: Differentiate between fatal (blocking) and non-fatal (recoverable)
   errors; use appropriate presentation patterns
6. **Logging**: All errors should be logged with appropriate context for debugging

## Error Categories & Presentation

| Category             | Severity            | Presentation Pattern                     | Recovery Strategy                   | Examples                              |
| -------------------- | ------------------- | ---------------------------------------- | ----------------------------------- | ------------------------------------- |
| **Network**          | Non-fatal           | Toast notification                       | Retry operation; keep current state | API request fails, timeout, 404/500   |
| **Initialization**   | Fatal               | Full-screen overlay                      | Retry initialization or abandon     | Catalog fetch failure on first load   |
| **Data Corruption**  | Non-fatal           | Toast + auto-recovery                    | Clear corrupted data; use defaults  | localStorage/JSON parse errors        |
| **Component Render** | Fatal for component | Return to safe state or alternative view | Choose different content or retry   | Visualization library failure         |
| **Storage Access**   | Non-fatal           | Silent fallback (optional toast)         | Continue without persistence        | localStorage disabled, quota exceeded |
| **Validation**       | Non-fatal           | Inline error or toast                    | Correct input and retry             | Form validation failures              |

## Standard Presentation Patterns

### Toast Notifications (Non-Fatal Errors)

**Use When**: User can continue using the application; error is informative

**Requirements**:

- Top-right corner positioning; stack maximum 3 visible (oldest auto-dismissed when limit exceeded)
- Auto-dismiss after 5-7 seconds; manual close button always available
- Distinct styling: error type uses red border/accent; success uses green; info uses neutral
- Slide-in animation on appearance
- Must have `role="alert"` or `aria-live="assertive"` for screen reader announcement
- Should not obscure critical UI elements; z-index above content but below modals

**Message Guidelines**:

- Error: "HTTP 404 — Model not found" NOT "TypeError: Failed to fetch"
- Be specific enough to be helpful but not expose implementation details
- Include actionable information if available

### Full-Screen Error Overlay (Fatal Errors)

**Use When**: Application cannot proceed without retry; blocks all interaction

**Requirements**:

- Semi-transparent dark overlay covering entire viewport
- Centered error container with icon, heading, and descriptive message
- Prominent Retry button that re-initializes the failed operation
- Loading indicators must be hidden before showing error
- Focus should move to error message and be trapped while overlay visible (user cannot tab to
  background)
- Background interaction completely blocked
- Only dismissible via Retry button (if successful) or page reload

**Message Guidelines**:

- Clear, non-technical explanation
- Include what the user can do (e.g., "Check your network connection and try again")
- Not blame the user ("Server error" not "You entered invalid data" if server is at fault)

### In-Modal Error Display

**Use When**: Error occurs within modal workflow (e.g., model list fetch fails while modal open)

**Requirements**:

- Error message replaces or overlays normal modal content
- Retry button within modal
- Modal remains open; user can retry or dismiss modal entirely
- Loading state transitions to error state cleanly

## Specific Error Scenarios & Handling

### Catalog/List Fetch Failure (Initialization)

**Scenario**: Application cannot load the initial catalog or list of items on first launch.

**Severity**: Fatal

**Handling**:

- Hide loading indicators immediately
- Show full-screen error overlay with clear message
- Provide Retry button that re-initializes the application
- Log error with full context (endpoint, operation)
- Consider offline support in future (IndexedDB cache)

### Content Load Failure

**Scenario**: Selected content fails to load (network error, 404, parse error, invalid data).

**Severity**: Depends on context:

- Fatal if no content currently displayed (initial load)
- Non-fatal if content already shown (user can continue with current view)

**Handling**:

1. Hide loading indicator
2. Check if valid content is currently displayed
3. If content exists: show toast notification; keep current content; user can retry later
4. If no content: clear stored reference, return to selection flow
5. Log error with appropriate detail level

**Edge Cases**:

- Concurrent/rapid selections: implement request cancellation or "latest wins" to avoid race
  conditions
- Empty or invalid content after parsing: treat as failure, validate structure after parsing
- Parse errors: catch and treat as load failure; distinguish in logs but not necessarily in UI

### Component Rendering Failure

**Scenario**: A UI component or visualization library fails to initialize.

**Severity**: Fatal for that component/view

**Handling**:

- Catch errors from component initialization
- Treat as content load failure for that component
- Show appropriate fallback (alternative view, safe state)
- Clear any cached data related to that component if necessary
- Log detailed error (library status, configuration)

**Future Enhancement**: Implement graceful fallback to alternative presentation (e.g., table-only
when graph fails).

### Storage Corruption

**Scenario**: Data in localStorage becomes corrupted, causing JSON parse errors.

**Affected Keys**: Any keys storing JSON data

**Severity**: Non-fatal

**Handling**:

- All storage reads wrapped in `try/catch`
- On `JSON.parse()` failure: log, clear the corrupted key, continue with defaults
- For user preferences: show toast notification "Preferences could not be restored and have been
  reset"
- For other data: silent fallback to defaults
- Never let storage corruption crash the application

**Design Consideration**: Storing all data in a single key risks complete loss on corruption.
Consider namespacing keys to isolate failures.

### Storage Access Failures

**Scenario**: Storage is disabled, full, or throws on write.

**Severity**: Non-fatal

**Handling**:

- All storage writes wrapped in `try/catch`
- On error: log warning, continue without persistence
- Optionally show non-blocking notification that preferences won't persist
- Feature continues; only persistence is affected

## Network Request Pattern

All network operations should follow this consistent pattern:

1. Show loading indicator before initiating request
2. Perform the fetch; check for HTTP errors (non-2xx status codes)
3. Parse response data and validate structure if needed
4. In catch or after HTTP error: log with context (URL, operation), re-throw or propagate
5. Always hide loading indicators in a finally-like manner (both success and error)
6. Caller (higher level) determines user-facing presentation based on severity
7. Do not swallow errors at the low-level; let callers decide recovery

**Key Principles**:

- Loading indicators: show before, hide after (success or failure)
- Treat HTTP errors as errors even if response body is useful
- Log context: endpoint, operation purpose, relevant identifiers
- Separation of concerns: low-level fetch handles mechanics; higher-level determines UX
- Never silently ignore errors; if caught, ensure appropriate recovery

## Error Logging Standards

- Prefix logs with application name or subsystem tag for filtering (e.g., `[myapp]`)
- Include contextual information: operation, resource ID, user state when helpful
- Consider integration with error monitoring service (Sentry, LogRocket) in production
- Use appropriate log level: `console.error` for failures, `console.warn` for recoverable issues
- Include stack traces for unexpected errors; omit for expected/handled errors

## User-Friendly Message Guidelines

**DO**:

- "Could not load content. Check your connection and try again."
- "The selected item is no longer available. Choose another."
- "Your preferences could not be restored and have been reset."
- Be concise but informative; explain what happened and what user can do

**DON'T**:

- Expose raw error objects or stack traces to users
- Use vague messages like "Something went wrong" without recovery guidance
- Use technical jargon: "SyntaxError", "TypeError", "HTTP 500"
- Blame the user unless truly their fault (validation errors, etc.)

## Recovery Flow Patterns

### Retry Pattern

For errors that may be transient:

- Display appropriate error UI (full-screen overlay or inline error)
- Provide a Retry button that re-invokes the failed operation from the beginning
- Optionally include information about what went wrong and what user can do

### Fallback with State Preservation

When an error occurs during an operation:

- If valid current state exists, show notification and preserve state; user can retry later
- If no valid state exists, initiate appropriate recovery flow (e.g., return to selector)

### Automatic Recovery from Corruption

For expected corruption scenarios:

- Try to read data
- If data is missing or corrupted, use defaults silently
- Log the incident for diagnostics
- Continue application flow without interruption
- Notify user for non-critical preference corruption

## Testing Error Scenarios

Test suite must cover:

- Network failures: DNS, timeout, 404, 500, connection lost
- Corrupted storage data: invalid JSON, malformed entries
- Third-party library failures: script not loaded, initialization errors
- Concurrent operations and race conditions
- Storage disabled or quota exceeded
- Modal dismissal during loading operations
- Recovery paths: retry, fallback state, alternative views
- Component-specific failures: canvas/rendering errors, dependency missing

## Implementation Checklist

Before releasing features check the following:

- All async operations have try/catch with appropriate error handling
- Loading indicators shown before operation and hidden in finally
- Errors classified by severity (fatal vs non-fatal)
- Appropriate presentation pattern selected (toast vs full-screen vs inline)
- User messages reviewed for clarity and actionability
- Errors logged with sufficient context for debugging
- Current application state preserved on non-fatal errors
- No unhandled promise rejections in console
- Storage operations wrapped with error handling
- Network errors distinguished from parse/validation errors
