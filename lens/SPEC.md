# Architeezy Lens — Specification

## Overview

**Architeezy Lens** is a single-page web application for visualising any graph-based model served by the Architeezy API. No build step required; all dependencies loaded from CDN.

---

## Authentication

Authentication is **optional** — the app works anonymously without a token; signing in may unlock additional models or content.

### Token storage

The token is stored in a JS variable (`authToken`) **in memory only** — never written to `localStorage` or cookies. This avoids XSS-driven token theft via persistent storage. The trade-off is that the user must sign in again on each page load.

### Auth UI (always visible in header)

- **Anonymous:** "Sign in" button.
- **Signed in:** current user's display name (from `GET /api/users/current`) + "Sign out" button.

### Sign-in flow

1. User clicks "Sign in" → `startAuth()` opens a popup to `https://architeezy.com/-/auth`.
2. After successful login the auth page posts:

   ```js
   window.opener.postMessage(
     { type: "AUTH_SUCCESS", token: user.access_token, idToken: user.id_token },
     "*",
   );
   ```

3. The app saves the token in memory, closes the popup, fetches the current user's name, and re-runs `init()` if no model list was loaded yet.

### Token usage

Every API request goes through `apiFetch(url)` which adds `Authorization: Bearer <token>` when a token is present, and omits the header when anonymous.

### 401 handling

If any `apiFetch` call receives HTTP 401, the token is cleared from memory, `updateAuthUI()` resets the header to the sign-in state, and an `authRequired` error is thrown.

### Sign-out

"Sign out" clears the token from memory and updates the header. The current model remains visible.

---

## Data Sources

### Model list

```http
GET https://architeezy.com/api/models?size=100
```

Paginated — all pages are fetched automatically until `_links.next` is absent.
Response: Spring HATEOAS / HAL
`_embedded.models[]` — array of model descriptors

| Field              | Description                                      |
| ------------------ | ------------------------------------------------ |
| `id`               | UUID                                             |
| `scopeSlug`        | Scope identifier (e.g. "dev", "demo")            |
| `projectSlug`      | Project identifier (e.g. "eip-system-design")    |
| `projectVersion`   | Version (e.g. "dev")                             |
| `slug`             | Model slug (e.g. "archimate")                    |
| `name`             | Display name                                     |
| `description`      | Optional description                             |
| `contentType`      | Metamodel URL (e.g. `…/metamodel/eip/dev/eip#…`) |
| `_links.content[]` | Array of content links with `href` (templated)   |

Content URL derived from `_links.content[0].href` by stripping `{&inline}` template suffix.
Fallback construction: `/api/models/{scopeSlug}/{projectSlug}/{projectVersion}/{slug}/content?format=json`

### Model content

```http
GET https://architeezy.com/api/models/{scopeSlug}/{projectSlug}/{projectVersion}/{slug}/content?format=json
```

All models share the same envelope:

```json
{ "content": [ { "id": "…", "eClass": "ns:TypeName", "data": { … } } ] }
```

---

## Universal Parser

Fully structural — no hardcoded type names or property keys. Works for all observed model types (ArchiMate, C4, EIP, Domain, Class model, etc.) and any future model.

### Rules (applied in order to every object with `eClass`)

| #   | Condition                                                      | Result                                       |
| --- | -------------------------------------------------------------- | -------------------------------------------- |
| 1   | `data.source` **and** `data.target` present                    | Standalone **edge**                          |
| 2   | Only `data.target` present (no `data.source`) + parentId known | **Embedded reference** edge: parent → target |
| 3   | Neither (or both absent)                                       | **Node**                                     |

### Child traversal

ALL array-valued properties of `data` are walked — no key whitelist.
For each array item:

- Object with `eClass` → `walkNode(item, parentId)`
- UUID string → edge from `parentId` to that UUID (edge type = array key name as-is, no transformation)

### Root skipping

`content[0]` is **always** skipped as a node (it is the model root container regardless of type).
Only its `data` is walked.

### Name fallback

If `data.name` / `data.label` / `data.title` are all absent, the element's **type** is used as its display name.

### Filtered objects

