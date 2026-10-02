# Row ledger: add1

Seeded at planning (2026-09-30, main d4e29cc8c) from `measurements/plan-classify.json`:
every `status: "baseline"` fixture with `weightedScore` <= 100 — **75 rows**. T0a
re-measures on the branch (`b0`) and corrects any row whose score moved; the
cohort is re-cut at every close (D6: rows with ws <= 100 at the latest close).

**b0 (branch `dd5e93af9`, 2026-09-30):** every row's ws, family set and shift
pair are identical to planning on all 311 baseline rows (`measurements/
b0-classify.json` vs `plan-classify.json`, 0 mismatches); cohort = the same 75
rows, so no `ws (b0)` column is needed and no row was added.

`families` is the diff-family set at planning: `canvas` (svg/@width|height|viewBox),
`pos` (positional attrs, polygon points, textLength), `circle` (ellipse rx/ry/stroke),
`childCount`, `draw-order/text` (text()/font-size swaps), `stroke` (stroke-width),
else the raw attribute. `shift` = the distinct (jar − ours) x / y deltas.

`final` ∈ `pinned (<commit>)` · `open -> add2 (<mechanism>)`.

## Rows

**b1 close (2026-09-30):** 35 rows pinned (`add1-b1`); 49 rows joined the cohort
(marked `(b1)`); open cohort = un-pinned rows with ws <= 100 at b1.

**b1b close (2026-10-01):** 4 more pinned (`add1-b1b`), 39 total. Every open
cohort row (ws <= 100 at b1b, 88) carries its batch-2 family (`task`) and named
next mechanism; 2 rows go `open -> add2` (oracle instrument seam).

**b2 close (2026-10-01):** 16 more pinned (`add1-b2`), 55 total. Cohort at b2 =
73 rows (ws <= 100), every one assigned to a batch-3 family (`task`) with its
named mechanism; 6 reveal-risen rows (now > 100) stay with their family.

**b3 close (2026-10-02):** 12 more pinned (`add1-b3`), 67 total. Remaining open
rows get their `final` at T-exit.

**T-exit (2026-10-02):** every row carries a `final`.

