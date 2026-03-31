# Development Workflow

## Adding a New Application

1. Define the product's vision in `docs/[new-app]/vision.md`. Ensure the changes comply with
   [docs-guidelines.md](docs-guidelines.md).
2. Define the high-level functional requirements in `docs/[new-app]/functional-requirements.md`.
   Ensure the changes comply with [docs-guidelines.md](docs-guidelines.md).
3. Define the non-functional requirements in `docs/[new-app]/non-functional-requirements.md`. Ensure
   the changes comply with [docs-guidelines.md](docs-guidelines.md).
4. Define detailed system requirements in `docs/[new-app]/system-requirements/`, creating one file
   for each functional requirement group. Ensure the changes comply with
   [docs-guidelines.md](docs-guidelines.md).
5. Define test cases in `docs/[new-app]/test-cases/`, creating one directory for each system
   requirement file and one file within that directory for every acceptance criteria. Ensure the
   changes comply with [docs-guidelines.md](docs-guidelines.md).
6. Initialize the application source code in `src/[new-app]/` (including `js/`, `css/`, and `tests/`
   directories) with an `index.html` entry point and a local `README.md`.
7. Implement test cases in `src/[new-app]/tests/e2e/`.
8. Generate the `docs/[new-app]/traceability-matrix.md` file by running the
   `scripts/traceability-matrix.py docs/[new-app] src/[new-app]/tests/e2e` script.
9. Implement the application. Ensure the code complies with
   [coding-conventions.md](coding-conventions.md) and [ui-ux-guidelines.md](ui-ux-guidelines.md).
   Ensure all tests pass: `bun run test:e2e`.
10. Implement unit tests for all pure functions in `src/[new-app]/tests/unit/`. Ensure all tests
    pass: `bun run test:unit`.
11. Format code using `bun run format` and automatically fix linting issues with `bun run lint:fix`.
12. Fix any remaining linter errors and warnings: `bun run lint`.
13. Register the application by updating the root `README.md` with links to its documentation and
    entry point.

## Adding a Feature or Modifying an Application

1. Add a new functional requirement group to `docs/[app-name]/functional-requirements.md` if the
   feature represents a new business capability. Ensure the changes comply with
   [docs-guidelines.md](docs-guidelines.md).
2. Add a functional requirement to the appropriate group in
   `docs/[app-name]/functional-requirements.md`. Ensure the changes comply with
   [docs-guidelines.md](docs-guidelines.md).
3. Update `docs/[app-name]/non-functional-requirements.md` if new quality standards, performance
   targets, or technical constraints are introduced. Ensure the changes comply with
   [docs-guidelines.md](docs-guidelines.md).
4. Create a corresponding system requirement file in `docs/[app-name]/system-requirements/` if a new
   functional requirement group was added. Ensure the changes comply with
   [docs-guidelines.md](docs-guidelines.md).
5. Add new acceptance criteria and scenarios to the system requirement file in
   `docs/[app-name]/system-requirements/` if new functional behaviors or edge cases are introduced.
   Ensure the changes comply with [docs-guidelines.md](docs-guidelines.md).
6. Update existing acceptance criteria, scenarios, business rules, UI/UX sections, or technical
   notes in `docs/[app-name]/system-requirements/` if existing feature behavior is modified. Ensure
   the changes comply with [docs-guidelines.md](docs-guidelines.md).
7. Create a corresponding directory in `docs/[app-name]/test-cases/` if a new system requirement
   file was created.
8. Add new test case files to `docs/[app-name]/test-cases/` or update existing files for every new
   or modified acceptance criteria. Ensure the changes comply with
   [docs-guidelines.md](docs-guidelines.md).
9. Update automated e2e tests in `src/[app-name]/tests/e2e/` to reflect changes in manual test cases
   and system requirements.
10. Update the `docs/[app-name]/traceability-matrix.md` file by running the
    `scripts/traceability-matrix.py docs/[app-name] src/[app-name]/tests/e2e` script.
11. Update the application code in `src/[app-name]/` to implement the changes. Ensure the changes
    comply with [coding-conventions.md](coding-conventions.md) and
    [ui-ux-guidelines.md](ui-ux-guidelines.md). Ensure all tests pass: `bun run test`.
12. Update unit tests for all modified or new pure functions in `src/[app-name]/tests/unit/`. Ensure
    all tests pass: `bun run test:unit`.
13. Format code using `bun run format` and automatically fix linting issues with `bun run lint:fix`.
14. Fix any remaining linter errors and warnings: `bun run lint`.
