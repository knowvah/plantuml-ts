# cdd2-T9 — CLIP-1 observations

## Observation: CLIP-1 is Cluster#getMagneticBorder, not the clip
- **Context**: Δ20 on the head end of edges ending on a `zaent<N>` anchor
  (bejusa, runane, vusute, pisobo; the head half of rezoba, jojime).
- **Finding**: the clip (`spline-clip.ts#clipSplineEnd`) is faithful. The
  missing step is `SvekEdge.java:937-941` (`drawU`): when entity2 is a
  cluster, `todraw.moveEndPoint(getSvekCluster2().getMagneticBorder()
  .getForceAt(end))`. `Cluster.java:726-757` builds the force from the
  cluster's `ClusterDecoration` symbol; only `USymbolFolder` implements it
  (`USymbolFolder.java:242-266`, asBig): end point y <= 0 (on the top edge)
  and x >= wtitle + 7 → translate (0, htitle) = (0, 20) at 14pt. Extremity is
  drawn translated by the same force (`SvekEdge.java:1138`). Tail mirror at
  `:922-931` (moveStartPoint, with the segment-removal branch).
- **Impact**: nothing in `src/` calls a cluster's magnetic border. The force
  needs wtitle/htitle + "is USymbolFolder" per cluster, which live on
  `NamespaceGeo`; `clusterRects` (`class/layout.ts:291-293`) drops them.
- **Confidence**: High (temporary probe closed all four Δ20 fixtures).

## Observation: applyDecorTrim lacks DotPath#moveStartPoint's removal branch
- **Context**: rezoba/jojime structural path diffs (point count).
- **Finding**: `DotPath.java:206-211` drops the first bezier when the trim
  length >= its chord (`XCubicCurve2D.java:52-56`). `renderer-arrowhead.ts
  #applyDecorTrim` documents this branch as "NOT ported ... unreached". It is
  reached by rezoba, jojime, lojiga (g[7]) and delasa (6 paths).
- **Impact**: porting it turns those structural diffs into numeric (lojiga
  now shows a pre-existing 1px path offset, delasa ~73.5px frame offsets);
  compareSvg counts rise though structure improves.
- **Confidence**: High (probe: rezoba/jojime conformant).
