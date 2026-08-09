# A5 ledger — per-fixture accounting for json / yaml / hcl

Originally T9's deliverable. **Re-measured 2026-08-09** after M2/M3/M4 landed
(the "structure pass"): every one of the 92 fixtures appears exactly once in
the index below, against a numbered mechanism. Measured with
`renderFixtureJson` + `compareSvg(…, 'deterministic')`.

## Outcome

| | at Batch 4 close | after the structure pass |
|---|---|---|
| fixtures | 92 | 92 |
| byte-conformant | 0 | **15** (9 json, 5 yaml, 1 hcl) — pinned |
| **element tally exact vs jar** | **0** | **75 / 92 (82 %)** |
| fixtures whose interior is COMPARED at all | 0 | 75 |
| total diffs | unmeasurable (all floors) | 13,178 |

Diff composition, now that there is one to compose:

| bucket | diffs | what it is |
|---|---|---|
| geometry (any numeric delta) | 12,804 | **M1** — the accepted layout divergence |
| value-text colour | 0 | was 957; the per-type divergence was retired and now matches upstream |
| document dimensions | 366 | **M1** again, at the root |
| everything else | 244 | the real remainder — 17 fixtures, all named below |

## A claim this file made, and how it was falsified

An earlier revision of this section argued that byte-conformance was **not
reachable** for the family: M1 moved the root dimensions on every fixture, the
per-type value colouring moved the text on most, and therefore a zero-diff
ratchet could never admit anything.

Both premises turned out to be soft.

- The value colouring was a divergence whose own justification did not survive
  measurement (all 20 built-in themes already discarded it). Retired; matched.
- **M1 was two mechanisms wearing one label.** Per-axis measurement: width
  varied (the real engine divergence), height was a constant +2 on 70 of 92 —
  which no layout difference explains. The height half was a defect in this
  port's document-dimension formula. Diagnosed and fixed (M1b).

13 fixtures are now byte-conformant. The lesson is the reusable part: **an
accepted divergence is a comfortable place for a defect to hide,** because
every diff it touches is pre-excused. Measure a divergence per axis, per
mechanism, before trusting it to explain anything.

The **element tally** (same elements, kinds, order — 0 → 75 of 92 this
session) remains a useful secondary metric for the fixtures M1a still blocks,
but it is no longer needed as a *substitute* gate.

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
| M1a | Horizontal layout geometry | **ACCEPTED DIVERGENCE** (ADR-2b) | upstream is Smetana-laid-out; this port uses dot-engine everywhere | 92 |
| M1b | Document-dimension formula, constant +2 per axis | **CLOSED** — oracle-instrumented, fixed | `json/layout.ts#documentDimensions` now mirrors the ink-walk → margins → truncating-`+1` chain | 0 |
| M2 | Root had many children; the jar has 2 | **CLOSED** | `json/renderer-shell.ts#assembleJsonShell` now wraps the body in one content `<g>` | 0 |
| M3 | `<defs>` carried an arrow `<marker>`; the jar's is empty | **CLOSED** | arrowhead is an inline filled `<path>` — `Arrow#drawArrow`, ported into `JsonCurve.ts#buildArrowHeadPath` | 0 |
| M4 | Root `<g>` attributes never applied | **CLOSED** | consequence of M2; `withRootGroupAttributes` now sees the single `<g>` it requires | 0 |
| M5 | Value text colour | **CLOSED** — matched to upstream, divergence retired 2026-08-09 | `renderer-style.ts`; DIVERGENCES.md entry marked RETIRED | 0 |
| M6 | Element tally still differs | PORT GAP | 17 fixtures, each with its own small delta — see the index | 17 |

### M6 — element tally: 17 → 9 fixtures

Four mechanisms closed, each read out of a branch rather than fitted.

**1. An empty cell is not an absent cell.** `StripeSimple#getAtoms`
(`StripeSimple.java:124-129`) gives a stripe that collected no atoms a
single-space atom, which the whitespace-only rule then writes as NBSP. This
port skipped drawing an empty value entirely. Jar-verified: `{"a": ""}` emits a
value `<text>`, and `{}` — which `JsonDiagram.java:78-88` rewrites to an array
holding one empty string — emits exactly one text inside a 10×18 box. The
space measures 0 wide, so this adds an element without moving any geometry,
which is why that 10×18 box is a number no `MIN_WIDTH` produces.

