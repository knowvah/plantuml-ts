# A5 ledger — per-fixture accounting for json / yaml / hcl

Originally T9's deliverable. **Re-measured 2026-08-09** after M2/M3/M4 landed
(the "structure pass"): every one of the 92 fixtures appears exactly once in
the index below, against a numbered mechanism. Measured with
`renderFixtureJson` + `compareSvg(…, 'deterministic')`.

## Outcome

| | at Batch 4 close | after the structure pass |
|---|---|---|
| fixtures | 92 | 92 |
| byte-conformant | 0 | 0 — **and not reachable; see below** |
| **element tally exact vs jar** | **0** | **75 / 92 (82 %)** |
| fixtures whose interior is COMPARED at all | 0 | 75 |
| total diffs | unmeasurable (all floors) | 14,371 |

Diff composition, now that there is one to compose:

| bucket | diffs | what it is |
|---|---|---|
| geometry (any numeric delta) | 12,804 | **M1** — the accepted layout divergence |
| value-text colour | 957 | the DELIBERATE per-type colour divergence |
| document dimensions | 366 | **M1** again, at the root |
| everything else | 244 | the real remainder — 17 fixtures, all named below |

## Read this before trusting any number above

**Byte-conformance is not reachable for this family, by design.** M1 is an
accepted divergence (ADR-2b: one layout engine, dot-engine, delta accepted)
and it moves the root `@width`/`@height`/`@viewBox` on *every* fixture. The
per-type value colouring is a second deliberate divergence, on every fixture
with a scalar value. So `oracle/goldens/svg-json/ratchet.json` can never
admit a fixture under a zero-diff rule, and its emptiness is not a signal of
anything.

That is a property of the exit bar, not of the port, and it means **this
family needs a different gate than its siblings.** The metric that actually
moved this session — and the one worth gating on — is the **element tally**:
does this port emit the same elements, of the same kinds, in the same order,
as the jar? That question is answerable, it is not contaminated by M1, and it
went 0 → 75 of 92. Proposed as the successor gate; not yet wired.

## What the structure pass changed

M2, M3 and M4 are closed. Their joint effect was larger than the three
mechanisms themselves, because `compare.ts` stops recursing at a structural
mismatch: with the root mismatched on all 92 fixtures, **no fixture's interior
had ever been compared** and every previous diff count in this file was a
floor. That is why the total diff count went UP. It is the first honest number
this family has had.

Ported alongside them, each traceable to a branch rather than to a
measurement:

- `TextBlockJson#drawU`'s own draw order, element for element — highlight rect,
  top separator, column A, column B, per-row divider; node rect drawn first
  filled and last stroked (`TextBlockJson.java:260-320`).
- The column divider is drawn **per row**, spanning that row's height, inside
  `if (line.b2 != null)` (:310-314) — not one full-height line per node.
- `rx`/`ry` are `RoundCorner / 2` (`DriverRectangleSvg.java:78`). Was `rx="10"`.
- Text is positioned by an absolute baseline and carries `textLength`; no
  `dominant-baseline`, no `text-anchor` (`HorizontalAlignment#draw`).
- A nested cell's display string is `"   "`, three spaces — `getShortString`
  falls through to it (:194). It is drawn AND measured; this port had `''`.
- A whitespace-only label has its spaces swapped for NBSP *before* measurement
  (`DriverTextSvg.java:115-116`, guarded by `matches("^\\s*$")` — ordinary
  labels keep real spaces). This is why the jar writes `textLength="11.55"`
  for a cell whose ASCII-space width is 0.
- This family's black: `skin/plantuml.skin:446` sets `FontColor black` /
  `LineColor black` for `yamlDiagram,jsonDiagram`. The port had the global
  `#181818`.
- Removed: the per-node `<clipPath>` and the key-column background rect (the
  jar has zero clipPaths here and `drawU` paints no such column), and the
  arrowhead `<marker>`. With all three gone the renderer generates **no ids at
  all**, so the id-determinism machinery went with them.

## Mechanisms

| # | mechanism | class | origin | fixtures |
|---|---|---|---|---|
| M1 | Document dimensions and all node/edge geometry | **ACCEPTED DIVERGENCE** (ADR-2b) | upstream is Smetana-laid-out; this port uses dot-engine everywhere | 92 |
| M2 | Root had many children; the jar has 2 | **CLOSED** | `json/renderer-shell.ts#assembleJsonShell` now wraps the body in one content `<g>` | 0 |
| M3 | `<defs>` carried an arrow `<marker>`; the jar's is empty | **CLOSED** | arrowhead is an inline filled `<path>` — `Arrow#drawArrow`, ported into `JsonCurve.ts#buildArrowHeadPath` | 0 |
| M4 | Root `<g>` attributes never applied | **CLOSED** | consequence of M2; `withRootGroupAttributes` now sees the single `<g>` it requires | 0 |
| M5 | Value text colour | **DELIBERATE DIVERGENCE** | DIVERGENCES.md, "Value text — per-type colors (aesthetic)" | ~57 |
| M6 | Element tally still differs | PORT GAP | 17 fixtures, each with its own small delta — see the index | 17 |

