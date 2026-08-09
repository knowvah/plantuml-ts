# A5 ledger — per-fixture accounting for json / yaml / hcl

T9. Every one of the 92 fixtures appears exactly once in the index below,
against a numbered mechanism. Measured after Batch 3 (T6/T6b/T7/T8) with
`renderFixtureJson` + `compareSvg(…, 'deterministic')`.

## Outcome

| type | fixtures | byte-conformant | node Δw / Δh vs jar | nodes exact |
|---|---|---|---|---|
| json | 50 | 0 | — | — |
| yaml | 39 | 0 | — | — |
| hcl | 3 | 0 | — | — |
| **all** | **92** | **0** | **3.08 / 0.96** | **21 / 557** |

Batch 3's arc, on the metric that could actually see the layout:

| | mean node Δy vs jar | child ↔ parent-row |
|---|---|---|
| batch start (LR graph) | fully mirrored | — |
| after T6 (mirrored graph) | — | — |
| after T6b (sizing port) | — | — |
| **after T7 + T8** | **6.65** | **64.34** |

## The bar this is measured against

**A5's exit bar was amended mid-mission by ADR-2b.** This family is laid out
by Smetana upstream, and this port uses one layout engine (dot-engine) for
everything — so byte-exact geometry is explicitly NOT the target here.
Priority is readability first, SVG fidelity to upstream second. See
`decisions.md` ADR-2b and CLAUDE.md.

That makes M1 below an accepted delta rather than a defect. **It does not
excuse M2–M5, which are ordinary port gaps in output this port fully
controls.**

## Honest status: A5 is NOT at its exit bar

Zero fixtures are byte-conformant, and **all 92 still carry a structural
`childCount` diff — so no fixture's interior has ever been compared**
(`compare.ts:325` stops recursing on a structural mismatch; see M2). Every
diff count in the index is therefore a FLOOR, marked †.

The mission is being closed at Batch 4 with the remainder named, not with the
bar claimed. M2 is the gate: until the document structure matches, the
interior is unmeasurable and M5 cannot even be sized.

## Mechanisms

| # | mechanism | class | origin | fixtures |
|---|---|---|---|---|
| M1 | Document dimensions differ (`@viewBox`, `@width`, `@height`) | **ACCEPTED DIVERGENCE** (ADR-2b) | layout geometry; upstream is Smetana-laid-out and does not apply graphviz's record `XPAD` | 92 |
| M2 | Root has many children; the jar has 2 (`<defs/>` + one content `<g>`) | PORT GAP | `json/renderer.ts` emits node `<g>`s and per-node `<defs>` as top-level siblings; `document-shell.ts#withRootGroupAttributes` needs a single `<g>` body and silently no-ops otherwise | 70 |
| M3 | `<defs>` carries an arrow `<marker>`; the jar's is empty | PORT GAP | `json/renderer.ts#jsonArrowMarkerDef` — the jar draws arrowheads inline, the same mechanism G4 landed for state | 22 |
| M4 | Root `<g>` attributes (`font-family`, `lengthAdjust`, `transform`) | PORT GAP | consequence of M2 — the root group is never formed, so its attributes land nowhere | 20 |
| M5 | Text attributes (`x`, `y`, `fill`, `font-weight`, `textLength`, `dominant-baseline`) | PORT GAP, **UNSIZED** | only visible on the 5 fixtures whose structure happens to align far enough to descend; the true count is unknown until M2 lands | 5 |

### M1 — accepted, with its measurement

