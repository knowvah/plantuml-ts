# T2 report (dur/T2, base f7f152d95)

## Commit
- 1c424dc4e `fix(core): wrap each description text run and inline atom in its url` (single commit; OpenIconic included in it, no second commit)
- Files: src/core/klimt/creole/atom/Atom.ts (inline `url?`), src/core/klimt/creole/legacy/StripeSimple.ts (stamp activeUrl on inline atoms, :230 site only), src/core/annotations/blocks-creole-atoms.ts (export `urlCapable` + `UrlCapableUGraphic`, no behaviour change), src/core/svek/image/EntityImageDescriptionTextBlock.ts (`drawWithAtomUrl`, `drawResolvedInline` extracted unchanged, `drawAtoms` wraps text + inline), src/core/svek/image/EntityImageDescriptionDelegates.ts (descAtomOps text + inline wrap; `drawResolvedInline` extracted unchanged; `openIconicOf` delegating to the existing `atom/AtomOpenIconic.ts` port), docs/catalog.md (regenerated).
- Tests (new): tests/unit/core/klimt/creole/legacy/StripeSimple.inline-url.test.ts, tests/unit/core/svek/image/EntityImageDescriptionTextBlock.url.test.ts, tests/unit/description/url-wrappers.test.ts (+ fixtures/dur-t2-no-url.svg captured at base = byte-identity pin).
- Step 5 deviation: NOT done in `creole-atoms-image-resolver.ts:469` (resolver sees only the token: no ambientFont/url, so the glyph would be black instead of the hyperlink #00F and a url's forced colour could not be dropped). Done instead at the AtomOps seam in Delegates (write-set file) where the full CreoleAtom is visible. Resolver line 469 untouched.

## Mechanisms (diagnosis artifacts)
### M1 - no `<a>` around description text runs / inline atoms
- Mechanism: both description drawers drew url-bearing atoms with no startUrl/closeUrl.
- Origin: Java AtomText.java:197-198 (startUrl), :235-236 (closeUrl); AtomSprite.java:75/79; AtomImg.java:248/254; AtomOpenIconic.java:78/82; UGraphicSvg.java:160-162 -> SvgGraphics.openLink :1228-1240 (never nests). Port: EntityImageDescriptionDelegates.ts descAtomOps.drawU (text branch, inline tail); EntityImageDescriptionTextBlock.ts drawAtoms.
- Chain: creole layer stamped url on text atoms only (StripeSimple flushPending) -> drawers ignored it -> jar's `<a>` absent. Inline atoms inside `[[url ...]]` had no url at all (Atom.ts inline variant, StripeSimple:230).
- Ruled out: legend drawer reroute / TextBlockWithUrl (D2); nested `<a>` (jar max depth 1; svg-graphics.ts:181-197 same port); class/object/state reach (T0b trace: byte-identical, and surveys below move 0 rows).
### M2 - `<&glyph>` not measured/drawn in description entity labels
- Mechanism: `makeAtomImageResolverFor` returns undefined for openiconic (creole-atoms-image-resolver.ts:469) -> descAtomOps measured 0x0 and drew nothing.
- Origin: Java AtomOpenIconic.java:63-82 (dim = withMargin(1,0), altitude -3*factor, drawU). Port: Delegates descAtomOps (`openIconicOf`).
- Chain: vivido ent0003 rect width 256.95 vs 268.283 (= 8*14/12+2 = 11.333 short) and missing path. Fixed: width now exact.
- Url case: AtomTextUtils.java:113-117 `new AtomOpenIconic(null, scale, openIcon, fontConfiguration, url)` - forced colour dropped, hyperlink font colour (#00F) used; `openIconicOf` strips forcedColor when a url is present.
- Ruled out: glyph dims differ per glyph (arrow-left.svg and cloud.svg both width=8 height=8, OpenIconic.java:175-179).

## Render-diff (structural/numeric) before -> after
(before = base source; jajeve/bivira "before" totals from T0b since my tail cut their headers)
| row | before | after |
|---|---|---|
| unknown/gubexu-05-dufu787 | S1 N0 | **pass 0/0** |
| component/nevuzi-33-duna992 | S1 N2 | S0 N2 (width/viewBox +1: pre-existing) |
| usecase/malumi-33-safu797 | S1 N0 | **pass 0/0** |
| component/xufexu-38-fola855 | S2 N0 | **pass 0/0** |
| component/tuliba-37-liza126 | S2 N4 | S1 N4 (rx/ry 12.5 vs 2.5 x4, note @id GMN7-F1 vs __note_0-F1: pre-existing, not url) |
| unknown/jobuje-80-mopu051 | S4 N0 | S3 N0 (note text @fill exp #FFF act #000 x2; note `<a>` text fill exp #0FF act #00F: note hyperlink colour, separate defect) |
| unknown/jajeve-56-poza115 | 196 total (T0b) | S24 N178 = 202 (matches T0b prediction) |
| usecase/bivira-53-boja685 | 29 total (T0b) | S1 N28 = 29 |
| usecase/vivido-49-nisu863 | S7 N1 | S0 N25 (all `<a>` and glyph-presence diffs gone; residual below) |
- jajeve 196->202 confirmed pre-existing: first diff `svg/g[1]/g[1]/@id exp=ent0001 act=ent0003` - our entity draw order differs from the jar, so the now-present `a[1]` is compared against the wrong entity (href adaptation vs transparency). The 3 `<a>`s themselves are correct.
- bivira: both text-run and sprite-in-url `<a>` now match; remaining S1 N28: link lnk4 g[4] childCount exp=4 act=3 and text y exp=52.111 act=17.5: SvekEdge.ts:305-321 un-tabled `UText.build` branch is taken (label w/h unset) so the `<$maxime>` sprite in the edge label is not drawn and the label sits at the wrong y; the other 27 N are the 0.389 y shift that follows from it. Not in write-set; not touched.
- vivido residual (25 N): url label is ONE `AtomHorizontalTexts` in the jar (AtomTextUtils.java:96-130 createAtomTextForUrl -> AtomHorizontalTexts.java:63-75: children drawn at `startingAltitude - localStartingAltitude`, block height = max of children, text at block top + ascent 10.889). Port flattens the label into sibling atoms of the line and Sea baseline-aligns them. Evidence: jar text y = image y + 10.889 in both ent0001 (131.141 = 120.252+10.889) and ent0002 (114.581 = 103.692+10.889); ours baseline-aligned (132.021, 148.581); glyph 2.334 (= 2*factor) higher than jar. The `<a>` per atom wrapping itself is identical. Fix would be a composite url atom in StripeSimple (in write-set but a geometry/sizer change; not started).

## Surveys (before -> after), `--out` form only
before2 re-run for component/usecase/class/unknown because first "before" pass ran concurrently with render-diff and recorded timeouts (artifact). Reported numbers use before2 for those four.
- class 723: conformant 723 -> 723, 0 movers
- object 80: 63/9/8 -> 63/9/8, 0 movers
- state 273: conformant 78 -> 78 (184 diverged, 11 structural-match), 0 movers
- c4 11: 2 conformant -> 2, 0 movers
- component 266: conformant 180->181, structural-match 12->13, diverged 74->72. Movers: xufexu-38-fola855 diverged->conformant; nevuzi-33-duna992 diverged->structural-match; tuliba-37-liza126 verdict unchanged (firstDiff moved).
- usecase 94: conformant 58->59, structural-match 2->4, diverged 33->30. Movers: malumi-33-safu797 ->conformant; vivido-49-nisu863 ->structural-match (maxDelta 11.333 -> 34.0 on the flatten residual); ridola-99-jija391 ->structural-match (non-url `<&arrow-left>`, maxDelta 8.658->2.309); bivira unchanged verdict, firstDiff moved.
- unknown 825: conformant 483->486, diverged 326->323. Movers: gubexu-05-dufu787 ->conformant; cakutu-40-lece271 ->conformant and nixeka-00-nuni016 ->conformant (both non-url `<&icon>`, glyph width 11.333 now measured); pacope-41-pufu938 stays diverged (maxDelta 11.333->5.667); jobuje firstDiff moved.
- Conformant losses: 0 in all 7 trees. Non-url `<&icon>` movers: cakutu, nixeka (->conformant), ridola, pacope (closer). Jar probe (scripts/oracle-render.sh, `usecase "a <&cloud> b"` + `rectangle "x <&cloud> y"`) compares pass true.

## Guards (D7) - all green
tests/oracle/svg-conformance/{class,object,state,description}.golden.ratchet.test.ts, tests/oracle/{class,object,state}-dot-parity.test.ts, tests/oracle/wrapper-parity.test.ts (the only wrapper-parity file), tests/oracle/svg-conformance/layout-parity.ratchet.test.ts (489), tests/architecture/*. Targeted run: `Test Files 169 passed (169)`, `Tests 6230 passed | 3 expected fail` (includes tests/unit/core/klimt/creole, tests/unit/core/svek, tests/unit/description). `npm run typecheck`, eslint, prettier clean. Full `npm test` not run.

## Residuals
1. Url label flattened vs jar `AtomHorizontalTexts` (above): vivido y offsets, glyph 2.334 y.
2. Stereotype/edge-label glyphs: `EntityImageDescriptionTextBlock.ts` `drawAtoms`/`measureAtomsWidthHeight` still resolve `<&glyph>` through the resolver (undefined): pacope g[3] childCount 6 vs 5 and g[6] 4 vs 3, text x +5.667 (the `<< <&file> >>` stereotype row). Needs the same AtomOpenIconic delegation on that path (measure + draw together) or the resolver port; not done (measure/draw must move together).
3. ridola-99-jija391 `(<&arrow-left> test)`: residual 26 N (ellipse rx -0.889, ry -0.33, glyph x +2.309, @height 43 vs 44). Mechanism NOT isolated. Ruled out: glyph size (8x8 like cloud). The two-leaf cloud probe with text before the glyph matches the jar exactly, so the leading-glyph / first-atom line case is the suspect; next instrument: Sea line height/width for a glyph-first line vs the jar.
4. jajeve ent draw order (pre-existing), jobuje note colours, tuliba rx/ry and note id, nevuzi width +1 (all pre-existing, unrelated to url wrap).
5. bivira SvekEdge un-tabled label branch (SvekEdge.ts:305-321), not in write-set.
6. Qrcode inline atom (StripeSimple:174) deliberately not stamped: jar's createAtomTextForUrl has no qrcode pattern.
- Write-set extensions: none beyond the listed files; `creole-atoms-image-resolver.ts` unedited.
