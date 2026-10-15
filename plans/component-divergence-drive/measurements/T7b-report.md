# codd T7b report (branch codd/T7b, base ecdaea5b2)

## Commits (oldest first)
- 4f762f1a0 fix(description): align entity text from the style cascade (T6-B) -- leaf-sizing-entity.ts#titleAlignmentFor (shared), renderer-entity.ts
- bddbb2b08 fix(description): floor the drawn description at MinimumWidth (T6-E) -- renderer-entity.ts
- 3d726a7fc fix(description): centre cluster titles from the composite style (T6-C) -- renderer-cluster.ts, theme-element-resolve.ts#resolveClusterTitleAlignment
- 68b1b7ce8 fix(core): size stereotype text per label and floor runs at 10px (T6-D) -- usymbol-resolve.ts#stereotypeTextFont, EntityImageDescriptionTextBlock.ts (+ pure-move split to EntityImageDescriptionTextMeasure.ts, 500-line cap), renderer-entity/cluster
- 4072d6c4d fix(description): let a user root alignment beat the skin defaults (B/C correction from a jar probe)
- d1b4243f7 fix(description): build cluster titles through creole Display#create (T6-F) -- new core/svek/image/EntityImageDescriptionClusterTitle.ts, Delegates export of buildLocalSkinSimple
- 913af7703 fix(description): honour RoundCorner on entities and clusters (T10) -- theme-element-resolve.ts#resolveElementRoundCorner (+ SIZE_NEUTRAL row in tests/architecture/sizer-renderer-parity.test.ts)
- 2177608b0 fix(description): draw a container's inline colours (colour track) -- renderer-cluster.ts, renderer-color-override.ts#lineStyleStroke
- 8e4a1e864 fix(description): print the bare name in entity and cluster comments (coordinator must-fix; bareEntityName from namespace-groups.ts, test fails without it)
Each commit updates docs/catalog.md where exports changed.

## Render-diff (structural/numeric) before -> after
B: bitexe 0/5->0/0, butebe 0/1->0/0, gafico 0/1->0/0, tajadu 0/2->0/0, babafi 0/4->0/2 (T6-A residual), codabo 0/15->0/0, mejoxi 0/22->0/0, nujito 0/7->0/0, pepego 0/1->0/0, rigoge 0/3->0/0, saxosu 0/1->0/0, fasave 0/18->0/0, zonobi 0/8->0/0, usecase/fariba 0/11->0/0
C: cemutu, cuxeda, daxija, fopako, zusota, siseda 0/1..2->0/0; ruciga 5/103->5/5; perapa 0/13->0/12 (cluster-box x, not title)
D: golamo 11/15->7/0, loroto 2/20->0/0, toxine 2/20->0/0
E: dexigu 0/33->0/0, kenece 0/33->0/0, zifaji 0/29->0/0
F: rebena 4/11->0/0; vuvave 3/16->3/9 (T6-G); xipane 24/19->23/19 (T6-H)
T10: rimiku 0/2->0/0, xadinu 0/2->0/0; fuzula 2/0 and nufofe 4/0 unchanged (needs a T7a file); reroca 10/0->8/0
colour: xipane 24->23 structural (container fill now drawn; rest is T6-H); berufi 46/33->34/30

## Layout parity (survey layoutEqual/dotEqual, before -> after)
golamo F/F -> T/T (verdict diverged, maxDelta 0; only colour/dash residual); rebena F/F -> T/T, conformant; vuvave F/F -> F/F (bb 74x107 vs 74x111; T6-G newline sentinel); xipane F/F -> F/F (bb 230 vs 272 wide; T6-H quote parse). Also layoutEqual F->T: bujigu-81-nima035, joliva-50-vuva261, c4 favasu-27-fesa452, xizifu-87-siti076.

## Surveys (before from a clean checkout of ecdaea5b2, after = HEAD)
component conformant 127->157; usecase 38->52; unknown 450->472; c4 2->2; class 723->723; object 63->63; state 78->78. Worsened rows: 0 in every tree. Census (component --per-fixture): zero-diff 126->156, sum 3608->3114, 46 rows fell, 0 rose, no attribute family moved away.

