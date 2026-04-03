# Detailed TODO Analysis for Architeezy Graph

This document provides a detailed analysis of each TODO item in `src/graph/README.md`, including
current implementation status, documentation coverage, test coverage, and specific task descriptions
for AI or human implementers.

## 1. Assess and improve UI/UX

**Current State**: General UI/UX improvements needed but not specified.

**Documentation**: Not specifically documented in functional requirements. General UI/UX guidelines
exist in `docs/common/ui-ux-guidelines.md`.

**Tests**: No specific test cases for UI/UX assessment.

**Branch**: `task/ui-ux-audit`

**Detailed Task Description**:

- Conduct a comprehensive UI/UX audit of the entire application
- Identify usability issues, accessibility problems, and visual inconsistencies
- Review against `docs/common/ui-ux-guidelines.md` standards
- Prioritize improvements based on user impact and effort
- Specific areas to evaluate:
  - Color contrast and theme consistency
  - Interactive element sizes (touch targets)
  - Keyboard navigation support
  - Screen reader compatibility
  - Loading states and feedback
  - Error messaging clarity
  - Layout responsiveness
- Document findings and create actionable improvement tickets

## 2. Configure linter file size limit to 500 lines and refactor oversized files

**Current State**: Some files exceed 500 lines (e.g., `src/graph/js/app.js`,
`src/graph/js/image-export.js`, `src/graph/js/graph.js`).

**Documentation**: Coding conventions reference linting but don't specify file size limits.

**Tests**: Not applicable.

**Branch**: `task/linter-refactor`

**Detailed Task Description**:

- Configure linter (ESLint) to enforce maximum 500 lines per file
- Identify all files exceeding the limit:
  - Run linter with custom max-lines rule
  - Review: `src/graph/js/app.js`, `src/graph/js/image-export.js`, `src/graph/js/graph.js`, and
    others
- Refactor oversized files by extracting logical groupings into separate modules:
  - Move related functions into cohesive modules
  - Maintain clear public APIs via index.js exports
  - Ensure circular dependencies are avoided
- Update imports throughout codebase
- Verify all existing tests pass after refactoring
- Run lint to confirm compliance

## 3. Remove unnecessary delay in sidebar section animations

**Current State**: Sidebar sections use animation delays that may feel sluggish.

**Documentation**: Not documented in requirements.

**Tests**: No tests for animation timing.

**Branch**: `task/animation-delay`

**Detailed Task Description**:

- Locate the sidebar section toggle animation code in `src/graph/js/ui.js` (function
  `toggleSection`)
- Identify the CSS transitions/animations causing the delay
- Measure current animation duration (likely ~300-500ms)
- Reduce animation duration to 150-200ms for snappier response
- Ensure smooth transitions remain without jarring jumps
- Test in multiple browsers for consistency
- Consider user preference: could add "Reduce motion" accessibility option

## 4. Fix SVG export

**Current State**: SVG export exists in `src/graph/js/image-export.js` but may have issues (user
reports it needs fixing).

**Documentation**: SR-5.3 describes SVG export requirements.

**Tests**: E2E test `src/graph/tests/e2e/export/tc-5.3.spec.js` exists.

**Branch**: `task/fix-svg-export`

**Detailed Task Description**:

- Identify specific SVG export issues:
  - Compare exported SVG with current requirements in `docs/graph/system-requirements/export.md`
  - Test with various graph configurations (containment modes, legends, large graphs)
- Common issues to check:
  - Legend positioning and rendering
  - Text rendering and escaping (XML special characters)
  - Node and edge appearance matching the graph view
  - ViewBox calculation accuracy
  - Background color correctness
  - Edge label positioning
  - Compound nodes in compound containment mode
- Fix identified bugs in `exportSVG()` function
- Verify exported SVG is valid (can be opened in browsers, vector editors)
- Update TC-5.3 test if needed to cover edge cases
- Test that SVG exports scale properly at any zoom level

## 5. Make PNG export identical to what's shown in the browser

**Current State**: PNG export uses `cy.png()` with legend overlay; may differ from browser view due
to resolution scaling or legend placement.

**Documentation**: SR-5.3 specifies PNG export at 2x resolution with white background.

