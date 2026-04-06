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

### Script Loading

- **Execution Scheduling:** Use `defer` or `type="module"` for all external scripts to ensure
  non-blocking parsing and DOM availability.

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

### Reactive Architecture and State Management

- **Signal-Based Reactivity:** Implement a reactive architecture based on **Signals** rather than an
  event-based model. Signals provide a more explicit data flow, making dependencies visible and the
  application significantly easier to debug.
- **Explicit Data Flows:** Logic must be structured so that data flows in a clear, traceable
  direction. Signals ensure that when a piece of state changes, the impact on the rest of the system
  is predictable and localizable.
- **Events for Intent, Signals for State:** Use standard DOM events only to capture user intent
  (e.g., `click`). Once captured, the state must be updated via signals. Avoid using events for
  internal state synchronization between modules.

### DOM Interaction and Data Boundaries

- **DOM as a View Layer:** The DOM must be treated strictly as a target for updates (a view). It is
  a projection of the application state, not a source of truth.
- **No Data Storage in DOM:** It is strictly prohibited to store substantial application data,
  complex objects, or state within DOM elements (e.g., in hidden attributes, custom properties, или
  complex `data-*` JSON strings).
- **No Data Exchange via DOM:** Modules must never use the DOM as a communication bus. Exchanging
  data between modules by reading from or writing to DOM elements is prohibited. All communication
  must occur within the JavaScript layer using signals or direct calls.
- **Read-Only Data Attributes:** `data-*` attributes should only be used for static configuration
  passed from the server or for simple CSS targeting.

### Bottom-Up Architecture and Structuring

- **Domain-Driven Design (DDD):** Group code first by domain (e.g., `user`, `tasks`), then by layer
  (e.g., `services`, `controllers`). Avoid flat "all-services" directories.
- **Domain Primitives:** Implement a minimal set of functions for each domain to serve as a DSL.
  Build complex features by composing these primitives upward.
- **Top-Down File Order:** Order functions so that high-level logic appears first, followed by the
  helper functions they call. Related functions (e.g., `addListener` and `removeListener`) should be
  grouped together in logical order.
- **Variable Locality:** Declare and initialize variables as close to their first usage as possible,
  preferably in a single expression.

### Module Interaction and Communication

- **Communication Simplicity:** Interaction between modules must be as simple as possible. Minimize
  coupling by using the most direct method that doesn't violate architectural layers.
- **Direct Function Calls:** Use direct calls for hierarchical or vertical communication (e.g., a
  controller calling a service it owns).
- **Reactive Subscriptions:** Use signal-based effects to react to state changes across independent
  modules.
- **Prohibition of Callbacks:** Do not pass callbacks between modules for state synchronization. Use
  `Promises` for async results and `Signals` for state.
- **Atomic API Design:** Provide single, descriptive methods for actions (e.g.,
  `addActiveElement(type)`) instead of exposing raw internal setters.
- **Global Scope Restriction:** The use of `globalThis`, `window`, or `self` to store application
  state or logic is strictly prohibited. Use explicit `import`/`export`.

### Functional Programming and Logic

- **Pure Functions:** Isolate business logic into functions that do not modify external state or
  touch the DOM.
- **Early Return Pattern:** Handle edge cases and validation at the start of the function. Prohibit
  large `if` blocks wrapping the entire function body.
- **Simple Lambdas:** Keep lambda expressions minimal. If a `.forEach()` or `.map()` logic is
  complex, move it to a named function.

### State and Error Handling

- **Encapsulated State:** State must be owned by a single module and hidden from the outside world.
- **Immutable State Exposure:** Getters must return immutable collections or clones of the data. The
  outside world must never mutate a module's internal state directly via a returned reference.
- **Immediate Error Throwing:** If an error occurs, throw an exception immediately. Do not return
  `null` or `undefined` as a way to handle expected logical failures, as this hides bugs.

### Performance

- **Event Delegation:** Attach a single listener to a parent element for dynamic child nodes.
- **Layout Thrashing:** Group DOM reads (e.g., `offsetWidth`) and DOM writes (e.g., `style.left`)
  separately. Never interleave them in a loop.
- **Cleanup:** Manually clear `setInterval` and `removeEventListener` when an element or component
  is removed from the DOM to prevent memory leaks.

## Dependencies

- **Circular Dependencies:** Prohibit circular dependencies, both explicit (imports) and implicit
  (logic/naming). Generic modules must never reference specific entities.
- **Library Minimalism:** Do not add third-party libraries for functions that can be implemented
  natively in a few lines.

## Testing

- **Unit Testing:** All pure utility functions and business logic must have unit tests.
- **Integration Testing:** Test critical user flows and verify JavaScript-DOM interactions.
