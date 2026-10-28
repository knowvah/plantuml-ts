# gep fixture + corpus ledger

Seeded at the batch-0 close from `tests/fixtures/gantt/` (T0b) and the corpus
survey. From batch 7 each close adds a counts row and refreshes the family
table (firstDiff family → rows → owner).

## Counts per checkpoint

| checkpoint | corpus rows | conformant | structural | diverged | errored | jar-error rows | fixtures pinned |
|---|---:|---:|---:|---:|---:|---:|---:|
| b0 | 265 | 1 | 0 | 254 | 0 | 10 | — |
| b1 | 265 | 1 | 0 | 254 | 0 | 10 | — |
| b1b | 265 | 1 | 0 | 254 | 0 | 10 | — |
| b2 | 265 | 1 | 0 | 254 | 0 | 10 | — |
| b3 | 265 | 1 | 0 | 254 | 0 | 10 | — |
| b4 | 265 | 1 | 0 | 254 | 0 | 10 | — |
| b5 | 265 | 1 | 0 | 254 | 0 | 10 | — |
| b6 | 265 | 1 | 0 | 254 | 0 | 10 | — |
| b7 | 265 | 262 | 1 | 2 | 0 | 10 | 251 |
| b8 | 265 | 263 | 1 | 1 | 0 | 10 | 252 |

## Divergence families (from batch 7)

| family (firstDiff) | rows | mechanism | owner |
|---|---:|---|---|

## Authored fixtures (T0b)

| slug | construct | jar oracle ok? | final |
|---|---|---|---|
| columns-hide-duration | `Project starts 2020-07-01;hide column duration;` | ok | — |
| columns-show-task | `Project starts 2020-07-01;show column task;` | ok | — |
| hide-resource-names | `Project starts 2020-07-01;hide resources names;` | ok | — |
| label-on-column | `Project starts 2020-07-01;Labels on first column and right a` | ok | — |
| language-de | `language de;Project starts 2020-06-25;` | ok | — |
| language-es | `language es;Project starts 2020-06-25;` | ok | — |
| language-fr | `language fr;Project starts 2020-06-25;` | ok | — |
| language-ja | `language ja;Project starts 2020-06-25;` | ok | — |
| language-ko | `language ko;Project starts 2020-06-25;` | ok | — |
| language-ru | `language ru;Project starts 2020-06-25;` | ok | — |
| language-zh | `language zh;Project starts 2020-06-25;` | ok | — |
| link-task | `Project starts 2020-07-01;[task1] lasts 5 days;` | ok | — |
| ngm-after-hours | `Project starts 2020-07-01 at 08:00;[Task A] starts 2020-07-0` | ok | — |
| ngm-closed-hours | `Project starts 2020-07-01;2020-07-02 is closed;` | ok | — |
| ngm-lasts-hours | `Project starts 2020-07-01;[Meeting] lasts 2 hours;` | ok | — |
| ngm-lasts-units | `Project starts 2020-07-01;[Quick] lasts 45 seconds;` | ok | — |
| ngm-pause-time | `Project starts 2020-07-01;[Task] lasts 5 days;` | ok | — |
| ngm-relative-hours | `Project starts 2020-07-01;[Task A] starts at D+4 and lasts 3` | ok | — |
| ngm-requires-hours | `Project starts 2020-07-01;[Bug Fix] requires 4 hours;` | ok | — |
| ngm-requires-resources | `Project starts 2020-07-01;[Development] requires 80 hours on` | ok | — |
| ngm-succession-gap | `Project starts 2020-07-01;[Task A] requires 4 hours;` | ok | — |
| ngm-working-hours-per-day | `Project starts 2020-07-01;From 9:00 to 17:00 are working hou` | ok | — |
| printscale-daily-zoom | `printscale daily zoom 2;Project starts 2020-07-01;` | ok | — |
| printscale-monthly-zoom | `printscale monthly zoom 2;Project starts 2020-01-01;` | ok | — |
| printscale-quarterly-zoom | `printscale quarterly zoom 2;Project starts 2020-01-01;` | ok | — |
| printscale-weekly-calendar-date | `printscale weekly with calendar date;Project starts 2020-07-` | ok | — |
| printscale-weekly-numbering-from | `printscale weekly with week numbering from 10;Project starts` | ok | — |
| printscale-weekly-zoom | `printscale weekly zoom 2;Project starts 2020-07-01;` | ok | — |
| printscale-yearly-zoom | `printscale yearly zoom 2;Project starts 2019-01-01;` | ok | — |
| projectscale-quarterly | `projectscale quarterly;Project starts 2020-01-01;` | ok | — |
| today-implicit | `Project starts 2026-10-01;today is colored in #ff8080;` | ok | — |
| quirk-pauses-to-the | `[T] pauses from 2020-07-02 to the 2020-07-05` (T7a probe) | ok — the jar matches a shorter `pauses` phrase, not a `to the` interval (output differs from the plain `to` control) | row 74 |
| quirk-pauses-trailing-text | `[T] pauses from 2020-07-02 to the 2020-07-05 blahblah` | ok — the jar tolerates trailing text after a matched phrase | row 74 |
| quirk-stereotype-then-as | `[A] <<st>> as [B] lasts 3 days` | error page (jar rejects; port rejects — conformant) | row 74 |
| quirk-stereotype-then-on | `[A] <<st>> on {Alice} lasts 3 days` | error page (jar rejects; port rejects — conformant) | row 74 |
| vega-gantt0 | `Project starts the 5th of december 2018;saturday are closed;` | ok | — |
| vega-gantt1 | `Project starts the 5th of december 2018;saturday are closed;` | ok | — |
| vega-gantt10 | `saturday are closed;sunday are closed;` | ok | — |
| vega-gantt11 | `scale 2;printscale weekly;` | ok | — |
| vega-gantt2 | `[Prototype design] lasts 13 days;[Test prototype] lasts 4 da` | error page (upstream expects 400) | — |
| vega-gantt3 | `project starts on 2020-07-01;[P_start] happens 2020-07-03;` | ok | — |
| vega-gantt4 | `Project starts the 20th of september 2018;2018/09/22 is colo` | ok | — |
| vega-gantt5 | `Project starts the 20th of september 2018;printscale yearly;` | ok | — |
| vega-gantt6 | `decimal: 0;!$PRIMARY_LIGHT = "#33b2e2";` | ok | — |
| vega-gantt7 | `Project starts the 5th of november 2018;saturday are closed;` | ok | — |
| vega-gantt8 | `title Long Long Long note KO;Project starts 2020-05-29;` | ok | — |
| vega-gantt9 | `[T1] on {def:50%} lasts 5 days;[T2] lasts 15 days;` | ok | — |
| vega-hms0 | `Project starts 2024-09-22;[Task 1] starts 2024-09-22 10:30:4` | ok | — |
| vega-hms1 | `language de;Project starts 2024-09-22;` | ok | — |
| vega-hms2 | `Project starts 2024-09-22;saturday are closed;` | ok | — |
| vega-hms3 | `Project starts 2024-09-19;saturday are closed;` | ok | — |

