/**
 * @see ~/git/plantuml/.../klimt/drawing/hand/HandJiggle.java
 *
 * The wobble every handwritten shape is built from: walk a straight run in
 * ~10-unit segments and push each intermediate point sideways by a random
 * offset, PERPENDICULAR to the run.
 *
 * Exactly one `nextDouble()` is consumed per emitted intermediate point, from
 * a `JavaRandom` shared by the whole diagram — see `UGraphicHandwritten.ts`
 * for why that sharing makes the port all-or-nothing.
 */

import type { JavaRandom } from './JavaRandom.js';

export interface HandPoint {
  readonly x: number;
  readonly y: number;
}

/** A cubic segment, in the argument order `XCubicCurve2D` uses. */
export interface HandCubic {
  x1: number; y1: number;
  ctrlx1: number; ctrly1: number;
  ctrlx2: number; ctrly2: number;
  x2: number; y2: number;
}

/** `Line2D.ptSegDistSq` — the same helper `DotPath.ts` keeps privately; the
 *  two are deliberate duplicates rather than a shared export, since this
 *  module must not depend on the DotPath model. */
function ptSegDistSq(segStart: HandPoint, segEnd: HandPoint, pt: HandPoint): number {
  const x2 = segEnd.x - segStart.x;
  const y2 = segEnd.y - segStart.y;
  let dx = pt.x - segStart.x;
  let dy = pt.y - segStart.y;
  let dot = dx * x2 + dy * y2;
  let projLenSq: number;
  if (dot <= 0) {
    projLenSq = 0;
  } else {
    dx = x2 - dx;
    dy = y2 - dy;
    dot = dx * x2 + dy * y2;
    projLenSq = dot <= 0 ? 0 : (dot * dot) / (x2 * x2 + y2 * y2);
  }
  const lenSq = dx * dx + dy * dy - projLenSq;
  return lenSq < 0 ? 0 : lenSq;
}

/** `CubicCurve2D#getFlatness` — the greater control-point distance from the
 *  chord, as a real distance rather than its square. */
function flatness(c: HandCubic): number {
  const p1 = { x: c.x1, y: c.y1 };
  const p2 = { x: c.x2, y: c.y2 };
  return Math.sqrt(Math.max(
    ptSegDistSq(p1, p2, { x: c.ctrlx1, y: c.ctrly1 }),
    ptSegDistSq(p1, p2, { x: c.ctrlx2, y: c.ctrly2 }),
  ));
}

/** `CubicCurve2D#subdivide` — de Casteljau at t = 0.5. */
function subdivide(c: HandCubic): [HandCubic, HandCubic] {
  const mid = (a: number, b: number): number => (a + b) / 2;
  const c1x = mid(c.x1, c.ctrlx1), c1y = mid(c.y1, c.ctrly1);
  const mx = mid(c.ctrlx1, c.ctrlx2), my = mid(c.ctrly1, c.ctrly2);
  const c2x = mid(c.ctrlx2, c.x2), c2y = mid(c.ctrly2, c.y2);
  const lx = mid(c1x, mx), ly = mid(c1y, my);
  const rx = mid(mx, c2x), ry = mid(my, c2y);
  const px = mid(lx, rx), py = mid(ly, ry);
  return [
    { x1: c.x1, y1: c.y1, ctrlx1: c1x, ctrly1: c1y, ctrlx2: lx, ctrly2: ly, x2: px, y2: py },
    { x1: px, y1: py, ctrlx1: rx, ctrly1: ry, ctrlx2: c2x, ctrly2: c2y, x2: c.x2, y2: c.y2 },
  ];
}

export class HandJiggle {
  private readonly points: HandPoint[] = [];
  private startX: number;
  private startY: number;

  constructor(
    startX: number,
    startY: number,
    private readonly defaultVariation: number,
    private readonly rnd: JavaRandom,
  ) {
    this.startX = startX;
    this.startY = startY;
    this.points.push({ x: startX, y: startY });
  }

  static create(start: HandPoint, defaultVariation: number, rnd: JavaRandom): HandJiggle {
    return new HandJiggle(start.x, start.y, defaultVariation, rnd);
  }

  /**
   * A run below 0.001 long returns WITHOUT consuming any randomness and
   * without emitting a point — load-bearing, because a degenerate segment
   * that drew a point anyway would shift every later shape's jitter.
   */
  lineTo(endX: number, endY: number): void {
    const diffX = Math.abs(endX - this.startX);
    const diffY = Math.abs(endY - this.startY);
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    if (distance < 0.001) return;

    let segments = Math.round(distance / 10);
    let variation = this.defaultVariation;
    if (segments < 5) {
      segments = 5;
      variation /= 3;
    }

    // `diffX`/`diffY` are absolute, so the sign is reapplied here — upstream's
    // own `Math.signum(endX - startX) * diffX / segments`.
    const stepX = Math.sign(endX - this.startX) * diffX / segments;
    const stepY = Math.sign(endY - this.startY) * diffY / segments;
    const fx = diffX / distance;
    const fy = diffY / distance;

    for (let s = 0; s < segments; s++) {
      const x = stepX * s + this.startX;
      const y = stepY * s + this.startY;
      const offset = (this.rnd.nextDouble() - 0.5) * variation;
      this.points.push({ x: x - offset * fy, y: y - offset * fx });
    }
    this.points.push({ x: endX, y: endY });

    this.startX = endX;
    this.startY = endY;
  }

  /** Two chords across the arc — upstream approximates it no more finely. */
  arcTo(angle0: number, angle1: number, centerX: number, centerY: number, rx: number, ry: number): void {
    const at = (angle: number): HandPoint => ({
      x: centerX + Math.cos(angle) * rx,
      y: centerY + Math.sin(angle) * ry,
    });
    const mid = at((angle0 + angle1) / 2);
    this.lineTo(mid.x, mid.y);
    const end = at(angle1);
    this.lineTo(end.x, end.y);
  }

  /** Subdivide until flat enough or short enough, then walk the chord. */
  curveTo(curve: HandCubic): void {
    const dist = Math.hypot(curve.x2 - curve.x1, curve.y2 - curve.y1);
    if (flatness(curve) > 0.1 && dist > 20) {
      const [left, right] = subdivide(curve);
      this.curveTo(left);
      this.curveTo(right);
      return;
    }
    this.lineTo(curve.x2, curve.y2);
  }

  getPoints(): readonly HandPoint[] {
    return this.points;
  }
}
