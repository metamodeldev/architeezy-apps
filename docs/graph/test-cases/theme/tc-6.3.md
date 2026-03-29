# TC-6.3: UI Components Respect Theme

**System Requirement**: [SR-6.3](../../system-requirements/theme.md)

## TC-6.3.1: Switching to dark theme applies dark colors to sidebar, header, and table

**Functional Requirements**: [FR-6.1](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- **Test Architecture** is loaded; the current theme is **Light**

### Test Steps

1. Switch to the **Table** view so the table is visible
2. Open the theme switcher and select **Dark**
   - **Expected**: The header background changes to a dark color; the sidebar background changes to
     a dark color; the table rows and header cells use dark background colors with light text
3. Inspect the sidebar panels (Entities filter, Relationships filter, Graph Settings)
   - **Expected**: All sidebar panels have dark backgrounds and light-colored text and icons
4. Switch back to the **Graph** view
   - **Expected**: The graph canvas background is dark; node labels and edge lines are visible
     against the dark background

### Post-conditions

- Dark theme is applied consistently across header, sidebar, table, and graph canvas

### Test Data

| Field         | Value             |
| ------------- | ----------------- |
| Model         | Test Architecture |
| Theme         | Dark              |
| Views checked | Table, Graph      |

## TC-6.3.2: Switching to light theme applies light colors throughout the application

**Functional Requirements**: [FR-6.1](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- **Test Architecture** is loaded; the current theme is **Dark**

### Test Steps

1. Open the theme switcher and select **Light**
   - **Expected**: The header background changes to a light color; the sidebar background changes to
     a light color; text and icons in both areas are dark-colored
2. Switch to the **Table** view
   - **Expected**: The table has a light background with dark text in all cells; alternating row
     colors (if any) use light shades
3. Switch back to the **Graph** view
   - **Expected**: The graph canvas background is light; node labels are dark and legible

### Post-conditions

- Light theme is applied consistently across all UI components

### Test Data

| Field         | Value                         |
| ------------- | ----------------------------- |
| Model         | Test Architecture             |
| Theme         | Light                         |
| Views checked | Header, Sidebar, Table, Graph |
