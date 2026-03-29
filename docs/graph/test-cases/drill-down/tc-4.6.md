# TC-4.6: Adjustable Drill Depth

**System Requirement**: [SR-4.6](../../system-requirements/drill-down.md)

## TC-4.6.1: Depth picker shows buttons 1–5 with the active depth highlighted

**Functional Requirements**: [FR-4.2](../../functional-requirements.md#fr-4-drill-down-analysis)

### Preconditions

- **Test Architecture** is loaded via `/graph/?model=model-test&entity=comp-a&depth=3`

### Test Steps

1. Observe the depth picker in the Settings section
   - **Expected**: Buttons **1**, **2**, **3**, **4**, **5** are visible; button **3** has the
     `active` class

### Post-conditions

- Depth picker shows 5 buttons; button 3 is highlighted

### Test Data

| Field         | Value             |
| ------------- | ----------------- |
| Model         | Test Architecture |
| Drill root    | comp-a            |
| Current depth | 3                 |
| Active button | 3                 |

## TC-4.6.2: Clicking a depth button changes the active depth and updates the URL

**Functional Requirements**: [FR-4.2](../../functional-requirements.md#fr-4-drill-down-analysis),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- **Test Architecture** is loaded via `/graph/?model=model-test&entity=comp-a&depth=1`

### Test Steps

1. Click the depth button **4** in the depth picker
   - **Expected**: Button **4** becomes active (has `active` class); button **1** loses the `active`
     class
2. Observe the URL
   - **Expected**: The URL contains `depth=4`

### Post-conditions

- Active depth is 4; URL contains depth=4

### Test Data

| Field         | Value   |
| ------------- | ------- |
| Initial depth | 1       |
| Target depth  | 4       |
| URL expected  | depth=4 |
