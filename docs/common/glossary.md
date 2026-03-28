# Glossary

**BFS** (Breadth-First Search) — Algorithm for traversing the graph from a starting node, used to
calculate drill-down scope and propagate visibility.

**Containment** — Hierarchical parent-child relationship where the child is owned by the parent
(distinct from reference relationships).

**Drill mode** — Focused exploration mode where only descendants of a selected node are visible,
with configurable depth limit.

**Element** — An instance in the model: a component, service, data store, business process, etc.
Graph nodes represent elements.

**Ecore** — EMF metamodeling framework; the `eClass` format indicates the type of an object
(prefix:localName).

**Filter state** — The current set of visibility rules: which element types, relationship types, and
search terms are active.

**Metamodel** — The schema defining element types and relationship types (e.g., ArchiMate, UML,
BPMN, or custom). A model is an instance of a metamodel.

**Model** — A complete instance of a metamodel, containing elements and relationships between them.

**Relationship** — A directed edge between two elements (e.g., "uses", "depends-on", "owns"). Graph
edges represent relationships.

**Shareable state** — Application state that can be encoded in the URL, allowing users to bookmark
or share specific views that reproduce exactly what they see.

**URL state** — The complete shareable state encoded in query parameters (model ID, filters, drill
mode, view mode).

**Visibility state** — The computed set of elements and relationships that should be displayed based
on filters, drill mode, and graph traversal.