| slug | ws (plan) | ws (b1) | ws (b1b) | ws (b2) | ws (b3) | families (b1) | shift x / y (b1) | task | mechanism | final |
|---|---|---|---|---|---|---|---|---|---|---|
| kodiji-34-mofe202 | 6 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| gonixe-93-zaza537 | 9 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| kubaso-31-gaxu491 | 9 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| narota-16-bago100 | 9 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| taxeta-89-mapo546 | 9 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| dunejo-33-divo189 | 15 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| gizore-52-fode894 | 15 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| rurake-60-licu592 | 15 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| rarodo-65-fudu505 | 16 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| dakesa-98-mano758 | 22 | 13 | 13 | 13 | 13 | @fill, childCount | / | T3d | gradient BackgroundColor (theme field typed string, not Paint) | open -> add2 (gradient BackgroundColor (theme field typed string, not Paint); residual per journal row 41) |
| disemi-67-keva276 | 23 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| fabuli-92-vemo727 | 23 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| gimegi-77-xidu727 | 23 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| goxoni-69-lemo511 | 23 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| lajuxi-63-nopo039 | 23 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| cizixu-00-koro700 | 24 | 2 | 2 | 0 | — | canvas | / | T2e (b2 batch) | canvas width +1/+2 residual (LimitFinder far corner) | pinned (add1-b2) |
| fonebe-54-save009 | 24 | 1 | 1 | 0 | — | stroke | / | T2c (b2 batch) | arrow thickness on line stroke-width | pinned (add1-b2) |
| fabule-54-pili300 | 25 | 22 | 22 | 22 | 22 | @height, @width, canvas, childCount, draw-order/text, pos | / 24 | T3e | creole table / %n() / ____ in action text | open -> add2 (creole table / %n() / ____ in action text; residual per journal row 40) |
| jidefi-14-kafe151 | 26 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| numalo-91-pole243 | 26 | 12 | 11 | 0 | — | canvas, circle, pos | / -3 | T2e (b2 batch) | arrowhead UPolygon ink in the ink-min (HACK_X_FOR_POLYGON, journal 10) | pinned (add1-b2) |
| farexi-86-xanu521 | 28 | 2 | 2 | 2 | 2 | @fill, @stroke | / | T3d | ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153) | open -> add2 (ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153); residual per journal row 41) |
| zanudo-86-seco241 | 28 | 2 | 2 | 2 | 2 | @fill, @stroke | / | T3d | ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153) | open -> add2 (ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153); residual per journal row 41) |
| fofele-65-lozo631 | 29 | 3 | 3 | 3 | 3 | @fill, @stroke, stroke | / | T3d | ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153) | open -> add2 (ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153); residual per journal row 41) |
| naroji-40-nuke022 | 29 | 3 | 3 | 3 | 3 | @fill, @stroke, stroke | / | T3d | ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153) | open -> add2 (ArrowHeadColor skinparam -> PName.HeadColor (Worm.java:146-154, FromSkinparamToStyle.java:153); residual per journal row 41) |
| duzumu-46-geve509 | 31 | 10 | 0 | — | — | canvas, circle, pos | / -3 | T1c | stop/end circles 1:1 (T1c) on top of T1a/T1b | pinned (add1-b1b) |
| volefo-41-tolo996 | 35 | 30 | 30 | 31 | 29 | @d, @d[], @fill, canvas, pos | -9.5 / -5.889,-14 | T3d | note BackGroundColor #FEFFDD (plantuml.skin note SName) | open -> add2 (note BackGroundColor #FEFFDD (plantuml.skin note SName); residual per journal row 41) |
| zedoco-71-guge507 | 35 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| letare-59-gore448 | 36 | 24 | 24 | 24 | 2 | canvas, pos | 9.994,9.993,10 / -11,-13 | T3g | title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory) | open -> add2 (title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory); residual per journal row 36/49/52) |
| niluji-46-joma773 | 40 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| tagixo-41-gapo816 | 40 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| topico-42-fuza478 | 40 | 2 | 2 | 0 | — | canvas | / | T2e (b2 batch) | canvas width +1/+2 residual (LimitFinder far corner) | pinned (add1-b2) |
| fotamo-01-rupi481 | 42 | 12 | 2 | 0 | — | canvas, circle, pos | / -3 | T2e (b2 batch) | canvas width +1/+2 residual (LimitFinder far corner) | pinned (add1-b2) |
| gepetu-15-seba834 | 42 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| jodagi-12-xatu540 | 42 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| femaco-88-bufe808 | 43 | 10 | 0 | — | — | canvas, circle, pos | / -3 | T1c | stop/end circles 1:1 (T1c) on top of T1a/T1b | pinned (add1-b1b) |
| fisaca-74-deco063 | 43 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| setecu-78-cuko533 | 44 | 11 | 1 | 1 | 1 | @preserveAspectRatio, canvas, circle, pos | / -3 | add2 | preserveAspectRatio hardcoded in src/core/klimt/document-shell.ts:197 (stop 8) | open -> add2 (preserveAspectRatio hardcoded in src/core/klimt/document-shell.ts:197 (stop 8)) |
| lubapi-40-siji634 | 49 | 15 | 4 | 0 | — | canvas, circle, pos, stroke | 3.712,-3.712,16.086 / -4,-0.288,-7.712 | T2f (b2 batch) | FtileCircleEndCross 2nd diagonal endpoints reversed (FtileCircleEndCross.java:115) | pinned (add1-b2) |
| sufupo-40-fuke080 | 49 | 10 | 0 | — | — | canvas, circle, pos | / -3 | T1c | stop/end circles 1:1 (T1c) on top of T1a/T1b | pinned (add1-b1b) |
| activity-creole-table | 51 | 47 | 47 | 47 | 35 | @height, @width, canvas, childCount, draw-order/text, pos | / 2 | T3e | creole table / %n() / ____ in action text | open -> add2 (creole table / %n() / ____ in action text; residual per journal row 40) |
| niletu-83-lego826 | 51 | 47 | 47 | 47 | 35 | @height, @width, canvas, childCount, draw-order/text, pos | / 2 | T3e | creole table / %n() / ____ in action text | open -> add2 (creole table / %n() / ____ in action text; residual per journal row 40) |
| molexa-46-redi999 | 52 | 16 | 5 | 1 | 1 | canvas, circle, pos, stroke | 57.975,3.712,-3.712 / -4,-0.288,-7.712 | T3e | skinparam defaultTextAlignment center in action text | open -> add2 (skinparam defaultTextAlignment center in action text; residual per journal row 40) |
| sikino-19-vuca111 | 54 | 50 | 50 | 20 | 2 | canvas, pos | 5,6 / 15,10 | T3i | swimlane title band height (+1..2 y, title text metrics) | open -> add2 (swimlane title band height (+1..2 y, title text metrics); residual per journal row 45) |
| podelo-13-jaja314 | 57 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| ruderu-68-dere287 | 58 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| poraji-17-goke817 | 61 | 50 | 48 | 25 | 0 | @fill, @height, @width, canvas, childCount, circle, pos, stroke | 3.712,-3.712,16.086 / -4,-0.288,-7.712 | T3b | gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut) | pinned (add1-b3) |
| laxibe-66-teme800 | 62 | 39 | 39 | 39 | 26 | @width, canvas, childCount, draw-order/text, pos | -6.6,143.1 / | T3e | creole [[url{tip}label]] in action text | open -> add2 (creole [[url{tip}label]] in action text; residual per journal row 40) |
| zamagu-75-vape137 | 62 | 39 | 39 | 39 | 2 | @width, canvas, childCount, draw-order/text, pos | -69.15,18 / | T3e | creole [[url{tip}label]] in action text | open -> add2 (creole [[url{tip}label]] in action text; residual per journal row 40) |
| fabexi-81-dife869 | 66 | 15 | 4 | 0 | — | canvas, circle, pos, stroke | 3.712,-3.712,16.087 / -4,-0.288,-7.712 | T2f (b2 batch) | FtileCircleEndCross 2nd diagonal endpoints reversed (FtileCircleEndCross.java:115) | pinned (add1-b2) |
| pakema-21-xema183 | 66 | 65 | 65 | 62 | 2 | @width, canvas, pos | 5,6,7.663 / 25.5,20.5 | T3i | swimlane title band height (+1..2 y, title text metrics) | open -> add2 (swimlane title band height (+1..2 y, title text metrics); residual per journal row 45) |
| tefuga-86-xefe850 | 66 | 64 | 64 | 53 | 2 | canvas, pos | 5,5.168,5.169 / 25.5,20.5 | T3i | swimlane title band height (+1..2 y, title text metrics) | open -> add2 (swimlane title band height (+1..2 y, title text metrics); residual per journal row 45) |
| gaxezi-48-zesa921 | 68 | 54 | 44 | 44 | 2 | @width, canvas, childCount, circle, draw-order/text, pos | -6.6,144.6 / -3 | T3e | creole [[url{tip}label]] in action text | open -> add2 (creole [[url{tip}label]] in action text; residual per journal row 40) |
| nisexe-68-vabu320 | 68 | 54 | 44 | 44 | 2 | @width, canvas, childCount, circle, draw-order/text, pos | -6.6,144.6 / -3 | T3e | creole [[url{tip}label]] in action text | open -> add2 (creole [[url{tip}label]] in action text; residual per journal row 40) |
| pekuxe-00-bovi270 | 68 | 54 | 44 | 44 | 1 | @width, canvas, childCount, circle, draw-order/text, pos | -6.6,144.6 / -3 | T3e | creole [[url{tip}label]] in action text | open -> add2 (creole [[url{tip}label]] in action text; residual per journal row 40) |
| piruxe-91-zivi081 | 73 | 52 | 52 | 24 | 0 | canvas, childCount, pos | / -58,-100 | T3b | gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut) | pinned (add1-b3) |
| dirame-64-cica627 | 75 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| cubida-55-meku256 | 80 | 80 | 80 | 80 | 78 | @d, @d[], @fill, canvas, childCount, draw-order/text, pos | 66.091,107.156 / -53.667,-52 | T3b | note spike tip never computed (Opale getPolygonLeft/Right dead) | open -> add2 (note spike tip never computed (Opale getPolygonLeft/Right dead); residual per journal row 44) |
| jakuco-69-dari135 | 82 | 80 | 80 | 69 | 2 | canvas, pos | 5,6 / 25.5,20.5 | T3i | swimlane title band height (+1..2 y, title text metrics) | open -> add2 (swimlane title band height (+1..2 y, title text metrics); residual per journal row 45) |
| gufuma-85-zoce945 | 83 | 74 | 68 | 68 | 68 | @height, @width, canvas, childCount, circle, pos | 4.125 / -21,-18 | add2 | embedded {{ }} diagram: oracle 42x42 slot (memory oracle-seam-embedded-42x42) | open -> add2 (embedded {{ }} diagram: oracle 42x42 slot (memory oracle-seam-embedded-42x42)) |
| vimoxa-78-zucu656 | 86 | 82 | 82 | 82 | 80 | @d, @d[], @fill, @font-family, canvas, childCount, draw-order/text, pos | 4.556,119.913 / -66.389,-92.667,-52 | T3b | note spike tip never computed (Opale getPolygonLeft/Right dead) | open -> add2 (note spike tip never computed (Opale getPolygonLeft/Right dead); residual per journal row 44) |
| sopape-11-laxo488 | 87 | 87 | 79 | 73 | 5 | @width, canvas, circle, pos, stroke | 5,1,8.712 / 25.5,21.5,25.212 | T3i | swimlane title band height (+1..2 y, title text metrics) | open -> add2 (swimlane title band height (+1..2 y, title text metrics); residual per journal row 45) |
| carapo-31-bisi880 | 89 | 88 | 88 | 97 | 77 | canvas, draw-order/text, line[], polygon[], pos | -3.166,9.668,-16 / 11,28.5,-12 | T3f | ConditionStyle InsideDiamond (unported style) | open -> add2 (ConditionStyle InsideDiamond (unported style); residual per journal row 42) |
| rerovo-62-nazo755 | 89 | 50 | 50 | 46 | 4 | canvas, draw-order/text, line[], polygon[], pos | 12.834,-12.834,24 / 17.5,-17.5,-100 | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | open -> add2 (if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42) |
| cetica-88-toke482 | 91 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| vimako-25-mega336 | 92 | 67 | 67 | 70 | 34 | @font-weight, canvas, childCount, draw-order/text, pos | 9.809,-9.809 / 10.5,39.5,-17.5 | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | open -> add2 (if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42) |
| dexero-99-ziru660 | 93 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| kuzeru-09-voke075 | 93 | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| norire-15-taka956 | 93 | 87 | 89 | 89 | 85 | @d, @d[], @fill, canvas, childCount, pos | 63.078 / -54.389,-52,-48 | T3b | note spike tip never computed (Opale getPolygonLeft/Right dead) | open -> add2 (note spike tip never computed (Opale getPolygonLeft/Right dead); residual per journal row 44) |
| patagi-39-jone354 | 94 | 90 | 86 | 75 | 2 | canvas, circle, pos, stroke | 5,6,9.712 / 25.5,17.5,21.5 | T3i | swimlane title band height (+1..2 y, title text metrics) | open -> add2 (swimlane title band height (+1..2 y, title text metrics); residual per journal row 45) |
| novata-87-muti352 | 96 | 71 | 71 | 69 | 53 | canvas, childCount, draw-order/text, pos | 18.644,-18.644,12 / 20.5,-20,-3 | T3f | ConditionStyle InsideDiamond (unported style) | open -> add2 (ConditionStyle InsideDiamond (unported style); residual per journal row 42) |
| povoju-50-raxi136 | 97 | 94 | 94 | 80 | 2 | canvas, pos | 5,5.168,5.169 / 25.5,20.5 | T3i | swimlane title band height (+1..2 y, title text metrics) | open -> add2 (swimlane title band height (+1..2 y, title text metrics); residual per journal row 45) |
| bigide-91-bise382 | 98 | 75 | 71 | 71 | 67 | @height, canvas, childCount, circle, pos, stroke | 1.288,0.8,4.512 / 10,-2,-6 | T3g | title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory) | open -> add2 (title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory); residual per journal row 36/49/52) |
| jipapo-14-kevu587 | 98 | 95 | 95 | 116 | 110 | @d, @d[], @fill, canvas, childCount, draw-order/text, pos | 56.728,71.109,42.347 / -53.889,-34,40.5 | T3d | note BackGroundColor #FEFFDD (plantuml.skin note SName) | open -> add2 (note BackGroundColor #FEFFDD (plantuml.skin note SName); residual per journal row 41) |
| nijipa-25-pede639 | 98 | 96 | 96 | 126 | 113 | @d, @d[], @fill, canvas, childCount, draw-order/text, pos | 56.728,71.109,42.347 / -53.889,-34,40.5 | T3d | note BackGroundColor #FEFFDD (plantuml.skin note SName) | open -> add2 (note BackGroundColor #FEFFDD (plantuml.skin note SName); residual per journal row 41) |
| jecoxu-17-zama003 | 99 | 76 | 59 | 54 | 54 | canvas, childCount, circle, pos, stroke | -12,-8.287,-15.712 / -4,-2,1.712 | T3b | touching edges not fused (Snake.merge, Snake.java:303-327) | open -> add2 (touching edges not fused (Snake.merge, Snake.java:303-327); residual per journal row 44) |
| cugezi-99-tire097 (b1) | — | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| darote-51-kuta407 (b1) | — | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| fufefa-17-faje066 (b1) | — | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| gebuzi-30-nulo391 (b1) | — | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| ketiro-31-nazo312 (b1) | — | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| kojivo-44-ceti956 (b1) | — | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| lokane-30-dinu378 (b1) | — | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| mulida-55-ceja768 (b1) | — | 0 | — | — | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| daxare-39-buci637 (b1) | — | 2 | 2 | 0 | — | pos | / | T2f (b2 batch) | diamond/hexagon polygon not closed (jar repeats first point) | pinned (add1-b2) |
| feceme-58-xodo415 (b1) | — | 2 | 2 | 0 | — | pos | / | T2f (b2 batch) | diamond/hexagon polygon not closed (jar repeats first point) | pinned (add1-b2) |
| calenu-74-vigo098 (b1) | — | 4 | 4 | 0 | — | pos | / | T2f (b2 batch) | diamond/hexagon polygon not closed (jar repeats first point) | pinned (add1-b2) |
| suzuci-53-biku826 (b1) | — | 4 | 4 | 0 | — | @fill, pos | / | T2c (b2 batch) | arrow font colour on edge label text | pinned (add1-b2) |
| ciceto-21-zanu057 (b1) | — | 6 | 6 | 0 | — | canvas, pos | / | T2f (b2 batch) | diamond/hexagon polygon not closed (jar repeats first point) | pinned (add1-b2) |
| sokafe-69-jita472 (b1) | — | 6 | 6 | 0 | — | canvas, pos | / | T2f (b2 batch) | diamond/hexagon polygon not closed (jar repeats first point) | pinned (add1-b2) |
| covage-54-pine573 (b1) | — | 10 | 0 | — | — | canvas, circle, pos | / -3 | T1c | stop/end circles 1:1 (T1c) on top of T1a/T1b | pinned (add1-b1b) |
| garuga-34-debe901 (b1) | — | 14 | 4 | 4 | 0 | @stroke, canvas, circle, pos, stroke | / -3 | T3a | fork/join bar stroked + filled in ActivityBarColor (FtileBlackBlock.java:97-104) | pinned (add1-b3) |
| xigelo-67-sipi599 (b1) | — | 14 | 4 | 0 | — | canvas, circle, pos | / -3 | T2f (b2 batch) | diamond/hexagon polygon not closed (jar repeats first point) | pinned (add1-b2) |
| barada-07-veca157 (b1) | — | 19 | 8 | 0 | — | canvas, circle, pos, stroke | 3.712,-3.713,16.086 / -4,-0.288,-7.712 | T2f (b2 batch) | FtileCircleEndCross 2nd diagonal endpoints reversed (FtileCircleEndCross.java:115) | pinned (add1-b2) |
| fomapa-90-bore251 (b1) | — | 30 | 30 | 30 | 2 | canvas, pos | / 7.5,15 | T3c | assembly gap 35 (FtileFactoryDelegatorAssembly.java:58) then ON_Y compression; NODE_MARGIN_Y=20 is unsourced | open -> add2 (assembly gap 35 (FtileFactoryDelegatorAssembly.java:58) then ON_Y compression; NODE_MARGIN_Y=20 is unsourced; residual per journal row 38) |
| fonabu-93-xama593 (b1) | — | 42 | 42 | 38 | 0 | canvas, line[], polygon[], pos | 24 / -96 | T3a | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171) | pinned (add1-b3) |
| gakelo-29-neno787 (b1) | — | 42 | 42 | 38 | 0 | line[], polygon[], pos | 37.335 / -96 | T3a | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171) | pinned (add1-b3) |
| vozane-63-kepe177 (b1) | — | 42 | 42 | 38 | 0 | line[], polygon[], pos | 37.335 / -96 | T3a | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171) | pinned (add1-b3) |
| fivama-51-cusa142 (b1) | — | 45 | 16 | 12 | 12 | canvas, circle, pos | / -3,-9,-6 | T3b | gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut) | open -> add2 (gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut); residual per journal row 44) |
| livigo-47-negi605 (b1) | — | 48 | 48 | 44 | 3 | canvas, line[], polygon[], pos | 3.275,6.637,34.275 / 10,-96,-11 | T3a | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171) | open -> add2 (Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37) |
| nusajo-97-bemo713 (b1) | — | 48 | 48 | 44 | 3 | canvas, line[], polygon[], pos | 3.275,6.637,34.275 / 10,-96,-11 | T3a | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171) | open -> add2 (Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37) |
| tamaxe-36-mono574 (b1) | — | 48 | 48 | 46 | 4 | draw-order/text, line[], polygon[], pos | 22.012,-22.012,39.05 / 17.5,-17.5,-100 | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | open -> add2 (if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42) |
| zizaki-04-guvi945 (b1) | — | 49 | 49 | 49 | 0 | @stroke, canvas, pos, stroke | / 15,30,7.5 | T3c | assembly gap 35 (FtileFactoryDelegatorAssembly.java:58) then ON_Y compression; NODE_MARGIN_Y=20 is unsourced | pinned (add1-b3) |
| lacuci-13-nogo718 (b1) | — | 50 | 50 | 46 | 4 | canvas, draw-order/text, line[], polygon[], pos | 22.013,-22.013,30.012 / 17.5,-17.5,-100 | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | open -> add2 (if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42) |
| pedoco-30-mose082 (b1) | — | 50 | 50 | 46 | 4 | canvas, draw-order/text, line[], polygon[], pos | 22.012,-22.012,39.05 / 17.5,-17.5,-100 | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | open -> add2 (if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42) |
| xenofo-81-rame803 (b1) | — | 51 | 45 | 45 | 0 | canvas, circle, pos | / 4.5,12,9 | T3c | assembly gap 35 (FtileFactoryDelegatorAssembly.java:58) then ON_Y compression; NODE_MARGIN_Y=20 is unsourced | pinned (add1-b3) |
| ziboco-73-kazu841 (b1) | — | 53 | 43 | 33 | 2 | canvas, childCount, circle, pos | / -3,-96,96 | T3f | repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5 | open -> add2 (repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5; residual per journal row 42) |
| cagoze-40-tete366 (b1) | — | 60 | 50 | 46 | 4 | canvas, circle, draw-order/text, line[], polygon[], pos | 76.772,-76.772,84.772 / 17.5,-17.5,-3 | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | open -> add2 (if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42) |
| nonusu-50-nute147 (b1) | — | 65 | 81 | 16 | 0 | canvas, circle, draw-order/text, pos | 8.572,-8.572,-6 / -3,17.5,-17.5 | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | pinned (add1-b3) |
| saxeku-17-gume203 (b1) | — | 67 | 61 | 58 | 58 | canvas, childCount, circle, pos | 68,46,-68 / -12,-15,-18 | T3f | ConditionEndStyle hline (FtileIfDown.java:147-150) | open -> add2 (ConditionEndStyle hline (FtileIfDown.java:147-150); residual per journal row 42) |
| nimusa-16-tiku252 (b1) | — | 74 | 74 | 75 | 0 | canvas, line[], polygon[], pos | 28.025 / 15,-148 | T3c | assembly gap 35 (FtileFactoryDelegatorAssembly.java:58) then ON_Y compression; NODE_MARGIN_Y=20 is unsourced | pinned (add1-b3) |
| dulezi-77-sana210 (b1) | — | 75 | 65 | 75 | 0 | canvas, circle, draw-order/text, pos | 14.675,-0.844,30.194 / 3.611,-3 | T3d | activityDiamondFontSize handler (FromSkinparamToStyle.java:147) | pinned (add1-b3) |
| guceja-66-tola192 (b1) | — | 75 | 69 | 66 | 6 | canvas, childCount, circle, pos | / 7.5,4.5,-148 | T3f | repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5 | open -> add2 (repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5; residual per journal row 42) |
| cifafo-49-jazi415 (b1) | — | 77 | 67 | 67 | 63 | canvas, circle, pos | 10,10.15 / 10,-3 | T3g | title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory) | open -> add2 (title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory); residual per journal row 36/49/52) |
| becaje-01-vaji284 (b1) | — | 82 | 59 | 54 | 54 | canvas, childCount, circle, pos, stroke | -12,-8.287,-15.712 / -4,-2,1.712 | T3b | touching edges not fused (Snake.merge, Snake.java:303-327) | open -> add2 (touching edges not fused (Snake.merge, Snake.java:303-327); residual per journal row 44) |
| zukori-83-fiso705 (b1) | — | 82 | 82 | 76 | 0 | canvas, line[], polygon[], pos | 31.362,49.362 / -96,-288 | T3a | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171) | pinned (add1-b3) |
| biguku-39-voxu233 (b1) | — | 86 | 86 | 42 | 2 | canvas, line[], polygon[], pos, rect[], text[] | 123.625 / 96 | T3f | repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5 | open -> add2 (repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5; residual per journal row 42) |
| bozuro-33-celo170 (b1) | — | 86 | 77 | 70 | 58 | canvas, childCount, circle, pos, stroke | 3.712,-3.713,16.086 / -4,-0.288,-7.712 | T3f | repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5 | open -> add2 (repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5; residual per journal row 42) |
| bocaga-53-nale241 (b1) | — | 90 | 71 | 66 | 66 | canvas, childCount, circle, pos, stroke | -12,-8.287,-15.712 / -2,1.712,-5.712 | T3b | touching edges not fused (Snake.merge, Snake.java:303-327) | open -> add2 (touching edges not fused (Snake.merge, Snake.java:303-327); residual per journal row 44) |
| bazuma-86-metu353 (b1) | — | 93 | 93 | 103 | 57 | canvas, childCount, draw-order/text, pos | 60.812,84.431 / 17.444,33.944,44.944 | T3f | multiline branch label height + one <text> per line | open -> add2 (multiline branch label height + one <text> per line; residual per journal row 42) |
| fikuki-99-kulu790 (b1) | — | 94 | 88 | 88 | 88 | @height, canvas, childCount, circle, pos | 60.338 / -81,-78 | add2 | embedded {{ }} diagram: oracle 42x42 slot (memory oracle-seam-embedded-42x42) | open -> add2 (embedded {{ }} diagram: oracle 42x42 slot (memory oracle-seam-embedded-42x42)) |
| simuti-16-lece058 (b1) | — | 94 | 96 | 0 | — | @stroke, canvas, childCount, circle, pos, stroke | 37.163,49.537,6.187 / -24,-48,-52 | T2b (b2 batch) | kill/detach as mutation (InstructionSimple.kill) | pinned (add1-b2) |
| rosizo-69-mera514 (b1) | — | 96 | 90 | 91 | 4 | canvas, circle, draw-order/text, line[], polygon[], pos | 37.928,-37.928,45.928 / 15,17.5,-17.5 | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | open -> add2 (if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42) |
| debofa-60-mude568 (b1) | — | 100 | 94 | 91 | 39 | canvas, childCount, circle, draw-order/text, pos, stroke | 90.422,3.712,-3.712 / -47.723,6,9.712 | T3h | backward: box + connectors unported (activity-loop-backward) | open -> add2 (backward: box + connectors unported (activity-loop-backward); residual per journal row 43/47) |
| secepo-00-febi326 (b1) | — | 100 | 100 | 106 | 4 | canvas, childCount, draw-order/text, pos | 22.012,-22.012 / 5,28.5,-17.5 | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | open -> add2 (if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42) |
| caciva-80-kene990 (b1b) | — | — | 99 | 109 | 109 | — | — | T3b | partition title not threaded onto the composite node | open -> add2 (partition title not threaded onto the composite node; residual per journal row 44) |
| mifejo-31-sovi184 (b1b) | — | — | 100 | 122 | 118 | — | — | T3d | note BackGroundColor #FEFFDD (plantuml.skin note SName) | open -> add2 (note BackGroundColor #FEFFDD (plantuml.skin note SName); residual per journal row 41) |
| vaxuta-95-cico162 (b1b) | — | — | 100 | 97 | 81 | — | — | T3f | if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first | open -> add2 (if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first; residual per journal row 42) |
| cufega-65-beji958 (b2) | — | — | — | 42 | 2 | — | — | T3a | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171) | open -> add2 (Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37) |
| foludi-80-gilo247 (b2) | — | — | — | 74 | 10 | — | — | T3a | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171) | open -> add2 (Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37) |
| perate-09-gale335 (b2) | — | — | — | 79 | 38 | — | — | T3f | ConditionStyle InsideDiamond (unported style) | open -> add2 (ConditionStyle InsideDiamond (unported style); residual per journal row 42) |
| ribapo-84-xudu593 (b2) | — | — | — | 85 | 5 | — | — | T3a | Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171) | open -> add2 (Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171); residual per journal row 37) |
| gevaxi-80-tone223 (b2) | — | — | — | 93 | 89 | — | — | T3b | gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut) | open -> add2 (gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut); residual per journal row 44) |
| kenizo-43-siro273 (b2) | — | — | — | 97 | 60 | — | — | T3h | backward: box + connectors unported (activity-loop-backward) | open -> add2 (backward: box + connectors unported (activity-loop-backward); residual per journal row 43/47) |
| nexitu-74-luga914 (b2) | — | — | — | 99 | 51 | — | — | T3b | gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut) | open -> add2 (gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut); residual per journal row 44) |
