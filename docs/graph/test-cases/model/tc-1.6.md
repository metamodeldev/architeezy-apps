# TC-1.6: URL State During Browser Navigation

**System Requirement**: [SR-1.6](../../system-requirements/model.md)

## TC-1.6.1: Filter changes update the URL in-place without adding browser history entries

**Functional Requirements**: [FR-3.4](../../functional-requirements.md#fr-3-filtering-system),
[FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url)

### Preconditions

- User navigated to the application from an external page (browser has one history entry before the
  app)
- **Test Architecture** is loaded via `/graph/?model=model-test`; all element types are checked

### Test Steps

1. Uncheck **ApplicationService** in the Entities filter
   - **Expected**: The URL updates to include `entities=ApplicationComponent`; **Service X**
     disappears; no new browser history entry is added (`replaceState` semantics — browser history
     length is unchanged)
2. Uncheck **AssociationRelationship** in the Relationships filter
   - **Expected**: The URL updates to include `relationships=ServingRelationship`; the edge
     disappears; browser history length is still unchanged
3. Click the browser **Back** button
   - **Expected**: The browser navigates away from the application entirely (to the external page
     from preconditions); the application is no longer visible; the filter changes did not create
     navigable history entries within the app

### Post-conditions

- User has left the application; no intermediate filter states remain in the history stack

### Test Data

| Field            | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| Model            | Test Architecture                                               |
| Filter changes   | ApplicationService unchecked, AssociationRelationship unchecked |
| Back destination | external page before the app (not a previous in-app filter URL) |
