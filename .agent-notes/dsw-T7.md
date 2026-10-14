# dsw T7 — residual triage after the description svek wrappers (2026-10-14)

Source: `plans/description-svek-wrappers/measurements/b3-eng/parity-{component,usecase,c4,unknown}.json`
(b4 = b3; mission branch at e94eb0a68). The unknown tree is filtered to routing-baseline
`ourType === DESCRIPTION`. Measured by an Explore agent. Reconciliation: Table A totals equal the
row counts (595), Table B sums to the 43 false rows, and Table C covers all 233 candidates, all of
which rendered.

## Table A — layoutEqual by tree

| tree | true | false | n/a-or-absent | total |
|---|---|---|---|---|
| component | 243 | 8 | 15 | 266 |
| usecase | 70 | 3 | 21 | 94 |
| c4 | 1 | 4 | 6 | 11 |
| unknown (DESCRIPTION) | 147 | 28 | 49 | 224 |
| total | 461 | 43 | 91 | 595 |

## Table B — layoutFirstDiff.component over the 43 false rows

| component | count |
|---|---|
| bb | 18 |
| clusterTree | 18 |
| nodePositions | 6 |
| edgePos | 1 |

**bb.** All 18 rows have one detail shape: `page #: jar #,#,#,# vs ours #,#,#,#`.
Examples: component/berelu-46-namo819, gevozu-46-sasu860, kanute-77-lacu414.

**clusterTree.** The 18 rows have four detail shapes:

| count | shape | examples |
|---|---|---|
| 14 | same count; sorted[#] depth/wrappers `-/p0/-/p1` equal, bb differs | c4/biluko-70-licu481, c4/favasu-27-fesa452, c4/xizifu-87-siti076 |
| 2 | cluster subgraphs: jar # vs ours # | unknown/gerebe-26-neli152, unknown/jafexe-59-muzo362 (container classification, T1c journal 9) |
| 1 | `a/p0/i/p1` equal, bb differs | component/texacu-57-daci050 |
| 1 | no wrappers, bb differs | unknown/deroxu-29-gude369 (T8) |

## Table C — layoutEqual=true but survey-diverged, the 10 with the fewest structural diffs

These are post-layout drawing residuals (kin to follow-on 4). Each has exactly 1 structural diff
and 0 numeric diffs, mostly fill or stroke colours:

| tree/slug | first diff |
|---|---|
| component/cukafa-49-fona812 | ellipse fill exp #FFD700, act #F1F1F1 |
| component/givape-84-xano421 | g[2] childCount exp 1, act 5 |
| component/kagapo-72-cofe085 | rect fill exp #00F, act #F00 |
| component/levuxi-16-fotu885 | ellipse fill exp gradient url(#…), act #F1F1F1 |
| component/lobute-63-tizi096 | rect fill exp #ADD8E6, act #FF0 |
| component/somugi-21-doli483 | rect fill exp #FFA500, act #F1F1F1 |
| component/suzemi-86-kuma659 | ellipse fill exp #ADD8E6, act #FF0 |
| unknown/dosixi-10-vetu164 | rect stroke exp #F00, act #181818 |
| unknown/xubabi-00-bike493 | rect stroke exp #F00, act #181818 |
| usecase/lizutu-99-mapa855 | g[3] childCount exp 1, act 3 |

## Observation: the residual work after layout parity is drawing-side colour resolution
- **Context**: layout now matches the jar for 461 of 504 comparable description rows.
- **Finding**: the cheapest remaining divergences are single fill/stroke colour mismatches
  (stereotype or skinparam colour precedence) and childCount on a few groups. None is a layout
  problem.
- **Impact**: the next description mission should start from Table C; the c4 clusterTree-bb family
  (14 rows) is the largest layout residual.
- **Confidence**: High (counts reconcile; mechanisms of individual rows not traced).
