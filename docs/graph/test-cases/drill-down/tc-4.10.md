# TC-4.10: Drill State Persists in URL

**System Requirement**: [SR-4.10](../../system-requirements/drill-down.md)

## TC-4.10.1: Deep link with `?entity=` restores drill mode on load

**Functional Requirements**: [FR-4.1](../../functional-requirements.md#fr-4-drill-down-analysis),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url),
[FR-9.2](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- Browser navigates to `/graph/?model=model-test&entity=comp-a`

### Test Steps

1. Application loads
   - **Expected**: Drill mode is active; the drill bar label shows **Component A**; the drill
     separator is visible (does not have the `hidden` class)
2. Observe the details panel
   - **Expected**: The details panel shows **Component A**'s name, type **ApplicationComponent**,
     and documentation **"First component"**

### Post-conditions

- Drill mode active on Component A; drill bar visible

### Test Data

| Field       | Value                             |
| ----------- | --------------------------------- |
| URL         | `?model=model-test&entity=comp-a` |
| Drill root  | Component A (comp-a)              |
| Drill label | Component A                       |
| Detail name | Component A                       |
| Detail doc  | First component                   |

## TC-4.10.2: Deep link with `?entity=` and `?depth=` restores the specified depth

**Functional Requirements**: [FR-4.1](../../functional-requirements.md#fr-4-drill-down-analysis),
[FR-4.2](../../functional-requirements.md#fr-4-drill-down-analysis),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url),
[FR-9.2](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- Browser navigates to `/graph/?model=model-test&entity=comp-a&depth=3`

### Test Steps

1. Application loads
   - **Expected**: Drill mode is active on **Component A**; the depth picker shows button **3** with
     the `active` class

### Post-conditions

- Drill mode active at depth 3; depth button 3 highlighted

### Test Data

| Field        | Value                                     |
| ------------ | ----------------------------------------- |
| URL          | `?model=model-test&entity=comp-a&depth=3` |
| Drill root   | comp-a                                    |
| Active depth | 3                                         |
