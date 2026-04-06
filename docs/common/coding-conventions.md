# Coding Conventions

## General Principles

The primary requirement for code is **clarity**. Clear code ensures that errors are easier to find,
bugs are harder to commit, performance bottlenecks are visible, and maintenance is sustainable.

### Formatting and Consistency

- **Unified Rules:** Code must be formatted according to consistent rules. Use automated tools to
  enforce consistency and reduce cognitive load.

### Naming Conventions

- **English Word Order:** Use standard English adjective-noun order. The main noun must be at the
  end, with modifiers preceding it (e.g., `TaskHistoryExportService` is a service for exporting the
  history of tasks).
- **No Prefixes/Suffixes:** Avoid indicators of data types or metadata in names (e.g., no `strName`,
  `UserArr`, `iCount`).
- **Generalization:** Prefer general names over overly specific ones if the context is clear. For
  example, use `creationDate` instead of `userAccountCreationDate` if it is clear from the context
  that the date refers to a user account.
- **No Abbreviations:** Words in names must be written in full. Abbreviations such as `Elem`, `Rel`,
  `Src`, or `Btn` are prohibited. The only globally accepted abbreviation is `Id`. Short-lived
  lambda parameters are allowed when the context is immediate.
- **Acronym Casing:** Treat acronyms as words. Only the first letter is capitalized (e.g.,
  `JsonParser` instead of `JSONParser`). This improves readability, especially when multiple
  acronyms are combined, and ensures better IDE integration.
- **US English:** Use American spelling for all identifiers and documentation.

### Self-Documenting Code and JSDoc

- **Mandatory Documentation:** All exported functions, variables, and classes must have JSDoc
  documentation.
- **Language:** Documentation must be written in English.
- **Intent over Comments:** Code should be written so that it is understandable without comments.
  Use comments only to explain "why" (non-obvious logic or hacks), not "what".

## Localization

- **UI Strings:** All strings visible to the end-user must be localized.
- **Developer Logs:** Internal error messages or exceptions intended for developers should not be
  localized.

## HTML

### Semantic Integrity and Accessibility

- **Native UI Elements:** Prioritize native HTML elements over custom implementations. Use
  `<dialog>` for modals, `<details>`/`<summary>` for accordions, and `<time>` for dates and
  durations. These provide built-in accessibility, focus management, and keyboard support.
- **Structural Semantics:** Use landmark elements like `<header>`, `<footer>`, `<main>`, `<nav>`,
  `<section>`, and `<article>` to define page architecture. Avoid generic `<div>` tags for
  structural purposes.
- **Actionable Elements:** Use `<button>` for actions and `<a>` for navigation. Do not attach click
  listeners to `<div>` or `<span>` without `tabindex="0"` and `role="button"`.
- **Form Association:** Every input must have a programmatic label via `for/id` or nesting.
- **Inert State:** Use the `inert` attribute to globally disable interaction for hidden/background
  layers (e.g., content under a modal).
- **Validation:** Prioritize HTML5 built-in validation (`required`, `pattern`). Use JavaScript only
  for complex cross-field logic.

### Asset Loading and Data Handling

- **Script Execution:** Use `defer` or `type="module"` for all external scripts to ensure
  non-blocking parsing and DOM availability.
- **Data Decoupling:** Use `data-*` attributes strictly for passing configuration or state from HTML
  to JavaScript. Access them via the `dataset` API.

## CSS

### Architectural Principles

- **CSS-First Approach:** Use CSS instead of JavaScript wherever possible (interactive states,
  simple UI toggles, layout adjustments).
- **CSS Animations:** Implement all animations and transitions strictly via CSS. Avoid
  JavaScript-driven animations.
- **No Inline Styles:** Prohibit `el.style` modifications for static changes. Use CSS classes and
  `classList`.

### Units and Layout

- **Scalable Units:** Use `rem` for `font-size`. Use `em` for padding/margin that scales with text.
- **Box Model:** Set `box-sizing: border-box` globally.
- **Layout Engines:** Use CSS Grid for macro-layouts and Flexbox for micro-components.
- **Z-Index Management:** Use CSS Variables for `z-index` to prevent "magic number" conflicts and
  manage stacking contexts.

## JavaScript

### Bottom-Up Architecture and Structuring

- **Domain-Driven Design (DDD):** Group code first by domain (e.g., `user`, `tasks`), then by layer
  (e.g., `services`, `controllers`). Avoid flat "all-services" directories.
