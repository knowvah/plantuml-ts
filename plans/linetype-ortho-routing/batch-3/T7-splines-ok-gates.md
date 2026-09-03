# T7 — `splinesOk` gates `dotEqual`, and is PROVEN to discriminate

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/linetype-ortho-routing`. T1–T6 have landed; all 8 fixtures now route
ortho/polyline and emit the attrs.

`tests/oracle/svek-dot.ts` — the DOT-parity harness — has **zero**
`splines`/`linetype` tokens today. That is why the state suite reads
"DOT EQUAL 266/268" while the routing was materially different. This task
closes that blind spot.

## Task
1. Add `splines: string | undefined` and `forcelabels: boolean` to
   `StructuralGraph` (`tests/oracle/svek-dot.ts:104-113`).
2. Parse them in `parseSvekDot` (`:239-249`), beside the existing
   `remincross` / `searchsize` extraction.
3. Add `splinesOk` to `compareStructural` (`:453`) — **and to the
   `structurallyEqual` conjunction** ([D5]). `compareStructural` is explicit
   field-by-field, not deep-equal: a new field that is not wired into that
   conjunction is not compared at all, which would reproduce the exact
   blindness this task exists to remove.
4. **Prove it discriminates.** Temporarily revert T3's emitter change, run
   the parity measurement, and confirm `splinesOk` goes **false** on all 8.
   Restore, confirm it returns to true. Record both runs in the commit body.

## Why step 4 is the task, not a formality
This repo has shipped an oracle fixture that did not guard what it claimed —
`planning/mission-index.md` SI21: *"the separator oracle fixture the review
asked for does not guard the separator: with the fix reverted it still
passes"*, caught only by reverting. An assertion that cannot fail is
decoration. Stop condition 3.

## Write-set
- `tests/oracle/svek-dot.ts`
- `tests/oracle/svek-dot.test.ts`

**Not** any `src/` file. **Not** any `parity-*.json` (T8 re-pins).

## Read-set
- `plans/linetype-ortho-routing/decisions.md` — D5, D6
- `tests/oracle/svek-dot.ts:104-113` — `StructuralGraph`
- `tests/oracle/svek-dot.ts:239-256` — `parseSvekDot`
- `tests/oracle/svek-dot.ts:453-510` — `compareStructural`
- `oracle/goldens/svg-conformance/splines-baseline.json` — T0's `jarSplines`

## Architecture decisions
[D5] `splinesOk` joins `structurallyEqual` · [D6] emitter first, and the
assertion is proven, never assumed.

## Interface contracts
`StructuralDiff` gains `splinesOk: boolean`. Consumed by
`scripts/dot-sync-report.ts`, `scripts/svg-parity-survey.ts`, and the
`parity-*.json` writers — check each still typechecks.

## Acceptance criteria
- Given a DOT with `splines=ortho;forcelabels=true;`, when parsed, then
  `StructuralGraph.splines === 'ortho'` and `forcelabels === true`.
- Given a DOT with no splines attr, then `splines === undefined` and
  `forcelabels === false` — not `''`, not `null`.
- Given `compareStructural`, then `splinesOk` is returned AND participates in
  `structurallyEqual` ([D5]).
- Given T3's emitter **temporarily reverted**, then `splinesOk` is `false`
  for all 8 fixtures — measured and recorded, not asserted in prose ([D6]).
- Given the emitter restored, then `dotEqual` is `true` for all 8.
- Given any fixture **outside** the 8 whose `dotEqual` flips, then STOP
  (stop condition 1).

## Observability
N/A — no new observable operations. This task IS an instrument fix.

## Rollback
**Reversible.** Test-harness only; no `src/` touched.

## Quality bar
All four gates green, `Test Files` == **685**. Note `parity-*.json` may go
stale as a result — that is expected and is T8's to re-pin, but the SUITE
must still be green here; if a parity test fails on one of the 8, re-pin is
T8's, so coordinate rather than editing pins in this task.

## Commit
`test(lor-T7): make the DOT-parity harness compare splines`

Body: the revert experiment's before/after numbers, and that `splinesOk`
joins `structurallyEqual` rather than being merely recorded.
