# lgm-T1e — embedded {{ }} slots sized by the jar's SVG arm

## Commits (branch lgm/T1e)
- e77ce84f1 wip: names the class sizing sites
- 7c9807b3d fix(embed): description slot by SVG arm (EmbeddedDiagram.ts doc, EntityImageDescriptionEmbed.ts throw removed, leaf-sizing-folder.ts doc)
- b94854168 fix(class): body embeds sized + stacked by image height (class-body-enhanced-embeds.ts)
- b333452d0 fix(class): note embed rows sized by the registered renderer, one render shared with the drawn atom (note-layout-measure-rows.ts); jar fixtures + test
- (next) fix(embed): ink pass also draws the embed; (last) docs/notes

## Java -> ours
- EmbeddedDiagram.java:129-133 (SVG arm: UImageSvg width/height via UImageSvg.java:146-156 getWidth/getHeight, getData :118-146 ceil(viewBox)) ->
  the registered renderer's TextBlock (class-nested-diagram-renderer.ts:createNestedDiagramRenderer, already UImageSvg-sized);
  EmbeddedDiagram.ts#calculateDimensionSlow delegates; no per-engine copy. 42x42 (java:148-152) only on renderer failure.
- Seam #3 patch: FileFormat.java:185-194 StringBounderFromWidthTable.matchesProperty("SVG") = true. Same property reaches
  LimitFinder.java:99-100 (delegates to bounder) so the INK pass takes the SVG arm: LimitFinder#drawImageSvg :201-204
  (x+w-1, y+h-1) = LimitFinder.ts drawImage on the UImage the renderer draws. Removed the MeasurerStringBounder ink-skip
  in EntityImageDescriptionEmbed.ts (cdd6 T3b row 47 fitted the old false).
- Class family sites: class-body-enhanced-embeds.ts#stackEmbeds (sizing + y += height, MethodsOrFieldsArea.java:141-152,429-440),
  note-layout-measure-rows.ts#consumeEmbeddedRow.
- Other paths (activity/sequence/state/creole/chrome) already used the registered renderer's TextBlock = SVG-arm size.

## Fixtures before -> after (survey, b1o -> now)
Conformant: class gadufu, moxobo, zikabo, xadado-92-lazo250; unknown josebu, kelefe, komuvi, rozugu, tefeco; activity romuru-66-samu329.
Still structural-match: unknown rojida-14-fuli428 (maxDelta 182.7 -> 20; see below).
Jar-vs-ours embed slot (image w/h/x/y + canvas) equal for every stable re-captured fixture probed + 6 authored fixtures
(tests/fixtures/lgm-T1e, tests/unit/core/lgm-T1e-embedded-slot.test.ts). Non-deterministic 4 not claimed.
engdiff b1o -> after: movers=10 conformant-losses=0. Sequence scores byte-identical to b1o-seq.json. Elements away=0 toward=0.
No console.error stack on normal path (test asserts 0 calls).

