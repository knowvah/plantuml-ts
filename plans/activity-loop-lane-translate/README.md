# Mission: `activity-loop-lane-translate`

**Branch:** `feat/activity-loop-lane-translate` · **Planned:** 2026-09-19 ·
**Baseline commit:** `8815ec5b` (main, clean) · **Task prefix:** `allt` ·
Executes the filing `activity-loop-lane-translate` (`planning/next-missions.md`,
filed 2026-09-16 by `activity-loop-tile-port` T4/T6). Optional ride-alongs:
`activity-repeat-break-welding`, `activity-gtile-break-size` (D9).

## Objective

Port the jar's cross-swimlane connector shapes for `while` and `repeat`.
With swimlanes, `Swimlanes.Cross#draw` wraps every connection whose two
tiles differ in lane in `ConnectionCross`, which calls
`drawTranslate(ug, lane1.translate, lane2.translate)` for
`ConnectionTranslatable` classes (`ftile/ConnectionCross.java:47-63`).
`activity-loop-tile-port` ported `drawU` only; our
`swimlane-placement.ts#routeEdge` (`:373-388`) then collapses every
cross-lane loop edge into the generic four-point middle-Y elbow. The five
shapes to port: `FtileWhile.ConnectionBackSimple#drawTranslate`
(`vcompact/FtileWhile.java:277-308`) and `FtileRepeat`'s `ConnectionOut`
(`:309-331`), `BackSimple1` (`:579-606`), `BackSimple2` (`:651-676`),
`BackComplex1` (`:357-404`). Both `ConnectionIn` translates
(`FtileWhile.java:200-214`, `FtileRepeat.java:250-259`) are already the
generic shape and need no work. The mechanism, quoted, is in
[`decisions.md`](decisions.md).

Measured 2026-09-19 on main: `kijazo-83-kipu485` per-tag counts at parity
except +1 line, yet 21/41 elements aligned (`--align`); `ruzica-16-deli877`
35/95 with +2 polygon, +4 line. **Premise check:** 3 of the filing's 22
rows (`camavo`, `vupuse`, `zepima`) declare no swimlane and leave at T0 (D8).

## Exit bar (D6)

- Every row T0 classes as reaching a translate shape: `--align` per-tag
  polygon/line/rect/text counts equal the jar's, and every endpoint of the
  translated connector is within 0.01 px of the golden after canvas offset,
  or the residual names its element and Java cite
- Diagonal scan over all 268 baseline slugs stays **0**
- Every mover (render-all + `cmp`) is a [`fixtures.md`](fixtures.md) row or
  a named parent re-centring
- Zero UNEXPLAINED rises at the single re-pin, grouped by class
- Sequence, state, class, description and json suites unmoved (test counts
  identical at `8815ec5b` and at HEAD)
- Aggregate `weightedScore` recorded at every batch close, never gated
- All four gates green with the JSON-reporter collected count = on-disk count

## Batches

| Batch | Tasks | Parallel | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | T0 classify + read dispatch · T1 seam (no-op) | T0 ∥ T1 (worktree) | [x] |
| [1](batch-1/overview.md) | T2 while back · T3 repeat out/simple1/simple2/complex1 | T1b then T2 ∥ T3 (worktrees) | [x] (T1b added 2026-09-20 after stops 1 + 14, see [`stop-1-edgemeta-zip.md`](stop-1-edgemeta-zip.md)) |
| [2](batch-2/overview.md) | T4 sweep · T5a/T5b optional (D9) · T6 re-pin + close-out | sequential | [ ] |

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
   (pre-authorised: a 500-line split re-export, and the test files named per task)
2. The same gate fails on two consecutive fix attempts
3. A finding contradicts [`decisions.md`](decisions.md) D1–D9 — amend there and halt
4. A fixture rises and its mechanism cannot be stated before the commit
5. A mover in T4's sweep is neither a `fixtures.md` row nor a named parent re-centring
6. Any sibling suite's test count changes
7. T1's stub build is not byte-identical to main on all 268 baseline rows
8. A classified row's `--align` count moves AWAY from the jar's and the task cannot name the element
9. T0's read of `UGraphicInterceptorOneSwimlane` shows a cross-lane non-translatable
   connection handled in a way D5's two outcomes do not cover, or differently per builder
10. A translate shape needs a quantity the walker cannot supply from its own tile
11. A laned repeat reaches none of `Simple1`/`Simple2`/`Complex1`, or a `backward:` body
    proves reachable from a baseline row
12. D3's one-to-two split changes element counts on a row T0 did not class `repeat-out`
13. An assertion must be DELETED rather than updated with a Java cite
14. A fix appears to need `layout.old.ts`, `compress-geometry.ts`, or anything only they import
15. A ride-along (T5a/T5b) needs any file outside its single named file

## Push forward

Pure-move extractions at the 500-line hook; test organisation inside the
task's own files; helper names with their Java `@see`; probe flags;
`coverage/.tmp` -> `rm -rf` and rerun the named files; `docs/catalog.md`
regen; a FALLER with its mechanism; a riser of a known class (element growth
under positional pairing, reorder, snake-merge per D7, a pre-existing
divergence made visible) once journaled; running a small task in the
orchestrator instead of dispatching, journaled; re-filing the three lane-less
rows and any T0 finding to `next-missions.md`; striking the optional T5 batch
on T0's evidence, journaled; a worktree per Batch 1 task.

## Quality gates

- `npm test` — pass: exit 0 AND `Test Files` collected = on-disk count
  (`-- --reporter=default --reporter=json --outputFile=<path>`, diff against
  `find tests -name '*.test.ts'`; rerun any named gap in isolation);
  on_fail: fix_and_rerun
- `npm run typecheck`, `npm run lint`, `npm run build` — pass: exit 0; on_fail: fix_and_rerun
- `git diff --name-only HEAD~1` — pass: write-set only; on_fail: stop

## Tools

[`tools/`](tools/) is copied from `activity-loop-tile-port` (`render-all`,
`diag-scan`, `family-diff`, `tile-dump`); `scripts/activity-probe.ts
--align|--dump|--lanes <slug>` is the per-fixture instrument. Re-pin:
`scripts/repin-activity-baselines.ts` (orchestrator only, T6).

## Index

[`decisions.md`](decisions.md) · [`fixtures.md`](fixtures.md) ·
[`decision-journal.md`](decision-journal.md) ·
[`diagrams/component-map.md`](diagrams/component-map.md) ·
[`diagrams/data-flow.md`](diagrams/data-flow.md) ·
[`settings.autonomous.json`](settings.autonomous.json) · prior briefs:
`plans/activity-loop-tile-port/` (esp. `stop-11-complex1.md`),
`plans/activity-if-tile-port/`. Queued next: `activity-note-opale-attachment`.
