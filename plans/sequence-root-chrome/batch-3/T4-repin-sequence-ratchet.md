# T4 — re-pin the sequence ratchet artifacts

## Context

**Amended 2026-08-23.** This task originally re-pinned `diffCount`. It now
re-pins `weightedScore`, the monotone quantity T6 introduces — read
[`../decisions.md#d5`](../decisions.md) first, and do not start until T6 has
landed. Re-pinning against `diffCount` is what the amendment exists to
prevent: a pin taken against a metric that rewards structural misalignment is
worse than no pin at all.

`sequence.diff-baseline.ratchet.test.ts` fails only on a **rise**. T3 moved
~1140 fixtures, which under the old metric passed silently for the fallers
and failed spuriously for 255 risers. This task re-pins deliberately from a
fresh measurement and regenerates the cause census.

## Task

1. Re-measure every fixture:
   `npx vitest run tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`
2. Rewrite `oracle/goldens/svg-sequence/diff-baseline.json` from that
   measurement — each changed entry gets a new `weightedScore` (the gated
   quantity), a refreshed `diffCount` (informational only, per D5),
   `measuredAt` and `measuredAgainstCommit`. Never hand-edit either number to
   make a test pass.
3. Regenerate the census:
   `npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts`
4. Record the before/after plateau histogram and bucket totals in the
   decision journal.

## Read-set

- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:60-70`
  — the documented re-measure procedure
- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:186-214`
  — `checkNoRise` and what a rise means
- `oracle/goldens/svg-sequence/README.md`
- `../decisions.md#d4`

## Baseline to beat — measured 2026-08-23 at `fc499de2`

- 1141 fixtures, 1140 measurable, 1 `status: "error"`
- **1012 sit at exactly 12 diffs**; min 10, max 139, sum 16486
- bucket totals: `missing-element` 873, `extra-element` 1317,
  `geometry` 5124, `text-metrics` 536, `format-units` 0, `other` 8636
- the 12 diffs, identical across all three plateau fixtures spot-checked:
  six absent root attributes, four root geometry values,
  `svg/defs[1][childCount]` (12 vs 0), `svg/g[1][childCount]`

## Acceptance criteria

1. Given a fresh measurement, then every fixture's `weightedScore` is at or
   below its pre-T3 weighted score. **Amended 2026-08-23**: the original
   criterion ("those 1012 fixtures have fallen from 12 to ~5") was met and is
   now recorded as a result in `../README.md`'s exit bar, not re-verified here
2. Given any fixture whose **`weightedScore`** rose, then it is investigated
   and named in the journal with a mechanism — never re-pinned to silence it.
   A risen `diffCount` alongside a fallen `weightedScore` is the D5 artifact
   and is explicitly fine
3. Given `oracle/goldens/svg-sequence/ratchet.json`, then it is still
   `{"fixtures": []}` — no fixture reaches zero, nothing is promoted (D4)
4. Given `sequence-diff-census.ts` run twice, then `diff-census.json` is
   byte-identical both times (it is a pure function of the committed corpus)
5. Given the one `status: "error"` fixture, then it is still `"error"` and
   still contributes nothing to the totals

## Quality bar

All four gates green.

## Observability

This task *is* the observability update: `diff-baseline.json` and
`diff-census.json` are the mission's measurement surface. No dashboards or
traces exist or should.

## Rollback

Reversible, but only together with T3 — see `T3`'s rollback note.

## Boundaries

- **Always:** derive every number from a command you actually ran, and put
  the command in the journal
- **Never:** hand-edit a `diffCount` to make the gate pass; promote a fixture
  into `ratchet.json`; touch `src/**`
- **Ask first:** if the plateau does not fall as predicted — that means the
  mechanism in this brief is wrong, and the brief should be corrected before
  the artifacts are

## Commit

One commit: `chore(T4): re-pin the sequence diff baseline and census`
