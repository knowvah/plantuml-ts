# add3-T2d-b — all four rows blocked on files outside this task's write-set

## Outcome
Zero production edits. Every row in this task's spec requires a change in a
file outside `tiles/gtile-switch.ts, layout/walk-switch.ts,
tiles/gtile-repeat.ts, tiles/gtile-while.ts, layout/walk-repeat.ts,
layout/walk-while-branch.ts` — either because the owning dispatch logic
lives elsewhere, or (ruzazu) because the divergence is proven to be further
upstream than this task's files. No commits landed; `.agent-notes/add3-T2d-b.md`
is the only new file.

Baseline (unchanged, confirmed by probe + targeted vitest, both green):
`npx tsx scripts/activity-probe.ts --slugs ruzazu-94-meso880,reluvi-59-pifi444,
vamazo-19-tufu812,tepivu-88-reze603,xefalo-73-sabi101,nikivo-06-kaxa873` ->
aggregate=16360 (branch head Σ, unchanged), subsetSum=1053 over the 6 slugs,
0 risers, 0 fallers. `activity.golden.ratchet.test.ts`,
`activity.harness-parity.test.ts`, `activity.style-baseline.test.ts`,
`activity.swimlane-baseline.test.ts`: 788/788 passed.

## Item 1 — ruzazu-94-meso880 BIG_DIAMOND (SWITCH)

**Mechanism (re-verified, not just repeated from the ledger):**
`GtileSwitch`'s `computeIsBigDiamond` (`src/diagrams/activity/tiles/
gtile-switch.ts:45-53`) already faithfully ports `FtileSwitchWithDiamonds`'s
constructor (`vcompact/cond/FtileSwitchWithDiamonds.java:73-90`): `w13 =
diamond.width - first.getRight() - last.getLeft()`, `w9` sums the strictly-
interior cases, `mode = w13 > w9 ? BIG : SMALL`. This formula is correct —
the divergence is in the VALUES fed to it, not the formula.

Each case tile is a `GtileTopDown` built by `tileSwitchCase`
(`src/diagrams/activity/layout/tile-layout-structural.ts:201-209`, NOT in
this task's write-set). I re-derived `GtileTopDown`'s own `left`/`width`
formula (`src/diagrams/activity/tiles/gtile-top-down.ts:49-57`, also NOT in
this task's write-set) against the Java it claims to mirror
(`FtileGeometryMerger.java:40-53`, binary `appendBottom`) and proved the
two are mathematically equivalent: our global
`left = max(lefts)`/`width = max(w_i + (left - lefts_i))` is exactly the
associative fold of `FtileGeometryMerger`'s pairwise merge over an n-ary
chain (proved by induction: merging a 3rd geometry into an already-merged
pair distributes the same way as the single global max, because the
constant offset `(left123 - left12)` added to a `max(...)` term can be
pushed inside the max). **`GtileTopDown` has no defect for this row.**

This narrows, but does not locate, the real divergence: it must be in a
LEAF tile's own width/`NORTH_HOOK.x` further down the case's content tree
(e.g. an action-box sizing difference), which is outside
`gtile-switch.ts`/`walk-switch.ts`/`gtile-top-down.ts`/
`tile-layout-structural.ts` entirely and is not something a small task can
locate without a dedicated leaf-width-fidelity investigation (as the prior
note `.agent-notes/T1p-f-switch-big-diamond.md` already flagged as a
follow-on, not this task's work).

**Owner:** none assigned yet — file as a follow-on width-fidelity mission,
not a T2d-b fix. Do not touch the mode threshold itself; that would be
fitting a value to one fixture.

## Items 2–4 — CSTYLE-EMPTY / CONDSTYLE-EMPTY / CONDSTYLE-WHILE (repeat, while)

**Mechanism, re-verified against three Java methods directly (not the
census's file:line alone):**

- `FtileWhile.create` (`vcompact/FtileWhile.java:118-141`) is itself the
  3-way `conditionStyle` dispatch for the while header: `INSIDE_HEXAGON` ->
  `new FtileDiamondInside(...).withNorth(yesTb).withWest(outTb)` (our only
  ported branch today), `INSIDE_DIAMOND` ->
  `new FtileDiamondSquare(...).withNorth(yesTb).withWest(outTb)`,
  `EMPTY_DIAMOND` ->
  `new FtileDiamond(...).withNorth(testTb).withSouth(yesTb).withWest(outTb)`.
  Our port of this dispatch is `src/diagrams/activity/layout/
  tile-layout.ts:205-223` (`tileWhile`), which unconditionally builds
  `new GtileDiamondInside(node.condition, labels, bounder, theme)` — no
  `theme.conditionStyle` branch exists there at all. **`tile-layout.ts` is
  not in this task's write-set.**

- `FtileRepeat`'s diamond2 dispatch (`vcompact/FtileRepeat.java:140-166`,
  not exactly 156-159 as the census cited — that line range is the
  EMPTY_DIAMOND branch body, 156-163 end-to-end) is the repeat equivalent:
  `INSIDE_HEXAGON` -> `FtileDiamondInside(...).withWest/East(yesTb)
  .withSouth(outTb)` (already ported), `EMPTY_DIAMOND` ->
  `new FtileDiamond(...).withEast(tbTest)` **plus** a different 4th
  constructor argument to `FtileRepeat` itself (`tbTest` instead of
  `TextBlockUtils.empty(0,0)`, line 159) and a different font config for
  the test label (`fcArrow` not `fcDiamond`, line 124-125) — EMPTY_DIAMOND
  is not just "swap the diamond class", it changes which labels exist and
  how the test text is laid out. Our port is `tile-layout.ts:288-298`
  (`tileRepeatCondition`), which already handles `'insideDiamond'` ->
  `GtileDiamondSquare` (mission add2-T3i) but has no `'emptyDiamond'`
  branch — same file, same non-write-set boundary.

- `ConditionalBuilder.java:250-278` is the IF diamond's OWN independent
  3-way dispatch (`FtileDiamond`/`FtileDiamondInside`/`FtileDiamondSquare`,
  with `withNorth`+`withWestAndEast`/`withSouth`+`withEast` depending on
  `eastWest`) — confirms xefalo-73-sabi101 (a pure "6 ifs" fixture) is
  T2a's `conditional-builder.ts:259-266` alone, exactly as the task spec
  anticipated.

- tepivu-88-reze603's own row text ("conditionStyle diamond on a while")
  is NOT an if — it is the SAME `FtileWhile.create` EMPTY_DIAMOND branch
  as reluvi/vamazo (census-a's "CSTYLE-EMPTY" and census-b's
  "CONDSTYLE-EMPTY" tags are two labels for one mechanism). nikivo's
  secondary CONDSTYLE-WHILE (`FtileWhile.java:131-136`, `INSIDE_DIAMOND`)
  is the SAME dispatch's middle branch.

**Why this isn't separable into this task's write-set, checked, not
assumed:** even the minimal version of this feature requires calling a
NEW constructor branch at the ONE call site that builds the header/
condition tile today, and that call site is `tile-layout.ts`. I checked
whether the "draw" side alone (our write-set) could absorb the dispatch
instead — it cannot: `walk-while-branch.ts:425-426` already hard-casts
`rawChildren[0] as unknown as GtileDiamondInside` under a documented D1
("the header is always a `GtileDiamondInside`,
`tile-layout.ts#tileWhile`") — a second header TYPE needs that cast (and
the label-position logic around it, since EMPTY_DIAMOND's test/yes/out
positions differ from INSIDE_HEXAGON's) touched too, but only AFTER
`tile-layout.ts` and a labeled `tiles/gtile-diamond.ts` primitive exist —
there is nothing for `gtile-while.ts`/`walk-while-branch.ts` to widen
against yet. Building the widened type first, with no producer, would be
unused/speculative code.

