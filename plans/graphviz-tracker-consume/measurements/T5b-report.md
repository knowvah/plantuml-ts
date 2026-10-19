# T5b report

Commit: 727d4df51 `fix(description): order svek links; offset a group's autolink` (unsigned).
Files: src/diagrams/description/{link-order.ts (new), layout.ts, layout-geo-post.ts} (in-lane extensions, not in the task file's
list), docs/catalog.md (generated), tests/unit/description/{gtc-t5b-link-order.test.ts, gtc-t5b-group-autolink.test.ts} (new). No src/core edit.

## xagonu-36-sudi116 render-diff: 30/165 -> 0/0 (pass=true)

## Re-measure
After T5a2 the shape was 30 structural / 165 numeric: two clusters of diffs, g[37..39] and g[45..47] (link order) and g[30]
(367.418 px on path, arrowhead polygon and label).

## Diagnosis 1: link draw order
- Mechanism: `CucaDiagramFileMakerSvek.java:90-114` `getOrderedLinks`/`addLinkNew` builds the DotData link list: a link whose
  endpoints match an earlier one (`Link#sameConnections`, abel/Link.java:462-470, either direction) is inserted after that earlier
  link's contiguous run of matches, else appended. That list is `Bibliotekon#allLines` (Bibliotekon.java:88), which `SvekResult#drawU`
  walks (SvekResult.java:97-101). The `lnkN` uid stays in creation order (so lnk39 sits right after lnk36: `mapp->obc`, `obc->mapp`).
- Origin (port): the description layout used `ast.links` in creation order (no port of getOrderedLinks; svek-dot-lines0.ts ports only
  the separate lines0/lines1 split). Fix: `link-order.ts#orderLinks`, applied at the top of `layoutDescription` (svek path only; the
  ELK path, whose Java maker uses `diagram.getLinks()`, is a different entry).
- Ruled out: link uid assignment (creation order, correct), CucaDiagram.addLink (appends), the mis-pairing idea (the g[30] diff
  persisted after the order fix, so it is real geometry).
- Reduced fixture + jar oracle: /private/tmp/claude-501/gtc-T5b/p/ord.puml (8 links, 2 self-loops, reversed pairs): jar draw order
  lnk5, lnk9, lnk6, lnk12, lnk7, lnk10, lnk8, lnk11; pinned in gtc-t5b-link-order.test.ts (plus a pure `orderLinks` case).

## Diagnosis 2: g[30], the group's self-loop 367.418 px away (not routing, not dot-engine)
- Evidence it is not dot: `dot -Tdot` of the cached jar svek-1.dot and of OUR emitted graph (toSvekDot) give an identical edge
  `pos` for the loop (`293.1,1053.5 ... 294.06,1053.6`, xlp 384.37,1070.3) and identical cluster bb (285.33..646.71). The fresh oracle
  re-render reproduces the jar svg (loop at 653-658). Same shape in both outputs, whole link (path, arrowhead, label) shifted by one
  constant: so a post-layout draw offset, not a layout. (stop 6 does not apply.)
- Mechanism: `SvekEdge.java:863-869`: `if (link.isAutoLinkOfAGroup()) { x += cl.getRectangleArea().getWidth(); x -= dotPath.getStartPoint().getX() - cl.getRectangleArea().getMinX(); }`,
  then `x += dx` (path :882+, label :74-offset). `Link.isAutoLinkOfAGroup` = both ends the same group (abel/Link.java:341-352).
  Quirk: `SvekResult.java:130-134` measures with a dx=0 drawing and then `clusterManager.moveDelta(6 - minMax.minX, ...)`, which moves
  the cluster rectangle (Cluster.java:127-137) but the edge only accumulates dx (SvekEdge.java:1241-1244), so the final draw's
  `cl.minX` already includes the delta: shift = W - (sx - minX) + delta on top of the normal dx. Checked numerically on xagonu
  (361.38 - (285.292 - 285.33) + 6 = 367.418) and on a reduced fixture whose delta is -17.
- Origin (port): none ported; `layout-geo-post.ts#buildEdgeGeos` placed every edge at clip + dx. Fix: `autoLinkOfAGroupShift`
  (cluster rect from `clipRectOf`, clipped start point, `EdgeMapping.svekMoveDeltaX = dx - originShift.x`, i.e. the jar's svek-frame
  delta); the ink-measuring pass (dx=0) uses the unmoved formula. Applied to the points (so the arrowhead) and the label.
- Reduced fixture + oracle: /private/tmp/claude-501/gtc-T5b/p/loop.puml (`component a`, `component M { component x }`, `a --> M`,
  `M --> M : loop`): jar path `M159,182.45 ...` and label x=200.08 pinned in gtc-t5b-group-autolink.test.ts.

## Residual (reduced fixture only, not xagonu)
- Canvas width of the reduced loop fixture: jar 262, ours 245. The group's autolink label is the right-most ink; the canvas comes
  from `computeTotalDimensions` (edge POINTS + 12), which ignores label ink, and the ink walk (`walkRawInk`) is also ~1.3 px short of
  the jar for that label. xagonu's loop is not right-most, so xagonu is unaffected. Not fixed (needs the unchromed width to come
  from the measuring-pass ink; separate task). The test pins only the path and label.

## Tests
- `vitest run --testTimeout=60000 --maxWorkers=4 tests/unit/description tests/architecture tests/oracle/svg-conformance/description.*.test.ts`:
  94 files collected, 94 passed after `npm run catalog` (1620 tests). typecheck, eslint, prettier clean.

## Surveys (/private/tmp/claude-501/gtc-T5b/<tree>-{before,after}.json, no timeouts), conformant/structural-match/diverged
- component 204/12/50 -> 204/12/50; usecase 65/3/25 -> 66/3/24 (+1 oracle-error both); unknown 496/16/313 -> 497/16/312. Losses: 0.
- Movers: unknown xagonu-36-sudi116 -> conformant (both mechanisms); usecase xacaxe-43-bupe002 -> conformant (link order, first diff
  was g[8]/@id); usecase jecici-56-bimu826 stays diverged, maxDelta 269.44 -> 0 (its remaining 2 structural diffs are `svg/@width`/
  `@height` present in ours and absent in the jar: unrelated to T5b).
- Orchestrator: re-pin xagonu and xacaxe (D6).
