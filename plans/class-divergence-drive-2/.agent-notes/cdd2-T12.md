# cdd2-T12 — Kal endpoint shift, Kal overlap, cluster-anchored edges

## Observation: the Kal translate belongs with the decor trim, not the geo
- **Context**: Q-2 (baneru control point Δ16; tikovu start Δ16 with no decor).
- **Finding**: `SvekEdge.java:539-562` does ONE `DotPath#moveStartPoint/
  moveEndPoint(translateForKal.compose(decorTrim))`, and nothing at all
  when the end has no decor. The trim was already render-side
  (`applyDecorTrim`), so the Kal translate now travels there too: rebuilt
  from `KalBox.position` + the box's (scaled) width/height
  (`renderer-arrowhead-move.ts#kalEndTranslate`). `EdgeGeo.points` is now
  the pre-extremity `dotPath` for Kal ends as well. The extremity is drawn
  at point + Kal translate with the PRE-move angle (both points of the
  angle pair shift together); `renderer-arrowhead-ink.ts` does the same.
- **Impact**: every Q-2 link in the T11/T13 fixtures now matches the jar
  up to the node-position offset those fixtures carry (Q-1/Q-3/Q-10).
- **Confidence**: High (render-diff: baneru/tikovu/vileca/vuzoro links
  within 0.005 of the jar apart from that offset).

## Observation: LineOfSegments is float-dust sensitive; our inputs trip it
- **Context**: Q-7 on xoxega-30-vuju324 and ririlu-13-zipi740 (MoreComplex).
- **Finding**: `LineOfSegments.java:89-111` allows `size` passes and each
  pass fixes the right-most pair with `overlap > 0`. After one push, the
  next overlap on the same pair is ±1e-14 dust, which can spend the whole
  budget. With our full-precision dot-engine coordinates, xoxega and
  ririlu hit it (boxes half-spread). With the SAME algorithm fed
  graphviz-SVG-style 2-decimal start points (jar's `svek-1.dot` rendered
  with native `dot`, and ours rounded to 2 dp), all three boxes spread to
  exactly the jar's 37.325/137.775/238.225 (xoxega) and to within the
  0.469 node offset (ririlu). rilali, goloxu and vuzoro spread exactly
  under our inputs.
- **Impact**: the residual is input precision at the layout seam
  (upstream parses graphviz SVG text, 2 decimals; `core/graph-layout*.ts`
  passes full precision). Out of T12's write-set. No rounding was added
  in `class-kal-overlap.ts`, because that would be fitting at the wrong
  layer.
- **Confidence**: High (controlled simulation, both inputs).

## Observation: CLIP-1a applies to note connectors too (pecabi Δ4.893)
- **Context**: checking whether the magnetic force should reach
  `note-layout-tip.ts`'s cluster clip.
- **Finding**: pecabi-95-demu756's two remaining numerics (Δ4.893 on the
  connector's last point) are exactly the USymbolFolder ramp branch:
  wtitle 126.575, end x rel 123, `20 * (123 - 119.575) / 14 = 4.893`.
  The note link is a `SvekEdge` upstream, so `drawU`'s cluster arm
  applies. `note-layout-tip.ts:268-269` calls `clipClusterEdgeEnds` with
  the SAME group id for both ends, so the force needs the group end
  identified there. That file is outside T12's write-set.
- **Impact**: a small follow-on is available. The fix site is
  `note-layout-tip.ts`, via `applyClusterMagneticBorders` on the group end.
- **Confidence**: High (value reproduced exactly by hand).

## Observation: ordering approximations, measured as unreached
- `moveX` (Q-7) and the cluster force (CLIP-1a) are applied to
  `EdgeGeo.points` in layout. The Kal+trim move is applied in the
  renderer. Upstream order at the start end is kal+trim → moveX → force.
  The swap matters only for the removal branch, or for an extremity on a
  moveX-moved end, which upstream leaves un-moved. Temporary
  instrumentation over all 723 class fixtures found `moveX` on a decorated
  end only with |dx| ≤ 3.6e-15. It found one tail-force removal, and that
  one had no decor. Neither case is reached.
- Node-end `getMagneticBorder` (`SvekEdge.java:923-926`, a `(0,0)` move
  for class images) is not applied. It is observable only via the removal
  branch on a zero-chord first bezier.
