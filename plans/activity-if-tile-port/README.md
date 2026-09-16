# Mission: `activity-if-tile-port`

**Branch:** `feat/activity-if-tile-port` · **Planned:** 2026-09-15 ·
**Baseline commit:** `b79502b5` (main, clean; aggregate activity
`weightedScore` **52067** over the 268 baseline fixtures, of which the 123
fixtures containing an `if` sum to **33909** — 65.1%) · **Task prefix:** `aitp`

## Objective

Port the activity `if` tile as the jar builds it, so that every `if` draws
the jar's elements — a hexagon condition with its branch labels, one
in-connector per branch, the branches, one out-connector per branch, the
merge rhombus (or the single-branch `Else` loop around it), and for `elseif`
chains the row of diamonds with their horizontals and entry elbow — and
draws them in the jar's `conns`-list order.

Today the live `if` (`layout/tile-layout.ts#tileIf` -> `tiles/gtile-if.ts`
-> `layout/tile-coordinates.ts` `'gtile-if'`) emits ONE diamond and only
`diamond -> branch` edges: `tileIf` always passes a `null` merge diamond
(`tile-layout.ts:136`), so the walker's merge node and `branch -> merge`
edges are dead in production, the renderer draws `''` for `if-merge`, the
else edge of an empty `else` points into empty space, and the exit edge
starts from the tile's bottom-centre under nothing. Evidence and the
disproved premise of the filed `activity-if-connector-draw-order`:
`.agent-notes/aicdo-planning.md`.

The jar has FOUR builders, dispatched by `FtileFactoryDelegatorIf#createIf`
(`vcompact/FtileFactoryDelegatorIf.java:85-92`) and `ConditionalBuilder
#create` (`vcompact/cond/ConditionalBuilder.java:144-161`): `FtileIfDown`,
`FtileIfWithLinks`, `FtileIfLongHorizontal`, `FtileIfLongVertical` (the last
only under `!pragma useVerticalIf` — 0 fixtures, not ported). Each keeps a
`List<Connection>` and ends with `FtileUtils.addConnection`
(`ftile/FtileUtils.java:46-51`); `FtileWithConnection#drawU` draws the
delegate first, then the connections in list order
(`ftile/FtileWithConnection.java:69-74`).

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

## What was measured before planning

- Synthetic `if/else`, `if` (no else) and `if/elseif/else` rendered ours vs
  jar (`scripts/oracle-render.sh`): ours has one diamond, no merge, no
  labels, sideways arrowheads along the branch tops.
- `cemipu-87-dinu624` (`FtileIfDown`) golden edge run in lane 1 is exactly
  `In, Else2, Out`, then the enclosing sibling link — conns order, then the
  assembly's own link (`vcompact/FtileFactoryDelegatorAssembly.java:78-79`).
- Markup classification of the 123 `if` fixtures (provisional,
  [`fixtures.md`](fixtures.md)): ~20 elseif chains, ~28 single-branch, ~46
  two-branch, ~29 with several `if`s.

## Exit bar

- **Element templates met.** For each builder, on the three representative
  fixtures T1 dumps, our `<polygon>` / `<line>` / `<text>` counts equal the
  jar's and the (tag, lane) positional alignment does not fall below T1's
  base figure (stop 14). The aggregate `weightedScore` is REPORTED, never
  gated: `compare.ts:404`'s `[childCount]` short-circuit charges the sum of
  both sides, so a correct port that ADDS elements can raise it (D9).
- Zero UNEXPLAINED rises at re-pin: every `ROSE` line from
  `repin-activity-baselines.ts` has a journal row naming its task and
  mechanism.
- No fixture outside [`fixtures.md`](fixtures.md) moves except under T6's
  sibling-link rule, whose own mover list T6 journals.
- Sequence, state, class, description and json suites unmoved
  (`svg-conformance` **27 files / 3427 passed | 1 skipped** at `b79502b5`).
- `hardViolations` empty throughout; `ALLOWED_NEW_OVERLAPS` re-listed with a
  per-entry Java cite.
- All four gates green.

## What this mission does NOT do (D8 — file, never build)

- `FtileIfLongVertical`, `switch` (`FtileSwitch*`), notes attached to an
  `if` (`opale`), `conditionStyle` `EMPTY_DIAMOND`/`INSIDE_DIAMOND`,
  `conditionEndStyle hline` (2 + 2 fixtures), the multi-snake
  `drawTranslate` shapes of `ConnectionHorizontalThenVertical` /
  `ConnectionVerticalThenHorizontal` (`cond/FtileIfWithLinks.java:149-174,
  232-286`), snake merging (parent D5).
