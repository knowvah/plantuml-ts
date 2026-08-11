/**
 * Svek HTML-label table builders — the `label=<...>` values `svek-dot-emit.ts`
 * writes into node, edge and cluster statements.
 *
 * Split out of `svek-dot-emit.ts` (B1/M1, 500-line-per-file cap) as a PURE
 * MOVE, same motivation and shape as `graph-layout-build-edges.ts`'s own split
 * from `graph-layout-build.ts`. `hex`/`round` moved with them because every
 * remaining consumer of those two is either here or importing from here; the
 * dependency runs one way only (`svek-dot-emit.ts` → this file).
 *
 * Upstream home of every routine below is `svek/SvekNode.java`'s
 * `appendLabelHtml*` family, dispatched by `SvekNode#appendShape:132-143`.
 */

import type { DotInputNode, DotInputPortRow } from './graph-layout.types.js';

export const hex = (n: number): string =>
  '#' + (n & 0xffffff).toString(16).padStart(6, '0');
export const round = (v: number): string => String(Math.round(v));

export const labelTable = (w: number, h: number, color: number): string =>
  `<<TABLE BGCOLOR="${hex(color)}" FIXEDSIZE="TRUE" WIDTH="${round(w)}" HEIGHT="${round(h)}">` +
  `<TR><TD></TD></TR></TABLE>>`;

// SvekNode.appendLabelHtml: shield table for a shielded description entity
// (hideText symbols, e.g. INTERFACE lollipops) -- 3x3 grid, center cell
// holds the real icon box with PORT="h"; margin cells reserve space for the
// name/stereotype text drawn outside the icon. Exact text-metric margins
// are D1 tolerance territory (width/height are reported, not asserted, and
// the comparator never reads inside a label=<...> value) -- nominal
// constants stand in for the real measured shield here.
const SHIELD_MARGIN_X = 1;
const SHIELD_MARGIN_Y = 16;

export function shieldTable(node: DotInputNode, color: number): string {
  const w = round(node.width);
  const h = round(node.height);
  const my = String(SHIELD_MARGIN_Y);
  const mx = String(SHIELD_MARGIN_X);
  return (
    '<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">' +
    `<TR><TD></TD><TD FIXEDSIZE="TRUE" WIDTH="1" HEIGHT="${my}"></TD><TD></TD></TR>` +
    `<TR><TD FIXEDSIZE="TRUE" WIDTH="${mx}" HEIGHT="1"></TD>` +
    `<TD BGCOLOR="${hex(color)}" FIXEDSIZE="TRUE" WIDTH="${w}" HEIGHT="${h}" PORT="h"></TD>` +
    `<TD FIXEDSIZE="TRUE" WIDTH="${mx}" HEIGHT="1"></TD></TR>` +
    `<TR><TD></TD><TD FIXEDSIZE="TRUE" WIDTH="1" HEIGHT="${my}"></TD><TD></TD></TR>` +
    '</TABLE>'
  );
}

/** SvekNode.appendLabelHtmlSpecialForPortHtml: a port entity whose label
 *  text is wide enough (>40px, `isPortLabelWide`) renders as an HTML table
 *  with a bordered PORT="P" cell (the compass point `edgeRef` attaches to)
 *  flanked by blank padding cells sized to the overflow width. */
export function portTable(node: DotInputNode, color: number): string {
  const w = round(node.width);
  const h = round(node.height);
  const pad = String(node.portPad ?? 10);
  return (
    '<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">' +
    `<TR><TD WIDTH="${pad}" HEIGHT="1" COLSPAN="3"></TD></TR>` +
    `<TR><TD></TD><TD FIXEDSIZE="TRUE" PORT="P" BORDER="1" COLOR="${hex(color)}" ` +
    `WIDTH="${w}" HEIGHT="${h}"></TD><TD></TD></TR>` +
    `<TR><TD WIDTH="${pad}" HEIGHT="1" COLSPAN="3"></TD></TR>` +
    '</TABLE>'
  );
}

/** Java's `StringBuilder.append(double)` (`Double.toString`): an integral value
 *  keeps its `.0` tail, so the jar writes `WIDTH="49.0"`, not `"49"`. Other
 *  values agree with JS's shortest-round-trip form at these magnitudes
 *  (jar-verified `74.425`, `100.14999999999999`, `69.48750000000001`).
 *  @see svek/SvekNode.java:306 */
const javaDouble = (v: number): string => (Number.isInteger(v) ? `${v}.0` : String(v));

/** `SvekNode#appendTr` (svek/SvekNode.java:298-311) — one band row; a
 *  non-positive height emits NOTHING (`if (height <= 0) return`), which is what
 *  drops the filler before a port at position 0 and the trailer after a port
 *  reaching the box bottom. The double space after `<TD` is the jar's own
 *  literal, and the parity comparator is textual. */
function appendTr(width: number, portId: string | undefined, height: number): string {
  if (height <= 0) return '';
  const port = portId !== undefined ? ` PORT="${portId}"` : '';
  return `<TR><TD  FIXEDSIZE="TRUE" WIDTH="${javaDouble(width)}" HEIGHT="${height}"${port}></TD></TR>`;
}

/**
 * `SvekNode#appendLabelHtmlSpecialForLink` (svek/SvekNode.java:268-296): the
 * RECTANGLE_HTML_FOR_PORTS label — a one-column table walking the
 * position-sorted `Ports#getAllPortGeometry()` snapshot, emitting the gap since
 * the last band as an unnamed filler row, then the band as a `PORT="…"` row,
 * closing with a `getHeight() - sum` trailer. Heights `(int)`-truncate exactly
 * where the jar truncates; `sum` accumulates the TRUNCATED values, so the error
 * never compounds into the trailer.
 */
export function rowPortTable(
  node: DotInputNode,
  rows: readonly DotInputPortRow[],
  color: number,
): string {
  let body = '';
  let sum = 0;
  for (const geom of rows) {
    const missing = Math.trunc(geom.position - sum);
    sum += missing;
    body += appendTr(node.width, undefined, missing);
    const intHeight = Math.trunc(geom.height);
    body += appendTr(node.width, geom.id, intHeight);
    sum += intHeight;
  }
  body += appendTr(node.width, undefined, Math.trunc(node.height - sum));
  return (
    `<TABLE BGCOLOR="${hex(color)}" BORDER="0" CELLBORDER="0" ` +
    `CELLSPACING="0" CELLPADDING="0">${body}</TABLE>`
  );
}