## Diagnosis artifacts
- T6-B: mechanism renderer-entity.ts hard-coded titleAlignment CENTER; Java EntityImageDescription.java:175,188,191 (defaultAlign = styleTitle.getHorizontalAlignment()), plantuml.skin:12,452-454. Chain: multi-line desc centred where jar left. Ruled out: measurer (textLength equal). CORRECTION to T6: style declarations compete by PARSE ORDER (DarkString#mergeWith, ValueImpl via AutomaticCounter; skin loads first), not specificity. Jar probe (probe p1/p2): `skinparam defaultTextAlignment right|left` aligns usecase text and a rectangle cluster title right|left. So the cascade is own bucket, then root bucket, then skin default (usecase CENTER / LEFT), and for cluster titles own, root, CENTER. Implemented that (4072d6c4d). The class engine's private titleAlignmentFor (renderer-usymbol-entity-style.ts:101) still has the old "usecase beats root" shape and root-only for others; not edited (class file).
- T6-C: renderer-cluster.ts buildHeader defaulted LEFT and returned LEFT; Java ClusterHeader.java:121-128,151-163, plantuml.skin:93-99. Package/folder titles unchanged (USymbolFolder.java:228). ELK path still passes rootTextAlignment to buildHeader (description-elk-adapter.ts:331, sizing only; dims alignment-neutral) -- not mine, cosmetic.
- T6-D: part 1 textFont cannot see labels -> new stereotypeTextFont (sizer already used labels). Part 2 AtomText.java:179-181 clamp h<10 -> 10 while drawU :215 baseline uses raw height: measureLine returns height (clamped) + rawHeight; drawAtoms baseline = rawHeight - descent. D5 guards green.
- T6-E: renderer-entity.ts paint omitted minimumWidth (BodyEnhanced2.java:114-116).
- T6-F: Java ClusterHeader.java:128 -> Display#create -> SheetBlock2.java:99 stencil + CreoleHorizontalLine; port used buildTextBlock. New buildClusterTitle (same Display/ISkinSimple/AtomOps as BodyFactory.create3). An anonymous group is an empty Display (0x0); first attempt with [''] regressed cemutu's cloud and was caught by render-diff.
- T10 rimiku/xadinu: Java EntityImageDescription.java:167 / Cluster.java:321 read PName.RoundCorner; user declarations (skinparam componentRoundCorner, bare skinparam roundCorner via FromSkinparamToStyle.java:164, stored in graph.classCascadeRoundCorner) beat skin `element { RoundCorner 5 }` (plantuml.skin:193-197). Caveat: classCascadeRoundCorner is also fed by `<style> classDiagram { RoundCorner }`, which would leak into a component diagram (no fixture).
- colour: Cluster.java:312-319,402-408,683-692 + ClusterHeader.java:111: group Colors LINE/BACK/specific stroke/text were hard-coded null.

## Residuals / write-set extensions
1. fuzula-86-temo881, nufofe-18-xani887 (`skinparam arrowThickness 4`): description edges never read it. VERIFIED one-line fix, reverted because renderer-edge.ts is T7a's: at renderer-edge.ts:98 use `edge.styleThickness ?? theme.colors.graph.arrowThickness` for styleThickness (LinkType#getStroke3 default thickness); both rows go to 0/0 with it.
2. reroca-56-safi108 (`!theme carbon-gray`): `skinparam title { BorderThickness 0; BorderRoundCorner 8; BackgroundColor ... }` converts to style SName.title (FromSkinparamToStyle.java:169-175), which MATCHES every description entity's styleTitle signature {root, element, diagram, sname, title}; parse order lets it set LineThickness 0 (stroke omitted entirely) unless a later `component {}` overrides. The port parses no title* border/background skinparam at all. Needs a "title tier" in resolveElementLineThickness/Paint/RoundCorner plus parsing; judged a new feature for one row (8 diffs left).
3. golamo, berufi: stereotype-signed styles on description leaves/clusters (`rectangle<<boundary>> { BorderColor; FontColor; StereotypeFontColor; BorderStyle dashed }`, `rectangle { BackgroundColor<<white>> }`): the class engine resolves these (renderer-usymbol-entity-style.ts resolveLeafFonts/resolveStroke/elementLineStyle via fontByStereo, stereoTextFontByStereo, lineStyleByStereo, lineThicknessByStereo) but description does not, and clusters read no stereotype tier. Fix = hoist those resolvers into core (needs class-file edits) and call them from renderer-entity/renderer-cluster. Not done to avoid a third copy.
4. Sizer titleAlignment still ignores overrides (no BoxSizingOpts producer; layout-dot-tree.ts is T9's); only the {{ }} ink-walk embed position could differ under `defaultTextAlignment`.
5. vuvave: T6-G (%n() sentinel, parse-helpers-strings.ts); xipane: T6-H (embedded quote, parse-helpers.ts) and unchanged layout parity; ruciga 5/5, perapa 12 (cluster-box x), babafi 2 (T6-A) remain.
6. T6-A edge label centre vs corner untouched (T7a).
7. StereotypeFontColor wired nowhere (part of item 3).

## Tests
New: tests/unit/description/codd-t7b-{entity-text,entity-min-width,cluster-title-alignment,cluster-colours,scoped-id-name}.test.ts, tests/unit/core/decoration/stereotype-text-font.test.ts, tests/unit/core/svek/image/{EntityImageDescriptionTextBlock-min-height,EntityImageDescriptionClusterTitle}.test.ts. Final targeted run (D5 guards: class/object/state golden ratchets + dot-parity, wrapper-parity, layout-parity ratchet; description.* conformance; lgm-t1c-svek-chrome; tests/architecture; tests/unit/description; tests/unit/core): 466 files collected, 11080 passed, 7 expected-fail, 1 skipped, 0 failed. typecheck, eslint, prettier clean per commit. No ratchet/baseline files edited; one architecture test edit (SIZE_NEUTRAL row for resolveElementRoundCorner, text from planning/sizer-renderer-parity.md:64).
