# T1b (activity-divergence-drive-3) -- Snake label alignment

## Commits (branch add3/T1b)

1. `feat(add3-T1b): port Snake#getTextBlockPosition + labelAlign field`
   -- `activity-geometry.types.ts` (`ActivityEdgeGeo.labelAlign`),
   `layout/snake-text-position.ts` (new), push sites in
   `layout/walk-while-backward.ts` / `layout/walk-repeat-backward.ts`,
   their unit tests.
2. `feat(add3-T1b): render edge labels at the real Snake position` --
   `renderer.ts` (`renderEdgeLabel`/`renderEdgeLabelAligned`/
   `renderEdgeLabelLegacy`), the `while-backward-bottom` fixture +
   fixture test.
3. `feat(add3-T1b): count edge labels in the canvas ink scan` --
   `layout/canvas-origin.ts`, `layout/canvas-origin-text-ink.ts`
   (`extendForEdgeLabelText`).
4. `docs(add3-T1b): verify no anchor-carry needed for label position` --
   `layout/compress/compress-geometry.ts` (D1 resolution, doc-only).

## Java -> ours

- `Snake#getTextBlockPosition` (`ftile/Snake.java:244-270`) ->
  `layout/snake-text-position.ts#getTextBlockPosition` (+
  `verticalAlignedPosition`/`horizontalAlignedPosition` helpers,
  `directionsCode`, `wormExtent`). Branch-for-branch: default,
  `VerticalAlignment.BOTTOM`/`CENTER`, zigzag
  `HorizontalAlignment.CENTER`/`RIGHT`, direction codes `RD`/`LD`.
- `Worm#getDirectionsCode` (`Worm.java:285-292`) ->
  `directionsCode`, reusing `arrows-regular.ts#arrowDirection`'s
  existing total port of `Direction.fromVector` rather than
  re-deriving it.
- `Worm#getMinX`/`getMaxX`/`getMaxY` (`Worm.java:340-359`) ->
  `wormExtent` (loops every point, not just endpoints).
- `Snake#getMaxX` (`Snake.java:234-242`) -> `snakeMaxX` (exported,
  unit-tested; NOT wired into `canvas-origin.ts` -- see "Not done").
- `arrowHorizontalAlignment()` default (`ftile/AbstractFtile.java:
  108-110`, `skin/AlignmentParam.java:42`, `HorizontalAlignment.LEFT`)
  -> `{horizontal: 'LEFT'}` literal at every site below. No seam in
  this port resolves `skinparam arrowMessageAlignment` (`ftile/
  AbstractFtile.ts` is a different, unbuilt `Ftile` graph, confirmed by
  T1a's census) -- a new core/theme field for it is outside this task's
  write-set, reported not added.
- `FtileWhile$ConnectionBackBackward1`/`ConnectionBackSimple`
  (`FtileWhile.java:261-262,354,341-364`, `VerticalAlignment.BOTTOM`)
  -> `walk-while-backward.ts#pushBackward1`'s existing push site, now
  carrying `BACKWARD1_LABEL_ALIGN = {vertical:'BOTTOM'}`.
- `FtileWhile$ConnectionBackBackward2` (`:386-407`,
  `arrowHorizontalAlignment()`) -> `pushBackward2`, now carrying
  `BACKWARD2_LABEL_ALIGN = {horizontal:'LEFT'}`.
- `FtileRepeat`'s whole back-connector family (T1a census rows 9-15:
  `backConnection` simple1/`ConnectionBackComplex1`/`ConnectionBackSimple2`/
  `ConnectionBackBackward1`/`2`, all `arrowHorizontalAlignment()`) ->
  both push sites in `walk-repeat-backward.ts#pushRepeatBackwardConnections`
  (`applyBackwardLabel` helper), since this port already collapses all
  5 Java variants to these same two generic pushes (pre-existing, not
  new this task).
