# G16 findings — T19 (tightContentDimension, jijuze-43-ceva131)

Method note. Re-measured first (`npx jiti scripts/measure-composite-declared-
size.ts jijuze-43-ceva131`) — unchanged from SI28 (batches 1-3's clusterPosMap
G4/G8 fixes do not touch this call site; SI28 already ruled that out for this
fixture with 0 interceptions). Read `SvekResult.java` in full (T3's own
nextStep), then followed the chain it opens into: `TextBlockUtils.getMinMax`,
`LimitFinder` (every `draw*` handler read in full), `EntityImageState.drawU`,
`GroupMakerState.getImage()`, `GraphvizImageBuilder.buildImage()`. One gated
trace was added INSIDE `tightContentDimension`
(`src/diagrams/state/state-composite-cluster.ts`, env-gated on `T19_TRACE`,
run via `T19_TRACE=1 npx jiti scripts/measure-composite-declared-size.ts
jijuze-43-ceva131`) and reverted immediately after capture —
`git diff --stat -- src/` shows zero change to this file (only the two
concurrent implementation agents' in-flight files appear in the diff, none of
them this one). No `scripts_scratch/` probe was needed.

### jijuze-43-ceva131

- **bucketLabel:** concurrent-region (G16)
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 2 | 0.9625 | 0.976389 | -1.000 |
- **status:** unresolved
- **mechanism:** UNRESOLVED for the final 1px term, but substantially
  narrowed this round. `XA6::CONC1` (region-1, a bare `state XA13` with no
  transitions) is sized via `tightContentDimension(resolved.result) +
  REGION_LEAF_MARGIN(15)`. Instrumented directly (gated trace, see method
  note): the walk sees exactly one node, `{id:"XA13", x:0, y:0, width:54.3,
  height:50}`, zero edges — `content = {width:54.3, height:50}` reproduces
  XA13's own raw declared box to the pixel (`0.754167in*72=54.3`,
  `0.694444in*72=50.0`), not a re-derivation this time but a direct runtime
  observation. This DEFINITIVELY rules out an arithmetic bug in
  `tightContentDimension` itself — its output is exactly what the (correct,
  scope-1-exact-per the harness) node data says it should be. Full read of
  the Java chain `SvekResult.calculateDimension()` is meant to mirror:
  `TextBlockUtils.getMinMax(this, stringBounder, false)` draws the WHOLE
  scope (`SvekResult.drawU`: clusters, then every `SvekNode.getImage()`,
  then edges) through `LimitFinder`, a UGraphic that tracks min/max of every
  shape drawn. For CONC1's scope (1 leaf, 0 edges, 0 registered clusters —
  `svek-1.dot` has no `subgraph cluster`), the ONLY shape drawn is XA13's own
  `EntityImageState.drawU`: one `URectangle` (`getShape(dimTotal)`, rounded),
  one divider `ULine.hline(dimTotal.getWidth())`, and centered name text —
  none exceeds `dimTotal`'s own declared box. `LimitFinder.drawRectangle`
  (`addPoint(x-1,y-1)` / `addPoint(x+w-1+shadow*2, y+h-1+shadow*2)`) has its
  `-1/-1` offsets CANCEL identically on both axes (extent = width+shadow*2,
  extent = height+shadow*2) — read in full, this handler is architecturally
  incapable of producing a width-only +1px on its own, and `deltaShadow=0`
  for the default (unshadowed) skin used here. `GroupMakerState.getImage()`
  line 116 (`if (group.getGroupType()==CONCURRENT_STATE) return
  createGeneralImageBuilder(...).buildImage(...)`) confirms CONC1 is built
  DIRECTLY — never wrapped in `InnerStateAutonom` (that wrapper is applied
  only to the OUTER `XA6` composite at line 136, one level up) — so no
  missing header/margin layer is being skipped on our side.
  `GraphvizImageBuilder.buildImage()` line 214
  (`dotData.isDegeneratedWithFewEntities(1) && dotData.geDiagramType() !=
  DiagramType.STATE`) confirms the single-entity fast path is EXPLICITLY
  excluded for STATE diagrams, so CONC1 genuinely runs graphviz and produces
  a real `SvekResult` — matching this port's own architecture (a genuine
  dot-engine pass per region, `buildConcurrentRegionPass`). Every candidate
  this session's Java reading opened has been closed without finding the
  +1px; the remaining candidate (untraced this round, see `nextStep`) is
  `LimitFinder.drawEmpty` (`addPoint(x,y)` / `addPoint(x+w,y+h)`, NO `-1/-1`
  cancellation, unlike `drawRectangle`) firing for an invisible/borderless
  root `Cluster` object that CONC1's own inner graphviz subgraph might still
  register in `Bibliotekon` even though it draws no border — not yet
  confirmed to exist or fire for this shape.
