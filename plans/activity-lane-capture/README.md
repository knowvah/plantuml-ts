# Mission: `activity-lane-capture`

**Branch:** `feat/activity-lane-capture` · **Planned:** 2026-09-15 ·
**Baseline commit:** `2a31a9ad` (main, clean; aggregate activity
`weightedScore` **52954** over the 268 baseline fixtures; the 40 affected
fixtures in [`fixtures.md`](fixtures.md) **11783**) · **Task prefix:** `alc`

## Objective

Capture every activity compound's swimlane where upstream does — at its
opener — and give fork, split and repeat the second, out lane upstream keeps.
Today `if`, `while`, `repeat`, `fork` and `split` all spread
`swimlaneSpread(ctx)` AFTER their body parses (`if-dispatch.ts:189`;
`node-dispatch.ts:176,230,261,291`), so `swimlane` is the lane current at the
block's END, and that one field feeds both `laneIn` and `laneOut`
(`swimlane-placement.ts:85,96`). Upstream reads
`swimlanes.getCurrentSwimlane()` when the block opens
(`ActivityDiagram3.java:219,250,309,397`; `InstructionRepeat.java:107`) and
keeps `swimlaneOut` updated at `fork again`/`end fork`, `end split` and
`repeat while` (`InstructionFork.java:88-89,139,196`;
`InstructionSplit.java:71,140`; `InstructionRepeat.java:196`). Filed as
`activity-fork-split-lane-capture` (`planning/next-missions.md:1233`);
widened to all five kinds by the maintainer, 2026-09-15.

## What was measured before planning

| finding | number |
|---|---|
| baseline fixtures with a lane switch INSIDE a compound (regex scan; T1 verifies) | **40 / 268** — if 18, split 10, repeat 9, fork 6, while 3, switch 0 |
| laned repeats whose `repeat` and `repeat while` lanes differ | 6 — reach unported `ConnectionBackComplex1` (D3) |
| allowed overlaps this defect causes | 7 in `tests/diagrams/activity/layout/compress/invariant.test.ts:230-238` |
| throwaway capture-before-parse at apc-T3 (fork/split only, one field) | `bixefi` 220→119, `tobajo` 774→725, `sopape` 96→73, `racana` 240→217 fell; **`jevoce` 369→599 rose, mechanism unread**. Pre-akc numbers — re-measure |
| write-set files near the 500-line hook | `swimlane-placement.ts` 496, `node-dispatch.ts` 455 |
| committed probe / re-pin tooling | none — both scratch copies lost (D4) |

## Exit bar (D5)

- `ALLOWED_NEW_OVERLAPS` is empty, or every survivor is re-attributed with a
  Java `file:line` to a shape that contributes no slot on the moved axis
- On the 40 fixtures, every compound shape's lane (`activity-probe --lanes`)
  matches the jar's, or the miss is named in the journal with its mechanism
- **Zero UNEXPLAINED rises** in `diff-baseline.json`: every `ROSE` line from
  `repin-activity-baselines.ts` has a journal row stating the mechanism
- No fixture outside [`fixtures.md`](fixtures.md) moves; sequence, state,
  class, description and json suites unmoved, with counts
- All four gates green

The aggregate is reported against 52954 and the subset against 11783. It is
**not** the bar: a correct lane can raise a positionally paired score.

## What this mission does NOT do

- Add repeat's entry diamond or port `ConnectionBackComplex1` — FILE
  `activity-repeat-entry-diamond` (D3)
- Parse `backward:` — FILE `activity-repeat-backward` (D7)
- Touch lane width measurement (`swimlane-context.ts`), the compress pass,
  `layout.old.ts`, any `activity-layout-*.ts`, `src/core/**`, or the
  `ActivityNodeGeo`/`ActivityEdgeGeo`/`SwimlaneGeo` shapes
- Work the other akc follow-ons (arrows-triangle, edge-label width, branch
  vertical pitch, off-canvas arrowhead, canvas margin)

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
   (the T2 lane-helper move and a T6 `parallel-dispatch.ts` extraction are
   pre-authorised)
