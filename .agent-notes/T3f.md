# T3f — cross-lane connectors + swimlane details (add2 batch 3, wave 2)

## Commits (branch `add2/T3f`, worktree `.claude/worktrees/add2-T3f`)

1. `471a20e46` fix(activity): swimlane title band stroke matches its fill (M)
2. `b1bd05be7` fix(activity): resolve [[url label]] swimlane titles before
   sizing (SLURL)
3. `e6774bbaf` feat(activity): capture elseif's leading (incoming) label
   (ELSEIFIN) — capture only; rendering wiring re-slotted (below)
4. `54c4b7a0d` fix(activity): tag parallel connectors with fork/split
   builder kind (PARX residual, re-slotted from T3c at the b3w1 close)

## Java → ours (file:line)

- **M**: `Swimlanes.java:358-366` `drawTitlesBackground`'s
  `.apply(color.bg()).apply(color)` paints the SAME `HColor` as both fill
  and stroke (default line thickness 1) →
  `activity-renderer-swimlanes.ts#renderSwimlaneBand` now emits
  `stroke: color, strokeWidth: 1` whenever the fill resolves to a real
  colour (stays `stroke: 'none'` for the default transparent case).
- **SLURL**: `Swimlanes.java:285-293` `getTitle` builds every lane title
  through `Display.create9`'s creole pipeline, which resolves an inline
  `[[url label]]` token to its visible label (`TextLink.java:50-52`)
  before any width is measured — raw markup has no on-diagram width →
  `swimlane-placement.ts#measureLanes` now measures
  `resolveInlineLinks(name)` (reused from
  `src/diagrams/description/parse-helpers-inline-links.ts`, the same
  helper link/arrow-label width measurement already uses elsewhere) and
  `activity-renderer-swimlanes.ts#renderSwimlaneTitles` now draws the
  resolved text instead of the raw string.
- **ELSEIFIN (capture only)**: `CommandElseIf2.java:70-76` (the leading
  `(INCOMING)?` regex group) / `:147-151`
  (`CommandBackward3.getBackRendering` → `diagram.elseIf(incoming, ...)`)
  → `dispatch-support.ts#RE_ELSEIF` now CAPTURES that group (was a
  non-capturing `(?:...)?`) and `if-dispatch.ts#consumeElseifClause`
  stores it on the new `ActivityElseIf.incomingLabel` field (`ast.ts`).
  Traced the actual draw site: `InstructionIf#elseIf`'s `inlabel` param
  becomes `Branch#getInlabel()`, which
  `FtileIfLongHorizontal.java:178-186` draws on the DIAMOND's own west
  side (`diamond.withWest(tbInlabel)`) — the exact slot
  `walk-if-long-horizontal.ts#pushDiamondLabel(..., 'west', ...)`
  already draws for every other `GtileDiamondInside2` west label. It is
  **not** drawn on the connecting arrow at all
  (`ConnectionHorizontal.drawU`, `:260-270`, draws no label).
- **PARX residual**: `ParallelBuilderFork.java:172,229`
  (`ConnectionIn`/`ConnectionOut#drawTranslate` call
  `.ignoreForCompression()`) vs `ParallelBuilderSplit.java:207-225,
  264-285` (same-named `drawTranslate` overloads, NEVER call it) vs
  `ParallelBuilderMerge` (shares Fork's own `doStep1`/`ConnectionIn`
  byte-for-byte, confirmed by reading `gtile-merge.ts`'s own doc, not
  copied) → `EdgeShape` (`swimlane-placement.ts`) gains
  `'parallel-in-split'`/`'parallel-out-split'` siblings of
  `'parallel-in'`/`'parallel-out'`; `walk-fork-branches.ts`'s new
  `ForkBranchContext.isSplit` (`t.kind === 'gtile-split'`) selects which
  tag `pushBranchIn`/`pushBranchOut` push; `crossLaneMiddleY` treats both
  variants identically (same `+4`/`-14` elbow — confirmed from the Java,
  fork and split use the SAME geometry, only compression differs);
  `compress/shapes-of.ts#terminalArrowhead`'s existing
  `meta.shape === 'parallel-in' || meta.shape === 'parallel-out'` check
  now naturally excludes the `-split` tag (no logic change needed there,
  just the new tag values flowing through).

## Rows reaching 0

`vidada-17-xuse810` (M), `bugaja-31-jaso630`, `judatu-15-xize591`,
`nupose-71-vido428`, `racana-82-zece676`, `roboja-69-susa752` (all PARX
residual). Confirmed byte-identical to the jar via the golden ratchet
(all are now exact-match / zero-diff).

## Probe Σ before/after, per commit (144 baseline rows)

- Baseline (branch head `1a21d1921` before T3f): **Σ 20614**, 0 risers.
- After M (`471a20e46`): Σ 20614 → not separately measured (bundled with
  SLURL in the same probe run below); `vidada-17-xuse810` alone: 2 → 0.
