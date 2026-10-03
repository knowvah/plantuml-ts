## Observation: measurement must see the UNLANED edge, not the expanded per-lane ones
- **Context**: T1p-g (mission `activity-divergence-drive-2`, batch 1p),
  porting `FtileIfWithLinks`/`FtileIfLongHorizontal`'s swimlane-aware
  `ConnectionHline#getMinmax`. First implementation pre-expanded the
  HLINE edge into N per-lane edges BEFORE calling `placeSwimlanes`,
  so `measureLanes`'s `sameLaneEdges` folding saw the WIDE,
  full-tile-width boundary term (`payload.low`/`high`) as if it were
  real lane content, inflating that lane's measured width.
- **Finding**: `jucidi-98-zato093` regressed 169 -> 213 (not just a
  small residual, a 44-point jump) with a lane's rect visibly shifted
  +24px. Root cause, confirmed by reading
  `Swimlanes#computeDrawingWidths` (`Swimlanes.java:378-395`): the
  width-measurement pass wraps each lane in a `UGraphicForSnake`, NOT
  a `UGraphicInterceptorOneSwimlane` -- so `ConnectionHline#drawU`'s
  own `ug instanceof UGraphicInterceptorOneSwimlane` check is FALSE
  during measurement, and it always takes the `getMinmaxSimple`
  branch there, regardless of lane. Measurement and the real draw
  pass use TWO DIFFERENT extents for the exact same connector.
- **Fix**: dispatch the per-lane expansion from INSIDE
  `swimlane-placement.ts#routeEdge` (a new `EdgeMeta.hline` field,
  mirroring the existing `EdgeMeta.loop` seam) rather than pre-
  expanding before `placeSwimlanes` runs. `measureLanes` executes
  strictly before `routeEdge`, so it only ever sees the walker's own
  UNCHANGED unlaned edge (tagged `myLane`/`myLane`, pointing at the
  `getMinmaxSimple` extent) -- byte-identical to pre-T1p-g.
- **Impact**: any future "one Connection object redrawn once per lane
  pass" port must check whether upstream's MEASUREMENT pass uses a
  DIFFERENT UGraphic type than the real draw pass before assuming the
  same per-lane logic applies to both -- it very often does not.
- **Confidence**: High (read `Swimlanes.java` directly, reproduced the
  regression, reproduced the fix with the probe before/after).

## Observation: a routed edge's own lane tag matters for edge-draw-order, not just its geometry
- **Context**: same task, second fix pass. After the measurement fix
  above, `jucidi` still regressed 169 -> 213 initially (then settled
  to 176 after this fix). `placeSwimlanes`'s final `edgeMeta` output
  used `repeatEdgeMeta(edgeMeta[i], r.edges.length)`, repeating the
  ORIGINAL (pre-expansion) `myLane`/`myLane` tag across every expanded
  edge.
- **Finding**: `edge-draw-order.ts#passOf` groups edges by `lane1 ??
  lane2` to mirror upstream's per-lane redraw SEQUENCE
  (`Swimlanes.java:328-347`: one lane at a time, in lane order). Every
  expanded HLINE edge sharing the stale `myLane` tag puts BOTH
  segments in the SAME pass-group instead of each in its own lane's
  pass, which is observably wrong relative to upstream's real draw
  order.
- **Fix**: `swimlane-hline.ts#routeHline` now returns its own
  per-edge `edgeMeta` (`{lane1: lane, lane2: lane, shape: 'default'}`,
  one per output edge, each tagged with the LANE THAT EDGE IS ACTUALLY
  IN) via a new optional `RoutedEdge.edgeMeta` field; `placeSwimlanes`
  uses it when present, falling back to `repeatEdgeMeta` for every
  other (non-fan-out) routing case.