Objects whose `eClass` type is `EStringToStringMapEntry` and whose **resolved** namespace equals exactly `http://www.eclipse.org/emf/2002/Ecore` are silently skipped — they are internal EMF key-value map entries with no semantic meaning. The namespace is resolved by looking up the short prefix (extracted from `eClass`) in the top-level `ns` map of the JSON response, so both `"ecore:EStringToStringMapEntry"` and `"http://www.eclipse.org/emf/2002/Ecore:EStringToStringMapEntry"` are correctly filtered.

### Containment tracking

Every graph node records the ID of its **direct parent node** (the enclosing node whose `data` array contained it). Used by FR-9 containment display. A parent reference is set only when the enclosing object is itself a graph node.

### Model namespace

The `currentModelNs` key used for per-type filter state persistence (FR-5) is resolved from the root content object's `eClass` prefix and the **`ns` namespace map** at the **top level of the JSON response** (not inside `content[0]`).

`ns` is a plain object where each key is a short prefix and each value is the full namespace URI:

```json
{ "ns": { "archimate": "http://www.archimatetool.com/archimate" }, "content": [ … ] }
```

Resolution algorithm:

1. Extract the prefix from `content[0].eClass` using `lastIndexOf(':')` (prefix is always a short name, never a URI).
2. Look up `raw.ns[prefix]` to get the full URI. If absent, fall back to the prefix string.

---

## Functional Requirements

### FR-1: Model Selection

- On startup, fetch model list and display a selection modal.
- Modal shows: model name, type badge (from `contentType`), description.
- Search / filter within modal by name or type.
- Selected model URL is persisted to `localStorage`; next visit auto-loads it.
- Header shows current model name and "⊞" button to reopen the selector.

### FR-2: Data Loading

- All API requests include `credentials: 'include'` so session cookies are sent automatically on same-domain deployments.
- When a Bearer token is present it is sent as `Authorization: Bearer <token>`; anonymous requests omit the header.
- Show loading spinner during fetch.
- **Model list failure** (HTTP error or network error): full-screen error with "Retry" button.
- **Model content failure when no graph is loaded**: saved model URL is removed from `localStorage` and the model selector is opened so the user can choose another model. No full-screen error is shown.
- **Model content failure when a graph is already displayed**: keep the current model visible and show a dismissible toast notification (slides in from top-right, auto-dismisses after 7 s, has a close button).

### FR-3: Graph Visualization (Cytoscape.js v3.33.1)

- Nodes: color-coded by element type (deterministic palette hash). Node width and height auto-fit their label (`min-width: 'label', min-height: 'label'`) with 8 px padding.
- Edges: color-coded by relationship type. Edge label background colour is read from the `--cy-bg` CSS variable at graph-build time and updated on theme change.
- Default layout: **fCoSE** (prevents overlap, good edge lengths).
- Available layouts: fCoSE, Dagre, CoSE, Breadthfirst, Grid, Circle.
- Layout always runs on **visible elements only** (`eles.layout()`), so it remains fast in drill-down mode on large models.
- Zoom: handled by a custom capturing wheel-event listener (factor 1.3 per notch, centred on cursor position) that intercepts the event before Cytoscape, providing fast zoom without triggering Cytoscape's `wheelSensitivity` warning.
- Pan, fit-to-screen, zoom buttons in header and overlaid on the canvas.

### FR-4: Interaction Model

| Action                   | Behavior                                      |
| ------------------------ | --------------------------------------------- |
| **Left click** on node   | Select node; show detail panel in sidebar     |
| **Double click** on node | Enter drill-down mode for that node           |
| **Left drag** on node    | Move node                                     |
| **Left drag** on canvas  | Pan diagram                                   |
| **Middle drag** anywhere | Pan diagram (even when cursor is over a node) |
| **Scroll wheel**         | Zoom ×1.3 per notch, centred on cursor        |
| **Click** on canvas      | Deselect; clear detail panel                  |

### FR-5: Type Filtering

- Sidebar panels named **Entities** (element types) and **Relationships** (relationship types) with checkboxes for all types present in the loaded model.
- Toggling a type hides/shows matching nodes or edges instantly.
- Clicking anywhere on a filter row (checkbox, dot, label, count) toggles the type.
- Each panel header contains **✓ / ✗ icon buttons** (select-all / select-none) inline with the section title, so they are always visible without scrolling. Per-panel text search below the header.
- Colored dot per type (matches node/edge color).
- **Relationship type counts** reflect the current element filter and drill-down scope:
  - Shows **N / M** where M is the total count of that relationship type (both endpoints are graph nodes) and N is the count where both endpoint element types are currently visible (and within drill scope if active).
  - If N = M, only N is shown.
