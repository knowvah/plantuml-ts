# Mission: `activity-edge-draw-order`

**Branch:** `feat/activity-edge-draw-order` · **Planned:** 2026-09-15 ·
**Baseline commit:** `6ff347f8` (main, clean; aggregate activity
`weightedScore` **52673** over the 268 baseline fixtures) ·
**Task prefix:** `aedo`

## Objective

Emit activity edges in the jar's draw order. Two rules, both measured at
planning and both in scope:

- **(b) swimlane pass order** — upstream draws the whole diagram once per
  lane through `UGraphicInterceptorOneSwimlane` (same-lane connections only,
  `UGraphicInterceptorOneSwimlane.java:92-103`), then a final `Cross` pass for
  connections whose ends differ (`Swimlanes.java:178-216,318-355`). Ours emits
  every edge in walk order (`renderer.ts:234-247` over `Out.edges`).
- **(a) parallel connector order** — upstream collects every `ConnectionIn` in
  `doStep1` and every `ConnectionOut` in `doStep2`
  (`AbstractParallelFtilesBuilder.java:166-169`;
  `ParallelBuilderSplit.java:79-111,136-179`; `ParallelBuilderFork` the same),
  and `FtileWithConnection.drawU` draws the delegate before its connections
  (`FtileWithConnection.java:69-74`). Ours pushes one branch's in- and
  out-connector per branch (`walk-fork-branches.ts:81-109,121-129`).

Connections are Snakes, buffered by `UGraphicForSnake` and flushed at the end
(`svek/UGraphicForSnake.java:137-165`), so every edge follows every box in the
jar's SVG — our node-then-edge split already matches. Only the order WITHIN
the edge run is wrong.

Filed as `activity-split-connector-draw-order` by `activity-lane-capture`
(`planning/next-missions.md`); widened to both rules by the maintainer,
2026-09-15, after (b) measured ~10x (a).

## What was measured before planning

Throwaway worktree off `6ff347f8`, probe over all 268 (aggregate 52673):

| change | aggregate | fell / rose |
|---|---|---|
| (a) alone | 52616 | 5 / 3 (`misiji` +32) |
| (b) alone | 52074 | 32 / 4 (each ≤ +4) |
| (a)+(b) | 52066 | 33 / 5 (each ≤ +4) |

**These are NOT targets.** The scratch permuted `edges` without `edgeMeta`,
which `compressGeometry` and `shapesOf` read by index
(`shapes-of.ts:376-377`) — so compression saw mismatched lanes. T1
re-measures with both permuted together (D1); [`fixtures.md`](fixtures.md) is
provisional until it does.

## Exit bar

- Zero UNEXPLAINED rises: every `ROSE` line from
  `repin-activity-baselines.ts` has a journal row stating its mechanism
- No fixture outside [`fixtures.md`](fixtures.md) moves, and every mover
  inside is explained by the rule its task changed
- Sequence, state, class, description and json suites unmoved, with counts
  (at `6ff347f8`: 1151 / 2+1 skipped / 62 / 316 / 24 / 54 / 11)
- `ALLOWED_NEW_OVERLAPS` re-listed with a per-entry Java cite;
  `hardViolations` empty throughout
- All four gates green

The aggregate is reported, never gated: `weightedScore` pairs elements
positionally, so a correct order can raise a positionally paired score.

## What this mission does NOT do

- Port `UGraphicForSnake`'s snake MERGING (`:147-157`) — T1 measures, T4
  FILES `activity-snake-merge` (D5)
- Change `routeEdge`'s jog shape, `ConnectionCross` geometry, lane widths,
  the compress pass, or any node's position
- Fix the connector order INSIDE `if`/`while`/`repeat` — T1 checks, T4 files
  (D7)
- Touch `layout.old.ts`, any `activity-layout-*.ts`, or `src/core/**`

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
   (creating `layout/edge-draw-order.ts` and editing the index-dependent
   tests named in each task are pre-authorised)
