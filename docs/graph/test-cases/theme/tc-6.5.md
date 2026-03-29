# TC-6.5: Graph Visibility in Both Themes

**System Requirement**: [SR-6.5](../../system-requirements/theme.md)

## TC-6.5.1: Nodes and edges are visually distinct after switching to dark theme

**Functional Requirements**: [FR-6.1](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- **Test Architecture** is loaded with **Component A** (ApplicationComponent), **Component B**
  (ApplicationComponent), and **Service X** (ApplicationService) as nodes and at least one edge
  connecting them; the graph view is active; the current theme is **Light**

### Test Steps

1. Observe the graph canvas — nodes and edges are visible against the light background
2. Open the theme switcher and select **Dark**
   - **Expected**: The canvas background becomes dark; all node shapes remain visible with a
     contrasting fill or border; node labels (**Component A**, **Component B**, **Service X**) are
     readable in a light color against the dark background
3. Observe the edges connecting the nodes
   - **Expected**: Edge lines are clearly visible against the dark canvas background; edge arrows or
     arrowheads are distinguishable

### Post-conditions

- All graph elements are clearly visible in dark theme

### Test Data

| Field | Value                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------ |
| Model | Test Architecture                                                                                      |
| Nodes | Component A (ApplicationComponent), Component B (ApplicationComponent), Service X (ApplicationService) |
| Theme | Dark                                                                                                   |

## TC-6.5.2: Nodes and edges are visually distinct after switching to light theme

**Functional Requirements**: [FR-6.1](../../functional-requirements.md#fr-6-theme-management)

### Preconditions

- **Test Architecture** is loaded with **Component A**, **Component B**, and **Service X** as nodes;
  the graph view is active; the current theme is **Dark**

### Test Steps

1. Observe the graph canvas — nodes and edges are visible against the dark background
2. Open the theme switcher and select **Light**
   - **Expected**: The canvas background becomes light; all node shapes remain visible with a
     contrasting fill or border; node labels (**Component A**, **Component B**, **Service X**) are
     readable in a dark color against the light background
3. Observe the edges connecting the nodes
   - **Expected**: Edge lines are clearly visible against the light canvas background; edge arrows
     or arrowheads are distinguishable

### Post-conditions

- All graph elements are clearly visible in light theme

### Test Data

| Field | Value                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------ |
| Model | Test Architecture                                                                                      |
| Nodes | Component A (ApplicationComponent), Component B (ApplicationComponent), Service X (ApplicationService) |
| Theme | Light                                                                                                  |