## rojida-14-fuli428 — OPEN, mechanism (not in write-set)
Mechanism: SvekEdge.java:922-926,933-937 asks SvekNode#getMagneticBorder (SvekNode.java:486-492 -> image.getMagneticBorder ->
EntityImageDescription FOLDER -> USymbolFolder.java:242-266 getForceAt) for LEAF ends; edge ClientInterface->LibraryImplementation
ends at x=170.47, right of the 163.4 title tab (`position.x >= wtitle + marginTitleX3`) so the jar translates the end by
(0, htitle = 20): 331.771 -> 351.771 (arrow 335.54 -> 355.54). The class engine applies magnetic borders only to CLUSTERS
(class-edge-geo.ts:405 applyClusterMagneticBorders; class-shield-helpers.ts#clusterMagneticBorder). Origin: missing leaf arm.
b1 passed only because the 42x42 slot put the end inside the tab. Owner: class edge geo (class-edge-geo.ts / layout.ts).
Ruled out: slot size (images + canvas equal), ink gating (removing it moved nothing), box geometry (rects equal).

## Ratchet movers
class.golden.ratchet: unknown/rojida-14-fuli428 RISES (pinned zero-diff at b1o via the artefact; now 1 diff, delta 20 at
svg/g[1]/g[7]/path[1]/@d[5], mechanism above). All other ratchets run (class, description x2, activity x2, object, state): pass.
The 9 newly conformant rows are falls; re-pin by orchestrator.

## Orchestrator-only
- oracle/accepted-divergences.json: unknown/semutu-45-zeno907 entry (until: "oracle seam fixed...") expires: it is conformant at b1o and after.
- Stale 42x42 comments (not in write-set): src/diagrams/class/renderer-body-enhanced.ts:160, class-ink-shapes.ts:229-230,
  class-geo-builders.ts:356, class-ink-box.ts:170, note-layout-measure.ts:424, class-nested-diagram-renderer.ts (module doc
  "sizing/drawing asymmetry"), core/annotations/blocks-creole.ts:237. class-ink-* may hold compensation for an overflowing
  embed that no longer overflows; EmbeddedBlockGeo.sizingWidth/Height are now == width/height (class-scale-geo-body.ts reads them).

---
# Addendum (orchestrator extension): rojida, stale-42 audit, full rule-11

## Commits added
- 1f-: fix(class): apply the leaf arm of the svek magnetic border
- refactor(class): drop embed-overflow ink and sizing fields
- test/fixtures: unwind-U4 class-body + class-body-class jar renders re-captured with the new jar (one JVM each)

## rojida-14-fuli428 -> CONFORMANT (pinned golden zero-diff)
Java -> ours: SvekEdge.java:922-926,933-937 (node arm) -> SvekNode.java:486-492 (position.move(-minX,-minY)) ->
EntityImageDescription.java:362-366 (FOLDER only: asSmall.getMagneticBorder) -> USymbolFolder.java:185-209 (asSmall; :242-266 asBig = cluster).
Other overrides: IEntityImageUtils.java:103 and EntityImageDegenerated.java:95-101 only translate it; TextBlockUtils.java:177,
TextBlockTitle.java:93, TextBlockWithUrl.java:88, MethodsOrFieldsArea.java:296 delegate; no other USymbol overrides. So only
package/folder description leaves get a real force.
Ours: new src/diagrams/class/class-leaf-magnetic-border.ts (leafMagneticRects: builds the leaf's EntityImageDescription via
buildUSymbolEntityParams, now exported, keeps non-None borders); layout.ts passes it as EdgeGeoTextContext.leafMagnetic
(class-edge-label-attach.ts, 1 optional field); class-edge-geo.ts merges it with clusterRects ONLY for
applyClusterMagneticBorders (not for clipClusterEdgeEnds).
Subtlety (diagnosed with instrumented values, then fixed): the jar evaluates the force at `todraw`, which is dotPath AFTER the
extremity trim (SvekEdge.java:558-563,922-937). The first attempt used the untrimmed end (x=161.18) and landed in the
fractional zone (17.2 not 20). applyClusterMagneticBorders gained an `at` parameter (default = points => cluster behaviour
unchanged); class-edge-geo passes drawnEdgePoints(edgeGeo). Result: path byte-equal to the jar.
Description engine: not touched. Reaching the same path from description is a separate site (not inspected for a leaf arm).

## Stale-42 audit
- Removed (survey class/unknown/object identical with it disabled, then removed): class-ink-box.ts#drawnEnhancedBodyEmbeds /
  addEnhancedBodyEmbedInk / DrawnEmbedGeo, class-ink-shapes.ts#addEmbedImageInk, class-geo-builders.ts embedRight/embedBottom.
- Collapsed EmbeddedBlockGeo.sizingWidth/sizingHeight (class-body-enhanced-embeds.ts, -layout.ts, class-scale-geo-body.ts, its test).
- Comments fixed: class-ink-box.ts symbolInk sentinel, class-geo-builders.ts, note-layout-measure.ts.
- Kept (still true): renderer-body-enhanced.ts:160 and blocks-creole.ts:237 describe the render-FAILURE fallback only; EMBEDDED_FALLBACK_SIZE 42 for failure.
- Not touched: tests/unit/class/class-body-embedded-diagram-conformance.test.ts:195-210 documents the old asymmetry inside an expected-fail/todo text.

## Rule 11 (final tree) vs b1o
engdiff movers=11, conformant-losses=0 (the 10 earlier + unknown rojida-14). Sequence scores byte-identical. Elements away=0 toward=0.
tests/oracle (whole dir, --maxWorkers=4): 46 files pass; 5 files / 11 tests red, ALL jar-side stale pins, none port regressions:
- class-dot-parity xadado-92-lazo250; description-parity.ratchet kovaxi-11-reti348, zidebi-71-nocu387: compare against
  oracle/goldens/**/svek-1.dot captured with the OLD 42x42 oracle (node size drift 0.80in / 1.71in). Fix: re-capture those goldens (orchestrator).
- activity.style-baseline: bozido-07, fikuki-99, gufuma-85, mufixi-71, pufuzi-99 ("[jar]" census moved: golden re-captured in b92305594);
  activity.text-baseline: mufixi-71. Fix: re-pin oracle/goldens/svg-activity/{style,text}-baseline.json from a fresh measurement (orchestrator).
- unwind-u4-embedded class-body, class-body-class: were red from the stale jar svg; FIXED by re-rendering the two fixtures (green).
Falls to re-pin: the 11 newly conformant rows (class gadufu/moxobo/xadado/zikabo; unknown josebu/kelefe/komuvi/rojida/rozugu/tefeco;
activity romuru-66). class.golden.ratchet is green again (rojida stays zero-diff).
