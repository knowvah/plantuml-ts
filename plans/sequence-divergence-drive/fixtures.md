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
| b1b | 0 | 338 | 513 | 277 | 13 | 0 | 150864 |
| b2 | 367 | 25 | 483 | 253 | 13 | 367 | 109682 |
| b3 | 419 | 4 | 532 | 173 | 13 | 419 | 73380 |

## Paint-only rows

Columns: `slug` · `b0 ws` · `diff keys at b0` (shape, e.g.
`g/g/line@stroke-width`) · `family` (T2a–T3b / T4x) · `mechanism` (once
named, with Java `file:line`) · `final` (`pinned (<commit>)` or
`open -> sdd2: <reason>`).

| slug | b0 ws | diff keys at b0 | family | mechanism | final |
|---|---:|---|---|---|---|
| TeozTimelineIssues_0005_Test | 32 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| badolo-34-lesi912 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bafego-76-loru892 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| baxafe-32-gaka532 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| baxude-35-gete020 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bedaja-09-gezu912 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| benuba-40-puxa935 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bidopa-30-jafi560 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| biluba-79-delo134 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| binegi-05-xere209 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bipoce-87-cuki505 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| birike-24-lete111 | 25 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/line@stroke-dasharray ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bitutu-89-luju788 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bobofu-53-coje821 | 26 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| boguvi-37-ralo631 | 34 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/text@font-weight ×4, svg/g/line@stroke-dasharray ×2 | T3d | autonumber drawn without the jar's bold (font-weight 700): the message label/number font is not yet the arrow style font | pinned (close-b3) |
| bokazo-24-tefu124 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bopizu-70-rese737 | 40 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/text@font-weight ×8, svg/g/g/line@stroke-width ×4, svg/g/line@stroke-dasharray ×4 | T3d | autonumber drawn without the jar's bold (font-weight 700): the message label/number font is not yet the arrow style font | pinned (close-b3) |
| bosedo-77-loge384 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bovuda-87-dale466 | 22 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke ×2, svg/g/polygon@fill ×2, svg/g/polygon@stroke ×2, svg/g/text@fill ×2 | T3d | `arrow { FontColor }` does not reach the message label (label font still theme-driven, journal row 27b) | pinned (close-b3) |
| boxibe-39-luco835 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bozama-65-pexo274 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| bugaju-81-ciko758 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| buniji-73-pama777 | 21 | svg/g/line@stroke-dasharray ×7, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cajuga-45-taxu278 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| caveje-67-mexo618 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cavoke-34-feno396 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cekoda-52-vutu666 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cekora-30-diso384 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cepase-93-cane941 | 25 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×5, svg/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cexasu-11-fuja087 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cizifu-56-giku099 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| colexo-68-luko506 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cubezi-77-supa567 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cukexe-08-gana131 | 18 | svg/g/g/line@stroke-width ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| cusuto-16-vila182 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dafoke-98-reci967 | 42 | svg/g/rect@rx ×12, svg/g/rect@ry ×12, svg/g/rect@stroke-width ×12, svg/g/g/line@stroke-width ×6 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| damoge-62-riso387 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| davipu-63-veta505 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/text@fill | chrome | title `FontColor %reverse_hsluv_color(...)` off by one in the last hex digit: HSLuv rounding in the TIM builtin; title is chrome (D5 out of scope) | open -> sdd2: TIM `%reverse_hsluv_color` rounding |
| degoju-21-curu200 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| devaca-60-jipu284 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| devamo-31-coji129 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dexigo-61-soge505 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dibero-91-ruvu458 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dicizi-85-muvu530 | 24 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke ×2, svg/g/line@stroke-dasharray ×2, svg/g/polygon@fill ×2, svg/g/polygon@stroke ×2, svg/g/text@fill ×2 | T3d | `arrow { FontColor }` does not reach the message label (label font still theme-driven, journal row 27b) | pinned (close-b3) |
| dilesi-25-lali486 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dinaze-10-xedi714 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dinita-73-tige486 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dofuru-22-zuga032 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dolacu-72-rona074 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| doniti-46-nuxo457 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dopisa-88-pazo292 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dudure-98-cote516 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dugata-50-koxo354 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dukisa-19-zepa576 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dulaca-47-neta380 | 7 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| dutova-31-coci211 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fajixi-56-dete708 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fakifa-13-puve679 | 30 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@fill ×4 | T3d | `arrow { FontColor }` does not reach the message label (label font still theme-driven, journal row 27b) | pinned (close-b3) |
| fakune-74-geba235 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| falolu-20-sepu020 | 17 | svg/g/rect@rx ×5, svg/g/rect@ry ×5, svg/g/rect@stroke-width ×5, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fareko-61-fige194 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| faviki-72-kete653 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fazaba-22-nusi829 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fazubu-21-roxo367 | 22 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke ×2, svg/g/polygon@fill ×2, svg/g/polygon@stroke ×2, svg/g/text@fill ×2 | T3d | `arrow { FontColor }` does not reach the message label (label font still theme-driven, journal row 27b) | pinned (close-b3) |
| fazuzo-56-xoge438 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fekatu-96-kele513 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| femixi-54-maja138 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fepuso-73-xoca358 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ferate-49-tusa503 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fidalo-14-sefo615 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fidoba-93-nonu806 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fidobi-24-cugi165 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fijeco-97-zozu841 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fixecu-74-kote876 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/text@fill | chrome | title `FontColor %reverse_hsluv_color(...)` off by one in the last hex digit: HSLuv rounding in the TIM builtin; title is chrome (D5 out of scope) | open -> sdd2: TIM `%reverse_hsluv_color` rounding |
| fobapo-56-moko401 | 8 | svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| focaso-89-zaxu091 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fojake-71-veka215 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fonatu-29-texo854 | 9 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| foporo-86-nego484 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| fusavi-61-disa620 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| futaxe-10-xonu513 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gacavi-49-zeki744 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gadasu-04-kada675 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@font-weight ×4, svg/g/g/line@stroke-width ×2 | T3d | autonumber drawn without the jar's bold (font-weight 700): the message label/number font is not yet the arrow style font | pinned (close-b3) |
| ganefo-61-leka777 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gefobi-11-jena493 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gekuko-59-muta575 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| genago-36-sanu340 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| geraku-93-roka956 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gibola-54-cave865 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gifosu-53-fodu296 | 24 | svg/g/rect@stroke-width ×5, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke ×2, svg/g/line@stroke-width ×2, svg/g/rect@fill ×2, svg/g/rect@stroke ×2, svg/g/text@fill | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gigune-69-xaze480 | 38 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/g/rect@fill ×4, svg/g/g/rect@stroke ×4, svg/g/g/rect@stroke-width ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ginifi-74-faso689 | 8 | svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gogava-89-taga809 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gojozu-97-xeki128 | 14 | svg/g/a/rect@rx ×4, svg/g/a/rect@ry ×4, svg/g/a/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gorido-98-taje926 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gugena-56-fazu871 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gujaje-38-zoce253 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gunabi-18-gumo131 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| gurofe-24-seza094 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| guroti-56-konu524 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jaceso-80-fozu696 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jakido-43-zuzu758 | 38 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/g/rect@fill ×4, svg/g/g/rect@stroke ×4, svg/g/g/rect@stroke-width ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| janodo-62-pave893 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jerika-28-senu049 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jitesa-41-cara967 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jogati-80-xeme991 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jogeto-89-zaco078 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jokeje-35-xubi431 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jorari-47-buje011 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| joroli-85-vace726 | 17 | svg/g/rect@rx ×5, svg/g/rect@ry ×5, svg/g/rect@stroke-width ×5, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jozete-34-kete358 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| jutexi-93-zeta646 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/text@fill | T3d | `arrow { FontColor }` does not reach the message label (label font still theme-driven, journal row 27b) | pinned (close-b3) |
| jutomu-49-kemi074 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kafobi-95-risi292 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kakune-11-vusu073 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kaporo-80-vace949 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@font-weight ×4, svg/g/g/line@stroke-width ×2 | T3d | autonumber drawn without the jar's bold (font-weight 700): the message label/number font is not yet the arrow style font | pinned (close-b3) |
| kefila-88-kage602 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kemira-27-jaxe643 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kerezi-79-cepe665 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kibijo-61-vijo950 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kigari-13-kupa671 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kilepu-67-seji640 | 31 | svg/g/g/line@stroke-width ×8, svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/line@stroke-width ×5 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kipasa-41-pude128 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kirupe-14-pani191 | 26 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kodapi-60-zizu676 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| komeni-40-toxa101 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kopaxi-36-dedo317 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| koresa-77-jasi418 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kotoze-77-kipu253 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| kubini-17-jemo957 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| labima-56-kone976 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lakoze-10-cuza667 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lalite-31-joxu896 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lavaba-76-lepi228 | 18 | svg/g/rect@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/g/line@stroke-width ×2, svg/g/text@font-weight ×2 | T3d | autonumber drawn without the jar's bold (font-weight 700): the message label/number font is not yet the arrow style font | pinned (close-b3) |
| laveli-73-zuse406 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@fill ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| leceju-60-doxa170 | 32 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lemevu-44-gupu133 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lesaga-07-cili644 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| libica-30-seve575 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| licole-34-vejo527 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| liluca-64-muva178 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| loboke-95-roje401 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| loguci-83-mobe896 | 22 | svg/g/g/line@stroke-width ×6, svg/g/line@stroke-width ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lojami-06-ligu429 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| losilu-30-ridu614 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/text@fill | chrome | title `FontColor %reverse_hsluv_color(...)` off by one in the last hex digit: HSLuv rounding in the TIM builtin; title is chrome (D5 out of scope) | open -> sdd2: TIM `%reverse_hsluv_color` rounding |
| loxaco-79-zugi221 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lubuxu-38-jomi891 | 7 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ludize-84-fopa558 | 28 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lufuba-99-lefa805 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/text@font-family ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lukomo-68-kuxo704 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| luleji-91-jera958 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| lumogu-95-givi829 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| luxiti-51-jare370 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| luxiti-90-beca090 | 17 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/text@font-weight ×2, svg/g/line@stroke-dasharray | T3d | autonumber drawn without the jar's bold (font-weight 700): the message label/number font is not yet the arrow style font | pinned (close-b3) |
| maxabo-82-soto406 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| maxubu-98-roca477 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mebici-98-foji026 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mefone-86-soca963 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| memipo-14-vule994 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| menire-56-rase375 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| menugo-30-cuxa317 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| merosa-99-nico816 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mipezo-08-mura594 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| misove-15-cosu149 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mitedi-05-riso357 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mitire-01-voga923 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mivuke-79-fujo526 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mobava-88-teja491 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mocuna-66-bica785 | 28 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| monafo-92-leta687 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mufomi-43-vaso140 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mufote-89-buka575 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mulofu-90-voka382 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| mumagu-62-jicu083 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| musegi-69-lovi039 | 7 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| muzolo-11-cenu320 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nadode-16-budi136 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| najuro-83-tuze073 | 12 | svg/g/g/line@stroke-width ×3, svg/g/rect@rx ×3, svg/g/rect@ry ×3, svg/g/rect@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nakovi-91-kadu912 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| naliba-15-rari769 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/text@fill | chrome | title `FontColor %reverse_hsluv_color(...)` off by one in the last hex digit: HSLuv rounding in the TIM builtin; title is chrome (D5 out of scope) | open -> sdd2: TIM `%reverse_hsluv_color` rounding |
| naruxe-19-copi353 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| natidi-64-kuzo035 | 35 | svg/g/rect@rx ×10, svg/g/rect@ry ×10, svg/g/rect@stroke-width ×10, svg/g/g/line@stroke-width ×5 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nazuki-76-dave810 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| necofe-81-toja736 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| necujo-58-gadi983 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nepica-26-pali815 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nereka-67-deco609 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| netiro-87-foca868 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nevidi-69-todu292 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nezipa-74-kigi270 | 19 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nifixi-65-cebi612 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nisogu-21-zixe139 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nizime-73-xuti179 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nosixi-41-rizu505 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| novica-69-romi760 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nukona-00-jaro456 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| nutomi-11-bapo777 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| pagujo-10-pafe397 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| palizu-70-dora362 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| panuvo-43-mifu020 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| papade-25-cera948 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| parimu-89-nemi931 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| pekavu-30-toti112 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| pexube-19-kanu994 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| pibefe-94-cibu835 | 35 | svg/g/rect@rx ×10, svg/g/rect@ry ×10, svg/g/rect@stroke-width ×10, svg/g/g/line@stroke-width ×5 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| pidadu-86-cuda807 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| podata-90-rike047 | 22 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| poleji-46-dege759 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ponalu-70-nusa123 | 22 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| popule-82-faxa443 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| porulu-24-ciga586 | 8 | svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| pucama-53-sugi082 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| pugale-88-zuta854 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rabulu-15-mesu419 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rafibi-29-gevo619 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ramive-48-vabu271 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ranalo-31-mite541 | 26 | svg/g/g/line@stroke-width ×8, svg/g/line@stroke-width ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ratufa-96-xagu210 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| remoso-59-bese968 | 17 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rilefo-62-jedi773 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rilube-65-disa539 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rititi-64-vene814 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rocipu-63-zafu641 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rojicu-57-rize312 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rokava-82-kavo091 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rolefi-55-vabe043 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rosazu-66-secu992 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rudoci-99-zaju916 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rufama-75-paku115 | 7 | svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/g/line@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rufoko-60-jori485 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill, svg/g/g/rect@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rulepa-49-pisa733 | 14 | svg/g/a/rect@rx ×2, svg/g/a/rect@ry ×2, svg/g/a/rect@stroke-width ×2, svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| rumima-16-tevo172 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sameli-92-dape565 | 40 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/text@font-weight ×8, svg/g/g/line@stroke-width ×4, svg/g/line@stroke-dasharray ×4 | T3d | autonumber drawn without the jar's bold (font-weight 700): the message label/number font is not yet the arrow style font | pinned (close-b3) |
| sanigu-59-puro802 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sapice-55-zono098 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sarevu-71-nona699 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sarico-38-foxo520 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sefosu-56-mode325 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| semepi-87-tiza126 | 28 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| semika-67-covi892 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| senogo-33-nuva054 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sevaze-62-pufa040 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sevicu-84-veve186 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| siroza-17-cuko381 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sixafa-45-faxi184 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sobiga-51-damo304 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sobobe-86-zebo638 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sogafu-39-fone585 | 36 | svg/g/g/line@stroke-width ×4, svg/g/line@stroke ×4, svg/g/polygon@fill ×4, svg/g/polygon@stroke ×4, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2, svg/g/line@stroke-dasharray ×2, svg/g/line@stroke-width ×2 | T3d | per-message `[#green]` colour dropped by the parser (`AbstractMessage.java:69-70`, journal row 27a) | pinned (close-b3) |
| somana-58-lili386 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sonuse-17-poku104 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sopapu-09-riza536 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| soxata-16-kafi688 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| soxaxu-96-ceco932 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sufire-57-dari792 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| sukugi-55-kagi800 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| supezo-15-dasi526 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| suvepi-46-gozi893 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| suxefa-30-keda058 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| suxelu-07-toga142 | 21 | svg/g/line@stroke-dasharray ×7, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| suzexi-09-ruta299 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tajali-86-lisu875 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tapanu-22-libe792 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| taxoza-93-sugi547 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| terapo-81-puzi168 | 19 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke, svg/g/line@stroke-dasharray, svg/g/line@stroke-width, svg/g/polygon@fill, svg/g/polygon@stroke | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tinaxe-52-nago637 | 49 | svg/g/rect@rx ×14, svg/g/rect@ry ×14, svg/g/rect@stroke-width ×14, svg/g/g/line@stroke-width ×7 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tiniva-46-fozu745 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tipoke-58-cofi920 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tirige-97-ruvi637 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tixune-73-xoca786 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tixuze-43-pano940 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-width | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tolake-96-duve519 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| toxoto-19-gigi007 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tubagi-46-nata941 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tuxido-23-xide677 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| tuzaga-87-gene496 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vafedo-17-xuke155 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vatero-29-bice360 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vemuja-48-deku981 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vepesa-08-toju745 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vetuvo-45-gaku910 | 11 | svg/g/g/line@stroke-width ×2, svg/g/rect@rx ×2, svg/g/rect@ry ×2, svg/g/rect@stroke-width ×2, svg/g/text@font-weight ×2, svg/g/line@stroke-dasharray | T3d | autonumber drawn without the jar's bold (font-weight 700): the message label/number font is not yet the arrow style font | pinned (close-b3) |
| vezozi-51-kese404 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vicevi-92-zeda652 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vigoga-79-pita532 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vikupa-77-sazi937 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vixacu-92-faru631 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vobusa-71-sina142 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vodiba-42-fegu984 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vofefi-14-rine141 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vosupo-49-zide683 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vubexi-90-tonu836 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vuduri-54-joso537 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| vuzolo-46-daki571 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xalofe-61-vala300 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xamaga-47-mabi226 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xamanu-74-june638 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xecame-98-cuma671 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xecujo-78-sofu160 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xejeta-41-boje080 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xejojo-44-besu904 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xesame-35-puka061 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xevovo-09-jeja818 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xigoxi-25-paro589 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xikuro-71-cadu306 | 25 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×5, svg/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ximemi-09-rabo019 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ximeto-04-nati532 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ximuku-67-lupe952 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xinote-88-dace690 | 20 | svg/g/line@stroke-dasharray ×6, svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xixoce-70-vanu584 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xizisu-76-buta484 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xonili-01-pure946 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xupote-49-reta446 | 17 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke, svg/g/polygon@fill, svg/g/polygon@stroke | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xupufa-46-romu811 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xurenu-86-nezu467 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| xutovo-34-bisa687 | 22 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zajovi-78-nupe067 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zalegi-22-nepi686 | 32 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zanore-53-tike308 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zariro-57-fogu131 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zaviru-83-xixa466 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zeduvi-34-zevo210 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zekidi-24-lafu756 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zelako-07-fibi746 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zelexo-73-movu971 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zelojo-99-pucu548 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zetele-98-tafo132 | 21 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zexuna-08-kuci388 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zidova-39-bapi223 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zigire-72-muga285 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| ziloke-42-lodi019 | 34 | svg/g/rect@rx ×8, svg/g/rect@ry ×8, svg/g/rect@stroke-width ×8, svg/g/g/line@stroke-width ×4, svg/g/text@font-weight ×4, svg/g/line@stroke-dasharray ×2 | T3d | autonumber drawn without the jar's bold (font-weight 700): the message label/number font is not yet the arrow style font | pinned (close-b3) |
| zogici-88-nini947 | 18 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zonadu-68-gido115 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zosulu-72-fati889 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zucesu-12-neno978 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zufido-27-laru296 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zuluja-50-zore143 | 16 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke ×2, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zumila-29-nulo712 | 26 | svg/g/rect@rx ×6, svg/g/rect@ry ×6, svg/g/rect@stroke-width ×6, svg/g/g/line@stroke-width ×3, svg/g/g/rect@fill ×2, svg/g/g/rect@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zusedo-90-gaje635 | 14 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2 | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |
| zuvusi-13-fika929 | 15 | svg/g/rect@rx ×4, svg/g/rect@ry ×4, svg/g/rect@stroke-width ×4, svg/g/g/line@stroke-width ×2, svg/g/line@stroke-dasharray | T2a/T2b/T2c/T2e/T2f | participant/lifeline/arrow/note/box paint from the merged Style (journal rows 26-33) | pinned (close-b2) |

## Pinned from other cohorts

Geometry/structural rows a family task closed (their geometry diffs were the
stroke-width/padding the Style path now supplies, or the destroy cross).

| slug | b0 cohort | b0 ws | final |
|---|---|---:|---|
| bepopi-29-dobu802 | geometry | 29 | pinned (close-b2) |
| bodobu-73-noli773 | structural | 52 | pinned (close-b2) |
| bumoda-17-giza778 | structural | 72 | pinned (close-b2) |
| cecuku-78-kezo359 | geometry | 18 | pinned (close-b2) |
| decace-28-majo724 | geometry | 10 | pinned (close-b2) |
| dedefa-06-muge830 | geometry | 19 | pinned (close-b2) |
| dufupa-80-kavi440 | geometry | 19 | pinned (close-b2) |
| fatake-97-ciki135 | geometry | 12 | pinned (close-b2) |
| fevipu-45-xela421 | geometry | 24 | pinned (close-b2) |
| fidube-59-sacu518 | geometry | 70 | pinned (close-b2) |
| fonipa-05-lobe529 | geometry | 18 | pinned (close-b2) |
| furami-83-pome543 | geometry | 24 | pinned (close-b2) |
| fuzove-69-bulo834 | geometry | 69 | pinned (close-b2) |
| gepipe-05-rosu313 | geometry | 66 | pinned (close-b2) |
| gosigu-85-raku124 | geometry | 24 | pinned (close-b2) |
| jacefu-29-didu005 | geometry | 31 | pinned (close-b2) |
| jagusu-12-turu662 | geometry | 78 | pinned (close-b2) |
| jotege-53-vira701 | geometry | 24 | pinned (close-b2) |
| kafupo-63-cula092 | structural | 73 | pinned (close-b2) |
| legeme-58-daxi851 | geometry | 19 | pinned (close-b2) |
| lejafe-21-niga299 | geometry | 26 | pinned (close-b2) |
| lugobo-72-tuna023 | structural | 36 | pinned (close-b2) |
| movaso-17-jomi483 | geometry | 28 | pinned (close-b2) |
| moxope-92-roco972 | geometry | 32 | pinned (close-b2) |
| nenika-09-domu220 | geometry | 17 | pinned (close-b2) |
| numugo-16-luca722 | geometry | 78 | pinned (close-b2) |
| pamuli-34-suxu083 | geometry | 24 | pinned (close-b2) |
| pebezu-05-dufi104 | geometry | 18 | pinned (close-b2) |
| refoxa-14-rusi158 | geometry | 24 | pinned (close-b2) |
| robopi-12-jaxe349 | structural | 72 | pinned (close-b2) |
| sedajo-92-docu424 | geometry | 24 | pinned (close-b2) |
| sisena-47-nivo837 | geometry | 17 | pinned (close-b2) |
| todozi-34-jire490 | geometry | 12 | pinned (close-b2) |
| vamuge-84-degu929 | geometry | 24 | pinned (close-b2) |
| vuvage-72-meru492 | geometry | 24 | pinned (close-b2) |
| xaduru-73-jani181 | geometry | 24 | pinned (close-b2) |
| xorixe-91-vaci569 | geometry | 24 | pinned (close-b2) |
| zabiri-38-zace998 | geometry | 62 | pinned (close-b2) |
| zazaje-27-roga410 | geometry | 24 | pinned (close-b2) |
| zisuri-53-punu876 | structural | 157 | pinned (close-b2) |

