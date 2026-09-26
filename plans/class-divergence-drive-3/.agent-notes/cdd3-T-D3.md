# cdd3-T-D3 — layout precision: 2-dp `-Tsvg` read (D3) — REJECTED on the gate rule

Tree: `feat/class-divergence-drive-3` @ 47d21018 (batch-4 close, class 670/34/19).
Pre: `/tmp/cdd3-TD3-pre.json` (render-all, before any edit); all-engine pre =
`/tmp/cdd3-b4-eng/parity-<e>.json`. Post: `/tmp/cdd3-TD3.json`,
`/tmp/cdd3-TD3-post-<e>.json`. Full candidate patch: appendix below
(`git apply` clean on 47d21018).

## Observation: what the jar parses, and at what precision
- **Context**: re-read before implementing.
- **Finding**: `DotStringFactory#solve` (`svek/DotStringFactory.java:377-437`)
  parses graphviz `-Tsvg` TEXT. Node corner = `getMinXY` of the first
  `points=` after `<title>` (`:390-396`; ROUND_RECTANGLE `d=`/points
  `:397-411`; OCTAGON/HEXAGON `:412-418`); CIRCLE/OVAL = `cx - rx`,
  `cy - ry`, each parsed (`:419-424`); cluster = min/max of its polygon
  (`:429-436`); edges = `d=` path (`SvekEdge.java:627-637`), arrowhead
  polygons (`:687`), and each label's table corner (`getXY`, `:741-768`,
  `:808-815`). Every number is `gvprintdouble` (`graphviz
  lib/gvc/gvdevice.c:513-528`: `%.02f`, trailing zeros trimmed, |v|<0.005 ->
  `0`), and every y rides `YDelta(fullHeight)` (`:385-387`), fullHeight =
  `<svg height="%dpt">` = `ROUND(bbH + 2*pad)` (`lib/common/emit.c:1249-1250`,
  `ROUND` `lib/util/arith.h:48`, pad `DEFAULT_GRAPH_PAD` 4 `const.h:96`).
  SVG output prints raw graph coords with y negated
  (`plugin/core/gvrender_core_svg.c:686-717`). Label tables are
  `SvekEdge#appendTable` `(int)` boxes (`:504-521`); graphviz fills the
  whole `w x h` box centred on the label pos (`htmltable.c:519-554`).
- **Impact**: node DIMENSIONS are never read back (the jar keeps its own);
  only positions are. `@startjson/yaml/hcl` are Smetana upstream, so they
  must keep exact doubles.
- **Confidence**: High (quoted source).

## Observation: `toFixed(2)` is not `%.02f` on exact ties
- **Finding**: both round the exact binary value, but `toFixed` breaks an
  exact tie away from zero, `snprintf` half-to-even. The only exact 2-dp ties
  a double holds are odd multiples of 1/8 (`printf "%.2f" 0.125 2.625` ->
  `0.12 2.62`). Also: the literal `155.425` is stored ABOVE the tie
  (155.42500000000001136...), printf gives 155.43 — gatula's 155.42 comes
  from the engine's 6-dp-inch box sitting a hair below it.
- **Impact**: any future 2-dp emulation needs the 1/8 special case.
- **Confidence**: High (printf + Decimal checked).

## Implementation measured (candidate, appendix)
- `src/core/graph-layout-svek-read.ts` (new): `svgDouble` (gvprintdouble +
  parseDouble, ties-to-even), `svekFrame` (`ROUND(bbH+8)`), `svekY`,
  `svekNodeCorner` (polygon min vs ellipse `cx-rx`), `svekEdge` (path + sp/ep
  parsed; label/xlabel/tail/head re-centred on their parsed table corner
  using the `(int)` box from `edgeLabelTables`), `svekCluster`.
- `src/core/graph-layout.ts`: `getLayout(yAxis:'up')` + the reader when
  `opts.read` is `'svek'` (default); corner for a plain node uses the
  ENGINE's 6-dp box (what graphviz drew), HTML-sized nodes keep their cell
  box. `src/diagrams/json/layout.ts` passes `read: 'exact'` (Smetana
  upstream). Pure move of the node-corner helpers to
  `src/core/graph-layout-node-corner.ts` (500-line cap). Not opted out:
  `!pragma layout smetana` on class/state/description (not plumbed to the
  seam; no DOT-parity gate on those paths).
- No epsilon, no fitted value; `absorbLayoutEpsilon` untouched.

## Class (render-all, pin-diff vs /tmp/cdd3-TD3-pre.json): 670/34/19 -> 689/16/18
19 closed, 0 lost:

| fixture | before S/N | after | mechanism |
|---|---|---|---|
| bicabi-42-coto932 | 0/1 | 0/0 | B-5 spline 2-dp read |
| famizo-04-joxe063 | 0/1 | 0/0 | B-5 |
| kicuna-39-riki626 | 0/114 | 0/0 | B-5 |
| konomi-00-gico141 | 0/1 | 0/0 | B-5 (label table corner read, Δ0.315 via moveAwayFrom) |
| kupetu-36-kive480 | 0/1 | 0/0 | B-5 |
| nixema-71-tuke505 | 0/1 | 0/0 | B-5 |
| paluca-39-desa696 | 0/1 | 0/0 | B-5 |
| vebini-34-gapu710 | 0/7 | 0/0 | B-5 |
| gatula-10-bifu561 | 0/2 | 0/0 | node corner 155.42 (probe case) |
| foxata-81-miva542 | 0/2 | 0/0 | E2-1 (label corner 2-dp -> moveAwayFrom bisection bin) |
| ledepo-11-muto607 | 0/2 | 0/0 | E2-1 |
| tijira-61-fere730 | 0/2 | 0/0 | E2-1 |
| zuramo-86-liku129 | 0/2 | 0/0 | E2-1 (DotPath c1-start offset = 2-dp text) |
| vegubu-29-bomu147 | 0/1 | 0/0 | Δ0.012 = 2-dp read |
| puvono-84-doro361 | 0/1 | 0/0 | C-13 Δ0.017 |
| sekame-22-meze147 | 0/1 | 0/0 | C-13 Δ0.017 |
| guxode-39-dobi371 | 0/2 | 0/0 | Δ0.014 |
| kujiji-68-cujo036 | 14/0 diverged | 0/0 | scale basis now lands 9.874 (jar) |
| ziparo-17-joku307 | 0/21 | 0/0 | 0.02 px |

Improved: givoli/tekena/nadepi 24 -> 23 (C-13 text Δ0.011 closed; the Δ10-18
edge path is C-12 = gvi 24, unmoved); gujigi 21 -> 20; delasa 10396 -> 10383.
Unmoved: ririlu 0/48 (issue-19 flat edges + Kal: its leftover is not
precision, as T5 found), jakapi 0/352 (maxDelta 66.871 -> 66.869; HashSet
order still gated on the Δ3.763 frame term from cdd3-T32).
Other class survey maxDelta-only movers (still non-conformant): besepi,
camuna, cobumi, coxose, jakapi, lagudi, mucoti, nafiki, nugecu, rifuzu,
ririlu, sefazi, sokevu, tegefa — all ≤0.005 shifts from the same read.

## Other engines (survey vs /tmp/cdd3-b4-eng): no conformant row lost anywhere
- state 71/14/188 -> 73/12/188: jelusa-98-nexa591, lavera-29-vuka790
  structural-match -> conformant (Δ1 extent now exact); 28 more maxDelta
  shifts ≤0.01 (movuva/pasosa/zonuni 0.011 -> 0, still diverged
  structurally), no dotEqual change.
- unknown 123/81 -> 127/77: gaceme-16-dezo748, gisuvu-77-suti527,
  judelo-10-teca860, ridofi-55-lexe637 -> conformant; 56 maxDelta-only
  (≤0.01; these route to class/state/description).
- component 64, usecase 17, object 2 (bepafe, fonulu), sequence 2
  (fonudu-70-coma124 renders as STATE, ladiro-50-gume805 as CLASS —
  misroutes through `layoutGraph`): maxDelta-only, ≤0.01, verdicts and
  dotEqual unchanged.
- json/yaml/hcl 0 (opt-out), every non-DOT engine 0.

## Gates: npm test RED (2) — the reason for rejection
`npm run typecheck`, `npm run lint`, `npm run build` green; class/object
DOT-parity green. After updating 11 unit pins (every new value is the jar's
own SVG number: lazeju x2 370.58/667.58, tumaba 54.21/82.21/92.21/60.21,
baneru shield 0.14 = jar 7.14-7, Foo-->Bar 109.79/114.79, kujiji 9.874; the
rest are synthetic captures) and `npm run catalog`, npm test = 23034 pass,
2 fail:
- `state-dot-parity` nimana-36-veco708/svek-2.dot: maxSizeDeltaIn
  0.053416 > pinned 0.053277 (+0.000139 in = 0.01 px).
- `state-dot-parity` nimise-04-jove070/svek-2.dot: 0.053417 > 0.053278.

