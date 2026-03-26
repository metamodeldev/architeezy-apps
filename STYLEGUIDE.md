# Code Style Guide

## HTML

### Semantic Integrity and Accessibility

- **Actionable Elements:** Use `<button>` for actions and `<a>` for navigation. Do not attach click
  listeners to `<div>` or `<span>` without `tabindex="0"` and `role="button"`.
- **Form Association:** Every input must have a programmatic label via `for/id` or nesting. Use
  `aria-label` only when a visual label is impossible.
- **Interactive Constraints:** Never nest interactive elements (e.g., a `<button>` inside an `<a>`).
- **Inert State:** Use the `inert` attribute to globally disable interaction and hide elements (like
  background content under a modal) from screen readers.
- **Validation:** Prioritize HTML5 built-in validation (`required`, `pattern`, `type`). Use
  JavaScript only for complex cross-field logic.

### Asset Loading and Data Handling

- **Script Execution:** Use `defer` or `type="module"` for all external scripts.
- **Resource Prioritization:** Apply `loading="lazy"` to images and iframes outside the initial
  viewport. Provide explicit `width` and `height` to prevent Layout Shift (CLS).
- **Data Decoupling:** Use `data-*` attributes strictly for passing configuration or state from HTML
  to JavaScript. Access them via the `dataset` API.

### Forbidden HTML Practices

- **Presentational Markup:** Avoid tags like `<center>`, `<font>`, or `<br>` for spacing. Use CSS
  margins/padding instead.
- **Inline Event Handlers:** Do not use `onclick`, `onchange`, etc., in HTML markup.

## CSS

### Units and Typography

- **Scalable Units:** Use `rem` for `font-size`. Use `em` for padding/margin that must scale with
  text.
- **Line Height:** Define `line-height` as a unitless multiplier (e.g., `1.5`) to ensure inheritance
  stability.
- **Fluid Typography:** Utilize `clamp()` for responsive font sizing instead of excessive media
  queries.

### Layout and Performance

- **Box Model:** Set `box-sizing: border-box` globally.
- **Layout Engines:** Use CSS Grid for macro-layouts and Flexbox for micro-components.
- **Animation Optimization:** Limit transitions and animations to `transform` and `opacity`.
- **Z-Index Management:** Use CSS Variables for `z-index` to prevent "magic number" conflicts and
  manage stacking contexts.

### Selectors and Architecture

- **Specificity Control:** Limit selector depth to a maximum of 3 levels. Prefer class-based
  selectors over ID or tag selectors.
- **Mobile First:** Write base styles for mobile and extend for desktop using `min-width` media
  queries.

### Forbidden CSS Practices

- **Pixel-Based Typography:** Never hardcode `font-size` in `px`.
- **Float Layouts:** Do not use `float` or `inline-block` for structural positioning.
- **!important Overuse:** Prohibit `!important` in component logic; it is allowed only for
  utility-first override classes.
- **Will-Change Overuse:** Avoid `will-change` unless a specific performance bottleneck is
  identified.

## JavaScript

### Functional Programming and Logic

- **Pure Functions:** Isolate business logic into pure functions (input -> output). They must not
  modify external state or touch the DOM.
- **Immutability:** Treat arguments as read-only. Do not mutate objects or arrays; return new copies
  using the spread operator (`...`) or non-mutating methods (`map`, `filter`, `reduce`).
- **State Management:** Do not store application state or raw data inside DOM nodes. Use dedicated
  JavaScript objects, `Map`, or `WeakMap`.
- **Defensive Coding:** Implement "Early Returns" to reduce nesting and handle error states first.

### DOM Interaction and Events

- **Event Delegation:** Attach a single listener to a parent element for dynamic child nodes.
- **Execution Scheduling:** Use `requestAnimationFrame` for visual updates and `requestIdleCallback`
  for non-critical background tasks.
- **Layout Thrashing:** Group DOM reads (e.g., `offsetWidth`) and DOM writes (e.g., `style.left`)
  separately. Never interleave them in a loop.
- **Passive Listeners:** Use `{ passive: true }` for `scroll`, `wheel`, and `touch` events to
  improve scrolling performance.
- **Batching Updates:** Perform heavy DOM manipulations off-screen using `DocumentFragment` or
  `<template>`.

### Data and Asynchronicity

- **Fetch Safety:** Always wrap `fetch` in `try/catch`, check `response.ok`, and handle global
  runtime failures via `window.onerror` or `unhandledrejection`.
- **Abort Signal:** Use `AbortController` to cancel fetch requests or remove groups of event
  listeners simultaneously.

### Testing and Reliability

- **Unit Testing:** All pure utility functions and business logic must have unit tests (e.g., using
  Vitest or Jest). Aim for high coverage of edge cases.
- **Integration Testing:** Test critical user flows by verifying the interaction between JavaScript
  and the DOM.
- **Cleanup Operations:** Manually clear `setInterval` and `removeEventListener` when an element or
  component is removed from the DOM to prevent memory leaks.

### Forbidden JavaScript Practices

- **Direct Style Injection:** Do not modify `el.style` directly for static changes; toggle CSS
  classes via `classList`.
- **Synchronous Blockers:** Never use synchronous XHR or long-running loops that block the main
  thread.
- **Magic Strings:** Do not use hardcoded strings/numbers in logic. Move them to a `const CONFIG` or
  `const TYPES` object.
- **Loop Listeners:** Never attach event listeners inside loops. Use delegation instead.
