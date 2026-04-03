# Vision: Architeezy Table

## Summary

Architeezy Table is a high-performance matrix analysis engine that transforms complex architectural
models into actionable, multi-dimensional databases. By flattening multi-layered model data into
intuitive cross-tabulations, it makes gaps visible, dependencies quantifiable, and architectural
decisions data-driven.

The core differentiator is its **No-Code Multi-Hop Traversal Engine**, which allows users to map
connections not just between direct neighbors (A → B), but across deep architectural chains (A → B →
C → D) in a single grid. By providing a "tabular lens" on the graph, it becomes the primary tool for
gap analysis, compliance auditing, and data health monitoring across the enterprise.

## Problems & Solutions

| Problem                                                                                                           | Solution                                                                                                                     |
| :---------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Analysis Paralysis:** Deep models with thousands of nested relationships are impossible to "read" in a graph.   | **Multi-Level Traversal:** A builder that flattens n-tier relationship chains into a readable 2D or hierarchical matrix.     |
| **Data Blind Spots:** Missing relationships or incomplete attributes are often hidden in large-scale graphs.      | **Gap Analysis Mode:** Systematic exposure of "empty" intersections, turning the matrix into a tool for model hygiene.       |
| **Noise in Large Models:** Global models are too vast for specific project-based analysis.                        | **Contextual Scoping:** Global filters and scoping rules to focus only on relevant business units, projects, or tech stacks. |
| **Heavy Tool Friction:** Legacy EA suites (Sparx, Bizzdesign) require SQL or complex scripts for custom matrices. | **No-Code Builder:** Intuitive "drag-and-drop" interface for building enterprise-grade reports in seconds.                   |
| **Static Snapshots:** Excel/PDF reports become obsolete the moment the model is updated.                          | **Live-Sync Consistency:** Direct binding to the model core ensures the matrix is always the "Single Source of Truth."       |

## Target Users & Journeys

### 1. Enterprise Architects (Governance & Hygiene)

- **Need:** Audit accountability (RACI) and identify "orphaned" or undocumented components.
- **Journey:** Rows (Apps) × Columns (Roles) → Use **Hierarchical Grouping** (Domain > Team) → Apply
  **Gap Analysis** to highlight apps without an "Owner" or "Criticality" attribute.
- **Value:** Ensures 100% governance coverage and high data quality.

### 2. Requirements & Compliance Engineers (Traceability)

- **Need:** Verify that every business requirement is realized by technical components across
  multiple layers.
- **Journey:** Rows (Requirements) × Columns (Services) → Traverse relations: _Requirement → Goal →
  Business Function → Service_ → Use **Multi-hop** to see the full chain in one cell.
- **Value:** Automated N-tier traceability for regulatory compliance.

### 3. Solution Architects (Impact & Risk)

- **Need:** Quantify the "blast radius" of a proposed change and identify high-risk coupling.
- **Journey:** Rows (Services) × Columns (Services) → Mode: "Count" → Filter by **Scope** (e.g.,
  "Payment Gateway Context") → Identify highly-coupled hotspots.
- **Value:** Objective risk assessment based on real-time dependency metrics.

### 4. Technical Managers (Resource & Tech Alignment)

- **Need:** Map team competencies to technology domains and identify "single points of failure."
- **Journey:** Rows (Teams) × Columns (Tech Stack) → Mode: "Attribute" (show Skill Level) → Identify
  gaps where critical tech has no "Expert" level support.
- **Value:** Data-driven hiring and training strategies.

## Strategic Context: Table vs. Graph

Architeezy Table is the analytical "shadow" of the Graph module, providing an orthogonal view of the
same data:

- **Graph for Discovery:** Answers "How are things connected?" (Topology, Flow, Exploration).
- **Table for Rigor:** Answers "How many?" and "What is missing?" (Quantification, Gaps, Audits).
- **Drill-Down Logic:** Users can start with a high-level hierarchical matrix (e.g., Business
  Domains) and drill down into a specific cell to see the underlying graph nodes in the Graph view.

## Competitive Landscape

| Feature                | Architeezy Table         | Spreadsheets (Excel)      | Legacy EA Suites          |
| :--------------------- | :----------------------- | :------------------------ | :------------------------ |
| **Data Integrity**     | ✅ Real-time model sync  | ❌ Manual/Stale data      | ⚠️ Periodic refresh       |
| **Ease of Use**        | ✅ No-code / AI-assisted | ⚠️ Complex pivots         | ❌ Scripting/SQL required |
| **Relationship Depth** | ✅ Multi-hop (A→B→C)     | ❌ Manual lookup          | ⚠️ Hardcoded views        |
| **Hierarchies**        | ✅ Nested Rows/Cols      | ⚠️ Limited                | ✅ Complex to set up      |
| **Data Hygiene**       | ✅ Visual Gap Analysis   | ❌ Hard to find "missing" | ❌ Limited                |
| **Security**           | ✅ Role-based masking    | ❌ None                   | ✅ Granular               |

## Performance & Scale

- **Scale:** Optimized for enterprise models with **10,000+ elements** and **50,000+ relations**.
- **Speed:** Initial render < 1.5s; Traversal computation < 200ms using an in-memory graph engine.
- **Consistency:** Matrix state (axes, filters, levels) is fully captured in the URL for instant
  sharing and reproduction.

## Roadmap

### Phase 1: Foundation (Core Engine)

- **Core Traversal:** Multi-axis resolution, subtotal/total aggregation.
- **Builder UI:** Level cards, relationship selectors, presence/count modes.
- **Live Sync:** Real-time updates as the model changes.

### Phase 2: Interaction & Hierarchies

- **Nested Axes:** Support for hierarchical headers (e.g., Domain > Team > Service).
- **Mass Edit:** Edit element names, attributes, or create/delete relations directly within cells
  (Write-back).
- **Scoping:** Advanced global filters to limit matrix data by context (Project, Tag, Owner).
- **Saved Views:** Named presets with persistent UI states.

### Phase 3: Intelligence & Analytics

- **AI-Assisted Builder:** Natural language interface (e.g., _"Show me which apps in Finance lack a
  Security Lead"_).
- **Calculated Columns:** Virtual columns using JS-like expressions (e.g.,
  `Risk = Complexity * Impact`).
- **Conditional Formatting:** Heatmaps, data bars, and threshold-based cell highlighting.
- **Trend Analysis:** Visual "diff" between matrix snapshots to track architecture evolution.

### Phase 4: Enterprise Scale & Governance

- **Security Masks:** Cell-level visibility based on user roles (hide sensitive costs or
  criticality).
- **External Data Joins:** Augment model data with external APIs (e.g., Jira status, Cloud costs).
- **Multi-Model Analysis:** Cross-reference elements from multiple federated models.
- **Global Templates:** Organization-wide library of standard analytical views.

## Conclusion

Architeezy Table democratizes enterprise analysis by removing the technical barriers to model
interrogation. It transforms the architecture from a static diagram into a dynamic decision-support
system, ensuring that gaps are closed, risks are quantified, and the architectural "Single Source of
Truth" is always maintainable and transparent.