Mechanism (reveal, not regression): the composite `yes`'s declared width is
its inner pass's extent. Jar in.svg vs ours (WidthTableMeasurer), relative
to the inner label "go to yes-yes": YES-NO +8.140 / pre 8.138 / post 8.14;
label2 +73.12 / pre 73.124 / post 73.12; YES-YES +4.59 / pre 4.594 / post
4.59 — every inner relative position is now jar-exact (nimise: +8.88 and
+72.08, exact post). The whole remaining gap is a constant 3.846 px of LEFT
ink the jar folds and we do not (jar inner path `C...21.846` sits 3.846
further from the frame than ours at 18; composite 188.415 vs 184.569). The
old 0.01 px read noise partly cancelled it. The 3.846 term predates D3 and
D3 does not touch it (the size-backlog `_doc` attributes these rows'
residual to a label-position divergence; not re-diagnosed here).
Re-pinning needs
`oracle/goldens/state/size-backlog.json` (never-edit for agents) -> gate
cannot go green inside this task's boundaries -> REJECT per T-D3 step 3/4.

## absorbLayoutEpsilon (measured on the candidate, informational)
Identity probe with D3 applied: class render-all 0 movers; all 27 engines
0 movers (verdict, dotEqual, maxDelta). With D3 it no longer changes any
survey outcome; retirement would still need npm test. Not retired (rejected).

## Survey duration
class 19.25 s before / 19.25 s after; object 16.96 s / 16.74 s. No cost.

## Proposals (for the orchestrator; fixtures.md not edited)
- Maintainer ruling wanted: re-pin nimana 0.053416 / nimise 0.053417 in
  `oracle/goldens/state/size-backlog.json` on the account above, then
  `git apply` the appendix (plus a two-line pin edit) to land D3: +19 class,
  +2 state, +4 unknown conformant, zero losses.
- Otherwise D6 `proposed-accept` for gatula (jar 155.42 parse vs our
  155.425; closed by this read) and ririlu (NOT a precision row: stays
  0/48 with the read applied — issue-19 + Kal).

## Appendix: candidate patch (apply on 47d21018)

