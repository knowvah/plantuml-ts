# sdd1 fixture ledger

Seeded by T0a from `measurements/b0-classify.json`; settled at every close
(close-procedure step 9). One row per **paint-only** fixture (the D10
cohort), plus any geometry/structural row a family task closes by accident.
Geometry and structural cohorts are tracked by count only — they belong to
sdd2..N.

Planning-time cohorts (`measurements/plan-classify.json`, ratchet path, HEAD
`9e3a27dee`): paint-only 338 · geometry 513 · structural 277 · error 13.

## Cohort counts per checkpoint

| checkpoint | zero | paint-only | geometry | structural | error | pins | Σ ws |
|---|---:|---:|---:|---:|---:|---:|---:|
| plan | 0 | 338 | 513 | 277 | 13 | 0 | 150864 |
| b0 | 0 | 338 | 513 | 277 | 13 | 0 | 150864 |

## Paint-only rows

Columns: `slug` · `b0 ws` · `diff keys at b0` (shape, e.g.
`g/g/line@stroke-width`) · `family` (T2a–T3b / T4x) · `mechanism` (once
named, with Java `file:line`) · `final` (`pinned (<commit>)` or
`open -> sdd2: <reason>`).

| slug | b0 ws | diff keys at b0 | family | mechanism | final |
|---|---:|---|---|---|---|
| TeozTimelineIssues_0005_Test | 32 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2 | — | — | — |
| badolo-34-lesi912 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| bafego-76-loru892 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| baxafe-32-gaka532 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| baxude-35-gete020 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| bedaja-09-gezu912 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| benuba-40-puxa935 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| bidopa-30-jafi560 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| biluba-79-delo134 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| binegi-05-xere209 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| bipoce-87-cuki505 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| birike-24-lete111 | 25 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/line@stroke-dasharray ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | — | — | — |
| bitutu-89-luju788 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| bobofu-53-coje821 | 26 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | — | — | — |
| boguvi-37-ralo631 | 34 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/text@font-weight ×4, svg/g/line@stroke-dasharray ×2 | — | — | — |
| bokazo-24-tefu124 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | — | — | — |
| bopizu-70-rese737 | 40 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/text@font-weight ×8, svg/g/g/line@stroke-width ×4, svg/g/line@stroke-dasharray ×4 | — | — | — |
| bosedo-77-loge384 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| bovuda-87-dale466 | 22 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke ×2, svg/g/polygon@fill ×2, svg/g/polygon@stroke ×2, svg/g/text@fill ×2 | — | — | — |
| boxibe-39-luco835 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| bozama-65-pexo274 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-width | — | — | — |
| bugaju-81-ciko758 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| buniji-73-pama777 | 21 | svg/g/line@stroke-dasharray ×7, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| cajuga-45-taxu278 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| caveje-67-mexo618 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| cavoke-34-feno396 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| cekoda-52-vutu666 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| cekora-30-diso384 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| cepase-93-cane941 | 25 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×5, svg/g/line@stroke-width ×2 | — | — | — |
| cexasu-11-fuja087 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| cizifu-56-giku099 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| colexo-68-luko506 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| cubezi-77-supa567 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| cukexe-08-gana131 | 18 | svg/g/g/line@stroke-width ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/line@stroke-width ×2 | — | — | — |
| cusuto-16-vila182 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dafoke-98-reci967 | 42 | svg/g/rect@rx ×12, svg/g/rect@ry ×12, svg/g/rect@stroke-width ×12, svg/g/g/line@stroke-width ×6 | — | — | — |
| damoge-62-riso387 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| davipu-63-veta505 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/text@fill | — | — | — |
| degoju-21-curu200 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| devaca-60-jipu284 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| devamo-31-coji129 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dexigo-61-soge505 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dibero-91-ruvu458 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dicizi-85-muvu530 | 24 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke ×2, svg/g/line@stroke-dasharray ×2, svg/g/polygon@fill ×2, svg/g/polygon@stroke ×2, svg/g/text@fill ×2 | — | — | — |
| dilesi-25-lali486 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dinaze-10-xedi714 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| dinita-73-tige486 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dofuru-22-zuga032 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dolacu-72-rona074 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| doniti-46-nuxo457 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dopisa-88-pazo292 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dudure-98-cote516 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dugata-50-koxo354 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dukisa-19-zepa576 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| dulaca-47-neta380 | 7 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width | — | — | — |
| dutova-31-coci211 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fajixi-56-dete708 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fakifa-13-puve679 | 30 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@fill ×4 | — | — | — |
| fakune-74-geba235 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| falolu-20-sepu020 | 17 | svg/g/rect@rx ×5, svg/g/rect@ry ×5, svg/g/rect@stroke-width ×5, svg/g/g/line@stroke-width ×2 | — | — | — |
| fareko-61-fige194 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| faviki-72-kete653 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-width | — | — | — |
| fazaba-22-nusi829 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fazubu-21-roxo367 | 22 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke ×2, svg/g/polygon@fill ×2, svg/g/polygon@stroke ×2, svg/g/text@fill ×2 | — | — | — |
| fazuzo-56-xoge438 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| fekatu-96-kele513 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| femixi-54-maja138 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fepuso-73-xoca358 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| ferate-49-tusa503 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | — | — | — |
| fidalo-14-sefo615 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fidoba-93-nonu806 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fidobi-24-cugi165 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fijeco-97-zozu841 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fixecu-74-kote876 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/text@fill | — | — | — |
| fobapo-56-moko401 | 8 | svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2 | — | — | — |
| focaso-89-zaxu091 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fojake-71-veka215 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| fonatu-29-texo854 | 9 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | — | — | — |
| foporo-86-nego484 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| fusavi-61-disa620 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | — | — | — |
| futaxe-10-xonu513 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gacavi-49-zeki744 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gadasu-04-kada675 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@font-weight ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| ganefo-61-leka777 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gefobi-11-jena493 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gekuko-59-muta575 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| genago-36-sanu340 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| geraku-93-roka956 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gibola-54-cave865 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gifosu-53-fodu296 | 24 | svg/g/rect@stroke-width ×5, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke ×2, svg/g/line@stroke-width ×2, svg/g/rect@fill ×2, svg/g/rect@stroke ×2, svg/g/text@fill | — | — | — |
| gigune-69-xaze480 | 38 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/g/rect@fill ×4, svg/g/g/rect@stroke ×4, svg/g/g/rect@stroke-width ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | — | — | — |
| ginifi-74-faso689 | 8 | svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2 | — | — | — |
| gogava-89-taga809 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gojozu-97-xeki128 | 14 | svg/g/a/rect@rx ×4, svg/g/a/rect@ry ×4, svg/g/a/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gorido-98-taje926 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gugena-56-fazu871 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gujaje-38-zoce253 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| gunabi-18-gumo131 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| gurofe-24-seza094 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| guroti-56-konu524 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| jaceso-80-fozu696 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| jakido-43-zuzu758 | 38 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/g/rect@fill ×4, svg/g/g/rect@stroke ×4, svg/g/g/rect@stroke-width ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | — | — | — |
| janodo-62-pave893 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| jerika-28-senu049 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| jitesa-41-cara967 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| jogati-80-xeme991 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| jogeto-89-zaco078 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| jokeje-35-xubi431 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| jorari-47-buje011 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| joroli-85-vace726 | 17 | svg/g/rect@rx ×5, svg/g/rect@ry ×5, svg/g/rect@stroke-width ×5, svg/g/g/line@stroke-width ×2 | — | — | — |
| jozete-34-kete358 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| jutexi-93-zeta646 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/text@fill | — | — | — |
| jutomu-49-kemi074 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| kafobi-95-risi292 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kakune-11-vusu073 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kaporo-80-vace949 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@font-weight ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kefila-88-kage602 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kemira-27-jaxe643 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kerezi-79-cepe665 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| kibijo-61-vijo950 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kigari-13-kupa671 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kilepu-67-seji640 | 31 | svg/g/g/line@stroke-width ×8, svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/line@stroke-width ×5 | — | — | — |
| kipasa-41-pude128 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kirupe-14-pani191 | 26 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | — | — | — |
| kodapi-60-zizu676 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| komeni-40-toxa101 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kopaxi-36-dedo317 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| koresa-77-jasi418 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kotoze-77-kipu253 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| kubini-17-jemo957 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| labima-56-kone976 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| lakoze-10-cuza667 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| lalite-31-joxu896 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| lavaba-76-lepi228 | 18 | svg/g/rect@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/g/line@stroke-width ×2, svg/g/text@font-weight ×2 | — | — | — |
| laveli-73-zuse406 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@fill ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| leceju-60-doxa170 | 32 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2 | — | — | — |
| lemevu-44-gupu133 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| lesaga-07-cili644 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| libica-30-seve575 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| licole-34-vejo527 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| liluca-64-muva178 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| loboke-95-roje401 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| loguci-83-mobe896 | 22 | svg/g/g/line@stroke-width ×6, svg/g/line@stroke-width ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | — | — | — |
| lojami-06-ligu429 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| losilu-30-ridu614 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/text@fill | — | — | — |
| loxaco-79-zugi221 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| lubuxu-38-jomi891 | 7 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width | — | — | — |
| ludize-84-fopa558 | 28 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4 | — | — | — |
| lufuba-99-lefa805 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@font-family ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| lukomo-68-kuxo704 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| luleji-91-jera958 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| lumogu-95-givi829 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| luxiti-51-jare370 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| luxiti-90-beca090 | 17 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/text@font-weight ×2, svg/g/line@stroke-dasharray | — | — | — |
| maxabo-82-soto406 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| maxubu-98-roca477 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mebici-98-foji026 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mefone-86-soca963 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| memipo-14-vule994 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| menire-56-rase375 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| menugo-30-cuxa317 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| merosa-99-nico816 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mipezo-08-mura594 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| misove-15-cosu149 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mitedi-05-riso357 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mitire-01-voga923 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mivuke-79-fujo526 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mobava-88-teja491 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| mocuna-66-bica785 | 28 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4 | — | — | — |
| monafo-92-leta687 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mufomi-43-vaso140 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mufote-89-buka575 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mulofu-90-voka382 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| mumagu-62-jicu083 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| musegi-69-lovi039 | 7 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width | — | — | — |
| muzolo-11-cenu320 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| nadode-16-budi136 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| najuro-83-tuze073 | 12 | svg/g/g/line@stroke-width ×3, svg/g/rect@rx ×3, svg/g/rect@ry ×3, svg/g/rect@stroke-width ×3 | — | — | — |
| nakovi-91-kadu912 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| naliba-15-rari769 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/text@fill | — | — | — |
| naruxe-19-copi353 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| natidi-64-kuzo035 | 35 | svg/g/rect@rx ×10, svg/g/rect@ry ×10, svg/g/rect@stroke-width ×10, svg/g/g/line@stroke-width ×5 | — | — | — |
| nazuki-76-dave810 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| necofe-81-toja736 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray ×2 | — | — | — |
| necujo-58-gadi983 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| nepica-26-pali815 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| nereka-67-deco609 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| netiro-87-foca868 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| nevidi-69-todu292 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| nezipa-74-kigi270 | 19 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| nifixi-65-cebi612 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| nisogu-21-zixe139 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| nizime-73-xuti179 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| nosixi-41-rizu505 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| novica-69-romi760 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| nukona-00-jaro456 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| nutomi-11-bapo777 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| pagujo-10-pafe397 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| palizu-70-dora362 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| panuvo-43-mifu020 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| papade-25-cera948 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| parimu-89-nemi931 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| pekavu-30-toti112 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| pexube-19-kanu994 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| pibefe-94-cibu835 | 35 | svg/g/rect@rx ×10, svg/g/rect@ry ×10, svg/g/rect@stroke-width ×10, svg/g/g/line@stroke-width ×5 | — | — | — |
| pidadu-86-cuda807 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| podata-90-rike047 | 22 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/line@stroke-dasharray | — | — | — |
| poleji-46-dege759 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| ponalu-70-nusa123 | 22 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/line@stroke-dasharray | — | — | — |
| popule-82-faxa443 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| porulu-24-ciga586 | 8 | svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2 | — | — | — |
| pucama-53-sugi082 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| pugale-88-zuta854 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| rabulu-15-mesu419 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| rafibi-29-gevo619 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| ramive-48-vabu271 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| ranalo-31-mite541 | 26 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | — | — | — |
| ratufa-96-xagu210 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| remoso-59-bese968 | 17 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width, svg/g/line@stroke-dasharray | — | — | — |
| rilefo-62-jedi773 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| rilube-65-disa539 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| rititi-64-vene814 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| rocipu-63-zafu641 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| rojicu-57-rize312 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| rokava-82-kavo091 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| rolefi-55-vabe043 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| rosazu-66-secu992 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| rudoci-99-zaju916 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| rufama-75-paku115 | 7 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width | — | — | — |
| rufoko-60-jori485 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | — | — | — |
| rulepa-49-pisa733 | 14 | svg/g/a/rect@rx ×2, svg/g/a/rect@ry ×2, svg/g/a/rect@stroke-width ×2, svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2 | — | — | — |
| rumima-16-tevo172 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sameli-92-dape565 | 40 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/text@font-weight ×8, svg/g/g/line@stroke-width ×4, svg/g/line@stroke-dasharray ×4 | — | — | — |
| sanigu-59-puro802 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sapice-55-zono098 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sarevu-71-nona699 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sarico-38-foxo520 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sefosu-56-mode325 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| semepi-87-tiza126 | 28 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4 | — | — | — |
| semika-67-covi892 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| senogo-33-nuva054 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| sevaze-62-pufa040 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sevicu-84-veve186 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| siroza-17-cuko381 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sixafa-45-faxi184 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sobiga-51-damo304 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sobobe-86-zebo638 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sogafu-39-fone585 | 36 | svg/g/g/line@stroke-width ×4, svg/g/line@stroke ×4, svg/g/polygon@fill ×4, svg/g/polygon@stroke ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2, svg/g/line@stroke-dasharray ×2, svg/g/line@stroke-width ×2 | — | — | — |
| somana-58-lili386 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sonuse-17-poku104 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| sopapu-09-riza536 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| soxata-16-kafi688 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| soxaxu-96-ceco932 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sufire-57-dari792 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| sukugi-55-kagi800 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| supezo-15-dasi526 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| suvepi-46-gozi893 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| suxefa-30-keda058 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| suxelu-07-toga142 | 21 | svg/g/line@stroke-dasharray ×7, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| suzexi-09-ruta299 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| tajali-86-lisu875 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| tapanu-22-libe792 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| taxoza-93-sugi547 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| terapo-81-puzi168 | 19 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke, svg/g/line@stroke-dasharray, svg/g/line@stroke-width, svg/g/polygon@fill, svg/g/polygon@stroke | — | — | — |
| tinaxe-52-nago637 | 49 | svg/g/rect@rx ×14, svg/g/rect@ry ×14, svg/g/rect@stroke-width ×14, svg/g/g/line@stroke-width ×7 | — | — | — |
| tiniva-46-fozu745 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| tipoke-58-cofi920 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| tirige-97-ruvi637 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| tixune-73-xoca786 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| tixuze-43-pano940 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-width | — | — | — |
| tolake-96-duve519 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| toxoto-19-gigi007 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| tubagi-46-nata941 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| tuxido-23-xide677 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| tuzaga-87-gene496 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vafedo-17-xuke155 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vatero-29-bice360 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vemuja-48-deku981 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vepesa-08-toju745 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vetuvo-45-gaku910 | 11 | svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/text@font-weight ×2, svg/g/line@stroke-dasharray | — | — | — |
| vezozi-51-kese404 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vicevi-92-zeda652 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vigoga-79-pita532 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vikupa-77-sazi937 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vixacu-92-faru631 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vobusa-71-sina142 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vodiba-42-fegu984 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vofefi-14-rine141 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vosupo-49-zide683 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vubexi-90-tonu836 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vuduri-54-joso537 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| vuzolo-46-daki571 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xalofe-61-vala300 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xamaga-47-mabi226 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xamanu-74-june638 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xecame-98-cuma671 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xecujo-78-sofu160 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xejeta-41-boje080 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xejojo-44-besu904 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xesame-35-puka061 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| xevovo-09-jeja818 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xigoxi-25-paro589 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xikuro-71-cadu306 | 25 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×5, svg/g/line@stroke-width ×2 | — | — | — |
| ximemi-09-rabo019 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| ximeto-04-nati532 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| ximuku-67-lupe952 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xinote-88-dace690 | 20 | svg/g/line@stroke-dasharray ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xixoce-70-vanu584 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xizisu-76-buta484 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xonili-01-pure946 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xupote-49-reta446 | 17 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke, svg/g/polygon@fill, svg/g/polygon@stroke | — | — | — |
| xupufa-46-romu811 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xurenu-86-nezu467 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| xutovo-34-bisa687 | 22 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/line@stroke-dasharray | — | — | — |
| zajovi-78-nupe067 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zalegi-22-nepi686 | 32 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2 | — | — | — |
| zanore-53-tike308 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zariro-57-fogu131 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zaviru-83-xixa466 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zeduvi-34-zevo210 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zekidi-24-lafu756 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zelako-07-fibi746 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zelexo-73-movu971 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| zelojo-99-pucu548 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zetele-98-tafo132 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | — | — | — |
| zexuna-08-kuci388 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zidova-39-bapi223 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zigire-72-muga285 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| ziloke-42-lodi019 | 34 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/text@font-weight ×4, svg/g/line@stroke-dasharray ×2 | — | — | — |
| zogici-88-nini947 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2 | — | — | — |
| zonadu-68-gido115 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zosulu-72-fati889 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zucesu-12-neno978 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zufido-27-laru296 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zuluja-50-zore143 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke ×2, svg/g/g/line@stroke-width ×2 | — | — | — |
| zumila-29-nulo712 | 26 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
| zusedo-90-gaje635 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | — | — | — |
| zuvusi-13-fika929 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | — | — | — |
