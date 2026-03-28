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
- FR-3.4: Persist filter state per model
- FR-3.5: Encode filters in URL for sharing

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

## FR-8: Error Handling and Resilience

- FR-8.1: Display network errors with retry options
- FR-8.2: Gracefully handle application errors
- FR-8.3: Fallback behavior when graph rendering fails (future)

## FR-9: Internationalization (i18n)

- FR-9.1: Detect and switch UI language
- FR-9.2: Translate UI strings without affecting model data

## FR-10: URL State Management

- FR-10.1: Encode current state in URL parameters
- FR-10.2: Decode and apply state from URL parameters

## FR-11: Authentication

- FR-11.1: Optional authentication — the app works fully in anonymous mode; signing in may provide
  access to additional private models or content.
- FR-11.2: Sign-in UI always visible in the header when not authenticated; displays current user's
  display name and a sign-out button when signed in via token-based authentication.
- FR-11.3: Authentication tokens are not persisted in browser storage; the session is limited to the
  current page load.
- FR-11.4: Authentication is performed through a secure, isolated flow that does not expose
  credentials to the main application context.
- FR-11.5: All API requests include authentication credentials when the user is signed in;
  same-origin deployments use session-based authentication automatically.
- FR-11.6: Expired or invalidated authentication tokens are automatically cleared; the user is
  prompted to re-authenticate.
- FR-11.7: For token-based authentication, sign-out clears the in-memory token and resets auth UI
  without affecting the current model view. For same-origin session-based (cookie) authentication,
  the session is managed server-side; no sign-out action is available in the UI.

## FR-12: Data Export (Future)

- FR-12.1: Export table view to CSV
- FR-12.2: Export graph as image (PNG/SVG)

## FR-13: Performance & Feedback

- FR-13.1: Display loading indicators during operations
- FR-13.2: Show toast notifications for feedback

## Out of Scope

- Model editing (create/update/delete elements/relationships)
- Version comparison
- User management (teams, roles, permissions)
- Custom layouts (user-defined node positioning)
- Advanced analytics (metrics, KPIs, trends)
- Offline mode
- Native mobile applications
