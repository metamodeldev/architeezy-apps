# Traceability Matrix: Architeezy Graph

## Summary

This document provides a complete mapping between functional requirements (FR), system requirements
(SR), and test cases (TC). It acts as the authoritative index for tracking documentation coverage
and validation status.

| Functional Domain                  |   FR   |   SR   |   TC    |  Done   |
| ---------------------------------- | :----: | :----: | :-----: | :-----: |
| [FR-1: Models](#fr-1-models)       |   6    |   5    |   40    |   40    |
| [FR-2: Graph](#fr-2-graph)         |   8    |   8    |   65    |   65    |
| [FR-3: Table](#fr-3-table)         |   3    |   4    |   32    |   32    |
| [FR-4: Filtering](#fr-4-filtering) |   3    |   6    |   42    |   42    |
| [FR-5: Export](#fr-5-export)       |   2    |   3    |   25    |   22    |
| **Total**                          | **22** | **26** | **204** | **201** |

## FR-1: Models

- [FR-1.1](functional-requirements.md#fr-1-models): Load models from the repository via a selection
  interface
  - [SR-1.1](system-requirements/models.md#sr-11-selection): Selection
- [FR-1.2](functional-requirements.md#fr-1-models): Synchronize application state with URL
  parameters for deep linking and sharing
  - [SR-1.2](system-requirements/models.md#sr-12-deep-links): Deep links
- [FR-1.3](functional-requirements.md#fr-1-models): Persist and restore the last-active session
  state
  - [SR-1.3](system-requirements/models.md#sr-13-persistence): Persistence
- [FR-1.4](functional-requirements.md#fr-1-models): Provide navigation history to move between
  previously viewed states
  - [SR-1.4](system-requirements/models.md#sr-14-navigation): Navigation
- [FR-1.5](functional-requirements.md#fr-1-models): Manage anonymous and authenticated access to
  model repositories
  - [SR-1.5](system-requirements/models.md#sr-15-access): Access
- [FR-1.6](functional-requirements.md#fr-1-models): Provide session management and user identity
  display
  - [SR-1.5](system-requirements/models.md#sr-15-access): Access

## FR-2: Graph

- [FR-2.1](functional-requirements.md#fr-2-graph): Render entities as nodes and relationships as
  edges
  - [SR-2.1](system-requirements/graph.md#sr-21-representation): Representation
- [FR-2.2](functional-requirements.md#fr-2-graph): Provide multiple automated layout algorithms
  - [SR-2.4](system-requirements/graph.md#sr-24-layouts): Layouts
- [FR-2.3](functional-requirements.md#fr-2-graph): Enable interactive panning and zooming
  - [SR-2.3](system-requirements/graph.md#sr-23-navigation): Navigation
- [FR-2.4](functional-requirements.md#fr-2-graph): Display entity and relationship properties in a
  dedicated panel
  - [SR-2.5](system-requirements/graph.md#sr-25-selection): Selection
- [FR-2.5](functional-requirements.md#fr-2-graph): Support focus modes to highlight local
  neighborhoods
  - [SR-2.6](system-requirements/graph.md#sr-26-highlight-mode): Highlight Mode
- [FR-2.6](functional-requirements.md#fr-2-graph): Enable neighborhood drill-down with configurable
  relationship depth
  - [SR-2.7](system-requirements/graph.md#sr-27-drill-down): Drill-down
- [FR-2.7](functional-requirements.md#fr-2-graph): Support alternative containment visualizations
  (e.g., nested nodes vs. edges)
  - [SR-2.8](system-requirements/graph.md#sr-28-containment): Containment
- [FR-2.8](functional-requirements.md#fr-2-graph): Provide a legend for entity and relationship
  types
  - [SR-2.2](system-requirements/graph.md#sr-22-legend): Legend

## FR-3: Table

- [FR-3.1](functional-requirements.md#fr-3-table): Provide a tabular representation of entities and
  relationships
  - [SR-3.1](system-requirements/table.md#sr-31-view-switching): View switching
  - [SR-3.2](system-requirements/table.md#sr-32-tabular-display): Tabular display
- [FR-3.2](functional-requirements.md#fr-3-table): Support multi-column sorting and filtering within
  the table
  - [SR-3.3](system-requirements/table.md#sr-33-sorting): Sorting
- [FR-3.3](functional-requirements.md#fr-3-table): Enable navigation from table records to
  corresponding graph nodes
  - [SR-3.5](system-requirements/table.md#sr-35-graph-navigation): Graph navigation

## FR-4: Filtering

- [FR-4.1](functional-requirements.md#fr-4-filtering): Filter model visibility by entity and
  relationship types
  - [SR-4.1](system-requirements/filtering.md#sr-41-visibility): Visibility
  - [SR-4.2](system-requirements/filtering.md#sr-42-bulk-actions): Bulk actions
  - [SR-4.3](system-requirements/filtering.md#sr-43-dynamic-filter-management): Dynamic filter
    management
  - [SR-4.5](system-requirements/filtering.md#sr-45-filter-list-discovery): Filter list discovery
- [FR-4.2](functional-requirements.md#fr-4-filtering): Search for specific entities and
  relationships within the model data
  - [SR-4.4](system-requirements/filtering.md#sr-44-global-search): Global search
- [FR-4.3](functional-requirements.md#fr-4-filtering): Maintain consistent filtering and search
  results across graph and table views
  - [SR-3.4](system-requirements/table.md#sr-34-filtering): Filtering
  - [SR-4.4](system-requirements/filtering.md#sr-44-global-search): Global search

## FR-5: Export

- [FR-5.1](functional-requirements.md#fr-5-export): Export the table view to CSV format
  - [SR-5.1](system-requirements/export.md#sr-51-entity-table-export): Entity table export
  - [SR-5.2](system-requirements/export.md#sr-52-relationship-table-export): Relationship table
    export
- [FR-5.2](functional-requirements.md#fr-5-export): Export graph visualizations as image files
  - [SR-5.3](system-requirements/export.md#sr-53-graph-image-export): Graph image export
