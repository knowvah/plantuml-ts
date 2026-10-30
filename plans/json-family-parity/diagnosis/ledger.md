# B1 ledger — json-family-parity (all 70 rows)

Built at the B1 close (2026-10-29) from the three agent ledgers, merged
verbatim: `json-subpixel.md` (T1a, 79927416f), `json-large.md` (T1b,
053541f62), `yaml-hcl.md` (T1c, f6573a6cb). The per-row mechanism, origin,
evidence and ruled-out text lives there; this file adds ONE thing — a unified
mechanism name per row, because the three ledgers reused `M3`/`M4`/`S1-S3` for
different mechanisms.

## Headline (all three ledgers, independently)

**M1 + M2 close no row.** Each agent's M1+M2 probe left `residue.mts --all`
byte-identical on all 92 cached rows. M2: the root is alone in rank 0, so the
graphviz bb height IS the jar's `max` and the min-shift is 0 on both axes
(T1b: vogeku 574.687564 = 496.331 + 156.713/2). M1: the engine returns the
rank-axis extent as declared + 1 (the `record_init` +1 Kluge,
`shapes__c.java:1823` / `shapes.c`), so it is never echoed, and
`placeJsonNodes` draws the measured size anyway (`json/layout.ts:370-391`).
Predicted closure of B3: **0 rows** (stop 11 is vacuous).

## Mechanism index (unified names)