**Tests**: E2E test `src/graph/tests/e2e/export/tc-5.2.spec.js` exists.

**Branch**: `task/fix-png-export`

**Detailed Task Description**:

- Compare PNG export output with actual browser screenshot
- Discrepancies to investigate:
  - Resolution scaling (2x vs actual display)
  - Background color (should be white, but maybe not forced correctly)
  - Legend: position, visibility, exact rendering
  - Node/edge styling: colors, shapes, label fonts
  - Dimming effects in highlight/drill modes
  - Anti-aliasing differences
- Adjust `exportPNG()` in `src/graph/js/image-export.js`:
  - Ensure canvas dimensions match visible graph area exactly
  - Verify legend is drawn at the same coordinates as on screen (use `getLegendGraphPosition()`)
  - Confirm background is solid white (override theme)
  - Check that node dimensions and label rendering match CSS styles
- Add visual regression test comparing PNG export to browser screenshot
- Document any known limitations (e.g., very large graphs may be downscaled)

## 6. Apply fit view during relayout

**Current State**: Relayout (`applyLayout()` in `graph.js`) already uses `fit: true` in layout
configs, but may not always fit properly (user suggests it's not working as expected).

**Documentation**: SR-2.2 mentions multiple layout algorithms but doesn't explicitly require fit on
relayout.

**Tests**: E2E tests in `src/graph/tests/e2e/graph/tc-2.*.spec.js` cover layout switching.

**Branch**: `task/fix-fit-view-relayout`

**Detailed Task Description**:

- Verify current behavior: when user changes layout from dropdown, does graph automatically fit?
- `applyLayout()` already passes `fit: true` to most layouts, but some may not fit correctly due to:
  - Layout animation race conditions (fit happens before animation completes)
  - Saved viewport preservation (`options.preserveViewport`) bypassing fit
  - Custom layout options overriding fit
- Ensure `fit: true` is consistently applied to all layout configurations
- After layout completes (`layoutstop` event), call `fitGraph()` if needed
- For preserved viewport cases, apply fit before saving, not after
- Test with all layout options: fcose, dagre, cose, breadthfirst, grid, circle
- Verify padding is appropriate (currently 40-50px depending on layout)
- Update TC-2.4 or create new test case to verify fit behavior

## 7. Improve highlight performance

**Current State**: Highlight mode in `src/graph/js/highlight.js` runs BFS traversal and applies
fading classes; may be slow on large graphs.

**Documentation**: Not explicitly documented; highlight is part of drill-down feature (SR-2.5).

**Tests**: Possibly covered in E2E tests but no performance tests exist.

**Branch**: `task/optimize-highlight-performance`

**Detailed Task Description**:

- Profile highlight mode performance on graphs with 1000+ nodes:
  - Measure BFS computation time
  - Measure class application time (cytoscape.batch operation)
  - Identify bottlenecks
- Optimizations to implement:
  - Memoize BFS results when drill depth and root haven't changed
  - Debounce highlight triggers if fired rapidly
  - Use cytoscape.js collection methods efficiently (avoid redundant lookups)
  - Consider using Web Worker for BFS on very large graphs (over 5000 nodes)
  - Optimize `updateLegendHighlight()` call; it may be unnecessarily recomputed
- Add performance test:
  - Create graph with N nodes/edges (e.g., 1000, 5000, 10000)
  - Measure time to apply highlight
  - Should complete within 200ms for 1000 nodes, 500ms for 5000 nodes
- Document performance characteristics in `docs/graph/non-functional-requirements.md`

## 8. Add calculation of already implemented entity and relationship counts to requirements

**Current State**: Requirements don't specify counts or metrics for implementation completeness.

**Documentation**: `docs/graph/functional-requirements.md` and `docs/graph/traceability-matrix.md`
exist but lack quantitative metrics.

**Tests**: Not applicable.

**Branch**: `task/add-implementation-metrics`

**Detailed Task Description**:

- Review all system and functional requirements
- For each requirement, calculate and document:
  - Number of entities/relationships the feature supports
  - Scale limits (e.g., "supports models up to 10,000 entities")
  - Performance benchmarks (e.g., "filters update within 200ms for 1000 entities")
  - Implementation status (complete, partial, planned)
- Update `docs/graph/traceability-matrix.md` to include:
  - Requirement IDs with actual counts/metrics from implementation
  - Validation that requirements are met
- Add a "Implemented Extent" section to each system requirement document:
  - Example: SR-2 (Graph) should state: "Tested with graphs up to 5000 nodes, 10000 edges"
  - Example: SR-4 (Filtering) should state: "Filter counts computed for full model; drill-down scope
    calculated via BFS with depth limit 5"
- Create a summary table in `README.md` showing coverage metrics

## 9. Use "entities" for objects and "relationships" for connections in documentation and implementation

**Current State**: Inconsistent terminology: code uses "elements"/"nodes" for entities and
"relations"/"edges" for relationships. Documentation uses "objects" and "connections".

**Documentation**: `docs/common/glossary.md` should define standard terms but may not align.

**Tests**: Test files use mixed terminology.

**Branch**: `task/standardize-terminology`

**Detailed Task Description**:

- Standardize terminology across the project:
  - **Entities**: Graph nodes representing architecture components (services, databases, etc.)
  - **Relationships**: Graph edges connecting entities (calls, uses, contains, etc.)
  - Avoid "objects", "connections", "elements" (except in code where cytoscape-specific)
- Update all documentation:
  - `docs/common/glossary.md`: Add clear definitions for "Entity" and "Relationship"
  - `docs/graph/functional-requirements.md`: Replace "objects" with "entities", "connections" with
    "relationships"
  - `docs/graph/system-requirements/*.md`: Update terminology consistently
  - `src/graph/README.md`: Use standard terms
- Update code comments and variable names where appropriate:
  - `allElements` → `allEntities` or keep as is if cytoscape-specific
  - `relations` → `relationships`
  - `elem` → `entity`
  - **Important**: Don't break existing code; rename only where clear and safe
  - Focus on user-facing strings and documentation first
- Update test files to use consistent terminology in descriptions
- Ensure `t()` translation keys reflect standardized terms
- Update README badge counts: "entities" and "relationships" already used in graph.js:522-539

## 10. Make configuration rows have uniform height

**Current State**: Configuration UI (likely in sidebar filter panel) has rows with uneven heights
due to content, wrapping, or font sizes.

**Documentation**: Not documented.

**Tests**: No tests for UI styling.

**Branch**: `task/uniform-config-rows`

**Detailed Task Description**:

- Identify which "configuration rows" are referenced:
  - Most likely the filter panel checkboxes and their labels
  - Check `src/graph/js/filters.js` and `src/app.css` for `.filter-item` styling
- Issue: Long type names wrap to multiple lines, causing uneven row heights
- Implement solution:
  - Option A: Truncate long names with ellipsis (`text-overflow: ellipsis`, `white-space: nowrap`,
    fixed height)
  - Option B: Set minimum height and align items, allow expansion but with consistent spacing
  - Option C: Use flexbox with `align-items: center` to vertically center content
- Update CSS in `src/app.css`:
  - `.filter-item` should have `min-height` or fixed `height`
  - Ensure checkboxes, color dots, and labels align vertically
- Test with various type name lengths (short, long, very long)
- Verify UI doesn't break with accessibility font size increases
- Check mobile/small screen behavior

## 11. Add performance tests and improve performance for large graphs

**Current State**: No performance tests exist. Performance may degrade on large graphs (1000+
nodes).

**Documentation**: `docs/graph/non-functional-requirements.md` likely has performance goals.

**Tests**: Only unit and E2E functional tests; no benchmarks.

**Branch**: `task/performance-tests-optimization`

**Detailed Task Description**:

- Define performance benchmarks:
  - Graph render time: < 2s for 1000 nodes, < 5s for 5000 nodes
  - Filter update latency: < 200ms for 1000 nodes
  - Layout computation: < 1s for 1000 nodes (without animation)
  - Table render: < 100ms for 1000 rows
  - Export operations: < 3s for 1000 nodes
- Create performance test suite:
  - Use `performance.now()` in test scripts or dedicated benchmark page
  - Generate synthetic models of various sizes (small, medium, large, very large)
  - Measure key operations: model load, layout, filter change, drill-down, highlight, export
  - Store baseline metrics in `docs/graph/performance-baselines.md`
- Identify performance bottlenecks:
  - Profile with Chrome DevTools Performance tab
  - Check for unnecessary re-renders
  - Cytoscape.js performance: node creation, layout algorithms, style updates
  - Memory leaks (accumulated event listeners, unreleased objects)
  - BFS traversals in filter/visibility/drill code
- Implement optimizations:
  - Debounce expensive operations (filter, search)
  - Virtualization for table (next task)
  - Web Workers for layout calculations (if cytoscape layout can be offloaded)
  - Reduce DOM updates (batch operations, avoid layout thrashing)
- Re-measure and document improvements

## 12. Design and implement behavior for very large models

**Current State**: Application works for moderate-sized models but may become unusable or crash with
very large models (5000+ entities).

**Documentation**: No explicit handling for "very large" models; scalability limits not defined.

**Tests**: Test data likely uses small models (< 200 entities).

**Branch**: `task/handle-large-models`

**Detailed Task Description**:

- Define "very large" threshold: e.g., > 5000 entities or > 10000 relationships
- Design graceful degradation strategies:
  - **Progressive loading**: Load model metadata first, then entities/relationships in chunks
  - **Pagination or virtual scrolling** for table (see next task)
  - **Simplified default layout** for large graphs (e.g., immediate grid without animation)
  - **Warning dialog** when loading very large models, offer options (load full, load summary only,
    sample)
  - **Automatic quality reduction**: Disable shadows, effects, label rendering for > 2000 nodes
  - **Lazy rendering**: Only render visible viewport, load nodes on zoom/pan
  - **Feature toggles**: Disable expensive features like legend, highlight mode by default for large
    models
- Implementation plan:
  1. Add model size detection on load (`totalEntities = allElements.length`)
  2. Define thresholds in config: `LARGE_MODEL_THRESHOLD = 5000`, `HUGE_MODEL_THRESHOLD = 20000`
  3. Implement progressive loading: show partial data, load remainder in background
  4. Modify UI to indicate "Large model loaded, rendering X of Y entities"
  5. Adjust layout options: skip animation, use faster layout (grid), increase layout performance
     params
  6. Update `applyLayout()` to auto-select optimized config for large graphs
  7. Test with synthetic large models to verify stability (no browser freeze)
- Document behavior in `docs/graph/system-requirements/models.md` (SR-1)

## 13. Describe and implement data virtualization for large tables

**Current State**: Table renders all rows at once, which causes performance issues and memory
pressure for large datasets.

**Documentation**: Not mentioned in table requirements (SR-3).

**Tests**: Table tests use small datasets.

**Branch**: `task/table-virtualization`

**Detailed Task Description**:

- Implement virtual scrolling for the table view:
  - Only render visible rows (plus small buffer) from the dataset
  - As user scrolls, recycle DOM rows and update content
  - Keep total scroll height accurate to give impression of full table
- Libraries: Consider using a lightweight virtual list implementation (e.g., `virtual-scroll` or
  custom)
- Implementation steps:
  1. Calculate row height (fixed or variable with estimates)
  2. Create container with `position: relative` and overflow
  3. Create content div with total height = rowCount × rowHeight
  4. Render only visible slice: `startIndex = floor(scrollTop / rowHeight)`, render ~20-30 rows
  5. On scroll event, update visible slice with `translateY` offset
  6. Handle dynamic row heights if content varies (measure each row's rendered height)
  7. Ensure sorting and filtering work with virtualized data
  8. Maintain scroll position during data updates
- Update `src/graph/js/table.js`:
  - Replace `innerHTML` full render with virtual renderer
  - Keep sort and filter logic unchanged (operate on full dataset in memory)
  - Add `scroll` event listener to update visible window
- Add performance metrics: render time, memory usage before/after
- Add tests for virtual scrolling behavior
- Document in `docs/graph/system-requirements/table.md` that table supports up to 100,000 rows via
  virtualization

## 14. Add a clickable icon next to the app title indicating that users can select a model

**Current State**: App title is static; users may not know they can change models.

**Documentation**: Not in requirements.

**Tests**: No tests for this UI element.

**Branch**: `task/add-model-selector-icon`

**Detailed Task Description**:

- Add a dropdown/select icon (e.g., caret ▼) next to the model name in the header
- Make it clickable to open the model selector dialog/panel
- Passages to modify:
  - `src/app.js` or template where header is built
  - Possibly `src/graph/js/models.js` for model selector UI
  - Add CSS for icon style and hover states
- Behavior:
  - Icon appears next to current model name
  - Tooltip: "Select model" or "Change model"
  - On click, triggers `openModelSelector()` (existing function?)
  - Close model selector on outside click or escape
- Implementation:
  - Add `<span id="model-selector-icon" class="model-selector-icon">▼</span>` after model name
    element
  - Add click handler:
    `document.getElementById('model-selector-icon').addEventListener('click', openModelSelector)`
  - Style with CSS: cursor pointer, hover color
- Verify `openModelSelector()` exists and works
- Test keyboard accessibility (Enter/Space to activate)
- Update translations (`i18n.js`) for tooltip text

## 15. Move "Show all" to the same line as the name search in filters

**Current State**: "Show all" toggle is likely on a separate line below the search input in filter
panels.

**Documentation**: Not specified in SR-4 filtering requirements.

**Tests**: Filter tests in `src/graph/tests/e2e/filtering/tc-4.*.spec.js` don't cover layout.

**Branch**: `task/improve-filter-layout`

**Detailed Task Description**:

- Locate filter panel UI structure:
  - Check `src/graph/js/filters.js` and DOM structure: `#elem-filter-list`, `#rel-filter-list`
  - The search input and "Show all" toggle are currently separate lines
- Desired layout: search input and "Show all" toggle on the same horizontal line
- Modify HTML/CSS:
  - Wrap search input and toggle in a flex container with
    `display: flex; align-items: center; gap: 8px`
  - Adjust styling to prevent wrapping
  - Ensure responsive behavior on narrow screens (stack if needed)
- Update `renderFilterList()` or the HTML template that includes the search and toggle:
  - Check if HTML is generated in JS or static in index.html
  - Likely static in `src/index.html` or built by JS
- Test with both Entities and Relationships filter panels
- Verify "Show all" functionality still works after moving
- Check translation strings if label changes
- Update any E2E tests that depend on element positioning

## 16. Implement a more accurate algorithm for calculating available filter items in drill-down mode, showing the count of objects that will be displayed when enabling each filter

**Current State**: Filter counts in drill-down mode show "Available / Total" counts, but current
algorithm may not account for complex drill-down dependencies correctly. The "available" count
should reflect how many items would appear if that filter type is enabled, considering current drill
scope and other active filters.

**Documentation**: SR-4.1 describes available counts but might not specify drill-down behavior in
detail.

**Tests**: Filter tests cover basic count updates but not drill-down edge cases.

**Branch**: `task/fix-filter-counts-drill-mode`

**Detailed Task Description**:

- Review current algorithm in `src/graph/js/filters.js` and `src/graph/js/visibility.js`:
  - `computeFilterCounts()` calculates totals, not drill-down-aware
  - Visibility updates in `applyVisibility()` use BFS for drill-down
  - The available counts displayed in sidebar come from somewhere (likely `updateStats` or separate
    function)
- Problem: When in drill-down mode, available counts should show elements within the drill scope,
  not total model.
- Current behavior may show total counts, leading to user confusion (enabling a filter shows fewer
  items than count indicated).
- Implement accurate count calculation:
  - For each entity type, compute: number of entities of that type that are within current drill
    scope AND would be visible if the type were enabled (considering that enabling the type also
    affects relationships).
  - This is essentially the count of entities that would appear if the checkbox is checked, given
    the current scope and other active filters.
  - Since this is computationally expensive, consider caching and incremental updates.
- Algorithm:
  1. Get current drill scope: `getDrillVisibleIds()` returns set of visible node IDs in drill mode
  2. For each entity type, count entities that:
     - Have that type
     - Are in drill scope (if drill active)
     - Have relationships that satisfy active relationship types (or containment)
  - Actually simpler: count entities that would be shown if the type were added to active types:
    - `candidateSet = allEntities.filter(e => e.type === candidateType)`
    - If drill mode: filter to `drillVisibleIds`
    - Count remaining: this is the "available if enabled" count
  - For relationships: trickier — depends on endpoint entity types being visible. Count
    relationships where:
    - Both endpoints are in drill scope (if drill active)
    - Relationship type matches candidate type
    - Both endpoints have entity types that are either already active or would be active if we
      assume candidate type is enabled (but we're counting relationships for a specific candidate
      type, so we need to consider: for rel type R, we need to check if its endpoint entity types
      are currently visible (active) — if any endpoint entity type is unchecked (and not the
      candidate), then the relationship cannot be shown even if we enable R, so count is 0. If
      endpoints are active or would be active if we enabled them (but we're only enabling R, not the
      entities), then count the edges.)
  - Better approach: For each relationship type, simulate enabling it and count how many edges
    become visible given current entity visibility and drill scope:
    - For each edge of that type:
      - Both endpoints must exist
      - Both endpoints must be in drill scope (if drill active)
      - Endpoints' entity types must be in active set (current active types) OR the edge's
        relationship type is being counted (we're hypothetically enabling it, but entity types
        remain as-is)
    - Actually, the "available" count for a relationship type should be: number of edges of that
      type that would be visible IF that relationship type were enabled, holding everything else
      constant (current entity types active, current drill scope). That's easy: just count edges
      where both endpoints are currently visible (drill scope + entity types). Since entity types
      are not changing in this hypothetical, we just check: edge endpoints are visible under current
      entity visibility.
  - Compute "available" as dynamic based on current state, not static totals.
- Update UI to display: `availableCount / totalCount` where availableCount is computed as described
- Add tests for drill-down scenarios with multiple entity/relationship types
- Update SR-4.1 documentation to clarify drill-down behavior
- Performance: cache drill scope and recalc only when drill state or filters change

## 17. Remove status and owner columns from the table, verify they are not in requirements or test scenarios

**Current State**: Table columns include "Status" and "Owner" (`src/graph/js/table.js` lines 135,
160-161), but these may not be required.

**Documentation**: Check `docs/graph/functional-requirements.md` and
`docs/graph/system-requirements/table.md` — they don't mention status/owner columns.

**Tests**: Test cases `src/graph/tests/e2e/table/tc-3.*.spec.js` and documentation
`docs/graph/test-cases/table/tc-3.*.md` need review.

**Branch**: `task/remove-unused-table-columns`

**Detailed Task Description**:

- Verify requirements:
  - Check FR-3.1, FR-3.2, FR-3.3 — none mention status or owner
  - Check SR-3.1, SR-3.2, SR-3.3 in `docs/graph/system-requirements/table.md` — no mention of
    status/owner
- Verify test scenarios:
  - Review all `docs/graph/test-cases/table/*.md` for references to status/owner columns
  - Review E2E tests `src/graph/tests/e2e/table/*.spec.js` for assertions on these columns
  - Likely none exist or they are superficial
- Remove status and owner columns:
  - In `src/graph/js/table.js`, edit `renderElemsTable()`:
    - Change headers: remove `t('colStatus')` and `t('colOwner')`
    - Change `colKeys` from `['name', 'type', 'status', 'owner']` to `['name', 'type']`
    - Remove corresponding `<td>` cells in row template (lines 160-161)
  - In `src/graph/js/table.js`, adjust search filter to exclude status/owner fields (line 149)
    - Search currently includes `[e.name, e.type, e.status, e.owner, e.ns]` — remove status/owner
  - In CSV export, headers will automatically update (taken from table head)
- Remove translation keys:
  - Check `src/graph/js/i18n.js` for `colStatus`, `colOwner` — remove if unused elsewhere
  - Update translation files if they contain these keys
- Update E2E tests:
  - If tests reference column indices (e.g., "click column 3"), update to new indices
  - If tests check cell content for status/owner, remove those assertions
- Update documentation:
  - Remove mention of status/owner from `src/graph/README.md` feature list if present
  - Update any screenshots to reflect new column set
- Verify no other code depends on these fields (search for `.status`, `.owner` on entities)
- Run all tests to ensure nothing breaks

## 18. Describe and implement behavior for very long names in the table (should be truncated)

**Current State**: Long entity/relationship names overflow table cells, breaking layout or creating
horizontal scroll.

**Documentation**: Not specified in table requirements.

**Tests**: No tests for text truncation.

**Branch**: `task/truncate-long-table-names`

**Detailed Task Description**:

- Implement CSS-based text truncation with ellipsis in table cells:
  - Target table cells in `src/app.css` or table-specific stylesheet
  - Apply to `<td>` elements containing names:
    - `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: [appropriate width];`
  - Set `max-width` based on viewport or column proportion
  - Alternatively, use `inline-block` with constrained width
- Column widths:
  - Name column should take remaining space after other columns
  - Type column fits badge width
  - For relationships table: Source, Target, Type, Name columns all need truncation
- Considerations:
  - Tooltip on hover to show full name? Could use existing `title` attribute
  - Ensure truncation doesn't break table layout (use `table-layout: fixed` on table and assign
    column widths)
  - On narrow screens, adjust column widths responsively
- Implementation:
  - In CSS:
    `#table-body td { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }`
  - Or per column: `th[data-col="0"], td:first-child { width: 40%; }` etc.
- Test with extremely long names (500+ chars)
- Check accessibility: truncated text should be readable by screen readers (consider `aria-label`
  with full text)
- Verify sorting still works (sort by full name, not truncated)

## 19. Fix the sidebar collapse button overlapping the table

**Current State**: When sidebar is collapsed, the collapse/expand button overlaps table content or
is positioned incorrectly.

**Documentation**: Not documented.

**Tests**: No tests for sidebar positioning.

**Branch**: `task/fix-sidebar-overlap`

**Detailed Task Description**:

- Inspect layoutstructure:
  - Sidebar (`#graph-sidebar`) and main content area (`#main` or `#cy-container`,
    `#table-container`)
  - Collapse button (`#sidebar-collapse-btn`) positioning
- Issue: Button likely positioned `absolute` or `fixed` with insufficient margin on main content
  when sidebar is hidden.
- Fix CSS layout:
  - Ensure main content area has appropriate `margin-left` that transitions when sidebar collapses
  - Button should be positioned on the edge between sidebar and main content
  - Check `src/app.css` for `.collapsed` styles on sidebar and main area
  - Typical solution:
    - Main content has `margin-left: [sidebarWidth]` (e.g., 250px)
    - When sidebar has `.collapsed`, main content becomes `margin-left: 0` or `[buttonWidth]`
    - Button positioned absolutely within sidebar, aligned to right edge
- Verify responsive behavior on mobile
- Test that table width adjusts correctly and no horizontal scrollbar appears due to overlap
- Check that graph canvas also resizes properly
- Update CSS transitions for smooth animation

## 20. Add a tooltip to the CSV button: "Export table to CSV"

**Current State**: CSV button likely has no tooltip or generic text.

**Documentation**: Not required.

**Tests**: No tooltip tests.

**Branch**: `task/add-csv-tooltip`

**Detailed Task Description**:

- Locate CSV export button in HTML/JS:
  - Button ID: `export-csv-btn`
  - In `src/graph/js/table.js` or template
- Add tooltip via `title` attribute or custom tooltip system:
  - Simple: `btn.title = "Export table to CSV"` or `title="Export table to CSV"` in HTML
  - If app uses custom tooltip component (see `src/graph/js/tooltip.js`), integrate with that
  - Use translation function `t()` for i18n: `btn.title = t('exportCsvTooltip')`
- Add translation key:
  - In `src/graph/js/i18n.js`, add `exportCsvTooltip: 'Export table to CSV'`
  - Add translations for all supported languages
- Verify tooltip appears on hover and is properly localized
- Check accessibility: `aria-label` attribute for screen readers:
  `btn.setAttribute('aria-label', t('exportCsvTooltip'))`
- If using custom tooltip, ensure it doesn't interfere with button click

## 21. Fix tabs for entities and relationships in the table looking detached from the table

**Current State**: Table tab buttons ("Entities" / "Relationships") visually separated from the
table, breaking cohesive appearance.

**Documentation**: Not documented.

**Tests**: TC-3.1 tests view switching but not tab styling.

**Branch**: `task/fix-table-tabs-styling`

**Detailed Task Description**:

- Inspect the table tab UI structure:
  - Tabs are likely in `#table-tabs` or similar container above the table
  - CSS styling causing visual gap or misalignment
- Fix CSS to attach tabs seamlessly to table:
  - Remove unnecessary margins/padding between tabs container and table
  - Ensure border continuity: tabs and table share the same border-bottom/left/right
  - Adjust `border-radius` on the tabs container: top-left/right radius, no bottom radius
  - Table should have top border only (or none) if tabs provide the border
  - Active tab should visually connect to table (same background color)
- Update `src/app.css`:
  - Look for `.table-tabs`, `.table-tab-btn`, `#table-head`, `#table-container`
  - Ensure `border-collapse: separate` if needed
  - Use flexbox for tabs container: `display: flex; border-bottom: 1px solid var(--border);`
  - Active tab: `border: 1px solid var(--border); border-bottom: none; margin-bottom: -1px;` (to
    overlap table border)
  - Table: `border-top: 1px solid var(--border); border-left/right/bottom: 1px solid var(--border);`
- Test with different states: active tab switch, table with/without data, on narrow screens
- Ensure solution doesn't break accessibility (focus states visible)

## 22. Fix bug: when opening a new model while table is open, both graph and table appear on screen

**Current State**: User opens a new model while in table view; both graph and table render
simultaneously, causing visual clutter.

**Documentation**: Not documented as a known bug.

**Tests**: No test for this specific scenario.

**Branch**: `task/fix-model-load-view-bug`

**Detailed Task Description**:

- Reproduce the bug:
  1. Load a model
  2. Switch to Table view
  3. Open model selector and choose a different model
  4. Observe: both graph canvas and table are visible, likely overlapping or stacked
- Root cause analysis:
  - When a new model loads, the app probably shows the graph by default or fails to hide the table
  - Check `loadModelData()` or model change handler in `src/graph/js/app.js` or
    `src/graph/js/models.js`
  - The view state (graph vs table) should be preserved unless explicitly changed
  - Likely: `switchView('graph')` is called on model load, overriding table view
- Fix:
  - On model change, preserve current view state
  - If current view is 'table', ensure table remains visible and graph stays hidden
  - In `switchView()` or model load handler, don't force graph view
  - Check for any `showLoading()/hideLoading()` that might toggle visibility incorrectly
  - Verify CSS classes that control visibility (`.hidden` on `#cy` or `#table-view`)
- Code locations to inspect:
  - `src/graph/js/app.js`: `onModelChange` or similar
  - `src/graph/js/ui.js`: `switchView()` function
  - `src/graph/js/models.js`: `loadModelData()` or `setCurrentModel()`
- Add test case:
  - E2E test: load model, switch to table, load another model, assert table still visible, graph
    hidden
- Verify URL state: `view=table` persists through model changes

## Additional Notes

### Terminology Clarification

- **Entity** = Graph node = element in model
- **Relationship** = Graph edge = relation in model
- **Filter counts**: "Available" = count of elements that would be visible if the type were enabled
  (dynamic, based on current scope and filters). "Total" = count in the full model (or current drill
  scope? SR-4 says "Available / Total" but Total should be total in current scope or full model?
  Need to verify spec).

### Cross-Cutting Concerns

- **i18n**: All user-facing strings need translation keys
- **Accessibility**: ARIA labels, keyboard navigation, screen reader announcements
- **Testing**: Many tasks lack test coverage; add unit/E2E tests where appropriate
- **Documentation**: Update system requirements and test cases to match implemented behavior

## Prioritization Suggestions

**High Priority** (bugs or core functionality):

- #22 (model load view bug)
- #17 (removing unused columns)
- #4 & #5 (export correctness)
- #6 (fit view on relayout)
- #7 (highlight performance)

**Medium Priority** (UX improvements):

- #15 (filter UI layout)
- #18 (table name truncation)
- #19 (sidebar overlap)
- #20 (CSV tooltip)
- #21 (table tabs styling)

**Medium Priority** (documentation/consistency):

- #8 (requirements metrics)
- #9 (terminology standardization)
- #16 (accurate filter counts)

**Low Priority** (refactoring/optimization):

- #2 (file size refactoring)
- #3 (animation delays)
- #11 (performance tests)
- #12 (very large models)
- #13 (table virtualization)

**Low Priority** (nice to have):

- #1 (general UI/UX assessment)
- #14 (model selector icon)
