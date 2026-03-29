# TC-7.1: Sidebar Collapse and Expand

**System Requirement**: [SR-7.1](../../system-requirements/sidebar.md)

## TC-7.1.1: Clicking the toggle button collapses the sidebar to icon-only width (~60px)

**Functional Requirements**: [FR-7.1](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- **Test Architecture** is loaded; the sidebar is in the **expanded** state showing panel labels
  (Entities filter, Relationships filter, Graph Settings, Element Details)

### Test Steps

1. Locate the sidebar toggle button (typically a chevron or arrow icon at the edge of the sidebar)
2. Click the toggle button
   - **Expected**: The sidebar animates to a narrow icon-only state; the sidebar width is
     approximately 60px; panel labels and content are hidden; only panel icons remain visible

### Post-conditions

- Sidebar is collapsed to icon-only width (~60px); panel text labels are not visible

### Test Data

| Field          | Value             |
| -------------- | ----------------- |
| Model          | Test Architecture |
| Initial state  | Expanded          |
| Expected width | ~60px             |

## TC-7.1.2: Clicking the toggle button again expands the sidebar to full width

**Functional Requirements**: [FR-7.1](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- **Test Architecture** is loaded; the sidebar is in the **collapsed** (icon-only) state

### Test Steps

1. Click the sidebar toggle button
   - **Expected**: The sidebar animates back to its full expanded width; panel labels (Entities
     filter, Relationships filter, Graph Settings, Element Details) become visible again; panel
     content is restored

### Post-conditions

- Sidebar is expanded; all panel labels and content are visible

### Test Data

| Field          | Value             |
| -------------- | ----------------- |
| Model          | Test Architecture |
| Initial state  | Collapsed (~60px) |
| Expected state | Expanded          |

## TC-7.1.3: Main content area resizes to fill available space when sidebar collapses

**Functional Requirements**: [FR-7.1](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- **Test Architecture** is loaded; the sidebar is in the **expanded** state; the graph view is
  active

### Test Steps

1. Note the current width of the graph canvas area
2. Click the sidebar toggle button to collapse the sidebar
   - **Expected**: The graph canvas expands horizontally to fill the space freed by the sidebar
     collapse; no whitespace gap appears between the collapsed sidebar and the canvas
3. Click the toggle button again to expand the sidebar
   - **Expected**: The graph canvas contracts back to its previous width; the sidebar and canvas
     share the viewport without overlap

### Post-conditions

- Layout adjusts correctly in both collapsed and expanded states

### Test Data

| Field  | Value             |
| ------ | ----------------- |
| Model  | Test Architecture |
| View   | Graph             |
| Layout | Sidebar + Canvas  |
