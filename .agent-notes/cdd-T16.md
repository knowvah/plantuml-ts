# cdd-T16 — `groupInheritance` sametail suppression + shared triangle

## Observation: pieces (a) and (b) landed in one commit; the rotation-angle formula source
- **Context**: implementing M7's decor/dash suppression and E11's shared
  inheritance triangle for `skinparam groupInheritance`.
- **Finding**: Both pieces shipped together (no split needed) — piece (a)'s
  carry-only `EdgeGeo.sametail` field (`{parentId, contact}`) is the ONLY
  interface piece (b) needs, so there was no natural seam to separate them
  into different commits without leaving (a) unconsumed. The triangle's
  rotation angle is `Math.atan2(center.x - pt.x, -(center.y - pt.y))`
  (`dot/Neighborhood.java:83`), NOT the `segmentAngle`/`Math.atan2(dy, dx)`
  formula `renderer-arrowhead.ts` uses for the per-edge `EXTENDS` triangle
  (`ExtremityExtendsLike.java`) — two different upstream classes, different
  vertex sets ((0,0),(7,20),(-7,20) vs (0,0),(XLEN,±HALF_WIDTH)), different
  rotation conventions (`UPolygon#rotate` → `XAffineTransform.getRotateInstance`
  vs `ExtremityExtendsLike.Point#rotate`'s own negative-sin variant). Reusing
  `renderer-arrowhead.ts#place('EXTENDS', ...)` for the Neighborhood triangle
  would have been WRONG geometry; confirmed by hand-computing a symmetric
  case (straight-down contact) and asserting the exact polygon/line
  coordinates in `renderer-group.test.ts` before trusting the port.
- **Impact**: future work near `Neighborhood`/`ExtremityExtendsLike` should
  not assume they share a rotation formula just because both draw a
  triangle labelled "extends".
- **Confidence**: High (Java read line-by-line, hand-computed case matches).

## Observation: `class-edge-geo.ts#buildEdgeGeos`'s pre-existing 8-param signature is load-bearing
- **Context**: the complexity hook's directional policy blocks any
  WORSENING of an already-over-cap function (`buildEdgeGeos` was already at
  8 params / high CCN before this task, per T13's row 45 precedent).
- **Finding**: threading `sametailByRelIndex` through a NEW positional
  param would have pushed `buildEdgeGeos` further over its already-blocked
  metrics. The fix was to reuse `EdgeGeoTextContext` (the SAME object T15
  threaded `kals` through, for the identical "ninth-parameter" reason) and
  to extract the decor/dashed/stroke-override resolution into two NEW,
  small, in-budget functions (`resolveEdgeDecor`/`resolveNormalEdgeDecor`)
  rather than adding branches inline — this actually REDUCED
  `buildEdgeGeos`'s own NLOC/CCN relative to HEAD.
- **Impact**: any future edge-geo field needs the SAME two moves —
  extend `EdgeGeoTextContext`, and extract new decision logic into its own
  function rather than inlining it into `buildEdgeGeos`.
- **Confidence**: High (measured via the hook's own warnings, iterated
  until clean).

## Observation: lizard's TS parser over-counts inline multi-line object-literal return types
- **Context**: `resolveEdgeDecor`'s CCN was reported far higher (12) than a
  manual branch count (~8) suggested, purely from adding a multi-line
  inline object-literal return-type annotation.
- **Finding**: naming the type (`interface ResolvedEdgeDecor { ... }`,
  `interface EdgeDecoration` exported from `class-dot-edges.ts`) instead of
  inlining it dropped the CCN back to something the actual branch count
  explains — the semicolon-separated multi-line type literal was being
  read as additional statements by lizard's generic C-family grammar.
- **Impact**: prefer named types over multi-line inline object-literal
  type annotations in function signatures/return types in this codebase,
  independent of any stylistic preference — it avoids false complexity-hook
  blocks.
- **Confidence**: Medium (inferred from the metric drop after the
  refactor; did not read lizard's TS tokenizer source).

## Observation: the classifier-box-oversize bug is real, pre-existing, and out of this task's write-set
- **Context**: verifying the shared triangle's exact placement against
  jar's `lazeju-60-boki114` SVG.
- **Finding**: `class-geo-builders.ts#contentBox`'s non-`map` branch
  returns the PADDED DOT node's `pos.width`/`pos.height` (measured+40) as
  a protected classifier's OWN drawn box size — jar's `A3` `<rect>` is
  49.15x88 8x48 (unpadded, `EntityImageProtected.drawU` insets by `border`
  before delegating to `orig.drawU`); ours is 89.15x88 (padded, unfixed).
  This predates T16 (present in the `t15.json`-era baseline `before`
  measurement too, byte-identical `svg/@height` delta) and is NOT in this
  task's write-set (`class-geo-builders.ts` is not `class-edge-geo.ts`/
  `renderer-edge.ts`/`renderer-group.ts`). It causes lazeju's whole
  document to sit a uniform +20px too tall (visible as every Y coordinate
  in the render-diff numeric list being off by a flat 20), and is the
  reason lazeju's shared-triangle Y values (75/95 ours vs 55/75 jar) don't
  match jar exactly even though the X values match to within noise
  (370.575 vs 370.578) and the STRUCTURE (element count/nesting) is now
  exact (`structural=0`).
- **Impact**: a real, separable follow-on (fixing `contentBox`'s
  `protectedPad`-aware inset) would likely close most of lazeju's/mefike's/
  xifuza's/jakapi's remaining numeric residual. Filed for
  `next-missions.md`, not fixed here.
- **Confidence**: High (measured both SVGs' `<rect>` attributes directly;
  confirmed present in the pre-T16 baseline).

## Observation: `allButSametails` (`Neighborhood.java:97-113`) is a deliberate, named scope cut
- **Context**: jakapi's/mefike's/pijiju's remaining `svg/g[1][childCount]`
  structural diffs after this task.
- **Finding**: the SECOND loop in `Neighborhood#drawU` draws one plain
  (non-triangle) line for every OTHER link touching a protected parent
  (e.g. jakapi's `User o-- Group`/`Group o-- Activity`, mefike's
  `A3 o-- x1`, pijiju's `B::t ..> T`). No AC in this task's brief requires
  it (lazeju's two protected parents, A3/A4, have NO other links — its AC
  is met without this loop); mefike/xifuza/jakapi's ACs explicitly accept
  "residual named". Implementing it needs a SEPARATE per-link contact
  point (the OTHER end's own `getStartContactPoint()`/`getEndContactPoint()`
  depending on which side touches the leaf), not carried by this task's
  `EdgeGeo.sametail` field.
- **Impact**: a small, well-scoped follow-on — needs one more carry field
  (or reuse of `points[0]`/`.at(-1)` with a from/to-side flag) plus a
  second loop in `renderGroupInheritanceNeighborhood`. Filed for
  `next-missions.md`.
- **Confidence**: High (verified against jar's own SVG element sequence
  for jakapi/mefike: `polygon,line,polygon,line,line,line` for jakapi's
  Group — 2 sametail pairs (both matched by this port) + 2 allButSametails
  lines (not implemented)).

## Observation: `jakapi`'s Group has TWO distinct sametail contact points, not one — and our engine matched it exactly
- **Context**: verifying `uniqueSametailContacts`'s dedup logic against a
  fixture harder than lazeju's single-point case.
- **Finding**: real graphviz (jar) does NOT always merge a `sametail`
  DOT-attribute group's spline endpoints to one point — jakapi's `Group`
  (3 children, `skinparam linetype ortho`) produced 2 distinct contact
  points in jar's own SVG (2 `<polygon>` + 2 `<line>` before the
  allButSametails lines). This port's own dot-engine layout ALSO produced
  exactly 2 distinct contact points for the same 3 children (root
  childCount deficit is EXACTLY the allButSametails gap, 2, not 4 — see
  the observation above), meaning `uniqueSametailContacts`'s exact-equality
  dedup is doing the right thing, not silently over- or under-merging.
- **Impact**: do not assume a protected parent draws exactly one triangle;
  the AC's "exactly one" is specific to lazeju's two protected parents,
  not a general rule.
- **Confidence**: High (compared jar's and our own root-level `<polygon>`/
  `<line>` sequence for jakapi directly).

## cdd-T16b — the `allButSametails` follow-up (`Neighborhood.java:97-113`)

### Observation: a NEW file (not a baseline function) is the only reliable way past the complexity hook here
- **Context**: threading `protectedIds` out of `class-dot-graph.ts` and
  adding `computeLeafContacts` to `class-edge-geo.ts` repeatedly tripped
  the complexity hook's directional NLOC check on functions I had NOT
  touched (`buildDotNodes`, byte-identical to HEAD, flagged "new
  function"; `buildDotNodesAndEdges`, a 1-line return-statement content
  change, flagged "worsened NLOC 31 -> 32" across multiple DIFFERENT
  edits with identical total physical line counts).
- **Finding**: isolated via direct `lizard -w` runs (bypassing the hook)
  against both HEAD and the working tree: `buildDotNodes` was genuinely
  UNCHANGED (`diff` confirms byte-identical) yet lizard's NLOC differed
  25 (baseline) vs 31 (current) purely because inserting a new top-level
  `interface` block BEFORE it in the same file shifted lizard's
  brace-depth parsing for the PRECEDING function -- moving the interface
  further away from `buildDotNodes` fixed that specific miscount.
  Separately, `buildDotNodesAndEdges`'s NLOC (31 baseline) grew to 32
  purely by ADDING a 4th field to an already-3-field return object
  (regardless of spelling: named keys, spread, or a mix all landed on
  32) -- extracting the return-construction into a brand-new helper
  function (`toDotNodesAndEdges`) was what actually worked, not any
  reformatting of the return statement itself.
  For `class-edge-geo.ts`, moving the ENTIRE group-inheritance cluster
  (`groupInheritanceOverride`/`computeLeafContacts`/`resolveEdgeDecor`/
  `buildStrokeOverride`) into a NEW sibling module
  (`class-edge-group-inheritance.ts`) was necessary anyway once the file
  neared 500 lines again -- but it ALSO sidestepped the "false new
  violation" instability entirely, since a brand-new file's baseline is
  simply "everything in it", with no positional-diff ambiguity against
  HEAD.
- **Impact**: when a change to class-dot-graph.ts/class-edge-geo.ts
  trips a complexity warning on a function you did NOT edit, do not
  assume the hook is simply buggy and route around it by reformatting
  blindly -- verify with a direct `lizard -w` diff against
  `git show HEAD:<file>` first (byte-identical function body + differing
  NLOC = the interface-position artifact above); if the warning IS a
  real content change (adding a field to a return object counts, even
  spread), extracting a new small function is the reliable fix, not
  reformatting the return statement's punctuation.
- **Confidence**: High (multiple controlled single-variable edits,
  each verified via direct `lizard` invocation independent of the hook).

### Observation: real graphviz did not merge jakapi's Group to one sametail point, and neither did ours -- independently
- **Context**: implementing the `allButSametails` loop and writing the
  jakapi-shaped test.
- **Finding**: jakapi's `Group` (3 sametail children under
  `groupInheritance 3`, `skinparam linetype ortho`) produces exactly 2
  distinct sametail contact points in BOTH the jar's own SVG and this
  port's independently-computed `uniqueSametailContacts` output (2
  `<polygon>`+2 `<line>` pairs, verified structurally AND against the
  real measured coordinates). The 2 `allButSametails` lines (`User o--
  Group`, `Group o-- Activity`) landed in the EXACT same 4th/5th/6th
  root-element slot the jar's own SVG places them in.
