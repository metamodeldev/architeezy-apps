# TC-8.1: Browser Language Detection

**System Requirement**: [SR-8.1](../../system-requirements/i18n.md)

## TC-8.1.1: Browser set to German (de) loads the application in German on first visit

**Functional Requirements**: [FR-8.1](../../functional-requirements.md#fr-8-internationalization)

### Preconditions

- Browser language is set to **de** (German) as the primary language
- `localStorage` has no stored language preference (fresh session)

### Test Steps

1. Open the application at `/graph/` for the first time
   - **Expected**: The application loads with all UI strings in German — buttons, panel labels,
     table column headers, and placeholders are displayed in German; no English UI text is visible
2. Inspect the `lang` attribute of the `<html>` element
   - **Expected**: The value is `"de"`

### Post-conditions

- Application is displayed in German without any manual selection

### Test Data

| Field               | Value  |
| ------------------- | ------ |
| Browser language    | de     |
| localStorage locale | (none) |
| Expected locale     | de     |

## TC-8.1.2: Browser set to unsupported language falls back to English

**Functional Requirements**: [FR-8.1](../../functional-requirements.md#fr-8-internationalization)

### Preconditions

- Browser language is set to **fr** (French), which is not a supported locale
- `localStorage` has no stored language preference (fresh session)

### Test Steps

1. Open the application at `/graph/`
   - **Expected**: The application loads with all UI strings in English (the fallback locale); no
     untranslated keys or empty strings are visible
2. Inspect the `lang` attribute of the `<html>` element
   - **Expected**: The value is `"en"`

### Post-conditions

- Application falls back to English when the browser locale is unsupported

### Test Data

| Field             | Value         |
| ----------------- | ------------- |
| Browser language  | fr            |
| Supported locales | en, de, ar    |
| Expected locale   | en (fallback) |
