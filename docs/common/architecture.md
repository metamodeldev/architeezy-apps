# Architecture Overview

## Context & Scope

This document defines the high-level architecture for web applications built with this framework. It
establishes technology choices, structural organization, and core principles that guide all
implementation decisions.

**Component in scope:** Frontend application modules (single-page applications).

**Out of scope:** Backend services, CI/CD infrastructure, deployment specifics.

## Architectural Drivers

### Quality Attributes (Non-Functional Requirements)

| Priority | Attribute            | Requirement                                        |
| -------- | -------------------- | -------------------------------------------------- |
| P0       | Performance          | Responsive user experience for typical data sizes  |
| P0       | Bundle size          | Minimize initial load time                         |
| P1       | Offline capability   | Cache user data for limited offline use            |
| P1       | Internationalization | Support multiple locales                           |
| P2       | Accessibility        | Meet accessibility standards for core interactions |
| P3       | SEO                  | Not critical for app-like experiences              |

### Constraints

- Single-page applications served as static files
- Client-side rendering only
- Modern browser support
- Must be developable without backend services

## Technology Selection

### Framework: Vanilla JavaScript (ES Modules)

**Rationale:**

- Minimal bundle size
- Efficient DOM manipulation
- Sufficient for application complexity
- Easy to audit and maintain

**Implications:**

- Custom state management required
- Disciplined module organization needed
- Template literals for HTML generation
- Native browser APIs only

### UI Rendering: Third-Party Libraries or Custom

**Rationale:**

- Leverage specialized libraries where they provide clear value
- Avoid reinventing complex functionality (charts, graphs, grids)
- Choose libraries with good performance and active maintenance

**Configuration:**

- Renderer-specific styles and behaviors configured per module needs

### Styling: CSS + Custom Properties

**Rationale:**

- No build step required
- Native theming support
- Single source of truth

**Structure:**

- Global stylesheet with CSS variables for themes
- Component-scoped classes
- Inline styles only for computed values

### Testing

**Unit tests:** Fast test runner with familiar assertion API.

**E2E tests:** Cross-browser automation framework.

**Coverage target:** High coverage for critical business logic.

### Build & Development

**No build step for development or production.**

- Development: Simple HTTP server serves source directly
- Production: Deploy to static host
- CDN handles compression and caching

**Why no bundler?**

- ES modules supported natively
- Debugging with original sources
- No transpilation needed
- Avoid build friction

## System Structure

### Application Organization

```text
module/
├── index.html              # Entry point
├── app.css                 # Module styles
└── app.js                  # Application logic (entry + orchestration)
```

**Key decisions:**

1. **Independent applications.** Each module is a self-contained single-page application with no
   runtime code sharing with others. May deploy to different origins.

2. **No shared code layer.** Common utilities duplicated per module to maintain independence. Shared
   code extracted only if multiple modules need it.

3. **Flat structure within module.** All module code resides directly in the module folder. Tests
   are co-located in a separate `tests/` subdirectory.

4. **Module self-sufficiency.** Each module contains its own HTML entry, styling, and JavaScript
   logic.

### Module Pattern (Within Each App)

Each app follows a layered architecture:

- **Entry:** Bootstrap, event wiring, orchestration
- **Domain:** Pure business logic
- **Presentation:** Rendering, styling, UI components
- **Integration:** API clients, persistence

**Dependency rule:** Lower layers cannot import higher layers. Dependencies point inward.

## Core Architectural Principles

### Separation of Concerns by Domain

Each feature module owns complete responsibility for its domain. No cross-module imports.

### Immutable Domain Model

Core data loaded once and never mutated. Filtering operates via visibility or derived computations.

**Benefits:**

- Prevents corruption
- Enables easy state reset
- Supports future undo/redo

### Event-Driven Decoupling

Modules communicate via custom DOM events on `document`.

**Example:**

- Module dispatches event
- Other modules listen for it

**Rationale:**

- Explicit contracts
- No circular dependencies
- Testable and reorderable
- Supports lazy loading

### Progressive Enhancement

Application remains functional when:

- Storage unavailable or corrupted
- Network offline (cached data usable)
- External services return partial data

All storage access includes error handling and fallbacks. Errors shown as non-blocking
notifications.

### URL as Source of Truth for Shareable State

State users may bookmark or share is encoded in URL query parameters.

**In URL:**

- Resource identifiers
- Filters and search
- Context-specific mode parameters
- View mode

**Not in URL:**

- Theme preferences
- UI panel states
- Layout preferences

Implementation: Bidirectional sync between URL and app state.

### Localization-First

All user-facing strings externalized in localisation module. No hardcoded strings.

**Language detection:** Browser language → supported locale → fallback to English → fallback to key.

### Defensive Programming

All external data validated. Failures handled gracefully; application never crashes.

## Data Architecture

### State Typology

| State Type           | Lifetime   | Storage          | Examples                    |
| -------------------- | ---------- | ---------------- | --------------------------- |
| Domain data          | Session    | Memory           | Loaded records, entities    |
| User preferences     | Persistent | localStorage     | Theme, last used item       |
| UI state (transient) | Session    | Memory           | Panel states, selections    |
| Shareable state      | Persistent | URL              | Filters, context, view mode |
| Auth session         | Persistent | Memory + cookies | Session identifier          |

### State Management Pattern

No global state libraries. Instead:

- Module-scoped variables for private state
- Exported domain-specific operations for controlled access
- Events for cross-module communication

**Pattern:**

- Internal state stored in module-scoped variables
- Exports are **meaningful operations** that encapsulate state changes
- Operations combine state mutation with side effects (rendering, events)
- No generic getters/setters; operations express domain intent

## Performance Considerations

- Fast initial load
- Quick interaction response
- Efficient rendering for expected data volumes
- Reasonable memory usage

## Security Principles

1. Sensitive tokens stored in memory only
2. All dynamic content escaped before DOM insertion
3. Prefer same-origin deployments with HttpOnly cookies
4. Request only necessary data from APIs
5. Use HTTPS exclusively
