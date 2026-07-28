/**
 * Bounding box of an SVG path `d`, computed the way `UPath` does.
 *
 * This is NOT a general path-geometry routine and deliberately does not
 * flatten curves. `UPath#addInternal` (klimt/UPath.java:82-94) records:
 *
 *   - for `SEG_ARCTO`, ONLY the arc's endpoint (`coord[5], coord[6]`) — the
 *     bulge is ignored, and the two commented-out `addPoint` lines right
 *     above it show that was a deliberate choice upstream;
 *   - for every other segment, EVERY coordinate pair, Bézier CONTROL points
 *     included.
 *
 * So the box is the control-polygon box. Reproducing that exactly matters
 * because it is what `Footprint#drawPath` (svek/image/Footprint.java:147-150)
 * feeds the use-case ellipse: it adds `(minX, minY)` and `(maxX, maxY)` as the
 * only two points a drawn path contributes. A "better" (true-extrema) box
 * would be wrong here — see `plans/s1l-leaf-sizing/ledger.md` § S1L-k for the
 * jar measurements this reproduces.
 *
 * Command coverage follows `SvgPath#toUPath`
 * (openiconic/SvgPath.java:145-190), which sees only the absolute forms
 * `M C Q T L A Z` because its `Movement` layer has already normalised
 * relative commands and the `H`/`V`/`S` shorthands away. This port does that
 * normalisation inline: `H`/`V` become line points, `S`/`T` reflect the
 * previous control point (the reflected point is a real path coordinate and
 * DOES enter the box), and `Q` contributes its single control point (upstream
 * duplicates it into a cubic, which cannot change a min/max).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/UPath.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Footprint.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPath.java
 */

export interface PathBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** One command letter, or one number. */
const TOKEN_RE = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;

type Token = string | number;

function tokenize(d: string): Token[] {
  const out: Token[] = [];
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(d)) !== null) {
    out.push(m[1] !== undefined ? m[1] : Number.parseFloat(m[2]!));
  }
  return out;
}

/** Mutable cursor shared by the per-command handlers. */
interface PathState {
  cx: number;
  cy: number;
  startX: number;
  startY: number;
  /** Last control point, for the `S`/`T` reflection. */
  ctlX: number;
  ctlY: number;
  readonly pts: number[];
}

function add(st: PathState, x: number, y: number): void {
  st.pts.push(x, y);
  st.cx = x;
  st.cy = y;
}

/** Reads `n` numbers, converting a relative run to absolute in place. */
function coords(t: Token[], i: number, n: number, st: PathState, rel: boolean): number[] {
  const v: number[] = [];
  for (let k = 0; k < n; k++) {
    const raw = t[i + k];
    const num = typeof raw === 'number' ? raw : 0;
    v.push(rel ? num + (k % 2 === 0 ? st.cx : st.cy) : num);
  }
  return v;
}

/** `M`/`L`/`T`-shaped commands: one point, all of it recorded. */
function pointCommand(c: string, v: number[], st: PathState): void {
  if (c === 'M') {
    st.startX = v[0]!;
    st.startY = v[1]!;
  }
  add(st, v[0]!, v[1]!);
}

/** Cubic-family: record every control point, then the endpoint. `S` reflects
 *  the previous control point into the missing first one. */
function curveCommand(c: string, v: number[], st: PathState): void {
  let pts = v;
  if (c === 'S' || c === 'T') {
    const rx = 2 * st.cx - st.ctlX;
    const ry = 2 * st.cy - st.ctlY;
    pts = [rx, ry, ...v];
  }
  for (let k = 0; k < pts.length - 2; k += 2) st.pts.push(pts[k]!, pts[k + 1]!);
  st.ctlX = pts[pts.length - 4] ?? st.cx;
  st.ctlY = pts[pts.length - 3] ?? st.cy;
  add(st, pts[pts.length - 2]!, pts[pts.length - 1]!);
}

/** Argument count per absolute command letter. */
const ARITY: Readonly<Record<string, number>> = {
  M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0,
};

/**
 * The `UPath`-rule bounding box of one path `d`, or `undefined` when the path
 * contributes no coordinates at all.
 */
export function pathBBox(d: string): PathBox | undefined {
  const t = tokenize(d);
  const st: PathState = { cx: 0, cy: 0, startX: 0, startY: 0, ctlX: 0, ctlY: 0, pts: [] };
  let cmd = '';
  let i = 0;
  while (i < t.length) {
    const tok = t[i];
    if (typeof tok === 'string') {
      cmd = tok;
      i += 1;
      if (cmd === 'Z' || cmd === 'z') {
        st.cx = st.startX;
        st.cy = st.startY;
        continue;
      }
    }
    if (cmd === '') break;
    const rel = cmd >= 'a';
    const c = cmd.toUpperCase();
    i = consume(c, rel, t, i, st);
    // A repeated coordinate run after `M` continues as an implicit lineTo.
    if (c === 'M') cmd = rel ? 'l' : 'L';
  }
  if (st.pts.length === 0) return undefined;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let k = 0; k < st.pts.length; k += 2) {
    xs.push(st.pts[k]!);
    ys.push(st.pts[k + 1]!);
  }
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

/** Dispatches one command occurrence, returning the new token index. */
function consume(c: string, rel: boolean, t: Token[], i: number, st: PathState): number {
  const n = ARITY[c] ?? 0;
  if (c === 'H') {
    const raw = t[i];
    const x = (typeof raw === 'number' ? raw : 0) + (rel ? st.cx : 0);
    add(st, x, st.cy);
    return i + 1;
  }
  if (c === 'V') {
    const raw = t[i];
    const y = (typeof raw === 'number' ? raw : 0) + (rel ? st.cy : 0);
    add(st, st.cx, y);
    return i + 1;
  }
  if (c === 'A') {
    // SEG_ARCTO records only the endpoint (UPath.java:86) — the radii and
    // flags never enter the box.
    const v = coords(t, i + 5, 2, st, rel);
    add(st, v[0]!, v[1]!);
    return i + 7;
  }
  if (c === 'C' || c === 'S' || c === 'Q' || c === 'T') {
    curveCommand(c, coords(t, i, n, st, rel), st);
    return i + n;
  }
  pointCommand(c, coords(t, i, 2, st, rel), st);
  return i + 2;
}
