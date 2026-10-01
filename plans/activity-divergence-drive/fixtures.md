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

| slug | ws (plan) | ws (b1) | ws (b1b) | families (b1) | shift x / y (b1) | task | mechanism | final |
|---|---|---|---|---|---|---|---|---|
| kodiji-34-mofe202 | 6 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| gonixe-93-zaza537 | 9 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| kubaso-31-gaxu491 | 9 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| narota-16-bago100 | 9 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| taxeta-89-mapo546 | 9 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| dunejo-33-divo189 | 15 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| gizore-52-fode894 | 15 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| rurake-60-licu592 | 15 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| rarodo-65-fudu505 | 16 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| dakesa-98-mano758 | 22 | 13 | 13 | @fill, childCount | / | T2f | node stroke/fill style: rect stroke #F00 missing, gradient fill |  |
| disemi-67-keva276 | 23 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| fabuli-92-vemo727 | 23 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| gimegi-77-xidu727 | 23 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| goxoni-69-lemo511 | 23 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| lajuxi-63-nopo039 | 23 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| cizixu-00-koro700 | 24 | 2 | 2 | canvas | / | T2e | canvas width +1/+2 residual (LimitFinder far corner) |  |
| fonebe-54-save009 | 24 | 1 | 1 | stroke | / | T2c | arrow thickness on line stroke-width |  |
| fabule-54-pili300 | 25 | 22 | 22 | @height, @width, canvas, childCount, draw-order/text, pos | / 24 | T2c | creole table / %n() / ____ separator in action text |  |
| jidefi-14-kafe151 | 26 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| numalo-91-pole243 | 26 | 12 | 11 | canvas, circle, pos | / -3 | T2e | arrowhead UPolygon ink in the ink-min (HACK_X_FOR_POLYGON, journal 10) |  |
| farexi-86-xanu521 | 28 | 2 | 2 | @fill, @stroke | / | T2c | arrowhead fill/stroke from arrow colour skinparam |  |
| zanudo-86-seco241 | 28 | 2 | 2 | @fill, @stroke | / | T2c | arrowhead fill/stroke from arrow colour skinparam |  |
| fofele-65-lozo631 | 29 | 3 | 3 | @fill, @stroke, stroke | / | T2c | arrowhead fill/stroke from arrow colour skinparam |  |
| naroji-40-nuke022 | 29 | 3 | 3 | @fill, @stroke, stroke | / | T2c | arrowhead fill/stroke from arrow colour skinparam |  |
| duzumu-46-geve509 | 31 | 10 | 0 | canvas, circle, pos | / -3 | T1c | stop/end circles 1:1 (T1c) on top of T1a/T1b | pinned (add1-b1b) |
| volefo-41-tolo996 | 35 | 30 | 30 | @d, @d[], @fill, canvas, pos | -9.5 / -5.889,-14 | T2f | note shape path + fill (FtileNoteOpale/Opale geometry) |  |
| zedoco-71-guge507 | 35 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| letare-59-gore448 | 36 | 24 | 24 | canvas, pos | 9.994,9.993,10 / -11,-13 | T2e | document title / legend chrome offset |  |
| niluji-46-joma773 | 40 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| tagixo-41-gapo816 | 40 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| topico-42-fuza478 | 40 | 2 | 2 | canvas | / | T2e | canvas width +1/+2 residual (LimitFinder far corner) |  |
| fotamo-01-rupi481 | 42 | 12 | 2 | canvas, circle, pos | / -3 | T2e | canvas width +1/+2 residual (LimitFinder far corner) |  |
| gepetu-15-seba834 | 42 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| jodagi-12-xatu540 | 42 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| femaco-88-bufe808 | 43 | 10 | 0 | canvas, circle, pos | / -3 | T1c | stop/end circles 1:1 (T1c) on top of T1a/T1b | pinned (add1-b1b) |
| fisaca-74-deco063 | 43 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| setecu-78-cuko533 | 44 | 11 | 1 | @preserveAspectRatio, canvas, circle, pos | / -3 | T2c | svg root preserveAspectRatio option |  |
| lubapi-40-siji634 | 49 | 15 | 4 | canvas, circle, pos, stroke | 3.712,-3.712,16.086 / -4,-0.288,-7.712 | T2f | FtileCircleEndCross 2nd diagonal endpoints reversed (FtileCircleEndCross.java:115) |  |
| sufupo-40-fuke080 | 49 | 10 | 0 | canvas, circle, pos | / -3 | T1c | stop/end circles 1:1 (T1c) on top of T1a/T1b | pinned (add1-b1b) |
| activity-creole-table | 51 | 47 | 47 | @height, @width, canvas, childCount, draw-order/text, pos | / 2 | T2c | creole table / %n() / ____ separator in action text |  |
| niletu-83-lego826 | 51 | 47 | 47 | @height, @width, canvas, childCount, draw-order/text, pos | / 2 | T2c | creole table / %n() / ____ separator in action text |  |
| molexa-46-redi999 | 52 | 16 | 5 | canvas, circle, pos, stroke | 57.975,3.712,-3.712 / -4,-0.288,-7.712 | T2f | FtileCircleEndCross 2nd diagonal endpoints reversed (FtileCircleEndCross.java:115) |  |
| sikino-19-vuca111 | 54 | 50 | 50 | canvas, pos | 5,6 / 15,10 | T2e | swimlane origin: LaneDivider UEmpty ink + title band (journal 9) |  |
| podelo-13-jaja314 | 57 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| ruderu-68-dere287 | 58 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| poraji-17-goke817 | 61 | 50 | 48 | @fill, @height, @width, canvas, childCount, circle, pos, stroke | 3.712,-3.712,16.086 / -4,-0.288,-7.712 | T2f | start/stop colour cascade (ActivityStartColor fill-only; stop ignores ActivityEndColor) |  |
| laxibe-66-teme800 | 62 | 39 | 39 | @width, canvas, childCount, draw-order/text, pos | -6.6,143.1 / | T2c | creole [[url{tip}label]] link label in action text |  |
| zamagu-75-vape137 | 62 | 39 | 39 | @width, canvas, childCount, draw-order/text, pos | -69.15,18 / | T2c | creole [[url{tip}label]] link label in action text |  |
| fabexi-81-dife869 | 66 | 15 | 4 | canvas, circle, pos, stroke | 3.712,-3.712,16.087 / -4,-0.288,-7.712 | T2f | FtileCircleEndCross 2nd diagonal endpoints reversed (FtileCircleEndCross.java:115) |  |
| pakema-21-xema183 | 66 | 65 | 65 | @width, canvas, pos | 5,6,7.663 / 25.5,20.5 | T2e | swimlane origin: LaneDivider UEmpty ink + title band (journal 9) |  |
| tefuga-86-xefe850 | 66 | 64 | 64 | canvas, pos | 5,5.168,5.169 / 25.5,20.5 | T2e | swimlane origin: LaneDivider UEmpty ink + title band (journal 9) |  |
| gaxezi-48-zesa921 | 68 | 54 | 44 | @width, canvas, childCount, circle, draw-order/text, pos | -6.6,144.6 / -3 | T2c | creole [[url{tip}label]] link label in action text |  |
| nisexe-68-vabu320 | 68 | 54 | 44 | @width, canvas, childCount, circle, draw-order/text, pos | -6.6,144.6 / -3 | T2c | creole [[url{tip}label]] link label in action text |  |
| pekuxe-00-bovi270 | 68 | 54 | 44 | @width, canvas, childCount, circle, draw-order/text, pos | -6.6,144.6 / -3 | T2c | creole [[url{tip}label]] link label in action text |  |
| piruxe-91-zivi081 | 73 | 52 | 52 | canvas, childCount, pos | / -58,-100 | T2b | kill/detach as mutation (InstructionSimple.kill) |  |
| dirame-64-cica627 | 75 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| cubida-55-meku256 | 80 | 80 | 80 | @d, @d[], @fill, canvas, childCount, draw-order/text, pos | 66.091,107.156 / -53.667,-52 | T2f | note shape path + fill (FtileNoteOpale/Opale geometry) |  |
| jakuco-69-dari135 | 82 | 80 | 80 | canvas, pos | 5,6 / 25.5,20.5 | T2e | swimlane origin: LaneDivider UEmpty ink + title band (journal 9) |  |
| gufuma-85-zoce945 | 83 | 74 | 68 | @height, @width, canvas, childCount, circle, pos | 4.125 / -21,-18 | add2 | embedded {{ }} diagram: oracle 42x42 slot (memory oracle-seam-embedded-42x42) | open -> add2 (oracle 42x42 embedded slot) |
| vimoxa-78-zucu656 | 86 | 82 | 82 | @d, @d[], @fill, @font-family, canvas, childCount, draw-order/text, pos | 4.556,119.913 / -66.389,-92.667,-52 | T2f | note shape path + fill (FtileNoteOpale/Opale geometry) |  |
| sopape-11-laxo488 | 87 | 87 | 79 | @width, canvas, circle, pos, stroke | 5,1,8.712 / 25.5,21.5,25.212 | T2e | swimlane origin: LaneDivider UEmpty ink + title band (journal 9) |  |
| carapo-31-bisi880 | 89 | 88 | 88 | canvas, draw-order/text, line[], polygon[], pos | -3.166,9.668,-16 / 11,28.5,-12 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| rerovo-62-nazo755 | 89 | 50 | 50 | canvas, draw-order/text, line[], polygon[], pos | 12.834,-12.834,24 / 17.5,-17.5,-100 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| cetica-88-toke482 | 91 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| vimako-25-mega336 | 92 | 67 | 67 | @font-weight, canvas, childCount, draw-order/text, pos | 9.809,-9.809 / 10.5,39.5,-17.5 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| dexero-99-ziru660 | 93 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| kuzeru-09-voke075 | 93 | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| norire-15-taka956 | 93 | 87 | 89 | @d, @d[], @fill, canvas, childCount, pos | 63.078 / -54.389,-52,-48 | T2f | note shape path + fill (FtileNoteOpale/Opale geometry) |  |
| patagi-39-jone354 | 94 | 90 | 86 | canvas, circle, pos, stroke | 5,6,9.712 / 25.5,17.5,21.5 | T2e | swimlane origin: LaneDivider UEmpty ink + title band (journal 9) |  |
| novata-87-muti352 | 96 | 71 | 71 | canvas, childCount, draw-order/text, pos | 18.644,-18.644,12 / 20.5,-20,-3 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| povoju-50-raxi136 | 97 | 94 | 94 | canvas, pos | 5,5.168,5.169 / 25.5,20.5 | T2e | swimlane origin: LaneDivider UEmpty ink + title band (journal 9) |  |
| bigide-91-bise382 | 98 | 75 | 71 | @height, canvas, childCount, circle, pos, stroke | 1.288,0.8,4.512 / 10,-2,-6 | T2e | document title / legend chrome offset |  |
| jipapo-14-kevu587 | 98 | 95 | 95 | @d, @d[], @fill, canvas, childCount, draw-order/text, pos | 56.728,71.109,42.347 / -53.889,-34,40.5 | T2f | note shape path + fill (FtileNoteOpale/Opale geometry) |  |
| nijipa-25-pede639 | 98 | 96 | 96 | @d, @d[], @fill, canvas, childCount, draw-order/text, pos | 56.728,71.109,42.347 / -53.889,-34,40.5 | T2f | note shape path + fill (FtileNoteOpale/Opale geometry) |  |
| jecoxu-17-zama003 | 99 | 76 | 59 | canvas, childCount, circle, pos, stroke | -12,-8.287,-15.712 / -4,-2,1.712 | T2d | end inside an if branch (tile/out-point) |  |
| cugezi-99-tire097 (b1) | — | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| darote-51-kuta407 (b1) | — | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| fufefa-17-faje066 (b1) | — | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| gebuzi-30-nulo391 (b1) | — | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| ketiro-31-nazo312 (b1) | — | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| kojivo-44-ceti956 (b1) | — | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| lokane-30-dinu378 (b1) | — | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| mulida-55-ceja768 (b1) | — | 0 | — | — | — | T1a/T1b | canvas origin (T1a) + text driver (T1b) | pinned (add1-b1) |
| daxare-39-buci637 (b1) | — | 2 | 2 | pos | / | T2f | diamond/hexagon polygon not closed (jar repeats first point) |  |
| feceme-58-xodo415 (b1) | — | 2 | 2 | pos | / | T2f | diamond/hexagon polygon not closed (jar repeats first point) |  |
| calenu-74-vigo098 (b1) | — | 4 | 4 | pos | / | T2f | diamond/hexagon polygon not closed (jar repeats first point) |  |
| suzuci-53-biku826 (b1) | — | 4 | 4 | @fill, pos | / | T2c | arrow font colour on edge label text |  |
| ciceto-21-zanu057 (b1) | — | 6 | 6 | canvas, pos | / | T2f | diamond/hexagon polygon not closed (jar repeats first point) |  |
| sokafe-69-jita472 (b1) | — | 6 | 6 | canvas, pos | / | T2f | diamond/hexagon polygon not closed (jar repeats first point) |  |
| covage-54-pine573 (b1) | — | 10 | 0 | canvas, circle, pos | / -3 | T1c | stop/end circles 1:1 (T1c) on top of T1a/T1b | pinned (add1-b1b) |
| garuga-34-debe901 (b1) | — | 14 | 4 | @stroke, canvas, circle, pos, stroke | / -3 | T2f | node stroke/fill style: rect stroke #F00 missing, gradient fill |  |
| xigelo-67-sipi599 (b1) | — | 14 | 4 | canvas, circle, pos | / -3 | T2f | diamond/hexagon polygon not closed (jar repeats first point) |  |
| barada-07-veca157 (b1) | — | 19 | 8 | canvas, circle, pos, stroke | 3.712,-3.713,16.086 / -4,-0.288,-7.712 | T2f | FtileCircleEndCross 2nd diagonal endpoints reversed (FtileCircleEndCross.java:115) |  |
| fomapa-90-bore251 (b1) | — | 30 | 30 | canvas, pos | / 7.5,15 | T2d | split tile geometry with long branch |  |
| fonabu-93-xama593 (b1) | — | 42 | 42 | canvas, line[], polygon[], pos | 24 / -96 | T2d | if-with-links geometry (-96 y / arrowhead line-vs-polygon) |  |
| gakelo-29-neno787 (b1) | — | 42 | 42 | line[], polygon[], pos | 37.335 / -96 | T2d | if-with-links geometry (-96 y / arrowhead line-vs-polygon) |  |
| vozane-63-kepe177 (b1) | — | 42 | 42 | line[], polygon[], pos | 37.335 / -96 | T2d | if-with-links geometry (-96 y / arrowhead line-vs-polygon) |  |
| fivama-51-cusa142 (b1) | — | 45 | 16 | canvas, circle, pos | / -3,-9,-6 | T2f | diamond/hexagon polygon not closed (jar repeats first point) |  |
| livigo-47-negi605 (b1) | — | 48 | 48 | canvas, line[], polygon[], pos | 3.275,6.637,34.275 / 10,-96,-11 | T2d | if-with-links geometry (-96 y / arrowhead line-vs-polygon) |  |
| nusajo-97-bemo713 (b1) | — | 48 | 48 | canvas, line[], polygon[], pos | 3.275,6.637,34.275 / 10,-96,-11 | T2d | if-with-links geometry (-96 y / arrowhead line-vs-polygon) |  |
| tamaxe-36-mono574 (b1) | — | 48 | 48 | draw-order/text, line[], polygon[], pos | 22.012,-22.012,39.05 / 17.5,-17.5,-100 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| zizaki-04-guvi945 (b1) | — | 49 | 49 | @stroke, canvas, pos, stroke | / 15,30,7.5 | T2d | split tile geometry with long branch |  |
| lacuci-13-nogo718 (b1) | — | 50 | 50 | canvas, draw-order/text, line[], polygon[], pos | 22.013,-22.013,30.012 / 17.5,-17.5,-100 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| pedoco-30-mose082 (b1) | — | 50 | 50 | canvas, draw-order/text, line[], polygon[], pos | 22.012,-22.012,39.05 / 17.5,-17.5,-100 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| xenofo-81-rame803 (b1) | — | 51 | 45 | canvas, circle, pos | / 4.5,12,9 | T2d | split tile geometry with long branch |  |
| ziboco-73-kazu841 (b1) | — | 53 | 43 | canvas, childCount, circle, pos | / -3,-96,96 | T2d | if-with-links geometry (-96 y / arrowhead line-vs-polygon) |  |
| cagoze-40-tete366 (b1) | — | 60 | 50 | canvas, circle, draw-order/text, line[], polygon[], pos | 76.772,-76.772,84.772 / 17.5,-17.5,-3 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| nonusu-50-nute147 (b1) | — | 65 | 81 | canvas, circle, draw-order/text, pos | 8.572,-8.572,-6 / -3,17.5,-17.5 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| saxeku-17-gume203 (b1) | — | 67 | 61 | canvas, childCount, circle, pos | 68,46,-68 / -12,-15,-18 | T2f | ConditionEndStyle hline merge shape |  |
| nimusa-16-tiku252 (b1) | — | 74 | 74 | canvas, line[], polygon[], pos | 28.025 / 15,-148 | T2d | if-with-links geometry (-96 y / arrowhead line-vs-polygon) |  |
| dulezi-77-sana210 (b1) | — | 75 | 65 | canvas, circle, draw-order/text, pos | 14.675,-0.844,30.194 / 3.611,-3 | T2c | activityDiamond FontSize style on diamond label |  |
| guceja-66-tola192 (b1) | — | 75 | 69 | canvas, childCount, circle, pos | / 7.5,4.5,-148 | T2a | repeat connector draw order (FtileRepeat.java:172-204) |  |
| cifafo-49-jazi415 (b1) | — | 77 | 67 | canvas, circle, pos | 10,10.15 / 10,-3 | T2e | document title / legend chrome offset |  |
| becaje-01-vaji284 (b1) | — | 82 | 59 | canvas, childCount, circle, pos, stroke | -12,-8.287,-15.712 / -4,-2,1.712 | T2d | end inside an if branch (tile/out-point) |  |
| zukori-83-fiso705 (b1) | — | 82 | 82 | canvas, line[], polygon[], pos | 31.362,49.362 / -96,-288 | T2d | if-with-links geometry (-96 y / arrowhead line-vs-polygon) |  |
| biguku-39-voxu233 (b1) | — | 86 | 86 | canvas, line[], polygon[], pos, rect[], text[] | 123.625 / 96 | T2a | repeat connector draw order (FtileRepeat.java:172-204) |  |
| bozuro-33-celo170 (b1) | — | 86 | 77 | canvas, childCount, circle, pos, stroke | 3.712,-3.713,16.086 / -4,-0.288,-7.712 | T2a | repeat connector draw order (FtileRepeat.java:172-204) |  |
| bocaga-53-nale241 (b1) | — | 90 | 71 | canvas, childCount, circle, pos, stroke | -12,-8.287,-15.712 / -2,1.712,-5.712 | T2d | end inside an if branch (tile/out-point) |  |
| bazuma-86-metu353 (b1) | — | 93 | 93 | canvas, childCount, draw-order/text, pos | 60.812,84.431 / 17.444,33.944,44.944 | T2c | multiline condition/branch label: one <text> per line |  |
| fikuki-99-kulu790 (b1) | — | 94 | 88 | @height, canvas, childCount, circle, pos | 60.338 / -81,-78 | add2 | embedded {{ }} diagram: oracle 42x42 slot (memory oracle-seam-embedded-42x42) | open -> add2 (oracle 42x42 embedded slot) |
| simuti-16-lece058 (b1) | — | 94 | 96 | @stroke, canvas, childCount, circle, pos, stroke | 37.163,49.537,6.187 / -24,-48,-52 | T2b | kill/detach as mutation (InstructionSimple.kill) |  |
| rosizo-69-mera514 (b1) | — | 96 | 90 | canvas, circle, draw-order/text, line[], polygon[], pos | 37.928,-37.928,45.928 / 15,17.5,-17.5 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| debofa-60-mude568 (b1) | — | 100 | 94 | canvas, childCount, circle, draw-order/text, pos, stroke | 90.422,3.712,-3.712 / -47.723,6,9.712 | T2a | repeat connector draw order (FtileRepeat.java:172-204) |  |
| secepo-00-febi326 (b1) | — | 100 | 100 | canvas, childCount, draw-order/text, pos | 22.012,-22.012 / 5,28.5,-17.5 | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
| caciva-80-kene990 (b1b) | — | — | 99 | — | — | T2f | partition frame fill/structure |  |
| mifejo-31-sovi184 (b1b) | — | — | 100 | — | — | T2f | note shape path + fill (FtileNoteOpale/Opale geometry) |  |
| vaxuta-95-cico162 (b1b) | — | — | 100 | — | — | T2a | if branch-label / connector draw order (FtileIfLongHorizontal/FtileIfDown conns) |  |