## Entered paint-only at b2 (from geometry)

| slug | b0 cohort | b2 ws | b2 keys | mechanism | final |
|---|---|---:|---|---|---|
| fojagu-59-rife557 | geometry | 2 | g/text@fill ×2 | `arrow { FontColor }` does not reach the message label (journal row 27b) | pinned (close-b3) |
| munuje-51-pejo542 | geometry | 2 | g/text@fill ×2 | same as fojagu | pinned (close-b3) |
| xarifa-42-kiku597 | geometry | 1 | g/text@fill | same as fojagu | pinned (close-b3) |
| sedule-54-falo457 | geometry | 2 | g/line@stroke ×2 | divider rules emit the gradient as `url(#…)` on a `<line>`; `DriverLineSvg.java:76-80` strokes a line with the gradient's `getColor1()` (T2f applied it to lifelines only) | pinned (close-b3) |
| secida-27-jaco323 | geometry | 21 | lifeline/activation/head paint | `hide stereotype` deletes `Participant.stereotype` (`sequence-hide-passes.ts:45-48`); upstream hides only the display (`Participant.java:125-135`), so `.alice`/`.bob` styles never apply | pinned (close-b3) |
| xuxugi-47-vuzu867 | geometry | 21 | same as secida | same as secida | pinned (close-b3) |

