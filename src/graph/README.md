# Architeezy Graph

An interactive viewer for architecture models stored in [Architeezy](https://architeezy.com).
Transform complex models into explorable graphs and searchable tables—filter, drill down, and share
insights via deep links.

The app helps you explore and understand architecture models through:

- **Graph view** with multiple layout options — drag nodes, zoom, and double-click to dive deeper
- **Table view** that's sortable and searchable, with navigation back to the graph
- **Smart filtering** to show/hide element and relationship types, with live counts
- **Drill-down analysis** — explore any node's neighborhood up to 5 hops, adjust depth on the fly
- **Containment support** — see parent-child relationships as edges or nested nodes
- **Deep links** — every state is in the URL, so you can bookmark and share exact views
- **Theme switching** — dark, light, or follow your system
- **Authentication** — optional OAuth popup; public models work without sign-in
- **Export** — download tables as CSV or export the graph as PNG/SVG

## 📚 Documentation

### Business Requirements

- [Vision](../../docs/graph/vision.md) — Product strategy, target users, and goals
- [Functional Requirements](../../docs/graph/functional-requirements.md) — Complete feature
  inventory
- [Non-Functional Requirements](../../docs/graph/non-functional-requirements.md) — Performance,
  security, and quality standards
- [Traceability Matrix](../../docs/graph/traceability-matrix.md) — Requirements to test cases
  mapping

### System Requirements

- [SR-1](../../docs/graph/system-requirements/models.md): Models — Model loading, deep linking,
  persistence, navigation, access
- [SR-2](../../docs/graph/system-requirements/graph.md): Graph — Rendering, layouts, navigation,
  selection, legend, drill-down, containment
- [SR-3](../../docs/graph/system-requirements/table.md): Table — View switching, tabular display,
  sorting, filtering, navigation
- [SR-4](../../docs/graph/system-requirements/filtering.md): Filtering — Type visibility, bulk
  actions, search, filter discovery
- [SR-5](../../docs/graph/system-requirements/export.md): Export — CSV and image (PNG/SVG) export

### Test Cases

- [TC-1](../../docs/graph/test-cases/models/): Model Management
- [TC-2](../../docs/graph/test-cases/graph/): Graph Interactions
- [TC-3](../../docs/graph/test-cases/table/): Table View
- [TC-4](../../docs/graph/test-cases/filtering/): Filtering
- [TC-5](../../docs/graph/test-cases/export/): Export

### Platform Standards

- [Architecture](../../docs/common/architecture.md) — Technology choices and structural principles
- [Domain Model](../../docs/common/domain-model.md) — Core entities, transformation rules,
  invariants
- [Coding Conventions](../../docs/common/coding-conventions.md) — Code style and quality rules
- [API Contract](../../docs/common/api-contract.md) — API communication standards
- [Authentication](../../docs/common/authentication.md) — Client-side auth flows and security
- [Error Handling](../../docs/common/error-handling.md) — Graceful degradation and recovery
- [UI/UX Guidelines](../../docs/common/ui-ux-guidelines.md) — Visual design, accessibility,
  animations
- [Glossary](../../docs/common/glossary.md) — Shared terminology
- [State Management](../../docs/common/state-management.md) — Storage and URL state patterns
- [Development Workflow](../../docs/common/development-workflow.md) — Processes for features and
  apps
- [Documentation Guidelines](../../docs/common/docs-guidelines.md) — Docs-as-Code methodology

## 🚀 Quick Start

Start the dev server and open the app:

```sh
bun dev
```

Then visit `http://localhost:3000/graph/`, select a model, and explore.

- Drag nodes, zoom, double-click to drill down in graph view
- Switch to table for sortable, searchable data
- Open sidebar to filter by element/relationship types
- Use header search to highlight matches

The URL captures all state for easy sharing. Switch layouts from the graph toolbar. Preferences
persist automatically.

## 🛠️ Development

### Scripts

```sh
bun dev              # Start development server
bun run test:unit    # Run unit tests
bun run test:e2e     # Run end-to-end tests
bun run lint         # Lint code
bun run lint:fix     # Auto-fix linting issues
bun run format       # Format code
```

### Architecture

Architeezy Graph follows the [No-Build Architecture](../../docs/common/architecture.md): no bundling
or transpilation. The app runs directly from source files using standard ES modules for fast
iteration, easy debugging, and simple deployment.

All code adheres to [Coding Conventions](../../docs/common/coding-conventions.md) and
[UI/UX Guidelines](../../docs/common/ui-ux-guidelines.md).

## 🔗 Related

- **Architeezy Platform**: [architeezy.com](https://architeezy.com)
- **Repository Root**: See top-level `README.md` for ecosystem overview
- **Issue Tracker**: [GitHub Issues](../../issues) (link from root README)

## 📝 TODO

- [ ] Assess and improve UI/UX
- [ ] Configure linter file size limit to 500 lines and refactor oversized files
- [ ] Remove unnecessary delay in sidebar section animations
- [ ] Fix SVG export
- [ ] Make PNG export identical to what's shown in the browser
- [ ] Apply fit view during relayout
- [ ] Improve highlight performance
- [ ] Add calculation of already implemented entity and relationship counts to requirements
- [ ] Use "entities" for objects and "relationships" for connections in documentation and
      implementation
- [ ] Make configuration rows have uniform height
- [ ] Add performance tests and improve performance for large graphs
- [ ] Design and implement behavior for very large models
- [ ] Describe and implement data virtualization for large tables
- [ ] Add a clickable icon next to the app title indicating that users can select a model
- [ ] Move "Show all" to the same line as the name search in filters
- [ ] Implement a more accurate algorithm for calculating available filter items in drill-down mode,
      showing the count of objects that will be displayed when enabling each filter
- [ ] Remove status and owner columns from the table, verify they are not in requirements or test
      scenarios
- [ ] Describe and implement behavior for very long names in the table (should be truncated)
- [ ] Fix the sidebar collapse button overlapping the table
- [ ] Add a tooltip to the CSV button: "Export table to CSV"
- [ ] Fix tabs for entities and relationships in the table looking detached from the table
- [ ] Fix bug: when opening a new model while table is open, both graph and table appear on screen
