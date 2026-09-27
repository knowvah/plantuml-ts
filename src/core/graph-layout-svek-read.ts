/**
 * cdd3-T-D3 (D3): read the layout the way the jar's Svek reads it.
 *
 * Upstream never sees graphviz's doubles. `DotStringFactory#solve`
 * (`svek/DotStringFactory.java:377-437`) runs `dot -Tsvg` and PARSES the text:
 * a boxed node's corner is `SvekUtils.getMinXY` of the polygon after its
 * `<title>` (`:390-396`), an ellipse node's is `cx - rx`, `cy - ry` (`:419-424`),
 * a cluster is the min/max of its polygon (`:429-436`), and every edge is its
 * path `d=` (`SvekEdge.java:618-637`). Each number is `Double.parseDouble` of
 * graphviz's `gvprintdouble`, i.e. `"%.02f"` with trailing zeros trimmed and
 * |v| < 0.005 printed `0` (`graphviz lib/gvc/gvdevice.c:513-528`), and every y
 * rides `YDelta(fullHeight)` (`DotStringFactory.java:385-387`, `YDelta.java`)
 * where `fullHeight` is the `<svg height="%dpt">` integer.
 *
 * SVG output sets `GVRENDER_DOES_TRANSFORM`, so the printed points are the raw
 * graph coordinates with y negated (`plugin/core/gvrender_core_svg.c:686-717`,
 * `svg_bezier`/`svg_polygon`), and the page is
 * `ROUND(bbHeight + 2*pad)` pt tall (`lib/common/emit.c:1249-1250`, `ROUND`
 * at `lib/util/arith.h:48`, `pad` = `DEFAULT_GRAPH_PAD` 4 at
 * `lib/common/const.h:96`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java
 */

import type { LayoutSnapshot } from '@knowvah/dot-engine';
import type { DotInputEdge } from './graph-layout.types.js';

/** `DEFAULT_GRAPH_PAD` — `graphviz lib/common/const.h:96`. */
const DEFAULT_GRAPH_PAD = 4;

/** `gvprintdouble`'s `-0` guard — `graphviz lib/gvc/gvdevice.c:516`. */
const PRINT_ZERO_BAND = 0.005;

/**
 * The double Java's `Double.parseDouble` recovers from graphviz's
 * `gvprintdouble(v)` (`lib/gvc/gvdevice.c:513-528`): `snprintf("%.02f")`,
 * which rounds the EXACT binary value, ties to even.
 *
 * `toFixed(2)` also rounds the exact value, but breaks an exact tie away from
 * zero. The only exact 2-dp ties a double can hold are odd multiples of 1/8
 * (`(2m+1)/200` is dyadic only when 25 divides `2m+1`), and for those `v*100`
 * is exact, so that case is rounded half-to-even directly.
 *
 * @see ~/git/graphviz/lib/gvc/gvdevice.c:513-528
 */
export function svgDouble(v: number): number {
  if (v > -PRINT_ZERO_BAND && v < PRINT_ZERO_BAND) return 0;
  if (Number.isInteger(v * 8) && !Number.isInteger(v * 4)) {
    const lo = Math.floor(v * 100);
    return (lo % 2 === 0 ? lo : lo + 1) / 100 + 0;
  }
  return Number(v.toFixed(2)) + 0;
}

/** graphviz `ROUND` — `lib/util/arith.h:48`. */
function cRound(f: number): number {
  return f >= 0 ? Math.trunc(f + 0.5) : Math.trunc(f - 0.5);
}

/** The `YDelta` translation the jar applies to every parsed y. */
export interface SvekFrame {
  readonly fullHeight: number;
}

/** `<svg height="%dpt">` for a graph whose bounding box is `bbHeight` tall. */
export function svekFrame(bbHeight: number): SvekFrame {
  return { fullHeight: cRound(bbHeight + 2 * DEFAULT_GRAPH_PAD) };
}

/** A native (y-up) graphviz y as the jar reads it: `parse(-y) + fullHeight`. */
export function svekY(frame: SvekFrame, yNative: number): number {
  return svgDouble(-yNative) + frame.fullHeight;
}

/** A native (y-up) graphviz point as the jar reads it off a `d=`/`points=`. */
export function svekPoint(frame: SvekFrame, p: { x: number; y: number }): { x: number; y: number } {
  return { x: svgDouble(p.x), y: svekY(frame, p.y) };
}

/** Shapes the jar reads through the ellipse branch (`CIRCLE`/`OVAL`,
 *  `DotStringFactory.java:419-424`); graphviz prints `point` as an ellipse too. */
const ELLIPSE_SHAPES: ReadonlySet<string> = new Set(['circle', 'ellipse', 'point']);

/** Native-frame node centre + the box the corner is taken from. */
export interface SvekNodeBox {
  readonly cx: number;
  readonly cy: number;
  readonly width: number;
  readonly height: number;
  readonly shape: string | undefined;
}

/**
 * A node's top-left corner as `DotStringFactory#solve` reads it: `cx - rx`,
 * `cy - ry` from the parsed ellipse attributes (`:419-424`), otherwise the min
 * of the parsed polygon (`:390-396`), whose left/top vertex sits half the box
 * off the centre.
 */
