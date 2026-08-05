import type { UChange } from './UChange.js';
import type { XPoint2D } from './geom/XPoint2D.js';
import { XRectangle2D } from './geom/XRectangle2D.js';

/**
 * A 2D point, local to this module. Upstream's `getTranslated` takes/
 * returns `klimt.geom.XPoint2D`; that geometry class is not yet ported
 * (out of scope for T2 — see mission brief), so a minimal `{ x, y }`
 * shape stands in at this seam. Any future `XPoint2D` port should be
 * structurally compatible with this type.
 */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/**
 * UTranslate — an immutable (dx, dy) offset. It is itself a `UChange`:
 * applying one to a `UGraphic` composes it with the graphic's current
 * translate to produce a new, independent state (see
 * `AbstractCommonUGraphic#apply`).
 *
 * Upstream: klimt/UTranslate.java. Ported members: the constructor,
 * `none`/`dx`/`dy` factories, `getDx`/`getDy`, `isAlmostSame`,
 * `getTranslated`, `scaled`, `compose`, `reverse`, `multiplyBy`, `sym`,
 * `getPosition`. T2 deferred the `point(XPoint2D)` factory, `apply
 * (XRectangle2D)`, and `rotate(double)` — each depended on geometry
 * classes not yet ported, with "Re-add when those geometry types land"
 * as the trigger. SI1/T4 (`ULayoutGroup.ts`) is that trigger for
 * `point` and `apply(XRectangle2D)`: `XPoint2D`/`XRectangle2D` have
 * since landed in `geom/`, and `ULayoutGroup#drawU`/`#tryOne` call
 * both members verbatim (UTranslate.java:68-70, :103-105). Still NOT
 * ported: `rotate(double)` — `XAffineTransform` has no port and no
 * caller.
 */
export class UTranslate implements UChange {
  private readonly dx: number;
  private readonly dy: number;

  constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
  }

  static none(): UTranslate {
    return new UTranslate(0, 0);
  }

  static dx(dx: number): UTranslate {
    return new UTranslate(dx, 0);
  }

  static dy(dy: number): UTranslate {
    return new UTranslate(0, dy);
  }

  /** @see klimt/UTranslate.java#point */
  static point(p: XPoint2D): UTranslate {
    return new UTranslate(p.getX(), p.getY());
  }

  getDx(): number {
    return this.dx;
  }

  getDy(): number {
    return this.dy;
  }

  isAlmostSame(other: UTranslate): boolean {
    return this.dx === other.dx || this.dy === other.dy;
  }

  getTranslated(p: Point2D | undefined): Point2D | undefined {
    if (p === undefined) return undefined;
    return { x: p.x + this.dx, y: p.y + this.dy };
  }

  scaled(scale: number): UTranslate {
    return new UTranslate(this.dx * scale, this.dy * scale);
  }

  compose(other: UTranslate): UTranslate {
    return new UTranslate(this.dx + other.dx, this.dy + other.dy);
  }

  reverse(): UTranslate {
    return new UTranslate(-this.dx, -this.dy);
  }

  /** @see klimt/UTranslate.java#apply(XRectangle2D) */
  apply(rect: XRectangle2D): XRectangle2D {
    return new XRectangle2D(rect.getX() + this.dx, rect.getY() + this.dy, rect.getWidth(), rect.getHeight());
  }

  multiplyBy(v: number): UTranslate {
    return new UTranslate(this.dx * v, this.dy * v);
  }

  sym(): UTranslate {
    return new UTranslate(this.dy, this.dx);
  }

  getPosition(): Point2D {
    return { x: this.dx, y: this.dy };
  }

  toString(): string {
    return `translate dx=${this.dx} dy=${this.dy}`;
  }
}
