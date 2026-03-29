# SR-7: Sidebar and UI Controls

**Functional Requirements**:
[FR-7: Sidebar and UI Controls](../functional-requirements.md#fr-7-sidebar-and-ui-controls)

## User Story

As a user, I want a collapsible sidebar that houses all visualization controls, filters, and details
panel so I can manage the application state efficiently while maximizing graph viewing area.

## Acceptance Criteria

- SR-7.1: Sidebar supports two functional states: expanded and collapsed
- SR-7.2: Sidebar manages multiple independent panels that can be toggled individually
- SR-7.3: Sidebar configuration must persist across sessions

## Scenario

### Preconditions

- Application is running with any active view
- Sidebar with 4 panels exists on the left

### Steps

1. **Initial Load**
   - Sidebar appears expanded by default (or restores previous state)
   - All panels are open with chevrons pointing down
   - Toggle button at right edge shows "collapse" orientation
   - Scroll positions from last session restored

2. **Collapse Sidebar**
   - User clicks toggle button at sidebar's right edge
   - Sidebar smoothly shrinks to narrow width (~60px)
   - Panel text labels hide; icons remain
   - Main content area grows to fill space
   - Toggle icon flips outward
   - States saved to storage

3. **Expand Sidebar**
   - User clicks toggle button again
   - Sidebar smoothly returns to wide width
   - Panel labels reappear
   - Main content area shrinks back
   - Toggle icon flips inward
   - State saved

4. **Collapse Panel**
   - User clicks a panel header button
   - Panel content smoothly collapses
   - Chevron rotates to point right
   - `aria-expanded` updates to "false"
   - Controls inside panel removed from tab order
   - Scroll position for that panel saved

5. **Expand Panel**
   - User clicks the same collapsed panel header
   - Content smoothly expands
   - Chevron rotates back to point down
   - `aria-expanded` updates to "true"
   - Controls restored to tab order
   - Previous scroll position restored

6. **Rapid Toggling**
   - User clicks panel header multiple times quickly
   - Animations may overlap but final state consistent
   - No broken states or lost scroll positions

7. **State Restoration**
   - User configures sidebar (collapses some panels, scrolls in others)
   - User reloads page
   - Sidebar and panels restore their saved states
   - All scroll positions restored
   - Icons and accessibility attributes match states

### Expected Results

- Sidebar and panel animations are smooth without sudden jumps
- Main content always fills available space properly
- Collapsed panels are truly hidden (cannot be tabbed to or read by screen readers)
- Scroll positions persist across collapsing/expanding and page reloads
- Screen readers correctly announce panel state changes
- Toggle icons always match current state
- No content gets stuck or becomes inaccessible
- State saving/restoration works reliably

### Edge Cases

- **Toggle when already collapsed**: Expands sidebar; toggle always visible.
- **Panel header when already collapsed**: Expands panel (toggle behavior).
- **Multiple clicks during animation**: Final state correct; scroll preserved.
- **Panel with contextual controls**: Controls may become hidden if panel collapsed; user must
  expand panel to access them. No errors occur.
- **Browser storage disabled**: App works normally but sidebar state resets on reload (defaults to
  all expanded).
- **Empty model**: Panels may show placeholders like "No data" without errors.
- **Keyboard user**: Can navigate only visible controls; hidden panels skipped in tab order.
- **Screen reader user**: Collapsed content not announced; state changes announced via `aria-live`
  regions or native semantics.
- **Mobile/narrow screen**: Collapsed sidebar width remains usable; content scrolls vertically.

## Business Rules

### State Persistence

- Sidebar main state and each panel's state stored separately in browser storage.
- States loaded on app startup before first render.
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
