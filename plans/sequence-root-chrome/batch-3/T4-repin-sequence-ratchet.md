# T4 — re-pin the sequence ratchet artifacts

## Context

`sequence.diff-baseline.ratchet.test.ts` fails only on a diff-count **rise**.
T3 makes ~1140 counts fall, which passes silently and leaves every pin stale
— bounding nothing. This task re-pins them deliberately, from a fresh
measurement, and regenerates the cause census.

The ratchet's own failure message (`:200-214`) explains the one case where a
rise is progress: when bodies become reachable, the 12-cohort rises together.
**That is not what this mission does** — see `../README.md`'s scope note.
Here, the expected signature is a mass *fall* from 12 to ~5.

## Task

1. Re-measure every fixture:
   `npx vitest run tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`
2. Rewrite `oracle/goldens/svg-sequence/diff-baseline.json` from that
   measurement — each changed entry gets a new `diffCount`, `measuredAt` and
   `measuredAgainstCommit`. Never hand-edit a count to make a test pass.
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

1. Given a fresh measurement, when the plateau cohort is re-read, then those
   1012 fixtures have fallen from 12 to ~5, and `other` has dropped by
   roughly six records per fixture
2. Given any fixture whose count **rose**, then it is investigated and named
   in the journal with a mechanism — never re-pinned to silence it
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