graphviz pads every `shape=record` field: `XPAD` = 4·GAP = 16, `YPAD` =
2·GAP = 8 (`~/git/graphviz/lib/common/macros.h:27-29`). Upstream compensates
only the `YPAD` half (`SmetanaForJson`'s `colAwidth - 8`), which is correct for
Smetana because Smetana does not apply `XPAD`. This port compensates both,
because its engine applies both — verified against the installed `dot` 15.1.1,
which returns byte-identical record geometry for the same label.

Consequence: same-rank sibling spacing differs from the jar. Child-to-parent-row
alignment measures closer here (64.34 vs 73.92 without ports, 277 edges).
Recorded in `DIVERGENCES.md`, "Smetana-backed diagram types".

### Not observed, and worth stating

- **No `@knowvah/dot-engine` defect was found.** Record sizing and field ports
  match real graphviz byte-for-byte on the case tested. Nothing filed to
  `docs/graphviz-issues/`.
- One engine warning appeared during a full census run — `in routesplines,
  Pshortestpath failed` — and was NOT isolated to a fixture before this ledger
  closed. It is unattributed, not absent. Anyone resuming should reproduce it
  first: it may be a real engine finding.

## Per-fixture index

Every fixture, exactly once. † = the count is a FLOOR: a structural diff stops
the comparator descending, so the interior is unmeasured.

| fixture | diffs† | mechanisms |
|---|---|---|
| json/babico-87-soxo095 | 6† | M1, M3 |
| json/bavize-88-jumu158 | 5† | M1, M2 |
| json/bidire-98-kege137 | 9† | M1, M3, M4 |
| json/bitepo-72-vija933 | 65† | M1, M3, M4, M5 |
| json/bogiku-88-nano204 | 5† | M1, M2 |
| json/cazuru-97-jala040 | 9† | M1, M3, M4 |
| json/cilemo-38-fafi313 | 5† | M1, M2 |
| json/civofu-04-loku952 | 5† | M1, M2 |
| json/conigu-03-cuzu022 | 5† | M1, M2 |
| json/dapinu-10-dida560 | 9† | M1, M3, M4 |
| json/debako-68-sice023 | 5† | M1, M2 |
| json/derele-19-poni229 | 5† | M1, M2 |
| json/devime-19-toze896 | 5† | M1, M2 |
| json/dometa-86-jepe218 | 5† | M1, M2 |
| json/gagebi-92-vere937 | 5† | M1, M2 |
| json/gavomi-49-koco364 | 5† | M1, M2 |
| json/gejena-99-veme626 | 5† | M1, M2 |
| json/gibego-39-pelu609 | 5† | M1, M2 |
| json/giduve-36-xuvo448 | 9† | M1, M3, M4 |
| json/jaramo-16-doxa994 | 5† | M1, M2 |
| json/jekaju-28-gulo479 | 5† | M1, M2 |
| json/jidata-48-kire666 | 5† | M1, M2 |
| json/json-escaped | 5† | M1, M2 |
| json/karaju-04-caxi838 | 9† | M1, M3, M4 |
| json/kicati-76-guvi771 | 5† | M1, M2 |
| json/kidoki-70-fala224 | 5† | M1, M2 |
| json/kusule-69-jada088 | 5† | M1, M2 |
| json/letada-23-sisi815 | 5† | M1, M2 |
| json/lipuxo-26-susi944 | 56† | M1, M3, M4, M5 |
| json/lulofe-05-dasu529 | 56† | M1, M3, M4, M5 |
| json/moseba-10-naza079 | 5† | M1, M2 |
| json/mudumo-73-foli040 | 5† | M1, M2 |
| json/najixi-88-javo178 | 5† | M1, M2 |
| json/nanegu-88-boba399 | 5† | M1, M2 |
| json/nixaxa-46-muge983 | 5† | M1, M2 |
| json/nofuvo-36-muxe040 | 5† | M1, M2 |
| json/noleta-28-nutu456 | 5† | M1, M2 |
| json/nopoku-31-cisi925 | 5† | M1, M2 |
| json/nujuke-14-nabo073 | 9† | M1, M3, M4 |
| json/nuviro-48-sice969 | 5† | M1, M2 |
| json/pijume-87-gufu868 | 5† | M1, M2 |
| json/rutofu-66-kivu935 | 9† | M1, M3, M4 |
| json/sevaji-38-xita618 | 6† | M1, M2 |
| json/tacizo-43-dige090 | 9† | M1, M3, M4 |
| json/timafu-94-bixe774 | 5† | M1, M2 |
| json/tivuru-65-vezu313 | 5† | M1, M2 |
| json/vogeku-38-soxe333 | 6† | M1, M2 |
| json/xajini-72-rora309 | 9† | M1, M3, M4 |
| json/zasitu-09-lise302 | 5† | M1, M2 |
| json/zevaka-35-zova441 | 5† | M1, M2 |
| yaml/YAML-attribute-hierarchy | 5† | M1, M2 |
| yaml/YAML-list-key-value-pair | 5† | M1, M2 |
| yaml/YAML-space-indent | 5† | M1, M2 |
| yaml/bafemu-96-luji978 | 5† | M1, M2 |
| yaml/bedega-54-romu926 | 9† | M1, M3, M4 |
| yaml/coxima-79-gano159 | 9† | M1, M3, M4 |
| yaml/finofu-94-daso450 | 9† | M1, M3, M4 |
| yaml/gabalo-23-tefe408 | 5† | M1, M2 |
| yaml/gatuva-87-futo104 | 5† | M1, M2 |
| yaml/gipoxa-19-bico146 | 10† | M1, M3, M4 |
| yaml/gobavi-45-guna544 | 5† | M1, M2 |
| yaml/jozapu-14-datu953 | 5† | M1, M2 |
| yaml/jukejo-54-pope427 | 5† | M1, M2 |
| yaml/ketunu-15-poli031 | 5† | M1, M2 |
| yaml/kotize-70-nuze855 | 5† | M1, M2 |
| yaml/lelofi-17-cafo004 | 5† | M1, M2 |
| yaml/lifuxe-66-maxu442 | 9† | M1, M3, M4 |
| yaml/lipoka-75-rigo326 | 5† | M1, M2 |
| yaml/litife-43-novo083 | 5† | M1, M2 |
| yaml/medosa-24-jugi124 | 5† | M1, M2 |
| yaml/mudeno-46-rado553 | 5† | M1, M2 |
| yaml/najoba-05-nino350 | 5† | M1, M2 |
| yaml/nuzaje-74-kenu009 | 5† | M1, M2 |
| yaml/polela-38-mopu631 | 5† | M1, M2 |
| yaml/poxedu-72-bite327 | 5† | M1, M2 |
| yaml/sozafu-05-xeka661 | 5† | M1, M2 |
| yaml/sudabi-56-dedu341 | 5† | M1, M2 |
| yaml/tadari-70-nare798 | 4† | M1, M3 |
| yaml/vaceci-80-lezo436 | 5† | M1, M2 |
| yaml/vapoda-87-piku740 | 5† | M1, M2 |
| yaml/vugalo-43-mose807 | 5† | M1, M2 |
| yaml/vuzosu-08-pake421 | 56† | M1, M3, M4, M5 |
| yaml/xacali-26-mazu431 | 5† | M1, M2 |
| yaml/xatato-75-mora801 | 56† | M1, M3, M4, M5 |
| yaml/xofilu-53-tazi162 | 5† | M1, M2 |
| yaml/xubife-72-runi076 | 5† | M1, M2 |
| yaml/zebapi-77-zasu051 | 5† | M1, M2 |
| yaml/zeduse-06-fidi174 | 5† | M1, M2 |
| yaml/zomime-61-sase339 | 5† | M1, M2 |
| hcl/citoda-80-dimi195 | 9† | M1, M3, M4 |
| hcl/jubete-32-sutu417 | 5† | M1, M2 |
| hcl/vocago-35-xodu446 | 5† | M1, M2 |