- After M+SLURL (`b1bd05be7`): **Σ 20587** (−27), 0 risers. 2 fallers:
  `nesozi-09-zezu092` (46 → 21; H1 canvas-origin residual +
  unapplied `hyperlinkColor`/`hyperlinkUnderline` remain, out of this
  write-set), `vidada-17-xuse810` (2 → 0).
- After ELSEIFIN capture (`e6774bbaf`): **Σ 20587** (unchanged, exactly
  as expected — nothing renders differently until the wiring below
  lands). 0 risers, 0 fallers.
- After PARX residual (`54c4b7a0d`): **Σ 20118** (−469). 0 risers.
  8 fallers: `bugaja-31-jaso630` (37→0), `jevoce-05-mumi686` (81→28,
  XLANE/T1p-g residual remains), `judatu-15-xize591` (235→0, bonus —
  not a named cohort row), `nesozi-09-zezu092` (unaffected by this
  commit; carried from SLURL), `nupose-71-vido428` (43→0),
  `racana-82-zece676` (58→0), `roboja-69-susa752` (43→0),
  `vidada-17-xuse810` (unaffected, carried from M).
- **Final: Σ 20614 → 20118 (−496, −2.4%), 0 unexplained risers at every
  stage**, verified by `activity-probe.ts` after each commit. 206 pinned
  goldens byte-equal throughout (`activity.golden.ratchet.test.ts`,
  450 tests green); `activity.harness-parity`/`activity.diff-baseline.
  ratchet` green throughout.

`maketa-43-juja264`/`decudi-92-bisu741` (the two PARX>XLANE>H1 rows)
stayed at 10 each — confirmed unaffected: their remaining diff is purely
the XLANE jog portion (below), not the X-skip PARX fixed.

## Risers

None at any stage. Every probe run after every commit reported
`risers (0)`.

## Re-slots (mechanism + owning files, not completed — write-set boundary)

All three below hit the SAME shape of wall: the DATA capture lives in a
file this task owns, but the file that WIRES that data into tile
construction (and therefore layout geometry) does not.

- **N** (`end fork {label}`, `zafoxu-20-xofe568`, ws 9):
  `CommandForkEnd3.java:57-81`'s `(\{.+\})?` LABEL group already reaches
  `parallel-dispatch.ts`'s `RE_FORK_END`/`collectForkBranches` (pre-
  existing, unchanged) but is parsed-and-dropped. The render site is
  `FtileBlackBlock.calculateDimensionFtile`/`drawU`
  (`vertical/FtileBlackBlock.java:88-113`): the join bar's own width
  grows by `labelWidth + 5` and the label draws at `width + 5`, but ONLY
  for `ForkStyle.FORK` (`FtileFactoryDelegatorCreateParallel.java:51-63`
  — `ParallelBuilderMerge`/`Split` never receive the label at all,
  confirmed by reading that dispatcher, not assumed). Wiring this
  requires `new GtileFork(branches, bounder, BAR_HEIGHT, label)` at
  `tile-layout-structural.ts#tileFork` (line ~42) — that file is OUTSIDE
  this task's write-set (owned by T3g this wave per `overview.md`'s
  table: `layout/{tile-layout*,tile-coordinates}.ts`). Not attempted;
  `ActivityFork` has no `label` field yet either (adding it is cheap but
  pointless without the construction-site wire).
- **O** (`|#color|lane|` background, `cejupe-34-muti621`, ws 10,
  entangled with family A, not mine): `Swimlanes.java:332-340` draws a
  per-lane `URectangle` background from `swimlane.getColors()`. The
  actual `SwimlaneGeo[]` CONSTRUCTION site is
  `swimlane-placement.ts#placeSwimlanes`/`computeLaneOrigins` (mine), so
  a `background?: string` field on `SwimlaneGeo` (`activity-geometry.
  types.ts`, mine) and the render fill (`activity-renderer-swimlanes.ts`,
  mine) are both reachable. The blocker is upstream of that: there is no
  channel today from `RE_SWIMLANE`'s captured `#color` group
  (`dispatch-support.ts`, mine) to `placeSwimlanes`'s `nodes`/`laneNames`
  inputs without either (a) a new top-level `ActivityDiagramAST` field
  copied in `parser.ts` (NOT mine — it builds the returned AST
  field-by-field, no spread), or (b) smuggling the colour onto every
  node via `swimlaneSpread` and verifying it survives every intermediate
  geometry stage between parse and `placeSwimlanes` (several of which are
  outside this task's write-set and were not inspected closely enough to
  trust). Re-slotted rather than guessed at.
- **ELSEIFIN wiring**: see the mechanism above — `conditional-builder.ts
  #buildLongHorizontalDiamonds`/`LongHorizontalBranch` (owned by T3h this
  wave per `overview.md`) needs `incomingLabel` threaded onto
  `labels.west` alongside the existing `north`/`east` labels (a 3-line
  change: add the field to `LongHorizontalBranch`, map it in
  `longHorizontalBranches`, add `if (b.incomingLabel !== undefined)
  labels.west = b.incomingLabel;`). `walk-if-long-horizontal.ts`'s own
  west-label draw path needs NO change — it already exists and already
  draws whatever `GtileDiamondInside2.labelAt('west')` returns.

