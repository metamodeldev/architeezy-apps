# TC-4.3: Drill Root Remains Visible When Its Type Is Filtered

**System Requirement**: [SR-4.3](../../system-requirements/drill-down.md)

## TC-4.3.1: Drill root node stays visible even when its element type is unchecked

**Functional Requirements**: [FR-4.4](../../functional-requirements.md#fr-4-drill-down-analysis)

### Preconditions

- **Test Architecture** is loaded; drill mode is active on **Component A** (ApplicationComponent)
  via `/graph/?model=model-test&entity=comp-a`; **Component A** is the drill root

### Test Steps

1. Uncheck **ApplicationComponent** in the Entities filter
   - **Expected**: **Component B** (ApplicationComponent, not the drill root) disappears from the
     visible set; **Component A** (ApplicationComponent, the drill root) remains visible with its
     drill-root highlighting despite its type being filtered out

### Post-conditions

- ApplicationComponent is unchecked; Component A (drill root) is still visible

### Test Data

| Field           | Value                              |
| --------------- | ---------------------------------- |
| Model           | Test Architecture                  |
| Drill root      | Component A (ApplicationComponent) |
| Drill root ID   | comp-a                             |
| Filtered type   | ApplicationComponent               |
| Hidden node     | Component B                        |
| Visible despite | Component A (drill root exception) |