- Resize `GtileDiamond` (while/repeat) — T1 measures, T7 files.
- Touch `layout.old.ts`, any `activity-layout-*.ts`, `switch`'s walker case,
  or `src/core/**`.

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
   (a 500-line split re-export, and the index-dependent tests each task
   names, are pre-authorised)
2. The same gate fails on two consecutive fix attempts
3. A finding contradicts [`decisions.md`](decisions.md) D1–D9 — amend there
   and halt, never silently override
4. **No `src/` edit before T1's note holds the per-builder element templates
   (Q1) and the dispatch contract**, each with `file:line`
5. A fixture rises and its mechanism cannot be stated before the commit
6. A fixture outside [`fixtures.md`](fixtures.md) moves (T6 excepted, per
   its own journaled list)
7. Any sibling suite's test count changes
8. `hardViolations` is ever non-empty, or an `ALLOWED_NEW_OVERLAPS` entry
   cannot be attributed with a Java cite
9. `edges` and `edgeMeta` are found misaligned at any point
10. A task appears to need a D8 item to make a fixture match
11. A committed jar golden looks stale or re-captured mid-mission
12. An assertion must be DELETED rather than updated with a Java cite
13. `GtileDiamond`'s sizing (while/repeat) would have to change to make an
    `if` fixture match — halt for review, never widen silently
14. An `if` fixture's element counts move AWAY from the jar's template

## Push forward

A pure-move extraction plus re-export at the 500-line hook (journal it); test
organisation inside the task's own test files; helper and connector-function
names, provided each carries its Java `@see`; probe/re-pin output formatting
and flag spelling; `coverage/.tmp` under-collect -> `rm -rf coverage/.tmp`
and rerun; regenerating `docs/catalog.md` on drift; a FALLER with its
mechanism recorded; which Java `file:line` a JSDoc `@see` cites, provided it
is quoted from the source; text baseline offsets taken from `renderLabel`'s
existing convention (`activity-renderer-shapes.ts`).

## Quality gates

- `npm test` — pass: exit 0, `Test Files` ≥ 709 (fewer = `coverage/.tmp`
  under-collect: `rm -rf coverage/.tmp`, rerun); on_fail: fix_and_rerun
- `npm run typecheck` — pass: exit 0; on_fail: fix_and_rerun
- `npm run lint` — pass: exit 0; on_fail: fix_and_rerun
- `npm run build` — pass: exit 0; on_fail: fix_and_rerun
- `git diff --name-only HEAD~1` — pass: write-set only; on_fail: stop

**Between-task red allowance (T3–T6).** The activity oracle gates
(`activity.diff-baseline.ratchet`, `.swimlane-baseline`, `.style-baseline`,
`.text-baseline`) are equality pins that break by design until T7 re-pins
once (D9). They may be red only on [`fixtures.md`](fixtures.md) slugs (and
T6's own list) the journal explains. Every other test file must be green;
list each red file with its slug count in the batch gate row.

**Measurement between tasks (orchestrator):**
`npx tsx scripts/activity-probe.ts --slugs-file plans/activity-if-tile-port/fixtures.md --json <out>`
and `--align <slug>` on each representative slug (T1 adds the flag), compared
against `measurements/base.json` and the previous task's JSON — never against
the pins.

## Index

- [`decisions.md`](decisions.md) — D1–D9, **locked**
- [`fixtures.md`](fixtures.md) — provisional affected slugs; T1 rewrites
- [`batch-0/overview.md`](batch-0/overview.md) — diagnosis + templates (T1)
- [`batch-1/overview.md`](batch-1/overview.md) — edge decorations, renderer
  shapes (T2)
- [`batch-2/overview.md`](batch-2/overview.md) — `FtileIfWithLinks` (T3)
- [`batch-3/overview.md`](batch-3/overview.md) — `FtileIfDown` (T4)
- [`batch-4/overview.md`](batch-4/overview.md) — `FtileIfLongHorizontal` (T5)
- [`batch-5/overview.md`](batch-5/overview.md) — sibling link order (T6)
- [`batch-6/overview.md`](batch-6/overview.md) — re-pin and close-out (T7)
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — one `if` from AST to
  edge run
- [`diagrams/component-map.md`](diagrams/component-map.md) — write-set map
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`settings.autonomous.json`](settings.autonomous.json) — permissions

## Progress

- [x] Batch 0 — T1
- [x] Batch 1 — T2
- [ ] Batch 2 — T3
- [ ] Batch 3 — T4
- [ ] Batch 4 — T5
- [ ] Batch 5 — T6
- [ ] Batch 6 — T7