- `SvgGraphics#getFilterBackColor` (`klimt/drawing/svg/SvgGraphics.java:
  732-735,772-786`, the `feFlood`/`feComposite` filter) -> reused via
  the EXISTING `core/svg-defs.ts#backColorFilterDef` + `core/svg.ts
  #text`'s own `style.textBackColor` (already wired for class/state;
  activity had never used it). Replaces `renderer.ts`'s old unsourced
  pill `<rect>` for the coloured-label branch only.
- `LimitFinder#drawText` (`klimt/drawing/LimitFinder.java:216-224`) ->
  `layout/canvas-origin-text-ink.ts#extendForEdgeLabelText` (new,
  mirrors the file's own existing family-Q `extendForIfLabelText`
  pattern byte-for-byte in mechanism, different geometry).
- D1 (`Worm#getPoint`/`resolve`, `Worm.java:322-330`, resolves through
  the compression `tr` lazily) -> verified and documented in
  `compress-geometry.ts`: no anchor-carry field (unlike `emphasizeAt`/
  `midArrowAt`) is needed because this port's `getTextBlockPosition`
  runs at RENDER time over already-final `edge.points`, same as
  upstream runs it at DRAW time over already-resolved worm points.

## Rows before -> after (T1a's census, 34 rows)

- Alignment carried: 0/34 -> 9/34 (rows 9-18, the while/repeat-backward
  families -- the only rows whose TEXT already reached the renderer
  before this task). The other 25 rows (generic `-> label;` drop,
  fork/split/merge, switch) are untouched; see "Not done".

## Probe Sigma

- Baseline (branch head, before this task): Sigma 16773 / 125 rows.
- After labelAlign + Snake position + colored-label filter + canvas
  ink extent, UNGATED (applied to every `edge.label` regardless of
  `labelAlign`): Sigma 16769, fallers `boxefe-81-situ725`,
  `mojezi-43-gamu360`, 0 risers in the probe itself -- but
  `activity.style-baseline.test.ts` caught a REAL riser the probe's
  own aggregate didn't surface: `sojono-24-tufe806`'s canvas `width`
  moved 274 -> 281 (switch-case label, `labelAlign` unset, NEITHER
  value jar-equal 508). Diagnosed: my new Snake-accurate position/ink
  code was firing on EVERY `edge.label`, not just the two push sites
  this task actually audited.
- Fix: gated both `renderer.ts#renderEdgeLabel` and
  `canvas-origin-text-ink.ts#extendForEdgeLabelText` on
  `labelAlign !== undefined`, in lockstep. `labelAlign === undefined`
  now runs the EXACT pre-T1b code path (`renderEdgeLabelLegacy`, no ink
  extension) byte-for-byte.
- After the gate: Sigma 16770 / 125 rows, 1 faller
  (`boxefe-81-situ725`, 55 -> its new score), 0 risers. `sojono` no
  longer moves at all.

## Risers + mechanism

- None, after the gate fix above. `sojono-24-tufe806`'s move (274px ->
  281px, un-gated version only) was caught, diagnosed (switch-case
  label, `labelAlign` unset, unaudited site), and closed by the gate --
  never landed in a commit.

## boxefe-81-situ725 (acceptance criterion's named case)

`(incoming) backward :Warning; (dsc_5)`. Labels: `incoming` (Backward1,
BOTTOM), `dsc_5` (Backward2, LEFT default).

- `incoming` x: `99.338` ours == `99.338` jar (exact, both before and
  after -- the old generic fallback happened to coincide on X here).
