/**
 * The AXIS attribution for `scripts/sequence-geometry-distance.ts` — C1 of
 * `plans/sequence-text-and-y-convergence`.
 *
 * A separate module for the reason `sequence-distance-concentration.ts` is
 * separate — the instrument answers "how far are we", this answers "along
 * which axis" — and for one more: that script is at the 500-line cap, so it
 * keeps the accounting and delegates both the attribution and its table here.
 *
 * WHY THIS EXISTS. The instrument buckets by attribute NAME, so `points` and
 * `d` fold both axes into one number. `points` alone is 1 676 411 of a
 * 6 267 365 total — the largest single line item — and while a quarter of the
 * distance is axis-blind no flat table can say which axis dominates. A Y
 * mission gated on that table cannot see its own largest component (D7).
 */
import type { DistanceTotals } from './sequence-geometry-distance.js';

/**
 * Which axis a numeric diff moves along. `mixed` means the attribute carries
 * BOTH axes with no index rule that separates them: it gets a row of its own
 * and is excluded from either subtotal rather than silently folded into one.
 * `none` is a number that is not a coordinate at all.
 */
export type Axis = 'x' | 'y' | 'mixed' | 'none';

/** The subtotal rows a report prints, in this order. */
export const AXES: readonly Axis[] = ['x', 'y', 'mixed', 'none'];

/**
 * The axis of a BUCKET name (see {@link bucketOf}). Extents count with their
 * own axis — `width` X, `height` Y — which is how the mission's flat table
 * already grouped them, so the two remain comparable.
 *
 * `d` and `transform` are mixed because no index rule splits them: a path's
 * commands have varying arities (`M x y`, `H x`, `A rx ry rot f f x y`), so a
 * flat argument index has no fixed parity, and a transform parameter's
 * meaning depends on which function it belongs to. `r` is mixed because a
 * circle's radius is isotropic. `viewBox` is mixed by SCOPE, not by nature —
 * see the recorded observation in the instrument's header: its four numbers
 * are `min-x min-y width height`, so parity would split it exactly, but C1
 * scoped the parity rule to `points` and left the claim to C2/C3.
 */
const AXIS_BY_BUCKET: Readonly<Record<string, Axis>> = {
  x: 'x', x1: 'x', x2: 'x', cx: 'x', rx: 'x', dx: 'x', width: 'x', 'points.x': 'x',
  y: 'y', y1: 'y', y2: 'y', cy: 'y', ry: 'y', dy: 'y', height: 'y', 'points.y': 'y',
  d: 'mixed', transform: 'mixed', viewBox: 'mixed', r: 'mixed', 'points.mixed': 'mixed',
};

/** The axis a bucket belongs to. An unknown name is `none`, never a guess. */
export function axisOf(bucket: string): Axis {
  return AXIS_BY_BUCKET[bucket] ?? 'none';
}

/**
 * The accumulation key for a numeric diff, from its attribute name and full
 * diff path: the name itself, except that `points` splits by index PARITY
 * into `points.x` and `points.y`.
 *
 * The split is EXACT, and only because the index is a COORDINATE index.
 * `compare.ts:311-334` compares a `points` value by walking
 * `extractNumbers(value)` — a flat regex scan of every numeric token in
 * document order (`compare.ts:98-107`) — and suffixes the diff path with THAT
 * array index, not with a point index. A `points` value is a list of `x,y`
 * pairs, so an even index is an X and an odd index is a Y. The corpus agrees:
 * measured at 1f15652f, `points` diffs land on indices 0-9, the even ones at
 * ~1 098 fixtures apiece and the odd ones at ~2 299 — the eight numbers of a
 * four-point polygon, with Y wrong in more polygons per fixture than X.
 *
 * An index-less `points` path is a whole-attribute length mismatch
 * (`compare.ts:315`), which carries no `delta` and so never reaches the
 * distance sum. It is still given a bucket rather than an assumption.
 */
export function bucketOf(name: string, path: string): string {
  if (name !== 'points') return name;
  const index = /\[(\d+)\]$/.exec(path)?.[1];
  if (index === undefined) return 'points.mixed';
  return Number(index) % 2 === 0 ? 'points.x' : 'points.y';
}

/** Empty totals — the identity these subtotals accumulate onto. */
const ZERO: DistanceTotals = { distance: 0, count: 0 };

/**
 * Per-axis subtotals over a per-bucket map. Every bucket lands in exactly one
 * of the four, so the four sum to the corpus total: regrouping must not move
 * the number this mission is gated on.
 */
export function axisTotals(
  byAttribute: Readonly<Record<string, DistanceTotals>>,
): Record<Axis, DistanceTotals> {
  const out: Record<Axis, DistanceTotals> = { x: ZERO, y: ZERO, mixed: ZERO, none: ZERO };
  for (const [bucket, totals] of Object.entries(byAttribute)) {
    const axis = axisOf(bucket);
    out[axis] = {
      distance: out[axis].distance + totals.distance,
      count: out[axis].count + totals.count,
    };
  }
  return out;
}

/**
 * The per-axis subtotal table, printed beside the per-attribute one. `mixed`
 * is a row and never a share of either axis: the point of the split is that a
 * tenth of the distance remains axis-blind, and hiding that inside a subtotal
 * would reproduce the defect one level down.
 */
export function formatAxisTable(byAttribute: Readonly<Record<string, DistanceTotals>>): string {
  const totals = axisTotals(byAttribute);
  const header = ['axis', 'distance', 'diffs'];
  const grid = [
    header,
    ...AXES.map((a) => [a, totals[a].distance.toFixed(3), String(totals[a].count)]),
  ];
  const widths = header.map((_, i) =>
    grid.reduce((max, r) => Math.max(max, (r[i] ?? '').length), 0),
  );
  return grid.map((r) => r.map((c, i) => c.padEnd(widths[i] ?? 0)).join('  ').trimEnd()).join('\n');
}