- **Impact**: `computeLeafContacts`'s exclusion rule (skip entity1's own
  leaf only when THIS edge is that leaf's own `grouped` sametail link)
  is correct and needed no further per-fixture tuning once implemented
  per `Neighborhood.java:97-113`'s literal removeAll semantics.
- **Confidence**: High (measured both SVGs' root element sequence and
  the `leafContacts` carry field directly).

### Observation: `PLACEHOLDER` (hidden) never draws its own `<g class="link">`
- **Context**: writing the jakapi full-pipeline test's "3 grouped
  children render bare" assertion.
- **Finding**: jakapi's `Group <|-- PLACEHOLDER` relationship, with
  `PLACEHOLDER` hidden via `hide PLACEHOLDER`, draws NO `<g class="link">`
  at all -- `Link.java:459`'s `isHidden()` ORs the endpoint's own hidden
  state (pre-existing mechanism, not new to T16b). Only `Events`/
  `Travels` (Group's other two sametail children) have a real `<g
  class="link">` to assert against; the test was corrected to check only
  those two, not all three declared relationships.
- **Impact**: any future test iterating "all of Group's children" on
  this fixture must exclude PLACEHOLDER.
- **Confidence**: High (grepped the actual rendered SVG's `<!--link -->`
  comments; only 5 of the expected 6 non-grouped-triangle links appear).