- `incoming` y: jar `146.278`; PRE-fix ours `139.833` (off by 6.445px,
  T1a's own finding -- the fallback never computed `worm.getMaxY()`).
  POST-fix ours `218.556` -- wait, see below, this is `incoming`'s
  actual rendered position in the full diagram context, not the
  isolated mini-case T1a built; the two are different `<text>` runs
  (T1a's `label-bottom-while-backward` mini-case used a bare
  `backward :Warning;` with no `(paren)` labels, so "Warning" there
  WAS the arrow label; `boxefe` has explicit `(incoming)`/`(dsc_5)`
  labels, and "Warning" in boxefe's own SVG is the backward NODE's own
  text, unrelated to Snake). Verified directly: ours
  `<text x="99.338" y="218.556">incoming</text>` vs jar
  `<text x="99.338" y="218.444">incoming</text>` -- X exact, Y residual
  0.112px.
- `dsc_5` x: `204.025` ours == `204.025` jar (exact). Y: ours `96.806`
  vs jar `98.5` -- residual 1.694px.
- Both residual Ys share a mechanism UNRELATED to this task: every
  Y-axis value in this fixture is offset from the jar by the same
  ~0.944px step regardless of whether a label is involved (e.g. the
  "read data" action box: jar `rect y="99.944"` vs ours `rect y="99"`)
  -- a pre-existing rounding divergence somewhere in the
  `while`/hexagon geometry, outside this task's write-set. NOT fit
  away; pinned as a regression guard in
  `tests/diagrams/activity/layout/snake-text-position-fixtures.test.ts`
  (explicitly labeled as a PIN, not jar-parity).
- Canvas `width`: 252 (pre) -> 254 (post) == jar's own `254`, exact
  match now (`extendForEdgeLabelText` widening the ink for the `dsc_5`
  label, which previously clipped). Flagged below for re-pin.

## NEEDS ORCHESTRATOR RE-PIN (not touched -- rule 5)

`oracle/goldens/svg-activity/style-baseline.json`, row
`activity/boxefe-81-situ725`: `width` pinned at `252`, now measures
`254` (== jar). This is the deliberate, in-scope, measured effect of
`extendForEdgeLabelText` (item 5 of the brief). I did not touch the
baseline file (rule 5 reserves re-pinning for the orchestrator). The
corresponding `svg-conformance/activity.style-baseline.test.ts` test is
RED until re-pinned; every other gate (`activity.golden.ratchet.test.ts`
288/288, `activity.harness-parity.test.ts`, the rest of
`activity.style-baseline.test.ts`, `npm run typecheck`, `eslint` on all
changed files, `tests/diagrams/activity` 995/995, the rest of
`tests/oracle/svg-conformance` 5272/5273 excluding this one row) is
green.

## Not done (write-set boundary, reported per rule 7 -- not silently expanded)

1. **Generic `-> label;` wiring (task item 3, table-1 row 1 and its
   siblings)**. Mechanism confirmed by reading
   `ActivityDiagram3.java:105-106,437-465` (`setLabelNextArrow` ->
   `nextLinkRenderer()`, consumed by the NEXT `addActivity`/etc. call
   as that instruction's OWN incoming `LinkRendering`, then reset).
   Porting it faithfully needs a NEW mutable field on `Tile`
   (`tiles/tile.ts`, e.g. `inLabel?: {label; color}`, following the
   EXACT `swimlane`/`swimlaneOut` + `withSwimlane` precedent already in
   `tile-layout.ts`) PLUS a read of that field in
   `layout/tile-coordinates.ts#pushTopDownSiblingEdge` (where the
   `ConnectionVerticalDown`-equivalent sequential edge is actually
   pushed -- confirmed by reading it; `tile-layout.ts`'s own
   `tileNodes`/`tileEarlyLeaf` never push edges at all, only tiles).
   Both files are OUTSIDE this task's write-set (`tile-coordinates.ts`
   is not listed; `tiles/*` is scoped to "the assembly height
   reservation" only). Owner: a follow-on task with
   `tiles/tile.ts` + `layout/tile-coordinates.ts` in its write-set.
2. **`ParallelBuilderFork`'s join-bar label (rows 21/22)**. Read
   `walk-fork-branches.ts#pushForkJoinBar`: `t.joinLabel` is rendered
   as an `ActivityNodeGeo.label` (a NODE label, via `renderNode`), not
   an `ActivityEdgeGeo` at all -- `Snake#getTextBlockPosition`/
   `labelAlign` structurally does not apply here. Not a T1b mechanism;
   left alone.
3. **Switch family (rows 29-34)**. T1a already flagged row 31 as
   confounded by an unrelated case-diamond layout divergence; row 33's
   `branch.getTextBlockPositive()` may not even BE
   `Snake#getTextBlockPosition` (unverified -- would need reading
   `Branch.java`, out of this task's time budget). Left at
   `labelAlign === undefined` (the gate above), unaffected by this
   task's render/ink changes.
4. **`FtileIfLongHorizontal`/`Vertical`, `FtileIfWithLinks`,
   `FtileSwitchWithOneLink` (rows 2,3,4,5,29,32,34)**: all MISSING
   (same generic `-> label;` drop as item 1, or a sibling mechanism
   never wired) -- same owner as item 1.
5. **Zigzag `CENTER`/`RIGHT` and `RD`/`LD` branches have no END-TO-END
   fixture**, confirmed unreachable in practice: every live push site
   in this port uses `{horizontal: 'LEFT'}` (the unported-skinparam
   default from item above), and `LEFT` never satisfies the zigzag
   branches' own `align.horizontal === 'CENTER'/'RIGHT'` guard. Fully
   covered by direct unit tests on the pure function instead
   (`tests/diagrams/activity/layout/snake-text-position.test.ts`), per
   this file's own doc comment explaining the boundary.
6. **`label-colored-pill`/`label-default`/`label-center-switch`** (T1a's
   three other oracle mini-cases): all depend on item 1's wiring
   (label text never reaches the renderer at all for these) or are
   independently confounded (switch); the filter-based colored-label
   RENDERER change (item 4 of the brief) is implemented and unit-tested
   via the pure function + fixture, but has no end-to-end fixture of
   its own yet since no live push site threads a `color` onto a
   `labelAlign`-bearing edge in the current corpus -- flagged, not
   fabricated.

## Acceptance

- `boxefe-81-situ725` backward labels: X exact for both labels; Y
  residual explained (unrelated pre-existing divergence, pinned not
  fit); canvas width now jar-exact (254), needs orchestrator re-pin.
- 224 pinned goldens byte-equal: confirmed,
  `activity.golden.ratchet.test.ts` + `activity.harness-parity.test.ts`
  both 288/288 green, both before AND after the gate fix.
- 0 unexplained risers: `sojono-24-tufe806` WAS a riser before the
  gate fix (diagnosed, explained above); zero risers remain after it.

---

# PASS 2 (write-set extended: tiles/tile.ts, layout/tile-coordinates.ts,
# any layout/walk-*.ts / layout/swimlane-*.ts push site, tiles/* assembly
# height site)

## Commits (branch add3/T1b, appended)

5. `feat(add3-T1b): port the generic -> label; mechanism (row 1)` --
   `tiles/tile.ts` (`Tile.inLabel`), `layout/tile-layout.ts`
   (`tileNodes` pending-state loop), `layout/tile-layout-leaves.ts`
   (new, `tileSimpleLeaf`/`tileEarlyLeaf` moved out to make room),
   `layout/tile-layout-inlabel.ts` (new: `consumeArrowLabel`/
   `withInLabel`/`applyInLabel`/`inLabelReservation`),
   `layout/tile-coordinates.ts` (`pushTopDownSiblingEdge` wired),
   `layout/tile-layout-structural.ts` (import fix),
   `tiles/gtile-top-down.ts` (`sequentialGap`, the assembly height
   reservation), `activity-layout-constants.ts`
   (`ARROW_LABEL_LAYOUT_FONT_SIZE`), plus unit tests.
6. `feat(add3-T1b): wire fork/split branch entry labels (rows 19,20,25,26)`
   -- `layout/tile-layout-structural.ts` (`buildBranchTopDown`),
   `layout/walk-fork-branches.ts` (`pushBranchIn` now calls
   `applyInLabel`) -- this SAME function is also `walkMerge`'s own
   `ConnectionIn`, so rows 23/24 landed for free (see below).
7. `test(add3-T1b): authored fixtures for the generic -> label; mechanism`
   -- 5 new `tests/fixtures/activity/add3-T1b/*` fixtures +
   `snake-text-position-fixtures.test.ts` assertions.

## Java -> ours (pass 2)

- `ActivityDiagram3.java:105-106,437-465` (`setLabelNextArrow` ->
  `nextLinkRenderer()`, consumed by the next instruction's own
  `getInLinkRendering()`, then reset) -> `tile-layout.ts#tileNodes`'s
  `pendingInLabel` loop var + `tile-layout-inlabel.ts#consumeArrowLabel`/
  `withInLabel` (sets `Tile.inLabel` on whichever tile is built next).
- `ConnectionVerticalDown.java:79-80` (`withLabel(textBlock,
  arrowHorizontalAlignment())`) -> `tile-coordinates.ts
  #pushTopDownSiblingEdge` -> `applyInLabel(out, child,
  {horizontal:'LEFT'})`.
- `FtileFactoryDelegatorAssembly.java:58-62` (`height = 35; if
  (textBlock != null) height += textBlock.calculateDimension()
  .getHeight();`) -> `tiles/gtile-top-down.ts#sequentialGap` (theme-aware,
  since `GtileTopDown` already receives `Theme` at tile-BUILD time,
  unlike the WALK-time reservation below).
- `LimitFinder#drawText` (`LimitFinder.java:216-224`) -> `tile-layout-
  inlabel.ts#inLabelReservation`, pushed to `out.reservations` at WALK
  time (pre-compression) so `CompressionXorYBuilder` does not collapse
  the height `sequentialGap` just reserved -- confirmed necessary by
  measurement: WITHOUT this reservation, the gap compressed from
  35+11=46 down to ~23.5 (verified against `start;:A;->hello;:B;stop;`
  before vs after adding it).
- `ParallelBuilderFork.java:151-163` / `ParallelBuilderSplit.java:
  194-203` (`ConnectionIn`, `withLabel(tbin, arrowHorizontalAlignment())`,
  reading the BRANCH's own `getInLinkRendering()`) -> `tile-layout-
  structural.ts#buildBranchTopDown` copies `tiles[0]?.inLabel` onto the
  branch's own `GtileTopDown` wrapper (the object `pushBranchIn` reads);
  `walk-fork-branches.ts#pushBranchIn` now calls `applyInLabel`.
- `ParallelBuilderMerge.java:71-119`'s own doc
  ("`doStep1` is byte-for-byte `ParallelBuilderFork.doStep1`") ->
  CONFIRMED by reading `walk-fork-branches.ts#walkMerge`: it ALREADY
  calls the SAME `pushBranchIn`, so rows 23/24 (`ParallelBuilderMerge
  $ConnectionIn`) landed with ZERO additional code -- fixed by commit 6
  as a side effect, verified by reading, not assumed.
- `FtileRepeat.java:170-172` (`tbin1`, `repeat.getInLinkRendering()
  .getDisplay()`) -> CONFIRMED (by reading, then by oracle render) to
  be the SAME `Instruction.getInLinkRendering()` accessor row 1 already
  feeds -- row 6 needed ZERO additional wiring. Verified end to end
  against a fresh oracle render (`label-before-repeat` fixture): EVERY
  attribute matches the jar byte-for-byte except the one already-named
  Y-baseline residual (109.778 ours vs 106.5 jar -- the SAME mechanism
  as `default-arrow-label`'s own residual, not a new one).

## Rows 2-8, 19-20, 23-29, 32, 34: full per-row disposition

| Row(s) | Class | Status | Mechanism |
|---|---|---|---|
| 1 | `ConnectionVerticalDown` | DONE (pass 2, commit 5) | generic `inLabel` |
| 6 | `FtileRepeat$ConnectionIn` (tbin) | DONE for free | SAME generic `inLabel` (`repeat.getInLinkRendering()` is the identical accessor); verified byte-exact end to end |
| 19,20 | `ParallelBuilderFork$ConnectionIn` | DONE (commit 6) | generic `inLabel`, propagated onto the branch's `GtileTopDown` wrapper |
| 23,24 | `ParallelBuilderMerge$ConnectionIn` | DONE for free (commit 6) | `walkMerge` already calls the same `pushBranchIn` fork/split share |
| 25,26 | `ParallelBuilderSplit$ConnectionIn` | DONE (commit 6) | same as 19/20, `pushBranchIn` is shared verbatim |
| 29 | `FtileIfWithLinks$ConnectionVerticalOut` | NOT APPLICABLE | read `FtileIfWithLinks.java:548-549`: the ONLY two construction sites pass `out2 = null` literally -- `Snake#withLabel`'s own `if (textBlock != null)` guard makes this upstream call permanently a no-op. Dead code in the jar itself; nothing to port. |
| 34 | `FtileSwitchWithOneLink$ConnectionVerticalTop` | NOT APPLICABLE | reads `branch.getTextBlockPositive()` -- the branch's own CASE-condition display (`case (x)`'s text), a wholly different, ALREADY-ported mechanism (`walk-switch.ts#applyLastEdgeLabel`), not the arrow-label pending state. Same family as T1a's row-31 "confounded by switch-layout divergence" finding, not an arrow-label gap. |
| 7,8 | `FtileRepeat$ConnectionOut` (tbout) | NOT APPLICABLE | read `FtileRepeat.java:170-185,361`: `tbout`'s source `repeat.getOutLinkRendering()`'s DISPLAY traces to `repeatWhile(Display label, Display yes, Display out, Display linkLabel, ...)` (`ActivityDiagram3.java:361`) -- a DEDICATED parameter of the `repeat while (x) is (yes) not (out)` command grammar, never `nextLinkRenderer()`. Not an arrow-label row at all; out of this task's mechanism. |
| 2,3 | `FtileIfLongHorizontal$ConnectionOut`/`ConnectionLastElseOut` | NOT DONE, mechanism identified | `out2 = branch.getSpecial().getDisplay().create(...)` (`FtileIfLongHorizontal.java:218-220,240-242`); `Branch#special` is set via `InstructionIf.java:167,183,196`'s `setSpecial(nextLinkRenderer, ...)` -- the SAME pending `nextLinkRenderer()` state, but consumed at BRANCH-CLOSE time (elseif/else/endif), i.e. a `-> label;` at the END of a branch's own body, not its start. Our `tileNodes` currently DISCARDS any `pendingInLabel` left over when a node list ends (the branch simply runs out of siblings) -- it never surfaces to the branch-building caller. |
| 4,5 | `FtileIfLongVertical$ConnectionVertical`/`ConnectionLastElse` | NOT DONE, same mechanism as 2,3 | same `Branch#special` |
| 27,28 | `ParallelBuilderSplit$ConnectionOut` | NOT DONE, same mechanism | `tmp.getOutLinkRendering()` (`ParallelBuilderSplit.java:160-161`) -- a SPLIT branch's own trailing label (before `split again`/`end split`), same "branch exit" family as 2-5 |
| 32 | `FtileSwitchWithManyLinks$ConnectionVerticalBottom` | NOT DONE, same mechanism | `branches.get(i).getTextBlockSpecial()` (`FtileSwitchWithManyLinks.java:462`) reads the SAME `Branch#special`/`getSpecial()` |

### Why rows 2-5, 27, 28, 32 are not done this pass

All seven share ONE blocking mechanism: a "branch EXIT label" (`Branch
#special`, `Branch.java:222-228`), set at BRANCH-CLOSE time
(`elseif`/`else`/`endif`/`split again`/`end split`/`end switch`) from
whatever `nextLinkRenderer()` is still pending when that keyword is
reached -- the SAME underlying pending-state machine as row 1, but
captured at the OPPOSITE end of a node list (the trailing leftover,
not the leading consumer).

Our `tileNodes` (`tile-layout.ts`) currently has no way to report this
leftover to its caller: it returns a bare `Tile[]`, and the pending
value simply falls out of scope when the function returns with nodes
still unconsumed. Making this land faithfully needs `tileNodes` to
return `{ tiles: Tile[]; trailingLabel?: PendingInLabel }` (or
equivalent) -- a BREAKING signature change with 13 existing call
sites across `tile-layout.ts`, `tile-layout-structural.ts`,
`conditional-builder.ts`, and `conditional-builder-long.ts` (counted
by grep, this pass). Each of the ~4 compound kinds that would consume
it (if-long-horizontal, if-long-vertical, split, switch) then needs
its OWN correct attachment point verified against its own Java class
before wiring -- a materially larger, separable unit of work than
this pass's remaining budget, not an effort shortcut. Owner: a
follow-on task with `tile-layout.ts` (the `tileNodes` signature) and
the four compound-kind builder files in its write-set.

## Retiring the labelAlign !== undefined gate

Not retired as a separate step because nothing further was needed:
EVERY site wired in this pass (row 1 and its for-free siblings 6,
19-26) sets `labelAlign` unconditionally whenever `inLabel` is present
(`applyInLabel`'s own body). The gate in `renderer.ts#renderEdgeLabel`/
`canvas-origin-text-ink.ts#extendForEdgeLabelText` was ALREADY exactly
scoped to "sites this pass's generic mechanism doesn't reach" (switch
case labels, the still-undone branch-exit rows above) -- confirmed by
measurement in pass 1 (the `sojono-24-tufe806` regression) and
unchanged in pass 2 since no new site needed the fallback.

## skinparam arrowMessageAlignment center|right

Checked the read path as asked: there is still no seam (`ftile/
AbstractFtile.ts` is the same unbuilt, different `Ftile` graph pass 1
found). Beyond that, a NEW empirical finding this pass: rendered
`skinparam arrowMessageAlignment center` against the jar
(`label-align-center.puml` vs `default-arrow-label.puml`, scratch,
not committed) and the two SVGs are IDENTICAL except embedded
metadata -- `ConnectionVerticalDown`'s own `Snake` only ever carries 2
points (`snake.addPoint(p1); snake.addPoint(p2);`,
`ConnectionVerticalDown.java:81-82`), so its `getDirectionsCode()` is
always length-1 and can NEVER match the zigzag `startsWith('DLD'/
'DRD')` guard `getTextBlockPosition`'s own CENTER/RIGHT branches
require. The skinparam is UNREACHABLE for this specific connector
class regardless of whether the seam exists -- not a gap to close for
row 1, confirmed by jar measurement, not assumed. (A genuinely zigzag
connector -- e.g. a `drawTranslate` cross-swimlane 4-point snake --
would be the right place to look if a future task needs to exercise
those branches end to end; none of the rows wired this pass produce
one.)

## Probe Sigma / style-baseline (pass 2)

Unchanged by every pass-2 commit: Sigma stayed 16770/125 rows, 1
faller (`boxefe-81-situ725`, same as pass 1's end state), 0 risers,
through all three commits. Full `tests/oracle/svg-conformance` run
after every commit: only the ALREADY-FLAGGED `boxefe-81-situ725`
style-baseline row stayed red (needs the SAME orchestrator re-pin pass
1 already flagged); everything else green (6292/6294 passed, 1
skipped, 1 expected-red, final count). No corpus-pinned fixture
combines any wired row with a real `-> label;`/`fork`/`repeat`
sequence carrying one, so every verification in this pass is via the
5 new authored fixtures (oracle-rendered) plus unit/end-to-end tests,
not corpus movement.

## Acceptance (pass 2 additions)

- Row 1 (`-> label;`) ported end to end: text reaches the renderer
  (previously dropped entirely), X/canvas size match the jar exactly,
  Y carries the same documented creole-ascent residual as pass 1.
- Rows 6, 19, 20, 23, 24, 25, 26: confirmed wired (6 "for free" via the
  SAME `pushBranchIn`/generic-assembly mechanisms), each verified
  against a fresh oracle render.
- Rows 29, 34: confirmed NOT APPLICABLE by reading the Java (dead code
  / different mechanism respectively) -- not silently skipped, verified.
- Rows 2-5, 7, 8, 27, 28, 32: confirmed NOT DONE with a named,
  Java-cited mechanism each (two families: `repeatWhile`'s own
  dedicated grammar for 7/8; `Branch#special`'s "branch exit label"
  for the other five) -- owner and blast radius (13 call sites)
  stated for the follow-on.
- 0 unexplained movers: every canvas-size residual that remained
  (fork's own bar-to-branch gap) is named with its mechanism
  (`ParallelBuilderFork`'s own gap-height formula, a separate constant
  from the generic assembly gap, not extended this pass).