2. The same gate fails on two consecutive fix attempts
3. A finding contradicts [`decisions.md`](decisions.md) D1–D7 — amend there
   and halt, never silently override
4. **No `src/` edit before T1 states the lane-less-edge rule (D2)** with
   `file:line`, a causal chain, and a non-empty "ruled out"
5. **A fixture rises and its mechanism cannot be stated before the commit**,
   including any `ROSE` line at T4 without a journal row
6. **A fixture outside [`fixtures.md`](fixtures.md) moves**, or one inside
   moves that the task's rule cannot explain
7. Any sibling suite's test count changes
8. `hardViolations` is ever non-empty, or after T3 an `ALLOWED_NEW_OVERLAPS`
   entry cannot be attributed per entry with a Java cite
9. `edges` and `edgeMeta` are found misaligned at any point
10. A fix appears to need snake merging, `ConnectionCross` geometry, or a
    `routeEdge` jog change (D5/D7)
11. A committed jar golden looks stale or re-captured mid-mission — the port
    is not the thing that changed; find out what did
12. An assertion must be DELETED rather than reordered — that means behaviour
    changed, not order

## Push forward

A pure-move extraction plus re-export at the 500-line hook (journal it); test
organisation inside the task's own test files; reordering an index-based
assertion whose expected values are unchanged apart from position (journal
the per-file count); the exact naming and signature of the ordering helpers,
provided D1's contract holds and `edges`/`edgeMeta` move together;
probe/re-pin output formatting and flag spelling; `coverage/.tmp`
under-collect → `rm -rf coverage/.tmp` and rerun; regenerating
`docs/catalog.md` on drift; a FALLER inside the expected set with its
mechanism recorded; which Java `file:line` a JSDoc `@see` cites, provided it
is quoted from the source.

## Quality gates

- `npm test` — pass: exit 0, `Test Files` ≥ 709 (fewer = `coverage/.tmp`
  under-collect: `rm -rf coverage/.tmp`, rerun); on_fail: fix_and_rerun
- `npm run typecheck` — pass: exit 0; on_fail: fix_and_rerun
- `npm run lint` — pass: exit 0; on_fail: fix_and_rerun
- `npm run build` — pass: exit 0; on_fail: fix_and_rerun
- `git diff --name-only HEAD~1` — pass: write-set only; on_fail: stop

**Between-task red allowance (T2–T3 only).** The four activity oracle gates
(`activity.diff-baseline.ratchet`, `.swimlane-baseline`, `.style-baseline`,
`.text-baseline`) are equality pins that break by design until T4 re-pins
once (D6). They may be red, only on [`fixtures.md`](fixtures.md) slugs the
journal explains. Every other test file must be green; list each red file
with its slug count in the batch gate row.

**Measurement between tasks (orchestrator):**
`npx tsx scripts/activity-probe.ts --slugs-file plans/activity-edge-draw-order/fixtures.md --json <out>`,
compared against `measurements/base.json` (written by T1), never against the
pins — they go stale on purpose between T2 and T4.

## Index

- [`decisions.md`](decisions.md) — D1–D7, **locked**
- [`fixtures.md`](fixtures.md) — provisional affected slugs; T1 amends
- [`batch-0/overview.md`](batch-0/overview.md) — diagnosis (T1)
- [`batch-1/overview.md`](batch-1/overview.md) — lane pass order (T2)
- [`batch-2/overview.md`](batch-2/overview.md) — parallel connectors (T3)
- [`batch-3/overview.md`](batch-3/overview.md) — re-pin and close-out (T4)
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — where an edge's order is
  decided
- [`diagrams/component-map.md`](diagrams/component-map.md) — write-set map
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`settings.autonomous.json`](settings.autonomous.json) — permissions

## Progress

- [x] Batch 0 — T1
- [ ] Batch 1 — T2
- [ ] Batch 2 — T3
- [ ] Batch 3 — T4
