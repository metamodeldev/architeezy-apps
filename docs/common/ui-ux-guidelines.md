# UI/UX & Accessibility Guidelines

**Scope**: These standards apply to all user interface components and interactions in web
applications. They ensure a cohesive, accessible, and polished user experience.

## Design Principles

All UI implementations must adhere to these core principles:

1. **Consistency**: identical interactions should work identically everywhere in the application
2. **Feedback**: users should always know what's happening through visual or textual cues
3. **Forgiveness**: provide undo, cancel, and recovery options wherever possible
4. **Progressive Disclosure**: show only what's needed, when it's needed
5. **Accessibility First**: design for all users regardless of abilities

## Visual Design Standards

### Color & Contrast

#### Contrast Requirements

- All text must meet WCAG 2.1 AA minimum contrast ratios:
  - Normal text: 4.5:1
  - Large text: 3:1
  - UI components and graphic objects: 3:1
- Color must never be the sole means of conveying information; always include text labels or icons
- Theme uses CSS custom properties (variables) that can be overridden via `data-theme` attribute on
  root element
- Theme switching must be instantaneous (<50ms) and occur before first paint to prevent flash

#### Color Palette System

For visualizations (graphs, charts, diagrams), use a deterministic color assignment system to ensure
consistent, perceptually distinct colors for different categories (element types, relationship
types, etc.):

- **Base Palette**: 12 colors in bit-reversal hue order, providing maximum perceptual distinction
  for small sets:
  - `#c0474a` (Red, 1°)
  - `#2e9898` (Teal, 180°)
  - `#5a9e2c` (Green, 96°)
  - `#6646b8` (Violet, 258°)
  - `#a08e22` (Gold, 56°)
  - `#2e58b0` (Blue, 224°)
  - `#229868` (Emerald, 156°)
  - `#a83070` (Berry, 330°)
  - `#b05e28` (Rust, 26°)
  - `#2878b0` (Sky-blue, 210°)
  - `#349040` (Forest, 127°)
  - `#9428a4` (Plum, 297°)

- **Assignment Strategy**: When displaying multiple categories (e.g., element types, relationship
  types):
  - Group categories logically (e.g., all element types together, all relationship types together)
  - Sort categories
  - Assign palette colors consecutively using modulo indexing: `colorIndex = i % paletteLength`
  - This ensures the first N categories get the N most-distinct colors from the palette

- **Key Properties**:
  - Deterministic: Same category always gets same color within a visualization
  - Independent groups: Different groups (e.g., elements vs relationships) may reuse colors since
    they are visually distinct (nodes vs edges)
  - The palette values and assignment algorithm are the standard for all visualizations

- **Usage**:
  - Node/element colors: Assign based on element type
  - Edge/relationship colors: Assign based on relationship type (independent of element colors)
  - Always include a legend or labels; color is supplementary, not sole identifier

### Typography

- All UI text must be internationalized through a translation function (e.g., `t()`)
- Text strings should be referenced by keys from a translation dictionary
- Support dynamic font sizing; layout must accommodate browser font size increases without clipping

### Touch Targets

- Minimum touch target size: 44×44 pixels for mobile interactions
- Sufficient spacing between interactive elements to prevent accidental activation

### Spacing & Layout

- Use consistent spacing scale throughout the application
- Sidebar width: expanded state ~240-320px (responsive), collapsed state ~60px (toggle only)
- Modal dialogs centered with appropriate max-width; backdrop should blur background content
- Animations: transitions 0.2s ease for UI elements, ~300ms for accordions/panels

## Component Behavior Standards

### Sidebar Navigation

### Collapse/Expand Toggle

- Toggle button positioned at sidebar edge, visible in both states
- Collapsed state shows minimal controls (icons only); expanded state shows full labels
- Smooth width transition (0.2s ease); main content area expands to fill space
- Scroll position within sidebar preserved when toggling

### Section Accordions

