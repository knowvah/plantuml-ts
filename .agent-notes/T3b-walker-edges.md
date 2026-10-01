## Observation: partition/group title never threaded onto the pushed node
- **Context**: T3b's assigned row caciva-80-kene990 ("partition title not
  threaded onto the composite node").
- **Finding**: `GtileGroup`/`GtilePartition` (`src/diagrams/activity/tiles/
  gtile-group.ts`, `gtile-partition.ts`) take `title: string` in their
  constructor and use it to compute `titleHeight`/`width`, but never store
  it as a field. `tile-coordinates.ts`'s `walkTile` `'gtile-group'`/
  `'gtile-partition'` case (T3b's own write-set) therefore has no way to
  read the title back when it pushes the node -- the resulting
  `ActivityNodeGeo` never gets a `label`, so the renderer draws the frame
  with no title text at all (caciva-80-kene990: golden has
  `<text y=56.889>foo</text>`, ours has nothing, plus a knock-on
  canvas-size difference since golden's title sits INSIDE the vertical
  space ours reserves differently).
- **Impact**: needs `readonly title: string` added to `GtileGroup` (and
  inherited by `GtilePartition`) -- outside T3b's write-set
  (`tile-coordinates.ts`, `edge-point-dedupe.ts`, `walk-fork-branches.ts`).
  Once that field exists, `tile-coordinates.ts`'s own push (mine) can set
  `node.label = t.title` in one line. Re-slotted, not forced.
- **Confidence**: High (read `gtile-group.ts` directly; constructor takes
  `title`, no field stores it).

## Observation: fivama-51-cusa142's divergence is draw-order, not hasPointOut
- **Context**: T3b's spec assigned fivama-51-cusa142 to the "gtile-top-down
  sibling edge lacks hasPointOut() gate" mechanism (T2b row 28). The actual
  Java read disproved this for fivama specifically.
- **Finding**: fivama's element list is byte-identical in COUNT and VALUE
  to the golden's (12 lines, 12 polygons, same coordinates) -- only draw
  ORDER differs (jar draws the if-exit edge before the start-edge; this
  port draws them the other way). `InstructionList#createFtile`
  (`InstructionList.java:140-160`) folds `Instruction`s pairwise via
  `factory.assembly(result, cur)`, producing a NESTED binary tree
  (`FtileAssemblySimple`/`FtileWithConnection`), not a flat n-ary list;
  `GtileTopDown`'s own `children: Tile[]` (this port's deliberate
  flattening) changes which connection is "outer" vs "inner" and therefore
  the draw order when a trailing `stop` is NOT absorbed as a
  `FtileIfDown.optionalStop` (fivama's else-branch is a NESTED if, not a
  lone stop/end, so `GtileIfDown`'s absorption doesn't apply here).
- **Impact**: the fix belongs to whatever decides the if-builder's
  structure/draw order (`conditional-builder.ts`, `walk-if-down.ts` --
  T3f's `conditional-builder.ts` is in-scope for that family, the others
  are not explicitly owned by any T3x family in the current overview.md).
  The `hasPointOut()` gate fix (T3b, landed) does NOT move this row; it
  only fixes rows where an edge is drawn that should not exist at all
  (piruxe, poraji), not rows where the existing edges are merely ordered
  differently.
- **Confidence**: High (read `FtileFactoryDelegatorAssembly.java`,
  `FtileAssemblySimple.java`, `FtileWithConnection.java`,
  `InstructionList.java`, `GtileAssembly.java`, `AbstractGtileRoot.java`
  end to end; confirmed element-for-element against the golden SVG).

## Observation: Snake-merge false positives require a mergeable flag this port doesn't have -- REVERTED
- **Context**: implementing `Snake#merge` (`Snake.java:303-327`) as a
  global post-process in `tile-coordinates.ts`/`edge-point-dedupe.ts`, for
  becaje-01-vaji284/bocaga-53-nale241/jecoxu-17-zama003.