| unified | ledgers' names | class (proposed) | rows | origin | predicted closure |
|---|---|---|---|---|---|
| U-REC | T1a S1 · T1b Smetana (a) · T1c M3 | **Smetana** (user ruling Q1, 2026-10-30) | all 70 | jar `shapes__c.java:1636-1644` (no PAD), `:1807-1808` (`POINTS` = ROUND of declared size), `:1816-1817` (max with field sum), `:1823` (+1); graphviz `shapes.c:3688-3689` `INCH2PS` (commit `aee7eda7d`, 8.0.4). Ours `record-label.ts:52-55`, `json/layout.ts:303-304` | T1c emulation (round declared size, columns −8, clamp 0): rank axis exact on 34 yaml/hcl rows and 5 json `dw` close; but 35 json rows move, several WORSE (civofu → unaligned, jidata 7.55→8.0, kidoki/nopoku dw 6→8, conigu/noleta/pijume/tivuru up to 0.475) |
| U-CLIP | T1a S2 · T1c S2 | Smetana (D3 shown in T1a/T1c) | 52 (T1a+T1c rows) | jar `splines__c.java:213-220` keeps last OUTSIDE sample; graphviz `splines.c:136-142` last INSIDE (commit `b03040389`, 7.0.0) | none (Smetana) |
| U-ARROW | T1a S3 · T1c S1 | Smetana (D3 shown) | 52 | jar `arrows__c.java:231-248` 10·0.75 = 7.5; graphviz `arrows.c:1190-1227` penwidth-aware ≈ 9.0 (commit `cfb1cc1a3`, 7.0.0). Measured \|ep−last\|: jar 7.50–7.96, ours 8.55–9.00 | none (Smetana) |
| U-NS | T1b Smetana (b) · T1c S3 | Smetana (D3 shown; T1c S3 not traced to a C commit, rests on D3 alone) | 18 json-large + yaml/jozapu, yaml/bafemu | in-rank network-simplex positions with node order unchanged, up to 127 px (nofuvo); tie-sensitive (jozapu 5.000/5.072/7.000 under < 1e-4 pt input perturbations) | none (Smetana) |
| M3 empty-container-size | T1b M3 | Mn (port-controlled, json) | 12 json-large: debako dometa kicati letada sevaji vogeku jidata zasitu bogiku cilemo kidoki nopoku | jar `TextBlockJson.java:237-240` (engine gets `calculateDimension` width colA+colB = 0; `MIN_WIDTH` is draw-only `:278-279`), `SmetanaForJson.java:253-254` (no label when size = 0 ⇒ default `\N`, sized (0,16) by Smetana's `labels__c.java:119-122` "WE CHEAT"). Ours `TextBlockJson.ts:467` (MIN_WIDTH folded into totalWidth), `json/layout.ts:304`, `record-label.ts:58` (explicit empty label). Engine node: jar 15×17, ours 19.75×31 | counterfactual (height 16, label `_dim_0_0_`): rank axis exact on 6 rows; the (0,16) of the `\N` label is itself Smetana label arithmetic ⇒ part port-controlled (declared 0 not 30), part Smetana |
| M4 inch-string-precision | T1a Mn:M3 · T1b M4 | Mn, origin `src/core/` — **left as is** (user ruling Q3, 2026-10-30) | json/kusule (T1a); the 10 M3+M4 rows (last 1 px with M3) | ours `src/core/svek-dot-emit-clusters.ts:33` `toFixed(6)` via `graph-layout-build.ts:147-149`; jar `SmetanaForJson.java:235-236` `"" + dim/72` (full precision). 110 px → 110.000016 ⇒ port offset 43.999992 ⇒ `(int)` 43 vs 44 | kusule rect/@y + dh → 0; but chaotic elsewhere: civofu → unaligned (path gains a segment), kidoki 33→78 and nopoku 46→94 (with M3), cilemo 14.2→16.0, ±0.001 on 4 json + 8 yaml rows |
| M5 scale-after-layout | T1c M4 | Mn (port-controlled, json) | yaml/nuzaje-74-kenu009, json/timafu-94-bixe774 | upstream scales at emit, after 1x layout (`SvgGraphics.java:468-475`, `ensureVisible` on unscaled coords `:129-131,142-143,801-802`; `TextBlockExporter.java:284`). Ours scales inputs: (1) `ep` never scaled (`scale-geo.ts:94-95`, verified at close); (2) `VERY_FIRST_LINE` 13 applied to scaled points (`JsonCurve.ts:56` vs `SmetanaForJson.java:173`, `JsonCurve.java:119-121`); (3) `CELL_MARGIN_X` 5 added after scaling (`renderer.ts:91-92`); (4) document size `trunc((final+1)·k)` vs jar `(int)((int)(x+1)·scale)` (`scale-geo.ts:110-111`) | nuzaje 14.475/133.630 → 0.475/0.475/dw1 (sites 1-3 probed; dw1 = site 4 by arithmetic); timafu 5.94/64.06 → 0.329/0.810 |

D3 part 2 (all three ledgers): dot-engine equals real `dot -Tdot` 16.1.0 on an
isomorphic input (real `dot` cannot decode the `_dim_` sentinel) — node pos /
width / height on all 70 rows; edge pos on the rows checked. **No dot-engine
class row.** One dot-engine draft (T1a, T1c independently): re-rendering the
SAME graph object is not idempotent (`digraph{a->b}`: first render matches real
dot; second gives `a 27,18 / b 99,18` with the first pass's edge route).
`layoutGraph` renders once — no row affected; held as a note, not filed (no
real-dot counterpart for a second in-process render was established).

Ruled out (all ledgers): `searchsize=500` (`graph-layout-build.ts:67`, never set
by SmetanaForJson) — removing it changed no row (T1a: all 85; T1b: 13).

Manifest claims re-verified (T1c): najoba/tadari ceiling 1 (184 vs 183) and
yaml/vapoda's `SMETANA_ROUNDED_CANVAS` are U-REC; "dot-engine places the child"
in the manifest names the wrong actor (real dot places it identically); the
`shapes__c.java:253-254` citation there is `poly_init`, not records — only
`:1807-1808` applies. tadari's title note is stale (its residue equals najoba's).
bafemu's unaligned path[57] (jar 3 beziers vs our 2) follows from U-NS moving
its tail node n30 by +85.

Conformant rows (step 6, all three ledgers): every conformant row is
single-node (or nixaxa's parse-failure page); every probe/counterfactual
(M1+M2, U-REC emulation, M3, M4, M5) left all 22 at their baseline. **No stop-4
risk from conformant rows.**

## All 70 rows

`ledger class` = as written by the agent (its `M3`/`M4`/`S1-S3` are local to
that ledger); `unified` = the index above.

| row | n | p | dims | ledger class | unified | source |
|---|---|---|---|---|---|---|
| json/bavize-88-jumu158 | 0.225 | 1.938 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/conigu-03-cuzu022 | 0.025 | 1.308 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/derele-19-poni229 | 0.112 | 1.826 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/gavomi-49-koco364 | 0.287 | 1.512 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/jaramo-16-doxa994 | 0.450 | 1.860 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/najixi-88-javo178 | 0.513 | 1.462 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/nanegu-88-boba399 | 0.450 | 1.272 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/noleta-28-nutu456 | 0.275 | 1.705 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/nuviro-48-sice969 | 0.112 | 1.826 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/pijume-87-gufu868 | 0.287 | 1.705 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/gagebi-92-vere937 | 0.720 | 1.980 | y (dw 1) | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/kusule-69-jada088 | 1.000 | 1.021 | y (dw 1, dh 1) | **Mn:M3 (6-dp record inches)**, then Smetana (S1+S2+S3) | M4, U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/moseba-10-naza079 | 0.675 | 1.875 | y (dw 1) | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/jekaju-28-gulo479 | 0.556 | 2.032 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/json-escaped | 0.556 | 2.032 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/tivuru-65-vezu313 | 0.187 | 3.438 | – | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/mudumo-73-foli040 | 0.725 | 2.369 | y (dw 1) | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/zevaka-35-zova441 | 0.838 | 2.156 | y (dw 1) | Smetana (S1+S2+S3) | U-REC, U-CLIP, U-ARROW | json-subpixel.md |
| json/devime-19-toze896 | 1.19 | 4.3 | dw1 | Smetana | U-REC, U-NS | json-large.md |
| json/debako-68-sice023 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/dometa-86-jepe218 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/kicati-76-guvi771 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/letada-23-sisi815 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/sevaji-38-xita618 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/vogeku-38-soxe333 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/jidata-48-kire666 | 7.55 | 7.6 | dw8 dh5 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/zasitu-09-lise302 | 8.54 | 14.1 | dw8 | M3, then Smetana | M3, U-REC, U-NS | json-large.md |
| json/bogiku-88-nano204 | 8.63 | 14.2 | dw8 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/gejena-99-veme626 | 12.00 | 12.0 | dw1 | Smetana | U-REC, U-NS | json-large.md |
| json/gibego-39-pelu609 | 12.00 | 16.6 | dw1 | Smetana | U-REC, U-NS | json-large.md |
| json/cilemo-38-fafi313 | 17.06 | 17.1 | dw3 | M3, then Smetana | M3, U-REC, U-NS | json-large.md |
| json/civofu-04-loku952 | 47.10 | 47.1 | dh34 | Smetana | U-REC, U-NS | json-large.md |
| json/kidoki-70-fala224 | 78.00 | 80.7 | dw6 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/nopoku-31-cisi925 | 94.00 | 94.0 | dw6 | M3+M4, then Smetana | M3, M4, U-REC, U-NS | json-large.md |
| json/nofuvo-36-muxe040 | 127.00 | 127.0 | dw1 | Smetana | U-REC, U-NS | json-large.md |
| json/timafu-94-bixe774 | 5.94 | 64.1 | – (37 structural) | Smetana | M5, U-REC, U-NS | json-large.md |
| yaml/ketunu-15-poli031 | 0.151 | 1.283 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/kotize-70-nuze855 | 0.207 | 1.930 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/lelofi-17-cafo004 | 0.207 | 1.930 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/litife-43-novo083 | 0.237 | 1.410 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/medosa-24-jugi124 | 0.750 | 1.302 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/mudeno-46-rado553 | 0.263 | 1.277 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/polela-38-mopu631 | 0.207 | 1.930 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/sozafu-05-xeka661 | 0.088 | 1.534 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/vugalo-43-mose807 | 0.713 | 0.829 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/xubife-72-runi076 | 0.470 | 1.720 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/zebapi-77-zasu051 | 0.869 | 0.910 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/YAML-attribute-hierarchy | 0.654 | 1.742 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/YAML-list-key-value-pair | 0.451 | 1.011 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/gatuva-87-futo104 | 0.494 | 1.986 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/gobavi-45-guna544 | 0.451 | 1.011 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/lipoka-75-rigo326 | 0.494 | 1.986 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/najoba-05-nino350 | 1.000 | 1.409 | y (U) | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/sudabi-56-dedu341 | 0.737 | 1.409 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/tadari-70-nare798 | 1.000 | 1.409 | y (U) | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/vapoda-87-piku740 | 1.000 | 1.986 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/xacali-26-mazu431 | 0.400 | 1.433 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/zeduse-06-fidi174 | 0.654 | 1.742 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/zomime-61-sase339 | 0.087 | 1.505 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/gabalo-23-tefe408 | 0.413 | 2.152 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/jukejo-54-pope427 | 0.413 | 2.152 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/poxedu-72-bite327 | 0.413 | 2.021 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/YAML-space-indent | 0.750 | 2.146 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/xofilu-53-tazi162 | 0.750 | 2.146 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/jozapu-14-datu953 | 5.000 | 6.350 | – | M3, then Smetana (S1+S2+S3) | U-REC, U-NS, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/vaceci-80-lezo436 | 1.100 | 2.583 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/nuzaje-74-kenu009 | 14.475 | 133.630 | y | M4 + M3, then Smetana (S1+S2) | M5, U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| yaml/bafemu-96-luji978 | 85.001 | 89.628 | y (U) | M3, then Smetana (S3, with S1+S2) | U-REC, U-NS, U-ARROW, U-CLIP | yaml-hcl.md |
| hcl/jubete-32-sutu417 | 0.800 | 1.923 | – | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
| hcl/vocago-35-xodu446 | 0.525 | 1.476 | y | M3, then Smetana (S1+S2) | U-REC, U-ARROW, U-CLIP | yaml-hcl.md |