- **Impact**: cut the jucidi regression roughly in half (213 -> 176);
  any future N-edges-from-one-`EdgeMeta` expansion (D3's own extension
  point) should default to re-deriving each output edge's OWN
  lane tag rather than repeating the input tag, unless the N outputs
  are genuinely still "the same lane pair" (true for
  `routeLoopTranslate`, false here).
- **Confidence**: High (measured before/after with the probe, cross-
  checked the pass-grouping mechanism by reading `edge-draw-order.ts`'s
  own doc comment and `Swimlanes.java:328-352`).

## Observation: pre-existing geometry divergence is exposed, not caused, by the per-lane split
- **Context**: same task, final state. `pezubu-98-niba240` (3 lanes,
  `FtileIfWithLinks`) and `jucidi-98-zato093` (2 lanes,
  `FtileIfLongHorizontal`) both still regress after both fixes above
  (57 -> 64, 169 -> 176).
- **Finding**: `pezubu`'s own `t.width`/`out1X`/`out2X` happen to
  satisfy `t.width === out1X + out2X` almost exactly, making both
  per-lane local ranges exactly `out2X`-wide and nearly coincide after
  shifting -- the jar's own two segments have VISIBLY DIFFERENT widths
  (83 vs 49.35 px), so this symmetry is specific to our port's own
  (pre-existing, out-of-scope) branch-width computation, not a defect
  in the ported mechanism. `jucidi`'s own `hlineOutXs`/`hlineCandidates`
  (pre-existing, UNCHANGED code) use `coupleX + coupleLeft` for a
  branch's own out-x, which is ~35px off from that SAME branch's
  `connectionVerticalOut`-drawn vertical line (`tileX +
  tile.getCoord(SOUTH_HOOK).x`) -- a pre-existing coordinate-reference
  mismatch that a single averaged unlaned line happened to hide, and
  that visibly misaligns once the HLINE splits into lane-local
  segments that are supposed to meet the vertical drops exactly.
- **Impact**: do NOT chase either fixture's own width/out-x formula to
  "fix" this ws rise -- both are documented, out-of-scope, pre-existing
  divergences (CLAUDE.md: never fit a value to shrink a number). A
  future width-fidelity pass on `gtile-if-with-links.ts`'s own
  out1X/out2X/width relationship, or on `gtile-if-long-horizontal.ts`'s
  `coupleX`/`coupleLeft` vs. its own `tileX`+`SOUTH_HOOK` convention,
  could close this gap without touching this task's `getMinmax` port.
- **Confidence**: High (hand-verified the Java formula against three
  independent sources -- source read, oracle SVG's own two overlapping
  segments, and this port's own `routeHline` debug trace -- all three
  agree on the MECHANISM; only the port's own pre-existing input
  numbers differ from the jar's).

## Observation: compression makes pass-1/placement numbers unverifiable by hand against a rendered SVG
- **Context**: same task, mid-diagnosis. Tried to hand-verify
  `routeHline`'s computed `[minX, maxX]` + delta against the ACTUAL
  rendered line coordinates in our own output SVG for `jucidi` and
  got numbers that did not match at all (off by 15-20px, non-uniformly).
- **Finding**: `assignCoordinatesFull`'s default `compress: true` path
  runs `compressGeometry` AFTER `placeSwimlanes`, shifting different
  x-ranges by different amounts to remove empty space -- so
  `routeHline`'s own pre-compression output is NOT directly comparable
  to the final rendered SVG's coordinates.
- **Impact**: when hand-verifying a layout mechanism against a
  rendered SVG, either disable compression (`compress: false`, where
  the pipeline supports it) or verify at the EARLIEST post-mechanism
  stage reachable (here: a dedicated debug print inside `routeHline`
  itself), never by reverse-engineering from the fully-compressed
  final SVG.
- **Confidence**: High (confirmed `compress: true` default in
  `assign-coordinates-full.ts`; confirmed the debug-trace numbers
  matched my hand-derived Java-formula values exactly, while the
  final SVG's numbers did not).
