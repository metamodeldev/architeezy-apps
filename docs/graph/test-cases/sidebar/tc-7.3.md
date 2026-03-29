# TC-7.3: Sidebar State Persistence

**System Requirement**: [SR-7.3](../../system-requirements/sidebar.md)

## TC-7.3.1: Collapsed sidebar state is restored after page reload

**Functional Requirements**: [FR-7.1](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- **Test Architecture** is loaded; the sidebar is in the **expanded** state

### Test Steps

1. Click the sidebar toggle button to collapse the sidebar
   - **Expected**: The sidebar collapses to icon-only width (~60px)
2. Reload the page (F5 or browser refresh)
   - **Expected**: The page loads with the sidebar already in the collapsed state; no sidebar
     expansion flash occurs during load
3. Verify the sidebar width is still ~60px after reload
   - **Expected**: Sidebar remains collapsed

### Post-conditions

- Sidebar collapsed state is persisted and restored across the page reload

### Test Data

| Field        | Value             |
| ------------ | ----------------- |
| Model        | Test Architecture |
| State set    | Collapsed         |
| After reload | Collapsed         |

## TC-7.3.2: Individual panel collapsed/expanded states are restored after page reload

**Functional Requirements**:
[FR-7.1](../../functional-requirements.md#fr-7-sidebar-and-ui-controls),
[FR-7.2](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- **Test Architecture** is loaded; the sidebar is expanded; all panels are in the expanded state

### Test Steps

1. Collapse the **Entities filter** panel by clicking its toggle
   - **Expected**: The Entities filter panel collapses; other panels remain expanded
2. Collapse the **Graph Settings** panel by clicking its toggle
   - **Expected**: The Graph Settings panel collapses; Relationships filter and Element Details
     remain expanded
3. Reload the page
   - **Expected**: After reload, **Entities filter** and **Graph Settings** panels are collapsed;
     **Relationships filter** and **Element Details** panels are expanded — matching the state
     before reload

### Post-conditions

- Individual panel states are persisted and restored correctly

### Test Data

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| Model            | Test Architecture                     |
| Collapsed panels | Entities filter, Graph Settings       |
| Expanded panels  | Relationships filter, Element Details |

## TC-7.3.3: Storage unavailable falls back to default expanded state without error

**Functional Requirements**: [FR-7.1](../../functional-requirements.md#fr-7-sidebar-and-ui-controls)

### Preconditions

- `localStorage` is unavailable (simulate by blocking it via browser dev tools or a mock that throws
  on access)

### Test Steps

1. Open the application at `/graph/` with `localStorage` blocked
   - **Expected**: The application loads without a JavaScript error or crash notification; the
     sidebar is in the default **expanded** state; all panels are expanded
2. Click the sidebar toggle button
   - **Expected**: The sidebar collapses as expected; no error is shown even though the state cannot
     be persisted

### Post-conditions

- Application is stable; sidebar defaults to expanded when storage is unavailable

### Test Data

| Field           | Value       |
| --------------- | ----------- |
| localStorage    | Unavailable |
| Default state   | Expanded    |
| Expected errors | None        |
