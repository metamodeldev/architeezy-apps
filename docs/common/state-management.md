# State Management & Data Persistence Conventions

**Scope**: These standards govern client-side state management, browser storage usage, and URL-based
state encoding in web applications.

## Core Principles

- **Minimal Persistent State**: Only store what's necessary for user convenience or deep linking;
  avoid redundant caches
- **Graceful Degradation**: Application must function when storage is unavailable, corrupted, or
  disabled
- **URL as Source of Truth for Shareable State**: Use URL parameters to encode state that users may
  want to bookmark or share
- **Separation of Concerns**: Distinguish between transient UI state, persistent user preferences,
  and shareable application state
- **Type Safety**: All stored and URL-encoded values must have defined types and validation

## Storage Keys & Schemas

All storage keys should follow a naming convention to avoid collisions.

### Defined Keys

Define your application's storage keys in a central configuration. Each setting should have its own
dedicated key rather than grouping all preferences into a single JSON object.

The ecosystem follows a **two-tier key structure**:

1. **Shared Settings** (common prefix) — settings that should be consistent across all applications
2. **App-Specific Settings** (app prefix) — settings unique to each application to avoid key
   collisions

**Key Naming Rules**:

- Shared settings: prepend a common prefix that is the same for all applications
- App-specific settings: prepend a unique application identifier
- Use `camelCase` for multi-word names
- Keep keys concise but clear
- Maintain a central constant/file in your codebase that enumerates all storage keys used by the
  application

Each application defines its own set of app-specific keys based on its needs. The shared prefix is
decided at the ecosystem level and remains constant across all applications.

### Namespacing Within App-Specific Keys

If your application stores complex state (e.g., filters for multiple views), use namespacing within
the prefixed key to isolate preferences:

```json
{
  "viewA": {
    /* settings for view A */
  },
  "viewB": {
    /* settings for view B */
  }
}
```

This ensures preferences for one context don't affect another within the same application.

### Storage Access Requirements

- All storage operations must include error handling to gracefully handle unavailable storage, quota
  exceeded, or other failures
- Missing keys should be treated as absence of data; provide appropriate defaults
- All data deserialization must include validation and corruption recovery
- Never assume storage operations succeed; always handle failures gracefully

## 3. Safe Storage Operations

### Reading Values

All reads must:

- Include error handling to catch storage access failures
- Provide appropriate default when data is missing or key does not exist
- Log errors with sufficient context for debugging
- Never allow read errors to crash the application

### Writing Values

All writes must:

- Include error handling to handle storage write failures
- Log warnings on failure for diagnostics
- Optionally inform user via toast if persistence failure is critical
- Never allow write errors to block UI progression

### Data Deserialization & Recovery

When deserializing stored data:

- Always include error handling
- On deserialization error: log the corruption, clear the affected storage key, continue with
  default/fallback value
- Provide user notification for non-critical data (e.g., filter preferences) but not for internal
  state

### Recovery Steps

- On deserialization error: log, clear the corrupted key, continue with defaults
- For user preferences: show toast "Preferences could not be restored and have been reset"
- For system settings: silently fall back to safe defaults
- Never allow storage corruption to crash the application

## URL State Encoding

### Purpose

URL parameters encode shareable, bookmarkable application state, such as:

- Resource identifiers (which item to display)
- View mode or layout preferences
- Filter criteria and search queries
- Pagination or navigation state

### Parameter Design Guidelines

1. **Keep URLs concise**: Only include non-default values
2. **Use standard encoding**: Use platform-provided utilities for URL parameter encoding
3. **Validate on decode**: Check types and ranges; ignore invalid values
4. **Document parameters**: Maintain a reference of all supported parameters
5. **Consider relationship between URL and storage**: URL for shareable state, storage for user
   preferences

### Example Parameter Patterns

```javascript
// Resource identification
?itemId=123

// View mode
?view=list&sort=name&order=asc

// Filters (whitelist or blacklist approach)
?show=active,completed&hide=archived

// Pagination
?page=2&limit=50

// Complex state (encoded as JSON or base64)
?filters={"status":"open","priority":"high"}
```

### Decoding & Application

1. Parse query string on startup or `popstate` event
2. Validate values against expected types and ranges
3. Apply state after dependencies are ready (e.g., after data loads)
4. Ignore unknown or invalid parameters; log for debugging
5. Provide fallbacks when referenced resources don't exist

### URL vs Storage

- **URL**: Encodes shareable, bookmarkable state; changes should create history entries when
  initiated by user