```diff
diff --git a/src/core/graph-layout-node-corner.ts b/src/core/graph-layout-node-corner.ts
new file mode 100644
index 000000000..2b94d190c
--- /dev/null
+++ b/src/core/graph-layout-node-corner.ts
@@ -0,0 +1,177 @@
+/**
+ * A laid-out node's top-left corner — split from `graph-layout.ts` (file-size
+ * cap) with no behaviour change: the HTML-sized node boxes (G9/T9, cdd-T15)
+ * and, for the Svek read, the parsed corner (cdd3-T-D3).
+ */
+import type { LayoutSnapshot } from '@knowvah/dot-engine';
+import type { DotInputNode } from './graph-layout.types.js';
+import { svekNodeCorner, svekY, svgDouble, type SvekFrame } from './graph-layout-svek-read.js';
+
+/**
+ * G9/T9: a PORT node occupies its own symbol, not the box graphviz laid out.
+ *
+ * `SvekNode#appendLabelHtmlSpecialForPort` emits an entry/exit point as a
+ * `shape=plaintext` HTML table whenever its label is wider than 40px, so
+ * graphviz sizes the NODE from that table and its `PAD`ded minimum — 54x36 for
+ * `jucori-40-cevo136`'s `Aentry1`, against the 12x12 symbol drawn there. That
+ * bigger box is CORRECT for layout (it is what spaces the ranks), and jar
+ * keeps it: `dot -Tplain` puts that fixture's two pin centres 145px apart,
+ * exactly the frame height jar draws.
+ *
+ * Jar reconciles the two when it reads the layout back. `DotStringFactory
+ * #solve:382-389` takes a `RECTANGLE_PORT`/`RECTANGLE_HTML_FOR_PORTS` node's
+ * position from the `points="…"` polygon beside its `<title>` in graphviz's
+ * own SVG — which is the PORT CELL's polygon, not the outer table's — and
+ * graphviz centres that cell in the padded table. So the reported box is the
+ * caller's declared symbol size, on the engine's own centre.
+ *
+ * This is the seam `solve` occupies, so every consumer sees the corrected box:
+ * before it moved here the state engine drew a 12x12 pin from a 12x12 layout
+ * node (right drawing, ranks 12px too close) and the description engine drew a
+ * 54x36 rect where jar draws 12x12.
+ *
+ * The `RECTANGLE_HTML_FOR_PORTS` half of that same `solve` branch — a class or
+ * object leaf whose members carry link ports, `portRows` here — needs the very
+ * same correction for the very same reason. `addRowPortNode` hands graphviz an
+ * HTML row table with no `width`/`height`/`fixedsize`, exactly as
+ * `SvekNode#appendLabelHtmlSpecialForLink` does, and `poly_init` pads it by
+ * `PAD` (`4*GAP` wide, `2*GAP` tall — graphviz `common/shapes.c:1993-2009`,
+ * `common/const.h:251`). That padding is what spaces the ranks, and jar wants
+ * it; jar simply never reads it back as the classifier's box.
+ *
+ * Measured on `kidugi-68-noje040`: `BigLibrary`'s declared 251.6625x76 came
+ * back as the padded 267x84 — +15.3375 and +8.0, i.e. `PAD` to the pixel — so
+ * the class drew 16px too wide with an empty methods compartment twice its
+ * height, and its whole interior sat 4px high on jar's (same centre, taller
+ * box). Its two neighbours were 8px off in x for the same reason.
+ */
+export function portNodeSize(d: DotInputNode | undefined, engine: number, declared: number): number {
+  if (d === undefined) return engine;
+  return isHtmlSized(d) ? declared : engine;
+}
+
+function isHtmlSized(d: DotInputNode): boolean {
+  // cdd-T15: `shieldMargins` is the third HTML-sized shape -- jar declares
+  // the qualified end's shield table with no `width`/`height` either, and
+  // reads the centre `PORT="h"` cell's own polygon back as the classifier's
+  // box (`DotStringFactory#solve` takes the FIRST `points=` after the node
+  // title, which is that cell's BGCOLOR polygon).
+  return (d.isPort === true && d.shape === 'plaintext') || d.portRows !== undefined || d.shieldMargins !== undefined;
+}
+
+/**
+ * graphviz's `doInt` on an HTML-label `WIDTH=`/`HEIGHT=` attribute: `strtol`
+ * stops at the decimal point, so `"72.995"` sizes a 72pt cell
+ * (`lib/common/htmllex.c:374-382 widthfn`, `:364-372 heightfn`, both via
+ * `doInt`'s `strtol(v, &ep, 10)` at `:203`). Every value reaching here is
+ * non-negative, where `Math.trunc` IS `strtol`'s truncation.
+ *
+ * @see ~/git/graphviz/lib/common/htmllex.c:199-215
+ */
+function htmlCellSize(v: number): number {
+  return Math.trunc(v);
+}
+
+/**
+ * cdd-T15 (D6), corrected cdd2-T11 (Q-3): the top-left corner OFFSET from
+ * graphviz's node centre for a `shieldMargins` node.
+ *
+ * Jar never derives this corner: `DotStringFactory#solve`
+ * (`svek/DotStringFactory.java:390-396`) takes the FIRST `points=` after the
+ * node's `<title>` -- the `PORT="h"` BGCOLOR cell of the 3x3 table
+ * `SvekNode#appendLabelHtml` writes (`svek/SvekNode.java:245-267`) -- and
+ * `getMinXY` of it is the classifier's corner. So the corner is where graphviz
+ * PUT that cell, which is integer arithmetic, not the declared fractions:
+ *
+ * - each `FIXEDSIZE` cell is its truncated `WIDTH`/`HEIGHT` ({@link
+ *   htmlCellSize}; `size_html_cell`, `htmltable.c:1136-1150`, with
+ *   `CELLPADDING=0`/`CELLBORDER=0` adding no margin), an empty `<TD>` is 0;
+ * - a column/row is its widest/tallest cell -- the centre column also holds
+ *   the `WIDTH="1"` spacer cells and the centre row the `HEIGHT="1"` ones;
+ * - the integer table is centred on the node, `-W/2 .. W/2`
+ *   (`make_html_label`, `htmltable.c:1914-1917`), and the h cell starts one
+ *   column / one row in.
+ *
+ * Measured on `baneru-00-kuro607`'s `svek-1.dot` under real `dot -Tsvg`: the
+ * `WIDTH="72.995"` cell is the polygon `8,-176..80,-128` -- 72 wide on the
+ * node centre 44 -- where the old `centre - declared/2` put it at 7.5025, so
+ * the diagram-wide origin shift moved every OTHER node and edge +0.4975px.
+ * Graphviz centres the whole table in the `PAD`ded node box, so `PAD` still
+ * cancels out.
+ */
+export function shieldCorner(d: DotInputNode | undefined, width: number, height: number): [number, number] {
+  const m = d?.shieldMargins;
+  if (m === undefined) return [0, 0];
+  const x1 = htmlCellSize(m.x1);
+  const y1 = htmlCellSize(m.y1);
+  const tableW = x1 + Math.max(1, htmlCellSize(width)) + htmlCellSize(m.x2);
+  const tableH = y1 + Math.max(1, htmlCellSize(height)) + htmlCellSize(m.y2);
+  return [x1 - tableW / 2, y1 - tableH / 2];
+}
+
+/**
+ * The box HALVED to derive a node's CORNER from graphviz's centre — separate
+ * from `width`/`height` (what gets DRAWN) because the two diverge for
+ * exactly one shape: a `portRows` row-table classifier's declared cell
+ * `WIDTH=`/`HEIGHT=` values carry sub-point fractions (this port's own text
+ * measurement), and real graphviz's HTML-table layout floors each to a
+ * whole point before it ever fixes a centre — `addRowPortNode` (`graph-
+ * layout-build.ts`) hands it those fractional `FIXEDSIZE` cells verbatim,
+ * with no `fixedsize`/`width`/`height` on the outer node for graphviz to
+ * echo back untouched. Jar reads that FLOORED box's own left edge off
+ * graphviz's rendered SVG (`DotStringFactory#solve`) and draws its own
+ * (fractional) width FROM that edge; it does not re-centre. So the corner
+ * this port computes must floor too, or it draws centred on the fraction
+ * graphviz never kept.
+ *
+ * Verified directly against real graphviz 15.1.1 `-Tsvg` (not dot-engine)
+ * on two cached oracle DOTs, disambiguating floor from round-to-nearest:
+ * `garizu-98-nixo496`'s `sh0006` (`WIDTH="220.51250000000005"`, fraction
+ * .5125 — ROUNDS to 221, but the rendered polygon is exactly 220 wide,
+ * `Math.floor`) and `kidugi-68-noje040`'s `sh0006` (`WIDTH=
+ * "251.66250000000008"`, HEIGHT sums to 76) — polygon `8,-4` to `259,-80`,
+ * i.e. 251x76 exactly, `Math.floor` on both axes and NO extra padding (the
+ * `portNodeSize` doc comment's own +15.3375/+8.0 pad measurement above this
+ * function was against `@knowvah/dot-engine`, not real graphviz, for this
+ * SAME fixture — that divergence is real but orthogonal: it explains why
+ * `portNodeSize` must override the engine's raw width for DRAWING, not
+ * where the CENTRE the pad is applied around sits, which real graphviz's
+ * own floored-not-padded box confirms is unaffected either way).
+ *
+ * Scoped to `portRows` only, matching the measured evidence
+ * (`.agent-notes/class-html-node-corner-vs-quantized-width.md`: "both are
+ * member-port diagrams… the other nine have no ports and take the engine
+ * width"). The `isPort`-plaintext port SYMBOL (G9/T9, one function up) keeps
+ * centring on its own small declared size inside graphviz's larger box —
+ * jar reads THAT case from the port CELL's own polygon, a different
+ * mechanism this fix does not touch.
+ *
+ * @see ~/git/graphviz/lib/common/htmllex.c, lib/common/htmltable.c (HTML
+ *      table cell sizing — the floor happens inside graphviz's own table
+ *      layout, before `poly_init` ever sees a size)
+ */
+export function cornerSize(d: DotInputNode | undefined, width: number, height: number): [number, number] {
+  if (d?.portRows === undefined) return [width, height];
+  return [Math.floor(width), Math.floor(height)];
+}
+
+/**
+ * cdd3-T-D3: the corner `DotStringFactory#solve` parses (see
+ * `graph-layout-svek-read.ts`). An HTML-sized node keeps the cell box its
+ * polygon is read from; every other node is the box graphviz drew — the
+ * engine's own 6-decimal-inches size, not the declared one.
+ */
+export function svekCornerOf(
+  frame: SvekFrame,
+  n: LayoutSnapshot['nodes'][number],
+  d: DotInputNode | undefined,
+  width: number,
+  height: number,
+): [number, number] {
+  if (d?.shieldMargins !== undefined) {
+    const [dx, dy] = shieldCorner(d, width, height);
+    return [svgDouble(n.x + dx), svekY(frame, n.y - dy)];
+  }
+  const [w, h] = d !== undefined && isHtmlSized(d) ? cornerSize(d, width, height) : [n.width, n.height];
+  return svekNodeCorner(frame, { cx: n.x, cy: n.y, width: w, height: h, shape: d?.shape });
+}
diff --git a/src/core/graph-layout-svek-read.ts b/src/core/graph-layout-svek-read.ts
new file mode 100644
index 000000000..165dd56ac
--- /dev/null
+++ b/src/core/graph-layout-svek-read.ts
@@ -0,0 +1,202 @@
+/**
+ * cdd3-T-D3 (D3): read the layout the way the jar's Svek reads it.
+ *
+ * Upstream never sees graphviz's doubles. `DotStringFactory#solve`
+ * (`svek/DotStringFactory.java:377-437`) runs `dot -Tsvg` and PARSES the text:
+ * a boxed node's corner is `SvekUtils.getMinXY` of the polygon after its
+ * `<title>` (`:390-396`), an ellipse node's is `cx - rx`, `cy - ry` (`:419-424`),
+ * a cluster is the min/max of its polygon (`:429-436`), and every edge is its
+ * path `d=` (`SvekEdge.java:618-637`). Each number is `Double.parseDouble` of
+ * graphviz's `gvprintdouble`, i.e. `"%.02f"` with trailing zeros trimmed and
+ * |v| < 0.005 printed `0` (`graphviz lib/gvc/gvdevice.c:513-528`), and every y
+ * rides `YDelta(fullHeight)` (`DotStringFactory.java:385-387`, `YDelta.java`)
+ * where `fullHeight` is the `<svg height="%dpt">` integer.
+ *
+ * SVG output sets `GVRENDER_DOES_TRANSFORM`, so the printed points are the raw
+ * graph coordinates with y negated (`plugin/core/gvrender_core_svg.c:686-717`,
+ * `svg_bezier`/`svg_polygon`), and the page is
+ * `ROUND(bbHeight + 2*pad)` pt tall (`lib/common/emit.c:1249-1250`, `ROUND`
+ * at `lib/util/arith.h:48`, `pad` = `DEFAULT_GRAPH_PAD` 4 at
+ * `lib/common/const.h:96`).
+ *
+ * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java
+ */
+
+import type { LayoutSnapshot } from '@knowvah/dot-engine';
+import type { DotInputEdge } from './graph-layout.types.js';
+
+/** `DEFAULT_GRAPH_PAD` — `graphviz lib/common/const.h:96`. */
+const DEFAULT_GRAPH_PAD = 4;
+
+/** `gvprintdouble`'s `-0` guard — `graphviz lib/gvc/gvdevice.c:516`. */
+const PRINT_ZERO_BAND = 0.005;
+
+/**
+ * The double Java's `Double.parseDouble` recovers from graphviz's
+ * `gvprintdouble(v)` (`lib/gvc/gvdevice.c:513-528`): `snprintf("%.02f")`,
+ * which rounds the EXACT binary value, ties to even.
+ *
+ * `toFixed(2)` also rounds the exact value, but breaks an exact tie away from
+ * zero. The only exact 2-dp ties a double can hold are odd multiples of 1/8
+ * (`(2m+1)/200` is dyadic only when 25 divides `2m+1`), and for those `v*100`
+ * is exact, so that case is rounded half-to-even directly.
+ *
+ * @see ~/git/graphviz/lib/gvc/gvdevice.c:513-528
+ */
+export function svgDouble(v: number): number {
+  if (v > -PRINT_ZERO_BAND && v < PRINT_ZERO_BAND) return 0;
+  if (Number.isInteger(v * 8) && !Number.isInteger(v * 4)) {
+    const lo = Math.floor(v * 100);
+    return (lo % 2 === 0 ? lo : lo + 1) / 100 + 0;
+  }
+  return Number(v.toFixed(2)) + 0;
+}
+
+/** graphviz `ROUND` — `lib/util/arith.h:48`. */
+function cRound(f: number): number {
+  return f >= 0 ? Math.trunc(f + 0.5) : Math.trunc(f - 0.5);
+}
+
+/** The `YDelta` translation the jar applies to every parsed y. */
+export interface SvekFrame {
+  readonly fullHeight: number;
+}
+
+/** `<svg height="%dpt">` for a graph whose bounding box is `bbHeight` tall. */
+export function svekFrame(bbHeight: number): SvekFrame {
+  return { fullHeight: cRound(bbHeight + 2 * DEFAULT_GRAPH_PAD) };
+}
+
+/** A native (y-up) graphviz y as the jar reads it: `parse(-y) + fullHeight`. */
+export function svekY(frame: SvekFrame, yNative: number): number {
+  return svgDouble(-yNative) + frame.fullHeight;
+}
+
+/** A native (y-up) graphviz point as the jar reads it off a `d=`/`points=`. */
+export function svekPoint(frame: SvekFrame, p: { x: number; y: number }): { x: number; y: number } {
+  return { x: svgDouble(p.x), y: svekY(frame, p.y) };
+}
+
+/** Shapes the jar reads through the ellipse branch (`CIRCLE`/`OVAL`,
+ *  `DotStringFactory.java:419-424`); graphviz prints `point` as an ellipse too. */
+const ELLIPSE_SHAPES: ReadonlySet<string> = new Set(['circle', 'ellipse', 'point']);
+
+/** Native-frame node centre + the box the corner is taken from. */
+export interface SvekNodeBox {
+  readonly cx: number;
+  readonly cy: number;
+  readonly width: number;
+  readonly height: number;
+  readonly shape: string | undefined;
+}
+
+/**
+ * A node's top-left corner as `DotStringFactory#solve` reads it: `cx - rx`,
+ * `cy - ry` from the parsed ellipse attributes (`:419-424`), otherwise the min
+ * of the parsed polygon (`:390-396`), whose left/top vertex sits half the box
+ * off the centre.
+ */
+export function svekNodeCorner(frame: SvekFrame, b: SvekNodeBox): [number, number] {
+  if (b.shape !== undefined && ELLIPSE_SHAPES.has(b.shape)) {
+    return [svgDouble(b.cx) - svgDouble(b.width / 2), svekY(frame, b.cy) - svgDouble(b.height / 2)];
+  }
+  return [svgDouble(b.cx - b.width / 2), svekY(frame, b.cy + b.height / 2)];
+}
+
+type Pt = { x: number; y: number };
+
+/** An unparsed native position moved into the jar's `YDelta` frame only. */
+function flipExact(frame: SvekFrame, p: Pt | undefined): Pt | undefined {
+  return p === undefined ? undefined : { x: p.x, y: frame.fullHeight - p.y };
+}
+
+/** The integer `FIXEDSIZE` table the jar hands graphviz for one edge label
+ *  (`SvekEdge#appendTable`, `SvekEdge.java:504-521`: `(int)` casts). */
+export type LabelTable = readonly [number, number] | undefined;
+
+/** The four label tables of one edge, in snapshot field order. */
+export interface EdgeLabelTables {
+  readonly label?: LabelTable;
+  readonly xlabel?: LabelTable;
+  readonly tailLabel?: LabelTable;
+  readonly headLabel?: LabelTable;
+}
+
+function table(text: string | undefined, w: number | undefined, h: number | undefined): LabelTable {
+  return text === undefined || w === undefined || h === undefined ? undefined : [Math.trunc(w), Math.trunc(h)];
+}
+
+/** The tables `graph-layout-build-edges.ts#addEdges` hands the engine — the
+ *  same presence rules and the same `(int)` truncation. */
+export function edgeLabelTables(inp: DotInputEdge | undefined): EdgeLabelTables {
+  const a = inp?.attributes;
+  if (a === undefined) return {};
+  return {
+    label: table(a.label, a.labelBoxWidth, a.labelBoxHeight),
+    xlabel: table(a.xlabel, a.xlabelWidth, a.xlabelHeight),
+    tailLabel: table(a.tailLabel, a.tailLabelWidth, a.tailLabelHeight),
+    headLabel: table(a.headLabel, a.headLabelWidth, a.headLabelHeight),
+  };
+}
+
+/**
+ * A label CENTRE as the jar reads it: `SvekEdge#getXY` (`:808-815`) takes the
+ * min of the table's `BGCOLOR` polygon, which graphviz draws as the whole
+ * `w x h` box centred on the label position (`lib/common/htmltable.c:519-554`
+ * `emit_html_tbl`, `gvrender_box`). Re-expressed as a centre so every
+ * consumer's own centre-to-corner step lands on the parsed corner. A label
+ * with no table (plain-text `label=`) is not what Svek emits, so it only
+ * changes frame.
+ */
+function svekLabel(frame: SvekFrame, p: Pt | undefined, table: LabelTable): Pt | undefined {
+  if (p === undefined || table === undefined) return flipExact(frame, p);
+  const [w, h] = table;
+  return { x: svgDouble(p.x - w / 2) + w / 2, y: svekY(frame, p.y + h / 2) + h / 2 };
+}
+
+/**
+ * An edge snapshot as `SvekEdge#solveLine` reads it: the `d=` path
+ * (`SvekEdge.java:627-637`), the arrowhead polygons
+ * (`getPointsWithThisColor`, `:687`) and each label table's corner
+ * (`getXY`, `:741-768`), all parsed.
+ */
+export function svekEdge(
+  frame: SvekFrame,
+  e: LayoutSnapshot['edges'][number],
+  tables: EdgeLabelTables,
+): LayoutSnapshot['edges'][number] {
+  const out: LayoutSnapshot['edges'][number] = {
+    tail: e.tail,
+    head: e.head,
+    points: e.points.map((p) => svekPoint(frame, p)),
+  };
+  if (e.sp !== undefined) out.sp = svekPoint(frame, e.sp);
+  if (e.ep !== undefined) out.ep = svekPoint(frame, e.ep);
+  const label = svekLabel(frame, e.label, tables.label);
+  if (label !== undefined) out.label = label;
+  const xlabel = svekLabel(frame, e.xlabel, tables.xlabel);
+  if (xlabel !== undefined) out.xlabel = xlabel;
+  const tailLabel = svekLabel(frame, e.tailLabel, tables.tailLabel);
+  if (tailLabel !== undefined) out.tailLabel = tailLabel;
+  const headLabel = svekLabel(frame, e.headLabel, tables.headLabel);
+  if (headLabel !== undefined) out.headLabel = headLabel;
+  return out;
+}
+
+/**
+ * A cluster box as `DotStringFactory#solve` reads it (`:429-436`): min and max
+ * of its parsed polygon, returned in the top-left/`width`/`height` shape of
+ * the `yAxis:'down'` snapshot.
+ */
+export function svekCluster(
+  frame: SvekFrame,
+  c: LayoutSnapshot['clusters'][number],
+): LayoutSnapshot['clusters'][number] {
+  const x1 = svgDouble(c.x);
+  const x2 = svgDouble(c.x + c.width);
+  const top = svekY(frame, c.y + c.height);
+  const bottom = svekY(frame, c.y);
+  const out: LayoutSnapshot['clusters'][number] = { name: c.name, x: x1, y: top, width: x2 - x1, height: bottom - top };
+  if (c.label !== undefined) out.label = { ...c.label, y: frame.fullHeight - c.label.y };
+  return out;
+}
diff --git a/src/core/graph-layout.ts b/src/core/graph-layout.ts
index d25361016..6501ed675 100644
--- a/src/core/graph-layout.ts
+++ b/src/core/graph-layout.ts
@@ -26,7 +26,7 @@ import {
 // itself cannot import the class-local copy (`core/` -> `diagrams/class/`
 // is the wrong layering direction; the reverse, done here, is not).
 export { CARDINALITY_FONT_SIZE } from './graph-layout-build.js';
-import type { DotInputEdge, DotInputGraph, DotInputNode, DotLayoutResult } from './graph-layout.types.js';
+import type { DotInputEdge, DotInputGraph, DotLayoutResult } from './graph-layout.types.js';
 
 // Imported for its side effect: pins @knowvah/dot-engine's text measurer.
 // A5/T7: this file used to install `new LutTextMeasurer()` itself. That was a
@@ -38,6 +38,8 @@ import type { DotInputEdge, DotInputGraph, DotInputNode, DotLayoutResult } from
 // There is now exactly one install point.
 import './dot-engine-measurer.js';
 import { withSameContainerConstraints } from './graph-layout-build-constraint.js';
+import { edgeLabelTables, svekCluster, svekEdge, svekFrame, type SvekFrame } from './graph-layout-svek-read.js';
+import { cornerSize, portNodeSize, shieldCorner, svekCornerOf } from './graph-layout-node-corner.js';
 
 /** Right/bottom canvas padding, matching the in-house engine's old extractResult. */
 const CANVAS_MARGIN = 12;
@@ -77,153 +79,7 @@ export function setLayoutInputObserver(fn: ((input: DotInputGraph) => void) | un
  *  back, and anything further out is the engine's own. */
 const ROUND_TRIP_EPSILON = 1e-3;
 
-/**
- * G9/T9: a PORT node occupies its own symbol, not the box graphviz laid out.
- *
- * `SvekNode#appendLabelHtmlSpecialForPort` emits an entry/exit point as a
- * `shape=plaintext` HTML table whenever its label is wider than 40px, so
- * graphviz sizes the NODE from that table and its `PAD`ded minimum — 54x36 for
- * `jucori-40-cevo136`'s `Aentry1`, against the 12x12 symbol drawn there. That
- * bigger box is CORRECT for layout (it is what spaces the ranks), and jar
- * keeps it: `dot -Tplain` puts that fixture's two pin centres 145px apart,
- * exactly the frame height jar draws.
- *
- * Jar reconciles the two when it reads the layout back. `DotStringFactory
- * #solve:382-389` takes a `RECTANGLE_PORT`/`RECTANGLE_HTML_FOR_PORTS` node's
- * position from the `points="…"` polygon beside its `<title>` in graphviz's
- * own SVG — which is the PORT CELL's polygon, not the outer table's — and
- * graphviz centres that cell in the padded table. So the reported box is the
- * caller's declared symbol size, on the engine's own centre.
- *
- * This is the seam `solve` occupies, so every consumer sees the corrected box:
- * before it moved here the state engine drew a 12x12 pin from a 12x12 layout
- * node (right drawing, ranks 12px too close) and the description engine drew a
- * 54x36 rect where jar draws 12x12.
- *
- * The `RECTANGLE_HTML_FOR_PORTS` half of that same `solve` branch — a class or
- * object leaf whose members carry link ports, `portRows` here — needs the very
- * same correction for the very same reason. `addRowPortNode` hands graphviz an
- * HTML row table with no `width`/`height`/`fixedsize`, exactly as
- * `SvekNode#appendLabelHtmlSpecialForLink` does, and `poly_init` pads it by
- * `PAD` (`4*GAP` wide, `2*GAP` tall — graphviz `common/shapes.c:1993-2009`,
- * `common/const.h:251`). That padding is what spaces the ranks, and jar wants
- * it; jar simply never reads it back as the classifier's box.
- *
- * Measured on `kidugi-68-noje040`: `BigLibrary`'s declared 251.6625x76 came
- * back as the padded 267x84 — +15.3375 and +8.0, i.e. `PAD` to the pixel — so
- * the class drew 16px too wide with an empty methods compartment twice its
- * height, and its whole interior sat 4px high on jar's (same centre, taller
- * box). Its two neighbours were 8px off in x for the same reason.
- */
-function portNodeSize(d: DotInputNode | undefined, engine: number, declared: number): number {
-  if (d === undefined) return engine;
-  // cdd-T15: `shieldMargins` is the third HTML-sized shape -- jar declares
-  // the qualified end's shield table with no `width`/`height` either, and
-  // reads the centre `PORT="h"` cell's own polygon back as the classifier's
-  // box (`DotStringFactory#solve` takes the FIRST `points=` after the node
-  // title, which is that cell's BGCOLOR polygon).
-  const htmlSized =
-    (d.isPort === true && d.shape === 'plaintext') || d.portRows !== undefined || d.shieldMargins !== undefined;
-  return htmlSized ? declared : engine;
-}
-
-/**
- * graphviz's `doInt` on an HTML-label `WIDTH=`/`HEIGHT=` attribute: `strtol`
- * stops at the decimal point, so `"72.995"` sizes a 72pt cell
- * (`lib/common/htmllex.c:374-382 widthfn`, `:364-372 heightfn`, both via
- * `doInt`'s `strtol(v, &ep, 10)` at `:203`). Every value reaching here is
- * non-negative, where `Math.trunc` IS `strtol`'s truncation.
- *
- * @see ~/git/graphviz/lib/common/htmllex.c:199-215
- */
-function htmlCellSize(v: number): number {
-  return Math.trunc(v);
-}
-
-/**
- * cdd-T15 (D6), corrected cdd2-T11 (Q-3): the top-left corner OFFSET from
- * graphviz's node centre for a `shieldMargins` node.
- *
- * Jar never derives this corner: `DotStringFactory#solve`
- * (`svek/DotStringFactory.java:390-396`) takes the FIRST `points=` after the
- * node's `<title>` -- the `PORT="h"` BGCOLOR cell of the 3x3 table
- * `SvekNode#appendLabelHtml` writes (`svek/SvekNode.java:245-267`) -- and
- * `getMinXY` of it is the classifier's corner. So the corner is where graphviz
- * PUT that cell, which is integer arithmetic, not the declared fractions:
- *
- * - each `FIXEDSIZE` cell is its truncated `WIDTH`/`HEIGHT` ({@link
- *   htmlCellSize}; `size_html_cell`, `htmltable.c:1136-1150`, with
- *   `CELLPADDING=0`/`CELLBORDER=0` adding no margin), an empty `<TD>` is 0;
- * - a column/row is its widest/tallest cell -- the centre column also holds
- *   the `WIDTH="1"` spacer cells and the centre row the `HEIGHT="1"` ones;
- * - the integer table is centred on the node, `-W/2 .. W/2`
- *   (`make_html_label`, `htmltable.c:1914-1917`), and the h cell starts one
- *   column / one row in.
- *
- * Measured on `baneru-00-kuro607`'s `svek-1.dot` under real `dot -Tsvg`: the
- * `WIDTH="72.995"` cell is the polygon `8,-176..80,-128` -- 72 wide on the
- * node centre 44 -- where the old `centre - declared/2` put it at 7.5025, so
- * the diagram-wide origin shift moved every OTHER node and edge +0.4975px.
- * Graphviz centres the whole table in the `PAD`ded node box, so `PAD` still
- * cancels out.
- */
-function shieldCorner(d: DotInputNode | undefined, width: number, height: number): [number, number] {
-  const m = d?.shieldMargins;
-  if (m === undefined) return [0, 0];
-  const x1 = htmlCellSize(m.x1);
-  const y1 = htmlCellSize(m.y1);
-  const tableW = x1 + Math.max(1, htmlCellSize(width)) + htmlCellSize(m.x2);
-  const tableH = y1 + Math.max(1, htmlCellSize(height)) + htmlCellSize(m.y2);
-  return [x1 - tableW / 2, y1 - tableH / 2];
-}
-
-/**
- * The box HALVED to derive a node's CORNER from graphviz's centre — separate
- * from `width`/`height` (what gets DRAWN) because the two diverge for
- * exactly one shape: a `portRows` row-table classifier's declared cell
- * `WIDTH=`/`HEIGHT=` values carry sub-point fractions (this port's own text
- * measurement), and real graphviz's HTML-table layout floors each to a
- * whole point before it ever fixes a centre — `addRowPortNode` (`graph-
- * layout-build.ts`) hands it those fractional `FIXEDSIZE` cells verbatim,
- * with no `fixedsize`/`width`/`height` on the outer node for graphviz to
- * echo back untouched. Jar reads that FLOORED box's own left edge off
- * graphviz's rendered SVG (`DotStringFactory#solve`) and draws its own
- * (fractional) width FROM that edge; it does not re-centre. So the corner
- * this port computes must floor too, or it draws centred on the fraction
- * graphviz never kept.
- *
- * Verified directly against real graphviz 15.1.1 `-Tsvg` (not dot-engine)
- * on two cached oracle DOTs, disambiguating floor from round-to-nearest:
- * `garizu-98-nixo496`'s `sh0006` (`WIDTH="220.51250000000005"`, fraction
- * .5125 — ROUNDS to 221, but the rendered polygon is exactly 220 wide,
- * `Math.floor`) and `kidugi-68-noje040`'s `sh0006` (`WIDTH=
- * "251.66250000000008"`, HEIGHT sums to 76) — polygon `8,-4` to `259,-80`,
- * i.e. 251x76 exactly, `Math.floor` on both axes and NO extra padding (the
- * `portNodeSize` doc comment's own +15.3375/+8.0 pad measurement above this
- * function was against `@knowvah/dot-engine`, not real graphviz, for this
- * SAME fixture — that divergence is real but orthogonal: it explains why
- * `portNodeSize` must override the engine's raw width for DRAWING, not
- * where the CENTRE the pad is applied around sits, which real graphviz's
- * own floored-not-padded box confirms is unaffected either way).
- *
- * Scoped to `portRows` only, matching the measured evidence
- * (`.agent-notes/class-html-node-corner-vs-quantized-width.md`: "both are
- * member-port diagrams… the other nine have no ports and take the engine
- * width"). The `isPort`-plaintext port SYMBOL (G9/T9, one function up) keeps
- * centring on its own small declared size inside graphviz's larger box —
- * jar reads THAT case from the port CELL's own polygon, a different
- * mechanism this fix does not touch.
- *
- * @see ~/git/graphviz/lib/common/htmllex.c, lib/common/htmltable.c (HTML
- *      table cell sizing — the floor happens inside graphviz's own table
- *      layout, before `poly_init` ever sees a size)
- */
-function cornerSize(d: DotInputNode | undefined, width: number, height: number): [number, number] {
-  if (d?.portRows === undefined) return [width, height];
-  return [Math.floor(width), Math.floor(height)];
-}
-
-function mapNodes(snap: LayoutSnapshot, input: DotInputGraph): OutNodes {
+function mapNodes(snap: LayoutSnapshot, input: DotInputGraph, frame: SvekFrame | undefined): OutNodes {
   const declared = new Map(input.nodes.map((n) => [n.id, n]));
   return snap.nodes.map((n) => {
     const d = declared.get(n.name);
@@ -232,6 +88,10 @@ function mapNodes(snap: LayoutSnapshot, input: DotInputGraph): OutNodes {
     const width = portNodeSize(d, echo(d?.width, n.width), d?.width ?? n.width);
     const height = portNodeSize(d, echo(d?.height, n.height), d?.height ?? n.height);
     const [cornerW, cornerH] = cornerSize(d, width, height);
+    if (frame !== undefined) {
+      const [x, y] = svekCornerOf(frame, n, d, width, height);
+      return { id: n.name, x, y, width, height };
+    }
     const [shieldDx, shieldDy] = shieldCorner(d, width, height);
     if (d?.shieldMargins !== undefined) {
       return { id: n.name, x: n.x + shieldDx, y: n.y + shieldDy, width, height };
@@ -299,13 +159,14 @@ function toEdgeEntry(ge: LayoutSnapshot['edges'][number], id: string, inp: DotIn
   return entry;
 }
 
-function mapEdges(snap: LayoutSnapshot, idx: EdgeIndex): OutEdges {
+function mapEdges(snap: LayoutSnapshot, idx: EdgeIndex, frame: SvekFrame | undefined): OutEdges {
   const edges: OutEdges = [];
   for (const ge of snap.edges) {
     const q = idx.idQueues.get(edgeKey(ge.tail, ge.head));
     const id = q !== undefined && q.length > 0 ? q.shift() : undefined;
     if (id === undefined) continue;
-    edges.push(toEdgeEntry(ge, id, idx.inputEdgeById.get(id)));
+    const inp = idx.inputEdgeById.get(id);
+    edges.push(toEdgeEntry(frame === undefined ? ge : svekEdge(frame, ge, edgeLabelTables(inp)), id, inp));
   }
   return edges;
 }
@@ -441,7 +302,7 @@ function canvasSize(nodes: OutNodes, edges: OutEdges): { width: number; height:
  *                BFS-depth engine-selection heuristic was intentionally dropped
  *                (burn decision D2).
  */
-export function layoutGraph(input: DotInputGraph, opts?: { engine?: string }): DotLayoutResult {
+export function layoutGraph(input: DotInputGraph, opts?: { engine?: string; read?: 'svek' | 'exact' }): DotLayoutResult {
   // BEFORE the observer, deliberately: the oracle DOT-parity harness captures
   // its comparison subject here, and it must see the same graph the engine
   // does. Marking after this point would emit a faithful DOT from a graph the
@@ -467,10 +328,18 @@ export function layoutGraph(input: DotInputGraph, opts?: { engine?: string }): D
   // directly now, so that whole read-the-output-as-text path is gone --
   // filed as docs/graphviz-issues/13, landed in 1.3.0.
   render(b.graph, 'svg', { engine });
-  const snap = getLayout(b.graph, { yAxis: 'down' });
+  // cdd3-T-D3: Svek parses graphviz's 2-dp SVG text (`graph-layout-svek-
+  // read.ts`); `read: 'exact'` is for callers whose jar path is Smetana.
+  const svek = (opts?.read ?? 'svek') === 'svek';
+  const raw = getLayout(b.graph, { yAxis: svek ? 'up' : 'down' });
+  const frame = svek ? svekFrame(raw.bounds.height) : undefined;
+  const snap =
+    frame === undefined
+      ? raw
+      : { ...raw, clusters: raw.clusters.map((c) => svekCluster(frame, c)) };
 
-  const nodes = mapNodes(snap, input);
-  const edges = mapEdges(snap, idx);
+  const nodes = mapNodes(snap, input, frame);
+  const edges = mapEdges(snap, idx, frame);
   const clusters = mapClusters(snap, clusterIdx);
   shiftToOrigin(nodes, edges, clusters);
   const { width, height } = canvasSize(nodes, edges);
diff --git a/src/diagrams/json/layout.ts b/src/diagrams/json/layout.ts
index 73b61094e..b6d509633 100644
--- a/src/diagrams/json/layout.ts
+++ b/src/diagrams/json/layout.ts
@@ -435,7 +435,7 @@ export function layoutJson(ast: JsonDiagramAST, theme: Theme, measurer: StringMe
     omitSepAttrs: true,
   };
 
-  const dotResult = dotLayout(dotInput);
+  const dotResult = dotLayout(dotInput, { read: 'exact' });
 
   // Transpose the solved layout back into diagram space before anything reads
   // a coordinate off it.
diff --git a/tests/unit/class/class-edge-geo.test.ts b/tests/unit/class/class-edge-geo.test.ts
index e94677284..77eb55f15 100644
--- a/tests/unit/class/class-edge-geo.test.ts
+++ b/tests/unit/class/class-edge-geo.test.ts
@@ -184,12 +184,13 @@ describe('cdd-T16 — a grouped-inheritance link is suppressed to a bare solid p
     const a3children = lazeju.edges.filter((e) => e.to === 'A3');
     for (const e of a3children) {
       expect(e.sametail?.parentId).toBe('A3');
-      expect(e.sametail?.contact).toEqual({ x: 370.575, y: 76 });
+      // cdd3-T-D3: jar draws x2="370.58" (the 2-dp `-Tsvg` read).
+      expect(e.sametail?.contact).toEqual({ x: 370.58, y: 76 });
     }
     const a4children = lazeju.edges.filter((e) => e.to === 'A4');
     for (const e of a4children) {
       expect(e.sametail?.parentId).toBe('A4');
-      expect(e.sametail?.contact).toEqual({ x: 667.575, y: 76 });
+      expect(e.sametail?.contact).toEqual({ x: 667.58, y: 76 });
     }
   });
 
diff --git a/tests/unit/class/class-geo-builders.test.ts b/tests/unit/class/class-geo-builders.test.ts
index 847bcc690..4e8b013d7 100644
--- a/tests/unit/class/class-geo-builders.test.ts
+++ b/tests/unit/class/class-geo-builders.test.ts
@@ -427,11 +427,12 @@ describe('buildEdgeGeos — magic-arrow edge label (G2 item 44)', () => {
     };
     const geo = layoutClass(ast, defaultTheme, new DeterministicMeasurer());
     const edge = geo.edges[0]!;
-    expect(edge.label).toEqual({ text: 'besetzt', x: 41.68125, y: 96.11112311111113, width: 41.84375 });
+    // cdd3-T-D3: label corner read at graphviz's 2-dp `-Tsvg` precision.
+    expect(edge.label).toEqual({ text: 'besetzt', x: 41.68, y: 96.11111111111111, width: 41.84375 });
     expect(edge.arrowGlyph!.points).toEqual([
-      { x: 32.68125, y: 87.50001200000001 },
-      { x: 29.742323738537632, y: 96.54509697187476 },
-      { x: 35.62017626146236, y: 96.54509697187476 },
+      { x: 32.68, y: 87.5 },
+      { x: 29.741073738537633, y: 96.54508497187473 },
+      { x: 35.61892626146236, y: 96.54508497187474 },
     ]);
   });
 
@@ -564,11 +565,11 @@ describe('buildEdgeGeos — per-line guide-line glyphs (SI25 D1/D3/D4)', () => {
   it('gobuco: glyph + text origin floors maxWidth, no margin term (M8, pinned)', () => {
     const geo = layoutClass(astFor(GOBUCO), defaultTheme, measurer);
     const lines = geo.edges[0]!.labelLines!;
-    expect(lines[0]!.x).toBeCloseTo(41.68125, 6);
+    expect(lines[0]!.x).toBeCloseTo(41.68, 6); // cdd3-T-D3 2-dp label read
     expect(lines[0]!.glyph!.points).toEqual([
-      { x: 33.68125, y: 97.500012 },
-      { x: 36.62017626146236, y: 88.45492702812527 },
-      { x: 30.742323738537632, y: 88.45492702812527 },
+      { x: 33.68, y: 97.5 },
+      { x: 36.61892626146236, y: 88.45491502812527 },
+      { x: 30.741073738537633, y: 88.45491502812527 },
     ]);
   });
 
@@ -581,9 +582,10 @@ describe('buildEdgeGeos — per-line guide-line glyphs (SI25 D1/D3/D4)', () => {
     // (`sacacu-34-dobo091` jar-verified) -- see that function's own doc
     // comment.
     expect(lines.map((l) => [l.text, l.x, l.y, l.width])).toEqual([
-      ['this is', 42.046875, 96.11112311111111, 29.65625],
-      ['on several', 28.68125, 109.11112311111111, 56.387499999999996],
-      ['lines', 43.46875, 122.11112311111111, 26.8125],
+      // cdd3-T-D3: the label table corner is now the 2-dp `-Tsvg` read.
+      ['this is', 42.045625, 96.11111111111111, 29.65625],
+      ['on several', 28.68, 109.11111111111111, 56.387499999999996],
+      ['lines', 43.4675, 122.11111111111111, 26.8125],
     ]);
   });
 
@@ -595,16 +597,17 @@ describe('buildEdgeGeos — per-line guide-line glyphs (SI25 D1/D3/D4)', () => {
     // UNCHANGED by cdd-T37 -- `portLabelAnchor`'s own `Math.trunc(width)/2`
     // hybrid already reconciles it against jar (see that task's fix doc
     // comment on `attachMagicArrow`, `class-edge-label-attach.ts`).
-    expect(edge.label).toEqual({ text: 'ok', x: 41.68125, y: 96.11112311111113, width: 13.73125 });
+    // cdd3-T-D3: label corner read at graphviz's 2-dp `-Tsvg` precision.
+    expect(edge.label).toEqual({ text: 'ok', x: 41.68, y: 96.11111111111111, width: 13.73125 });
     // cdd-T37 (M8): the GLYPH origin moved -- jar's real oracle
     // (`lojepe-37-liri985`) confirms these are the byte-exact values
     // (`plans/class-divergence-drive/decision-journal.md` rows 225+):
     // `center.x - Math.floor(arrowFontSize + textWidth) / 2`, not the
     // pre-T37 un-floored `center.x - (arrowFontSize + textWidth) / 2`.
     expect(edge.arrowGlyph!.points).toEqual([
-      { x: 32.68125, y: 97.50001200000001 },
-      { x: 35.62017626146236, y: 88.45492702812527 },
-      { x: 29.742323738537632, y: 88.45492702812527 },
+      { x: 32.68, y: 97.5 },
+      { x: 35.61892626146236, y: 88.45491502812527 },
+      { x: 29.741073738537633, y: 88.45491502812527 },
     ]);
   });
 
diff --git a/tests/unit/class/class-layout-scale-resolve.test.ts b/tests/unit/class/class-layout-scale-resolve.test.ts
index 09ae06847..65ba23cc3 100644
--- a/tests/unit/class/class-layout-scale-resolve.test.ts
+++ b/tests/unit/class/class-layout-scale-resolve.test.ts
@@ -39,12 +39,10 @@ describe('C-10 — scale max N width/height, scale N width (fractional pre-dim b
 
   it('kujiji-68-cujo036 (`scale 900 width`): font-size 9.874, jar pre width=1276.14375 (D3 residual: font rounds from 9.8735)', () => {
     const svg = renderSync(fixtureSource('kujiji-68-cujo036'), { measurer });
-    // D3 (C-13): the jar itself rounds this boundary value to 9.874; our
-    // fractional-basis k lands one 2-dp tick below at 9.873 (owned by the
-    // D3 layout-precision task, NOT this mechanism) -- asserted here so a
-    // future D3 fix's regression shows up as a CHANGE to this line, not a
-    // silent pass.
-    expect(fontSizes(svg)).toEqual(Array(11).fill('9.873'));
+    // D3 (C-13): the jar itself rounds this boundary value to 9.874; with
+    // the layout read at graphviz's 2-dp `-Tsvg` precision (cdd3-T-D3,
+    // DotStringFactory.java:388-396) our k lands on it too.
+    expect(fontSizes(svg)).toEqual(Array(11).fill('9.874'));
     expect(svg).toContain('viewBox="0 0 900 145"');
   });
 });
diff --git a/tests/unit/class/class-newpage-layout.test.ts b/tests/unit/class/class-newpage-layout.test.ts
index b5770a004..2d9894f99 100644
--- a/tests/unit/class/class-newpage-layout.test.ts
+++ b/tests/unit/class/class-newpage-layout.test.ts
@@ -160,6 +160,9 @@ describe('layoutClass / renderClass -- single page unaffected by T7', () => {
     // comment/assertion mismatch this fix now closes. Re-verified against
     // a fresh live jar run of this exact source: root cause + jar evidence
     // in `plans/g2-class-svg/ledger.md` N29.
+    // cdd3-T-D3: the spline is now read at graphviz's 2-dp `-Tsvg`
+    // precision (DotStringFactory.java:388-396), so it IS the jar's
+    // 109.79/114.79 quoted above, not 109.792.
     expect(svg).toBe(
       '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" data-diagram-type="CLASS" style="width:78px;height:178px;background:#FFFFFF;" width="78px" height="178px" viewBox="0 0 78 178" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css">' +
         '<?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing">' +
@@ -180,8 +183,8 @@ describe('layoutClass / renderClass -- single page unaffected by T7', () => {
         '<line x1="8" y1="155" x2="62" y2="155" stroke="#181818" stroke-width="0.5"/>' +
         '</g>' +
         '<!--link Foo to Bar--><g class="link" data-entity-1="ent0001" data-entity-2="ent0002" id="lnk3" data-link-type="dependency">' +
-        '<path d="M35,55.262 C35,72.936 35,92.132 35,109.792" fill="none" stroke="#181818" stroke-width="1" id="Foo-to-Bar" codeLine="3"/>' +
-        '<polygon points="35,114.792,39,105.792,35,109.792,31,105.792,35,114.792" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>' +
+        '<path d="M35,55.26 C35,72.94 35,92.13 35,109.79" fill="none" stroke="#181818" stroke-width="1" id="Foo-to-Bar" codeLine="3"/>' +
+        '<polygon points="35,114.79,39,105.79,35,109.79,31,105.79,35,114.79" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>' +
         '</g>' +
         '</g></svg>',
     );
diff --git a/tests/unit/class/renderer-group.test.ts b/tests/unit/class/renderer-group.test.ts
index 09a4b83a9..89636631d 100644
--- a/tests/unit/class/renderer-group.test.ts
+++ b/tests/unit/class/renderer-group.test.ts
@@ -121,8 +121,9 @@ describe('cdd-T16 — lazeju-60-boki114 full pipeline', () => {
     const a4Parts = renderGroupInheritanceNeighborhood(a4, geo.edges, defaultTheme);
     expect(a3Parts.length).toBe(2);
     expect(a4Parts.length).toBe(2);
-    expect(a3Parts[1]).toContain('x2="370.575"');
-    expect(a4Parts[1]).toContain('x2="667.575"');
+    // cdd3-T-D3: the jar's own lazeju SVG draws x2="370.58".
+    expect(a3Parts[1]).toContain('x2="370.58"');
+    expect(a4Parts[1]).toContain('x2="667.58"');
   });
 
   it('renders every one of A3`s/A4`s 7 grouped links as a bare solid path, no polygon, in its own <g class="link">', () => {
diff --git a/tests/unit/core/graph-layout-svek-read.test.ts b/tests/unit/core/graph-layout-svek-read.test.ts
new file mode 100644
index 000000000..a72ea62b1
--- /dev/null
+++ b/tests/unit/core/graph-layout-svek-read.test.ts
@@ -0,0 +1,150 @@
+import { describe, it, expect } from 'vitest';
+import {
+  edgeLabelTables,
+  svekCluster,
+  svekEdge,
+  svekFrame,
+  svekNodeCorner,
+  svekPoint,
+  svekY,
+  svgDouble,
+} from '../../../src/core/graph-layout-svek-read.js';
+
+// cdd3-T-D3: the jar reads graphviz's `-Tsvg` text, not doubles
+// (svek/DotStringFactory.java:388-396, graphviz lib/gvc/gvdevice.c:513-528).
+const FRAME = { fullHeight: 108 };
+
+describe('svgDouble — gvprintdouble %.02f as Double.parseDouble reads it', () => {
+  it('rounds the exact binary value, not the decimal literal', () => {
+    // the double nearest 155.425 is 155.42500000000001136..., printf gives 155.43
+    expect(svgDouble(155.425)).toBe(155.43);
+    // gatula: the corner graphviz draws sits a round-trip hair below the tie
+    expect(svgDouble(155.42499)).toBe(155.42);
+  });
+
+  it('rounds an exact binary tie half to even, as snprintf does', () => {
+    expect(svgDouble(0.125)).toBe(0.12);
+    expect(svgDouble(0.375)).toBe(0.38);
+    expect(svgDouble(2.625)).toBe(2.62);
+    expect(svgDouble(-0.125)).toBe(-0.12);
+    expect(svgDouble(-2.875)).toBe(-2.88);
+  });
+
+  it('prints |v| < 0.005 as 0, never -0 (gvdevice.c:516)', () => {
+    expect(Object.is(svgDouble(-0.004), 0)).toBe(true);
+    expect(svgDouble(0.0049)).toBe(0);
+  });
+
+  it('keeps two decimals of an ordinary coordinate', () => {
+    expect(svgDouble(-107.7449)).toBe(-107.74);
+    expect(svgDouble(30.351)).toBe(30.35);
+    expect(svgDouble(12)).toBe(12);
+  });
+});
+
+describe('svekFrame — <svg height="%dpt"> = ROUND(bbHeight + 2*pad)', () => {
+  it('adds DEFAULT_GRAPH_PAD 4 each side and rounds half up (emit.c:1249-1250)', () => {
+    expect(svekFrame(100.3).fullHeight).toBe(108);
+    expect(svekFrame(100.5).fullHeight).toBe(109);
+  });
+});
+
+describe('svekY / svekPoint — YDelta(fullHeight) over the parsed -y', () => {
+  it('parses -y at 2 dp, then adds fullHeight', () => {
+    expect(svekY(FRAME, 20.004)).toBe(88);
+    expect(svekPoint(FRAME, { x: 24.898, y: 107.744 })).toEqual({ x: 24.9, y: 108 - 107.74 });
+  });
+});
+
+describe('svekNodeCorner — DotStringFactory#solve node branches', () => {
+  it('takes a polygon node corner as the parsed min vertex (:390-396)', () => {
+    expect(svekNodeCorner(FRAME, { cx: 100, cy: 50, width: 89.15, height: 30, shape: undefined })).toEqual([
+      55.42,
+      108 - 65,
+    ]);
+  });
+
+  it('takes an ellipse node corner as parsed cx - rx, cy - ry (:419-424)', () => {
+    const [x, y] = svekNodeCorner(FRAME, { cx: 10.004, cy: 20.004, width: 22.006, height: 22.006, shape: 'circle' });
+    expect(x).toBe(10 - 11);
+    expect(y).toBe(88 - 11);
+  });
+});
+
+describe('svekCluster — min/max of the parsed cluster polygon (:429-436)', () => {
+  it('returns the parsed top-left and the parsed extent', () => {
+    const c = svekCluster(FRAME, { name: 'cluster1', x: 8.004, y: 10.006, width: 50.001, height: 40.003 });
+    expect(c.x).toBe(8);
+    expect(c.y).toBe(-50.01 + 108);
+    expect(c.width).toBeCloseTo(50, 12);
+    expect(c.height).toBeCloseTo(40, 12);
+  });
+
+  it('moves the cluster label into the YDelta frame unparsed', () => {
+    const c = svekCluster(FRAME, {
+      name: 'cluster1',
+      x: 0,
+      y: 0,
+      width: 1,
+      height: 1,
+      label: { x: 3.3333, y: 7.7777, width: 5, height: 6 },
+    });
+    expect(c.label).toEqual({ x: 3.3333, y: 108 - 7.7777, width: 5, height: 6 });
+  });
+});
+
+describe('edgeLabelTables — SvekEdge#appendTable (int) boxes (:504-521)', () => {
+  it('truncates each present label box and skips the rest', () => {
+    const t = edgeLabelTables({
+      id: 'e',
+      from: 'a',
+      to: 'b',
+      attributes: { tailLabel: '1', tailLabelWidth: 7.23125, tailLabelHeight: 13.9, headLabel: '*' },
+    });
+    expect(t).toEqual({ label: undefined, xlabel: undefined, tailLabel: [7, 13], headLabel: undefined });
+  });
+
+  it('is empty for an edge with no attributes', () => {
+    expect(edgeLabelTables(undefined)).toEqual({});
+  });
+});
+
+describe('svekEdge — SvekEdge#solveLine parsed values', () => {
+  const edge = {
+    tail: 'a',
+    head: 'b',
+    points: [{ x: 30.351, y: 107.744 }],
+    sp: { x: 1.004, y: 2.004 },
+    ep: { x: 3.006, y: 4.006 },
+    tailLabel: { x: 46.8973, y: 20.0 },
+    headLabel: { x: 5, y: 6 },
+    label: { x: 1, y: 2 },
+    xlabel: { x: 9, y: 9 },
+  };
+
+  it('parses path points and arrow points at 2 dp in the YDelta frame', () => {
+    const e = svekEdge(FRAME, edge, {});
+    expect(e.points).toEqual([{ x: 30.35, y: 108 - 107.74 }]);
+    expect(e.sp).toEqual({ x: 1, y: 106 });
+    expect(e.ep).toEqual({ x: 3.01, y: 108 - 4.01 });
+  });
+
+  it('parses a tabled label at its polygon corner and re-centres it (getXY :808-815)', () => {
+    const e = svekEdge(FRAME, edge, { tailLabel: [7, 13] });
+    // corner x: 46.8973 - 3.5 = 43.3973 -> 43.4; corner y: -(20 + 6.5) -> -26.5
+    expect(e.tailLabel?.x).toBeCloseTo(43.4 + 3.5, 12);
+    expect(e.tailLabel?.y).toBe(-26.5 + 108 + 6.5);
+  });
+
+  it('only changes frame for an untabled label', () => {
+    const e = svekEdge(FRAME, edge, {});
+    expect(e.headLabel).toEqual({ x: 5, y: 102 });
+    expect(e.label).toEqual({ x: 1, y: 106 });
+    expect(e.xlabel).toEqual({ x: 9, y: 99 });
+  });
+
+  it('omits what the snapshot omits', () => {
+    const e = svekEdge(FRAME, { tail: 'a', head: 'b', points: [] }, {});
+    expect(e).toEqual({ tail: 'a', head: 'b', points: [] });
+  });
+});
diff --git a/tests/unit/core/graph-layout.test.ts b/tests/unit/core/graph-layout.test.ts
index 77ee1ea07..dc2c8ccd6 100644
--- a/tests/unit/core/graph-layout.test.ts
+++ b/tests/unit/core/graph-layout.test.ts
@@ -700,12 +700,14 @@ describe('layoutGraph — shield corner reads the truncated h cell (cdd2-T11 Q-3
     rankDir: 'TB',
   });
 
-  it('puts the plain neighbour 0.1375px right of the shielded corner (jar 7.14 - 7)', () => {
+  it('puts the plain neighbour 0.14px right of the shielded corner (jar 7.14 - 7)', () => {
     const r = layoutGraph(shielded(0, 0));
     const a = r.nodes.find((n) => n.id === 'sh0006')!;
     const b = r.nodes.find((n) => n.id === 'sh0007')!;
-    // graphviz centre 44: cell 44 - 72/2 = 8; rect 44 - 71.725/2 = 8.1375.
-    expect(b.x - a.x).toBeCloseTo(0.1375, 6);
+    // graphviz centre 44: cell 44 - 72/2 = 8; rect 44 - 71.725/2 = 8.1375,
+    // which the jar parses off `-Tsvg` as 8.14 (cdd3-T-D3,
+    // DotStringFactory.java:388-396).
+    expect(b.x - a.x).toBeCloseTo(0.14, 6);
     expect(a.width).toBe(72.995);
   });
 
diff --git a/tests/unit/state/state-note-attached-dot.test.ts b/tests/unit/state/state-note-attached-dot.test.ts
index 6600ba2d6..cd9559aa6 100644
--- a/tests/unit/state/state-note-attached-dot.test.ts
+++ b/tests/unit/state/state-note-attached-dot.test.ts
@@ -150,15 +150,16 @@ describe('note ... on link (T4, state-declared-size-fix)', () => {
     // note` (findings/note.md#tumaba-64-tosu281): the fold-corner outline +
     // corner triangle (both fill #FEFFDD, stroke-width 0.5 -- symmetric,
     // unlike a freestanding note's asymmetric split) plus the LEFT-anchored
-    // body text, byte-exact against jar's own canonical SVG
+    // body text, byte-exact against jar's own canonical SVG (2-dp since
+    // cdd3-T-D3 read the layout at `-Tsvg` precision)
     // (test-results/visual-qa-svg/canonical/state/tumaba-64-tosu281.svg).
     expect(svg).toContain(
-      '<path d="M54.213,315 L54.213,338 L92.213,338 L92.213,325 L82.213,315 L54.213,315" fill="#FEFFDD" stroke="#181818" stroke-width="0.5"/>',
+      '<path d="M54.21,315 L54.21,338 L92.21,338 L92.21,325 L82.21,315 L54.21,315" fill="#FEFFDD" stroke="#181818" stroke-width="0.5"/>',
     );
     expect(svg).toContain(
-      '<path d="M82.213,315 L82.213,325 L92.213,325 L82.213,315" fill="#FEFFDD" stroke="#181818" stroke-width="0.5"/>',
+      '<path d="M82.21,315 L82.21,325 L92.21,325 L82.21,315" fill="#FEFFDD" stroke="#181818" stroke-width="0.5"/>',
     );
-    expect(svg).toContain('<text x="60.213" y="330.111" font-size="13" fill="#000" textLength="17.388">hi1</text>');
+    expect(svg).toContain('<text x="60.21" y="330.111" font-size="13" fill="#000" textLength="17.388">hi1</text>');
   });
 
   it("tumaba-64-tosu281: SubState (the composite host) reserves the note's real width", () => {
```

## Final report

**Decision: REJECT.** The 2-dp `-Tsvg` read closes 19 class fixtures and 6
in other engines and loses no conformant row anywhere, but `npm test` stays
red on two state DOT-parity size ratchets (nimana-36-veco708 0.053416 >
0.053277 in; nimise-04-jove070 0.053417 > 0.053278 in, both +0.01 px). That
is a jar-verified reveal: every inner relative position is now jar-exact,
and the constant 3.846 px left-ink gap that predates D3 no longer has the
0.01 px read noise partly cancelling it. Clearing it means re-pinning
`oracle/goldens/state/size-backlog.json`, which agents may not edit, so the
"no gate red" criterion fails. All src/ and test changes are reverted. The
complete candidate is the appendix patch, which applies cleanly on 47d21018.

- Class closed with the read (S/N before -> 0/0): bicabi 0/1, famizo 0/1,
  kicuna 0/114, konomi 0/1, kupetu 0/1, nixema 0/1, paluca 0/1, vebini 0/7,
  gatula 0/2, foxata 0/2, ledepo 0/2, tijira 0/2, zuramo 0/2, vegubu 0/1,
  puvono 0/1, sekame 0/1, guxode 0/2, kujiji 14/0, ziparo 0/21.
- Improved: givoli/tekena/nadepi 0/24 -> 0/23 (remaining edge = C-12 gvi
  24); gujigi 0/21 -> 0/20; delasa 3/10396 -> 3/10383.
- Unmoved: ririlu 0/48 (issue 19 + Kal, not precision), jakapi 0/352.
- Other engines: state +2 conformant (jelusa, lavera), unknown +4 (gaceme,
  gisuvu, judelo, ridofi); maxDelta-only movers of 0.01 px or less:
  component 64, usecase 17, state 28, unknown 56, object 2, sequence 2
  (misrouted to STATE/CLASS); json/yaml/hcl opted out with 0 movers; every
  non-DOT engine 0. dotEqual changed nowhere.
- absorbLayoutEpsilon: with D3 applied, an identity probe moves 0 rows in
  class and in all 27 engines.
- Survey duration: class 19.25 s -> 19.25 s, object 16.96 s -> 16.74 s.
- Gates on the candidate: typecheck, lint and build green; class/object DOT
  parity green; npm test has 2 failures (above). After the revert the tree
  equals 47d21018 except for this note.
