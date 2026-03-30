# SR-7: Sidebar and UI Controls

**Functional Requirements**:
[FR-7: Sidebar and UI Controls](../functional-requirements.md#fr-7-sidebar-and-ui-controls)

## User Story

As a user, I want a collapsible sidebar that houses all visualization controls, filters, and details
panel so I can manage the application state efficiently while maximizing graph viewing area.

## Acceptance Criteria

- [SR-7.1](#sr-71-sidebar-supports-two-functional-states-expanded-and-collapsed): Sidebar supports
  two functional states: expanded and collapsed
- [SR-7.2](#sr-72-sidebar-manages-multiple-independent-panels-that-can-be-toggled-individually):
  Sidebar manages multiple independent panels that can be toggled individually
- [SR-7.3](#sr-73-sidebar-configuration-must-persist-across-sessions): Sidebar configuration must
  persist across sessions

## Scenarios

### SR-7.1: Sidebar supports two functional states: expanded and collapsed

#### Preconditions

- Application is running with any active view
- Sidebar with 4 panels exists on the left
- Sidebar is in its default expanded state

#### Steps

1. **Observe initial state**
   - Sidebar appears expanded with full panel labels visible
   - Toggle button at the right edge shows the "collapse" orientation

2. **Collapse sidebar**
   - User clicks the toggle button at the sidebar's right edge
   - Sidebar smoothly shrinks to narrow width (~60px)
   - Panel text labels hide; icons remain visible
   - Main content area grows to fill the freed space
   - Toggle icon flips to the outward orientation

3. **Expand sidebar**
   - User clicks the toggle button again
   - Sidebar smoothly returns to its wide width
   - Panel labels reappear
   - Main content area shrinks back
   - Toggle icon flips to the inward orientation

#### Edge Cases

- **Toggle when already collapsed** — expands sidebar; toggle button is always visible regardless of
  state.
- **Multiple clicks during animation** — final state is correct; no broken intermediate states.
- **Mobile/narrow screen** — collapsed sidebar width remains usable; content scrolls vertically.

### SR-7.2: Sidebar manages multiple independent panels that can be toggled individually

#### Preconditions

- Application is running with any active view
- Sidebar is expanded and all panels are visible
- At least two panels are present

#### Steps

1. **Observe initial panel state**
   - All panels are open with chevrons pointing down
   - All panel content areas are visible

2. **Collapse a panel**
   - User clicks a panel header button
   - Panel content smoothly collapses
   - Chevron rotates to point right
   - Controls inside the panel are removed from tab order

3. **Verify other panels unaffected**
   - Remaining panels stay in their current open or closed state
   - No other panel changes when one is toggled

4. **Expand the collapsed panel**
   - User clicks the same collapsed panel header
   - Content smoothly expands
   - Chevron rotates back to point down
   - Controls are restored to tab order

5. **Rapid toggling**
   - User clicks a panel header multiple times quickly
   - Animations may overlap but final state is consistent
   - No broken states occur

#### Edge Cases

- **Panel header when already collapsed** — expands panel (toggle behavior).
- **Panel with contextual controls** — controls become hidden when panel is collapsed; user must
  expand the panel to access them; no errors occur.
- **Keyboard user** — can navigate only visible controls; hidden panels are skipped in tab order.
- **Screen reader user** — collapsed content is not announced; state changes are announced via
  `aria-live` regions or native semantics.

### SR-7.3: Sidebar configuration must persist across sessions

#### Preconditions

- Application has been used in a previous session
- Sidebar and panel states were configured (some panels collapsed, some expanded)
- User is returning after a page reload or new browser session

#### Steps

1. **Configure sidebar state**
   - User collapses several panels and scrolls within others
   - Sidebar state is saved as interactions occur

2. **Reload the page**
   - User reloads the browser page
   - Application initializes and reads persisted state

3. **Verify restored state**
   - Sidebar appears in its previously saved expanded or collapsed state
   - Each panel is open or closed as it was before the reload
   - Scroll positions inside panels are restored
   - Icons and accessibility attributes match the restored states

#### Edge Cases

- **Browser storage disabled** — app works normally but sidebar state resets on reload; defaults to
  all panels expanded.
- **Empty model** — panels may show placeholders like "No data" without errors.

## Business Rules

### State Persistence

- Sidebar state and panel states persist across sessions.
- States are loaded on app startup before first render.
- Default: all panels expanded, sidebar expanded.
- Errors in storage reading fall back to defaults (do not crash).

### Panel Behavior

- Each panel has a header button (always visible) and collapsible content area.
- Content area may contain any controls relevant to that panel.
- When panel is closed, content is hidden from both visual display and keyboard navigation.
- Scrolling inside a panel's content area is remembered when panel closes and reopens.
- Panels operate independently—closing one does not affect others.

## UI/UX

### Layout and Positioning

- Sidebar fixed to left edge.
- **Expanded width**: 240–320px (responsive, minimum 240px on smaller screens).
- **Collapsed width**: ~60px (icons only).
- Toggle button at right edge; icon orientation indicates action (inward→expand, outward→collapse).
- Main content area uses flexible layout to occupy remaining space.

### Visual Design

- Panel headers span full available width; chevron visibly rotates during animation.
- All buttons and controls have visible focus indicators for keyboard users.
- Colors and styles follow app theme via CSS variables.
- Collapsed sidebar shows only icons; labels hidden. Expanded sidebar shows full labels.

### Responsiveness and Smoothness

- Width changes (sidebar expand/collapse, panel open/close) animate smoothly without causing content
  jumps.
- Animations use GPU-accelerated CSS transitions; duration approximately 200-300ms.
- Changes are immediate and reversible; no confirmation dialogs.
- On smaller screens, sidebar expanded width adjusts to minimum 240px while maintaining usability.
- Scroll position inside each panel is remembered when panel collapses and restores when expanded
  again.

### Accessibility

- All interactive controls have accessible names (visible labels or `aria-label`).
- Collapsed panels are removed from tab order; only visible controls are focusable.
- Screen readers announce panel state changes via native semantics or `aria-live` regions.
- Touch devices: tap targets meet minimum 44×44px.

## Technical Notes

### Implementation Approach

- CSS transitions handle all animations (width for sidebar, height for panels).
- Collapsed panels use `display: none` to ensure they are excluded from tab order and screen
  readers.
- State (collapsed/expanded booleans, scroll positions) saved to localStorage with consistent key
  naming: `sidebar.collapsed` for the sidebar state, `panel.{name}.collapsed` for individual panels.
- JavaScript only handles class toggling, ARIA attribute updates, and storage I/O—no business logic.

### Accessibility

- Sidebar container has a descriptive `aria-label` (e.g., "Application controls").
- Panel header buttons use `aria-expanded` to reflect current state.
- Collapsed panels are hidden via `display: none`, ensuring exclusion from tab order and screen
  readers.
- Screen reader announcements use native element semantics or `aria-live` regions.

### Performance

- CSS transitions are GPU-accelerated and do not block the main thread (see UI/UX for timing
  specification).
- Storage operations are synchronous but very small payload, negligible impact.
- No expensive calculations on toggle; instant response.

### Cross-Browser and Responsive

- Works with localStorage available or gracefully degraded if unavailable.
- Sidebar widths adjust for smaller screens (expanded width may shrink to minimum 240px).
- Collapsed width (~60px) remains constant across viewports.
- Touch devices: tap targets meet minimum size (44×44px).

### Integration

Sidebar hosts controls that modify application state (visualization parameters, filters, etc.). The
behavior triggered by those controls is implemented in other modules. Sidebar's responsibility is to
provide the UI and persist user preferences; it does not contain business logic.

## Open Questions / Future Considerations

- Should sidebar state be included in URL for shareability? (Currently only in storage.)
- Tooltips on icon-only buttons when sidebar is collapsed?
- Overflow handling when content in narrow expanded sidebar is too wide.
- Mobile gestures (swipe) to collapse/expand sidebar.
- Keyboard shortcuts (e.g., `Ctrl+B`) for sidebar toggle.
