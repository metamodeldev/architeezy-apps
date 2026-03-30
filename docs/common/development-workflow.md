# Development Workflow

## Adding a New Application

1. Define the product's vision in `docs/[new-app]/vision.md` in accordance with
   [docs-guidelines.md](docs-guidelines.md).
2. Define the high-level functional requirements in `docs/[new-app]/functional-requirements.md` in
   accordance with [docs-guidelines.md](docs-guidelines.md).
3. Define the non-functional requirements in `docs/[new-app]/non-functional-requirements.md` in
   accordance with [docs-guidelines.md](docs-guidelines.md).
4. Define detailed system requirements in `docs/[new-app]/system-requirements/` in accordance with
   [docs-guidelines.md](docs-guidelines.md), creating one file for each functional requirement
   group.
5. Define test cases in `docs/[new-app]/test-cases/` in accordance with
   [docs-guidelines.md](docs-guidelines.md), creating one directory for each system requirement file
   and one file within that directory for every acceptance criteria.
6. Initialize the application source code in `src/[new-app]/` (including `js/`, `css/`, and `tests/`
   directories) with an `index.html` entry point and a local `README.md`, adhering to
   [coding-conventions.md](coding-conventions.md) and [ui-ux-guidelines.md](ui-ux-guidelines.md).
7. Implement test cases in `src/[new-app]/tests/e2e/`.
8. Generate the `docs/[new-app]/traceability-matrix.md` file by running the
   `scripts/traceability-matrix.py docs/[new-app] src/[new-app]/tests/e2e` script.
9. Implement the application, adhering to [coding-conventions.md](coding-conventions.md) and
   [ui-ux-guidelines.md](ui-ux-guidelines.md) and ensuring all tests pass: `bun run test:e2e`.
10. Implement unit tests for all pure functions in `src/[new-app]/tests/unit/` and ensure all tests
    pass: `bun run test:unit`.
11. Format code using `bun run format` and automatically fix linting issues with `bun run lint:fix`.
12. Fix any remaining linter errors and warnings: `bun run lint`.
13. Register the application by updating the root `README.md` with links to its documentation and
    entry point.

## Modifying an Application

1. If required, update `docs/[app-name]/functional-requirements.md` in accordance with
   [docs-guidelines.md](docs-guidelines.md).
2. If required, update `docs/[app-name]/non-functional-requirements.md` in accordance with
   [docs-guidelines.md](docs-guidelines.md).
3. If required, update `docs/[app-name]/system-requirements/` in accordance with
   [docs-guidelines.md](docs-guidelines.md).
4. If required, update `docs/[app-name]/test-cases/` in accordance with
   [docs-guidelines.md](docs-guidelines.md).
5. If required, update `src/[app-name]/tests/e2e/` in accordance with
   [coding-conventions.md](coding-conventions.md).
6. Update the `docs/[app-name]/traceability-matrix.md` file by running the
   `scripts/traceability-matrix.py docs/[app-name] src/[app-name]/tests/e2e` script.
7. If required, update the application, adhering to [coding-conventions.md](coding-conventions.md)
   and [ui-ux-guidelines.md](ui-ux-guidelines.md) and ensuring all tests pass: `bun run test`.
8. If required, update unit tests for all pure functions in `src/[app-name]/tests/unit/` and ensure
   all tests pass: `bun run test:unit`.
9. Format code using `bun run format` and automatically fix linting issues with `bun run lint:fix`.
10. Fix any remaining linter errors and warnings: `bun run lint`.
