/**
 * SVG arrow-marker builders — the `<marker>` `<defs>` for every edge arrowhead.
 *
 * Split out of `svg.ts` (which threads gradient Paint through its filled-shape
 * primitives): markers carry no fill Paint and are a self-contained concern, so
 * keeping them here holds `svg.ts` under the module size limit. `svg.ts`
 * re-exports `ArrowType`/`arrowHeadRef`/`arrowHead` so existing importers of
 * `core/svg.js` are unaffected.
 */

import { attrs } from './svg.js';

// ---------------------------------------------------------------------------
// Arrow type
// ---------------------------------------------------------------------------

export type ArrowType =
  | 'sync'
  | 'sync-back'
  | 'async'
  | 'reply'
  | 'replyAsync'
  | 'extension'
  | 'implementation'
  | 'composition'
  | 'aggregation'
  | 'dependency'
  | 'lost'
  | 'found';

/** All arrow types — used to embed every marker in every svgRoot. */
export const ALL_ARROW_TYPES: readonly ArrowType[] = [
  'sync',
  'sync-back',
  'async',
  'reply',
  'replyAsync',
  'extension',
  'implementation',
  'composition',
  'aggregation',
  'dependency',
  'lost',
  'found',
];

/**
 * Returns the marker id string for a given ArrowType.
 * Used as the `id` attribute on the `<marker>` element and as the
 * target of `url(#<id>)` references.
 */
export function arrowHeadRef(type: ArrowType): string {
  return `arrow-${type}`;
}

/** Geometry + inner-shape body for one ArrowType's `<marker>` element. */
interface MarkerSpec {
  w: number;
  h: number;
  refX: number;
  refY: number;
  orient: string;
  body: (bgColor: string) => string;
}

// Marker table (from planning/decisions.md, decision D3). A data-driven table
// rather than a switch keeps `arrowHead` at CCN 1 — branching by lookup, not by
// code. Emits byte-identical marker strings to the original per-case builders:
// - sync / reply       : filled closed triangle
// - sync-back          : same triangle, orient reversed for marker-start use
// - async / replyAsync / dependency : open "V" arrowhead (no fill)
// - extension / implementation : large hollow triangle, bgColor-filled to mask
//   the edge line inside it
// - composition        : filled diamond
// - aggregation        : hollow (bgColor-filled) diamond
// - lost / found       : filled / hollow circle
const MARKER_SPECS: Record<ArrowType, MarkerSpec> = {
  sync: {
    w: 10,
    h: 7,
    refX: 9,
    refY: 3.5,
    orient: 'auto',
    body: () => '<polygon points="0 0, 10 3.5, 0 7" fill="#000000"/>',
  },
  reply: {
    w: 10,
    h: 7,
    refX: 9,
    refY: 3.5,
    orient: 'auto',
    body: () => '<polygon points="0 0, 10 3.5, 0 7" fill="#000000"/>',
  },
  'sync-back': {
    w: 10,
    h: 7,
    refX: 9,
    refY: 3.5,
    orient: 'auto-start-reverse',
    body: () => '<polygon points="0 0, 10 3.5, 0 7" fill="#000000"/>',
  },
  async: {
    w: 10,
    h: 7,
    refX: 9,
    refY: 3.5,
    orient: 'auto',
    body: () => '<polyline points="0 0, 9 3.5, 0 7" fill="none" stroke="#000" stroke-width="1.5"/>',
  },
  replyAsync: {
    w: 10,
    h: 7,
    refX: 9,
    refY: 3.5,
    orient: 'auto',
    body: () => '<polyline points="0 0, 9 3.5, 0 7" fill="none" stroke="#000" stroke-width="1.5"/>',
  },
  dependency: {
    w: 10,
    h: 7,
    refX: 9,
    refY: 3.5,
    orient: 'auto',
    body: () => '<polyline points="0 0, 9 3.5, 0 7" fill="none" stroke="#000" stroke-width="1.5"/>',
  },
  extension: {
    w: 12,
    h: 10,
    refX: 11,
    refY: 5,
    orient: 'auto',
    body: (bg) =>
      `<polygon points="0 0, 11 5, 0 10"${attrs([
        ['fill', bg],
        ['stroke', '#000'],
        ['stroke-width', 1.5],
      ])}/>`,
  },
  implementation: {
    w: 12,
    h: 10,
    refX: 11,
    refY: 5,
    orient: 'auto',
    body: (bg) =>
      `<polygon points="0 0, 11 5, 0 10"${attrs([
        ['fill', bg],
        ['stroke', '#000'],
        ['stroke-width', 1.5],
      ])}/>`,
  },
  composition: {
    w: 12,
    h: 8,
    refX: 11,
    refY: 4,
    orient: 'auto',
    body: () => '<polygon points="0 4, 5 0, 11 4, 5 8" fill="#000000"/>',
  },
  aggregation: {
    w: 12,
    h: 8,
    refX: 11,
    refY: 4,
    orient: 'auto',
    body: (bg) =>
      `<polygon points="0 4, 5 0, 11 4, 5 8"${attrs([
        ['fill', bg],
        ['stroke', '#000'],
        ['stroke-width', 1.5],
      ])}/>`,
  },
  lost: { w: 8, h: 8, refX: 4, refY: 4, orient: 'auto', body: () => '<circle cx="4" cy="4" r="3" fill="#000000"/>' },
  found: {
    w: 8,
    h: 8,
    refX: 4,
    refY: 4,
    orient: 'auto',
    body: () => '<circle cx="4" cy="4" r="3" fill="none" stroke="#000" stroke-width="1.5"/>',
  },
};

