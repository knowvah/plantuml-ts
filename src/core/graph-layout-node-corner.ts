/**
 * A laid-out node's top-left corner — split from `graph-layout.ts` (file-size
 * cap) with no behaviour change: the HTML-sized node boxes (G9/T9, cdd-T15)
 * and, for the Svek read, the parsed corner (cdd3-T-D3).
 */
import type { LayoutSnapshot } from '@knowvah/dot-engine';
import type { DotInputNode } from './graph-layout.types.js';
import { svekNodeCorner, svekY, svgDouble, type SvekFrame } from './graph-layout-svek-read.js';

/**
 * G9/T9: a PORT node occupies its own symbol, not the box graphviz laid out.
 *
 * `SvekNode#appendLabelHtmlSpecialForPort` emits an entry/exit point as a
 * `shape=plaintext` HTML table whenever its label is wider than 40px, so
 * graphviz sizes the NODE from that table and its `PAD`ded minimum — 54x36 for
 * `jucori-40-cevo136`'s `Aentry1`, against the 12x12 symbol drawn there. That
 * bigger box is CORRECT for layout (it is what spaces the ranks), and jar
 * keeps it: `dot -Tplain` puts that fixture's two pin centres 145px apart,
 * exactly the frame height jar draws.
 *
 * Jar reconciles the two when it reads the layout back. `DotStringFactory
 * #solve:382-389` takes a `RECTANGLE_PORT`/`RECTANGLE_HTML_FOR_PORTS` node's
 * position from the `points="…"` polygon beside its `<title>` in graphviz's
 * own SVG — which is the PORT CELL's polygon, not the outer table's — and
 * graphviz centres that cell in the padded table. So the reported box is the
 * caller's declared symbol size, on the engine's own centre.
 *
 * This is the seam `solve` occupies, so every consumer sees the corrected box:
 * before it moved here the state engine drew a 12x12 pin from a 12x12 layout
 * node (right drawing, ranks 12px too close) and the description engine drew a
 * 54x36 rect where jar draws 12x12.
 *
 * The `RECTANGLE_HTML_FOR_PORTS` half of that same `solve` branch — a class or
 * object leaf whose members carry link ports, `portRows` here — needs the very
 * same correction for the very same reason. `addRowPortNode` hands graphviz an
 * HTML row table with no `width`/`height`/`fixedsize`, exactly as
 * `SvekNode#appendLabelHtmlSpecialForLink` does, and `poly_init` pads it by
 * `PAD` (`4*GAP` wide, `2*GAP` tall — graphviz `common/shapes.c:1993-2009`,
 * `common/const.h:251`). That padding is what spaces the ranks, and jar wants
 * it; jar simply never reads it back as the classifier's box.
 *
 * Measured on `kidugi-68-noje040`: `BigLibrary`'s declared 251.6625x76 came
 * back as the padded 267x84 — +15.3375 and +8.0, i.e. `PAD` to the pixel — so
 * the class drew 16px too wide with an empty methods compartment twice its
 * height, and its whole interior sat 4px high on jar's (same centre, taller
 * box). Its two neighbours were 8px off in x for the same reason.
 */
export function portNodeSize(d: DotInputNode | undefined, engine: number, declared: number): number {
  if (d === undefined) return engine;
  return isHtmlSized(d) ? declared : engine;
}

function isHtmlSized(d: DotInputNode): boolean {
  // cdd-T15: `shieldMargins` is the third HTML-sized shape -- jar declares
  // the qualified end's shield table with no `width`/`height` either, and
  // reads the centre `PORT="h"` cell's own polygon back as the classifier's
  // box (`DotStringFactory#solve` takes the FIRST `points=` after the node
  // title, which is that cell's BGCOLOR polygon).
  return (d.isPort === true && d.shape === 'plaintext') || d.portRows !== undefined || d.shieldMargins !== undefined;
}

/**
 * graphviz's `doInt` on an HTML-label `WIDTH=`/`HEIGHT=` attribute: `strtol`
 * stops at the decimal point, so `"72.995"` sizes a 72pt cell
 * (`lib/common/htmllex.c:374-382 widthfn`, `:364-372 heightfn`, both via
 * `doInt`'s `strtol(v, &ep, 10)` at `:203`). Every value reaching here is
 * non-negative, where `Math.trunc` IS `strtol`'s truncation.
 *
 * @see ~/git/graphviz/lib/common/htmllex.c:199-215
 */
function htmlCellSize(v: number): number {
  return Math.trunc(v);
}

