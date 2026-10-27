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

## Open families after the b7 capture (turn-on + T8a/T8b)

| firstDiff family | rows | candidate mechanism | owner |
|---|---:|---|---|
| `svg/g[childCount]` | 1 (ribupo-71-poku778) | an element the port draws that the jar omits, or the reverse — census the g[1] children against the oracle | batch 8 |
| `svg/g/path/@stroke` | 1 (xureco-57-lene839) | a constraint/arrow stroke colour or dash differing from the jar's `applyStrokeAndLineColor` | batch 8 |
| structural (no firstDiff) | 1 (xikovo-87-rosu902) | element order/shape equal, attribute values differ below the diff threshold — `verdict-diff` family listing | batch 8 |
| error page, front-matter line | authored vega-gantt2 | core `error/error-diagrams.ts:91` clamps a document-absolute refusal line into a trace without the YAML header (T7c, row 80) | batch 8 (core, artifact) |
| rule-conformant, unpinned | 11 (4 jar error pages, 7 signed accepted divergences incl. the clock row lituri-55) | none — conformant by the 2026-10-10 error-page rule / `accepted-divergences.json` | — |
