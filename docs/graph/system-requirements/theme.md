# SR-6: Theme Management

**Functional Requirements**: [FR-6.1, FR-6.2](../functional-requirements.md#fr-6-theme-management)

## User Stories

- As a user, I want to switch between dark, light, and system theme preferences so I can work
  comfortably in different lighting conditions.
- As a user, I want my theme preference to be remembered across sessions so I don't have to change
  it every time I use the application.

## Acceptance Criteria

- SR-6.1: Theme switcher UI allows selection of dark, light, or "system" mode
- SR-6.2: Theme preference persists across browser sessions
- SR-6.3: All UI components respect the selected theme with consistent colors
- SR-6.4: User can switch themes and see the change apply across the application
- SR-6.5: Graph elements remain clearly visible in both themes

## Scenario

### Preconditions

- User has the application loaded in a browser
- The current theme is either the default or a previously saved preference
- Page has fully rendered with current theme applied

### Steps

1. **Initial Theme Application**
   - On app startup, check for stored theme preference
   - If no preference stored, detect system theme preference (prefers-color-scheme)
   - Apply selected theme to document root
   - Render UI with theme-appropriate colors

2. **Theme Switch via UI**
   - User opens theme selector from settings menu or header
   - Available options displayed: Light, Dark, System
   - Current selection is indicated as active/checked
   - User selects a different theme

3. **Theme Application**
   - Theme preference is saved immediately to browser storage
   - Root element's data-theme attribute or CSS class is updated
   - All CSS custom properties for colors are recalculated based on new theme
   - Graph styles are refreshed to pick up theme changes

4. **System Theme Response (if "System" selected)**
   - Application listens for system theme change events (prefers-color-scheme)
   - If system theme changes while app is running, theme updates automatically
   - Graph is notified and refreshes styles accordingly

5. **Graph Theme Update**
   - Cytoscape graph styles reference CSS custom properties for theme-dependent colors
   - When theme changes, an explicit style refresh is called to update graph colors
   - Node colors, edge colors, background, and label styles adapt appropriately

6. **Persistence**
   - Theme selection is saved to browser storage with a namespaced key
   - On next page load, stored theme is retrieved and applied before first render
   - Theme appears consistent on page reload

### Expected Results

- Theme changes apply instantly across all UI elements
- No content flashes with wrong theme during transition
- Graph maintains visual quality in both dark and light modes
- All interactive elements (buttons, inputs, tables) have appropriate colors
- Text remains readable with sufficient contrast in both themes
- Theme persists across browser restarts and new tabs
- "System" option correctly follows OS theme setting

### Edge Cases

- **Browser storage unavailable or full**
  - Theme changes still work for current session
  - Theme may not persist across reload; user sees warning or defaults to system

- **Corrupted theme value in storage**
  - Falls back to default (system or light)
  - Storage key is cleared or replaced with valid value
  - No error shown to user

- **Graph not yet initialized when theme changes**
  - Theme preference still saved
  - Graph correctly applies theme when it initializes later

- **User changes theme rapidly multiple times**
  - Only final selection persists
  - No performance degradation or flicker
  - Theme value updates are debounced if necessary

- **System theme change while in "System" mode**
  - Application updates theme smoothly
  - Graph theme refreshes correctly

- **Multiple tabs with different themes**
  - Each tab maintains independent theme state
  - Changes in one tab do not affect others (storage event handling optional)

## Business Rules

### Theme Value Options

- Valid theme values: `"light"`, `"dark"`, `"system"`
- `"system"` defers to browser's color scheme preference detection

### Storage Key Namespace

- Theme preference stored under a namespaced key (e.g., `architeezy.theme`) in localStorage
- Key follows project standard for storage naming

### Graph Styling Integration

- Graph CSS custom properties must be defined for both themes
- Cytoscape stylesheet references these CSS variables
- Theme change triggers explicit style refresh to pick up variable changes

## UI/UX

### Responsiveness and Smoothness

- Theme selection immediately applies across the entire application.
- Theme-switching does not cause flicker or visual artifacts.
- Theme is applied before first paint to avoid flash of incorrect theme on initial load.

### Visual Design

- Theme switcher is a dropdown or segmented control in the header or settings panel.
- Options clearly labeled with icons or text: "Light", "Dark", "System".
- Current selection is visually indicated (checkmark, highlight, or radio state).
- Theme change feels instantaneous with no loading indicators.
- All UI components respect the selected theme with consistent colors.
- Graph elements (nodes, edges, labels) remain clearly visible in both themes.
- Text remains readable with sufficient contrast in both themes.

### Dialogs/Confirmation

- No dialogs or confirmations needed before/after theme switch.

## Technical Notes

### CSS Custom Properties

Themes are implemented using CSS custom properties (variables) on the `:root` element. All UI
components use these variables instead of hardcoded colors.

### Theme Detection and Application

On app startup, check for stored theme preference. If no preference stored, detect system theme
preference using browser APIs. Apply selected theme to document root before first render.

### Graph Theme Refresh

When theme changes, Cytoscape styles must be explicitly refreshed since the library reads CSS custom
properties at style() time, not render time.

### Storage Pattern

Follow the project's `common/state-management.md` guidelines for storage operations:

- Use namespaced keys
- Wrap storage access with error handling
- Debounce writes if appropriate
- Handle browser-specific storage restrictions gracefully

### System Theme Listener (optional)

If "System" mode is supported, add a listener for system theme change events to automatically update
theme when OS preference changes.
