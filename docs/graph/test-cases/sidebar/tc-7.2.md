# TC-7.2: Independent Panel Toggle

**System Requirement**: [SR-7.2](../../system-requirements/sidebar.md)

## TC-7.2.1: Collapsing the Entities filter panel hides its content without affecting other panels

**Functional Requirements**: [FR-7.2](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- **Test Architecture** is loaded; the sidebar is expanded; all panels (Entities filter,
  Relationships filter, Graph Settings, Element Details) are in the expanded state

### Test Steps

1. Click the collapse/toggle button of the **Entities filter** panel
   - **Expected**: The Entities filter panel content (checkboxes for ApplicationComponent,
     ApplicationService) collapses and is hidden; the panel header remains visible
2. Observe the **Relationships filter**, **Graph Settings**, and **Element Details** panels
   - **Expected**: All other panels are unchanged — their content remains visible and interactive

### Post-conditions

- Only the Entities filter panel is collapsed; all other panels remain expanded

### Test Data

| Field           | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Model           | Test Architecture                                     |
| Panel collapsed | Entities filter                                       |
| Panels intact   | Relationships filter, Graph Settings, Element Details |

## TC-7.2.2: Collapsed panel controls are removed from keyboard tab order

**Functional Requirements**: [FR-7.2](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- **Test Architecture** is loaded; the sidebar is expanded; the **Entities filter** panel is
  **collapsed**

### Test Steps

1. Focus the sidebar using keyboard navigation (Tab key)
2. Press Tab repeatedly to cycle through focusable elements in the sidebar
   - **Expected**: The checkboxes and interactive controls inside the collapsed **Entities filter**
     panel are not reachable via Tab; focus moves from the panel header directly to controls in the
     next expanded panel

### Post-conditions

- Collapsed panel controls are not in the keyboard tab order

### Test Data

| Field           | Value             |
| --------------- | ----------------- |
| Model           | Test Architecture |
| Collapsed panel | Entities filter   |
| Navigation      | Keyboard Tab      |

## TC-7.2.3: Expanding a collapsed panel restores its content and returns controls to tab order

**Functional Requirements**: [FR-7.2](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- **Test Architecture** is loaded; the sidebar is expanded; the **Entities filter** panel is
  **collapsed**

### Test Steps

1. Click the toggle button of the collapsed **Entities filter** panel
   - **Expected**: The panel expands; checkboxes for **ApplicationComponent** and
     **ApplicationService** become visible
2. Press Tab to navigate through the sidebar controls
   - **Expected**: The checkboxes inside the **Entities filter** panel are now reachable via Tab key
     in logical order

### Post-conditions

- The Entities filter panel is expanded; all its controls are visible and keyboard-accessible

### Test Data

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Model          | Test Architecture                                          |
| Panel expanded | Entities filter                                            |
| Controls       | ApplicationComponent checkbox, ApplicationService checkbox |
