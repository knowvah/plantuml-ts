# Fixtures — residue rows and counts per checkpoint

Measured at main `7d08a6592`, 2026-10-29, jar-compatible mode (`renderFixtureJson`
+ `DeterministicMeasurer` vs `test-results/dot-cache/<type>/<slug>/in.svg`;
scratch classifier, superseded by T0b's `residue.mts`). `n` = max |Δ| over
non-path element coordinates, `p` = max |Δ| over path coordinates, `dims` =
svg width/height differ. Residue is positional only (no structural diffs) on
every row except json/timafu-94-bixe774 (manifest ceiling 37).
Real graphviz on this box: `dot` 16.1.0 (A5/T7's comparison used 15.1.1).

## Counts per checkpoint

| checkpoint | json c/n | yaml c/n | hcl c/n | pins | manifest clean + ceilings | positional rows | ledger rows open |
|---|---|---|---|---|---|---|---|
| main `7d08a6592` | 14/36 | 7/32 | 1/2 | 14/7/1 | 167 + 3 | — | 70 |
| b0 close | 14/36 | 7/32 | 1/2 | 14/7/1 | 167 + 3 | 70 (66 numeric + 4 `aligned:false`: json/timafu, yaml/bafemu, yaml/najoba, yaml/tadari) | 70 |
| b1 close | 14/36 | 7/32 | 1/2 | 14/7/1 | 167 + 3 | 70 (unchanged; no src change) | 70 classed, 0 unknown; U-REC class pending Q1; 0 predicted closed by M1+M2 |
| b2 close | 14/36 | 7/32 | 1/2 | 14/7/1 | 167 + 3 | 70 (unchanged) | 70 classed |
| b3 close | 14/36 | 7/32 | 1/2 | 14/7/1 | 167 + 3 | 70 (identical to b0 pin) | 70 classed; M1+M2 ported, 0 movers |

## T1a — json, node |Δ| ≤ 1px (18)

| row | n | p | dims |
|---|---|---|---|
| bavize-88-jumu158 | 0.22 | 1.9 | – |
| conigu-03-cuzu022 | 0.03 | 1.3 | – |
| derele-19-poni229 | 0.11 | 1.8 | – |
| gavomi-49-koco364 | 0.29 | 1.5 | – |
| jaramo-16-doxa994 | 0.45 | 1.9 | – |
| najixi-88-javo178 | 0.51 | 1.5 | – |
| nanegu-88-boba399 | 0.45 | 1.3 | – |
| noleta-28-nutu456 | 0.28 | 1.7 | – |
| nuviro-48-sice969 | 0.11 | 1.8 | – |
| pijume-87-gufu868 | 0.29 | 1.7 | – |
| gagebi-92-vere937 | 0.72 | 2.0 | y |
| kusule-69-jada088 | 1.00 | 1.0 | y |
| moseba-10-naza079 | 0.68 | 1.9 | y |
| jekaju-28-gulo479 | 0.56 | 2.0 | – |
| json-escaped | 0.56 | 2.0 | – |
| tivuru-65-vezu313 | 0.19 | 3.4 | – |
| mudumo-73-foli040 | 0.73 | 2.4 | y |
| zevaka-35-zova441 | 0.84 | 2.2 | y |

## T1b — json, node |Δ| > 1px (18)

| row | n | p | dims |
|---|---|---|---|
| devime-19-toze896 | 1.19 | 4.3 | y |
| debako-68-sice023 | 7.19 | 9.0 | y |
| dometa-86-jepe218 | 7.19 | 9.0 | y |
| kicati-76-guvi771 | 7.19 | 9.0 | y |
| letada-23-sisi815 | 7.19 | 9.0 | y |
| sevaji-38-xita618 | 7.19 | 9.0 | y |
| vogeku-38-soxe333 | 7.19 | 9.0 | y |
| jidata-48-kire666 | 7.55 | 7.6 | y |
| zasitu-09-lise302 | 8.54 | 14.1 | y |
| bogiku-88-nano204 | 8.63 | 14.2 | y |
| gejena-99-veme626 | 12.00 | 12.0 | y |
| gibego-39-pelu609 | 12.00 | 16.6 | y |
| cilemo-38-fafi313 | 17.06 | 17.1 | y |
| civofu-04-loku952 | 47.10 | 47.1 | y |
| kidoki-70-fala224 | 78.00 | 80.7 | y |
| nopoku-31-cisi925 | 94.00 | 94.0 | y |
| nofuvo-36-muxe040 | 127.00 | 127.0 | y |
| timafu-94-bixe774 | 5.94 | 64.1 | – (structural ceiling 37) |

## T1c — yaml (32) + hcl (2)

| row | n | p | dims |
|---|---|---|---|
| yaml/ketunu-15-poli031 | 0.15 | 1.3 | – |
| yaml/kotize-70-nuze855 | 0.21 | 1.9 | – |
| yaml/lelofi-17-cafo004 | 0.21 | 1.9 | – |
| yaml/litife-43-novo083 | 0.74 | 1.4 | – |
| yaml/medosa-24-jugi124 | 0.75 | 1.3 | – |
| yaml/mudeno-46-rado553 | 0.26 | 1.3 | – |
| yaml/polela-38-mopu631 | 0.21 | 1.9 | – |
| yaml/sozafu-05-xeka661 | 0.09 | 1.5 | – |
| yaml/vugalo-43-mose807 | 0.71 | 0.8 | – |
| yaml/xubife-72-runi076 | 0.47 | 1.7 | – |
| yaml/zebapi-77-zasu051 | 0.87 | 0.9 | – |
| yaml/YAML-attribute-hierarchy | 0.65 | 1.7 | y |
| yaml/YAML-list-key-value-pair | 0.45 | 1.0 | y |
| yaml/gatuva-87-futo104 | 0.49 | 2.0 | y |
| yaml/gobavi-45-guna544 | 0.45 | 1.0 | y |
| yaml/lipoka-75-rigo326 | 0.49 | 2.0 | y |
| yaml/najoba-05-nino350 | 1.00 | 1.4 | y (structural ceiling 1) |
| yaml/sudabi-56-dedu341 | 0.74 | 1.4 | y |
| yaml/tadari-70-nare798 | 1.00 | 1.4 | y (structural ceiling 1) |
| yaml/vapoda-87-piku740 | 1.00 | 2.0 | y |
| yaml/xacali-26-mazu431 | 0.40 | 1.4 | y |
| yaml/zeduse-06-fidi174 | 0.65 | 1.7 | y |
| yaml/zomime-61-sase339 | 0.09 | 1.5 | y |
| yaml/gabalo-23-tefe408 | 0.41 | 2.2 | – |
| yaml/jukejo-54-pope427 | 0.41 | 2.2 | – |
| yaml/poxedu-72-bite327 | 0.41 | 2.0 | – |
| yaml/YAML-space-indent | 0.75 | 2.1 | y |
| yaml/xofilu-53-tazi162 | 0.75 | 2.1 | y |
| yaml/jozapu-14-datu953 | 5.00 | 6.3 | – |
| yaml/vaceci-80-lezo436 | 1.10 | 2.6 | y |
| yaml/nuzaje-74-kenu009 | 14.47 | 133.6 | y |
| yaml/bafemu-96-luji978 | 85.00 | 89.6 | y |
| hcl/jubete-32-sutu417 | 0.80 | 1.9 | – |
| hcl/vocago-35-xodu446 | 0.53 | 1.5 | y |

## Conformant at main (must stay byte-identical — stop 4)

- json (14): babico-87-soxo095 bidire-98-kege137 bitepo-72-vija933 cazuru-97-jala040 dapinu-10-dida560 giduve-36-xuvo448 karaju-04-caxi838 lipuxo-26-susi944 lulofe-05-dasu529 nixaxa-46-muge983 nujuke-14-nabo073 rutofu-66-kivu935 tacizo-43-dige090 xajini-72-rora309
- yaml (7): bedega-54-romu926 coxima-79-gano159 finofu-94-daso450 gipoxa-19-bico146 lifuxe-66-maxu442 vuzosu-08-pake421 xatato-75-mora801
- hcl (1): citoda-80-dimi195

Why some rows are already conformant while M1/M2 apply to every multi-node row
is an open question for B1 (T1a records it): a conformant row is evidence about
when the echo and the min-shift happen to coincide with the jar's arithmetic.
