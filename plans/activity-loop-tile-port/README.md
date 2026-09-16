# Mission: `activity-loop-tile-port`

**Branch:** `feat/activity-loop-tile-port` · **Planned:** 2026-09-16 ·
**Baseline commit:** `3651a1ec` (main, clean; aggregate activity
`weightedScore` **49658** over the 268 baseline fixtures; diagonal scan 0) ·
**Task prefix:** `altp` · Supersedes the filing `activity-loop-gutters` and
folds in `activity-diamond-sizing` and the repeat half of
`activity-diamond-count-shortfall` (`planning/next-missions.md`).

## Objective

Port `FtileWhile` and `FtileRepeat` as the jar builds them: the dimension
arithmetic (gutters, spare-height centring, test-label floor, the repeat's
entry tile), the `FtileDiamondInside` hexagon with its side labels, and the
default connections the gutters exist for -- `ConnectionIn`,
`ConnectionBackSimple` / `ConnectionBackSimple1|2`, `ConnectionOut`,
`ConnectionBackEmpty`, the while `break` welding -- with the jar's draw
order and mid-arrows. Today both tiles widen by one `BACK_EDGE_MARGIN`,
draw home-grown back edges (the repeat's on the wrong side), no exit path,
no side labels and no entry diamond.

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`;
the mechanism, quoted, is in [`decisions.md`](decisions.md).

## Exit bar

- Representative slugs ([`fixtures.md`](fixtures.md) "Representative"):
  `--align` per-tag polygon/line/rect/text counts equal the jar's, and every
  endpoint of a loop's own connectors matches the golden to 0.01 px after
  canvas offset, or the residual names its element and Java cite
- Diagonal scan over all 268 baseline slugs stays **0**
- Every mover (render-all + `cmp`) is a `fixtures.md` row or a named
  parent re-centring caused by a loop's width change (stop 5)
- Zero UNEXPLAINED rises at re-pin, grouped by class per aitp T7
- Sequence, state, class, description and json suites unmoved
  (`npx vitest run svg-conformance`: **27 files / 3427 passed | 1 skipped**
  at `3651a1ec` and at HEAD)
- `hardViolations` empty; both exemption lists attributed; all four gates
  green with the JSON-reporter collected count = on-disk count (721 today)

## What this mission does NOT do (file, never build)

- `backward:` bodies and `ConnectionBackBackward1/2` (0 fixtures; awrl T2's
  stacking stays the interim; file `activity-loop-backward`)
- `specialOut` / `ConnectionOutSpecial` (D3: unreachable)
- ~~`ConnectionBackComplex1` (cross-lane repeat; stop 11)~~ — amended
  2026-09-16: reachable from six fixtures, T6 ports it (D5 amendment)
- `ConditionStyle` EMPTY_DIAMOND / INSIDE_DIAMOND
  (`activity-condition-style-variants`)
- Compression changes (D4; stop 14)

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
   (a 500-line split re-export and the test files named per task are
   pre-authorised)
2. The same gate fails on two consecutive fix attempts
3. A finding contradicts [`decisions.md`](decisions.md) D1–D10 — amend there
   and halt
4. A fixture rises and its mechanism cannot be stated before the commit
5. A mover is not a `fixtures.md` row and not a named parent re-centring
6. Any sibling suite's test count changes
7. `hardViolations` is ever non-empty, or an allowed-overlap entry cannot be
   attributed with a Java cite
8. A committed jar golden looks stale
9. An assertion must be DELETED rather than updated with a Java cite
10. A fix appears to need `layout.old.ts` or anything only it imports
11. ~~A laned repeat reaches `ConnectionBackComplex1`~~ retired 2026-09-16 (D5 amendment); a repeat that reaches NONE of `Simple1`/`Simple2`/`Complex1` is the stop
12. A `backward:` body or a non-null `specialOut` proves reachable from a
    baseline fixture (D3 assumed unreachable)
13. An `--align` per-tag count on a representative slug moves AWAY from the
    jar's and the task cannot name the element
14. A loop fixture needs a change in `compress-geometry.ts` to match

## Push forward

Pure-move extractions at the 500-line hook (`walk-repeat.ts`,
`diamond-labels.ts`); test organisation inside the task's own files; helper
names with their Java `@see`; probe flags; `coverage/.tmp` -> `rm -rf` and
rerun the named files; `docs/catalog.md` regen; a FALLER with its mechanism;
a riser of a known class (element growth under positional pairing, reorder,
snake-merge, a pre-existing divergence made visible) once journaled;
retiring a routing class or constant once `grep` shows no live reader
outside `layout.old.ts`; running a small task in the orchestrator instead of
dispatching, journaled (awrl precedent); re-indexing an allowed-overlap
entry whose coordinates are unchanged.

## Quality gates

- `npm test` — pass: exit 0, `Test Files` collected = on-disk count (use
  `-- --reporter=default --reporter=json --outputFile=<path>` and diff
  against `find tests -name '*.test.ts'`; rerun any named gap in
  isolation); on_fail: fix_and_rerun
- `npm run typecheck`, `npm run lint`, `npm run build` — pass: exit 0;
  on_fail: fix_and_rerun
- `git diff --name-only HEAD~1` — pass: write-set only; on_fail: stop

**Red allowance (T2–T6):** the four activity oracle gates may be red only on
movers each task journals, until T7 re-pins once.

**Measurement (orchestrator, after every task):** `npx tsx
scripts/activity-probe.ts --json measurements/tN.json` vs the previous JSON
(`base.json` = awrl's `final.json`); `npx tsx scripts/activity-diag-scan.ts`
(T0 commits it); `npx tsx scripts/activity-render-all.ts <dir>` at the
previous commit and at the working tree, then `cmp` per slug, for the mover
list; `--align <slug>` on the representative slugs. Agents stop before
committing and are resumed to commit.

## Index

- [`decisions.md`](decisions.md) — D1–D10 with the quoted Java, **locked**
- [`fixtures.md`](fixtures.md) — the 60 loop fixtures with their branch flags
- [`batch-0/overview.md`](batch-0/overview.md) — tooling (T0) ∥ AST (T1)
- [`batch-1/overview.md`](batch-1/overview.md) — loop hexagons + side labels (T2)
- [`batch-2/overview.md`](batch-2/overview.md) — while dimension (T3), while connections (T4)
- [`batch-3/overview.md`](batch-3/overview.md) — repeat dimension + entry (T5), repeat connections (T6)
- [`batch-4/overview.md`](batch-4/overview.md) — re-pin and close-out (T7)
- [`diagrams/data-flow.md`](diagrams/data-flow.md), [`diagrams/component-map.md`](diagrams/component-map.md)
- [`tools/`](tools/) — awrl's scratch measurement tools (`.mts` so lint-staged skips them), the source T0 commits
- [`decision-journal.md`](decision-journal.md)
- [`settings.autonomous.json`](settings.autonomous.json)

## Progress

- [x] Batch 0 — T0, T1
- [x] Batch 1 — T2
- [x] Batch 2 — T3, T4
- [x] Batch 3 — T5, T6 (T6 after the D5 amendment, option 1)
- [x] Batch 4 — T7

## Session summary (2026-09-16)

- **Tasks:** 8 of 8 complete. Commits on `feat/activity-loop-tile-port`:
  `7dcb0726` T0, `92a7fcb2` T1 + `5741d1c8` chore (tileNode last for
  lizard), `adf014d8` T2, `adf84310` T3, `256ad510` T4, `7163ae94` T5 move,
  `bc2c4194` T5 port, `0249de03` D5 amendment, `77d50172` T6, T7 re-pin
  (this commit); docs commits per batch.
- **Halt and resume:** stopped once at the T6 boundary (stop 11: six
  fixtures reach `ConnectionBackComplex1`, `stop-11-complex1.md`); the
  human chose option 1, D5 was amended, T6 ported `Complex1`.
- **Decisions:** ~45 journal rows. Flagged for review: D5 amendment;
  T5 dropped the never-fed `backward` child slot; the five filings below.
- **Defects found by measurement and fixed:** T2's helpers dropped the
  hexagon's own lane (kudedo/kasadu); T2's while-header polygon used the
  tile height (35 px) instead of the hexagon-alone height (24 px). Both
  found by element-level comparison against the golden after `--align`
  counts had already matched (memory `segment-compare-beats-align-counts`).
- **Quality gates at HEAD:** typecheck 0, lint 0, build 0 (0 `error TS`);
  `npm test` 725/725 collected, 19875 passed, 0 failed, coverage
  95.95/91.28/97.06/96.94; `svg-conformance` 27 files / 3427 passed / 1
  skipped at `3651a1ec` and at HEAD; scan 0 at every task; `hardViolations`
  empty (one attributed exemption added).
- **Exit bar:** `cemagu`, `fovaja`, `biguku` match the golden on every
  segment to 0.01 after canvas offset; `bareka` (if-side width,
  `GtileBreak` size), `ruzica`/`katopo`/`felega`/`tobajo` (`drawTranslate`)
  named with cites. Movers 60 of 60 rows, no parent re-centring. 56 rises
  accepted at the single re-pin, each classed. Aggregate 49658 -> 51371,
  reported not gated (D9).
- **Filed:** `activity-loop-lane-translate`, `activity-repeat-break-welding`,
  `activity-gtile-break-size`, `activity-loop-backward`,
  `activity-endwhile-end-placement` (`planning/next-missions.md`).
- **Not merged.**
