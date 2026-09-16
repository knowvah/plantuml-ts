# Mission: `activity-while-repeat-left-alignment`

**Branch:** `feat/activity-while-repeat-left-alignment` · **Planned:**
2026-09-16 · **Baseline commit:** `6f1c04f7` (main, clean; aggregate
activity `weightedScore` **49647** over the 268 baseline fixtures; 19 of
them draw a diagonal edge segment — 5 with a `while`, 14 with a `repeat`) ·
**Task prefix:** `awrl`

## Objective

Place a `while`'s header and body, and a `repeat`'s body, condition and
backward body, the way the jar does: aligned on each child's own in/out x
(`left`), with the composite's `left` and `width` derived by the same
merger the top-down now uses. Today both walkers centre every child by
`width/2` (`layout/walk-while-branch.ts:35-45`, `layout/tile-coordinates.ts`
`'gtile-repeat'` case), which coincided with `left` only while every child
was symmetric; `activity-if-tile-port` made if tiles asymmetric, so a loop
whose body holds an `if` now draws a slanted forward or back edge.

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.
`FtileWhile#calculateDimensionFtile` merges `diamond1.appendBottom(whileBlock)`
(`vcompact/FtileWhile.java:576-593`) and places both at `total.left -
child.left` (`:621-641`); `FtileRepeat#getLeft`/`getRight` take
`max(repeat.left, d1.w/2, d2.w/2)` and its mirror (`vcompact/FtileRepeat.java:
767-786`), placing the body at `left - repeat.left` and both diamonds
centred on `left` (`:730-765`). `FtileGeometryMerger.java:44-56` is the
merger.

## Exit bar

