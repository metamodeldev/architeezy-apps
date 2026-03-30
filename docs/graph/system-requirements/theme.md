# SR-6: Theme Management

**Functional Requirements**: [FR-6.1, FR-6.2](../functional-requirements.md#fr-6-theme-management)

## User Stories

- As a user, I want to switch between dark, light, and system theme preferences so I can work
  comfortably in different lighting conditions.
- As a user, I want my theme preference to be remembered across sessions so I don't have to change
  it every time I use the application.

## Acceptance Criteria

- [SR-6.1](#sr-61-theme-switcher-ui-allows-selection-of-dark-light-or-system-mode): Theme switcher
  UI allows selection of dark, light, or "system" mode
- [SR-6.2](#sr-62-theme-preference-persists-across-browser-sessions): Theme preference persists
  across browser sessions
- [SR-6.3](#sr-63-all-ui-components-respect-the-selected-theme-with-consistent-colors): All UI
  components respect the selected theme with consistent colors
- [SR-6.4](#sr-64-user-can-switch-themes-and-see-the-change-apply-across-the-application): User can
  switch themes and see the change apply across the application
- [SR-6.5](#sr-65-graph-elements-remain-clearly-visible-in-both-themes): Graph elements remain
  clearly visible in both themes

## Scenarios

### SR-6.1: Theme switcher UI allows selection of dark, light, or "system" mode

#### Preconditions

- Application is loaded in a browser
- Theme has been applied (either default or previously saved preference)
- Theme switcher is accessible from the header or settings panel

#### Steps

1. **Open the Theme Switcher**
   - User opens the theme selector from the settings menu or header
   - Three options are displayed: Light, Dark, System
   - The currently active option is visually indicated (e.g., checkmark or highlight)

2. **Select a Different Theme**
   - User selects a theme option not currently active
   - The selected option becomes visually indicated as active
   - The theme applies immediately across the application

3. **Select "System" Mode**
   - User selects the "System" option
   - The application defers to the operating system's color scheme preference
   - The correct theme for the current OS setting is applied immediately

#### Edge Cases

- **User changes theme rapidly multiple times** — only the final selection persists; no performance
  degradation or flicker

### SR-6.2: Theme preference persists across browser sessions

#### Preconditions

- Application is loaded
- User has previously selected a non-default theme (e.g., Dark)
- Browser storage is available

#### Steps

1. **Select a Theme**
   - User selects "Dark" from the theme switcher
   - Theme applies immediately
   - Preference is saved to browser storage

2. **Close and Reopen the Application**
   - User closes the browser tab and reopens the application
   - The previously selected theme is applied before the first render
   - No flash of a different theme occurs on load

3. **Verify Persistence Across New Tabs**
   - User opens the application in a new tab
   - The saved theme preference is loaded and applied

#### Edge Cases

- **Browser storage unavailable or full** — theme changes still work for the current session; theme
  may not persist across reload; user sees warning or defaults to system
- **Corrupted theme value in storage** — falls back to default (system or light); no error shown to
  user
- **Multiple tabs with different themes** — each tab maintains independent theme state; changes in
  one tab do not affect others (storage event handling optional)

### SR-6.3: All UI components respect the selected theme with consistent colors

#### Preconditions

- Application is loaded with a theme applied
- Various UI components are visible: buttons, inputs, tables, panels, dialogs

#### Steps

1. **Switch to Dark Theme**
   - User selects "Dark" from the theme switcher
   - All UI components (buttons, inputs, tables, sidebar, header) update to dark-themed colors
   - Text remains readable with sufficient contrast

2. **Switch to Light Theme**
   - User selects "Light" from the theme switcher
   - All UI components update to light-themed colors
   - Text remains readable with sufficient contrast

3. **Verify Interactive Elements**
   - User interacts with buttons, inputs, and dropdowns in both themes
   - All interactive elements have appropriate colors in each theme
   - No components retain colors from a previous theme

#### Edge Cases

- **Graph not yet initialized when theme changes** — theme preference is still saved; graph
  correctly applies the theme when it initializes later

### SR-6.4: User can switch themes and see the change apply across the application

#### Preconditions

- Application is loaded with all major views accessible
- Current theme is "Light"

#### Steps

1. **Switch Theme**
   - User selects "Dark" from the theme switcher
   - Theme change applies instantly across the entire application
   - No loading indicators appear during the transition

2. **Verify No Flicker**
   - The transition does not produce visual artifacts or content flashing
   - Theme-switching does not cause any layout shifts or loading states

3. **Switch Theme Again**
   - User selects "Light" from the theme switcher
   - Application returns to the light theme immediately
   - All elements update consistently

#### Edge Cases

- **User changes theme rapidly multiple times** — only the final selection persists; no performance
  degradation or flicker; theme value updates are debounced if necessary

### SR-6.5: Graph elements remain clearly visible in both themes

#### Preconditions

- Application is loaded with a model containing nodes and edges
- Graph view is active and elements are visible

#### Steps

1. **View Graph in Light Theme**
   - User selects "Light" theme
   - Graph node colors, edge colors, background, and labels are clearly visible
   - Node and edge labels are readable against the light background

2. **Switch to Dark Theme**
   - User selects "Dark" theme
   - Graph updates to use dark-theme-appropriate colors
   - Node colors, edge colors, and labels remain clearly visible against the dark background

3. **Verify System Theme Follows OS**
   - User selects "System" mode
   - Graph renders appropriately for the current OS color scheme
   - If OS theme changes while the app is running, the graph updates automatically

#### Edge Cases

- **System theme change while in "System" mode** — application updates theme smoothly; graph theme
  refreshes correctly

## Business Rules

### Theme Value Options

- Valid theme values: `"light"`, `"dark"`, `"system"`
- `"system"` defers to browser's color scheme preference detection

### Storage Key Namespace

- Theme preference is stored under a namespaced key in browser storage
- Key follows project standard for storage naming

### Graph Styling Integration

- Graph CSS custom properties must be defined for both themes

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

- Use namespaced keys (e.g., `architeezy.theme`)
- Wrap storage access with error handling
- Debounce writes if appropriate
- Handle browser-specific storage restrictions gracefully

### System Theme Listener (optional)

If "System" mode is supported, add a listener for system theme change events to automatically update
theme when OS preference changes.