- Sidebar sections must be independently collapsible
- Section headers are interactive buttons with `aria-expanded` attribute
- **Collapsed content must use CSS transitions for smooth animation** (never `display: none`):
  - Use `max-height: 0`, `opacity: 0`, `padding: 0`, and `visibility: hidden` for collapsed state
  - Use `max-height: [sufficiently-large-value]`, `opacity: 1`, `padding: [normal]`, and
    `visibility: visible` for expanded state
  - Set `overflow: hidden` to contain content during animation
  - Transition properties defined on the base element (not in `:hover`/`.collapsed`):
    - `max-height` 0.2s cubic-bezier(0.4, 0, 0.2, 1)
    - `opacity` 0.15s ease
    - `padding` 0.15s ease
  - **Important**: `visibility` should NOT be transitioned — it changes instantly at start/end to
    ensure immediate response and proper accessibility
- Smooth but responsive animation (total ~200ms) for transitions
- State within sections (form inputs, scroll position) preserved when collapsed
- Badge counters continue updating while section is collapsed

### Controls & Settings

- Selectors: dropdowns for choosing modes, algorithms, or options
- Toggles: for binary on/off states
- Sliders: for range selection with value display
- Buttons: primary actions; use loading states during async operations
- All setting changes should take effect immediately or provide explicit Apply/Refresh button
- User preferences should persist across sessions via storage

### Modals

#### General Requirements

- All modals must have: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title
- Overlay: semi-transparent dark background (rgba(0,0,0,0.5)) with optional backdrop blur
- Modal dialog: themed background (light/dark), rounded corners
- Close button (✕) in top-right corner with accessible `aria-label`

#### Generic Selection Modal Pattern

- Opens on button click from main UI
- Lazy-loads content on first open and caches for subsequent opens
- Search/filter input at top with debounced filtering (~200ms)
- Items display: icon/thumbnail, name, type badge, description (truncated)
- Scrollable body for long lists
- Shows loading state while fetching; error state with retry inside modal
- Selection closes modal and initiates the chosen operation (continues in background)
- Dismissal via close button, backdrop click, or Escape key
- Closing modal does NOT cancel in-progress operations started from modal

#### Focus Management

- On open: focus moves to first focusable element or search input
- While open: focus trapped within modal
- On close: focus returns to element that opened modal

### Theme System

**Common Theme Options**: Dark, Light, System (follows OS)

- System theme follows OS via CSS media query `prefers-color-scheme`
- Theme preference stored in storage with app-specific key
- Theme must be applied before content renders to prevent FOUC
- Switching should be instant (<50ms) with smooth transitions (0.2-0.3s)
- All components update consistently: backgrounds, text, accent colors
- Use CSS custom properties for theme colors
- Active theme selector should have visual highlight (accent background)
- Handle corrupted/unavailable storage by falling back to 'system'
- Validate stored values and fallback to default if invalid

### Toasts & Notifications

#### Toast Notifications

- Used for non-blocking feedback and non-fatal errors
- Positioned top-right corner; stack up to 3 visible, oldest dismissed when limit exceeded
- Auto-dismiss after several seconds; manual close button provided
- Types: error (red accent), success (green accent), info (neutral)
- Slide-in animation for appearance
- Must have `role="alert"` or `aria-live` appropriate to urgency

### Loading Indicators

- Full-screen centered overlay for initial operations
- Inline spinners within modals or containers for specific operations
- Generic "Loading…" or specific message like "Loading model…"
- Must always be hidden before showing error or success states

### Full-Screen Error Overlay

- Used for fatal initialization failures that prevent app progression
- Blocks all interaction with background
- Content: error heading, user-friendly message, Retry button
- Only dismissible via Retry (if successful) or page reload
- Focus should be managed to error message while visible

## Accessibility Standards

### Keyboard Navigation

#### Tab Order

- Must follow natural DOM order (left-to-right, top-to-bottom)
- No manual reordering with `tabindex > 0` (creates confusion)
- All interactive elements naturally in tab order: `<button>`, `<input>`, `<select>`, `<a href>`,
  `[tabindex="0"]`
- Non-interactive decorative elements excluded via `tabindex="-1"` or omission