- **Finding**: a full-history scan (checking a new edge against EVERY
  already-buffered one, matching `UGraphicForSnake#addPendingSnake`
  literally) produces false-positive merges wherever this port's geometry
  places two DIFFERENT, semantically-unrelated hook points at the exact
  same coordinate -- e.g. gitoke-38-beme495: a diamond's own entry point
  and an unrelated long horizontal merge-line both land on
  `(1872.44, 55)`, so the merge fused two unrelated edges into a bogus
  single polyline (score 355 -> 531 against the b2 baseline). Scoping the
  merge to only the single most-recently-pushed pending edge (not the
  jar's full history) avoided that specific false positive, but the FULL
  `tests/diagrams/activity` suite (not just the golden ratchet, which this
  task ran first and which stayed green) caught the same false-positive
  class recurring even adjacent-only: `GtileWhile`'s `ConnectionOut`
  builds two genuinely separate, non-touching Snakes in the jar
  (`Snake.java:138-142`), but this port's current geometry places their
  endpoints at the exact same coordinate too, so two passing, upstream-
  cited unit tests broke ("exactly two edges carry arrowhead: false",
  "emits exactly 3 edges (BackEmpty, Out, Out2), no ConnectionIn") --
  a real structural regression, not a weightedScore nuance. The jar avoids
  all of this via `MergeStrategy.NONE` on specific builder-constructed
  snakes (e.g. `FtileIfDown.java:512`'s absorbed-stop connector explicitly
  opts out) -- a per-edge flag this port's `ActivityEdgeGeo` has no field
  for, and the builders that would set it (`gtile-if-down.ts`,
  `conditional-builder.ts`, `gtile-while.ts`/`walk-while-branch.ts`) are
  outside every T3x family's write-set that currently exists.
- **Impact**: REVERTED (not landed). becaje/bocaga/jecoxu stay at their
  post-gate-fix scores (17/66/17). A faithful merge needs the `mergeable`
  flag threaded from the if/while/conditional builders FIRST, then a
  full-history (not adjacent-only) scan, as its own task.
- **Confidence**: High (measured full-history, adjacent-only, and
  adjacent-only-forward-only variants against the full 256-row baseline
  AND the full `tests/diagrams/activity` suite; the two false-positive
  pairs' exact coordinates were extracted via temporary instrumentation
  and diffed against each fixture's own golden SVG / failing assertion).

## Observation: note spike tip is correct but exposes a compression gap -- REVERTED
- **Context**: `ActivityNodeGeo.spikeTip` for cubida-55-meku256/norire-
  15-taka956/vimoxa-78-zucu656 ("note spike tip never computed").
- **Finding**: the formula (`FtileWithNoteOpale.java:76,177-191`:
  `suppSpace` = 20px past the note's near edge, vertically centred) is
  verified correct element-for-element against cubida's own golden path
  (spike tip at `118.156,71` = note `x=15 + width 83.156 + 20`,
  `y = 59.5 + 23/2`). Setting it makes `renderNote`'s dead Opale spike
  branch draw the pointed balloon shape instead of a flat edge -- but this
  CHANGES the note's effective rendered footprint (the spike now reaches
  20px further toward the annotated action), and
  `tests/diagrams/activity/layout/compress/invariant.test.ts` (stop 11,
  exercises `compress-geometry.ts` -- T3c's file) caught a NEW hard
  polygon overlap on rucuga-83-tosu408: compression has no reservation for
  the spike's reach, so a layout that left clear room for the previously-
  flat note edge no longer does once the spike is actually drawn. Isolated
  by toggling the gate fix and the spike fix independently against the
  invariant test: the gate fix alone passes it, the spike fix alone
  reproduces the failure.
- **Impact**: REVERTED (not landed). cubida/norire/vimoxa stay at their b2
  scores (80/85/82, unchanged). The real fix needs `compress-geometry.ts`
  (T3c) to reserve space for a note's spike reach BEFORE the spike is
  drawn -- outside T3b's write-set. The formula itself (`noteSpikeTip` in
  this commit's history) is ready to re-land once that reservation exists.
- **Confidence**: High (toggled each fix independently against the
  invariant test; confirmed causation, not correlation).

## Observation: repeat/while back-edges are still pushed as separate segments
- **Context**: discovered while measuring the (since-reverted) adjacent-
  only Snake-merge -- every one of the 19 small risers (max +25) it left
  was a `repeat`/`while` fixture.
- **Finding**: `walk-repeat.ts`/`walk-while-branch.ts` (outside T3b's
  write-set) push the loop's back-edge as several separate `pushEdge`
  calls instead of one multi-point edge; an adjacent-only edge-merge
  sometimes fuses a PREFIX of that chain (when two pieces are pushed
  back-to-back) but can't complete it when an intervening push breaks
  adjacency, leaving a partial-merge state that scores slightly worse
  under `compareSvg`'s positional pairing than the fully-unmerged prior
  state.
- **Impact**: not actionable until the Snake-merge mechanism itself is
  re-landed (see the observation above) with the real `mergeable` flag;
  recorded here so the next attempt doesn't have to re-derive it.
- **Confidence**: High (grepped every riser's `.puml` for `repeat`/`while`
  -- 19/19 matched).
