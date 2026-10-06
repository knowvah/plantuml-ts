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
