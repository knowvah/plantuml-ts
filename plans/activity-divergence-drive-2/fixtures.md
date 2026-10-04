# Row ledger: add2

Written by T0a at b0 (branch `feat/activity-divergence-drive-2`, 2026-10-02).
Rows = cohort (un-pinned `baseline`, ws <= 150 at b0: 164 rows) ∪ add1's 67
`open -> add2` rows (0 of them above ws 150, 0 not `baseline`) ∪ the 38
parse `error` rows = 164 baseline rows + 38 error rows.
b0 = `measurements/b0.json` (Σ 31366 over 245 rows, identical to planning);
element shape from `measurements/b0-elements.json` (`ours − jar` per tag).
`final` ∈ `pinned (<tag>)` · `open -> add3 (<mechanism>)`.

## Baseline rows

| slug | ws (b0) | element shape (b0) | add1 mechanism | task | mechanism | final |
|---|---|---|---|---|---|---|
| molexa-46-redi999 | 1 | exact {} | skinparam defaultTextAlignment center in action text; residual per journal row 40 | T2c | T2c 1->0 | pinned (add2-b2) |
| pekuxe-00-bovi270 | 1 | exact {} | creole [[url{tip}label]] in action text; residual per journal row 40 |  |  | pinned (add2-b3) |
| setecu-78-cuko533 | 1 | exact {} | preserveAspectRatio hardcoded in src/core/klimt/document-shell.ts:197 (stop 8) | T2d | document-shell.ts/dispatcher.ts now thread `preserveAspectRatio` (default `SkinParam.java:119`, cascade `TextBlockExporter.java:380-386`); no `Theme` field exists to carry `skinparam preserveaspectratio` (`SkinParam.java:1086-1088`) into it -- that's a new skinparam key handler + `Theme` field, T2d's write-set excludes `core/theme.ts`/skinparam handlers | pinned (add2-b3w1) |
| begivo-34-sicu289 | 2 | exact {} |  |  |  | pinned (add2-b3w1) |
| biguku-39-voxu233 | 2 | exact {} | repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| bixefi-77-moki051 | 2 | exact {} |  |  |  | pinned (add2-b3w1) |
| cufega-65-beji958 | 2 | exact {} | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37 |  |  | pinned (add2-b3w1) |
| dupopo-44-deto131 | 2 | exact {} |  |  |  | pinned (add2-b3w1) |
| farexi-86-xanu521 | 2 | exact {} | ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153); residual per journal row 41 | T2c | T2c 2->0 | pinned (add2-b2) |
| firibi-00-puki721 | 2 | exact {} |  |  |  | pinned (add2-b3w1) |
| fomapa-90-bore251 | 2 | exact {} | assembly gap 35 (FtileFactoryDelegatorAssembly.java:58) then ON_Y compression; NODE_MARGIN_Y=20 is unsourced; residual per journal row 38 |  |  | pinned (add2-b3w1) |
| gaxezi-48-zesa921 | 2 | exact {} | creole [[url{tip}label]] in action text; residual per journal row 40 |  |  | pinned (add2-b3) |
| gugala-11-suce270 | 2 | exact {} |  |  |  | pinned (add2-b3w1) |
| jakuco-69-dari135 | 2 | exact {} | swimlane title band height (+1..2 y, title text metrics); residual per journal row 45 |  |  | pinned (add2-b3w1) |
| letare-59-gore448 | 2 | exact {} | title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory); residual per journal row 36/49/52 |  |  | open -> add3 (ws 2, exact, top svg/g[]/g[]/text[]/@y 2; H: AtomText.java:179-181; Sea.java:72-79) |
| misiji-27-buje656 | 2 | exact {} |  |  |  | pinned (add2-b3w1) |
| nisexe-68-vabu320 | 2 | exact {} | creole [[url{tip}label]] in action text; residual per journal row 40 |  |  | pinned (add2-b3) |
| noxasi-06-nejo322 | 2 | exact {} |  |  |  | pinned (add2-b3w1) |
| pakema-21-xema183 | 2 | exact {} | swimlane title band height (+1..2 y, title text metrics); residual per journal row 45 |  |  | pinned (add2-b3w1) |
| patagi-39-jone354 | 2 | exact {} | swimlane title band height (+1..2 y, title text metrics); residual per journal row 45 |  |  | pinned (add2-b3w1) |
| povoju-50-raxi136 | 2 | exact {} | swimlane title band height (+1..2 y, title text metrics); residual per journal row 45 |  |  | pinned (add2-b3w1) |
| raruzu-62-giro837 | 2 | exact {} |  |  |  | pinned (add2-b3w1) |
| sikino-19-vuca111 | 2 | exact {} | swimlane title band height (+1..2 y, title text metrics); residual per journal row 45 |  |  | pinned (add2-b3w1) |
| sucice-41-pebi088 | 2 | exact {} |  |  |  | pinned (add2-b3w1) |
| tefuga-86-xefe850 | 2 | exact {} | swimlane title band height (+1..2 y, title text metrics); residual per journal row 45 |  |  | pinned (add2-b3w1) |
| zamagu-75-vape137 | 2 | exact {} | creole [[url{tip}label]] in action text; residual per journal row 40 | T2c | T2c 2->0 | pinned (add2-b2) |
| zanudo-86-seco241 | 2 | exact {} | ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153); residual per journal row 41 | T2c | T2c 2->0 | pinned (add2-b2) |
| ziboco-73-kazu841 | 2 | exact {} | repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| fofele-65-lozo631 | 3 | exact {} | ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153); residual per journal row 41 | T2c | T2c 3->0 | pinned (add2-b2) |
| livigo-47-negi605 | 3 | exact {} | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37 |  |  | pinned (add2-b3w1) |
| naroji-40-nuke022 | 3 | exact {} | ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153); residual per journal row 41 | T2c | T2c 3->0 | pinned (add2-b2) |
| nusajo-97-bemo713 | 3 | exact {} | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37 |  |  | pinned (add2-b3w1) |
| becanu-19-diti597 | 4 | exact {} |  |  |  | pinned (add2-b3w1) |
| cagoze-40-tete366 | 4 | exact {} | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| lacuci-13-nogo718 | 4 | exact {} | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| megara-21-rumi574 | 4 | exact {} |  |  |  | pinned (add2-b3w1) |
| pedoco-30-mose082 | 4 | exact {} | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| pujozo-36-nino158 | 4 | exact {} |  |  |  | pinned (add2-b3w1) |
| rerovo-62-nazo755 | 4 | exact {} | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| rosizo-69-mera514 | 4 | exact {} | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| secepo-00-febi326 | 4 | exact {} | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| tamaxe-36-mono574 | 4 | exact {} | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| vidada-17-xuse810 | 4 | exact {} |  |  |  | pinned (add2-b3) |
| xarumo-26-zinu467 | 4 | exact {} |  |  |  | pinned (add2-b3w1) |
| ribapo-84-xudu593 | 5 | exact {} | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37 |  |  | pinned (add2-b3w1) |
| sopape-11-laxo488 | 5 | exact {} | swimlane title band height (+1..2 y, title text metrics); residual per journal row 45 |  |  | pinned (add2-b3w1) |
| bideta-97-cezo697 | 6 | exact {} |  |  |  | pinned (add2-b3w1) |
| guceja-66-tola192 | 6 | exact {} | repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| kudedo-31-pafi082 | 6 | exact {} |  |  |  | pinned (add2-b3w1) |
| movexa-27-rexe388 | 6 | exact {} |  |  |  | pinned (add2-b3w1) |
| bumaca-51-kece901 | 8 | exact {} |  |  |  | pinned (add2-b3w1) |
| givanu-33-kire967 | 8 | exact {} |  |  |  | pinned (add2-b3w1) |
| kasadu-53-tuki533 | 8 | exact {} |  |  |  | pinned (add2-b3w1) |
| mafete-03-rapa918 | 8 | exact {} |  |  |  | pinned (add2-b3w1) |
| xekame-27-geba281 | 8 | exact {} |  |  |  | pinned (add2-b3w1) |
| foludi-80-gilo247 | 10 | exact {} | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37 |  |  | pinned (add2-b3w1) |
| fivama-51-cusa142 | 12 | exact {} | gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut); residual per journal row 44 | T1b | snake merge 12->0 | pinned (add2-b1) |
| dakesa-98-mano758 | 13 | exact {} | gradient BackgroundColor (theme field typed string, not Paint); residual per journal row 41 |  |  | open -> add3 (ws 2, exact, top svg/defs[]/linearGradient[]/@id 1, svg/g[]/rect[]/@fill 1; b2 family PAINT landed in batch 3; residual needs re-census (add3)) |
| fabule-54-pili300 | 22 | text-only {text: -2} | creole table / %n() / ____ in action text; residual per journal row 40 |  |  | open -> add3 (ws 22, text-only, top svg/@viewBox[] 2, svg/@height 1; T2F: %n() preprocessor builtin (known T2f)) |
| laxibe-66-teme800 | 26 | exact {} | creole [[url{tip}label]] in action text; residual per journal row 40 | T2d+T2d | `CommandCreoleUrl.ts`'s tooltip strip had no boundary (`UrlBuilder.java:76-80`): a `{...}` glued to trailing non-whitespace text (`{dd}sss`) is never a tooltip upstream, only a Link char swallow; added the `(?=\s\|$)` lookahead; T2d 26->0 | pinned (add2-b2) |
| volefo-41-tolo996 | 29 | exact {} | note BackGroundColor #FEFFDD (plantuml.skin note SName); residual per journal row 41 |  |  | open -> add3 (ws 29, exact, top svg/g[]/path[]/@d[] 9, svg/g[]/polygon[]/@points[] 8; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| maduja-30-xiri319 | 30 | extra line only {line: 2} |  |  |  | open -> add3 (ws 28, extra line, top svg/g[]/polygon[]/@points[] 6, svg/g[]/line[]/@y1 4; XLANE > H1: FtileIfWithLinks.java:149-174 (ConnectionHorizontalThenVertical.drawTranslate: p1 -> (p2.x,p1.y) -> p2, 2 segments) / :238-286 (ConnectionVe) |
| samavi-13-fuku339 | 30 | extra line only {line: 2} |  |  |  | open -> add3 (ws 28, extra line, top svg/g[]/polygon[]/@points[] 6, svg/g[]/line[]/@y1 4; XLANE > H1: FtileIfWithLinks.java:149-174 (ConnectionHorizontalThenVertical.drawTranslate: p1 -> (p2.x,p1.y) -> p2, 2 segments) / :238-286 (ConnectionVe) |
| vimako-25-mega336 | 34 | exact {} | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42 |  |  | open -> add3 (ws 3, exact, top svg/g[]/text[]/@font-weight 1, svg/g[]/text[]/@textLength 1; T2F: empty-then -> FtileIfDown south label (known T2f); also the creole **bold** in the else label is not parsed (jar font-weight 700)) |
| activity-creole-table | 35 | mixed {line: -5} | creole table / %n() / ____ in action text; residual per journal row 40 | T2f | T2f 35->0 | pinned (add2-b2) |
| niletu-83-lego826 | 35 | mixed {line: -5} | creole table / %n() / ____ in action text; residual per journal row 40 | T2f | T2f 35->0 | pinned (add2-b2) |
| kemedu-83-vipa115 | 36 | extra arrow only {polygon: 1} |  |  |  | pinned (add2-b3w1) |
| pujumu-36-nelo283 | 36 | extra arrow only {polygon: 1} |  |  |  | pinned (add2-b3w1) |
| todufa-81-gavo441 | 36 | extra arrow only {polygon: 1} |  |  |  | pinned (add2-b3w1) |
| jonave-00-xabi793 | 38 | extra arrow only {polygon: 1} |  |  |  | pinned (add2-b3w1) |
| perate-09-gale335 | 38 | exact {} | ConditionStyle InsideDiamond (unported style); residual per journal row 42 |  |  | pinned (add2-b3) |
| bugaja-31-jaso630 | 39 | exact {} |  |  |  | pinned (add2-b3) |
| debofa-60-mude568 | 39 | extra arrow only {polygon: 1} | backward: box + connectors unported (activity-loop-backward); residual per journal row 43/47 |  |  | pinned (add2-b3w1) |
| mezuce-12-gemi988 | 43 | extra arrow only {polygon: 1} |  |  |  | pinned (add2-b3w1) |
| niviji-21-maco613 | 44 | extra arrow only {polygon: 1} |  |  |  | pinned (add2-b3w1) |
| nupose-71-vido428 | 45 | exact {} |  |  |  | pinned (add2-b3) |
| roboja-69-susa752 | 45 | exact {} |  |  |  | pinned (add2-b3) |
| nesozi-09-zezu092 | 48 | text-only {text: -1} |  |  |  | open -> add3 (ws 20, text-only, top svg/g[]/a[]/text[]/@fill 1, svg/g[]/text[]/@textLength 1; b2 family SLURL > H1 landed in batch 3; residual needs re-census (add3)) |
| citire-32-mive114 | 49 | extra line+arrow {polygon: 1, line: 2} |  |  |  | open -> add3 (ws 31, extra line, top svg/g[]/polygon[]/@points[] 7, svg/g[]/line[]/@y2 4; XLANE > EMPHB > ORD > H1: FtileRepeat.java:432-438,480-511 (ConnectionBackBackward1/2.drawTranslate) are unported (walk-repeat-backward.ts header), so routeEdge's gen) |
| nexitu-74-luga914 | 51 | exact {} | gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut); residual per journal row 44 |  |  | pinned (add2-b3w1) |
| fibafo-22-foze119 | 52 | extra line only {line: 2} |  | T1b | snake merge 52->0 | pinned (add2-b1) |
| novata-87-muti352 | 53 | extra line+arrow {polygon: 1, line: 1} | ConditionStyle InsideDiamond (unported style); residual per journal row 42 | T1b | snake merge 53->22 | pinned (add2-b3) |
| becaje-01-vaji284 | 54 | extra line+arrow {polygon: 1, line: 1} | touching edges not fused (Snake.merge, Snake.java:303-327); residual per journal row 44 | T1b | snake merge 54->0 | pinned (add2-b1) |
| jecoxu-17-zama003 | 54 | extra line+arrow {polygon: 1, line: 1} | touching edges not fused (Snake.merge, Snake.java:303-327); residual per journal row 44 | T1b | snake merge 54->0 | pinned (add2-b1) |
| bazuma-86-metu353 | 57 | exact {} | multiline branch label height + one <text> per line; residual per journal row 42 |  |  | pinned (add2-b3w1) |
| bozuro-33-celo170 | 58 | extra arrow only {polygon: 2} | repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5; residual per journal row 42 | T1b | snake merge 58->31 | pinned (add2-b3w1) |
| racana-82-zece676 | 58 | exact {} |  |  |  | pinned (add2-b3) |
| saxeku-17-gume203 | 58 | extra line+arrow {polygon: 1, line: 1} | ConditionEndStyle hline (FtileIfDown.java:147-150); residual per journal row 42 | T1p-a | HLINE ConnectionHline FtileIfWithLinks.java:421-500 | pinned (add2-b1p) |
| kenizo-43-siro273 | 60 | extra arrow only {polygon: 1} | backward: box + connectors unported (activity-loop-backward); residual per journal row 43/47 |  |  | pinned (add2-b3w1) |
| cifafo-49-jazi415 | 63 | exact {} | title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory); residual per journal row 36/49/52 |  |  | pinned (add2-b3w1) |
| xizola-97-sizu458 | 63 | extra line+arrow {polygon: 1, line: 1} |  |  |  | open -> add3 (ws 18, extra line, top svg/g[]/polygon[]/@points[] 6, svg/g[]/line[]/@y2 2; EMPHB > XLANE > ORD: FtileRepeat.java:451-452 builds ConnectionBackBackward1 as Snake.create(..asToUp()).withLabel(..) with NO emphasizeDirection; ours sets emph) |
| geremo-94-tecu179 | 64 | extra line+arrow {polygon: 2, line: 1} |  | T1b | snake merge 64->38 | pinned (add2-b3w1) |
| navene-45-cozo466 | 64 | extra arrow only {polygon: 1} |  | T1b | snake merge 64->20 | pinned (add2-b3w1) |
| bocaga-53-nale241 | 66 | extra line+arrow {polygon: 2, line: 2} | touching edges not fused (Snake.merge, Snake.java:303-327); residual per journal row 44 | T1b | snake merge 66->0 | pinned (add2-b1) |
| gacaja-15-keko600 | 66 | exact {} |  | T1b | snake merge 66->6 | pinned (add2-b3w1) |
| luxido-91-covi016 | 66 | extra line+arrow {polygon: 1, line: 1} |  |  |  | open -> add3 (ws 22, extra line, top svg/g[]/polygon[]/@points[] 7, svg/g[]/line[]/@x2 2; EMPHB > XLANE > ORD: FtileRepeat.java:451-452 builds ConnectionBackBackward1 as Snake.create(..asToUp()).withLabel(..) with NO emphasizeDirection; ours sets emph) |
| xidamu-85-xoti640 | 66 | extra line+arrow {polygon: 1, line: 1} |  |  |  | open -> add3 (ws 18, extra line, top svg/g[]/polygon[]/@points[] 6, svg/g[]/line[]/@y2 2; EMPHB > XLANE > ORD: FtileRepeat.java:451-452 builds ConnectionBackBackward1 as Snake.create(..asToUp()).withLabel(..) with NO emphasizeDirection; ours sets emph) |
| bigide-91-bise382 | 67 | mixed {line: -2, text: 1} | title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory); residual per journal row 36/49/52 |  |  | open -> add3 (ws 67, mixed, top svg/g[]/polygon[]/@points[] 16, svg/g[]/text[]/@x 5; STRIPE: CreoleStripeSimpleParser.java:92-116 (____ / ==== -> HORIZONTAL_LINE) and :149-153 (=x -> HEADING); ours renders the markup as literal text.) |
| reluvi-59-pifi444 | 67 | exact {} |  |  |  | open -> add3 (ws 61, exact, top svg/g[]/polygon[]/@points[] 33, svg/g[]/line[]/@x1 8; b2 family CSTYLE > EMMID > ORD landed in batch 3; residual needs re-census (add3)) |
| sadovu-51-fata536 | 67 | extra line+arrow {polygon: 1, line: 1} |  |  |  | open -> add3 (ws 18, extra line, top svg/g[]/polygon[]/@points[] 6, svg/g[]/line[]/@y2 2; EMPHB > XLANE > ORD: FtileRepeat.java:451-452 builds ConnectionBackBackward1 as Snake.create(..asToUp()).withLabel(..) with NO emphasizeDirection; ours sets emph) |
| gufuma-85-zoce945 | 68 | text-only {text: 5} | embedded {{ }} diagram: oracle 42x42 slot (memory oracle-seam-embedded-42x42) |  |  | open -> add3 (ws 68, text-only, top svg/g[]/polygon[]/@points[] 12, svg/g[]/ellipse[]/@cx 3; EMBED: embedded {{json}} / {{ }} rendered as a nested SVG `<image>` (known T2g, deferred)) |
| delide-30-teva601 | 69 | extra line+arrow {polygon: 2, line: 3} |  | T1b | snake merge 69->46 | open -> add3 (ws 28, extra line, top svg/g[]/polygon[]/@points[] 6, svg/g[]/line[]/@y2 4; XLANE > EMPHB > ORD > H1: FtileRepeat.java:432-438,480-511 (ConnectionBackBackward1/2.drawTranslate) are unported (walk-repeat-backward.ts header), so routeEdge's gen) |
| cemagu-66-vazo965 | 72 | exact {} |  |  |  | pinned (add2-b3w1) |
| felega-00-saxi785 | 72 | extra line+arrow {polygon: 1, line: 1} |  | T1b | snake merge 72->8 | pinned (add2-b3w1) |
| saxuro-16-tezu631 | 73 | exact {} |  | T1b | snake merge 73->61 | pinned (add2-b3w1) |
| carapo-31-bisi880 | 77 | exact {} | ConditionStyle InsideDiamond (unported style); residual per journal row 42 |  |  | pinned (add2-b3) |
| cubida-55-meku256 | 78 | extra line+arrow {polygon: 1, line: 1} | note spike tip never computed (Opale getPolygonLeft/Right dead); residual per journal row 44 |  |  | open -> add3 (ws 40, exact, top svg/g[]/path[]/@d[] 26, svg/g[]/polygon[]/@points[] 4; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| dozaxu-98-xetu961 | 78 | extra line+arrow {polygon: 1, line: 1} |  | T1b+T2c | snake merge 78->23; T2c 23->9 | pinned (add2-b3) |
| kafevi-44-tesu096 | 79 | extra line+arrow {polygon: 1, line: 1} |  | T1b+T2c | snake merge 79->39; T2c 39->7 | pinned (add2-b3w1) |
| katopo-68-xajo866 | 79 | extra line+arrow {polygon: 1, line: 1} |  | T1b | snake merge 79->12 | pinned (add2-b3w1) |
| vimoxa-78-zucu656 | 80 | extra line+arrow {polygon: 1, line: 1, text: 1} | note spike tip never computed (Opale getPolygonLeft/Right dead); residual per journal row 44 | T2e | T2e 80->84 (D7 reveal: endnote no longer text) | open -> add3 (ws 45, exact, top svg/g[]/path[]/@d[] 24, svg/g[]/polygon[]/@points[] 4; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| vaxuta-95-cico162 | 81 | extra line+arrow {polygon: 1, line: 1} | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42 | T1b | snake merge 81->0 | pinned (add2-b1) |
| notuli-49-xugi698 | 82 | extra line only {rect: -1, line: 2, path: -2, text: -2} |  |  |  | open -> add3 (ws 60, extra line, top svg/g[]/polygon[]/@points[] 8, svg/g[]/line[]/@y2 7; b2 family PART > H1 landed in batch 3; residual needs re-census (add3)) |
| vupuse-73-nuso490 | 82 | extra arrow only {polygon: 2} |  | T1b | snake merge 82->55 | pinned (add2-b3w1) |
| jevoce-05-mumi686 | 83 | extra line only {line: 2} |  |  |  | open -> add3 (ws 28, extra line, top svg/g[]/polygon[]/@points[] 6, svg/g[]/line[]/@y1 4; PARX > XLANE > H1: ParallelBuilderFork.java:172,229 call .ignoreForCompression() only in drawTranslate (cross-lane) and ParallelBuilderSplit.java:207-225,264-2) |
| cemipu-87-dinu624 | 84 | exact {} |  |  |  | open -> add3 (ws 82, exact, top svg/g[]/polygon[]/@points[] 40, svg/g[]/line[]/@x2 13; UNK: mechanism unknown: skinparam swimlane { BorderThickness 0; TitleFontSize 30; width same }. Lane widths 249.45/151.9 (ours) vs 260.45/125.8 () |
| norire-15-taka956 | 85 | exact {} | note spike tip never computed (Opale getPolygonLeft/Right dead); residual per journal row 44 |  |  | open -> add3 (ws 48, exact, top svg/g[]/path[]/@d[] 26, svg/g[]/polygon[]/@points[] 8; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| fikuki-99-kulu790 | 88 | text-only {text: 10} | embedded {{ }} diagram: oracle 42x42 slot (memory oracle-seam-embedded-42x42) | T2c | T2c 88->87 | open -> add3 (ws 87, text-only, top svg/g[]/polygon[]/@points[] 4, svg/@viewBox[] 2; EMBED: embedded {{json}} / {{ }} rendered as a nested SVG `<image>` (known T2g, deferred)) |
| gevaxi-80-tone223 | 89 | extra line+arrow {polygon: 1, line: 1} | gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut); residual per journal row 44 | T1b | snake merge 89->34 | pinned (add2-b3w1) |
| lukoxa-16-cecu095 | 92 | extra line+arrow {polygon: 1, line: 3} |  |  |  | pinned (add2-b3w1) |
| cixave-47-milo698 | 97 | missing line+arrow {polygon: -1, line: -4} |  | T1p-d+T1b | weld 97->165 (D7 reveal, journal 14); weld-join arrowheads -> T1b; snake merge 165->10 | pinned (add2-b3w1) |
| biredi-08-bama025 | 98 | extra arrow only {polygon: 1} |  | T1b | snake merge 98->3 | pinned (add2-b3w1) |
| pezubu-98-niba240 | 101 | extra line+arrow {polygon: 1, line: 2} |  | T1p-a/T1p-g | HLINE 101->64; residual out1X/out2X width (gtile-if-with-links) + snake merge | open -> add3 (ws 62, extra line, top svg/g[]/polygon[]/@points[] 16, svg/g[]/line[]/@x2 6; XLANE > T1PG > H1: FtileIfWithLinks.java:149-174 (ConnectionHorizontalThenVertical.drawTranslate: p1 -> (p2.x,p1.y) -> p2, 2 segments) / :238-286 (ConnectionVe) |
| gelono-70-zuce760 | 102 | extra line+arrow {polygon: 2, line: 2} |  | T1b | snake merge 102->6 | pinned (add2-b3w1) |
| sofoje-37-tila554 | 105 | extra line+arrow {polygon: 2, line: 1} |  | T1b | snake merge 105->2 | pinned (add2-b3w1) |
| liteza-62-nopo771 | 106 | extra arrow only {polygon: 2} |  |  |  | pinned (add2-b3w1) |
| nikinu-06-sace939 | 107 | exact {} |  |  |  | open -> add3 (ws 105, exact, top svg/g[]/polygon[]/@points[] 48, svg/g[]/line[]/@x1 19; UNK: mechanism unknown: skinparam swimlaneWidth 400. Jar title rect x=16 (not 20) and lane content +13px; Swimlanes.java:398-418 min-width path r) |
| vokibe-29-vepe451 | 107 | extra line+arrow {polygon: 1, line: 1} |  |  |  | open -> add3 (ws 61, exact, top svg/g[]/path[]/@d[] 20, svg/g[]/polygon[]/@points[] 20; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| caciva-80-kene990 | 109 | extra line+arrow {polygon: 2, line: 2, path: -1, text: -1} | partition title not threaded onto the composite node; residual per journal row 44 | T1b | snake merge 109->81 | open -> add3 (ws 13, exact, top svg/g[]/polygon[]/@points[] 4, svg/@viewBox[] 2; b2 family PART landed in batch 3; residual needs re-census (add3)) |
| sifite-87-ziti434 | 109 | extra line+arrow {polygon: 1, line: 1, path: -1, text: -1} |  |  |  | open -> add3 (ws 19, exact, top svg/g[]/line[]/@y2 4, svg/g[]/path[]/@d[] 4; b2 family PART > H1 landed in batch 3; residual needs re-census (add3)) |
| jipapo-14-kevu587 | 110 | extra line+arrow {polygon: 1, line: 1} | note BackGroundColor #FEFFDD (plantuml.skin note SName); residual per journal row 41 |  |  | open -> add3 (ws 110, extra line+arrow, top svg/g[]/polygon[]/@points[] 46, svg/g[]/path[]/@d[] 17; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| sutura-08-zeme419 | 112 | extra line+arrow {polygon: 3, line: 3} |  | T1b | snake merge 112->0 | pinned (add2-b1) |
| nijipa-25-pede639 | 113 | extra line+arrow {polygon: 1, line: 1} | note BackGroundColor #FEFFDD (plantuml.skin note SName); residual per journal row 41 |  |  | open -> add3 (ws 113, extra line+arrow, top svg/g[]/polygon[]/@points[] 46, svg/g[]/path[]/@d[] 17; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| xovano-23-tazo278 | 114 | exact {} |  | T1b | snake merge 114->102 | open -> add3 (ws 3, exact, top svg/g[]/polygon[]/@stroke-width 3; WORD > EMMID > ORD > UNK: FtileWhile.java:553-556 draws whileBlock BEFORE diamond1; ours pushes the header first (walk-while-branch.ts:381) [-87]; then Worm.java:178-) |
| vaxiki-78-nice114 | 117 | extra line+arrow {polygon: 2, line: 2, text: -2} |  | T1b | snake merge 117->77 | pinned (add2-b3w1) |
| lifeve-53-zubi598 | 118 | extra line+arrow {polygon: 4, line: 3} |  | T1b | snake merge 118->0 | pinned (add2-b1) |
| mifejo-31-sovi184 | 118 | extra line+arrow {polygon: 2, line: 2} | note BackGroundColor #FEFFDD (plantuml.skin note SName); residual per journal row 41 |  |  | open -> add3 (ws 93, extra line+arrow, top svg/g[]/path[]/@d[] 28, svg/g[]/polygon[]/@points[] 8; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| gesogi-81-xoma900 | 120 | exact {} |  |  |  | open -> add3 (ws 76, exact, top svg/g[]/polygon[]/@points[] 35, svg/g[]/line[]/@x2 16; UNK > WORD > EMMID > ORD: mechanism unknown for rest 78: fork across lanes; the fork bar and the Driver lane sit 15px further right in ours. Ruled out: PAR/SPLIT togg) |
| labala-74-juki864 | 120 | exact {} |  |  |  | open -> add3 (ws 120, exact, top svg/g[]/polygon[]/@points[] 56, svg/g[]/line[]/@x1 7; UNK: mechanism unknown: !theme amiga (jar colours #0B58A8/#FFF and a 5px smaller top/left offset). Ours ignores the theme on activity elements; w) |
| mudobi-07-biji996 | 121 | missing line+arrow {polygon: -2, line: -2, path: -1, text: -1} |  | T1p-d+T1b | weld 121->290 (D7 reveal, journal 14); weld-join arrowheads/lines -> T1b; snake merge 290->81 | open -> add3 (ws 67, exact, top svg/g[]/polygon[]/@points[] 36, svg/g[]/line[]/@y2 9; b2 family PART > EMMID > ORD landed in batch 3; residual needs re-census (add3)) |
| fetizo-39-jace641 | 122 | extra arrow only {polygon: 1} |  | T1b | snake merge 122->0 | pinned (add2-b1) |
| mojezi-43-gamu360 | 122 | extra line only {line: 2} |  | T1p-e | switch cross-lane connectors 122->106 | open -> add3 (ws 106, exact, top svg/g[]/polygon[]/@points[] 50, svg/g[]/line[]/@y2 12; UNK: mechanism unknown: switch across lanes. Jar switch hexagon is 24px tall and the !S2 case leaves the hexagon from its west point as an L; our) |
| maketa-43-juja264 | 123 | extra line+arrow {polygon: 1, line: 5} |  | T1b | snake merge 123->50 | open -> add3 (ws 10, extra line, top svg/g[]/line[]/@y1 2, svg/g[]/line[]/@y2 1; PARX > XLANE > H1: ParallelBuilderFork.java:172,229 call .ignoreForCompression() only in drawTranslate (cross-lane) and ParallelBuilderSplit.java:207-225,264-2) |
| cujoni-21-somi079 | 124 | extra arrow only {polygon: 1} |  | T1b | snake merge 124->131 (D7 reveal: element counts now exact) | open -> add3 (ws 80, exact, top svg/g[]/polygon[]/@points[] 35, svg/g[]/path[]/@d[] 8; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| decudi-92-bisu741 | 124 | extra line+arrow {polygon: 1, line: 5} |  | T1b | snake merge 124->51 | open -> add3 (ws 10, extra line, top svg/g[]/line[]/@y1 2, svg/g[]/line[]/@y2 1; PARX > XLANE > H1: ParallelBuilderFork.java:172,229 call .ignoreForCompression() only in drawTranslate (cross-lane) and ParallelBuilderSplit.java:207-225,264-2) |
| copisa-69-xisi273 | 125 | text-only {text: -2} |  | T2c | T2c 125->124 | open -> add3 (ws 2, exact, top svg/g[]/text[]/@x 2; b2 family IFNL landed in batch 3; residual needs re-census (add3)) |
| kijazo-83-kipu485 | 125 | extra line only {line: 2} |  | T1b | snake merge 125->222 (D7 reveal: element counts now exact) | open -> add3 (ws 220, exact, top svg/g[]/polygon[]/@points[] 8, svg/g[]/line[] 7; above the b2 cohort; not censused (add3 re-census)) |
| loxija-71-joku558 | 126 | exact {} |  | T2c | T2c 126->121 | open -> add3 (ws 121, exact, top svg/g[]/polygon[]/@points[] 68, svg/g[]/line[]/@y1 16; UNK: mechanism unknown: activityFontSize 4 / activityDiamondFontSize 6 / activityArrowFontSize 24 / activityFontColor red. Box height 24 vs 30 an) |
| lidefe-01-vaki092 | 128 | extra line+arrow {polygon: 2, line: 2} |  |  |  | open -> add3 (ws 66, exact, top svg/g[]/path[]/@d[] 39, svg/g[]/polygon[]/@points[] 8; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| lafilo-69-tuti771 | 131 | text-only {text: -2} |  |  |  | pinned (add2-b3w1) |
| vodobe-33-kefa909 | 133 | extra line+arrow {rect: -1, polygon: 1, line: 1, path: -2, text: -2} |  |  |  | open -> add3 (ws 90, mixed, top svg/g[]/path[]/@d[] 32, svg/g[]/polygon[]/@points[] 8; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| xabesu-51-dimi831 | 134 | text-only {text: -3} |  |  |  | pinned (add2-b3) |
| suluni-73-lotu140 | 135 | mixed {path: -1, text: -1} |  |  |  | open -> add3 (ws 45, exact, top svg/g[]/polygon[]/@points[] 23, svg/g[]/line[]/@y2 7; b2 family PART landed in batch 3; residual needs re-census (add3)) |
| kavoro-11-jife299 | 137 | extra line+arrow {polygon: 2, line: 2} |  |  |  | open -> add3 (ws 110, extra line+arrow, top svg/g[]/path[]/@d[] 28, svg/g[]/line[]/@x2 4; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| bulasi-17-vafa634 | 138 | exact {} |  | T1b | snake merge 138->78 | pinned (add2-b3w1) |
| dacuga-41-popo038 | 140 | missing line+arrow {polygon: -1, line: -4} |  | T1p-d+T1b | weld 140->146 (D7 reveal, journal 14); weld-join arrowheads -> T1b; snake merge 146->10 | pinned (add2-b3w1) |
| nomeco-93-minu967 | 141 | extra line+arrow {polygon: 1, line: 2} |  | T1b | snake merge 141->135 | pinned (add2-b3w1) |
| rurebu-12-nebi203 | 141 | extra line+arrow {polygon: 1, line: 2} |  | T1b | snake merge 141->135 | pinned (add2-b3w1) |
| jagove-43-nako107 | 142 | exact {} |  |  |  | open -> add3 (ws 142, exact, top svg/g[]/polygon[]/@points[] 81, svg/g[]/line[]/@y2 15; STRIPE: CreoleStripeSimpleParser.java:92-116 (____ / ==== -> HORIZONTAL_LINE) and :149-153 (=x -> HEADING); ours renders the markup as literal text ) |
| nafaxo-62-boso912 | 146 | extra arrow only {polygon: 1} |  | T1b | snake merge 146->167 (D7 reveal: element counts now exact) | pinned (add2-b3w1) |
| pekefu-66-mepa144 | 146 | extra line+arrow {polygon: 2, line: 1, text: -1} |  | T1b | snake merge 146->42 | open -> add3 (ws 8, exact, top svg/g[]/polygon[]/@points[] 4, svg/g[]/line[]/@x2 3; b2 family MLJOIN landed in batch 3; residual needs re-census (add3)) |
| cutabu-59-cilo276 | 148 | extra line+arrow {polygon: 1, line: 2} |  | T1b | snake merge 148->142 | pinned (add2-b3w1) |
| vivate-04-guso306 | 148 | extra line+arrow {polygon: 2, line: 1} |  | T1b | snake merge 148->4 | pinned (add2-b3w1) |
| gofebi-87-zeka817 | 149 | extra line+arrow {polygon: 1, line: 1} |  |  |  | open -> add3 (ws 59, exact, top svg/g[]/path[]/@d[] 21, svg/g[]/polygon[]/@points[] 19; b2 family NOTE > ORD landed in batch 3; residual needs re-census (add3)) |

## Parse `error` rows (D6)

| slug | refusal (diff-baseline reason) | task | mechanism | final |
|---|---|---|---|---|
| boxefe-81-situ725 | activity parser refused this source at line 4 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 124 | open -> add3 (ws 58, exact, top svg/g[]/polygon[]/@points[] 24, svg/g[]/line[]/@y2 10; BACKLBL > WORD > EMPHB > ORD: CommandBackward3.java:71-72,143-146 parses INCOMING/OUTGOING labels; FtileWhile.java:146,158-161 draws them via withLabel(back1/back2); ours) |
| caburo-70-buki284 | activity parser refused this source at line 15 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 2 | pinned (add2-b3w1) |
| cakeca-72-kara622 | activity parser refused this source at line 2 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 515 | open -> add3 (ws 482, mixed, top svg/g[]/polygon[]/@points[] 156, svg/g[]/line[]/@x1 39; above the b2 cohort; not censused (add3 re-census)) |
| cejupe-34-muti621 | activity parser refused this source at line 4 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 10 | pinned (add2-b3) |
| cigagu-31-rime196 | activity parser refused this source at line 14 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 95 | open -> add3 (ws 34, mixed, top svg/g[]/rect[]/@fill 8, svg/g[]/polygon[]/@fill 5; b2 family PAINT > WORD > EMMID > ORD landed in batch 3; residual needs re-census (add3)) |
| ciloke-34-pumi198 | activity parser refused this source at line 15 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 16 | pinned (add2-b3w1) |
| dulate-94-bupu593 | activity parser refused this source at line 3 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 65 | pinned (add2-b3) |
| fivone-96-nalo453 | activity parser refused this source at line 3 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 8 | pinned (add2-b3w1) |
| getene-72-dido571 | activity parser refused this source at line 4 (syntax): Syntax Error? | T2e+T2g | renders (promoted b2), ws 8 | pinned (add2-b3w1) |
| giteso-65-mefo026 | activity parser refused this source at line 3 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 605 | open -> add3 (ws 524, extra line+arrow, top svg/g[]/polygon[]/@points[] 114, svg/g[]/path[]/@d[] 96; above the b2 cohort; not censused (add3 re-census)) |
| gudute-55-nulo344 | activity parser refused this source at line 14 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 95 | open -> add3 (ws 34, mixed, top svg/g[]/rect[]/@fill 8, svg/g[]/polygon[]/@fill 5; b2 family PAINT > WORD > EMMID > ORD landed in batch 3; residual needs re-census (add3)) |
| jamana-83-gige126 | activity parser refused this source at line 5 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 4 | pinned (add2-b3w1) |
| jevofu-58-fazo194 | activity parser refused this source at line 8 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 0 | pinned (add2-b1p) |
| jufefu-66-josa392 | activity parser refused this source at line 5 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 175 | open -> add3 (ws 175, mixed, top svg/g[]/polygon[]/@points[] 54, svg/g[]/line[]/@x1 7; above the b2 cohort; not censused (add3 re-census)) |
| ketajo-72-rula535 | activity parser refused this source at line 7 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 0 | pinned (add2-b2) |
| kiceze-91-luke737 | activity parser refused this source at line 3 (syntax): Syntax Error? | T2e+T2g | renders (promoted b2), ws 0 | pinned (add2-b2) |
| lapura-36-kavu144 | activity parser refused this source at line 11 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 10 | pinned (add2-b3w1) |
| mepeze-15-nuge493 | activity parser refused this source at line 6 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 0 | pinned (add2-b1p) |
| mufixi-71-koma752 | activity parser refused this source at line 30 (syntax): Syntax Error? | T2e+T2g | renders (promoted b2), ws 236 | open -> add3 (ws 236, text-only, top svg/g[]/polygon[]/@points[] 12, svg/g[]/ellipse[]/@cx 3; above the b2 cohort; not censused (add3 re-census)) |
| ninago-40-dalo726 | activity parser refused this source at line 10 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 2 | pinned (add2-b3w1) |
| nipuxu-11-tefa314 | activity parser refused this source at line 2 (syntax): Syntax Error? | T2e+T2g | renders (promoted b2), ws 18 | open -> add3 (ws 18, mixed, top svg/g[]/text[] 2; GLYPH: FtileCircleSpot.java:111 draws a UCenteredCharacter and DriverCenteredCharacterSvg.java:57-81 emits the glyph outline as a `<path>`; ours em) |
| nolubo-93-rula384 | activity parser refused this source at line 3 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 65 | pinned (add2-b3) |
| pucinu-80-nopo009 | activity parser refused this source at line 2 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 8 | pinned (add2-b3w1) |
| pufuzi-99-vone170 | activity parser refused this source at line 6 (syntax): Syntax Error? | T2e+T2g | renders (promoted b2), ws 70 | open -> add3 (ws 70, text-only, top svg/g[]/polygon[]/@points[] 12, svg/g[]/ellipse[]/@cx 3; EMBED: embedded {{json}} / {{ }} rendered as a nested SVG `<image>` (known T2g, deferred)) |
| razuzu-32-faje125 | activity parser refused this source at line 7 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 158 | open -> add3 (ws 158, extra line+arrow, top svg/g[]/polygon[]/@points[] 24, svg/g[]/path[]/@d[] 20; above the b2 cohort; not censused (add3 re-census)) |
| rirefa-62-kucu593 | activity parser refused this source at line 8 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 151 | open -> add3 (ws 151, extra line+arrow, top svg/g[]/polygon[]/@points[] 36, svg/g[]/line[]/@y2 5; above the b2 cohort; not censused (add3 re-census)) |
| tajuxe-32-sexo680 | activity parser refused this source at line 2 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 96 | open -> add3 (ws 71, extra line+arrow, top svg/g[]/path[]/@d[] 28, svg/g[]/path[]/@fill 4; b2 family NOTE landed in batch 3; residual needs re-census (add3)) |
| ticeka-12-buli543 | activity parser refused this source at line 6 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 0 | pinned (add2-b2) |
| vexula-75-noko098 | activity parser refused this source at line 2 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 300 | open -> add3 (ws 164, extra line+arrow, top svg/g[]/polygon[]/@points[] 68, svg/g[]/line[]/@y1 13; above the b2 cohort; not censused (add3 re-census)) |
| vilecu-41-tete416 | activity parser refused this source at line 3 (syntax): Syntax Error? | T2e+T2g | renders (promoted b2), ws 18 | open -> add3 (ws 18, mixed, top svg/g[]/text[] 2; GLYPH: FtileCircleSpot.java:111 draws a UCenteredCharacter and DriverCenteredCharacterSvg.java:57-81 emits the glyph outline as a `<path>`; ours em) |
| xolazi-74-vamu265 | activity parser refused this source at line 3 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 208 | open -> add3 (ws 169, exact, top svg/g[]/polygon[]/@points[] 61, svg/g[]/path[]/@d[] 50; above the b2 cohort; not censused (add3 re-census)) |
| xoreko-43-noto860 | activity parser refused this source at line 5 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 0 | pinned (add2-b1p) |
| zafoxu-20-xofe568 | activity parser refused this source at line 5 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 9 | pinned (add2-b3) |
| zaloze-31-jibo311 | activity parser refused this source at line 4 (syntax): Syntax Error? | T2e+T2g | renders (promoted b2), ws 137 | open -> add3 (ws 9, mixed, top svg/g[]/text[] 1; b2 family T2G landed in batch 3; residual needs re-census (add3)) |
| zaxati-90-xacu660 | activity parser refused this source at line 5 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 12 | pinned (add2-b3w1) |
| zinelo-77-losu727 | activity parser refused this source at line 19 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 18 | open -> add3 (ws 10, extra line, top svg/g[]/line[]/@y1 2, svg/g[]/line[]/@y2 1; XLANE > EMMID > ORD: FtileIfWithLinks.java:149-174 (ConnectionHorizontalThenVertical.drawTranslate: p1 -> (p2.x,p1.y) -> p2, 2 segments) / :238-286 (ConnectionVe) |
| zizumo-48-taku661 | activity parser refused this source at line 4 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 0 | pinned (add2-b2) |
| zokuni-21-sapu966 | activity parser refused this source at line 5 (syntax): Syntax Error? | T2e | renders (promoted b2), ws 0 | pinned (add2-b1p) |


## Rows above ws 150 at b0 that moved in b1p

| slug | ws (b0) | element shape (b0) | add1 mechanism | task | mechanism | final |
|---|---|---|---|---|---|---|
| bizono-61-sasa740 | >150 |  |  | T1p-d+T1b | break weld 243->209; residual weld-join arrowheads -> T1b; snake merge 209->14 | pinned (add2-b3w1) |
| dixiku-28-guzo497 | >150 |  |  | T1p-d+T1b | GtileBreak 0x0 + weld 169->141; weld-join arrowheads -> T1b; snake merge 141->10 | pinned (add2-b3w1) |
| doziki-93-rosi997 | >150 |  |  | T1p-d+T1b | break weld 273->244; residual weld-join arrowheads -> T1b; snake merge 244->14 | pinned (add2-b3w1) |
| jucidi-98-zato093 | >150 |  |  | T1p-g+T1b | HLINE per-lane fan-out 169->176 (count reveal); coupleX vs SOUTH_HOOK out-x; snake merge 176->83 | open -> add3 (ws 81, extra line+arrow, top svg/g[]/polygon[]/@points[] 12, svg/g[]/line[]/@x2 8; XLANE > T1PG > H1: FtileIfLongHorizontal ConnectionVerticalOut is a straight drop to the hline and the branch-in is the class's own drawTranslate; ours draws r) |
| nerete-42-save418 | >150 |  |  | T1p-d+T1b | GtileBreak 0x0 356->354; snake merge 354->177 | pinned (add2-b3w1) |
| pixako-75-kumi821 | >150 |  |  | T1p-d+T1b | GtileBreak 0x0 197->184; snake merge 184->118 | pinned (add2-b3w1) |
| ruzazu-94-meso880 | >150 |  |  | T1p-e | switch cross-lane 173->164; BIG_DIAMOND in jar, SMALL here (case widths) | open -> add3 (ws 164, mixed, top svg/g[]/polygon[]/@points[] 59, svg/g[]/line[]/@y2 15; above the b2 cohort; not censused (add3 re-census)) |
| tmp1 | >150 |  |  | T1p-e | duplicate of ruzazu-94-meso880 (pinned since 9524864ff); follow-on | open -> add3 (ws 164, mixed, top svg/g[]/polygon[]/@points[] 59, svg/g[]/line[]/@y2 15; above the b2 cohort; not censused (add3 re-census)) |

## Rows above ws 150 that moved in b1 (T1b snake merge)

| slug | ws (b1p) | ws (b1) | task | mechanism | final |
|---|---|---|---|---|---|
| bareka-88-fusu160 | 253 | 115 | T1b | snake merge | pinned (add2-b3w1) |
| bazize-75-dedo568 | 192 | 5 | T1b | snake merge | pinned (add2-b3w1) |
| bepuku-07-vebe062 | 172 | 0 | T1b | snake merge | pinned (add2-b1) |
| besaga-58-poli497 | 266 | 210 | T1b | snake merge | pinned (add2-b3w1) |
| boxoto-53-sifo232 | 449 | 14 | T1b | snake merge | pinned (add2-b3w1) |
| camavo-50-kaku123 | 180 | 126 | T1b | snake merge | pinned (add2-b3w1) |
| fatuzu-07-cevu894 | 272 | 220 | T1b | snake merge | open -> add3 (ws 53, exact, top svg/g[]/polygon[]/@points[] 20, svg/g[]/line[]/@x1 9; above the b2 cohort; not censused (add3 re-census)) |
| fovaja-48-leso567 | 268 | 144 | T1b | snake merge | pinned (add2-b3w1) |
| gitoke-38-beme495 | 306 | 1 | T1b | snake merge | pinned (add2-b3w1) |
| jafuli-91-sota277 | 157 | 0 | T1b | snake merge | pinned (add2-b1) |
| jageti-56-kume076 | 188 | 182 | T1b | snake merge | open -> add3 (ws 74, text-only, top svg/g[]/path[]/@d[] 15, svg/g[]/polygon[]/@points[] 12; above the b2 cohort; not censused (add3 re-census)) |
| japeru-28-guku001 | 495 | 347 | T1b | snake merge | open -> add3 (ws 326, exact, top svg/g[]/polygon[]/@points[] 181, svg/g[]/line[]/@x1 29; above the b2 cohort; not censused (add3 re-census)) |
| judatu-15-xize591 | 370 | 353 | T1b | snake merge | pinned (add2-b3) |
| jupivo-67-gidi531 | 263 | 209 | T1b | snake merge | open -> add3 (ws 69, extra line, top svg/g[]/polygon[]/@points[] 26, svg/g[]/line[]/@y2 12; above the b2 cohort; not censused (add3 re-census)) |
| jupoxe-15-sugo110 | 1825 | 1822 | T1b+T2e/T2h | snake merge; T2e/T2h 1822->1238 | open -> add3 (ws 705, exact, top svg/g[]/polygon[]/@points[] 421, svg/g[]/line[]/@y2 86; above the b2 cohort; not censused (add3 re-census)) |
| kodaku-19-moni161 | 251 | 212 | T1b | snake merge | pinned (add2-b3w1) |
| leduvi-16-voli986 | 280 | 261 | T1b | snake merge | pinned (add2-b3w1) |
| levuma-67-cego489 | 197 | 101 | T1b | snake merge | open -> add3 (ws 4, exact, top svg/g[]/ellipse[]/@stroke 3, svg/g[]/ellipse[]/@fill 1; b2 family DARK > RNOOUT landed in batch 3; residual needs re-census (add3)) |
| lopone-15-xiki477 | 274 | 216 | T1b | snake merge | pinned (add2-b3w1) |
| lufamo-62-xavo766 | 197 | 0 | T1b | snake merge | pinned (add2-b1) |
| mabuke-20-muco282 | 343 | 299 | T1b | snake merge | open -> add3 (ws 3, exact, top svg/g[]/text[]/@x 3; above the b2 cohort; not censused (add3 re-census)) |
| nikivo-06-kaxa873 | 241 | 330 | T1b | snake merge (D7 reveal) | open -> add3 (ws 330, exact, top svg/g[]/polygon[]/@points[] 56, svg/g[]/line[]/@y2 23; above the b2 cohort; not censused (add3 re-census)) |
| nojije-35-teta491 | 244 | 115 | T1b | snake merge | open -> add3 (ws 113, exact, top svg/g[]/polygon[]/@points[] 54, svg/g[]/line[]/@x1 20; UNK: mechanism unknown: if/elseif with stop across 2 lanes (FtileIfLongHorizontal); lane A content 7.9px right, total width -5. Ruled out: elemen) |
| rosepa-78-xivi448 | 352 | 291 | T1b | snake merge | pinned (add2-b3w1) |
| rucuga-83-tosu408 | 207 | 136 | T1b | snake merge | open -> add3 (ws 126, extra line+arrow, top svg/g[]/polygon[]/@points[] 49, svg/g[]/path[]/@d[] 20; b2 family NOTE > WORD > ORD landed in batch 3; residual needs re-census (add3)) |
| rujuxa-07-neco067 | 158 | 18 | T1b | snake merge | open -> add3 (ws 10, extra line, top svg/g[]/line[]/@y1 2, svg/g[]/line[]/@y2 1; XLANE > EMMID > ORD: FtileIfWithLinks.java:149-174 (ConnectionHorizontalThenVertical.drawTranslate: p1 -> (p2.x,p1.y) -> p2, 2 segments) / :238-286 (ConnectionVe) |
| ruzica-16-deli877 | 463 | 697 | T1b | snake merge (D7 reveal) | open -> add3 (ws 594, exact, top svg/g[]/polygon[]/@points[] 60, svg/g[]/line[]/@y2 26; above the b2 cohort; not censused (add3 re-census)) |
| vamazo-19-tufu812 | 297 | 269 | T1b | snake merge | open -> add3 (ws 67, exact, top svg/g[]/polygon[]/@points[] 28, svg/g[]/line[]/@y2 12; above the b2 cohort; not censused (add3 re-census)) |
| vebala-15-tade547 | 289 | 8 | T1b | snake merge | pinned (add2-b3w1) |
| xefalo-73-sabi101 | 371 | 318 | T1b | snake merge | open -> add3 (ws 318, exact, top svg/g[]/polygon[]/@points[] 149, svg/g[]/line[]/@y2 42; above the b2 cohort; not censused (add3 re-census)) |
| zeporo-46-zicu301 | 314 | 135 | T1b | snake merge | open -> add3 (ws 129, exact, top svg/g[]/polygon[]/@points[] 61, svg/g[]/line[]/@x1 24; UNK > EMMID: mechanism unknown: if/elseif/nested if across lanes with TITLE; PROCESS 1 lane content +11px in the jar. Ruled out: element counts equal; to) |