/**
 * Returns a `<marker>` element string for the given ArrowType, looked up from
 * {@link MARKER_SPECS}. `bgColor` fills the hollow (extension / implementation /
 * aggregation) heads so the edge line is masked inside the shape.
 */
export function arrowHead(type: ArrowType, bgColor = '#FFFFFF'): string {
  const s = MARKER_SPECS[type];
  // `s.w`/`s.h`/`s.refX`/`s.refY` were raw `${n}` interpolations (no `fmt`),
  // so pass String(n) here to stay byte-identical instead of routing them
  // through `formatAttrValue`'s decimal formatting.
  const open = attrs([
    ['id', arrowHeadRef(type)],
    ['markerWidth', String(s.w)],
    ['markerHeight', String(s.h)],
    ['refX', String(s.refX)],
    ['refY', String(s.refY)],
    ['orient', s.orient],
  ]);
  return `<marker${open}>` + s.body(bgColor) + `</marker>`;
}

/**
 * The open "V" arrowhead of {@link MARKER_SPECS}.async, under a caller-chosen
 * id and stroke color. json's edges need their own colored copy; building it
 * there meant a second, drifting hand-written version of the same body (it
 * was the one marker whose stroke bypassed {@link shortenColor}).
 *
 * `markerUnits="userSpaceOnUse"` keeps the head at a fixed pixel size
 * regardless of the edge stroke-width -- the reason this cannot just be
 * `arrowHead('async')`.
 */
export function openArrowHeadDef(markerId: string, stroke: string): string {
  const s = MARKER_SPECS.async;
  // `s.w`/`s.h`/`s.refX`/`s.refY` were raw `${n}` interpolations (no `fmt`),
  // so pass String(n) to stay byte-identical. The body used to be built via
  // `s.body('').replace('stroke="#000"', ...)`; rebuilt here with `stroke`
  // as a parameter instead of a post-hoc string replace.
  const open = attrs([
    ['id', markerId],
    ['markerWidth', String(s.w)],
    ['markerHeight', String(s.h)],
    ['refX', String(s.refX)],
    ['refY', String(s.refY)],
    ['orient', s.orient],
    ['markerUnits', 'userSpaceOnUse'],
  ]);
  const body = `<polyline points="0 0, 9 3.5, 0 7"${attrs([
    ['fill', 'none'],
    ['stroke', stroke],
    ['stroke-width', 1.5],
  ])}/>`;
  return `<marker${open}>` + body + `</marker>`;
}
