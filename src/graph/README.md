# Architeezy Graph

An interactive viewer for architecture models stored in [Architeezy](https://architeezy.com).
Displays any model as a force-directed graph or a searchable table, with filtering, drill-down, and
shareable deep links.

## Quick Start

```sh
# from the repo root:
bun dev
# then open http://localhost:3000/graph/
```

## Features

- **Graph view** — interactive graph with multiple layout algorithms (fCoSE, Dagre, CoSE, Grid,
  Circle)
- **Table view** — sortable, searchable elements and relationships table
- **Filter panel** — show/hide element and relationship types; counts update live
- **Drill-down** — double-click any node to explore its neighbourhood up to 5 hops; depth adjustable
  on the fly
- **Containment** — parent–child relationships shown as edges or as compound (nested) nodes
- **Deep links** — all state (model, filters, drill node, depth, view) encoded in the URL; share or
  bookmark any view
- **Dark / light / system theme**
- **Authentication** — optional OAuth popup flow; anonymous access works for public models

## Project Structure

```text
src/graph/
├── index.html          # Entry point
├── app.css             # Styles
├── js/
│   ├── app.js          # Bootstrap and orchestration
│   ├── model.js        # Data transformation (EMF/Ecore → domain model)
│   ├── graph.js        # Cytoscape.js graph rendering and interaction
│   ├── graph-styles.js # Graph visual style definitions
│   ├── table.js        # Table view rendering and interaction
│   ├── filters.js      # Filter state and persistence
│   ├── visibility.js   # Node/edge visibility computation
│   ├── drill.js        # Drill-down scope (BFS traversal)
│   ├── detail.js       # Element detail panel
│   ├── models.js       # Model selector and API client
│   ├── routing.js      # URL state encoding/decoding
│   ├── auth.js         # Authentication flow
│   ├── palette.js      # Deterministic colour generation
│   ├── i18n.js         # Localisation
│   └── ui.js           # UI utilities and shared components
└── tests/
    ├── unit/           # Unit tests (Vitest)
    └── e2e/            # End-to-end tests (Playwright)
```

## Documentation

| Document                                                                        | Description                                     |
| ------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Vision](../../docs/graph/vision.md)                                            | Product strategy, target users, and goals       |
| [Functional Requirements](../../docs/graph/functional-requirements.md)          | Full feature inventory (FR-1 … FR-13)           |
| [Non-Functional Requirements](../../docs/graph/non-functional-requirements.md)  | Performance, security, and quality standards    |
| [SR-1: Model Management](../../docs/graph/system-requirements/model.md)         | Model loading and deep linking                  |
| [SR-2: Graph Interactions](../../docs/graph/system-requirements/graph.md)       | Rendering, layouts, navigation, selection       |
| [SR-3: Filtering System](../../docs/graph/system-requirements/filtering.md)     | Type filters, search, persistence               |
| [SR-4: Drill-Down Analysis](../../docs/graph/system-requirements/drill-down.md) | BFS scope, depth control                        |
| [SR-5: Table View](../../docs/graph/system-requirements/table.md)               | Elements and relationships table                |
| [Architecture](../../docs/common/architecture.md)                               | Technology choices and structural principles    |
| [Domain Model](../../docs/common/domain-model.md)                               | Core entities, transformation rules, invariants |
| [Coding Conventions](../../docs/common/coding-conventions.md)                   | Code style and quality rules                    |