### M6 — the whole remaining structural gap, named

| signature | fixtures | likely mechanism (unverified — do NOT relay as a finding) |
|---|---|---|
| `text-1` | 4 | one cell not drawn |
| `rect+1` | 3 | one rect too many |
| `text-4` | 2 | four cells not drawn |
| `text+5`, `text+3`, `text+1` | 3 | cells drawn that the jar does not |
| `text-2` | 1 | |
| `text-112` (`json/noleta-28-nutu456`) | 1 | large; a wrap/`MaximumWidth` case |
| `rect+1 text-12` (`json/vogeku-38-soxe333`) | 1 | |
| `rect-1` (`yaml/tadari-70-nare798`) | 1 | the closest fixture in the corpus: 3 diffs |
| `ellipse+1 line+6 path-6 polygon-5 rect+4` (`yaml/litife-43-novo083`) | 1 | a different shape family entirely |

Each is individually diagnosable now that the interiors compare. None has been
diagnosed — they are measured and named, not explained.

### M1 — accepted, with its measurement

graphviz pads every `shape=record` field: `XPAD` = 4·GAP = 16, `YPAD` =
2·GAP = 8 (`~/git/graphviz/lib/common/macros.h:27-29`). Upstream compensates
only the `YPAD` half (`SmetanaForJson`'s `colAwidth - 8`), which is correct for
Smetana because Smetana does not apply `XPAD`. This port compensates both,
because its engine applies both — verified against the installed `dot` 15.1.1,
which returns byte-identical record geometry for the same label.

Recorded in `DIVERGENCES.md`, "Smetana-backed diagram types".

### Two upstream DOT attributes this port does not set

`SmetanaForJson.java:221-223` sets `arrowsize=.75` and `arrowhead=normal` on
every json edge. This port's layout sets only `tailport`, and
`core/graph-layout.types.ts#DotInputEdge` has no field for either. Consequence:
the engine neither reserves nor shortens for the arrowhead, so the spline
terminates where the jar's does not.

Related, and the reason the arrowhead's depth is approximated rather than
read: **`@knowvah/dot-engine` does not expose a spline's `sp`/`ep`.**
`EdgeGeometry` carries only the bezier control points, so
`JsonCurve.ts#endPointOf` extrapolates the endpoint by one arrow length
(graphviz `ARROW_LENGTH` 10 × upstream's `arrowsize` .75) instead of reading
the value the engine already computed. Filed in `docs/graphviz-issues/`.

### Not observed, and worth stating

- **No `@knowvah/dot-engine` layout defect was found.** Record sizing and field
  ports match real graphviz byte-for-byte on the case tested.
- The engine warning `in routesplines, Pshortestpath failed` (with
  `lost <tail> <head> edge`) DOES reproduce, on every json-family census run.
  See `docs/graphviz-issues/`.

## Per-fixture index

Every fixture, exactly once. **† = the element tally still differs, so
`compare.ts` stops recursing and this fixture's diff count is a FLOOR.** The
75 rows without a † are fully compared, top to bottom, for the first time.

| fixture | diffs | element tally vs jar |
|---|---|---|
| json/babico-87-soxo095 | 13 | exact |
| json/bavize-88-jumu158 | 31 | exact |
| json/bidire-98-kege137 | 5 | exact |
| json/bitepo-72-vija933 | 6 † | `rect+1` |
| json/bogiku-88-nano204 | 538 | exact |
| json/cazuru-97-jala040 | 5 † | `text-1` |
| json/cilemo-38-fafi313 | 5 † | `text-4` |
| json/civofu-04-loku952 | 1754 | exact |
| json/conigu-03-cuzu022 | 37 | exact |
| json/dapinu-10-dida560 | 44 | exact |
| json/debako-68-sice023 | 183 | exact |
| json/derele-19-poni229 | 51 | exact |
| json/devime-19-toze896 | 5 † | `text+5` |
| json/dometa-86-jepe218 | 192 | exact |
| json/gagebi-92-vere937 | 5 † | `text+1` |
| json/gavomi-49-koco364 | 5 † | `text-2` |
| json/gejena-99-veme626 | 515 | exact |
| json/gibego-39-pelu609 | 522 | exact |
| json/giduve-36-xuvo448 | 5 | exact |
| json/jaramo-16-doxa994 | 18 | exact |
| json/jekaju-28-gulo479 | 93 | exact |
| json/jidata-48-kire666 | 107 | exact |
| json/json-escaped | 93 | exact |
| json/karaju-04-caxi838 | 5 | exact |
| json/kicati-76-guvi771 | 184 | exact |
| json/kidoki-70-fala224 | 1156 | exact |
| json/kusule-69-jada088 | 55 | exact |
| json/letada-23-sisi815 | 184 | exact |
| json/lipuxo-26-susi944 | 7 | exact |
| json/lulofe-05-dasu529 | 7 | exact |
| json/moseba-10-naza079 | 110 | exact |
| json/mudumo-73-foli040 | 350 | exact |
| json/najixi-88-javo178 | 33 | exact |
| json/nanegu-88-boba399 | 18 | exact |
| json/nixaxa-46-muge983 | 5 † | `rect+1` |
| json/nofuvo-36-muxe040 | 826 | exact |
| json/noleta-28-nutu456 | 5 † | `text-112` |
| json/nopoku-31-cisi925 | 1368 | exact |
| json/nujuke-14-nabo073 | 5 † | `text-1` |
| json/nuviro-48-sice969 | 39 | exact |
| json/pijume-87-gufu868 | 108 | exact |
| json/rutofu-66-kivu935 | 9 | exact |
| json/sevaji-38-xita618 | 6 † | `rect+1` |
| json/tacizo-43-dige090 | 5 † | `text-1` |
| json/timafu-94-bixe774 | 125 | exact |
| json/tivuru-65-vezu313 | 150 | exact |
| json/vogeku-38-soxe333 | 6 † | `rect+1 text-12` |
| json/xajini-72-rora309 | 5 | exact |
| json/zasitu-09-lise302 | 538 | exact |
| json/zevaka-35-zova441 | 353 | exact |
| yaml/YAML-attribute-hierarchy | 51 | exact |
| yaml/YAML-list-key-value-pair | 23 | exact |
| yaml/YAML-space-indent | 81 | exact |
| yaml/bafemu-96-luji978 | 1918 | exact |
| yaml/bedega-54-romu926 | 10 | exact |
| yaml/coxima-79-gano159 | 5 | exact |
| yaml/finofu-94-daso450 | 7 | exact |
| yaml/gabalo-23-tefe408 | 136 | exact |
| yaml/gatuva-87-futo104 | 58 | exact |
| yaml/gipoxa-19-bico146 | 12 | exact |
| yaml/gobavi-45-guna544 | 23 | exact |
| yaml/jozapu-14-datu953 | 5 † | `text-1` |
| yaml/jukejo-54-pope427 | 137 | exact |
| yaml/ketunu-15-poli031 | 5 † | `text+3` |
| yaml/kotize-70-nuze855 | 68 | exact |
| yaml/lelofi-17-cafo004 | 68 | exact |
| yaml/lifuxe-66-maxu442 | 6 | exact |
| yaml/lipoka-75-rigo326 | 58 | exact |
| yaml/litife-43-novo083 | 23 † | `ellipse+1 line+6 path-6 polygon-5 rect+4` |
| yaml/medosa-24-jugi124 | 54 | exact |
| yaml/mudeno-46-rado553 | 206 | exact |
| yaml/najoba-05-nino350 | 80 | exact |
| yaml/nuzaje-74-kenu009 | 125 | exact |
| yaml/polela-38-mopu631 | 68 | exact |
| yaml/poxedu-72-bite327 | 218 | exact |
| yaml/sozafu-05-xeka661 | 68 | exact |
| yaml/sudabi-56-dedu341 | 28 | exact |
| yaml/tadari-70-nare798 | 3 † | `rect-1` |
| yaml/vaceci-80-lezo436 | 129 | exact |
| yaml/vapoda-87-piku740 | 5 † | `text-4` |
| yaml/vugalo-43-mose807 | 32 | exact |
| yaml/vuzosu-08-pake421 | 7 | exact |
| yaml/xacali-26-mazu431 | 56 | exact |
| yaml/xatato-75-mora801 | 7 | exact |
| yaml/xofilu-53-tazi162 | 81 | exact |
| yaml/xubife-72-runi076 | 228 | exact |
| yaml/zebapi-77-zasu051 | 54 | exact |
| yaml/zeduse-06-fidi174 | 51 | exact |
| yaml/zomime-61-sase339 | 100 | exact |
| hcl/citoda-80-dimi195 | 6 | exact |
| hcl/jubete-32-sutu417 | 130 | exact |
| hcl/vocago-35-xodu446 | 47 | exact |