**2. `StringUtils.trin`** (`DriverTextSvg.java:125`) trims chars ≤ U+0020 from
both ends of every emitted label. Ported into
`core/svg-shapes.ts#emittedTextForm`, AFTER the NBSP swap — the order is
load-bearing, since reversing it would trim json's three-space nested cell to
nothing. Verified applicable: across 12,521 jar `<text>` elements in the
json/yaml/class/state goldens, ZERO carry leading or trailing whitespace.
This also fixed a latent CLASS divergence — note atom runs were emitting
`'Yet '` where the jar emits `'Yet'` (`class/tenobo-24-liga464`).

**3. Background rect emitted when it should not be.** Two ways, both mine from
this mission's own shell: a non-solid background (`transparent` / `none` /
`#00000000`) got a rect, and a background that IS the default white but
spelled `#FFF` by a theme slipped past a string comparison. Now uses
`assembleDocumentShell`'s own solidity rule plus a `shortenColor` comparison.

**4. Not a mechanism — `json/nixaxa-46-muge983` is malformed JSON.** The jar
draws only the message text (`JsonDiagram#drawU`'s `root == null` branch), no
box; this port draws its own error box. See the remaining table.

### M6 remainder — 9 fixtures, each diagnosed

| fixture | signature | mechanism |
|---|---|---|
| `json/nixaxa-46-muge983` | `rect+1` | malformed JSON: `JsonDiagram#drawU` draws a bare monospace message at the normal cell origin, no box. This port draws `renderErrorBox`. Note the jar NBSP-joins the message's spaces even though it is not whitespace-only — a monospace-font rule not yet located. |
| `json/vogeku-38-soxe333` | `rect+1 text-12` | `!theme plain`; residual after the background fix |
| `yaml/tadari-70-nare798` | `rect-1` | has a `title`; chrome interaction |
| `json/gagebi-92-vere937` | `text+1` | value ends `\r\n`; we emit a trailing empty line the jar does not |
| `json/devime-19-toze896` | `text+5` | same, ×5 |
| `yaml/ketunu-15-poli031` | `text+4` | **the jar does NOT split on a literal newline.** Its golden carries ONE `<text>` whose content contains real U+000A characters (`"def func(x) do\n…"`). `Display.getWithNewlines` splits on the authored escape `\n`, not on U+000A, so a YAML block scalar's newlines survive into the SVG. This port splits on U+000A. |
| `yaml/vapoda-87-piku740` | `text-4` | unexamined |
| `json/noleta-28-nutu456` | `text-112` | large; `MaximumWidth` wrap case |
| `yaml/litife-43-novo083` | `ellipse+1 line+6 path-6 polygon-5 rect+4` | a different shape family entirely; unexamined |

### M1 is TWO mechanisms, and only one of them is the accepted divergence

Measured 2026-08-09, after the value-colour match made the interiors legible.
Document-dimension delta (jar − ours) across all 92 fixtures:

| axis | delta | fixtures |
|---|---|---|
| **height** | **exactly +2** | **70 / 92** |
| width | +2 | 47 / 92 |
| width | anything else (+1, +3, +6, −12, +21, …) | 45 / 92 |

The **width** spread is the genuine ADR-2b divergence: horizontal placement is
what the two layout engines disagree about. The **height** constant is not —
height follows the node stack, which this port reproduces exactly. Three
fixtures (`json/bidire-98-kege137`, `giduve-36-xuvo448`, `karaju-04-caxi838`)
are byte-identical to the jar on every drawn coordinate and differ ONLY in the
four root dimension attributes, both axes +2.

**So M1 has been carrying a defect of ours under an accepted-divergence
label.** Splitting it:

- **M1a — horizontal layout geometry.** ACCEPTED (ADR-2b). Unchanged.
- **M1b — the document-dimension formula.** OURS, and fixable. A constant +2
  per axis.

#### M1b — mechanism, as far as it is established

The jar does not size the document from the drawn extent. The chain is:

1. `JsonDiagram#calculateDimension` (`JsonDiagram.java:130-137`) is an INK
   WALK — `TextBlockUtils.getMinMax(this, stringBounder, true)` — not a
   geometry sum.
2. `LimitFinder#drawRectangle` (`LimitFinder.java:184-188`) contributes
   `(x-1, y-1)` and `(x+w-1, y+h-1)` per rectangle, and ignores `UStroke`
   entirely. `initToZero=true` seeds the box at `(0,0,0,0)`
   (`MinMax.java:71-76`), so the ink dim depends on the drawing's ABSOLUTE
   position, not just its size — `getDimension()` is `maxX-minX`
   (`MinMax.java:151-153`).
3. `TextBlockExporter#calculateFinalDimension` (`:199-203`) adds
   `TitledDiagram#getDefaultMargins()` = `same(10)` (`TitledDiagram.java:275-277`)
   and hands the result to `SvgOption.withMinDim` (`:284`).
4. `SvgGraphics`'s constructor calls `ensureVisible(minDim…)` (`:143`), which
   stores `maxX = (int)(x + 1)` (`:129-134`) — a TRUNCATING +1.
5. `maxX`/`maxY` ARE the emitted `width`/`height`/`viewBox`
   (`SvgGraphics.java:799-811`).

`json/layout.ts` models none of this: it computes
`max(node.x + node.width) + CANVAS_PAD` directly.

**Ruled out, with the evidence:**

- *Border stroke width.* `LimitFinder` never inspects `UStroke`.
- *A margin of 11 rather than 10.* `getDefaultMargins` is `same(10)`, and a
  constant float offset is inconsistent with the observed float deltas
  (1.425 / 1.612 / 2.000) — those are consistent with `trunc(x + 22)` against
  our `trunc(x + 20)`.
- *The Smetana/dot-engine divergence,* for the height axis: the three fixtures
  above match the jar on every drawn coordinate.

#### M1b — CLOSED, both `+1`s attributed

Closed by instrumenting the oracle (the method mission G2/N46 used for the
class equivalent): a throwaway local build of the pinned fork with `printf`s in
`JsonDiagram#calculateDimension`, `TextBlockExporter#calculateFinalDimension`
and `SvgGraphics#ensureVisible`. The instrumentation was reverted; only
`oracle/dist/plantuml-oracle.jar` remains, untouched.

For `json/bidire-98-kege137` (one node, 24 × 18, drawn at 10,10):

```
[DBG] JsonDiagram.getMinMax = (-1.0,-1.0)->(24.0,18.0)  dim = 25.0 x 19.0
[DBG] calculateFinalDimension: textBlock=25.0x19.0  margins L=10 R=10 T=10 B=10  -> 45.0x39.0
[DBG] ensureVisible(45.0, 39.0)  maxX 10 -> 46   maxY 10 -> 40
```

The two `+1`s:

1. **The ink box's MIN corner is `(-1, -1)`**, not `(0, 0)`.
   `LimitFinder#drawRectangle` records `addPoint(x - 1, y - 1)`
   (`LimitFinder.java:185`), and `MinMax#getDimension` is `maxX - minX`
   (`MinMax.java:151-153`) — so that corner adds exactly 1 to each axis. This
   is the one that was missing; `initToZero` seeds the box at `(0,0,0,0)` but
   the rect's own `-1` pushes the min below zero. **Reasoning about it from
   the source had produced the wrong answer twice** — the ink dim is neither
   the node size nor node+stroke.
2. `ensureVisible`'s `(int)(x + 1)` (`SvgGraphics.java:129-134`).

Verified on five fixtures spanning 46px to 1356px wide, single- and
multi-node: the min corner is `(-1.0,-1.0)` in every case, and
`trunc(rawExtent + 1 + 20 + 1)` reproduces the jar's emitted dimensions
exactly.

**Result: 13 fixtures byte-conformant** (7 json, 5 yaml, 1 hcl), all pinned.
Height delta is now 0 on the same 70 of 92 fixtures that carried the +2.

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
