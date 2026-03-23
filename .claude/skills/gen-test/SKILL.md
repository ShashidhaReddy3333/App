---
name: gen-test
description: Generate Vitest unit/integration tests or Playwright E2E tests for a given source file or feature. Pass a file path or feature name as the argument.
disable-model-invocation: true
---

The user wants to generate tests. Arguments: $ARGUMENTS

Steps:

1. If the argument is a file path, read that file. If it is a feature name, locate the relevant source files under `src/` first.
2. Determine the appropriate test type based on context:
   - Pure logic or service functions with mocked deps → unit test in `tests/unit/`
   - Service functions that interact with the database → integration test in `tests/integration/`
   - User-facing pages or multi-step flows → E2E test in `tests/e2e/`
   - If unclear, ask the user before proceeding.
3. Delegate to the `test-writer` agent with all relevant context: the source file contents and the determined test type.
4. Place the output in the correct directory with a name matching the source (e.g. `auth-service.ts` → `auth-service.test.ts`, E2E flows → `<feature>.spec.ts`).
5. Run the tests to confirm they pass:
   - Unit/integration: `corepack pnpm test:unit`
   - E2E: `corepack pnpm test:e2e`
6. Report which file was created and the test run result.