#### Focus Indicators

- Clear visible focus indicator on all interactive elements
- At least 2px solid outline using theme accent color
- Use `:focus-visible` to show focus only for keyboard navigation, with fallback for unsupported
  browsers
- Never remove default browser focus outline without providing equally visible replacement

#### Form Labels & Controls

##### Label-Input Association

All form controls must have proper label association:

- **Checkboxes & Radio Buttons**: Wrap inside `<label>` OR use `for` attribute on label pointing to
  input `id`
- **Text Inputs & Selects**: Use `<label for="input-id">` linked to input/select `id`
- **Clickable area**: The entire label text should activate the control when clicked
- **Accessibility**: Proper association ensures screen readers announce the control correctly
- **Critical in**: Sidebar settings, filter controls, modal forms, preference dialogs

**Correct pattern for checkboxes:**

```html
<!-- Pattern 1: Input wrapped by label (simplest, recommended) -->
<label class="filter-item">
  <input type="checkbox" />
  Option text
</label>

<!-- Pattern 2: Label with for attribute (used in sidebar settings) -->
<div class="settings-row">
  <label class="settings-label" for="legend-toggle">Legend</label>
  <input type="checkbox" id="legend-toggle" />
</div>
```

**Incorrect pattern (label not clickable):**

```html
<span class="settings-label">Legend</span> <input type="checkbox" id="legend-toggle" />
```

This pattern is especially critical in:

- Sidebar settings panels
- Filter controls
- Modal forms
- Preference dialogs

##### Interactive Label Styling

Clickable labels (and other interactive elements) must provide clear visual feedback:

**Required CSS:**

- `cursor: pointer` - indicates element is clickable
- `user-select: none` - prevents accidental text selection and context menu
- `-webkit-user-select: none` - Safari support
- `-moz-user-select: none` - Firefox support (if needed)

**Rationale:**

- Prevents confusing text highlighting during clicks
- Stops unwanted browser context menus on long-press/right-click
- Provides consistent interaction model across all controls

**Apply to:**

- All `<label>` elements associated with form controls
- Checkbox/radio button labels (both wrapped and `for` patterns)
- **Checkbox/radio button input elements themselves** (`input[type="checkbox"]`, `input[type="radio"]`)
- Filter list items (`.filter-item`, `.bl-drop-item`)
- Settings labels (`.settings-label`)
- Interactive headers and section toggles (`.sidebar-toggle-btn`)
- Table headers (`th` with sorting)
- Toggle switches and custom controls

**Example CSS:**

```css
/* Labels and interactive text elements */
.filter-item,
.settings-label,
.bl-drop-item,
.sidebar-toggle-btn,
th {
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none; /* Safari */
}

/* Checkbox and radio inputs */
input[type="checkbox"],
input[type="radio"] {
  cursor: pointer;
}
```

**Incorrect (missing styles):**

```css
label {
  /* missing cursor and user-select */
}
```

### Keyboard Activation

- Buttons: `Enter` or `Space`
- Checkboxes: `Space` toggles
- Selects: `Enter`/`Space` opens; Arrow keys navigate options; `Enter` selects
- Links: `Enter` activates

#### Efficient Navigation Through Long Lists

- Filter panels with 100+ items must include search input to narrow visible items
- Only visible items should be in tab order; hidden elements (via `display: none`) automatically
  skipped
- Collapsed sections removed from tab order entirely
- Search input should be first focusable element within its panel

### Screen Reader Support

#### ARIA Attributes

Essential ARIA attributes for accessibility:

| Attribute           | Purpose                                             | Example / When to Use                                       |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| `aria-label`        | Descriptive label when visible text is insufficient | Close button with only "✕"; icon-only buttons               |
| `aria-expanded`     | State of expandable/collapsible sections            | `true`/`false` on sidebar section toggles, accordions       |
| `aria-controls`     | Element controlled by this button                   | Toggle button pointing to content panel ID                  |
| `aria-modal="true"` | Dialog that traps focus                             | Modal overlay                                               |
| `role="dialog"`     | Identifies a dialog window                          | Modal container                                             |
| `aria-labelledby`   | ID of element providing dialog title                | Points to `<h2>` inside modal                               |
| `aria-live`         | Announce dynamic updates                            | `"polite"` for toasts, `"assertive"` for errors             |
| `aria-sort`         | Indicates sort direction for tables                 | `"ascending"`, `"descending"`, `"none"` on sortable headers |
| `tabindex="0"`      | Makes element focusable                             | Interactive `<th>` elements, custom controls                |

#### Live Regions

- Errors: `aria-live="assertive"` or `role="alert"` for immediate announcement
- Non-critical updates: `aria-live="polite"` (e.g., filter count changes, model load complete)
- Model load completion could announce: "Model X loaded with Y elements" via polite live region

#### Screen Reader Only Text

Use CSS class `.sr-only` to hide text visually while keeping it available to screen readers:

- Absolute positioning with extreme dimensions
- `overflow: hidden`, `clip: rect(0,0,0,0)`
- Standard utility class should be provided in the stylesheet

### Focus Trapping in Modals

#### Requirements

- On modal open: focus must move automatically to first focusable element inside modal
- While modal open: Tab/Shift+Tab cycles ONLY among elements inside modal (focus never escapes)
- On modal close: focus returns to element that originally opened modal
- Trigger element must remain in DOM and focusable when modal closes
- Implementation must handle dynamically appearing/disappearing elements

**Implementation Note**: All modals must include proper ARIA attributes: `role="dialog"`,
`aria-modal="true"`, and `aria-labelledby` referencing the modal's title element.

### Skip Links (Optional Enhancement)

Consider providing "Skip to main content" link at top of page to allow keyboard users to bypass
repetitive navigation elements, jumping directly to the main content area. The skip link should:

- Be the first focusable element on the page
- Be visibly styled when focused (e.g., high contrast background)
- Target the main content container with appropriate `id`
- Use `href="#main-content"` pattern

## Animation Standards

- **UI element transitions** (buttons, toggles, section accordions): 0.15–0.2s ease
- **Layout changes** (sidebar width, modal appearance): ~200ms with appropriate easing
- **Heavy content**: Consider disabling complex animations for large content sets (1000+ items) for
  performance
- **Easing**: Use `cubic-bezier(0.4, 0, 0.2, 1)` for smooth motion, or `ease` for simple
  transitions; avoid linear
- **No autoplay**: All animations user-initiated only; respect `prefers-reduced-motion`
- When `prefers-reduced-motion` is set, disable or significantly reduce animations (especially
  height/width transitions)

## Testing Requirements

Before shipping any UI change:

- Navigate entire application using only Tab/Shift+Tab (no mouse)
- Activate every control with Enter/Space
- Open each modal, verify focus trap and Escape key closure
- Verify clear visible focus indicator in high contrast mode and with browser zoom
- Test with screen readers: NVDA (Windows), VoiceOver (macOS/iOS), TalkBack (Android)
- Ensure no keyboard traps exist (focus can always reach all elements and escape containers)
- Test theme switching across all components
- Test sidebar collapse/expand with long content; verify scroll position preservation
- Verify toast notifications appear, auto-dismiss, and can be manually closed
- Test search inputs: typing filters results; Escape should clear (when implemented)
- Test sortable table headers with keyboard (Enter/Space to sort, check aria-sort updates)
- Verify all interactive elements have appropriate ARIA labels or visible text
- Test in high contrast mode; ensure focus indicators remain visible
- Test with `prefers-reduced-motion` enabled; verify animations are disabled or reduced
- Test modal behavior: focus moves to first element on open, returns to trigger on close

## Common Accessibility Gaps to Address

The following features are commonly missing and should be prioritized:

- Modal focus trap implementation
- Table header keyboard accessibility (`tabindex="0"` for interactive headers)
- Escape key to clear search inputs
- Live region announcements for dynamic updates
- Skip links for keyboard navigation past repetitive navigation
- Canvas/visualization fallbacks for screen reader users
