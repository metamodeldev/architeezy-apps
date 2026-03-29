# TC-6.1: Theme Switcher UI

**System Requirement**: [SR-6.1](../../system-requirements/theme.md)

## TC-6.1.1: Theme switcher shows three options: Light, Dark, System

**Functional Requirements**: [FR-6.1](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- **Test Architecture** is loaded; the theme switcher is accessible from the header or settings area

### Test Steps

1. Open the application at `/graph/`
   - **Expected**: The page loads with the current active theme applied
2. Click the theme switcher control in the header
   - **Expected**: A dropdown or button group appears with exactly three options: **Light**,
     **Dark**, and **System**; no other options are present

### Post-conditions

- The theme switcher is visible and shows all three options

### Test Data

| Field         | Value               |
| ------------- | ------------------- |
| Model         | Test Architecture   |
| Theme options | Light, Dark, System |

## TC-6.1.2: Current theme selection is visually indicated as active

**Functional Requirements**: [FR-6.1](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- **Test Architecture** is loaded; the active theme is **Dark** (set via
  `localStorage.setItem('architeezy.theme', 'dark')` before loading)

### Test Steps

1. Open the application at `/graph/`
   - **Expected**: The page loads with the dark theme applied
2. Open the theme switcher control
   - **Expected**: The **Dark** option has a distinct active/selected visual indicator (e.g. a
     checkmark, highlighted background, or bold text); the **Light** and **System** options have no
     active indicator

### Post-conditions

- The currently active theme option is visually distinguished from the others

### Test Data

| Field         | Value                 |
| ------------- | --------------------- |
| localStorage  | architeezy.theme=dark |
| Active option | Dark                  |
| Inactive      | Light, System         |
