# Functional Requirements: Architeezy Graph

## Overview

This document provides a high-level inventory of functional requirements for Architeezy Graph.
Detailed specifications, user scenarios, and acceptance criteria are maintained in separate feature
documentation.

## FR-1: Model Management

- FR-1.1: Load model from repository via selector modal
- FR-1.2: Load model from URL parameters (deep linking)
- FR-1.3: Persist and recall last-viewed model across sessions

## FR-2: Graph Visualization

- FR-2.1: Render elements as nodes and relationships as edges
- FR-2.2: Provide multiple layout algorithms
- FR-2.3: Support zoom and pan navigation
- FR-2.4: Select nodes and display details

## FR-3: Filtering System

- FR-3.1: Filter element types
- FR-3.2: Filter relationship types
- FR-3.3: Search within filter lists
- FR-3.4: Encode filters in URL for sharing

## FR-4: Drill-Down Analysis

- FR-4.1: Enter drill mode by double-clicking a node
- FR-4.2: Control drill depth (1-5 levels)
- FR-4.3: Exit drill mode to return to full model
- FR-4.4: Apply filters within drill mode

## FR-5: Table View

- FR-5.1: Switch between graph and table views
- FR-5.2: Display elements in sortable, filterable table
- FR-5.3: Display relationships in table
- FR-5.4: Show row count statistics

## FR-6: Theme Management

- FR-6.1: Switch between dark, light, and system themes
- FR-6.2: Persist theme selection across sessions

## FR-7: Sidebar and UI Controls

- FR-7.1: Collapse/expand sidebar
- FR-7.2: Toggle sidebar section visibility
- FR-7.3: Configure visualization settings (layout, containment, depth, node tooltips)

## FR-8: Internationalization (i18n)

- FR-8.1: Detect and switch UI language
- FR-8.2: Translate UI strings without affecting model data

## FR-9: Shareable Views via URL

- FR-9.1: The application automatically encodes the current view state (including active filters,
  drill-down context, and visualization settings) in the URL
- FR-9.2: Users can bookmark or share URLs that restore the exact same view

## FR-10: Authentication

- FR-10.1: Optional authentication — the app works fully in anonymous mode; signing in may provide
  access to additional private models or content
- FR-10.2: The header displays a sign-in button when not authenticated, and shows the current user's
  name with a sign-out option when authenticated
- FR-10.3: Sign-out returns the app to anonymous mode without affecting the current model view

## FR-11: Data Export

- FR-11.1: Export table view to CSV
- FR-11.2: Export graph as image (PNG/SVG)

## Out of Scope

- Model editing (create/update/delete elements/relationships)
- Version comparison
- User management (teams, roles, permissions)
- Custom layouts (user-defined node positioning)
- Advanced analytics (metrics, KPIs, trends)
- Offline mode
- Native mobile applications
