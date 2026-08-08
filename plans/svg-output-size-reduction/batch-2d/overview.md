# Batch 2d — Test repair, and the mission's real gate

🔴 **THIS IS WHERE THE FULL GATES RUN (ADR-5).** Batches 2a–2c were
deliberately ungated. Everything must be green at the end of this batch:
typecheck, lint, build, and a cold-tree `npm test` — run **twice**.

~150 test files assert the old emitted form: 82 reference `stroke-width`,
77 carry 4-decimal literals, 66 reference `font-family`, 22 reference
`lengthAdjust` (counts overlap). These four tasks repair them, split by
disjoint directory ownership so they run in parallel.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T10 | Core / emitter unit tests | test-automator | `tests/unit/core/**` | T3–T9 | [ ] |
| T11 | Class + object tests | test-automator | `tests/unit/class/**`, `tests/integration/class*`, object tests | T3–T9 | [ ] |
| T12 | State, description, creole tests | test-automator | `tests/unit/state/**`, `tests/unit/description/**`, `tests/unit/creole/**` | T3–T9 | [ ] |
| T13 | Oracle ratchets + conformance suites | test-automator | `tests/oracle/**` | T3–T9 | [ ] |

## The distinction that matters

There are two kinds of failure in this batch and they need opposite
responses:

- **Expectation churn** — a test asserts `lengthAdjust="spacing"` on a text
  element, or a 4-decimal literal. Update the expectation. This is the
  push-forward case; no need to ask.
- **A real mismatch** — our render differs from a *regenerated* golden.
  **Do not touch the golden and do not loosen the assertion.** That is a
  missed rule or surviving pre-rounding. `rules/diagnosis.md` applies:
  state the mechanism before changing anything.

The tell: churn is uniform and mechanical; a real mismatch is a handful of
fixtures, often a single last digit.

## Stop conditions specific to this batch

- **>20 goldens still failing** once all four tasks are done — a rule was
  missed in batch-2a. Diagnose the emitter, do not paper over it in tests.
- **Any single-last-digit mismatch pattern** — pre-rounding survived
  somewhere in batch-2b/2c. Find the call site.
- Two consecutive gate failures on the same check.

## Gate commands

```sh
npm run typecheck
npm run lint
npm run build
rm -rf packages/*/assets && npm test    # run twice
npx tsx scripts/rebaseline-svg-goldens.ts   # must report CHANGED=0 now
```

**Never pipe a gate** — `tail`'s exit code masks vitest's. Redirect to a
file and check `$?`. The rebaseline script reporting `CHANGED=0` is the
proof that goldens and jar agree; the green suite is the proof that our
emitter agrees with both.