47 fixtures: 16 vega (`vega-gantt0..11`, `vega-hms0..3`, byte-for-byte with
front-matter) + 31 authored. Dropped (jar cannot express, journal row 4):
`ngm-lasts-iso8601`, `ngm-lasts-abbrev`. Clock-dependent: `today-implicit`
(`oracle/capture-clock.json`). Construct → fixture/corpus map: T0b hand-back,
journal row 4.

## Open families after batch 8 (T8a–T8d landed) — ALL CLOSED by gantt-divergence-drive (2026-10-28)

Every row below is closed in `plans/gantt-divergence-drive/fixtures.md` (gantt
265/265 conformant, 254 goldens, 0 losses elsewhere). Three of the four
mechanisms were corrected there: xureco is a one-file equality seam
(`paintsEqual`, D1), xikovo is day-separator INK below the body dimension that
the jar's per-primitive `ensureVisible` covers (D2, core `TextBlockExporter`),
nakude is an error page on both sides (D4). The table is kept as filed.

| firstDiff family | rows | mechanism (diagnosis artifact) | owner |
|---|---:|---|---|
| `svg/g/path/@stroke` (transparent link) | 1 (xureco-57-lene839) | `src/core/klimt/AbstractCommonUGraphic.ts:107` defaults the back colour to the string `'none'` where `AbstractCommonUGraphic.java:61` uses the `HColors.none()` singleton, so `DriverPathSvg.java:61-75`'s equal-colour fast path never fires in TS (`driver-path-svg.ts:41-64`) and we emit `style="stroke:none;"` where the jar emits no style. Core, every engine with a transparent line over the default back — needs the full gate (journal row 88). | gantt-divergence-drive |
| structural (`svg/@height` +8) | 1 (xikovo-87-rosu902) | not pinned: body coordinates identical, canvas height 82 vs 90; title-only and hide-footbox-only fixtures pass; mogafu-27 shows the same 8 px on width. Next: instrument `GanttLayout.getTotalHeight` terms Java vs TS for both rows (row 88). | gantt-divergence-drive |
| emoji in separator names / note bodies | 0 corpus rows | `TaskDrawSeparator.ts:124` and `AbstractTaskDraw.ts:279` still build an empty sprite container; Java threads the real skin param (row 90). Author a fixture before fixing. | gantt-divergence-drive |
| nakude "cannot last more than 20 years" | 1 (nakude-77-suji787, conformant: both sides error) | our `checkFinalError` path on a one-day diagram whose task `displays on same row as` itself — both error pages, but the 20-year route suggests a min/max input the Java does not produce (row 81). | gantt-divergence-drive |
| rule-conformant, unpinned | 11 (4 jar error pages, 7 signed accepted divergences incl. the clock row lituri-55) | none — conformant by the 2026-10-10 error-page rule / `accepted-divergences.json` (the 10 gantt ledger entries were retired at b7, row 87) | — |

Closed in batch 8: fecaru-84 (`%date` week-year letter, T8a), mexito-28 (constraint colour guard, T8b), ribupo-71 (emoji asset store, T8c), authored vega-gantt2 (error listing line by location, T8d).
