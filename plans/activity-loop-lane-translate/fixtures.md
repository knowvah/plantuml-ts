# Fixtures — `activity-loop-lane-translate`

The 22 rows the filing named, with what was measurable on main at
`8815ec5b` before T0 (2026-09-19): `while`/`repeat` keyword counts and the
number of `|lane|` declaration lines in the `.puml`. **T0 fills the last
three columns**: the connection classes the row reaches on a cross-lane
edge (`while-back`, `repeat-out`, `simple1`, `simple2`, `complex1`, `none`),
the `--align` count before, and the mechanism when it is not a translate
shape. Rows with 0 lane lines cannot be translate residuals (D8).

Read the T0 measurement in [`measurements/`](measurements/) (`base.json`
from `tools/render-all.mts`, per-slug `--align`/`--dump` output).

| Slug | while | repeat | lane lines | Classes (T0) | Align before (T0) | Note (T0) |
|---|---|---|---|---|---|---|
| `ruzica-16-deli877` | 2 | 0 | 7 | T0 | T0 | T0 |
| `kijazo-83-kipu485` | 1 | 0 | 3 | T0 | T0 | T0 |
| `judatu-15-xize591` | 1 | 1 | 1 | T0 | T0 | T0 |
| `gesogi-81-xoma900` | 1 | 1 | 1 | T0 | T0 | T0 |
| `xovano-23-tazo278` | 1 | 0 | 2 | T0 | T0 | T0 |
| `bulasi-17-vafa634` | 1 | 1 | 1 | T0 | T0 | T0 |
| `camavo-50-kaku123` | 1 | 1 | 0 | T0 | T0 | T0 |
| `vupuse-73-nuso490` | 1 | 1 | 0 | T0 | T0 | T0 |
| `zepima-96-peco612` | 1 | 1 | 0 | T0 | T0 | T0 |
| `becanu-19-diti597` | 0 | 1 | 3 | T0 | T0 | T0 |
| `givanu-33-kire967` | 0 | 1 | 3 | T0 | T0 | T0 |
| `kasadu-53-tuki533` | 0 | 1 | 2 | T0 | T0 | T0 |
| `kudedo-31-pafi082` | 0 | 1 | 5 | T0 | T0 | T0 |
| `mafete-03-rapa918` | 0 | 1 | 3 | T0 | T0 | T0 |
| `manata-12-rido730` | 0 | 1 | 3 | T0 | T0 | T0 |
| `bumaca-51-kece901` | 0 | 1 | 3 | T0 | T0 | T0 |
| `navene-45-cozo466` | 0 | 1 | 3 | T0 | T0 | T0 |
| `rujuxa-07-neco067` | 0 | 1 | 1 | T0 | T0 | T0 |
| `tobajo-64-mipi810` | 0 | 3 | 4 | T0 | T0 | T0 |
| `katopo-68-xajo866` | 0 | 2 | 1 | T0 | T0 | T0 |
| `felega-00-saxi785` | 0 | 1 | 2 | T0 | T0 | T0 |
| `megara-21-rumi574` | 0 | 1 | 4 | T0 | T0 | T0 |

## Representative slugs (T0 confirms or replaces)

- while back, cross-lane: `kijazo-83-kipu485` (1 while, 3 lanes; +1 line,
  21/41 aligned on main), `ruzica-16-deli877` (2 whiles, 7 lanes; 35/95)
- repeat, cross-lane: `becanu-19-diti597`, `mafete-03-rapa918`,
  `manata-12-rido730` (the `Complex1` rows from `activity-loop-tile-port`
  stop 11), `tobajo-64-mipi810` (3 repeats, 4 lanes)
- both builders: `judatu-15-xize591`, `gesogi-81-xoma900`, `bulasi-17-vafa634`

## Break rows (D9 gate)

None of the 22 carries a `break`. The nine break rows of
`activity-gtile-break-size` and the five of `activity-repeat-break-welding`
(`bizono`, `cixave`, `dacuga`, `dixiku`, `doziki`) are listed in
`planning/next-missions.md`; T0 records whether any is a mover here.