- **originFileLine:** src/diagrams/state/state-composite-cluster.ts:197-214
  (`tightContentDimension` — INSTRUMENTATION-CONFIRMED correct this round,
  not just re-derived) + :236-276 (`buildConcurrentRegionLeaf`,
  `REGION_LEAF_MARGIN=15`, height-axis-confirmed correct)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:126-140
  (`calculateDimension`, read in full this round — was "not independently
  re-read" per SI28); ~/git/plantuml/.../klimt/shape/TextBlockUtils.java:138-142
  (`getMinMax`); ~/git/plantuml/.../klimt/drawing/LimitFinder.java:150-154
  (`drawEmpty`, no cancelling offset — the open candidate), :181-186
  (`drawRectangle`, offsets cancel — ruled out this round);
  ~/git/plantuml/.../svek/image/EntityImageState.java:120-166 (`drawU`, read
  in full — one rect + one divider line + centered text, none exceeds
  `dimTotal`); ~/git/plantuml/.../svek/GroupMakerState.java:113-138
  (`getImage()` — confirms CONC1's own build path, no `InnerStateAutonom`
  wrapper); ~/git/plantuml/.../svek/GraphvizImageBuilder.java:209-297
  (`buildImage`, :211-223 the excluded fast paths, :286-296 the real
  `SvekResult` construction)
- **causalChain:** `(0.9625-0.976389)*72 = -1.000px` (row-exact, unchanged
  from SI28). `content.width`(ours) = 54.3px — now INSTRUMENTATION-CONFIRMED
  (not derived) to equal XA13's own raw declared box exactly, via the gated
  trace's direct dump of the node the walk sees. `content.width`(jar,
  implied) = `70.3-15=55.3px`, a clean integer `1.0px` above 54.3 — not
  sub-pixel/rounding noise (a real dot-engine-vs-graphviz arithmetic drift
  would produce a fractional residue, not an exact integer), which is why
  this record treats it as a likely fixed missing term rather than an
  engine-version difference (contrast T3's zacajo-09-tamu628, ruled likely
  external, where the residual was `3.733px`, not a clean integer). The
  HEIGHT axis (`65px` both sides) independently confirms the `+15`
  `REGION_LEAF_MARGIN`/`delta(15,15)` architecture itself is correct on this
  fixture — only WIDTH carries the gap.
- **ruledOut:** `tightContentDimension`'s own arithmetic —
  INSTRUMENTATION-CONFIRMED this round (gated trace dump matches the exact
  expected single-node walk, zero edges, zero drift). `clusterPosMap:
  undefined` gap — already definitively ruled out by SI28 (0 interceptions),
  re-confirmed still true after batches 1-3 landed G4/G8 (re-measured, delta
  unchanged to the same magnitude). `LimitFinder.drawRectangle`'s `-1/-1`
  convention as an asymmetric width source — read in full, offsets cancel
  identically on both axes; ruled out. `EntityImageState.drawU` drawing
  anything beyond `dimTotal`'s own box (rect, divider line, or name text
  overflow) — read in full, none does. A missing `InnerStateAutonom` wrapper
  or a missing-fast-path skip on CONC1's own image construction — read in
  full (`GroupMakerState.java:116-117`, `GraphvizImageBuilder.java:214`),
  both confirm this port's architecture already matches jar's for this
  region shape.
- **pairingRisk:** possible — scope 2 has 3 nodes (`XA1`, `XA6::CONC1`,
  `__zaent_XA6`); idx 2 (largest of 3) is presumably `XA6::CONC1`, consistent
  with the only plausible candidate near this magnitude, not independently
  confirmed by name (unchanged from SI28; not re-verified by name this
  round).
- **sharedCauseWith:** none in this slice (unchanged from SI28's
  cross-reference against the other concurrent-region fixtures; magnitude
  1.0px repeats elsewhere in the corpus under different, unrelated shapes
  per that record's own note).
- **proposedWriteSet:** src/diagrams/state/state-composite-cluster.ts
  (`tightContentDimension`) — still cannot be proposed as a concrete diff
  until the `drawEmpty`/root-`Cluster` candidate below is confirmed or
  eliminated; a blind "+1 to width" would not cite an upstream `file:line`
  and is exactly the kind of fitted constant CLAUDE.md forbids.
- **sizeEstimate:** smallest fixture in the corpus for this mechanism (1px,
  single row) — cheap to verify once isolated; isolating it needs one more
  Java read (`Cluster.java`'s `drawU`, `Bibliotekon.allCluster()`) that this
  session did not reach, or a jar-side print (out of this repo, not
  available to a diagnosis-only D-task) confirming whether a root cluster
  object exists for a single-leaf `CONCURRENT_STATE` region's own graphviz
  subgraph.
- **confidence:** medium (mechanism narrowed by elimination across 5 Java
  files read in full plus one direct runtime instrumentation this round;
  the exact +1px term is still open)
- **nextStep:** Read `Cluster.java`'s `drawU` and `Bibliotekon.allCluster()`
  (~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/) to determine
  whether a childless, borderless root subgraph is registered as a drawable
  `Cluster` object for a single-leaf `CONCURRENT_STATE` region's own nested
  graphviz call, and if so, whether its `drawU` emits a `UEmpty` shape (the
  one `LimitFinder` handler, `drawEmpty`, with no `-1/-1` cancellation) sized
  from the region's own graph-level margin/pad — the one remaining
  architecturally-plausible source of a width-only, non-fractional +1px this
  session's reading did not close off.
