# Row ledger: add1

Seeded at planning (2026-09-30, main d4e29cc8c) from `measurements/plan-classify.json`:
every `status: "baseline"` fixture with `weightedScore` <= 100 — **75 rows**. T0a
re-measures on the branch (`b0`) and corrects any row whose score moved; the
cohort is re-cut at every close (D6: rows with ws <= 100 at the latest close).

`families` is the diff-family set at planning: `canvas` (svg/@width|height|viewBox),
`pos` (positional attrs, polygon points, textLength), `circle` (ellipse rx/ry/stroke),
`childCount`, `draw-order/text` (text()/font-size swaps), `stroke` (stroke-width),
else the raw attribute. `shift` = the distinct (jar − ours) x / y deltas.

`final` ∈ `pinned (<commit>)` · `open -> add2 (<mechanism>)`.

## Rows

| slug | ws (plan) | families | shift x / y | task | mechanism | final |
|---|---|---|---|---|---|---|
| kodiji-34-mofe202 | 6 | canvas, pos | 3 / 3 |  |  |  |
| gonixe-93-zaza537 | 9 | canvas, pos | 4 / 4,3.333 |  |  |  |
| kubaso-31-gaxu491 | 9 | canvas, pos | 4 / 4,3.333 |  |  |  |
| narota-16-bago100 | 9 | canvas, pos | 4 / 4,3.333 |  |  |  |
| taxeta-89-mapo546 | 9 | canvas, pos | 4 / 4,3.333 |  |  |  |
| dunejo-33-divo189 | 15 | canvas, pos | 4 / 4 |  |  |  |
| gizore-52-fode894 | 15 | canvas, pos | 4 / 4 |  |  |  |
| rurake-60-licu592 | 15 | canvas, pos | 4 / 4 |  |  |  |
| rarodo-65-fudu505 | 16 | POLY, canvas, pos | 4 / 3,2.333 |  |  |  |
| dakesa-98-mano758 | 22 | @fill, canvas, childCount, pos | 4 / 4,3.333 |  |  |  |
| disemi-67-keva276 | 23 | canvas, pos | 4 / 3,2.333 |  |  |  |
| fabuli-92-vemo727 | 23 | canvas, pos | 4 / 3,2.333 |  |  |  |
| gimegi-77-xidu727 | 23 | canvas, pos | 4 / 3,2.333 |  |  |  |
| goxoni-69-lemo511 | 23 | canvas, pos | 4 / 3,2.333 |  |  |  |
| lajuxi-63-nopo039 | 23 | canvas, pos | 4 / 3,2.333 |  |  |  |
| cizixu-00-koro700 | 24 | canvas, pos | 4 / 4,3.333 |  |  |  |
| fonebe-54-save009 | 24 | canvas, pos, stroke | 4 / 3,2.333 |  |  |  |
| fabule-54-pili300 | 25 | @height, @width, canvas, childCount, draw-order/text, pos | 4 / 4,27.333 |  |  |  |
| jidefi-14-kafe151 | 26 | canvas, pos | 4 / 4,3.333 |  |  |  |
| numalo-91-pole243 | 26 | canvas, circle, pos | 3 / 3 |  |  |  |
| farexi-86-xanu521 | 28 | @fill, @stroke, canvas, pos | 4 / 4,3.333 |  |  |  |
| zanudo-86-seco241 | 28 | @fill, @stroke, canvas, pos | 4 / 4,3.333 |  |  |  |
| fofele-65-lozo631 | 29 | @fill, @stroke, canvas, pos, stroke | 4 / 4,3.333 |  |  |  |
| naroji-40-nuke022 | 29 | @fill, @stroke, canvas, pos, stroke | 4 / 4,3.333 |  |  |  |
| duzumu-46-geve509 | 31 | canvas, circle, pos | 4 / 4,3.333,1 |  |  |  |
| volefo-41-tolo996 | 35 | @d, @d[], @fill, canvas, pos | 3,-6.5 / -2.889,-11,-11.667 |  |  |  |
| zedoco-71-guge507 | 35 | canvas, pos | 4 / 4 |  |  |  |
| letare-59-gore448 | 36 | canvas, pos | 8.007,8.006,10 / 4,3.333,1,-1 |  |  |  |
| niluji-46-joma773 | 40 | canvas, pos | 4 / 3,2.333 |  |  |  |
| tagixo-41-gapo816 | 40 | canvas, pos | 4 / 3,2.333 |  |  |  |
| topico-42-fuza478 | 40 | canvas, pos | 4 / 4,3.333 |  |  |  |
| fotamo-01-rupi481 | 42 | canvas, circle, pos | 4 / 3,2.333 |  |  |  |
| gepetu-15-seba834 | 42 | canvas, pos | 4,4.001 / 4,3.333 |  |  |  |
| jodagi-12-xatu540 | 42 | canvas, pos | 4 / 4,3.333 |  |  |  |
| femaco-88-bufe808 | 43 | canvas, circle, pos | 4 / 3,2.333 |  |  |  |
| fisaca-74-deco063 | 43 | canvas, pos | 4 / 4,3.333 |  |  |  |
| setecu-78-cuko533 | 44 | canvas, circle, pos | 4 / 3,2.333 |  |  |  |
| lubapi-40-siji634 | 49 | canvas, circle, pos, stroke | 4,7.712,0.288,20.086,-12.086 / 3,2.333,-1,2.712,-4.712,-17.086,15.086 |  |  |  |
| sufupo-40-fuke080 | 49 | canvas, circle, pos | 4 / 3 |  |  |  |
| activity-creole-table | 51 | @height, @width, canvas, childCount, draw-order/text, pos | 4 / 4,6 |  |  |  |
| niletu-83-lego826 | 51 | @height, @width, canvas, childCount, draw-order/text, pos | 4 / 4,6 |  |  |  |
| molexa-46-redi999 | 52 | canvas, circle, pos, stroke | 4,61.975,7.712,0.288,20.086,-12.086 / 3,-1,2.712,-4.712,-17.086,15.086 |  |  |  |
| sikino-19-vuca111 | 54 | canvas, pos | 3,4 / 4,3.333,-1 |  |  |  |
| podelo-13-jaja314 | 57 | canvas, pos | 4 / 3,2.333 |  |  |  |
| ruderu-68-dere287 | 58 | canvas, pos | 4 / 4,3.333 |  |  |  |
| poraji-17-goke817 | 61 | @height, @width, canvas, childCount, circle, pos, stroke | 3,6.712,-0.712,19.086,-13.086 / 3,-1,2.712,-4.712,-17.086,15.086,-18,-45 |  |  |  |
| laxibe-66-teme800 | 62 | @width, canvas, childCount, draw-order/text, pos | -2.6,4,147.1 / 4,3.333 |  |  |  |
| zamagu-75-vape137 | 62 | @width, canvas, childCount, draw-order/text, pos | -65.15,4,22 / 4,3.333 |  |  |  |
| fabexi-81-dife869 | 66 | canvas, circle, pos, stroke | 4,7.712,0.288,20.087,-12.087 / 3,2.333,-1,2.712,-4.712,-17.086,15.086 |  |  |  |
| pakema-21-xema183 | 66 | @width, canvas, pos | 3,4,5.663,4.663,5.662,3.831 / 5.5,4.833,0.5 |  |  |  |
| tefuga-86-xefe850 | 66 | canvas, pos | 3,3.168,3.169,4 / 5.5,4.833,0.5 |  |  |  |
| gaxezi-48-zesa921 | 68 | @width, canvas, childCount, circle, draw-order/text, pos | -2.6,4,148.6 / 3,2.333 |  |  |  |
| nisexe-68-vabu320 | 68 | @width, canvas, childCount, circle, draw-order/text, pos | -2.6,4,148.6 / 3,2.333 |  |  |  |
| pekuxe-00-bovi270 | 68 | @width, canvas, childCount, circle, draw-order/text, pos | -2.6,4,148.6 / 3,2.333 |  |  |  |
| piruxe-91-zivi081 | 73 | canvas, childCount, pos | 4 / 4,3.333,-54,-54.667,-96 |  |  |  |
| dirame-64-cica627 | 75 | canvas, pos | 4 / 4,3.333 |  |  |  |
| cubida-55-meku256 | 80 | @d, @d[], @fill, canvas, childCount, draw-order/text, pos | 69.091,110.156 / 3,-50.667,-49 |  |  |  |
| jakuco-69-dari135 | 82 | canvas, pos | 3,4 / 5.5,4.833,0.5 |  |  |  |
| gufuma-85-zoce945 | 83 | @height, @width, canvas, childCount, circle, pos | 8.125,4 / 3,-18,-15 |  |  |  |
| vimoxa-78-zucu656 | 86 | @d, @d[], @fill, @font-family, canvas, childCount, draw-order/text, pos | 7.556,3,122.913 / 3,-63.389,-89.667,-49 |  |  |  |
| sopape-11-laxo488 | 87 | @width, canvas, circle, pos, stroke | 3,-1,6.712,-0.712,19.086,-13.086,-5,-1.288,-8.712,11.086,-21.086,-10,1,-5.5 / 5.5,1.5,5.212,-2.212,-14.586,17.586,-4 |  |  |  |
| carapo-31-bisi880 | 89 | POLY, canvas, draw-order/text, line[], polygon[], pos | 8.834,8.835,21.668,-4,5.669,29.669 / 14,13.333,30.889,-9,8,8.5,-91.5 |  |  |  |
| rerovo-62-nazo755 | 89 | POLY, canvas, draw-order/text, line[], polygon[], pos | 12,12.001,24.834,-0.834,36 / 3,2.333,19.889,-14.5,-97 |  |  |  |
| cetica-88-toke482 | 91 | canvas, pos | 4 / 3,2.333 |  |  |  |
| vimako-25-mega336 | 92 | @font-weight, POLY, canvas, childCount, draw-order/text, pos | -6,3.809,-15.809 / 13.5,12.833,41.889,-14.5,3 |  |  |  |
| dexero-99-ziru660 | 93 | canvas, pos | 4,4.001 / 4,3.333 |  |  |  |
| kuzeru-09-voke075 | 93 | canvas, pos | 4 / 4,3.333 |  |  |  |
| norire-15-taka956 | 93 | @d, @d[], @fill, canvas, childCount, pos | 66.078,3 / 3,2.333,-51.389,-49,-45 |  |  |  |
| patagi-39-jone354 | 94 | canvas, circle, pos, stroke | 3,4,7.712,0.288,20.087,-12.087 / 5.5,4.833,-2.5,1.5,5.212,-2.212,-14.586,17.586,0.5 |  |  |  |
| novata-87-muti352 | 96 | POLY, canvas, childCount, draw-order/text, pos | 4,22.644,-14.644,16,81.762,69.762 / 4,3.333,23.889,-16,1,17.056,16.389,24,1.5,77.5,-32,-60,7 |  |  |  |
| povoju-50-raxi136 | 97 | canvas, pos | 3,3.168,3.169,4 / 5.5,4.833,0.5 |  |  |  |
| bigide-91-bise382 | 98 | @height, canvas, childCount, circle, pos, stroke | 6.8,4.8,8.512,1.088,20.887,-11.287 / 10,3,1,-3,0.712,-6.712,-19.086,13.086 |  |  |  |
| jipapo-14-kevu587 | 98 | @d, @d[], @fill, POLY, canvas, childCount, draw-order/text, pos | -7,49.728,64.109,35.347,73.728,88.441,26.713 / -50.889,-31,-31.667,42.889,8.5,21,-87,-83,14,-10,26 |  |  |  |
| nijipa-25-pede639 | 98 | @d, @d[], @fill, POLY, canvas, childCount, draw-order/text, pos | -7,49.728,64.109,35.347,73.728,88.441,26.713 / -50.889,-31,-31.667,42.889,8.5,-35,14,-10,26 |  |  |  |
| jecoxu-17-zama003 | 99 | POLY, canvas, childCount, circle, pos, stroke | -6,-18,-14.287,-21.712,-1.913,-34.086,-45.809,-73.809,33.809,53.809 / 1,0.333,2.389,3,6.712,-0.712,-13.086,19.086,-19,-19.667,55,53,15,35,-115,-135 |  |  |  |
