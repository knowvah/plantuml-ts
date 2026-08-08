# T11 — Class and object tests

**Agent:** test-automator · **Depends on:** T3–T9 · **Commit:** `test(T11): update class/object expectations for reduced SVG form`

## Write-set

`tests/unit/class/**`, `tests/integration/class*`, and the object-diagram
tests. Locate with `grep -rl "lengthAdjust\|font-family=\|stroke-width"`.

## Read-set

- `plans/svg-output-size-reduction/batch-2b/overview.md` — what T6a–T6e changed
- `src/core/svg.ts` — T5's central formatting

## Note on reach

This is the largest slice: class owns 313 goldens and object 22, all
through `core/svg.ts`. Expect the most churn here, and the highest chance
of catching a surviving pre-rounding site from batch-2b.

## Acceptance criteria

1. Given every class and object suite, when run, then all pass.
2. Given `jaloja-18-tisu915`'s cardinality `textLength`, then it matches
   the jar — the G2 N35 fixture, now passing for the opposite reason.
3. Given a last-digit mismatch, then it is diagnosed to a call site and
   reported, never absorbed into an expectation.

## Context

The mission ported upstream's six SVG-size-reduction rules into both
emitters (batch-2a) and regenerated all 450 goldens (T9). Tests that
assert the OLD emitted form now fail. This task repairs its own slice.

Old form → new form:

| Old | New |
|---|---|
| `lengthAdjust="spacing"` on a text element | absent (inherited from root) |
| `font-family="sans-serif"` on a text element | absent (inherited); non-default families still present |
| `10.4813`, `77.8125` | `10.481`, `77.813` — 3 decimals, trailing zeros trimmed |
| `#FF0000`, `#000000` | `#F00`, `#000` (only when all three pairs repeat) |
| `stroke:none;stroke-width:1;` | `stroke:none;` |
| `textLength` on a 1-character text | absent |

## Two kinds of failure — opposite responses

- **Expectation churn** → update the expectation. Push forward, do not ask.
- **A real mismatch against a regenerated golden** → **stop.** Do not edit
  the golden, do not loosen the assertion. Apply `rules/diagnosis.md`:
  state the mechanism, `file:line`, and causal chain first. A handful of
  fixtures failing on a single last digit means pre-rounding survived
  batch-2b/2c; many fixtures failing means a rule was missed in batch-2a.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible**, with the rest of batch-2a–2d (ADR-5).

## Quality bar

Do not weaken a test to make it pass. Do not add `.skip`. Do not widen a
byte-exact comparison into a fuzzy one — these ratchets only tighten
(`oracle/goldens/svg-description/README.md`).

## Boundaries

- **Always:** stay inside the write-set; the other three repair tasks run
  concurrently.
- **Stop:** a real mismatch, per the rule above.
- **Never:** edit a `golden.svg`; add `.skip`; loosen an assertion; run any
  `git` command.
