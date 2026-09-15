# The affected fixtures

Baseline fixtures (`oracle/goldens/svg-activity/diff-baseline.json`,
`status: "baseline"`) whose source switches lane INSIDE a compound. Found by
a regex nesting scan at planning, 2026-09-15; **T1 verified every row against
the parser (2026-09-15) and amended this file** -- see
`decision-journal.md`'s T1 rows for the mechanism and the removed/corrected
slugs. Scores are the pins at `2a31a9ad` (sum **8950** over 30 fixtures;
aggregate over all 268 **52954**, unchanged).

`*` = the repeat opens and closes in different lanes (D3). `pin` = has an
`ALLOWED_NEW_OVERLAPS` entry.

Verification method (T1, `plans/activity-lane-capture/decision-journal.md`):
parsed each fixture with a throwaway "capture-at-opener" instrumentation of
all five compound kinds (`if-dispatch.ts`/`node-dispatch.ts`, scratch
worktree only, never committed) alongside the real capture-at-closer field,
then compared the two per compound instance. A row's kind is confirmed only
when at least one instance of that kind has `opener !== closer`; a lane
switch that detours and returns to the SAME lane by the construct's close is
NOT a defect instance (D1's fix would produce byte-identical output for that
instance, since both capture points read the same value).

| slug | kinds | pinned |
|---|---|---|
| `becanu-19-diti597` | repeat* | 209 |
| `bideta-97-cezo697` | if | 187 |
| `bixefi-77-moki051` | fork (pin) | 254 |
| `bugaja-31-jaso630` | split (pin) | 216 |
| `decudi-92-bisu741` | split, if | 383 |
| `gesogi-81-xoma900` | fork | 303 |
| `givanu-33-kire967` | repeat* | 218 |
| `gugala-11-suce270` | split | 226 |
| `jevoce-05-mumi686` | split, if | 439 |
| `jucidi-98-zato093` | if | 251 |
| `judatu-15-xize591` | split | 573 |
| `kasadu-53-tuki533` | repeat* | 180 |
| `kijazo-83-kipu485` | while | 208 |
| `kudedo-31-pafi082` | repeat* | 165 |
| `lukoxa-16-cecu095` | if | 157 |
| `maduja-30-xiri319` | if | 318 |
| `mafete-03-rapa918` | repeat* | 176 |
| `maketa-43-juja264` | split, if (pin ×2) | 298 |
| `manata-12-rido730` | if, repeat* | 308 |
| `misiji-27-buje656` | fork | 225 |
| `movexa-27-rexe388` | if | 187 |
| `nupose-71-vido428` | split | 373 |
| `pezubu-98-niba240` | if | 215 |
| `racana-82-zece676` | split (pin ×2) | 310 |
| `roboja-69-susa752` | split | 373 |
| `ruzica-16-deli877` | while | 516 |
| `samavi-13-fuku339` | if | 204 |
| `sopape-11-laxo488` | split | 103 |
| `tobajo-64-mipi810` | fork (pin) | 970 |
| `zeporo-46-zicu301` | if | 405 |

## T1 amendments (2026-09-15)

Ten rows removed as false positives and one row's kind corrected. Full list
with pins and per-instance mismatch counts is in
[`decision-journal.md`](decision-journal.md) (T1 rows) -- deliberately not
repeated here in slug-shaped text, since this file's slugs are extracted
verbatim by `scripts/activity-probe.ts --slugs-file` (`/[a-z]+-\d{2}-
[a-z]+\d{3}/g`) to build the canonical 30-fixture measurement set.
