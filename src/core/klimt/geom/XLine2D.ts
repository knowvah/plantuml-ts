import { UTranslate } from '../UTranslate.js';
import type { UGraphic } from '../UGraphic.js';
import type { UDrawable } from '../shape/UDrawable.js';
import { ULine } from '../shape/ULine.js';
import { XPoint2D } from './XPoint2D.js';

/**
 * XLine2D — an immutable line segment from (x1, y1) to (x2, y2), and a
 * `UDrawable` (renders as a `ULine` translated to its start point).
 *
 * Upstream: klimt/geom/XLine2D.java. Ported in full: the constructor, the
 * `line(XPoint2D, XPoint2D)` factory, `getMiddle`, `getX1`/`getY1`/`getX2`/
 * `getY2`, `getP1`/`getP2`, `withPoint1`/`withPoint2`, the static
 * `ptSegDistSq` (point-to-segment squared distance), `intersect(XLine2D)`
 * (segment-segment intersection via the parametric-form solve), `drawU`,
 * and `getAngle`.
 */
export class XLine2D implements UDrawable {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  static line(p1: XPoint2D, p2: XPoint2D): XLine2D {
    return new XLine2D(p1.getX(), p1.getY(), p2.getX(), p2.getY());
  }

  getMiddle(): XPoint2D {
    const mx = (this.x1 + this.x2) / 2;
    const my = (this.y1 + this.y2) / 2;
    return new XPoint2D(mx, my);
  }

  getX1(): number {
    return this.x1;
  }

  getY1(): number {
    return this.y1;
  }

  getX2(): number {
    return this.x2;
  }

  getY2(): number {
    return this.y2;
  }

  getP1(): XPoint2D {
    return new XPoint2D(this.x1, this.y1);
  }

  getP2(): XPoint2D {
    return new XPoint2D(this.x2, this.y2);
  }

  withPoint1(other: XPoint2D): XLine2D {
    return new XLine2D(other.x, other.y, this.x2, this.y2);
  }

  withPoint2(other: XPoint2D): XLine2D {
    return new XLine2D(this.x1, this.y1, other.x, other.y);
  }

  /**
   * Returns the square of the distance from a point to a line segment. The
   * distance measured is the distance between the specified point and the
   * closest point between the specified end points. If the specified point
   * intersects the line segment in between the end points, this method
   * returns 0.0.
   *
   * @param x1 the X coordinate of the start point of the specified line segment
   * @param y1 the Y coordinate of the start point of the specified line segment
   * @param x2 the X coordinate of the end point of the specified line segment
   * @param y2 the Y coordinate of the end point of the specified line segment
   * @param px the X coordinate of the specified point being measured against
   *   the specified line segment
   * @param py the Y coordinate of the specified point being measured against
   *   the specified line segment
   * @returns the square of the distance from the specified point to the
   *   specified line segment.
   */
  static ptSegDistSq(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number {
    // #lizard forgives -- 6 params mirrors XLine2D.java's static
    // ptSegDistSq signature exactly (x1, y1, x2, y2, px, py); faithful-port
    // discipline forbids collapsing them into an object to satisfy
    // MAX_PARAMS.
    // Adjust vectors relative to x1,y1
    // x2,y2 becomes relative vector from x1,y1 to end of segment
    const rx2 = x2 - x1;
    const ry2 = y2 - y1;
    // px,py becomes relative vector from x1,y1 to test point
    let rpx = px - x1;
    let rpy = py - y1;
    let dotprod = rpx * rx2 + rpy * ry2;
    let projlenSq: number;
    if (dotprod <= 0.0) {
      // px,py is on the side of x1,y1 away from x2,y2
      // distance to segment is length of px,py vector
      // "length of its (clipped) projection" is now 0.0
      projlenSq = 0.0;
    } else {
      // switch to backwards vectors relative to x2,y2
      // x2,y2 are already the negative of x1,y1=>x2,y2
      // to get px,py to be the negative of px,py=>x2,y2
      // the dot product of two negated vectors is the same
      // as the dot product of the two normal vectors
      rpx = rx2 - rpx;
      rpy = ry2 - rpy;
      dotprod = rpx * rx2 + rpy * ry2;
      if (dotprod <= 0.0) {
        // px,py is on the side of x2,y2 away from x1,y1
        // distance to segment is length of (backwards) px,py vector
        // "length of its (clipped) projection" is now 0.0
        projlenSq = 0.0;
      } else {
        // px,py is between x1,y1 and x2,y2
        // dotprod is the length of the px,py vector
        // projected on the x2,y2=>x1,y1 vector times the
        // length of the x2,y2=>x1,y1 vector
        projlenSq = dotprod * dotprod / (rx2 * rx2 + ry2 * ry2);
      }
    }
    // Distance to line is now the length of the relative point
    // vector minus the length of its projection onto the line
    // (which is zero if the projection falls outside the range
    // of the line segment).
    let lenSq = rpx * rpx + rpy * rpy - projlenSq;
    if (lenSq < 0) {
      lenSq = 0;
    }
    return lenSq;
  }

  intersect(line2: XLine2D): XPoint2D | undefined {
    const s1x = this.x2 - this.x1;
    const s1y = this.y2 - this.y1;

    const s2x = line2.x2 - line2.x1;
    const s2y = line2.y2 - line2.y1;

    const s = (-s1y * (this.x1 - line2.x1) + s1x * (this.y1 - line2.y1)) / (-s2x * s1y + s1x * s2y);
    const t = (s2x * (this.y1 - line2.y1) - s2y * (this.x1 - line2.x1)) / (-s2x * s1y + s1x * s2y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      return new XPoint2D(this.x1 + t * s1x, this.y1 + t * s1y);
    }

    return undefined;
  }

  drawU(ug: UGraphic): void {
    const translated = ug.apply(new UTranslate(this.x1, this.y1));
    const line = new ULine(this.x2 - this.x1, this.y2 - this.y1);
    translated.draw(line);
  }

  getAngle(): number {
    return Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
  }
}
