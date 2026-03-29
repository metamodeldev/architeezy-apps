# TC-2.8: State Preserved Across View Switches

**System Requirement**: [SR-2.8](../../system-requirements/graph.md)

## TC-2.8.1: Zoom and pan state are preserved when switching to table view and back

**Functional Requirements**: [FR-5.1](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; user has zoomed to approximately 2.5× and panned so **Component
  A** is centered in the viewport

### Test Steps

1. Note the current zoom level (~2.5×) and the position of **Component A** on screen
2. Click the **Table** button in the view switcher
   - **Expected**: The table view is shown; the graph canvas is hidden
3. Click the **Graph** button in the view switcher
   - **Expected**: The graph canvas reappears at the same ~2.5× zoom level; **Component A** is at
     the same on-screen position as in step 1; no fit-to-view or zoom reset has occurred

### Post-conditions

- Graph view is active; zoom and pan state are unchanged

### Test Data

| Field         | Value             |
| ------------- | ----------------- |
| Model         | Test Architecture |
| Zoom level    | ~2.5×             |
| Centered node | Component A       |

## TC-2.8.2: Selected node state is preserved when switching to table view and back

**Functional Requirements**: [FR-5.1](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **e-commerce** model is loaded; **Payment Service** is selected (details panel is open showing its
  name and documentation)

### Test Steps

1. Click the **Table** button
   - **Expected**: Table view is shown; graph is hidden
2. Click the **Graph** button
   - **Expected**: Graph canvas reappears; **Payment Service** is still highlighted (selected); the
     details panel still shows **Payment Service** details

### Post-conditions

- Graph view active; Payment Service remains selected

### Test Data

| Field         | Value           |
| ------------- | --------------- |
| Model         | e-commerce      |
| Selected node | Payment Service |
