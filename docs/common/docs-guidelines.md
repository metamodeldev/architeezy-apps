# Documentation Guidelines

This guide defines the standards for project documentation. We adhere to the **Docs-as-Code**
methodology, where documentation is maintained in the repository, written in Markdown, and versioned
alongside the source code.

## General Principles

- **Docs-as-Code**: Documentation lives in the repository and follows the same lifecycle as the
  source code.
- **Single Source of Truth (SSOT)**: Avoid data duplication. Reference `common/` documentation for
  global standards instead of repeating them in application-specific files. Any logic change should
  ideally require an update in only one location.
- **Naming Conventions**: Use `kebab-case` only for all files and folders (e.g.,
  `docs-guidelines.md`).
- **Visualization**: All diagrams (flows, sequences, ER-schemas, state-machines) must be authored in
  **Mermaid.js** syntax.
- **Relative Paths**: Use relative linking for all internal cross-references (e.g.,
  `[API Contract](../common/api-contract.md)`).
- **Atomicity**: Each requirement file must describe exactly one feature or logical module.
- **Traceability**: Every document must be part of a logical chain, linking technical implementation
  back to business requirements.
- **Reference Direction**: More specific documents reference more general ones — never the reverse.
  System requirements reference functional requirements; functional requirements reference common
  standards; `vision.md` references nothing within the project. General documents (`common/`,
  `vision.md`) must not link to application-specific or lower-level documents.

## Repository Structure

```text
docs/
├── common/                        # Global standards shared across all applications
│   ├── api-contract.md
│   ├── architecture.md
│   ├── authentication.md
│   ├── coding-conventions.md
│   ├── docs-guidelines.md
│   ├── domain-model.md
│   ├── error-handling.md
│   ├── glossary.md
│   ├── state-management.md
│   └── ui-ux-guidelines.md
└── <app-name>/                    # Application-specific documentation
    ├── vision.md
    ├── functional-requirements.md
    ├── non-functional-requirements.md
    ├── traceability-matrix.md
    ├── system-requirements/
    │   └── <feature>.md
    └── test-cases/
        └── <feature>/
            ├── tc-{sr-number}.md
            └── tc-{sr-number}.md
```

Application-specific documents reference `common/` via relative paths (e.g.,
`[Coding Conventions](../common/coding-conventions.md)`). Never duplicate content from `common/`
inside application documents — link instead.

## Document Hierarchy and Purpose

### Vision (`vision.md`)

- **Purpose**: Defines the product strategy, value proposition, and high-level objectives.
- **Perspective**: Product Owner / Business Stakeholder.
- **Target Audience**: All project contributors and stakeholders.
- **Structure**:
  - **Overview**: A summary of the product's core intent.
  - **Problem Statements**: The specific pain points the product aims to solve.
  - **Target Audience**: Definition of the primary and secondary users.
  - **Strategic Goals**: High-level success criteria and business objectives.
- **Principles**:
  - Focus strictly on strategic alignment and the "Why" behind the product.
  - Maintain a technology-agnostic perspective.
  - Do not include requirement identifiers (IDs).
  - Do not include technical specifications, UI mockups, or detailed feature lists.

### Functional Requirements (`functional-requirements.md`)

- **Purpose**: Serves as a high-level inventory of system capabilities.
- **Perspective**: Product Manager / System Analyst.
- **Target Audience**: Project Managers, Architects, and Lead Developers.
- **Structure**:
  - **Overview**: Scope of the functional inventory.
  - **Functional Requirement Categories**: High-level capabilities (e.g., `FR-1: Model Management`).
  - **Feature Inventory**: Sub-requirements providing a brief description of each capability.
  - **Out of Scope**: Explicit list of features intentionally excluded from the project.
- **Principles**:
  - Act as the comprehensive "What" list for the system.
  - Requirements must be organized by business capability.
  - Use the **`FR-X`** identifier format for high-level functional requirements (e.g., `FR-1.1`).
  - Do not include user stories, acceptance criteria, or UI design.
  - Do not include technical implementation details or raw code.

### Non-Functional Requirements (`non-functional-requirements.md`)

- **Purpose**: Defines quality attributes, operational constraints, and performance benchmarks.
- **Perspective**: Architect / QA Lead.
- **Target Audience**: Developers, DevOps, and QA Engineers.
- **Structure**:
  - **Overview**: Scope of quality standards.
  - **Quality Attributes**: Requirements categorized by Domain (Performance, Security, Reliability,
    Maintainability, Accessibility, Internationalization, Browser Compatibility, Scalability,
    Monitoring, Deployment, Compliance).
  - **Requirement Block**: Each entry must include a unique ID, a Requirement Statement, Expected
    Technical Behavior (metrics), and User Experience Impact.