- Diagonal-segment scan over all 268 baseline slugs: **19 -> 0** (or every
  survivor named with a mechanism that is not a loop's own placement)
- Every fixture WITHOUT an asymmetric while/repeat child is byte-identical
  in score to `measurements/base.json` (stop 13)
- Zero UNEXPLAINED rises at re-pin; every mover names its loop and child
- Sequence, state, class, description and json suites unmoved
  (`npx vitest run svg-conformance`: **27 files / 3427 passed | 1 skipped**
  at `6f1c04f7`)
- `hardViolations` empty; the two attributed overlap lists re-indexed with
  per-entry cites; all four gates green

## What this mission does NOT do (file, never build)

- The jar's while gutters (`dx = 2 * hexagonHalfSize` on the left, `+
  hexagonHalfSize` on the right, `FtileWhile.java:586-593`) and the repeat
  outer `2 * hexagonHalfSize` (`FtileRepeat.java:713-715`) — our
  `BACK_EDGE_MARGIN` stays (D2)
- `GtileDiamond` sizing (`activity-diamond-sizing`, stop 12)
- `specialOut` / `backward` label geometry, note sibling links, the repeat
  mid-arrow (`activity-repeat-connector-draw-order`)

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
   (a 500-line split re-export and the index-dependent tests named per
   task are pre-authorised)
2. The same gate fails on two consecutive fix attempts
3. A finding contradicts [`decisions.md`](decisions.md) D1–D5 — amend there
   and halt
4. A fixture rises and its mechanism cannot be stated before the commit
5. A mover is not a while/repeat fixture with an asymmetric child, and the
   task cannot say why
6. Any sibling suite's test count changes
7. `hardViolations` is ever non-empty, or an allowed-overlap entry cannot be
   attributed with a Java cite
8. `edges` and `edgeMeta` are found misaligned
9. A committed jar golden looks stale
10. An assertion must be DELETED rather than updated with a Java cite
11. A fix appears to need the jar's gutters to make a fixture match
12. A fix appears to need `GtileDiamond`'s sizing to change
13. A symmetric while/repeat fixture moves

## Push forward

Pure-move extractions at the 500-line hook (journal); test organisation
inside the task's own files; helper names with their Java `@see`; probe
flags; `coverage/.tmp` -> `rm -rf` and rerun; `docs/catalog.md` regen; a
FALLER with its mechanism; re-indexing an allowed-overlap entry whose
coordinates are unchanged.

## Quality gates

- `npm test` — pass: exit 0, `Test Files` collected = on-disk count (use
  `-- --reporter=default --reporter=json --outputFile=<path>` and diff
  against `find tests -name '*.test.ts'`; rerun any named gap in
  isolation); on_fail: fix_and_rerun
- `npm run typecheck`, `npm run lint`, `npm run build` — pass: exit 0;
  on_fail: fix_and_rerun
- `git diff --name-only HEAD~1` — pass: write-set only; on_fail: stop

**Red allowance (T1–T2):** the four activity oracle gates may be red only
on movers each task journals, until T3 re-pins once.

**Measurement (orchestrator):** `npx tsx scripts/activity-probe.ts --json
<out>` over all 268, compared to `measurements/base.json` (= aitp's
`final.json`, aggregate 49647); the diagonal scan
(`scratchpad/diag-scan.ts`, or the equivalent: any edge segment with both
`dx` and `dy` non-zero) before and after each task. The orchestrator runs
`npm test` and the probe; agents stop before committing and are resumed to
commit.

## Index

- [`decisions.md`](decisions.md) — D1–D5, **locked**
- [`fixtures.md`](fixtures.md) — the 19 diagonal fixtures and the 60 loop
  fixtures
- [`batch-1/overview.md`](batch-1/overview.md) — while (T1)
- [`batch-2/overview.md`](batch-2/overview.md) — repeat (T2)
- [`batch-3/overview.md`](batch-3/overview.md) — re-pin and close-out (T3)
- [`diagrams/data-flow.md`](diagrams/data-flow.md), [`diagrams/component-map.md`](diagrams/component-map.md)
- [`decision-journal.md`](decision-journal.md)
- [`settings.autonomous.json`](settings.autonomous.json)

## Progress

- [x] Batch 1 — T1
- [x] Batch 2 — T2
- [x] Batch 3 — T3

## Session End (2026-09-16)

**Tasks completed vs planned: 3 of 3** — T1 `9f328e5f`, T2 `6540a782`,
T3 (this commit). Batch close-outs `eb87e294`, `46caf80b`. Both fix tasks
were executed in the orchestrator rather than dispatched (journaled): each
is ~20 lines across two files with the Java already open.

**Result.** `GtileWhile` and `GtileRepeat` now compute the jar's merged
`left` (`FtileGeometryMerger.java:44-47`; `FtileWhile.java:584,593`;
`FtileRepeat.java:767-786`) and place every child at `left - child.left`
(`FtileWhile.java:621-641`; `FtileRepeat.java:730-765`); the walkers
consume per-child x offsets instead of centring by `width/2`. Gutters
unported (D2), `GtileDiamond` untouched (D3), the repeat's entry-diamond
term absent and its backward body joining the merge (both journaled).

**Exit bar — met.**

- Diagonal-segment scan over all 268 baseline slugs: **19 -> 0** (T1 19 ->
  14, T2 14 -> 0).
- Symmetric fixtures byte-identical in score to `base.json`: every score
  mover is one of the two journaled risers; by SVG byte-diff 21 fixtures
  moved (5 while + 16 repeat), all `fixtures.md` rows, every one a loop with
  an asymmetric child except `felega` (a 3.6e-15 evaluation-order flip on a
  printed-3-decimal tie, geometry identical); the `katopo`/`bulasi` census
  reds are raw-double ulp pins of unchanged geometry.
- Zero UNEXPLAINED rises: `tobajo-64-mipi810` +10 (a slanted edge's far
  endpoint coincidentally matched the golden; the vertical edge now sits at
  the body's `left`, 5.991 px from the jar's -- the D2 gutter offset, filed
  as `activity-loop-gutters`) and `jupoxe-15-sugo110` +1 (klimt compression
  shifted the condition 2 px after its x changed). Both named in
  `--accept-rises`.
- Siblings unmoved: `svg-conformance` **27 files / 3427 passed | 1 skipped**
  at `6f1c04f7` (scratch worktree) and at HEAD.
- `hardViolations` empty; `ALLOWED_NEW_OVERLAPS`/`ALLOWED_HARD_OVERLAPS`
  equal their attributed pins throughout (no entry moved, nothing to
  re-index).
- Gates: `npm test` 721/721 collected (JSON reporter vs `find`), **720
  passed | 1 skipped**, 19824 tests; typecheck, lint, build exit 0;
  `docs/catalog.md` no drift.

**Aggregate:** 49647 -> 49658 over 268 (reported, not gated -- D5; the
comparator charged nothing for T1's five corrected edges).

**Decisions: 20 journal rows.** Flagged for review: executing T1/T2 in the
orchestrator instead of `typescript-pro`; the scan tolerance (0.01 px, the
brief's 19 as calibration); the repeat backward body joining the merge
(the jar hangs it off the right edge -- `activity-repeat-connector-draw-
order` should remove those terms when it lands); treating the felega/
katopo/bulasi ulp flips as non-moves under stop 13 (the brief's instrument
is the score, which did not move).

**Known issues / follow-ups (filed in `planning/next-missions.md`):**
`activity-loop-gutters` (new: while 24+12, repeat 24 + test-label floor,
side-hung backward); `activity-diamond-count-shortfall` widened with the
repeat `getLeft` entry-diamond terms; `activity-diamond-sizing` and
`activity-repeat-connector-draw-order` unchanged and still open.