/**
 * cdd-T15 (D6), corrected cdd2-T11 (Q-3): the top-left corner OFFSET from
 * graphviz's node centre for a `shieldMargins` node.
 *
 * Jar never derives this corner: `DotStringFactory#solve`
 * (`svek/DotStringFactory.java:390-396`) takes the FIRST `points=` after the
 * node's `<title>` -- the `PORT="h"` BGCOLOR cell of the 3x3 table
 * `SvekNode#appendLabelHtml` writes (`svek/SvekNode.java:245-267`) -- and
 * `getMinXY` of it is the classifier's corner. So the corner is where graphviz
 * PUT that cell, which is integer arithmetic, not the declared fractions:
 *
 * - each `FIXEDSIZE` cell is its truncated `WIDTH`/`HEIGHT` ({@link
 *   htmlCellSize}; `size_html_cell`, `htmltable.c:1136-1150`, with
 *   `CELLPADDING=0`/`CELLBORDER=0` adding no margin), an empty `<TD>` is 0;
 * - a column/row is its widest/tallest cell -- the centre column also holds
 *   the `WIDTH="1"` spacer cells and the centre row the `HEIGHT="1"` ones;
 * - the integer table is centred on the node, `-W/2 .. W/2`
 *   (`make_html_label`, `htmltable.c:1914-1917`), and the h cell starts one
 *   column / one row in.
 *
 * Measured on `baneru-00-kuro607`'s `svek-1.dot` under real `dot -Tsvg`: the
 * `WIDTH="72.995"` cell is the polygon `8,-176..80,-128` -- 72 wide on the
 * node centre 44 -- where the old `centre - declared/2` put it at 7.5025, so
 * the diagram-wide origin shift moved every OTHER node and edge +0.4975px.
 * Graphviz centres the whole table in the `PAD`ded node box, so `PAD` still
 * cancels out.
 */
export function shieldCorner(d: DotInputNode | undefined, width: number, height: number): [number, number] {
  const m = d?.shieldMargins;
  if (m === undefined) return [0, 0];
  const x1 = htmlCellSize(m.x1);
  const y1 = htmlCellSize(m.y1);
  const tableW = x1 + Math.max(1, htmlCellSize(width)) + htmlCellSize(m.x2);
  const tableH = y1 + Math.max(1, htmlCellSize(height)) + htmlCellSize(m.y2);
  return [x1 - tableW / 2, y1 - tableH / 2];
}

/**
 * The box HALVED to derive a node's CORNER from graphviz's centre — separate
 * from `width`/`height` (what gets DRAWN) because the two diverge for
 * exactly one shape: a `portRows` row-table classifier's declared cell
 * `WIDTH=`/`HEIGHT=` values carry sub-point fractions (this port's own text
 * measurement), and real graphviz's HTML-table layout floors each to a
 * whole point before it ever fixes a centre — `addRowPortNode` (`graph-
 * layout-build.ts`) hands it those fractional `FIXEDSIZE` cells verbatim,
 * with no `fixedsize`/`width`/`height` on the outer node for graphviz to
 * echo back untouched. Jar reads that FLOORED box's own left edge off
 * graphviz's rendered SVG (`DotStringFactory#solve`) and draws its own
 * (fractional) width FROM that edge; it does not re-centre. So the corner
 * this port computes must floor too, or it draws centred on the fraction
 * graphviz never kept.
 *
 * Verified directly against real graphviz 15.1.1 `-Tsvg` (not dot-engine)
 * on two cached oracle DOTs, disambiguating floor from round-to-nearest:
 * `garizu-98-nixo496`'s `sh0006` (`WIDTH="220.51250000000005"`, fraction
 * .5125 — ROUNDS to 221, but the rendered polygon is exactly 220 wide,
 * `Math.floor`) and `kidugi-68-noje040`'s `sh0006` (`WIDTH=
 * "251.66250000000008"`, HEIGHT sums to 76) — polygon `8,-4` to `259,-80`,
 * i.e. 251x76 exactly, `Math.floor` on both axes and NO extra padding (the
 * `portNodeSize` doc comment's own +15.3375/+8.0 pad measurement above this
 * function was against `@knowvah/dot-engine`, not real graphviz, for this
 * SAME fixture — that divergence is real but orthogonal: it explains why
 * `portNodeSize` must override the engine's raw width for DRAWING, not
 * where the CENTRE the pad is applied around sits, which real graphviz's
 * own floored-not-padded box confirms is unaffected either way).
 *
 * Scoped to `portRows` only, matching the measured evidence
 * (`.agent-notes/class-html-node-corner-vs-quantized-width.md`: "both are
 * member-port diagrams… the other nine have no ports and take the engine
 * width"). The `isPort`-plaintext port SYMBOL (G9/T9, one function up) keeps
 * centring on its own small declared size inside graphviz's larger box —
 * jar reads THAT case from the port CELL's own polygon, a different
 * mechanism this fix does not touch.
 *
 * @see ~/git/graphviz/lib/common/htmllex.c, lib/common/htmltable.c (HTML
 *      table cell sizing — the floor happens inside graphviz's own table
 *      layout, before `poly_init` ever sees a size)
 */
export function cornerSize(d: DotInputNode | undefined, width: number, height: number): [number, number] {
  if (d?.portRows === undefined) return [width, height];
  return [Math.floor(width), Math.floor(height)];
}

/**
 * cdd3-T-D3: the corner `DotStringFactory#solve` parses (see
 * `graph-layout-svek-read.ts`). An HTML-sized node keeps the cell box its
 * polygon is read from; every other node is the box graphviz drew — the
 * engine's own 6-decimal-inches size, not the declared one.
 */
export function svekCornerOf(
  frame: SvekFrame,
  n: LayoutSnapshot['nodes'][number],
  d: DotInputNode | undefined,
  width: number,
  height: number,
): [number, number] {
  if (d?.shieldMargins !== undefined) {
    const [dx, dy] = shieldCorner(d, width, height);
    return [svgDouble(n.x + dx), svekY(frame, n.y - dy)];
  }
  const [w, h] = d !== undefined && isHtmlSized(d) ? cornerSize(d, width, height) : [n.width, n.height];
  return svekNodeCorner(frame, { cx: n.x, cy: n.y, width: w, height: h, shape: d?.shape });
}