- **Principles**:
  - Focus on "How well" the system performs and its operational boundaries.
  - **Feedback** requirements govern user communication, response times, and interactive
    responsiveness (loading indicators, notifications, transitions).
  - All requirements must be measurable and testable.
  - Use the **`NFR-X`** identifier format for quality attributes, where the prefix encodes the
    domain:

    | Prefix  | Domain                     |
    | ------- | -------------------------- |
    | `NFR-P` | Performance                |
    | `NFR-S` | Security                   |
    | `NFR-R` | Reliability                |
    | `NFR-F` | Feedback                   |
    | `NFR-M` | Maintainability            |
    | `NFR-A` | Accessibility              |
    | `NFR-I` | Internationalization       |
    | `NFR-B` | Browser Compatibility      |
    | `NFR-L` | Scalability (Load)         |
    | `NFR-O` | Monitoring (Observability) |
    | `NFR-D` | Deployment                 |
    | `NFR-C` | Compliance                 |

  - Do not include business logic or feature-specific interaction flows.
  - Do not include UI-specific behavioral scenarios.

### Traceability Matrix (`traceability-matrix.md`)

- **Purpose**: Provides complete traceability across all requirement levels, showing mapping between
  functional requirements (FR), system requirements (SR), and test cases (TC). Serves as the single
  source of truth for understanding coverage and gaps.
- **Perspective**: Project Manager / QA Lead / Architect.
- **Target Audience**: All contributors (developers, QA, architects, stakeholders).
- **Structure**:
  - **Complete Requirements Hierarchy**: Detailed table for each FR, listing linked SRs and test
    cases with descriptions and coverage status.
  - **Coverage Summary**: High-level overview table showing which FRs have full documentation, which
    are implied/architectural, and which are pending.
  - **Gap Analysis**: Identification of missing documentation and future work items.
  - **Traceability Matrix**: Compact matrix showing FR → SR coverage and SR → TC coverage with
    legend.
  - **Related Documents**: Comprehensive cross-reference list.
- **Principles**:
  - Act as the authoritative traceability index for the entire project.
  - Must be updated whenever FR, SR, or TC documents are added, removed, or renumbered.
  - Never contradict the source documents (FR, SR, TC); this document only references them.
  - Use the coverage summary to audit documentation completeness at a glance.
  - Keep gap analysis actionable and up-to-date.

### System Requirements (`system-requirements/*.md`)

- **Purpose**: Provides detailed behavioral specifications and technical logic for specific
  features.
- **Perspective**: System Analyst.
- **Target Audience**: Implementation and QA teams.
- **Structure**:
  - **Functional Requirements Mapping**: Explicit list of parent `FR-IDs`.
  - **User Story**: High-level behavioral goal (As a... I want... So that...).
  - **Acceptance Criteria**: A "Done" checklist of testable conditions.
  - **Scenario**: Detailed interaction walkthroughs including Preconditions, Steps, and Expected
    Results.
  - **Business Rules**: Deterministic logic, formulas, state-machine transitions, and constraints.
  - **UI/UX**: Interaction specifications, visual patterns, and focus/navigation rules.
  - **Technical Notes**: Implementation specifics, library usage, and performance considerations.
