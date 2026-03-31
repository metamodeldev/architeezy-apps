# Functional Requirements: Architeezy Graph

## Overview

This document outlines the high-level functional requirements for Architeezy Graph.

## FR-1: Models

- FR-1.1: Load models from the repository via a selection interface.
- FR-1.2: Synchronize application state with URL parameters for deep linking and sharing.
- FR-1.3: Persist and restore the last-active session state.
- FR-1.4: Provide navigation history to move between previously viewed states.
- FR-1.5: Manage anonymous and authenticated access to model repositories.
- FR-1.6: Provide session management and user identity display.

## FR-2: Graph

- FR-2.1: Render entities as nodes and relationships as edges.
- FR-2.2: Provide multiple automated layout algorithms.
- FR-2.3: Enable interactive panning and zooming.
- FR-2.4: Display entity and relationship properties in a dedicated panel.
- FR-2.5: Support focus modes to highlight local neighborhoods.
- FR-2.6: Enable neighborhood drill-down with configurable relationship depth.
- FR-2.7: Support alternative containment visualizations (e.g., nested nodes vs. edges).
- FR-2.8: Provide a legend for entity and relationship types.

## FR-3: Table

- FR-3.1: Provide a tabular representation of entities and relationships.
- FR-3.2: Support multi-column sorting and filtering within the table.
- FR-3.3: Enable navigation from table records to corresponding graph nodes.

## FR-4: Filtering

- FR-4.1: Filter model visibility by entity and relationship types.
- FR-4.2: Search for specific entities and relationships within the model data.
- FR-4.3: Maintain consistent filtering and search results across graph and table views.

## FR-5: Export

- FR-5.1: Export the table view to CSV format.
- FR-5.2: Export graph visualizations as image files.

## Out of Scope

- **Model Authoring:** Creating, updating, or deleting entities and relationships.
- **Version Control:** Side-by-side model comparison or diffing.
- **User Management:** Role management or team workspaces.
- **Custom Graphics:** Manual node positioning or user-defined visual styles.
- **Offline Support:** Local-first storage or offline model exploration.
