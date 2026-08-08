# T13 — Oracle ratchets and conformance suites

**Agent:** test-automator · **Depends on:** T3–T9 · **Commit:** `test(T13): re-green the svg conformance ratchets`

## Write-set

`tests/oracle/**` — the five `*.golden.ratchet.test.ts` suites, the
conformance comparison helpers, and any parity manifest that needs
regenerating.

## Read-set

- `tests/oracle/svg-conformance/description.golden.ratchet.test.ts` — the
  ratchet contract and its eligibility rules
- `oracle/goldens/svg-description/README.md` — the add rule; ratchets only
  tighten
- `plans/svg-output-size-reduction/batch-2c/T9-regenerate-goldens.md`

## Task

These suites are the mission's actual acceptance test: they byte-compare
our render against the regenerated goldens. Ideally this task changes
**almost nothing** — if the port is correct they simply go green once T9
lands.

Repair only genuine harness breakage (a helper asserting the old form, a
manifest needing regeneration). **A failing fixture is a finding, not a
test to fix.**

## Acceptance criteria

1. Given all five ratchet suites, when run, then 445 pinned fixtures pass.
2. Given `npx tsx scripts/rebaseline-svg-goldens.ts` (report-only), then
   `CHANGED=0`.
3. Given any fixture that will not go green, then it is diagnosed with a
   stated mechanism and escalated — never un-pinned, never loosened.

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
