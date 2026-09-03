# Mission: `svg-comparator-alignment`

**Branch:** `svg-comparator-alignment` · **Planned:** 2026-09-03 ·
**Baseline commit:** `804232d4` (main, clean tree, all four gates green)

## Objective

Fix `tests/oracle/svg-conformance/compare.ts`'s `[childCount]` short-circuit
so it stops charging the SUM of both mismatched sibling lists' full sizes
and instead LCS-aligns them, charging only the genuinely unmatched
remainder. This unblocks `activity-element-granularity`, whose T1 (a
verified-correct port) raised the gated `weightedScore` 7.0% purely because
of this defect (full diagnosis: `.agent-notes/aeg-T1.md` and D10 on
`feat/activity-element-granularity`).

## Exit bar

- `[childCount]` mismatches are LCS-aligned by `tag` (text nodes keyed
  `'#text'`); matched pairs recurse through `compareNodes` for their real
  diff cost; only unmatched children are charged at full `units()`.
- `compare.test.ts`'s existing weight assertion is updated to its new,
  correctly-recomputed value; new tests pin (a) unmatched-only charging,
  (b) matched-pair recursion surfacing real diffs, (c) growth-toward-parity
  monotonicity — the exact property that broke undetected.
- `activity.diff-baseline.ratchet.test.ts` and
  `sequence.diff-baseline.ratchet.test.ts` re-pinned from live measurement;
  zero fixtures rise.
- `description.diff-baseline.ratchet.test.ts` re-pinned only if live
  measurement shows movement; any rise there halts for adjudication.
- All four gates green (`npm test` with `Test Files` == 683, `npm run
  typecheck`, `npm run lint`, `npm run build`).
- The three fixtures already decomposed in `.agent-notes/aeg-T1.md`
  (`tobajo-64-mipi810`, `firibi-00-puki721`, `noxasi-06-nejo322`) are
  re-measured by hand and confirmed monotone.

## What this mission does NOT do

- Does not touch `normalize.ts`, the `Diff`/`NormalizedNode` types, or the
  equal-length children loop in `compareNodes` — only the not-equal-length
  branch changes ([D1]).
- Does not re-pin any golden `ratchet.json` — that population is
  structurally immune ([D2]).
- Does not resume `activity-element-granularity`'s T1/T2/T3/T4 — that
  happens after this lands, as a separate step on the activity branch.

## Quality gates — all four, before any commit lands

```
- command: npm test            # vitest + 90/90/90 coverage
  pass: exit 0 AND `Test Files` total == 683
  on_fail: fix_and_rerun
- command: npm run typecheck   # both tsconfigs
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
```

`rm -rf coverage/.tmp` before any `npm test` run that follows a killed,
timed-out, or backgrounded one — an orphaned `.tmp` makes vitest silently
under-collect while exiting 0 (`.agent-notes/aoh-coverage-tmp-undercollect.md`).

## Tasks

| ID | Description | Writes | Done |
|---|---|---|---|
| T1 | Implement LCS alignment + its own tests | `compare.ts`, `compare.test.ts` | [x] |
| T2 | Re-pin, verify zero regressions | `oracle/goldens/svg-{activity,sequence,description}/diff-baseline.json` (diff-census skipped, D5) | [x] |

Single-agent, sequential — T2 depends on T1's code existing.

## Stop conditions

1. Any re-pin would raise a value above its current baseline — halt and
   adjudicate, never silently re-pin past a rise.
2. `npm test` reports a `Test Files` total other than 683.
3. A golden `ratchet.json`-gated fixture stops passing (would falsify [D2]'s
   structural-immunity claim — halt and re-derive, don't patch around it).

## Index

- [decisions.md](decisions.md) — D1–D3