## XLANE — not attempted (338 ws, 8 named rows + 2 partial residuals)

Read the Java for all three sub-families; NOT a one-shape port — three
genuinely different connector classes, two of which have conditional
direction-flip branches this project's "never fit a value" / "read the
Java first" discipline says must be verified exhaustively, not
approximated under a tight remaining budget:

- `FtileIfWithLinks.java:149-174` `ConnectionHorizontalThenVertical
  #drawTranslate`: computes `originalDirection`/`newDirection` from
  `Direction.leftOrRight(p1,p2)` BEFORE and AFTER translation; when they
  DIFFER, draws an extra "small" detour snake first and reassigns `p1`
  to its last point before drawing the normal 3-point L
  (`p1 -> (p2.x,p1.y) -> p2`). `:238-286`
  `ConnectionVerticalThenHorizontal#drawTranslate` has an even larger
  branch: TWO full cases (`originalDirection == newDirection` vs not),
  each drawing a main snake AND a SEPARATE small arrowhead snake with
  different midpoint math. `swimlane-loop-translate-switch.ts`'s existing
  `routeSwitchHorizontalThenVertical`/`VerticalThenHorizontal` (built for
  `FtileSwitchWithManyLinks.java:297-404`) are NOT the same math —
  checked directly, not assumed: the switch family's `drawTranslate`
  never recomputes a direction flip against the untranslated positions,
  it just offsets by half the diamond's static width/height. Porting
  `FtileIfWithLinks`'s own shapes is new work, not a reuse of that
  seam.
- `FtileRepeat.java:432-459` (`ConnectionBackBackward1#drawSnake`,
  shared by `drawU`/`drawTranslate`) and `:513-535`
  (`ConnectionBackBackward2`): simpler — `drawTranslate` just translates
  each endpoint independently then runs the SAME 3-point-L assembly
  `drawU` uses. BUT the LEFT/RIGHT side choice
  (`x2 < diamondCenterX ? ... : ...`) is recomputed from the
  ALREADY-TRANSLATED coordinates in the Java, and the existing port's
  `walk-repeat-backward.ts#backward1Points`/`backward2Points` compute it
  from UNTRANSLATED lane-local coordinates — a naive post-hoc shift of
  the already-built 3 points would get the side decision wrong whenever
  lane deltas are large enough to flip it. `walk-repeat-backward.ts`'s
  own existing header doc already flags `drawTranslate` as unported and
  names the needed seam (`swimlane-loop-translate.ts`'s `LoopTranslate`
  union) — this task's write-set DOES cover that file (`swimlane-*`
  wildcard), so this is NOT a re-slot, just unattempted: it needs a new
  `LoopTranslate` variant carrying the untranslated diamond2/backward
  geometry (mirroring `WhileBackLoop`'s own shape) so the side decision
  can be redone post-shift, plus wiring in `walk-repeat-backward.ts`.
  Affects `delide-30-teva601`, `citire-32-mive114`, `xizola-97-sizu458`,
  `luxido-91-covi016`, `xidamu-85-xoti640`, `sadovu-51-fata536`.
- `FtileIfLongHorizontal`'s `ConnectionVerticalOut` (straight drop into
  an hline, cited for `jucidi-98-zato093`/`pezubu-98-niba240`) not read
  in depth this session.

Recommend a dedicated follow-up task sized to this family alone (D10's
"genuinely large AND separable" bar) rather than a rushed port risking
an unverified direction-logic mismatch.

## Anything not done and why

- N, O: re-slotted, write-set boundary (above).
- ELSEIFIN: capture done, rendering wire re-slotted (above) — a 3-line
  change in `conditional-builder.ts`, owned by T3h this wave.
- XLANE: not attempted — see above. This is the largest remaining
  family in the b2/b3 cohort (338 ws, 8 named rows) and the reason this
  task's Σ fall (−496) is smaller than PARX/M/SLURL alone might suggest
  was available; it needs its own task.
- `tiles/{gtile-while,gtile-repeat}.ts` (listed in this task's
  write-set) needed no edits — none of the landed fixes touched loop
  tile geometry.
- `list-backward-dispatch.ts`, `node-dispatch.ts` (write-set): no edits
  needed for the families actually landed.

## Quality gates

`npx tsc --noEmit` (both tsconfigs): clean. `npx eslint src/diagrams/
activity tests/diagrams/activity/layout/compress
tests/diagrams/activity/layout/tile-layout.test.ts
tests/unit/activity/if-dispatch-elseif-incoming.test.ts
tests/unit/activity/renderer-swimlanes.test.ts`: clean. Targeted vitest
(`tests/diagrams/activity`, `tests/unit/activity`,
`activity.golden.ratchet`, `activity.harness-parity`,
`activity.diff-baseline.ratchet`): 89 files, 1932 tests, all green.
206 pinned goldens byte-equal, harness-parity green, 0 risers at every
commit. No Serena MCP tools used (Read/Edit/Write/Bash only, per the
hard rule).