- **Principles**:
  - Focus on the "How" of feature implementation.
  - Ensure every file contains a section mapping it to the corresponding FR-ID in the root
    documentation.
  - Use the **`SR-X`** identifier format for detailed system requirements.
  - Do not include project management data such as schedules, task assignments, or deadlines.
  - Do not include raw source code; use pseudo-code or logic descriptions instead.
  - **No Duplication**: Acceptance Criteria must be unique to each SR. Do not copy criteria from
    other SR documents. If multiple features share a requirement, reference it conceptually without
    repeating the exact criterion.
  - **No Implementation Details**: Do not mention specific function names, class names, file paths,
    or library-specific APIs. Describe behavior in technology-agnostic, analyst-facing language.
    Technical Notes may discuss libraries and patterns, but avoid naming specific functions or
    variables that are implementation artifacts.
  - **Atomic Acceptance Criteria**: Each acceptance criterion must describe exactly one
    independently testable behavior. Avoid compound statements using "and", "or", or semicolons that
    combine multiple independent requirements. Split combined criteria into separate atomic items.
    For example, "Nodes can be selected to show details; drill-down mode can be triggered" should be
    split into two separate criteria: one for node selection and one for drill-down activation.
    **Exception**: tightly coupled behaviors that are the direct, inseparable outcome of a single
    user action may be expressed as one criterion. If the two behaviors always occur together as a
    single observable effect and cannot be tested in isolation, splitting them adds no value. For
    example, "Changing filter settings updates the graph and table views" is acceptable as one
    criterion because both views update atomically as part of the same filter operation.
  - **Balanced Acceptance Criteria**: Acceptance Criteria should be neither too general nor too
    specific. They must provide complete coverage of the corresponding FR without gaps, but avoid
    excessive detail that belongs in other sections. Each criterion should be:
    - **Testable**: Can be verified through manual or automated testing
    - **Observable**: User can perceive the outcome directly or through system feedback
    - **Free of implementation**: No mechanisms, algorithms, or technical specifics
    - **Free of UI/UX qualities**: No "smooth", "fast", "responsive"—these go in UI/UX
    - **Free of UI interaction details**: Do not specify user interface mechanisms (e.g.,
      "double-click", "button", "dropdown", "checkbox", "hover", "keyboard shortcuts"). These
      interaction patterns belong in the UI/UX section. Instead, describe the functional outcome
      (e.g., "User can activate drill mode" rather than "Double-click activates drill mode").
    - **Free of examples**: Do not include illustrative examples (e.g., "chevron icons",
      "force-directed, hierarchical") or explanatory asides (e.g., "(back/forward)"). These belong
      in UI/UX, Technical Notes, or can be omitted if self-evident. When in doubt, ask: "Can a user
      or QA tester validate this without knowing how it's implemented?" If not, move it to Business
      Rules, UI/UX, or Technical Notes as appropriate.
  - **Separation of Concerns**: Maintain clear boundaries between document sections:
    - **Acceptance Criteria** should express functional outcomes that are directly observable or
      verifiable by users or QA. They must NOT include:
      - Implementation mechanisms (e.g., `postMessage`, localStorage keys, file formats, API
        endpoints, specific algorithms)
      - UI/UX qualities (smooth, fast, responsive) or quantitative targets (dimensions, timings)
      - UI interaction patterns (e.g., "double-click", "button", "dropdown", "checkbox", "hover",
        "keyboard shortcuts") — these belong in UI/UX
      - Future/planning notes (e.g., "future, marked as NFR-I2")
      - Overly specific naming conventions (exact filename patterns, variable names) Keep them
        testable, behavior-focused, and free of implementation details.
    - **Business Rules** should contain only deterministic domain logic, constraints, and state
      transitions. Do not include user experience attributes (smooth, fast, responsive) or visual
      design specifics (sizes, colors, layouts).
    - **UI/UX Section** is the authoritative location for all user interface and experience
      specifications: visual design (dimensions, typography, colors, layouts), interaction timing
      (delays, debounces, frame rates), responsiveness requirements, animation smoothness,
      performance expectations (load times, interaction latency), adaptability (responsive
      breakpoints), accessibility criteria, and any other user-facing quality attributes. Move such
      details here from Acceptance Criteria or Business Rules.
    - **Technical Notes** contain implementation-specific guidance: library choices, algorithms,
      data structures, storage mechanisms, API contracts, technical thresholds (e.g., animation
      cutoff at 400 nodes), filename conventions, encoding standards, and engineering trade-offs.
      These support UI/UX requirements but are not directly user-perceivable. When moving items from
      Acceptance Criteria, preserve the information here with appropriate technical context.

### Test cases (`test-cases/<feature>/tc-{sr-number}.md`)

- **Purpose**: Defines discrete, verifiable steps to validate that a feature meets its requirements.
- **Perspective**: QA Engineer / Developer.
- **Target Audience**: QA team, Developers (for manual and automated testing).
- **Structure**:
  - **System Requirement**: Link to the parent `SR` document.
  - **Functional Requirements**: Explicit list of parent `FR-IDs` that this test scenario validates.
    Multiple FRs can be listed if applicable (e.g.,
    `[FR-1.1](../../functional-requirements.md#fr-1-model-management), [FR-9.1](../../functional-requirements.md#fr-9-shareable-views-via-url)`).
    This section must appear at the beginning of each test scenario subsection (before
    Preconditions).
  - **Preconditions**: Required system state before execution.
  - **Test Steps**: Numbered list of actions; each step that requires verification is followed by an
    indented `**Expected**:` line describing the expected result.
  - **Post-conditions**: System state after execution.
  - **Test Data**: Specific inputs or mock data used for validation.
