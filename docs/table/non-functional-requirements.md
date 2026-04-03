# Non-Functional Requirements: Architeezy Table

## Overview

This document defines the quality standards, performance targets, and technical constraints for
Architeezy Table.

## NFR-1: Performance

- **NFR-1.1: Load Time.** Small models (<5k entities) must load within 2s. Medium models (<20k)
  within 5s. Large models (<50k) within 10s.
- **NFR-1.2: Responsiveness.** UI updates for filtering and builder toggles must occur within 100ms.
  Matrix re-computation for typical views should complete within 300ms.
- **NFR-1.3: Table Rendering.** The system must render tables with up to 10,000 rows without
  significant UI lag.
- **NFR-1.4: Memory Management.** Maintain stable memory consumption during consecutive model
  load/unload cycles.
- **NFR-1.5: Startup Payload.** The initial application bundle (HTML/JS/CSS) should not exceed 1MB
  (uncompressed).
- **NFR-1.6: Animation Smoothness.** Expand/collapse transitions and UI interactions should target
  60 FPS.
- **NFR-1.7: UI Concurrency.** Matrix computation must not block the main thread, keeping the
  interface responsive during large-scale calculations.

## NFR-2: Reliability

- **NFR-2.1: Data Protection.** All user-provided text must be escaped to prevent XSS. Security
  headers must restrict resource loading to trusted domains.
- **NFR-2.2: Session Security.** Authentication tokens must be stored only in-memory and cleared
  upon closing the browser or signing out.
- **NFR-2.3: Error Handling.** Network and parsing failures must trigger clear, dismissible messages
  with retry options.
- **NFR-2.4: State Consistency.** The URL, matrix definition, and rendered table must remain
  perfectly synchronized at all times.

## NFR-3: Usability

- **NFR-3.1: Feedback.** Visual indicators (spinners or progress bars) must be shown for any
  operation exceeding 200ms.
- **NFR-3.2: Accessibility.** Ensure full keyboard accessibility for navigation. Interactive
  elements must include descriptive ARIA labels.
- **NFR-3.3: Visual Standards.** Text contrast must meet WCAG 2.1 AA requirements (4.5:1).
- **NFR-3.4: Responsive Design.** The interface must be optimized for desktop and tablet viewports.
- **NFR-3.5: Theme Management.** Support light, dark, and system theme switching with consistent
  visibility.
- **NFR-3.6: Localization.** Provide support for multiple languages (including English and Russian).

## NFR-4: Quality

- **NFR-4.1: Code Standards.** The codebase must maintain zero ESLint errors. Public modules must be
  documented using JSDoc.
- **NFR-4.2: Automated Testing.** Maintain ≥80% branch coverage for matrix computation logic. Core
  journeys must be covered by E2E tests.
- **NFR-4.3: Modular Architecture.** Clear separation between the parser, computation engine, and UI
  components to ensure maintainability.

## NFR-5: Infrastructure

- **NFR-5.1: No-Build Architecture.** The application must function without bundling or
  transpilation. Source files must be standard HTML, CSS, and ES Modules.
- **NFR-5.2: Static Hosting.** The application must be deployable to any standard static host
  without specialized server requirements.
- **NFR-5.3: Browser Support.** Full support for current versions of Chrome, Edge, Firefox, and
  Safari.
- **NFR-5.4: Dependency Integrity.** Third-party libraries must be loaded via versioned URLs from
  trusted CDNs.

## NFR-6: Compliance

- **NFR-6.1: Data Privacy.** Compliance with GDPR/CCPA. No third-party tracking without explicit
  consent.
- **NFR-6.2: Open Source Licensing.** All dependencies must use permissive licenses (MIT, Apache
  2.0, or equivalent).
