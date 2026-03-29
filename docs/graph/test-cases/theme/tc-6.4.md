# TC-6.4: Theme Switching

**System Requirement**: [SR-6.4](../../system-requirements/theme.md)

## TC-6.4.1: Selecting Dark theme applies immediately without page reload

**Functional Requirements**: [FR-6.1](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- **Test Architecture** is loaded; the current theme is **Light**

### Test Steps

1. Note the current appearance of the header and sidebar (light backgrounds)
2. Open the theme switcher and select **Dark**
   - **Expected**: The theme changes instantly without a page reload; header and sidebar backgrounds
     become dark; the graph canvas background becomes dark; no loading spinner or page flash occurs
3. Verify the URL has not changed and no navigation occurred
   - **Expected**: The URL is unchanged; the same model is still displayed

### Post-conditions

- Dark theme is active; the page was not reloaded; the model remains loaded

### Test Data

| Field          | Value             |
| -------------- | ----------------- |
| Model          | Test Architecture |
| Initial theme  | Light             |
| Selected theme | Dark              |
| Reload         | None              |

## TC-6.4.2: Selecting System theme follows the OS color scheme

**Functional Requirements**: [FR-6.1](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- **Test Architecture** is loaded; the OS/browser is configured to use **dark** color scheme (via
  system preferences or `prefers-color-scheme: dark` media query)
- The current application theme is **Light**

### Test Steps

1. Open the theme switcher and select **System**
   - **Expected**: The application immediately switches to the dark theme (matching the OS setting);
     the **System** option is shown as active
2. Change the OS color scheme to **light** (or emulate via browser dev tools)
   - **Expected**: The application automatically switches to the light theme without a page reload
3. Change the OS color scheme back to **dark**
   - **Expected**: The application switches back to the dark theme automatically

### Post-conditions

- System theme follows OS preference dynamically; `localStorage` stores `"system"`

### Test Data

| Field          | Value                   |
| -------------- | ----------------------- |
| Model          | Test Architecture       |
| OS scheme      | dark                    |
| Theme selected | System                  |
| localStorage   | architeezy.theme=system |