- **Element type rows are dimmed** when there are no elements of that type available in the current context (0 in the drill scope when drilling; 0 in the full model when not drilling). A type hidden by its own checkbox is **not** dimmed — it is available, just filtered out.
- **Relationship type rows are dimmed** when their visible count (both endpoint element types currently shown) drops to 0 in the current context.
- **Filter state is persisted per model namespace** in the `architeezyLensFilter` localStorage entry — a JSON object keyed by `currentModelNs` (the full namespace URI, e.g. `http://www.archimatetool.com/archimate`, derived from child elements). Each entry has fields `hiddenEntityTypes` and `hiddenRelationshipTypes`. Hidden types are restored automatically when a model of the same namespace is loaded.
- **Filter state is also reflected in the URL** (FR-12): when any types are hidden, `?entities=…` and/or `?relationships=…` list the **visible** (active) types in the address bar. Parameters are absent when all types are visible. URL filter state takes priority over localStorage when opening a shared link.

### FR-6: Drill-Down View

- Entered by double-clicking a node.
- Shows the focal node and all nodes reachable within N hops via **semantic relationship edges and containment** (parent↔child), subject to the active element and relationship type filters.
- **BFS traversal rules:**
  - Semantic edges whose type is currently checked are traversed.
  - **Element type filter is respected during BFS**: a node is only added to the reachable set (and used as a stepping stone) if its element type is currently active. This ensures nodes that are reachable only _through_ filtered-out nodes are not shown — every visible node has an unbroken path to the drill-root through visible nodes.
  - The drill-root is always traversable and always visible even if its element type is filtered out (see below).
  - Containment is traversed as regular hops (N levels of children **and** N levels of parents) — independent of whether containment is shown as edges or compound shapes.
  - When containment display is **None**, containment is not traversed and contained/containing objects are not included.
  - In edge mode, containment edges (`isContainment`) are traversed via `connectedEdges`; in compound mode, `node.children()` and `node.parent()` are used instead.
- **Edge visibility rule (universal)**: an edge (semantic or containment) is shown only if `min(depth[src], depth[tgt]) < drillDepth`. This hides cross-edges at the outermost hop regardless of depth setting.
- **Layout runs on the visible subset only** (`eles.layout()` instead of `cy.layout()`). On drill entry and depth change the layout is re-run automatically; on filter toggles within drill the positions are kept (only visibility changes).
- Drill bar (visible when active): focal node name + depth selector 1–5 with visible active highlight.
- Depth change updates the layout immediately.
- "← Full model" button exits drill-down.
- Detail panel shows connections to/from the focal node; clicking a connection item enters drill-down on that node.
- Table view is also filtered to drill-down scope while drill is active.
- **Stats bar in drill mode** shows N / M format for both nodes and edges (N = visible in drill scope, M = total in model). The stats bar is always visible at the bottom of the main area.
- **Element type filter in drill mode** shows N / M per type (N = elements of that type currently visible in the drill scope, M = total elements of that type in the model). N reflects both the BFS depth limit and the active type filter. If N = M, only M is shown.
- **Drill-root visual indicator**: the focal node always has a **green border** (`#22c55e`, 3 px) to identify it at a glance regardless of selection state. When the drill-root node is simultaneously selected (detail panel open), the border turns **red** (`#e94560`) as for any selected node — the selected style takes priority.
- **Drill-root always visible**: the focal node is always rendered even if its element type is currently hidden by the filter. Edges connecting it to other visible nodes are also shown regardless of the root's type filter state.

### FR-7: Detail Panel

- Shown on single click of a node.
- Contains: name, type · namespace, documentation/description, list of all direct connections.
- Each connection item shows: direction arrow, name of connected node, relationship type.
- Clicking a connection item drills into that node.

### FR-8: Table Visualization

