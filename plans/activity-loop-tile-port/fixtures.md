# Fixtures — `activity-loop-tile-port`

Every baseline fixture containing a `while` or a `repeat`, with its score at
`3651a1ec` (`measurements/base.json` = awrl's `final.json`, aggregate 49658)
and the flags that select a jar branch: `lanes` (swimlanes present -- the
`ConnectionBackSimple1`/`Complex1` predicates become reachable, D5), `break`
(a `break` inside the loop -- the welding connection, D3), `entry` (`repeat
:action;` -- the action replaces the entry diamond, D2). None uses
`backward:`. A mover outside this table that is not a named parent
re-centring is stop 5.

60 fixtures; 23 while, 43 repeat; 19 laned, 9 with break, 5 with an inline entry.

| slug | while | repeat | lanes | break | entry | score |
|---|---|---|---|---|---|---|
| `bareka-88-fusu160` | while |  |  | yes |  | 236 |
| `becanu-19-diti597` |  | repeat | yes |  |  | 183 |
| `biguku-39-voxu233` |  | repeat |  |  |  | 85 |
| `bizono-61-sasa740` |  | repeat |  | yes |  | 245 |
| `boxoto-53-sifo232` |  | repeat |  |  |  | 877 |
| `bozuro-33-celo170` |  | repeat |  |  |  | 173 |
| `bulasi-17-vafa634` | while | repeat | yes |  |  | 250 |
| `bumaca-51-kece901` |  | repeat | yes |  |  | 173 |
| `camavo-50-kaku123` | while | repeat |  |  |  | 288 |
| `cemagu-66-vazo965` | while |  |  |  |  | 155 |
| `cixave-47-milo698` |  | repeat |  | yes |  | 213 |
| `cufega-65-beji958` |  | repeat |  |  |  | 155 |
| `cutabu-59-cilo276` | while |  |  |  |  | 140 |
| `dacuga-41-popo038` |  | repeat |  | yes |  | 215 |
| `dixiku-28-guzo497` |  | repeat |  | yes |  | 183 |
| `doziki-93-rosi997` |  | repeat |  | yes |  | 291 |
| `felega-00-saxi785` |  | repeat | yes |  | yes | 129 |
| `foludi-80-gilo247` | while |  |  |  |  | 115 |
| `fovaja-48-leso567` | while |  |  |  |  | 317 |
| `gacaja-15-keko600` |  | repeat |  |  |  | 612 |
| `gelono-70-zuce760` |  | repeat |  |  |  | 356 |
| `gesogi-81-xoma900` | while | repeat | yes |  |  | 308 |
| `givanu-33-kire967` |  | repeat | yes |  |  | 200 |
| `gofebi-87-zeka817` |  | repeat |  |  |  | 150 |
| `guceja-66-tola192` |  | repeat |  |  |  | 125 |
| `judatu-15-xize591` | while | repeat | yes |  |  | 515 |
| `jupivo-67-gidi531` | while |  |  | yes |  | 326 |
| `jupoxe-15-sugo110` |  | repeat |  |  |  | 1899 |
| `kasadu-53-tuki533` |  | repeat | yes |  |  | 160 |
| `katopo-68-xajo866` |  | repeat | yes |  | yes | 150 |
| `kijazo-83-kipu485` | while |  | yes |  |  | 200 |
| `kodaku-19-moni161` | while |  |  |  |  | 261 |
| `kudedo-31-pafi082` |  | repeat | yes |  | yes | 157 |
| `levuma-67-cego489` |  | repeat |  |  |  | 249 |
| `loxija-71-joku558` |  | repeat |  |  |  | 215 |
| `mafete-03-rapa918` |  | repeat | yes |  | yes | 162 |
| `manata-12-rido730` |  | repeat | yes |  |  | 552 |
| `megara-21-rumi574` |  | repeat | yes |  |  | 205 |
| `nafaxo-62-boso912` | while |  |  | yes |  | 273 |
| `navene-45-cozo466` |  | repeat | yes |  |  | 517 |
| `nivese-34-zavo418` |  | repeat |  |  |  | 255 |
| `nomeco-93-minu967` | while |  |  |  |  | 136 |
| `novata-87-muti352` |  | repeat |  |  | yes | 82 |
| `perate-09-gale335` |  | repeat |  |  |  | 126 |
| `pixako-75-kumi821` | while |  |  | yes |  | 243 |
| `reluvi-59-pifi444` |  | repeat |  |  |  | 119 |
| `ribapo-84-xudu593` |  | repeat |  |  |  | 126 |
| `rujuxa-07-neco067` |  | repeat | yes |  |  | 457 |
| `rurebu-12-nebi203` | while |  |  |  |  | 136 |
| `ruzica-16-deli877` | while |  | yes |  |  | 501 |
| `saxuro-16-tezu631` | while |  |  |  |  | 211 |
| `tepivu-88-reze603` | while |  |  |  |  | 156 |
| `tobajo-64-mipi810` |  | repeat | yes |  |  | 842 |
| `vamazo-19-tufu812` | while |  |  |  |  | 249 |
| `vupuse-73-nuso490` | while | repeat |  |  |  | 160 |
| `xabesu-51-dimi831` |  | repeat |  |  |  | 187 |
| `xekame-27-geba281` |  | repeat |  |  |  | 282 |
| `xovano-23-tazo278` | while |  | yes |  |  | 340 |
| `zepima-96-peco612` | while | repeat |  |  |  | 342 |
| `ziboco-73-kazu841` |  | repeat |  |  |  | 143 |

## Representative slugs (D9, `--align` targets)

- `biguku-39-voxu233` -- simple repeat, no lanes, no labels beyond the test
- `cemagu-66-vazo965` -- labelled while, no lanes
- `bareka-88-fusu160` -- while with an `if` body and a `break`
- `katopo-68-xajo866` -- nested repeats with inline entry actions, one lane
- `felega-00-saxi785` -- repeat with an inline entry action, lanes
- `ruzica-16-deli877` -- nested whiles inside an if, lanes
- `tobajo-64-mipi810` -- three repeats inside fork branches with lanes (awrl's 5.991 px residual)