`tiles/gtile-diamond.ts` (`GtileDiamond`, the plain-rhombus leaf) today has
ZERO label slots — it has no `withNorth`/`withSouth`/`withWest`/`withEast`
equivalent at all, unlike `gtile-diamond-square.ts` and
`gtile-diamond-inside.ts`, which already carry `DiamondInsideLabels`.
Per census-b, `tiles/gtile-diamond.ts` is T2b's file.

**Owners:**
- `layout/tile-layout.ts` (`tileWhile`, `tileRepeatCondition`): unowned in
  any brief I can see — needs a `theme.conditionStyle === 'emptyDiamond'`
  (and, for while, `'insideDiamond'`) branch mirroring the Java above.
- `tiles/gtile-diamond.ts`: T2b (census-b) — needs a labeled EMPTY_DIAMOND
  variant (north/south/west/east slots, mirroring
  `DiamondInsideLabels`/`DiamondConditionTile` from
  `gtile-diamond-inside.ts`).
- `layout/conditional-builder.ts:259-266`: T2a (running task) — xefalo's
  if-only EMPTY_DIAMOND branch.
- Once the above land: `tiles/gtile-while.ts` (widen `header`'s type off
  `GtileDiamondInside`), `layout/walk-while-branch.ts:425-426` (replace the
  D1 cast with a real union + per-style label positions),
  `tiles/gtile-repeat.ts` (extend `RepeatConditionTile`'s union, plus the
  4th-constructor-arg/font difference above), `layout/walk-repeat.ts` — all
  squarely this write-set's job, but gated on the three items above.

## Not done, and why (summary)
All four corpus rows (ruzazu, reluvi, vamazo, tepivu, xefalo, nikivo) are
blocked on files outside `tiles/gtile-switch.ts, layout/walk-switch.ts,
tiles/gtile-repeat.ts, tiles/gtile-while.ts, layout/walk-repeat.ts,
layout/walk-while-branch.ts`:
- ruzazu: proven NOT a `gtile-switch.ts`/`walk-switch.ts`/`gtile-top-down.ts`
  defect; residual is an unlocated leaf-width-fidelity gap, a separate
  mission.
- reluvi, vamazo, tepivu (CSTYLE/CONDSTYLE-EMPTY, while/repeat) and
  nikivo's secondary CONDSTYLE-WHILE: the `conditionStyle` dispatch for
  while/repeat headers lives entirely in `layout/tile-layout.ts`, which
  this task cannot write to, and the EMPTY_DIAMOND primitive lives in
  `tiles/gtile-diamond.ts` (T2b).
- xefalo (CONDSTYLE-EMPTY, if): confirmed T2a's `conditional-builder.ts`
  alone, as the task spec anticipated.

No census-row mode flipped; no risers; no fallers; pins and ratchet/
harness-parity tests are byte-identical to the branch head because nothing
in this task's write-set changed.
