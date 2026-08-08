# T12 — State, description and creole tests

**Agent:** test-automator · **Depends on:** T3–T9 · **Commit:** `test(T12): update state/description expectations for reduced SVG form`

## Write-set

`tests/unit/state/**`, `tests/unit/description/**`, `tests/unit/creole/**`.

## Read-set

- `plans/svg-output-size-reduction/batch-2a/T3-klimt-core.md` and
  `T4-klimt-text.md` — description renders through the klimt emitter
- `plans/svg-output-size-reduction/batch-2c/T7-state-prerounding.md`

## Note on reach

This slice spans **both** emitters: description goes through klimt
(51 goldens), state through `core/svg.ts` (58 goldens). A failure pattern
that appears in one but not the other points at an emitter-specific missed
rule — worth saying so explicitly in the commit body.

## Acceptance criteria

1. Given every state, description and creole suite, when run, then all pass.
2. Given a failure present in description but not state (or vice versa),
   then it is reported as an emitter-parity finding, not silently fixed in
   the test.
3. Given the creole text suites, then single-character text assertions
   expect no `textLength`.

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