- **Storage**: Stores user preferences, temporary state that shouldn't be bookmarked
- **Rule of thumb**: If a user might want to share a link that reproduces the current view, put it
  in the URL

## Theme & User Preference Persistence

### Restoration Timing

User preferences that affect rendering (theme, font size, language) should be restored during
**initial bootstrap** before content renders to prevent visual flash or layout shift. This can be
achieved through:

- Inline script in HTML `<head>` that reads from storage and applies preferences
- Server-side rendering that reads cookies or requests preferences early
- CSS custom properties that are set before stylesheets load

The script should:

- Attempt to read preference from storage
- Validate the value against allowed options
- Apply the preference (set data attribute, class, or CSS variable)
- Fail silently on errors, falling back to defaults
- Make the preference available to subsequent initialization code

### Update on Change

When user changes a preference:

1. Validate the new value
2. Apply it to the UI immediately
3. Save to storage with error handling
4. Update any related UI state (toggle buttons, menus)
5. Animate transitions if appropriate

### System Preference Integration

For theme preferences that support "system" mode:

- Use CSS media queries (`prefers-color-scheme`, `prefers-reduced-motion`)
- No JavaScript detection needed; CSS handles automatically
- System preference changes automatically update UI when system mode is selected

## State Persistence Patterns

### Structure & Namespacing

Use namespacing to isolate preferences by context, preventing cross-contamination:

```javascript
const state = {
  projects: { filter: 'open', sort: 'name' },
  reports: { filter: 'monthly', groupBy: 'team' },
};
```

### Loading Pattern

1. Retrieve serialized state from storage
2. Parse with error handling (see Corruption Recovery)
3. Extract namespace for current context
4. Apply state to application
5. Update UI controls to reflect loaded state

### Saving Pattern

- Debounce writes (50-100ms) to avoid excessive storage operations
- Serialize state to JSON
- Write atomically to a single key
- Wrap in error handling to catch storage failures

### Corruption Recovery

If JSON parse fails:

- Log error with context
- Clear the corrupted key
- Continue with default/empty state
- Optionally notify user for non-critical preferences
- Never allow corruption to crash the application

## Resource & Content Persistence

### Common Patterns

Store references to resources that users may want to revisit:

- **Last viewed item**: Identifier of most recently accessed content
- **Recent items list**: Array of recently viewed/used items (keep recent N)
- **Resource metadata**: Display name, thumbnail, or other cacheable info shown while loading

### Setting Values

After successful operation completes:

- Save identifier and any helpful metadata to storage
- UI components use these to restore state or show previews

### Clearing Stale Data

Clear stored references when:

- Resource no longer exists (404, deletion)
- Data is stale beyond acceptable age
- User explicitly clears storage or resets preferences
- During recovery from corruption

## Storage Safety Checklist

All storage operations must:

- Include error handling for storage failures
- Validate values before writing (type checks, allowed values)
- Handle deserialization errors with fallback to defaults
- Log errors with context for debugging
- Not block UI on storage operations
- Clear corrupted data rather than propagate errors
- Use namespaced/prefixed keys to avoid collisions
- Consider using abstractions that centralize error handling

## Multi-Tab Synchronization

**Current Status**: Optional enhancement; not required for basic applications.

**Considerations**:

- Implement a mechanism to detect storage changes from other contexts
- Decide which state should synchronize (theme, preferences, etc.)
- Race conditions: last-write-wins; consider timestamps or versioning for conflicts
- Debounce updates to avoid excessive cross-context communication
- Be aware that change notifications typically don't fire for changes made by the current context

## Testing State Management

Test scenarios:

- Storage disabled: app functions but preferences don't persist
- Corrupted JSON: recovery flow works, notification shown if appropriate
- Invalid values: defaults applied when stored values are invalid
- URL parameters: all combinations decode correctly; invalid values ignored
- Deep linking: resource IDs open correct content; filters apply after load
- Concurrent tab modifications: behavior when storage changes in another tab

## Future Enhancements

- **IndexedDB**: For larger or complex structured state; offline caching
- **Session vs persistent**: Use session-scoped storage for temporary state and persistent storage
  for long-term preferences
- **Encryption**: Consider encryption for sensitive data (user tokens, personal info)
- **Migration**: Version stored state to handle schema changes (use `{version: 1, data: ...}`)
- **Expiration**: Time-to-live for cached data that should eventually expire
- **Server sync**: Consider syncing preferences to user account for cross-device consistency