export function svekNodeCorner(frame: SvekFrame, b: SvekNodeBox): [number, number] {
  if (b.shape !== undefined && ELLIPSE_SHAPES.has(b.shape)) {
    return [svgDouble(b.cx) - svgDouble(b.width / 2), svekY(frame, b.cy) - svgDouble(b.height / 2)];
  }
  return [svgDouble(b.cx - b.width / 2), svekY(frame, b.cy + b.height / 2)];
}

type Pt = { x: number; y: number };

/** An unparsed native position moved into the jar's `YDelta` frame only. */
function flipExact(frame: SvekFrame, p: Pt | undefined): Pt | undefined {
  return p === undefined ? undefined : { x: p.x, y: frame.fullHeight - p.y };
}

/** The integer `FIXEDSIZE` table the jar hands graphviz for one edge label
 *  (`SvekEdge#appendTable`, `SvekEdge.java:504-521`: `(int)` casts). */
export type LabelTable = readonly [number, number] | undefined;

/** The four label tables of one edge, in snapshot field order. */
export interface EdgeLabelTables {
  readonly label?: LabelTable;
  readonly xlabel?: LabelTable;
  readonly tailLabel?: LabelTable;
  readonly headLabel?: LabelTable;
}

function table(text: string | undefined, w: number | undefined, h: number | undefined): LabelTable {
  return text === undefined || w === undefined || h === undefined ? undefined : [Math.trunc(w), Math.trunc(h)];
}

/** The tables `graph-layout-build-edges.ts#addEdges` hands the engine — the
 *  same presence rules and the same `(int)` truncation. */
export function edgeLabelTables(inp: DotInputEdge | undefined): EdgeLabelTables {
  const a = inp?.attributes;
  if (a === undefined) return {};
  return {
    label: table(a.label, a.labelBoxWidth, a.labelBoxHeight),
    xlabel: table(a.xlabel, a.xlabelWidth, a.xlabelHeight),
    tailLabel: table(a.tailLabel, a.tailLabelWidth, a.tailLabelHeight),
    headLabel: table(a.headLabel, a.headLabelWidth, a.headLabelHeight),
  };
}

/**
 * A label CENTRE as the jar reads it: `SvekEdge#getXY` (`:808-815`) takes the
 * min of the table's `BGCOLOR` polygon, which graphviz draws as the whole
 * `w x h` box centred on the label position (`lib/common/htmltable.c:519-554`
 * `emit_html_tbl`, `gvrender_box`). Re-expressed as a centre so every
 * consumer's own centre-to-corner step lands on the parsed corner. A label
 * with no table (plain-text `label=`) is not what Svek emits, so it only
 * changes frame.
 */
function svekLabel(frame: SvekFrame, p: Pt | undefined, table: LabelTable): Pt | undefined {
  if (p === undefined || table === undefined) return flipExact(frame, p);
  const [w, h] = table;
  return { x: svgDouble(p.x - w / 2) + w / 2, y: svekY(frame, p.y + h / 2) + h / 2 };
}

/**
 * An edge snapshot as `SvekEdge#solveLine` reads it: the `d=` path
 * (`SvekEdge.java:627-637`), the arrowhead polygons
 * (`getPointsWithThisColor`, `:687`) and each label table's corner
 * (`getXY`, `:741-768`), all parsed.
 */
export function svekEdge(
  frame: SvekFrame,
  e: LayoutSnapshot['edges'][number],
  tables: EdgeLabelTables,
): LayoutSnapshot['edges'][number] {
  const out: LayoutSnapshot['edges'][number] = {
    tail: e.tail,
    head: e.head,
    points: e.points.map((p) => svekPoint(frame, p)),
  };
  if (e.sp !== undefined) out.sp = svekPoint(frame, e.sp);
  if (e.ep !== undefined) out.ep = svekPoint(frame, e.ep);
  const label = svekLabel(frame, e.label, tables.label);
  if (label !== undefined) out.label = label;
  const xlabel = svekLabel(frame, e.xlabel, tables.xlabel);
  if (xlabel !== undefined) out.xlabel = xlabel;
  const tailLabel = svekLabel(frame, e.tailLabel, tables.tailLabel);
  if (tailLabel !== undefined) out.tailLabel = tailLabel;
  const headLabel = svekLabel(frame, e.headLabel, tables.headLabel);
  if (headLabel !== undefined) out.headLabel = headLabel;
  return out;
}

/**
 * A cluster box as `DotStringFactory#solve` reads it (`:429-436`): min and max
 * of its parsed polygon, returned in the top-left/`width`/`height` shape of
 * the `yAxis:'down'` snapshot.
 */
export function svekCluster(
  frame: SvekFrame,
  c: LayoutSnapshot['clusters'][number],
): LayoutSnapshot['clusters'][number] {
  const x1 = svgDouble(c.x);
  const x2 = svgDouble(c.x + c.width);
  const top = svekY(frame, c.y + c.height);
  const bottom = svekY(frame, c.y);
  const out: LayoutSnapshot['clusters'][number] = { name: c.name, x: x1, y: top, width: x2 - x1, height: bottom - top };
  if (c.label !== undefined) out.label = { ...c.label, y: frame.fullHeight - c.label.y };
  return out;
}
