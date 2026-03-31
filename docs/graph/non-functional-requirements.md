# Non-Functional Requirements: Architeezy Graph

## Overview

This document defines the quality standards, performance targets, and technical constraints for
Architeezy Graph.

## NFR-1: Performance

- NFR-1.1: **Load Time.** Small models (<5k entities) must load within 3s. Medium models (<20k)
  within 8s. Large models (<50k) within 15s.
- NFR-1.2: **Responsiveness.** UI updates for filtering and checkbox toggles must occur within
  100ms. Live search results must update within 200ms.
- NFR-1.3: **Layout Calculation.** Small graphs (<1k nodes) must complete layout within 1s. Large
  graphs (<20k nodes) should complete within 20s.
- NFR-1.4: **Memory Management.** Heap growth must not exceed 10MB after 10 consecutive load/unload
  cycles.
- NFR-1.5: **Table Rendering.** Tables must use virtual scrolling for datasets exceeding 50,000
  rows.
- NFR-1.6: **Startup Payload.** The initial application bundle (HTML/JS/CSS) should not exceed 1.5MB
  (uncompressed).
- NFR-1.7: **Animation Smoothness.** Graph interactions (zoom/pan/drag) should target 60 FPS on
  modern hardware.
- **NFR-1.8: UI Concurrency.** Maintain interface responsiveness (preventing main-thread freezes)
  during the rendering and filtering of large models.

## NFR-2: Reliability

- NFR-2.1: **Data Protection.** All user-provided text must be escaped to prevent XSS. Security
  headers must restrict resource loading to trusted domains.
- NFR-2.2: **Session Security.** Authentication tokens must be stored only in-memory and cleared
  upon closing the browser.
- NFR-2.3: **Error Handling.** Network failures must trigger clear, dismissible messages with retry
  options.
- NFR-2.4: **State Consistency.** The URL, filters, graph, and table must remain perfectly
  synchronized at all times.

## NFR-3: Usability

- NFR-3.1: **Feedback.** Visual indicators must be shown for any operation exceeding 200ms.
  Notifications must be non-blocking.
- **NFR-3.2: Accessibility.** Ensure full keyboard accessibility for navigation and selection across
  all features. Interactive elements must have descriptive ARIA labels.
- NFR-3.3: **Visual Standards.** Text contrast must meet WCAG 2.1 AA requirements (4.5:1).
- NFR-3.4: **Responsive Design.** The interface must be optimized for desktop but fully usable on
  mobile with targets ≥44px.
- **NFR-3.5: Theme Management.** Support light, dark, and system theme switching with consistent
  visibility across all modes.
- **NFR-3.6: Localization.** Provide support for multiple languages in the user interface.

## NFR-4: Quality

- NFR-4.1: **Code Standards.** The codebase must maintain zero ESLint errors. Public modules must be
  documented using JSDoc.
- NFR-4.2: **Automated Testing.** Maintain ≥80% branch coverage for domain logic. Core journeys must
  be covered by E2E tests.
- NFR-4.3: **Modular Architecture.** Clear separation between functional areas to ensure independent
  updates.

## NFR-5: Infrastructure

- NFR-5.1: **No-Build Architecture.** The application must function without bundling or
  transpilation. Source files must be standard HTML, CSS, and ES Modules.
- NFR-5.2: **Static Hosting.** The application must be deployable to any standard static host
  without specialized server requirements.
- NFR-5.3: **Browser Support.** Full support for current versions of Chrome, Edge, Firefox, and
  Safari.
- NFR-5.4: **Dependency Integrity.** Third-party libraries must be loaded via versioned URLs from
  trusted CDNs.

## NFR-6: Compliance

- NFR-6.1: **Data Privacy.** Compliance with GDPR/CCPA. No third-party tracking without consent.
- NFR-6.2: **Open Source Licensing.** All dependencies must use permissive licenses (MIT or
  equivalent).