- **Principles**:
  - **Verifiability**: Every step must have a clear, objective expected result.
  - **Negative Testing**: Must include scenarios for invalid inputs, errors, and edge cases.
  - **Traceability**: Each test case must use the `TC-[SR-number].[seq]` identifier format (e.g.,
    `TC-2.5.1`) and link back to an `SR`.
  - **File organization**: One file per system requirement, named `tc-{sr-number}.md` (e.g.,
    `tc-2.5.md` for SR-2.5), placed in a subfolder named after the system requirements file (e.g.,
    test cases for `system-requirements/graph.md` go into `test-cases/graph/`). The file title
    follows the pattern `# TC-{sr-number}: <description>`. Multiple test cases for the same SR are
    separate `##` sections within the same file.
  - **1:1 Coverage**: The number of TC files in a feature subfolder must equal the number of
    Acceptance Criteria in the corresponding system requirements file. Each SR identifier maps to
    exactly one TC file — no more, no less. When an SR is added or removed, a TC file must be
    created or deleted accordingly.
  - **Concreteness**: Use specific element names, types, and values from the test data throughout
    the steps and expected results. Avoid generic placeholders such as "any node" or "some element".
  - **FR Traceability**: Each test scenario (each `##` subsection) must explicitly list the
    functional requirement(s) it covers with a clickable link to the FR document. This ensures
    bidirectional traceability from test scenarios back to the high-level functional inventory.
  - Do not include technical implementation details of how the test is automated (keep it
    descriptive).

### Common Standards (`common/*.md`)

- **Purpose**: Establishes global conventions and platform-wide architectural patterns.
- **Perspective**: Lead Engineer / Architect.
- **Target Audience**: All technical contributors.
- **Principles**:
  - Define the "Rules of the Game," including coding conventions, API standards, error handling, and
    documentation rules.
  - Serve as the foundation for all application-specific requirements.
  - Do not include application-specific business logic or individual feature requirements.

Each file in `common/` covers a distinct technical domain:

#### `architecture.md`

- **Purpose**: Defines technology choices, structural organization, and core principles that guide
  all implementation decisions.
- **Target Audience**: All technical contributors.
- **Structure**:
  - **Context & Scope**: What is covered and what is explicitly out of scope.
  - **Architectural Drivers**: Quality attributes and constraints.
  - **Technology Selection**: Key technology decisions with rationale and implications.
  - **System Structure**: Application and module organization, folder layout, dependency rules.
  - **Core Architectural Principles**: The fundamental design rules the entire codebase follows.
  - **Data Architecture**: State typology, storage strategy, state management pattern.
  - **Performance Considerations**: Load, interaction, and rendering targets.
  - **Security Principles**: Token handling, injection prevention, transport security.

#### `domain-model.md`

- **Purpose**: Defines the canonical domain model — core entities, data transformation rules, and
  invariants that all code processing domain data must maintain.
- **Target Audience**: Developers, architects.
- **Structure**:
  - **Core Entities**: Domain objects with fields, constraints, and derived properties.
  - **Data Transformation Contract**: Input format, transformation rules, parsing strategy.
  - **Filtering & Selection Semantics**: Selection state definition and resolution algorithm.
  - **State Classification**: Domain state, UI state, shareable state.
  - **Data Integrity Invariants**: Postconditions that must hold after every transformation.
  - **Mutability Policy**: Rules for when data may and may not be mutated, with rationale.

#### `coding-conventions.md`

- **Purpose**: Establishes code quality and consistency rules for HTML, CSS, and JavaScript.
- **Target Audience**: All developers.
- **Structure**:
  - **General Principles**: Formatting, naming conventions, documentation requirements.
  - **Localization**: Rules for UI strings vs. developer logs.
  - **HTML**: Semantic integrity, accessibility, asset loading, data handling.
  - **CSS**: Architectural principles, units and layout.
  - **JavaScript**: Architecture, functional programming, state and error handling, DOM interaction.
  - **Dependencies**: Dependency management rules.
  - **Testing**: Unit and integration testing requirements.

#### `api-contract.md`

- **Purpose**: Defines standards for API communication between frontend clients and backend services
  — conventions for requests, responses, errors, and security.
