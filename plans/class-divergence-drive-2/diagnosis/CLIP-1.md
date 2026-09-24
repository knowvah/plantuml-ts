# CLIP-1 — edges ending on a package cluster (T9 diagnosis, probe-verified)

| mechanism-id | fixtures | files | est. size |
|---|---|---|---|
| CLIP-1a magnetic border | bejusa, runane, vusute, pisobo; rezoba g[7], jojime g[9..11] (end points) | `layout.ts` (clusterRects carry wtitle/htitle/folder-ness), `core/spline-clip.ts` (ClipRect), `class-shield-helpers.ts` (`clipClusterEdgeEnds`), reuse `core/decoration/symbol/USymbolFolder.ts#folderMagneticBorder` | M |
| CLIP-1b first-bezier drop | rezoba g[7], jojime (start points) | `renderer-arrowhead.ts#applyDecorTrim` (= Q-2's `DotPath#moveStartPoint` port) | S |

Supersedes D.md (D-1) and S.md (S-9), both disproved (journal rows 5-6).
Written by the orchestrator from T9's report (journal row 14); T9's notes:
`.agent-notes/cdd2-T9.md`; its probe diff (temporary, includes a debug
`process.stderr` line — not a patch to apply): `CLIP-1-probe.diff`.

## CLIP-1a — cluster magnetic border force after the clip

- mechanism: after the compound clip, upstream `SvekEdge#drawU` moves an
  end that sits on a package cluster by that cluster's magnetic border
  force; for the folder shape (default package) the force is `(0, htitle)`
  = (0, 20) when the end lands on the folder's top edge right of the tab.
  The arrowhead is drawn translated by the same force. We never port or
  call a cluster's magnetic border. `clipSplineEnd` itself is faithful:
  our pre-force end equals the jar's within 0.003.
- java: `svek/SvekEdge.java:938-941` (head: `else if (getSvekCluster2() != null) { ... getMagneticBorder().getForceAt(ug.getStringBounder(), todraw.getEndPoint().move(dx, dy)); todraw.moveEndPoint(magneticForce2); }`),
  tail mirror `:927-931`; extremity drawn at `:1124,1138`
  (`extremity2.drawU(ugHead.apply(magneticForce2))`); `svek/Cluster.java:726-757`
  `getMagneticBorder` (none unless a USymbol or group type PACKAGE; else
  `ClusterDecoration(...).getTextBlock(...).getMagneticBorder()`, position
  relative to `rectangleArea` min); `decoration/symbol/USymbolFolder.java:242-266`
  (three branches: title band, `y<=0 && x>=wtitle+marginTitleX3`, ramp);
  `getWTitle :127-134`, `getHTitle :136-144`; `klimt/shape/DotPath.java:229-234`
  `moveEndPoint` (end + ctrl2). Only `USymbolFolder` implements the force.
- ts: would sit at `class-shield-helpers.ts:98-110` (`clipClusterEdgeEnds`
  returns right after `clipSplineEnd`); inputs dropped at `layout.ts:291-293`
  (`clusterRects` keeps `{x,y,width,height}`, loses `NamespaceGeo.wtitle/
  htitle/inkShape/usymbol`); the force is already ported, unused:
  `core/decoration/symbol/USymbolFolder.ts:109-130` (`folderMagneticBorder`);
  `core/svek/Cluster.ts:67` lists `getMagneticBorder` unported.
- probe: runane clipped end (297.80, 517.898), cluster rect (142, 518, 158,
  113), rel x 155.8 ≥ wtitle+7, y −0.10 ≤ 0 → force (0, 20); jar folder
  tab top 518, hline 538 (htitle 20); 517.898 + 20 = 537.898 vs jar
  537.896. rezoba end 226.912+20 vs 246.915; jojime g[10] 158.354+20 vs
  178.352. Temporary edits (clusterRects + force after clip) closed
  bejusa/runane/vusute/pisobo to `structural=0 numeric=0`.
- fix notes (T9): folder-ness = `NamespaceGeo.inkShape ∈ {undefined,
  'polygon'}` and `usymbol ∈ {undefined, package, folder}` (mirror
  `class-geo-builders.ts#resolveNamespaceInkShape`); head force commutes
  with the decor trim; tail force strictly belongs AFTER the decor trim
  (drawU order); `attachEdgeLabel`'s magic-arrow angle reads `pts` — a pure
  end+ctrl2 translation leaves it unchanged; `NamespaceGeo.wtitle` is
  computed with width 0 where upstream `getWTitle` uses the rect width —
  matters only for an empty title (`max(30, w/4)`); port `getWTitle` whole.
- ruled out: dot-engine raw spline (row 5); clip rectangle (drawn box
  byte-identical, and a pure post-clip translate reproduces the jar);
  `simulateCompound` logic; `lhead` conditions; `manageEntryExitPoint`
  (only with `projectionCluster`).

## CLIP-1b — `DotPath#moveStartPoint` first-bezier removal

- mechanism: when the decoration-trim length ≥ the first bezier's chord,
  upstream drops that bezier and folds the offset into the next;
  `applyDecorTrim` only shifts (it documents the removal branch as "NOT
  ported ... unreached" — these fixtures reach it).
- java: `klimt/shape/DotPath.java:206-216`, `klimt/geom/XCubicCurve2D.java:52-56`
  (`getLength` = chord), called from `SvekEdge.java:558-562`;
  `core/klimt/shape/DotPath.ts:275-287` already ports it for the class.
- ts: `renderer-arrowhead.ts:340-372` (`applyDecorTrim`).
- probe: rezoba g[7] first bezier after trim `M165.199,135.066 C… 163.504,120.216`,
  pre-trim chord < trim (1.694, 14.852) at the `+` decor; jar starts
  `M165.198,135.068 C165.358,136.469` = our second bezier shifted by
  exactly (1.694, 14.852). Both edits: rezoba, jojime → conformant.
- probe movers (both edits, vs b0): lojiga 163→178 (structural 3→2: g[7]
  point count fixed, exposing a pre-existing uniform Δ≈1.00 y offset as 16
  numerics); delasa-80-jusu462 (out of mission) 10664→10746 (structural
  21→15; point counts fixed on 6 paths, exposing a ~73.5 px frame offset).
  Both are compareSvg non-monotonic reveals, not regressions. Zero
  conformant losses.
- guxode's numeric half (Δ0.014 on g[14]) is NOT CLIP-1: no force applies;
  render-diff identical with and without the probe. Re-opened as open
  (diagnose in T8 or its close's residual round).