- Tab toggle: Graph ↔ Table.
- Table tabs: Elements | Relationships.
- Elements table: Name | Type | Documentation — sortable, searchable. Filtered by active element types (same as graph).
- Relationships table: Source | Relationship Type | Target | Name — sortable, searchable. Filtered by active relationship types and active element types (both endpoint types must be visible).
- Clicking a row in the Elements table switches to Graph view and centers that node.
- The stats bar (total nodes / edges and visible counts) is always shown at the bottom of the main area regardless of active view.

### FR-9: Containment Display Mode

- Three modes selectable in header (persisted to `localStorage`):
  - **None** — containment hierarchy not visualised.
  - **Edges ◆** (default) — a filled-diamond composition edge is drawn from each parent node to each contained child. Diamond at the parent (source) end; no arrowhead at child end.
  - **Compound shapes ⬚** — child nodes are rendered inside their parent using Cytoscape compound nodes; container label is pinned to the top of the shape.
- Changing mode rebuilds the graph and re-runs the layout.
- Containment edges are not shown in the relationship type filter panel.
- **Empty compound parents** (all children filtered out): Cytoscape derives a compound node's rendered bounds from its children's bounding boxes — when all children have `display:none` the parent collapses to zero size. To prevent this, `syncCompoundParents(isVisible)` is called before every visibility batch. It uses `node.move({ parent: null })` to structurally detach hidden children from their compound parent and `node.move({ parent: origParent })` to restore them when they become visible again. Each node stores its original parent in `data.modelParent` at build time. A compound node with no structural children is treated as a leaf node by Cytoscape and renders at its natural label-based size.

### FR-12: URL State (Deep Links)

The address bar reflects the full application state so that any view can be shared as a link and restored exactly on open.

#### URL parameters

| Parameter       | Present when                         | Value                                                  |
| --------------- | ------------------------------------ | ------------------------------------------------------ |
| `model`         | A model is loaded                    | Model `id` (UUID) from the API                         |
| `entity`        | Drill-down is active                 | Element `id` of the drill-root node                    |
| `depth`         | Drill-down is active                 | BFS depth (1–5)                                        |
| `entities`      | One or more element types are hidden | Comma-separated list of **visible** element type names |
| `relationships` | One or more rel. types are hidden    | Comma-separated list of **visible** rel. type names    |
| `view`          | Table view is active                 | `table` (parameter absent when graph is active)        |

Commas in list values are written literally (not encoded as `%2C`). Other values use standard percent-encoding.

#### Update triggers

`syncUrl()` is called after every state change that affects the URL:

- Model loaded → `modelId` added
- Drill entered / exited / depth changed → `entityId` + `depth` added or removed
- Filter toggled → `entities` / `relationships` added or removed
- View switched → `view` added or removed

`history.replaceState` is used (no new history entries).

#### Restoration on open

1. URL params are read after the model list is fetched.
2. If `model` is present, the matching model is loaded (by `model.id`). Falls back to `localStorage` if `model` is absent or not found.
3. After the model loads, URL state is applied in order:
   a. Filter state (`entities`, `relationships`) — always applied when any URL state is present (`entity`, `view`, `entities`, or `relationships`), overriding localStorage. If `entities` is absent from the URL, all element types are made visible; if `relationships` is absent, all relationship types are made visible.
   b. View (`view=table`).
   c. Drill (`entity` + `depth`) — `depth` is set before `onNodeDrill()` is called.

### FR-10: Themes

- Dark / Light / System (follows `prefers-color-scheme`) themes.
- Selection persisted to `localStorage`.
- Switcher: 🌙 / ☀️ / 🖥 buttons in header.

### FR-11: Localisation

- UI language auto-detected from `navigator.language`.
- Supported languages: **English** (default) and **Russian**.
- No manual language selector.

---

## Non-Functional Requirements

- Pure HTML + CSS + JS; no build step.
- All dependencies from CDN.
- Responsive at any width; optimised for desktop, usable on mobile.
- Source split into ES modules under `js/`; loaded via `<script type="module" src="js/app.js">`.

## Mobile / Responsive Layout

