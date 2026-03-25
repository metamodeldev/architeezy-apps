# Architeezy Lens

An interactive viewer for architecture models stored in
[Architeezy](https://architeezy.com). Displays any model as a force-directed
graph or a searchable table, with filtering, drill-down, and shareable deep
links.

**No build step.** All dependencies are loaded from CDN; open `index.html` with
any static file server.

---

## Features

- **Graph view** — interactive Cytoscape.js graph with multiple layout
  algorithms (fCoSE, Dagre, CoSE, Breadth-first, Grid, Circle)
- **Table view** — sortable, searchable elements and relationships table
- **Filter panel** — show/hide element and relationship types; counts update
  live
- **Drill-down** — double-click any node to explore its neighbourhood up to N
  hops (BFS); depth 1–5
- **Containment** — parent–child relationships shown as edges with filled
  diamonds or as compound (nested) shapes
- **Deep links** — all state (model, filters, drill node, depth, view) is
  encoded in the URL query string; share or bookmark any view
- **Dark / light / system theme**
- **Internationalisation** — English and Russian, detected from
  `navigator.language`
- **Authentication** — optional OAuth popup flow; anonymous access works for
  public models

---

## Quick Start

```sh
# from the repo root:
npx serve .
# then open http://localhost:3000/lens/
```

Or with Python:

```sh
python3 -m http.server 8080
# then open http://localhost:8080/lens/
```

---

## Module Overview

| File                 | Responsibility                                                              |
| -------------------- | --------------------------------------------------------------------------- |
| `js/constants.js`    | Global constants: API base URL, color palette, UI timing values             |
| `js/state.js`        | Single shared `state` object (all runtime state, JSDoc-typed)               |
| `js/i18n.js`         | Locale detection, string table, `t()`, `applyLocale()`                      |
| `js/utils.js`        | Pure helpers: color hashing, HTML escaping, model URL derivation            |
| `js/auth.js`         | In-memory token, cookie session probe, `apiFetch`, sign-in/out              |
| `js/parser.js`       | Universal structural model parser — `parseModel()`                          |
| `js/graph-styles.js` | Cytoscape style array, label measurement, `cyBg()`                          |
| `js/graph.js`        | Cytoscape lifecycle (`buildCytoscape`), layout, zoom, stats                 |
| `js/visibility.js`   | Show/hide logic: `applyVisibility()`, `applyDrill()`, filter-count updaters |
| `js/filters.js`      | Filter panel UI, active-type state, localStorage persistence                |
| `js/drill.js`        | Drill-down entry/exit, depth picker                                         |
| `js/detail.js`       | Node detail panel                                                           |
| `js/table.js`        | Table view, sorting, search, `focusNode()`                                  |
| `js/ui.js`           | Loading/error/toast overlays, theme switcher, view switching                |
| `js/models.js`       | Model list fetch, model selector modal                                      |
| `js/routing.js`      | URL state: `syncUrl()` writes state; `readUrlParams()` reads it back        |
| `js/app.js`          | Entry point: `init()`, `loadModel()`, `setContainmentMode()`                |

### Import graph (no cycles)

```
constants ← utils ← graph-styles ← graph
                                  ↗
state ────────────────────────────
                ↘
                 parser   visibility ← filters
                          visibility ← drill
                          visibility ← app
                 table ← visibility
                 i18n  ← (all modules)
                 auth  ← (all API callers)
```

---

## URL Parameters

All state is reflected in the address bar. Parameters are set with
`history.replaceState`.

| Parameter       | Present when                  | Value                              |
| --------------- | ----------------------------- | ---------------------------------- |
| `model`         | A model is loaded             | Model UUID from the API            |
| `entity`        | Drill-down is active          | Element ID of the drill-root       |
| `depth`         | Drill-down is active          | BFS hop count (1–5)                |
| `entities`      | Some element types are hidden | Comma-separated visible type names |
| `relationships` | Some rel. types are hidden    | Comma-separated visible type names |
| `view`          | Table view is active          | `table`                            |

---

## Authentication

Lens uses an OAuth popup flow. The token is stored **in memory only** — never
persisted to localStorage or cookies. See [`js/auth.js`](js/auth.js) and the
[root README](../README.md#authentication) for details.

---

## CDN Dependencies

| Library                                                                  | Purpose                        |
| ------------------------------------------------------------------------ | ------------------------------ |
| [Cytoscape.js](https://js.cytoscape.org)                                 | Graph rendering                |
| [cytoscape-fcose](https://github.com/iVis-at-Bilkent/cytoscape.js-fcose) | fCoSE layout                   |
| [cytoscape-dagre](https://github.com/cytoscape/cytoscape.js-dagre)       | Dagre (hierarchical) layout    |
| [dagre](https://github.com/dagrejs/dagre)                                | Dagre layout engine (peer dep) |
