# Diagnosis — group Q (qualifier / port / role-slash links)

| mechanism-id | fixtures | files | est. size |
|---|---|---|---|
| Q-1 | baneru, comaxe, vorimi, kadifi, kopida, pumocu, tikovu, vileca | `src/diagrams/class/class-badge.ts` (HeaderLayout, run header re-centre AFTER width floors), `src/diagrams/class/class-dot-width-floors.ts` | M (re-sequencing measure/floor order; T15-documented, unfixed) |
| Q-2 | baneru, comaxe, vorimi, kadifi, kopida, pumocu, tikovu, vileca, rilali, xoxega, goloxu, ririlu, coxose, vuzoro, camuna, nafiki, (rifuzu likely) | `src/diagrams/class/class-edge-geo.ts` (`attachKalBoxes`), `src/diagrams/class/renderer-arrowhead.ts` (`applyDecorTrim`) | S (one function, gate + shift adjacent point) |
| Q-3 | baneru, comaxe, vorimi, kadifi, kopida, pumocu, tikovu, vileca, coxose | unresolved — candidate `src/core/graph-layout.ts` (`mapNodes`/`shieldCorner`) or `@knowvah/dot-engine` `getLayout()` | unknown (not isolated) |
| Q-4 | camuna, nafiki | `src/diagrams/class/renderer-classifier-badge-tag.ts` (`renderGenericTag`, `GENERIC_TAG_BACKGROUND`) | S (already self-ledgered) |
| Q-5 | camuna, nafiki | `src/diagrams/class/class-dot-graph.ts:334`, `src/diagrams/class/layout.ts:311` (cardinalityFont resolution) | S-M (thread a style-cascade signature) |
| Q-6 | nenepe, pegeso | unresolved — candidate `src/diagrams/class/layout-ink-extent.ts` (`computeClassDocumentDims`) | unknown (not isolated) |
| Q-7 | rilali, xoxega, goloxu, vuzoro | `src/diagrams/class/class-kal.ts` (needs `overlapx`/`moveX`/`fixHoverlap` port) | M (new algorithm, `LineOfSegments`-equivalent) |
| Q-8 | mucoti, sefazi | none (owner: `@knowvah/dot-engine`, already filed `docs/graphviz-issues/19-flat-edge-ignores-html-table-port.md`) | n/a — do not chase |
| Q-9 | nenexe, mugobo | `src/diagrams/class/class-ink-box.ts` (`buildInkBox`'s edge loop) | S (one more `for` arm) |
| Q-10 | camuna, nafiki, rifuzu | unresolved — candidate `src/diagrams/class/class-stereotype-layout.ts` (`measureGenericTagDim`/`buildGenericTagGeo`) or cardinality box width | unknown (not isolated) |

---

### baneru-00-kuro607
- mechanism-id: Q-1, Q-2, Q-3
- mechanism: (Q-1) `HeaderLayout`'s badge/text split is computed inside `measureClassifier`, BEFORE `applyKalWidthFloor`/`applySameClassWidthFloor` widen the box for the Kal shield — so header content never re-centers against the widened box. (Q-2) `attachKalBoxes` shifts only the edge's raw endpoint by the Kal's `getTranslateForDecoration()`, never the adjacent bezier control-point handle, so the curve's first control point stays at its pre-shift position while the endpoint (correctly, via `applyDecorTrim`) moves. (Q-3) `class2`'s box (no Kal margin of its own) is off by 0.495px in X even though DOT emission is byte-identical to `svek-1.dot` — not yet isolated.
- java: `svek/HeaderLayout.java:81-117` (Q-1); `svek/SvekEdge.java:539-562 getExtremitySimplier` + `klimt/shape/DotPath.java:206-216 moveStartPoint` (Q-2, both point AND adjacent control point shifted together, and the whole call only fires `if (extremityFactory != null)`)
- ts: `src/diagrams/class/class-badge.ts:127-142` (Q-1, pre-existing, T15-documented); `src/diagrams/class/class-edge-geo.ts:160-180 attachKalBoxes` (Q-2, `moved.x += tr.dx; moved.y += tr.dy;` applied unconditionally to `pts[0]`/`pts[last]` only, never to `pts[1]`/`pts[last-1]`, never gated on `kal`'s end having a decor)
- causal chain: (Q-1) box widens by the Kal's `1.3×` width floor after the header glyphs were already measured/positioned relative to the OLD (narrower) box, so every header element (badge ellipse, name text) sits at the pre-floor X. (Q-2) Java's `dotPath.moveStartPoint(translateForKal.compose(decorLengthTranslate))` rigidly translates BOTH `x1,y1` (the visible endpoint) and `ctrlx1,ctrly1` (the first bezier handle) by the identical delta; this port applies the Kal-decoration component of that delta (`tr.dx/dy`) to the endpoint alone in `attachKalBoxes`, then applies only the arrow-trim component to BOTH endpoint+handle later in `applyDecorTrim` — so the endpoint nets out correctly (both components summed) but the control point is missing the Kal-decoration component entirely.
- ruled out: (Q-2) not a `simulateCompound`/extremity-length miscalculation — the visible endpoint (75.818 vs jar 75.82) matches almost exactly; only the FIRST control point (82.511 vs jar 98.51, Δ15.999 ≈ the Kal box height 16) is wrong, isolating the bug to the missing companion shift. (Q-3) not our DOT emission — T15 already confirmed byte-identical node sizes/margins vs `svek-1.dot`; not `@knowvah/dot-engine`'s layout algorithm — feeding the exact cached `svek-1.dot` to both `dot` 16.1.0 (native) and `@knowvah/dot-engine`'s own `renderSvg` reproduces the SAME h-cell polygon (`8,-128 .. 80,-176`), matching jar's rect x=7 almost exactly; the discrepancy must be in how `getLayout()`'s extracted node centre/width feed `graph-layout.ts#mapNodes`/`shieldCorner`, not yet pinned to one line.
- probe: `python3` base64/regex extraction of `<g class="link">` from `measurements/out/baneru-00-kuro607.{jar,ours}.svg` (Q-2, `plans/class-divergence-drive-2/diagnosis/scratch/` inline); `dot -Tsvg svek-1.dot` and `node .../probe-dotengine.mjs svek-1.dot` (Q-3, both reproduce `8,-176..80,-128`); `node .../probe-dotengine2.mjs svek-1.dot` printing raw `getLayout()` node x/width (`sh0006 x=44 width=88`) — the `shieldCorner` formula (`n.x - width/2`, `width` = declared table width 72.995) yields 7.5025, not jar's 7 — an unexplained ~0.5px residual even after excluding DOT emission and the layout engine itself.
- fix shape: Q-1: after `applyKalWidthFloor`/`applySameClassWidthFloor` run, re-run the `HeaderLayout` split with the final width (or shift header content by the floor delta) in `class-badge.ts`. Q-2: in `attachKalBoxes` (`class-edge-geo.ts`), also shift the ADJACENT point (`pts[1]`/`pts[last-1]` for a `1+3n`-point spline) by `tr.dx/dy`, and/or gate the whole shift on whether that end actually carries a decor (mirroring `getExtremitySimplier`'s early `null` return) — needs coordination with `applyDecorTrim` so the two don't double-apply when a decor IS present. Q-3: instrument `getLayout()`'s raw values against `renderSvg`'s emitted polygon for more shielded fixtures before proposing a fix.
- owner: this mission (Q-1, Q-2); undetermined — dot-engine vs plantuml-ts (Q-3, needs more probing before assigning)
- confidence: Q-1 HIGH (T15-documented + probe-confirmed here); Q-2 HIGH (probe-verified, code read both sides); Q-3 LOW (mechanism not yet isolated to a line)

### comaxe-39-goza236
- mechanism-id: Q-1, Q-2, Q-3
- mechanism/probe: byte-identical numeric signature to baneru (89 numerics, same Δ0.572/Δ0.495/Δ0.498 triplet across `g[1]/g1`, `g[1]/g2`, `g[1]/g3`) — same puml shape (`class1 [Qualifier] <-- class2`-equivalent). Not independently re-probed past the signature match.
- confidence: HIGH (Q-1/Q-2 by signature identity with baneru, itself probe-verified); Q-3 LOW

### vorimi-67-gudu296
- mechanism-id: Q-1, Q-2, Q-3 — identical 89-numeric signature to baneru/comaxe. Same confidence rationale.

### kadifi-56-bili996
- mechanism-id: Q-1, Q-2, Q-3
- mechanism: same Q-1/Q-2/Q-3 signature repeated across THREE boxes (134 numerics = baneru's pattern × extra `g[1]/g3` header copy, i.e. two Kal-adjacent classifiers plus a third non-Kal one), consistent with a second, similarly-shaped link in the same diagram.
- confidence: HIGH (Q-1/Q-2 by exact Δ-value match to baneru's per-node signature); Q-3 LOW

### kopida-02-vaje995
- mechanism-id: Q-1, Q-2, Q-3 — identical 134-numeric signature to kadifi. Same confidence rationale.

### pumocu-32-fiji248
- mechanism-id: Q-1, Q-2, Q-3 — 84-numeric signature, same Δ-triplet subset as baneru/comaxe (two boxes only). Same confidence rationale.

### tikovu-50-gale862
- mechanism-id: Q-1, Q-2, Q-3
- mechanism: no arrowhead at either end (`class1 [Qualifier] -- class2`). Per `getExtremitySimplier`'s early `if (extremityFactory == null) return null;`, jar applies NO translate to `dotPath` at all when there is no decor — the raw graphviz anchor point (54.82, the "h" port cell's own bottom edge) is drawn as-is. This port's `attachKalBoxes` applies the Kal's DOWN-direction `tr.dy=+16` unconditionally regardless of decor presence, landing the path start at 70.818 (= 54.818+16, the SHIELD-INFLATED table's outer edge instead of the cell edge). The header offset (Δ1.067 = Q-1's 0.572 + Q-3's ~0.495 box-position shift, confirmed additive) is class1's own combined residual.
- java: `svek/SvekEdge.java:539-562` (`if (extremityFactory == null) return null;`, no `dotPath` mutation)
- ts: `src/diagrams/class/class-edge-geo.ts:160-180 attachKalBoxes` (unconditional `moved.y += tr.dy`)
- causal chain: our TS applies the DOWN-direction Kal margin translate (16px) to the connector's raw start point even though no arrowhead decor exists at that end to justify any shift at all — jar's equivalent code path is never entered in this case.
- ruled out: not `simulateCompound`/cluster clipping (`lhead`/`ltail` both null here, single-class link); not the bezier CONTROL point issue Q-2 shows on baneru — here the START point itself moves, matching `attachKalBoxes` running unconditionally on the no-decor path.
- probe: direct SVG diff, `plans/class-divergence-drive/measurements/out/tikovu-50-gale862.{jar,ours}.svg` — jar path `M137.71,54.82 C137.71,77.51 ...`, ours `M137.712,70.818 C137.712,77.511 ...` (start Δ15.998, both control points match within 0.001).
- fix shape: same as baneru's Q-2 fix — gate `attachKalBoxes`'s shift on decor presence at that end (`edge.sourceDecor`/`targetDecor !== 'none'`), matching `getExtremitySimplier`'s early return.
- owner: this mission
- confidence: HIGH (probe-verified, exact Δ match to the Kal box height)

### vileca-45-melo541
- mechanism-id: Q-1, Q-2, Q-3 — identical 42-numeric signature to tikovu (same puml shape, no-arrowhead qualifier). Same confidence rationale (signature match, not independently re-probed).

### rilali-81-gifu188
- mechanism-id: Q-2, Q-7
- mechanism: `top` carries THREE Kal boxes, all DOWN-direction (`[Qualifier2]`, `[Qualifier3]`, `[Qualifier4]`, one per link to class2/class3/class4). Upstream's `SvekNode#fixOverlap`/`Kal#overlapx` (`LineOfSegments#solveOverlaps`) spreads overlapping same-direction Kal boxes apart horizontally and calls `kal.moveX(dx)`, which ALSO shifts the owning edge's start point (`SvekEdge.moveStartPoint(dx,0)`) — a mechanism T15 explicitly recorded as unported ("no fixture has two same-side boxes in reach"). This fixture is exactly that case. Q-2's unconditional single-point shift (Y-axis, Δ16) compounds it.
- java: `svek/SvekNode.java:445-463 fixOverlap/fixHoverlap`; `svek/Kal.java` (`overlapx`, `getX1`/`getX2`, `moveX`)
- ts: `src/diagrams/class/class-kal.ts` (no `overlapx`/`fixHoverlap`/`moveX` equivalent exists)
- causal chain: with 3 DOWN-direction Kal boxes on one entity, upstream repositions each box (and its owning edge's start X) to avoid horizontal overlap; this port places every Kal box (and its edge) at its UNADJUSTED X, so all 3 boxes/edges start from the SAME X region, producing large (tens-of-px) X divergence on the edge paths in addition to the Y-axis Q-2 shift.
- ruled out: not purely Q-2 — Q-2 alone only explains a ~16px Y shift; the observed X shift (up to 53px on this fixture) requires a horizontal-repositioning mechanism, which `fixOverlap`/`overlapx` is (T15 named it, unfixed).
- probe: `python3` regex dump of all three `<g class="link">` elements from `rilali-81-gifu188.{jar,ours}.svg` — jar lnk5 starts `(108.562,54.81)`, ours `(161.622,70.813)`; Y-delta (16.003) matches Q-2 exactly, X-delta (53.06) is unexplained by Q-2 alone and matches `fixOverlap`'s described effect.
- fix shape: port `Kal#overlapx`/`SvekNode#fixHoverlap` into `class-kal.ts` (a `LineOfSegments`-equivalent interval-overlap solver over same-direction Kal boxes on one entity, applied after all Kal boxes for that entity are known, moving both the box and its owning edge's anchor).
- owner: this mission
- confidence: HIGH (mechanism identified by code read + T15's own prior flag; X-shift magnitude not independently re-derived from `LineOfSegments`' exact algorithm, so MEDIUM on the precise numeric prediction, HIGH on the mechanism identity)

### xoxega-30-vuju324
- mechanism-id: Q-2, Q-7 — same shape as rilali (3 DOWN Kal boxes on `top`, one long-text qualifier). Not independently re-probed past puml-shape match; same confidence rationale.

### goloxu-09-nero458
- mechanism-id: Q-2, Q-7 — same shape, 2 DOWN Kal boxes on `top` (still overlapping candidates). Not independently re-probed; same confidence rationale.

### ririlu-13-zipi740
- mechanism-id: Q-2 (dominant); Q-7 possible but unconfirmed
- mechanism: `HashMap<K,V>` carries 4 Kal boxes in 4 DIFFERENT directions (UP/RIGHT/DOWN/LEFT via `<|-u->`,`*.r.>`,`o.d.>`,`+-l->`) plus 3 more Kal-qualified links from `MoreComplex`. Since each direction has only one Kal per entity, `fixOverlap` (Q-7) likely does not trigger for the HashMap group; Q-2 (unconditional endpoint-only shift, missing control-point companion shift) is the confirmed shared cause (subset fixture coxose, below, isolates it).
- probe: not independently run (large 449-numeric fixture); inferred from coxose's isolated 4-link subset (identical `HashMap [a1]...[d4]` block) plus the 3 extra `MoreComplex` links, same puml family.
- ruled out: not yet ruled in/out for `fixOverlap` involvement on the 3 `MoreComplex` links (all different Kal texts and possibly different directions per its `[x: String]`/`[y: int]`/`[z: boolean]` — needs a probe if picked up as a fix target).
- owner: this mission
- confidence: MEDIUM (Q-2 dominant mechanism inferred from the coxose subset, not independently isolated on ririlu itself)

### coxose-20-nifu136
- mechanism-id: Q-2, Q-3
- mechanism: `HashMap<K,V>` with 4 Kal boxes in 4 distinct directions, each end WITH an arrowhead decor (`<|`,`*`,`o`,`+`). Q-2's missing control-point companion shift reproduces on all 4 links (Δ≈16 × 4, matching each Kal box's own dimension). A secondary Δ0.325 box-position shift on the HashMap node itself matches Q-3's family (sub-pixel shift unrelated to Kal direction).
- probe: `render-diff` numeric list — 8 entries at Δ≈16 (15.999–16.005, one pair per Kal-qualified link since both a control point AND, on the reversed link, a mirrored index land near 16), plus a leading `rect[1]/@x` Δ0.325 (Q-3 family).
- ruled out: not `fixOverlap`/Q-7 — all 4 Kal boxes are on DIFFERENT sides (UP/RIGHT/DOWN/LEFT) of the same entity, so no same-direction pair exists to overlap.
- owner: this mission (Q-2); undetermined (Q-3)
- confidence: HIGH (Q-2, probe-verified Δ16 cluster); LOW (Q-3)

### mucoti-34-seve858
- mechanism-id: Q-8
- mechanism: a `minlen=0` FLAT (same-rank) edge; `@knowvah/dot-engine` ignores the `PORT="h"` on the HTML-table shield node for a flat edge (honors it on a ranked edge), anchoring on the node's bounding box instead of the port cell — confirmed against real graphviz 16.1.0 fed the SAME cached oracle DOT bytes, which anchors correctly.
- java: n/a (dot-engine defect, not a plantuml-ts port gap)
- ts: n/a
- causal chain: the DOT layout itself (not our TS) places the spline endpoint wrong for this specific `minlen=0`+HTML-port combination.
- ruled out: not a plantuml-ts porting gap — T15 (row 53) already isolated this with a controlled `dot -Tplain` experiment against real graphviz.
- probe: already on file, `docs/graphviz-issues/19-flat-edge-ignores-html-table-port.md` + TRACKER line 19 (T15, 2026-09-22); re-confirmed current (`structural-match, 0, 94` in `fixtures.md`, unchanged verdict).
- fix shape: none in this mission — dot-engine issue, not compensated.
- owner: dot-engine (already filed)
- confidence: HIGH (T15's own controlled experiment, re-verified current in `fixtures.md`)

### sefazi-02-defe499
- mechanism-id: Q-8 — mirror of mucoti (`class1 - [Qualifier] class2`, single-char `-` arrow, also a flat/`minlen=0` edge per T15's own note that both mucoti and sefazi use single-char arrows). Not independently re-probed; same confidence rationale (T15-documented, current verdict unchanged: `structural-match, 0, 53`).

### vuzoro-99-kizi978
- mechanism-id: Q-2, Q-7
- mechanism: `class1` carries TWO DOWN-direction Kal boxes (`[Qualifier2]`, `[Qualifier3]`, on two separate links to class2/class3) — the same same-direction-overlap shape as rilali/xoxega/goloxu, just with 2 boxes instead of 3.
- probe: not independently re-run; puml-shape match to rilali's confirmed mechanism (2 vs 3 overlapping DOWN boxes on one entity).
- owner: this mission
- confidence: MEDIUM (mechanism identity inferred from puml-shape match to rilali, not independently probed on vuzoro's own SVG)

### nenepe-70-keri784
- mechanism-id: Q-6
- mechanism: unresolved. `CC::USA --> users::3` is a bare member-port-to-member-port association with NO label text. `svg/@width`/`@viewBox[2]` are 3px too narrow; ZERO ink-position diffs (every drawn coordinate — path, control points, arrowhead polygon — matches jar within rounding).
- java: not yet located — candidate `cucadiagram/CucaDiagram.java#getDefaultMargins` / `SvekResult`'s canvas-dimension computation, unconfirmed.
- ts: not yet located — candidate `src/diagrams/class/layout-ink-extent.ts#computeClassDocumentDims`.
- causal chain: unknown. The rightmost drawn ink (the edge's own bezier control point, jar 118.72 / ours 118.724, effectively identical) is captured correctly by both renders, so this is not a missing-ink-point bug; the discrepancy must be in the MARGIN or ROUNDING step converting ink-box extent to canvas dimension, specific to this edge/anchor shape, not yet isolated to one constant.
- ruled out: not a missing ink point (`e.points`, `e.arrowGlyph` all present and matching within 0.005px); not `class-ink-box.ts`'s label/role walk (this edge has no label, quantifier, or role at all — `Q-9`'s cause does not apply here, confirmed by T35's own prior note "no label... ruled out by construction, a different mechanism").
- probe: `python3` regex diff of `<g class="link">` between `nenepe-70-keri784.{jar,ours}.svg` — path/polygon coordinates match to 0.005px; only `@width`/`@viewBox[2]` differ (Δ3).
- fix shape: not yet determined — needs a probe into `computeClassDocumentDims`'s margin/quirk arithmetic for a `portRows`-anchored, label-less edge, and a comparison against `GraphvizImageBuilder.java`'s own canvas-size computation for the same shape.
- owner: undetermined (this mission, pending further isolation)
- confidence: LOW (root cause not yet isolated; what's ruled out is solid)

### pegeso-72-mana305
- mechanism-id: Q-6 — identical shape (`table2::foreignkey --> table1::id`, bare member-port association, no label), identical `0 structural / 2 numeric (@width/@viewBox Δ3)` signature to nenepe. Not independently re-probed past the signature and puml-shape match; same open status.

### nenexe-35-zere033
- mechanism-id: Q-9
- mechanism: `class-ink-box.ts#buildInkBox`'s edge loop walks `e.points`, `[e.label, e.tailLabel, e.headLabel, ...e.labelLines]`, `addEdgeLabelMarginInk`, `addMultiLineLabelMarginInk`, and `e.arrowGlyph`/`labelLines[].glyph` — but never reads `e.roleLines`, the field `class-edge-role-label-anchor.ts` populates for T17's "additive role label" (an end that carries BOTH a quantifier and a role, e.g. `"owner"/"1"`). So the role text's own ink extent (here, the rightmost element, `items` at x=47.43+31.038=78.47) is never accounted for in the canvas-dimension walk, even though it IS drawn at the byte-correct position.
- java: `svek/SvekEdge.java:1029-1063 drawRoleLabel` (already ported, T17); canvas dims via jar's own `LimitFinder`, which sees every drawn `TextBlock` including the role label (no upstream omission — it draws through the same generic draw-tracing mechanism as every other primitive).
- ts: `src/diagrams/class/class-ink-box.ts` (edge loop, ~lines 390-420: missing a `for (const lbl of ...) addEdgeTextInk(...)` arm for `e.roleLines`); field defined at `src/diagrams/class/class-edge-role-label-anchor.ts:259` / `class-geo-types.ts:389 roleLines?: RoleLinesGeo`.
- causal chain: the role-label `<text>` elements ARE drawn at the correct position (confirmed byte-identical to jar), but `buildInkBox` (which BOTH `computeClassDocumentDims` and `computeClassInkShift` consume) never visits `e.roleLines`, so the canvas width/height is computed as if those `<text>` elements did not exist — under-sizing the canvas by exactly the role label's own excess reach past the already-counted elements (here, 2px).
- ruled out: not a drawing-position bug (SVG text coordinates match jar to 0.001px, 0 structural/positional diffs); not Q-6's mechanism (that fixture has NO role/label text at all, ruling out any shared cause).
- probe: `render-diff` (0 structural, 2 numeric, `@width`/`@viewBox` Δ2 only); direct SVG text-node comparison of both `<g class="link">` blocks (`nenexe-35-zere033.{jar,ours}.svg`) — all four `<text>` elements match within 0.002px; `grep -n role src/diagrams/class/class-ink-box.ts` (zero hits) vs `grep -n roleLines src/diagrams/class/class-edge-role-label-anchor.ts:259` (field exists, populated, never consumed by the ink walk).
- fix shape: add a `roleLines` arm to `class-ink-box.ts#buildInkBox`'s edge loop, mirroring the existing `labelLines` arm (`for (const line of [...e.roleLines?.[0] ?? [], ...e.roleLines?.[1] ?? []]) addEdgeTextInk(box, line)` or equivalent, matching `RoleLinesGeo`'s actual shape).
- owner: this mission
- confidence: HIGH (probe-verified: drawn content matches exactly, only the canvas-walk omission remains, confirmed by direct grep of the consuming file)

### mugobo-34-fede498
- mechanism-id: Q-9 — identical mechanism to nenexe (`User "owner which is very long"/1 -- "0..n"/items Item`, same role-slash shape, 0 structural / 2 numeric `@width` Δ2). Not independently re-probed past the puml-shape and signature match; same confidence rationale.

### camuna-58-veca254
- mechanism-id: Q-2, Q-4, Q-5, Q-10
- mechanism: (Q-4) `<style> class { generic { BackgroundColor purple } } }` is not wired — `renderGenericTag` hardcodes `GENERIC_TAG_BACKGROUND = '#FFFFFF'` and `stroke: theme.colors.border`, never consulting the `{root,element,classDiagram,class_,generic}` style signature, so `Map<K,V>`/`HashMap<Long,Customer>`'s generic-tag box fills white instead of purple (2 structural diffs). (Q-5) `<style> arrow { cardinality { FontSize 10; FontStyle italic; FontColor red } } }` is not wired — `class-dot-graph.ts:334`/`layout.ts:311` build `cardinalityFont` purely from `theme.cardinalityFontFamily!`/`cardinalityFontSize!` (theme defaults), never consulting the `{root,element,classDiagram,arrow,cardinality}` style signature, so cardinality/quantifier text draws at 13px non-italic instead of 10px italic (6 structural diffs: 3 labels × font-size + font-style). (Q-2) the g[6] arrow path shows the same Δ16 control-point signature as baneru. (Q-10) a large, unexplained Δ31/Δ37 cascading shift on `g[1]/g3` (a downstream entity's badge/text) — same magnitude and shape as rifuzu's IDENTICAL cascade on a puml WITHOUT any `<style>` override, ruling out Q-4/Q-5 as its cause (see rifuzu).
- java: `svek/image/EntityImageClassHeader.java:138-149` (Q-4, `StyleSignatureBasic.of(root,element,classDiagram,class_,generic)`); `svek/GraphvizImageBuilder.java:124-131,235-241` (Q-5, `getStyleArrowCardinality`, merged style feeding `cardinalityFont`)
- ts: `src/diagrams/class/renderer-classifier-badge-tag.ts:195-225 renderGenericTag` (Q-4, doc comment at that file's own header EXPLICITLY records this exact gap, citing camuna, as a known unfixed follow-up); `src/diagrams/class/class-dot-graph.ts:334`, `src/diagrams/class/layout.ts:311` (Q-5, theme-only `cardinalityFont` construction, no style-cascade lookup)
- causal chain: (Q-4) the generic-tag box's fill/border colors are hardcoded constants instead of resolved through the style cascade, so any `<style>`-block override is silently dropped. (Q-5) `cardinalityFont` is built once from theme defaults with no per-render style-cascade merge, so an `arrow.cardinality` block's `FontSize`/`FontStyle`/`FontColor` never reach the drawn quantifier/role text.
- ruled out: (Q-10) not Q-4/Q-5 — rifuzu reproduces the SAME Δ30.996-30.997/Δ37.496-ish cascade with NO `<style>` block at all, at the same magnitude, so the cascade's cause is present even under fully default styling.
- probe: `render-diff` structural list (`rect[2]/@fill exp=#800080|act=#FFF` ×2, `text/@font-size exp=10|act=13` + `@font-style exp=italic|act=` ×3); puml source (`in.puml`) confirms both `<style>` block clauses map exactly to the two missing mechanisms.
- fix shape: (Q-4) resolve `class.generic`'s `BackGroundColor`/`LineColor` via the existing style-cascade machinery (`style-cascade-class-snames.ts`/`style-cascade-class.ts` pattern) before `renderGenericTag` draws. (Q-5) thread a style-cascade lookup for `{root,element,classDiagram,arrow,cardinality}` into `cardinalityFont`'s construction (`class-dot-graph.ts`/`layout.ts`), adding `FontStyle`/`FontColor` fields alongside the existing family/size. (Q-10) unresolved, needs isolation first.
- owner: this mission (Q-2, Q-4, Q-5); undetermined (Q-10)
- confidence: Q-4 HIGH (self-documented gap in the code, jar-cited); Q-5 HIGH (clean code read both sides); Q-2 MEDIUM (signature match, not independently re-diffed on this specific fixture beyond the one Δ16 line spotted); Q-10 LOW (not isolated)

### nafiki-56-jixu680
- mechanism-id: Q-2, Q-4, Q-5, Q-10 — near-identical puml/`<style>` shape to camuna (8 structural: 2 fill + 6 font, matching Q-4+Q-5 exactly), same cascade magnitude. Not independently re-probed for Q-2's Δ16 line or Q-10's exact cascade values beyond the structural-diff match; same confidence rationale as camuna.

### rifuzu-80-nixo780
- mechanism-id: Q-2, Q-3, Q-10
- mechanism: SAME entity/link shape as camuna/nafiki (`interface Map<K,V>`, `class HashMap<Long,Customer>`, one qualifier-port and one bracket-qualifier link) but with NO `<style>` block. 0 structural diffs (default styling already matches jar), but the SAME Δ30.996-30.997 / Δ37.496 cascading shift on an entity's badge/text as camuna/nafiki appears here too — proving this cascade's root cause is independent of the `<style>`-driven Q-4/Q-5 gaps (present with or without the style overrides, identical magnitude).
- java: not yet located — candidate `svek/image/EntityImageClassHeader.java` (generic-tag sizing, distinct from its colour-styling code at :138-149) or the cardinality-box's own default width computation.
- ts: not yet located — candidate `src/diagrams/class/class-stereotype-layout.ts#measureGenericTagDim`/`buildGenericTagGeo`.
- causal chain: unknown. Ruled out font-SIZE as the cascade's cause (0 structural diffs here means cardinality font already matches jar's default byte-for-byte), so the width/position divergence must come from a SIZE (not colour, not font) computation specific to a generic-typed classifier or its adjoining qualifier/cardinality boxes.
- ruled out: not Q-4 (fill colour, no `<style>` block present, so no override to fail to apply); not Q-5's font-size/style path specifically (0 structural diffs, meaning the font itself already renders identically) — though a WIDTH-only aspect of the same cardinality-box computation is not yet excluded.
- probe: `render-diff` (0 structural, 151 numeric, includes the identical Δ30.996-30.997 cluster and `@viewBox`/`@width` Δ2); puml source confirms no `<style>` block, ruling out Q-4/Q-5 as this fixture's cause for the cascade.
- fix shape: not yet determined — needs a probe comparing our emitted DOT node width for `HashMap<Long,Customer>`/`Map<K,V>` (or the cardinality/role box width) against `svek-N.dot`'s declared width for the SAME node, to locate which box's SIZE (not colour) diverges.
- owner: undetermined (this mission, pending further isolation)
- confidence: Q-2 MEDIUM (Δ16-family signature likely present given shared shape with camuna, not independently line-verified here); Q-3 LOW; Q-10 LOW (root cause not yet isolated — only the "not colour, not font-size" exclusion is solid)

---

## Fixtures not fully resolved (mechanism-id assigned but root cause open)
- nenepe-70-keri784 (Q-6): ruled out missing ink points; canvas-margin/rounding step not yet isolated to a line.
- pegeso-72-mana305 (Q-6): same as nenepe, not independently re-probed.
- rifuzu-80-nixo780 (Q-10 dominant): ruled out colour/font-size as cause via the no-style-block control; size-driving computation not yet isolated.
- camuna-58-veca254 / nafiki-56-jixu680 (Q-10 component only — Q-2/Q-4/Q-5 ARE resolved): the Δ31/Δ37 cascade shares rifuzu's open Q-10 mechanism.
- ririlu-13-zipi740: Q-2 inferred from the coxose subset, not independently probed on its own SVG; `fixOverlap`/Q-7 applicability to its 3 `MoreComplex` links unconfirmed.