- **Target Audience**: Backend implementers, frontend developers, QA engineers.
- **Structure**:
  - **Authentication & Authorization**: Supported mechanisms, client responsibilities.
  - **Request Standards**: HTTP methods, headers, query parameters, request bodies.
  - **Response Standards**: Status codes, response envelope format, pagination, error format.
  - **Caching**: Cache strategy and headers.
  - **Rate Limiting**: Limit enforcement and client backoff behavior.
  - **CORS**: Cross-origin configuration requirements.
  - **Data Privacy & Security**: Transport security, PII handling, compliance.
  - **Monitoring & Observability**: Required metrics, request tracing.
  - **Implementation Guidance**: Checklists for backend and frontend teams.
  - **Contract Testing**: Testing responsibilities for both sides.

#### `authentication.md`

- **Purpose**: Defines standards for client-side authentication — token handling, UX patterns, and
  API integration.
- **Target Audience**: Frontend developers, QA engineers.
- **Structure**:
  - **Security Principles**: Token storage, transmission, and lifetime rules.
  - **User Interface**: Anonymous and authenticated UI states.
  - **Authentication Flow**: Supported flows and edge cases.
  - **Token Expiry Handling**: Response to expired or invalidated tokens.
  - **Sign-Out**: Sign-out procedure and state cleanup.
  - **API Integration**: Authenticated request pattern, user profile endpoint.
  - **State Persistence Considerations**: What auth state persists vs. clears on reload.
  - **Business Rules**: Access control policy, credential storage rules.

#### `error-handling.md`

- **Purpose**: Defines consistent approaches to error handling, graceful degradation, and user
  communication.
- **Target Audience**: Frontend developers, QA engineers.
- **Structure**:
  - **Core Principles**: Degradation strategy, message quality, recovery paths, severity model.
  - **Error Categories & Presentation**: Mapping of category → severity → presentation pattern →
    recovery strategy.
  - **Standard Presentation Patterns**: Per-pattern requirements and message guidelines.
  - **Specific Error Scenarios**: Concrete handling rules for each error category.
  - **Network Request Pattern**: Consistent fetch flow with loading indicators and error
    propagation.
  - **Error Logging Standards**: Log levels, prefixing, contextual information.
  - **User-Friendly Message Guidelines**: DO/DON'T examples.
  - **Recovery Flow Patterns**: Retry, fallback with state preservation, corruption recovery.
  - **Testing Error Scenarios**: Required test cases.
  - **Implementation Checklist**: Pre-release verification items.

#### `state-management.md`

- **Purpose**: Governs client-side state management, browser storage usage, and URL-based state
  encoding.
- **Target Audience**: Frontend developers.
- **Structure**:
  - **Core Principles**: Persistence strategy, graceful degradation, URL vs. storage boundary.
  - **Storage Keys & Schemas**: Key naming rules, namespacing, storage access requirements.
  - **Safe Storage Operations**: Reading, writing, deserialization & recovery patterns.
  - **URL State Encoding**: What belongs in the URL, parameter design, decode/apply sequence.
  - **Theme & User Preference Persistence**: Restoration timing, update-on-change flow.
  - **State Persistence Patterns**: Load and save patterns, debouncing, corruption recovery.
  - **Resource & Content Persistence**: Recent items, stale data cleanup.
  - **Multi-Tab Synchronization**: Considerations and trade-offs.
  - **Testing**: Required test scenarios.

#### `ui-ux-guidelines.md`

- **Purpose**: Defines standards for UI components, visual design, interactions, and accessibility.
- **Target Audience**: Frontend developers, QA engineers.
- **Structure**:
  - **Design Principles**: Core UX values all interfaces must follow.
  - **Visual Design Standards**: Color and contrast rules, color palette system, typography, touch
    targets, spacing and layout.
  - **Component Behavior Standards**: Standard behavior for navigation, accordions, controls,
    modals, theme switching, toasts, loading indicators, error overlays.
  - **Accessibility Standards**: Keyboard navigation, screen reader support, focus management.
  - **Animation Standards**: Timing, easing, motion preference compliance.
  - **Testing Requirements**: Accessibility and interaction checklist.

#### `glossary.md`

- **Purpose**: Defines shared terminology used across all documentation to ensure consistent
  language.
- **Target Audience**: All project contributors.
- **Structure**: Alphabetically ordered list of terms with concise definitions. Add a term whenever
  a concept requires consistent interpretation across documents.
  - Do not duplicate definitions from external standards; reference them instead.
  - Keep definitions technology-agnostic where possible.
