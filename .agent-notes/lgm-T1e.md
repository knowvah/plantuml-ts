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
