# TC-8.2: UI Strings Fully Localized

**System Requirement**: [SR-8.2](../../system-requirements/i18n.md)

## TC-8.2.1: All visible UI labels, buttons, and placeholders are in German when German is active

**Functional Requirements**: [FR-8.2](../../functional-requirements.md#fr-8-internationalization)

### Preconditions

- **Test Architecture** is loaded; the locale is set to **German (de)**

### Test Steps

1. Observe the sidebar panels — Entities filter, Relationships filter, Graph Settings, Element
   Details
   - **Expected**: All panel header labels are displayed in German; no English panel names are
     visible
2. Switch to the **Table** view and observe column headers, the search/filter input placeholder, and
   the export button label
   - **Expected**: All column headers are in German; the search placeholder is in German; the export
     button label is in German
3. Open the model selector
   - **Expected**: The modal title and any action buttons are in German

### Post-conditions

- No English UI text is visible when the locale is German

### Test Data

| Field         | Value                          |
| ------------- | ------------------------------ |
| Model         | Test Architecture              |
| Locale        | de                             |
| Views checked | Sidebar, Table, Model selector |

## TC-8.2.2: Error and notification messages are translated in the active locale

**Functional Requirements**: [FR-8.2](../../functional-requirements.md#fr-8-internationalization)

### Preconditions

- The locale is set to **German (de)**; the application is open

### Test Steps

1. Simulate a network error (e.g. disconnect network and attempt to load a model)
   - **Expected**: The error notification or error message is displayed in German
2. Trigger a validation or informational notification (e.g. complete an export)
   - **Expected**: The success or informational toast message is displayed in German

### Post-conditions

- All runtime notifications and error messages are localized in German

### Test Data

| Field    | Value                  |
| -------- | ---------------------- |
| Locale   | de                     |
| Trigger  | Network error, export  |
| Expected | German error/info text |