2. The same gate fails on two consecutive fix attempts
3. T1 (or any task) finds the Java contradicts [`decisions.md`](decisions.md)
   D1/D2 — amend there and halt, never silently override
4. **No `src/` edit before T1 states the `jevoce` mechanism** — `file:line`,
   causal chain, and a non-empty "ruled out"
5. **A fixture rises and its mechanism cannot be stated before the commit**,
   including any `ROSE` line at T8 without a journal row
6. **A fixture outside [`fixtures.md`](fixtures.md) moves**, or one inside
   moves that the task's compound kind cannot explain
7. A fix needs `ConnectionBackComplex1`, a repeat entry diamond, or
   `backward:` (D3/D7)
8. After T7, an `ALLOWED_NEW_OVERLAPS` survivor cannot be attributed, with a
   Java cite, to a shape that does not occupy the moved axis
9. A committed jar golden looks stale or re-captured mid-mission — the port
   is not the thing that changed; find out what did

## Push forward

A pure-move extraction plus re-export when a file would cross the 500-line
hook (journal it); test organisation inside the task's own test files; a
FALLER inside the expected set with its mechanism recorded; which Java
`file:line` a JSDoc `@see` cites, provided it is quoted from the source;
probe/re-pin output formatting and flag spelling within T0a's contract;
`coverage/.tmp` under-collect → `rm -rf coverage/.tmp` and rerun;
regenerating `docs/catalog.md` on drift.

## Quality gates

- `npm test` — pass: exit 0, `Test Files` ≥ 707 (fewer = `coverage/.tmp`
  under-collect: `rm -rf coverage/.tmp`, rerun; confirm with
  `npx vitest run --coverage.enabled=false --reporter=json`);
  on_fail: fix_and_rerun
- `npm run typecheck` — pass: exit 0; on_fail: fix_and_rerun
- `npm run lint` — pass: exit 0; on_fail: fix_and_rerun
- `npm run build` — pass: exit 0; on_fail: fix_and_rerun
- `git diff --name-only HEAD~1` — pass: write-set only; on_fail: stop

**Between-task red allowance (T3–T7 only).** The four activity oracle gates
— `activity.diff-baseline.ratchet`, `activity.swimlane-baseline`,
`activity.style-baseline`, `activity.text-baseline` — are equality pins
that break by design until T8 re-pins once (D6). They may be red, and only
on slugs in [`fixtures.md`](fixtures.md) that the journal explains. Every
other test file must be green. List each red file with its slug count in the
batch gate row.

**Measurement between tasks (orchestrator):**
`npx tsx scripts/activity-probe.ts --slugs-file plans/activity-lane-capture/fixtures.md`
— see [`batch-0/overview.md`](batch-0/overview.md#the-probe).

## Index

- [`decisions.md`](decisions.md) — D1–D7, **locked**
- [`fixtures.md`](fixtures.md) — the 40 affected slugs, kind, pinned score
- [`batch-0/overview.md`](batch-0/overview.md) — probe (T0a) ‖ re-pin tool (T0b)
- [`batch-1/overview.md`](batch-1/overview.md) — mechanism diagnosis (T1)
- [`batch-2/overview.md`](batch-2/overview.md) — lane helpers + `swimlaneOut` (T2) ‖ `if` (T3)
- [`batch-3/overview.md`](batch-3/overview.md) — `while` (T4)
- [`batch-4/overview.md`](batch-4/overview.md) — `repeat` in/out (T5)
- [`batch-5/overview.md`](batch-5/overview.md) — `fork` in/out (T6)
- [`batch-6/overview.md`](batch-6/overview.md) — `split` in/out (T7)
- [`batch-7/overview.md`](batch-7/overview.md) — re-pin and close-out (T8)
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — where a lane is read
- [`diagrams/component-map.md`](diagrams/component-map.md) — write-set map
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`settings.autonomous.json`](settings.autonomous.json) — permissions

## Progress

- [x] Batch 0 — T0a, T0b
- [ ] Batch 1 — T1
- [ ] Batch 2 — T2, T3
- [ ] Batch 3 — T4
- [ ] Batch 4 — T5
- [ ] Batch 5 — T6
- [ ] Batch 6 — T7
- [ ] Batch 7 — T8