- `body` uses `height: 100dvh` (dynamic viewport height) to avoid the iOS Safari "extra space at bottom" issue where `100vh` includes hidden browser chrome.
- `html` has `overflow: hidden` to prevent document-level scroll in all directions.
- Sidebar width is `clamp(180px, 33.333%, 280px)` — at most one-third of the viewport, never wider than 280 px, never narrower than 180 px.
- Header uses `flex-wrap: wrap`; at ≤ 600 px the `.ctrl-group` wraps to its own full-width row and select elements are capped in width to fit smaller screens.
- Drill bar wraps depth picker to a second line when the viewport is narrow.

## Module Structure

| File                 | Responsibility                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `js/constants.js`    | Global constants: API base, URLs, color palette, regexes, UI timing and sizing values                       |
| `js/i18n.js`         | Language detection, string table, `t()`, `applyLocale()`                                                    |
| `js/utils.js`        | Pure helpers: color hashing, HTML escaping, model URL derivation                                            |
| `js/state.js`        | Single shared mutable `state` object (all runtime state, fully JSDoc-typed)                                 |
| `js/auth.js`         | Auth token (memory-only), cookie auth probe, `apiFetch`, sign-in/out                                        |
| `js/parser.js`       | Universal structural model parser — `parseModel()`                                                          |
| `js/graph-styles.js` | Cytoscape style array (`buildCyStyles`), label measurement (`createLabelMeasurer`), `cyBg()`                |
| `js/graph.js`        | Cytoscape instance lifecycle (`buildCytoscape`), layout, zoom, stats; imports graph-styles.js               |
| `js/visibility.js`   | All show/hide logic: `applyVisibility()`, `applyDrill()`, `syncCompoundParents()`, filter-count UI updaters |
| `js/filters.js`      | Filter panel UI: `buildFilters()`, `selectAll()`, `applyUrlFilters()`, filter state persistence             |
| `js/drill.js`        | Drill-down entry/exit (`onNodeDrill`, `exitDrill`), depth picker                                            |
| `js/detail.js`       | Node detail panel rendering                                                                                 |
| `js/table.js`        | Table view (elements / relationships tabs), sorting, search, `focusNode()`                                  |
| `js/ui.js`           | Loading/error/toast overlays, theme, view switching                                                         |
| `js/models.js`       | Model list fetch, model selector modal                                                                      |
| `js/routing.js`      | URL state: `syncUrl()` writes current state to address bar; `readUrlParams()` reads it back                 |
| `js/app.js`          | Entry point: `init()`, `loadModel()`, `setContainmentMode()`, window globals for HTML handlers              |

### Import graph (no cycles)

```
constants ← utils ← graph-styles ← graph
                                  ↗
state ────────────────────────────
                ↘
visibility ← filters ← app
           ↗
drill ←────
       ↘
table ← detail
```

## localStorage Keys

Keys use the `architeezyLens` prefix, except the theme key which is shared
across all Architeezy applications.

| Key                         | Value                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `architeezyTheme`           | `dark` / `light` / `system` — shared with the gallery and all other apps              |
| `architeezyLensContainment` | `none` / `edge` / `compound`                                                          |
| `architeezyLensModelUrl`    | Last loaded model content URL                                                         |
| `architeezyLensFilter`      | JSON object: `{ [namespaceURI]: { hiddenEntityTypes[], hiddenRelationshipTypes[] } }` |

---

## CDN Dependencies

| Library         | Version | Purpose                 |
| --------------- | ------- | ----------------------- |
| cytoscape       | 3.33.1  | Graph rendering         |
| @dagrejs/dagre  | 2.0.0   | Dagre layout engine     |
| cytoscape-dagre | 2.5.0   | Cytoscape-dagre adapter |
| layout-base     | 2.0.1   | fCoSE dependency        |
| cose-base       | 2.2.0   | fCoSE dependency        |
| cytoscape-fcose | 2.2.0   | fCoSE layout            |

---

## Color System

All element and relationship types use a **deterministic hash-based palette** — `hashStr(typeName) % 16` selects the color for elements; `(hashStr(typeName) + 7) % 16` for relationships.

16-color palette:
`#1a5e8a` `#1a6e40` `#7c4a00` `#7a6400` `#52366a` `#6e5200`
`#3a5a7c` `#8a1a3e` `#1a4a6b` `#4a7a1a` `#7a2a5a` `#2a7a7a`
`#5a3a7a` `#7a5a2a` `#2a5a4a` `#6a3a2a`
