# The 40 affected fixtures

Baseline fixtures (`oracle/goldens/svg-activity/diff-baseline.json`,
`status: "baseline"`) whose source switches lane INSIDE a compound. Found by
a regex nesting scan at planning, 2026-09-15; **T1 verifies every row
against the parser and amends this file**. Scores are the pins at
`2a31a9ad` (sum **11783**; aggregate over all 268 **52954**).

`*` = the repeat opens and closes in different lanes (D3). `pin` = has an
`ALLOWED_NEW_OVERLAPS` entry.

| slug | kinds | pinned |
|---|---|---|
| `becanu-19-diti597` | repeat* | 209 |
| `bideta-97-cezo697` | if | 187 |
| `bixefi-77-moki051` | fork (pin) | 254 |
| `bugaja-31-jaso630` | split (pin) | 216 |
| `bumaca-51-kece901` | repeat | 169 |
| `decudi-92-bisu741` | split, if | 383 |
| `firibi-00-puki721` | fork | 348 |
| `gesogi-81-xoma900` | fork | 303 |
| `givanu-33-kire967` | repeat* | 218 |
| `gugala-11-suce270` | split | 226 |
| `jevoce-05-mumi686` | split, if | 439 |
| `jucidi-98-zato093` | if | 251 |
| `judatu-15-xize591` | split | 573 |
| `kasadu-53-tuki533` | repeat* | 180 |
| `kijazo-83-kipu485` | while | 208 |
| `kudedo-31-pafi082` | repeat* | 165 |
| `letuke-04-poza319` | if | 227 |
| `lukoxa-16-cecu095` | if | 157 |
| `maduja-30-xiri319` | if | 318 |
| `mafete-03-rapa918` | repeat* | 176 |
| `maketa-43-juja264` | split, if (pin ×2) | 298 |
| `manata-12-rido730` | if, repeat* | 308 |
| `megara-21-rumi574` | repeat | 213 |
| `misiji-27-buje656` | fork | 225 |
| `movexa-27-rexe388` | if | 187 |
| `nojije-35-teta491` | if | 250 |
| `noxasi-06-nejo322` | fork | 223 |
| `nupose-71-vido428` | split | 373 |
| `pezubu-98-niba240` | if | 215 |
| `racana-82-zece676` | split (pin ×2) | 310 |
| `roboja-69-susa752` | split | 373 |
| `rujuxa-07-neco067` | if, repeat | 484 |
| `ruzica-16-deli877` | if, while | 516 |
| `samavi-13-fuku339` | if | 204 |
| `sopape-11-laxo488` | split | 103 |
| `tobajo-64-mipi810` | fork (pin) | 970 |
| `tuneta-22-mega154` | if | 351 |
| `xarumo-26-zinu467` | if | 217 |
| `xovano-23-tazo278` | while | 351 |
| `zeporo-46-zicu301` | if | 405 |