- **Domain Primitives:** Implement a minimal set of functions for each domain to serve as a DSL.
  Build complex features by composing these primitives upward.
- **Top-Down File Order:** Order functions so that high-level logic appears first, followed by the
  helper functions they call. Related functions (e.g., `addListener` and `removeListener`) should be
  grouped together in logical order.
- **Variable Locality:** Declare and initialize variables as close to their first usage as possible,
  preferably in a single expression. Do not declare variables at the top of a function if they are
  used 50 lines later.

### Module Interaction and Communication

- **Communication Simplicity:** Interaction between modules must be as simple as possible. Minimize
  coupling by using the most direct method that doesn't violate architectural layers.
- **Direct Function Calls:** Use direct calls for hierarchical or vertical communication (e.g., a
  controller calling a service it owns). This is the preferred method for clear, traceable logic.
- **Custom Events:** Use `CustomEvent` for horizontal communication between independent domains. A
  module should notify that "something happened" without knowing who reacts.
- **Prohibition of Callbacks:** Do not pass callbacks between modules for state synchronization or
  orchestration. This obscures the execution flow and creates "spaghetti" logic. Use `Promises` for
  async results or `Events` for notifications.
- **Atomic API Design:** Avoid two-step operations where the caller has to fetch a state, modify it,
  and send it back (e.g., `setItems(getItems().add(x))`). Provide single, descriptive methods for
  actions (e.g., `addActiveElement(type)`).
- **Global Scope Restriction:** The use of `globalThis`, `window`, or `self` to store application
  state, share logic, or bypass the module system is strictly prohibited. Use explicit
  `import`/`export`.

### Functional Programming and Logic

- **Pure Functions:** Isolate business logic into functions that do not modify external state or
  touch the DOM.
- **Early Return Pattern:** Handle edge cases and validation at the start of the function. Prohibit
  large `if` blocks wrapping the entire function body.
- **Function Structure:** Follow this sequence: 1. Input validation, 2. Pre-processing, 3. Main
  actions, 4. Result preparation, 5. Return.
- **Simple Lambdas:** Keep lambda expressions minimal. If a `.forEach()` or `.map()` logic is
  complex, move it to a named function: `.map(transformData)`.

### State and Error Handling

- **Encapsulated State:** State must be owned by a single module and hidden from the outside world.
- **Immutable State Exposure:** Getters must return immutable collections or clones of the data
  (e.g., `return [...this.items]`). The outside world must never be able to mutate a module's
  internal state directly by modifying a returned reference.
- **No Redundant Accessors:** Avoid generating "dumb" getters and setters for every internal
  variable (e.g., `setFilterCounts`). Only expose state and update methods that are strictly
  necessary for the application logic.
- **Controlled Updates:** State updates must be intentional and highly controlled. Prohibit patterns
  like `setX(getX())` which indicate a lack of proper encapsulation and logic ownership.
- **Immediate Error Throwing:** If an error occurs (e.g., an object is not found by ID), throw an
  exception immediately. Do not return `null` or `undefined`, as it forces duplicated checks and
  hides bugs.
- **Encapsulated Constants:** Avoid centralized global constant files. Keep constants within the
  modules where they are used.

### DOM Interaction and Performance

- **Event Delegation:** Attach a single listener to a parent element for dynamic child nodes.
- **Layout Thrashing:** Group DOM reads (e.g., `offsetWidth`) and DOM writes (e.g., `style.left`)
  separately. Never interleave them in a loop.
- **Execution Scheduling:** Use `requestAnimationFrame` for visual updates and `requestIdleCallback`
  for non-critical background tasks.
- **Cleanup:** Manually clear `setInterval` and `removeEventListener` when an element or component
  is removed from the DOM.

## Dependencies

- **Circular Dependencies:** Prohibit circular dependencies, both explicit (imports) and implicit
  (logic/naming). Generic modules must never reference specific entities (e.g., an "attributes"
  module should not know about "tasks" or "projects").
- **Explicit Hierarchy:** A module in a lower layer (e.g., `utils` or `dom-primitives`) must never
  import or reference modules from a higher layer (e.g., `feature-controllers`).
- **Library Minimalism:** Do not add third-party libraries for simple functions that can be
  implemented in a few lines. Minimize the dependency footprint.

## Testing

- **Unit Testing:** All pure utility functions and business logic must have unit tests.
- **Integration Testing:** Test critical user flows and verify JavaScript-DOM interactions. Maintain
  high code coverage to ensure no unused or unreachable code exists.
