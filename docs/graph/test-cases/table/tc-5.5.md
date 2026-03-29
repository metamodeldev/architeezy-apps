# TC-5.5: Row Clicks Navigate to Graph

**System Requirement**: [SR-5.5](../../system-requirements/table.md)

## TC-5.5.1: Clicking an element row switches to graph view

**Functional Requirements**: [FR-5.1](../../functional-requirements.md#fr-5-table-view)

### Preconditions

- **Test Architecture** is loaded; Table view active; Elements tab showing **Component A**,
  **Component B**, **Service X**

### Test Steps

1. Click the **Component A** row
   - **Expected**: The view switches to Graph; the graph canvas (`#cy`) is visible; the table view
     (`#table-view`) is hidden; the **Component A** node is selected (has the `selected` state in
     the graph) and is centered in the viewport

### Post-conditions

- Graph view is active; Component A is selected and centered

### Test Data

| Field       | Value             |
| ----------- | ----------------- |
| Model       | Test Architecture |
| Clicked row | Component A       |
| Result view | Graph             |