## Pinned after the harness seed fix (journal row 40)

Zero-diff once `render-fixture-sequence.ts` seeds def ids as production
does; their only diffs were gradient/filter `@id`.

| slug | b0 cohort | b0 ws | final |
|---|---|---:|---|
| fadage-04-xoxe727 | geometry | 21 | pinned (close-b2) |
| funado-58-dene546 | geometry | 17 | pinned (close-b2) |
| gupaki-93-vupa807 | geometry | 17 | pinned (close-b2) |
| kuputa-52-caxa434 | geometry | 18 | pinned (close-b2) |
| matoka-21-jisu767 | geometry | 37 | pinned (close-b2) |
| netuvi-29-jiti924 | geometry | 21 | pinned (close-b2) |
| xeroce-52-moso281 | structural | 23 | pinned (close-b2) |
| zupora-06-pazi006 | geometry | 37 | pinned (close-b2) |

## Pinned at close-b3 (pin round 2)

| slug | b0 cohort | b0 ws | b2 ws | final |
|---|---|---:|---:|---|
| boguvi-37-ralo631 | paint-only | 34 | 4 | pinned (close-b3) |
| bopizu-70-rese737 | paint-only | 40 | 8 | pinned (close-b3) |
| bovuda-87-dale466 | paint-only | 22 | 2 | pinned (close-b3) |
| bulixe-06-boge494 | structural | 36 | 15 | pinned (close-b3) |
| burujo-63-puti396 | geometry | 19 | 2 | pinned (close-b3) |
| butali-53-kige134 | geometry | 34 | 3 | pinned (close-b3) |
| buxuba-45-tela497 | geometry | 10 | 1 | pinned (close-b3) |
| cinilo-67-macu207 | structural | 29 | 15 | pinned (close-b3) |
| cituda-50-mema409 | geometry | 17 | 1 | pinned (close-b3) |
| culegi-37-paji732 | geometry | 13 | 1 | pinned (close-b3) |
| dakake-85-nemi992 | geometry | 16 | 1 | pinned (close-b3) |
| dicizi-85-muvu530 | paint-only | 24 | 2 | pinned (close-b3) |
| ducaba-11-xogo576 | geometry | 22 | 1 | pinned (close-b3) |
| fakifa-13-puve679 | paint-only | 30 | 4 | pinned (close-b3) |
| fazubu-21-roxo367 | paint-only | 22 | 2 | pinned (close-b3) |
| finalo-84-toxa600 | geometry | 22 | 1 | pinned (close-b3) |
| fojagu-59-rife557 | geometry | 104 | 2 | pinned (close-b3) |
| gadasu-04-kada675 | paint-only | 18 | 4 | pinned (close-b3) |
| gazave-48-zapu688 | structural | 22 | 8 | pinned (close-b3) |
| gevere-74-caba556 | geometry | 32 | 4 | pinned (close-b3) |
| gozoxo-34-nuju154 | geometry | 27 | 1 | pinned (close-b3) |
| h-rnote-style | structural | 36 | 15 | pinned (close-b3) |
| jonasa-65-teci533 | geometry | 14 | 1 | pinned (close-b3) |
| jutexi-93-zeta646 | paint-only | 15 | 1 | pinned (close-b3) |
| kaporo-80-vace949 | paint-only | 18 | 4 | pinned (close-b3) |
| kotixe-11-cufa733 | structural | 36 | 15 | pinned (close-b3) |
| labudu-49-fove649 | geometry | 16 | 1 | pinned (close-b3) |
| lavaba-76-lepi228 | paint-only | 18 | 2 | pinned (close-b3) |
| luxiti-90-beca090 | paint-only | 17 | 2 | pinned (close-b3) |
| maboju-34-soxi895 | geometry | 73 | 1 | pinned (close-b3) |
| mitefi-27-cubo687 | structural | 251 | 199 | pinned (close-b3) |
| munuje-51-pejo542 | geometry | 94 | 2 | pinned (close-b3) |
| note-color | structural | 57 | 30 | pinned (close-b3) |
| nucumi-51-posa953 | structural | 159 | 105 | pinned (close-b3) |
| rogube-67-sova611 | structural | 61 | 45 | pinned (close-b3) |
| sameli-92-dape565 | paint-only | 40 | 8 | pinned (close-b3) |
| secida-27-jaco323 | geometry | 53 | 21 | pinned (close-b3) |
| sedule-54-falo457 | structural | 48 | 2 | pinned (close-b3) |
| seloli-77-rixi778 | structural | 57 | 30 | pinned (close-b3) |
| sogafu-39-fone585 | paint-only | 36 | 12 | pinned (close-b3) |
| solivu-37-vika919 | geometry | 20 | 2 | pinned (close-b3) |
| taxude-25-lamo370 | geometry | 15 | 1 | pinned (close-b3) |
| tixefu-75-vono728 | geometry | 82 | 38 | pinned (close-b3) |
| tojabu-38-lima321 | geometry | 19 | 1 | pinned (close-b3) |
| vetuvo-45-gaku910 | paint-only | 11 | 2 | pinned (close-b3) |
| voruto-32-rona048 | geometry | 15 | 1 | pinned (close-b3) |
| xarifa-42-kiku597 | geometry | 79 | 1 | pinned (close-b3) |
| xutuvu-44-zoko423 | structural | 29 | 15 | pinned (close-b3) |
| xuxugi-47-vuzu867 | geometry | 53 | 21 | pinned (close-b3) |
| zacoco-81-robo032 | structural | 32 | 15 | pinned (close-b3) |
| zerovu-57-cumo773 | geometry | 16 | 2 | pinned (close-b3) |
| ziloke-42-lodi019 | paint-only | 34 | 4 | pinned (close-b3) |
