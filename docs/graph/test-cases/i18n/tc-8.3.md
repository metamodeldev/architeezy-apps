# TC-8.3: Translation Fallback

**System Requirement**: [SR-8.3](../../system-requirements/i18n.md)

## TC-8.3.1: A translation key missing from the German bundle is displayed in English

**Functional Requirements**: [FR-8.2](../../functional-requirements.md#fr-8-internationalization)

### Preconditions

- The German translation bundle is missing one key (e.g. `graph.toolbar.exportImage`) — this can be
  simulated by modifying the locale file in a test environment; the locale is set to **German (de)**

### Test Steps

1. Open the application and navigate to the area where the missing translation key is rendered (e.g.
   the graph toolbar export button)
   - **Expected**: The missing translation is shown in English (the fallback locale) rather than as
     a raw key string or blank; all other UI strings remain in German

### Post-conditions

- Missing German translations fall back to the English string; the application remains usable

### Test Data

| Field           | Value                     |
| --------------- | ------------------------- |
| Locale          | de                        |
| Missing key     | graph.toolbar.exportImage |
| Expected output | English fallback string   |
| Other strings   | German                    |

## TC-8.3.2: Translation file fails to load — application falls back to English without crashing

**Functional Requirements**: [FR-8.1](../../functional-requirements.md#fr-8-internationalization),
[FR-8.2](../../functional-requirements.md#fr-8-internationalization)

### Preconditions

- The German translation file is blocked or returns a 404 (simulated via network interception); the
  browser language is **de** and no locale is stored in `localStorage`

### Test Steps

1. Open the application at `/graph/` with the German locale file blocked
   - **Expected**: The application loads without a JavaScript error or visible crash; all UI strings
     are displayed in English (the fallback locale); no raw translation keys or blank labels are
     visible
2. Verify the application is fully functional (model loads, filters work, graph renders)
   - **Expected**: All features operate normally despite the translation file failure

### Post-conditions

- Application is stable and functional in English when the locale file fails to load

### Test Data

| Field           | Value         |
| --------------- | ------------- |
| Browser locale  | de            |
| Locale file     | Blocked (404) |
| Expected locale | en (fallback) |
| Expected errors | None          |
