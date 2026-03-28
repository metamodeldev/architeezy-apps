# Domain Model Specification

## Purpose

This document defines the canonical domain model for applications built with this framework. It
specifies core entities, data transformation rules, and invariants that must be maintained by all
code processing domain data.

## Core Entities

### Aggregate Root

The root object that contains a complete, coherent graph of domain elements. The aggregate is the
unit of data loading and consistency.

**Structure:**

- `id`: unique identifier
- `items`: collection of all entities in the graph (not just direct children)
- `relationships`: collection of connections between entities

**Key points:**

- The aggregate owns all entities and relationships.
- `items` includes **all** entities in the graph, not just direct children of a root.
- Relationships reference only IDs present in `items`.
- The containment hierarchy is represented via an optional parent reference on entities.
- The aggregate boundary defines the transaction/consistency boundary.
- **Immutable after construction** — all data structures are deeply frozen once built.

### Entity

A distinct domain object (node in the graph).

**Fields:**

- `id`: unique identifier (required)
- `type`: type classification (required)
- `name`: display label (required)
- `attributes`: additional domain-specific properties (optional)
- `parent`: parent entity ID if hierarchical (optional)
- `ns`: namespace prefix (optional)
- `doc`: documentation/description (optional)

**Notes:**

- `id` must be globally unique within the aggregate.
- `type` and `name` are required non-empty strings.
- `parent` if present must reference an `id` of another entity in the same aggregate. Absence
  indicates a root-level entity.
- `ns` and `doc` convey namespace and documentation from the source model.

**Derived/computed properties:**

- `displayName` = `name` if non-empty else `type`
- `hasChildren` = true if other entities have `parent` equal to this entity's id
- `isRoot` = true if `parent` is absent

### Relationship

A directed connection between two entities.

**Fields:**

- `id`: unique identifier (required)
- `type`: relationship type (required)
- `source`: source entity ID (required)
- `target`: target entity ID (required)
- `name`: display label (optional)
- `properties`: additional domain-specific data (optional)

**Notes:**

- `source` and `target` must reference IDs of entities present in the aggregate.
- `id` is globally unique among all relationships in the aggregate.
- `type` is required and non-empty; it categorizes the relationship.
- `name` provides a human-readable label for the relationship.

## Data Transformation Contract

### Input Format

External data delivered as structured JSON with typed objects representing model elements from
EMF/Ecore-based formats (ArchiMate, C4, EIP, Domain models, Class models, etc.).

Example envelope:

```json
{
  "content": [ { "id": "...", "type": "...", "eClass": "...", "data": { ... } } ]
}
```

### Transformation Rules (Pure Function)

Given input JSON, produce an `Aggregate`:

1. **Process each typed object:**
   - Extract type information from object
   - Create entity with ID, type, name, and attributes
   - Recurse into nested structures

2. **Create relationships from references:**
   - For properties that represent connections to other entities
   - For embedded objects that contain source/target references
   - For ID references to other entities

3. **Build hierarchy:**
   - Establish parent-child relationships based on containment structure
   - Parent-child is distinct from relationships between entities

4. **Filter system metadata:**
   - Skip internal/system objects not part of the domain model (e.g., EMF internals)

5. **Root handling:**
   - The root container object is not itself an entity; only its descendants become entities
   - Process all descendants recursively

**Transformer must be pure:** Same input yields same output. No side effects.

### Universal Parsing Strategy

The parser is structural and does not require hardcoded type names. It works for any metamodel by
examining object structure:

**Classification:**

- Objects that have both a source and target reference → relationships/edges
- Objects that have only a target reference (and have a known parent) → embedded reference from
  parent to target
- Objects with neither source nor target → nodes/elements

**Traversal:**

- All array-valued properties in the data are traversed recursively; no property name whitelist is
  used.
- For nested objects with type markers, the classification rules apply recursively.
- For string references that are UUIDs, relationships are created from the current parent to that
  entity.
- The top-level container in the content array is never treated as a node; only its children and
  deeper descendants are processed.

**Naming convention:**

- Preferred fields for display name, in order: `name`, `label`, `title`.
- If none are present, the element's type is used as the display name.

**Filtering:**

- Internal EMF metadata objects (such as `EStringToStringMapEntry` from the Ecore namespace) are
  silently skipped. These are implementation artifacts without domain meaning.

**Containment hierarchy:**

- When a node appears within another node's data structure, a parent-child relationship is recorded
  on the child entity.
- This containment relationship is separate from semantic relationships and is used for specialized
  visualization modes.

**Namespace resolution:**

- The model's namespace URI is derived from the root element's type prefix, resolved via the
  top-level namespace mapping in the JSON response.
- This namespace serves as a key for isolating filter preferences per model.

## Filtering & Selection Semantics

### Selection State

Conceptual state for filtering and focus:

- **Visible item IDs**: Optional whitelist of entity IDs that should be shown; when absent, all
  non-hidden items are visible.
- **Visible relationship types**: Set of relationship types to show; empty means all types visible.
- **Hidden item types**: Set of entity types to exclude from display.
- **Hidden relationship types**: Set of relationship types to exclude.
- **Focus root ID**: When set, activates focus mode centered on this entity.
- **Focus depth**: Maximum traversal depth from the focus root (used when focus mode is active).

### Selection Algorithm

Given `SelectionState` and `Aggregate`:

1. **Initialize visible set:**
   - If focus mode active: start with the focus root entity only (optionally limiting by depth).
   - Otherwise: start with entities whose types are not in `hidden item types`, optionally
     intersecting with an explicit whitelist if provided.

2. **Expand visible set:**
   - From each visible entity, traverse along relationships to connected entities.
   - Add connected entities if their entity type is active and the relationship type passes filters.
   - Continue traversal (breadth-first or depth-first) until no new entities are discovered.

3. **Relationship visibility:** A relationship is visible if both endpoint entities are visible and
   its type is not hidden (and is in the whitelist if provided).

4. **Hierarchy:** Parent entities are not automatically visible when a child is visible; they are
   included only by explicit traversal or as the focus root.

## State Classification

### Domain State (In Aggregate)

- Loaded entities and relationships
- Aggregate identity
- Filter conditions
- Context parameters

### UI State (Not in Aggregate)

- Theme preferences
- Layout preferences
- Panel states
- Current selection (unless it defines context)
- Viewport position

### Shareable State (In URL)

- Resource identifier
- Filters and search terms
- Focus mode parameters
- View mode

## Data Integrity Invariants

After transformation, these must **always hold**:

1. Entity IDs are unique within the aggregate.
2. All relationship `source` and `target` IDs reference existing entities in the aggregate.
3. Parent reference (if present) must reference an existing entity ID; absent indicates a root
   entity.
4. Entity `type` is a non-empty string.
5. Entity `name` is a non-empty string (transformer provides fallback if needed).
6. Aggregate is deeply immutable after construction.

## Mutability Policy

**During transformation:** Structures may be mutated freely to build the aggregate.

**After transformation:** All data is deeply frozen. Operations compute derived state rather than
modifying. The UI layer hides non-selected items via presentation, not by removing from data
structures.

**Rationale:** Immutability prevents corruption, enables debugging, supports undo/redo.

**Enforcement:** Code review; optional runtime freezing in development to catch violations.
