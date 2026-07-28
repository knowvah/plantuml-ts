/**
 * Use-case ellipse geometry — a faithful port of `Footprint` +
 * `ContainingEllipse` (`svek/image/`), replacing the closed-form
 * bounding-box approximation this port used before.
 *
 * Upstream fits the ellipse in two stages, and the split matters:
 *
 *   1. `TextBlockInEllipse`'s ctor takes `alpha` from the block's DECLARED
 *      dimension (`text.calculateDimension`), clamped to [0.2, 0.8];
 *   2. it then calls `Footprint#getEllipse(text, alpha)`, which DRAWS the
 *      block onto a point-collecting `UGraphic` and fits the smallest
 *      ellipse (of that aspect) containing the collected points.
 *      `ContainingEllipse` does that by mapping `y -> y / alpha` and taking
 *      the SMALLEST ENCLOSING CIRCLE: `width = 2r`, `height = 2r * alpha`.
 *
 * The old closed form — `diag = sqrt(W² + (H/alpha)²)` over the block's
 * bounding box — is exactly right whenever the points are two opposite
 * corners or a rectangle's four corners, which is why every text-only and
 * sprite-only fixture matched it. It is WRONG as soon as a block mixes a
 * text line with a sprite line, because then the enclosing circle is not the
 * bounding box's circumcircle, and the result becomes order-dependent (jar:
 * `"<$bi-globe>\nbi-globe"` = 66.026×43.587 but `"bi-globe\n<$bi-globe>"` =
 * 69.791×45.945 — same lines, swapped).
 *
 * Two positional details are load-bearing and both come from upstream:
 *
 *  - a TEXT atom's collected box is `[y + ypos - h + 1.5, y + ypos + 1.5]`,
 *    where `Footprint#drawText` applies the `- (h - 1.5)` shift and
 *    `AtomText#drawU` draws at `ypos = height - descent` with
 *    `StringBounder#getDescent` defaulting to `size / 4.5`. At size 14 that
 *    is 10.888…, so the box starts 1.611 ABOVE its line's top — the
 *    asymmetry that makes line order matter.
 *  - a SPRITE atom contributes its INK box at its own offset inside the
 *    declared line box (`Footprint#drawPath` records
 *    `(x + path.getMinX(), y + path.getMinY())`), not the declared box.
 *
 * Verified against the jar on seven shapes (sprite; text; text×2; sprite+text;
 * text+sprite; sprite+text×2; sprite×2) to within 5e-4 px.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Footprint.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/ContainingEllipse.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockInEllipse.java
 */

/** `Footprint#drawText`'s box shift: `y -= dim.getHeight() - 1.5`. */
const TEXT_BOX_DESCENT = 1.5;

/** `StringBounder#getDescent`'s default, `font.getSize2D() / 4.5`. */
const DESCENT_DIVISOR = 4.5;

export interface FootprintPoint {
  readonly x: number;
  readonly y: number;
}

/** One drawn box a line contributes, in block coordinates. */
export interface FootprintBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** `AtomText#drawU`'s baseline offset within a line of height `h`. */
export function textBaselineOffset(h: number): number {
  return h - h / DESCENT_DIVISOR;
}

/** The box `Footprint#drawText` records for a text run drawn on a line whose
 *  top is `lineTop` and whose height is `h`. */
export function textFootprintBox(x: number, lineTop: number, w: number, h: number): FootprintBox {
  const baseline = lineTop + textBaselineOffset(h);
  return { x, y: baseline - h + TEXT_BOX_DESCENT, width: w, height: h };
}

/** Corner points of a box — what `Footprint` collects. A path contributes
 *  only its two opposite corners; a text run contributes all four, but the
 *  enclosing circle is unaffected by the redundant pair. */
export function boxPoints(b: FootprintBox): FootprintPoint[] {
  return [
    { x: b.x, y: b.y },
    { x: b.x + b.width, y: b.y + b.height },
    { x: b.x + b.width, y: b.y },
    { x: b.x, y: b.y + b.height },
  ];
}

interface Circle {
  cx: number;
  cy: number;
  r: number;
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function contains(c: Circle, p: FootprintPoint): boolean {
  return dist(c.cx, c.cy, p.x, p.y) <= c.r + 1e-9;
}

function fromTwo(a: FootprintPoint, b: FootprintPoint): Circle {
  return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, r: dist(a.x, a.y, b.x, b.y) / 2 };
}

function fromThree(a: FootprintPoint, b: FootprintPoint, c: FootprintPoint): Circle | undefined {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-12) return undefined;
  const aa = a.x * a.x + a.y * a.y;
  const bb = b.x * b.x + b.y * b.y;
  const cc = c.x * c.x + c.y * c.y;
  const cx = (aa * (b.y - c.y) + bb * (c.y - a.y) + cc * (a.y - b.y)) / d;
  const cy = (aa * (c.x - b.x) + bb * (a.x - c.x) + cc * (b.x - a.x)) / d;
  return { cx, cy, r: dist(cx, cy, a.x, a.y) };
}

/**
 * Smallest enclosing circle (`SmallestEnclosingCircle`), by the standard
 * deterministic incremental construction — NO shuffling, so the result is
 * reproducible (this port seeds every non-determinism; see CLAUDE.md).
 */
export function smallestEnclosingCircle(pts: readonly FootprintPoint[]): Circle | undefined {
  if (pts.length === 0) return undefined;
  let c: Circle = { cx: pts[0]!.x, cy: pts[0]!.y, r: 0 };
  for (let i = 1; i < pts.length; i++) {
    if (contains(c, pts[i]!)) continue;
    c = { cx: pts[i]!.x, cy: pts[i]!.y, r: 0 };
    for (let j = 0; j < i; j++) {
      if (contains(c, pts[j]!)) continue;
      c = fromTwo(pts[i]!, pts[j]!);
      for (let k = 0; k < j; k++) {
        if (contains(c, pts[k]!)) continue;
        const t = fromThree(pts[i]!, pts[j]!, pts[k]!);
        if (t !== undefined) c = t;
      }
    }
  }
  return c;
}

/**
 * `ContainingEllipse` over already-collected points: map `y -> y / alpha`,
 * take the smallest enclosing circle, and report `2r` by `2r * alpha`.
 */
export function containingEllipse(
  points: readonly FootprintPoint[],
  alpha: number,
): { width: number; height: number } | undefined {
  const circle = smallestEnclosingCircle(points.map((p) => ({ x: p.x, y: p.y / alpha })));
  if (circle === undefined) return undefined;
  return { width: 2 * circle.r, height: 2 * circle.r * alpha };
}
