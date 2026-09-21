## Observation: vi.mock of a node builtin does not reach scripts under jsdom
- **Context**: CI on main failed from e8a446ec through 6f316763; only
  tests/unit/scripts/capture-oracle-cache.test.ts (AC1, AC2) was red.
- **Finding**: The suite default environment is jsdom (vitest.config.ts).
  Under jsdom, `vi.mock('node:child_process')` did not replace the
  `execFileSync` that scripts/capture-oracle-cache.ts imports, so the REAL
  scripts/oracle-render.sh ran. Locally the jar exists and wrote a real
  in.svg (tests took ~2 s each), so the test passed; CI has no jar, so no
  SVG appeared and both fixtures landed in jarFailed. Controlled experiment:
  with oracle/dist hidden, jsdom = 2 failed, `// @vitest-environment node`
  = 12 passed at ~1 ms each.
- **Impact**: Any test that mocks a node builtin for code under scripts/
  needs `// @vitest-environment node`. A mocked test that runs in seconds
  locally is calling the real thing. Reproduce CI locally by moving
  oracle/dist aside.
- **Confidence**: High for the environment variable (isolated by
  experiment); vitest's internal reason is unverified.
