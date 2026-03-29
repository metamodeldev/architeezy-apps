# TC-6.2: Theme Persistence

**System Requirement**: [SR-6.2](../../system-requirements/theme.md)

## TC-6.2.1: Selected dark theme is restored after page reload

**Functional Requirements**: [FR-6.2](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- **Test Architecture** is loaded; the theme is currently set to **Light**

### Test Steps

1. Open the theme switcher and select **Dark**
   - **Expected**: The application immediately switches to the dark theme; the dark theme indicator
     is shown as active
2. Reload the page (F5 or browser refresh)
   - **Expected**: The application loads with the dark theme applied without a flash of the light
     theme; the theme switcher still shows **Dark** as the active selection
3. Inspect `localStorage` for key `architeezy.theme`
   - **Expected**: The value is `"dark"`

### Post-conditions

- Dark theme is active and persisted in `localStorage`

### Test Data

| Field        | Value                 |
| ------------ | --------------------- |
| Model        | Test Architecture     |
| Theme set    | Dark                  |
| localStorage | architeezy.theme=dark |

## TC-6.2.2: Corrupted theme value in storage falls back to system default without error

**Functional Requirements**: [FR-6.2](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- `localStorage` key `architeezy.theme` is set to the invalid value `"banana"` before loading

### Test Steps

1. Open the browser developer tools and set `localStorage.setItem('architeezy.theme', 'banana')`
2. Open the application at `/graph/`
   - **Expected**: The application loads without a JavaScript error or visible crash; the theme
     applied matches the OS/system preference (system default); no error notification is shown
3. Open the theme switcher
   - **Expected**: The **System** option is shown as the active selection

### Post-conditions

- Application is stable with system default theme; invalid storage value is ignored or overwritten

### Test Data

| Field              | Value                   |
| ------------------ | ----------------------- |
| localStorage (pre) | architeezy.theme=banana |
| Expected theme     | System (fallback)       |
| Expected errors    | None                    |
