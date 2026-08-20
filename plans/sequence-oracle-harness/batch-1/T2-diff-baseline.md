# T2 — The diff-baseline ratchet

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/sequence-oracle-harness`. **You write no `src/`** — stop 3. T0 captured
the oracle corpus; T1 built `renderFixtureSequence`. Read both notes first.

This is the gate the whole mission exists to produce. Its semantics matter
more than its code.

## Task

### Step 1 — the ratchet
Mirror `tests/oracle/svg-conformance/description.diff-baseline.ratchet.test.ts`.
**Read its doc comment in full** — it states each rule and why it exists:

- **rise** (live count > recorded baseline) → **FAIL**, naming the fixture,
  its baseline, and its new count.
- **fall** → PASS, logged `[IMPROVED]`.
- **zero** → PASS, logged `[PROMOTION READY]` — reports eligibility only. It
  must NOT write `ratchet.json` or copy any file. Promotion is stop 13.
- **error** → recorded as `status: "error"` with a `reason`, **never** as a
  numeric baseline. A fixture that stops erroring is itself a reportable
  change and must never be silently read as "reached 0 diffs".

Consume `compare.ts`'s `compareSvg` and `normalize.ts`'s `normalizeSvg`
**unchanged** (D1). Writing a second comparator or normalizer is stop 4.

### Step 2 — pin the baseline
Write `oracle/goldens/svg-sequence/diff-baseline.json` over every fixture T0
captured, reading `test-results/dot-cache/sequence/<slug>/{in.puml,in.svg}`
directly (D4 — do not copy SVGs into `oracle/goldens/`).

### Step 3 — set the new ceiling
Measure `npm test` wall-clock (vitest's own `Duration`, plus wrapped `time`)
at least **three times** on the landed tree and record the range. Then set the
mission's ceiling in `plans/sequence-oracle-harness/README.md`'s
"Quality gates" section — replacing the `60.3 s until T2` note with your
measured value plus a stated margin, and saying how you measured it.

**Do not trim coverage or skip fixtures to fit the old ceiling.** If the suite
is slow enough to be a problem, say so with numbers and propose a shape (e.g.
sharding) — do not silently shrink the measurement.

## Write-set
- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`
- `oracle/goldens/svg-sequence/diff-baseline.json`
- `plans/sequence-oracle-harness/README.md` — the ceiling line ONLY
- `.agent-notes/g1h-T2.md`

## Read-set
- `.agent-notes/g1h-T0.md`, `.agent-notes/g1h-T1.md`
- `tests/oracle/svg-conformance/description.diff-baseline.ratchet.test.ts` —
  **the doc comment, in full**
- `tests/oracle/svg-conformance/compare.ts:35,385`, `normalize.ts:231`
- `oracle/goldens/svg-description/diff-baseline.json` — the file shape
- `plans/sequence-oracle-harness/decisions.md` D1, D2, D4, D6

## Architecture decisions (locked)
D1 (consume the comparator unchanged), D2 (diff-baseline semantics), D4 (read
the committed cache; do not duplicate SVGs), D6 (no `src/`).

## Acceptance
- Given a fixture whose live diff count exceeds its baseline, then the suite
  FAILS and the message names fixture, baseline and new count.
- Given a fall, then PASS logged `[IMPROVED]`; given zero, then PASS logged
  `[PROMOTION READY]` and NOTHING is written to `ratchet.json`.
- Given a fixture that errors, then it is recorded `status:"error"` with a
  reason and carries no numeric baseline.
- Given the freshly pinned baseline, when the suite re-runs immediately, then
  it reports zero rises.
- Given `npm test`, then the new ceiling is measured over >=3 runs and
  recorded in the brief with its method.

## Interface contracts
`diff-baseline.json` — per fixture either `{ slug, diffs: number }` or
`{ slug, status: "error", reason: string }`. Mirror description's field names
exactly rather than inventing new ones; T4 consumes this file.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: one commit. Reverting removes the gate and the pin together.

## Quality bar
Four gates green, coverage >= 90/90/90. TDD. Complexity hook: extract a NAMED
helper, never widen an exemption (stop 12).

## Boundaries
- **Always:** consume `compare.ts`/`normalize.ts` unchanged; record an error
  as an error, never as a count.
- **Never:** touch `src/`; promote a fixture (stop 13); trim coverage or drop
  fixtures to fit the old wall-clock ceiling; run git.

## Opus behavioural notes
Do NOT infer unstated requirements. Do NOT over-engineer. Do NOT spawn
subagents. The acceptance list is a requirement list, not scope to trim.

## Report (<=500 tokens)
Fixture count baselined; how many errored and why; the diff-count
distribution (min / median / max); the measured wall-clock range and the
ceiling you set; the four gates.
