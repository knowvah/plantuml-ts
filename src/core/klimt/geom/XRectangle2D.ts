/**
 * XRectangle2D — an immutable (x, y, width, height) axis-aligned
 * rectangle. `SheetBlock1#getInnerPosition`/`SheetBlock2#getInnerPosition`
 * (the `WithPorts`/`Ports` member-lookup seam T8 builds) return this type
 * — see those files' doc comments for why neither ever actually
 * constructs one in this port's current call graph.
 *
 * Upstream: klimt/geom/XRectangle2D.java. Ported in full: the
 * constructor, all four readonly fields, `getWidth`/`getHeight`/`getX`/
 * `getY`, `getCenterX`/`getCenterY`, `getMinX`/`getMaxX`/`getMinY`/
 * `getMaxY`, `intersects(XRectangle2D)` + the private 4-arg `intersects`
 * it delegates to, `contains(double, double)`, `contains(XPoint2D)`
 * (ported as a faithful `throw` — upstream's own body is
 * `throw new UnsupportedOperationException()`, i.e. it is itself an
 * unimplemented stub in the Java, not something this port trimmed), and
 * `intersect(XLine2D)` (T7b — see `XLine2D.ts` for its own port notes;
 * T7 had dropped this method reasoning its only caller, `wbs/WBSLink.java`,
 * belongs to an unbuilt diagram type — wrong: WBS is a live, registered
 * upstream `DiagramType` this port's own `catalog.md` already lists as a
 * roadmap target, so "not yet reached" is not "unreachable").
 */
import { XLine2D } from './XLine2D.js';
import { XPoint2D } from './XPoint2D.js';

export class XRectangle2D {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getCenterX(): number {
    return this.x + this.width / 2;
  }

  getCenterY(): number {
    return this.y + this.height / 2;
  }

  getMinX(): number {
    return this.x;
  }

  getMaxX(): number {
    return this.x + this.width;
  }

  getMinY(): number {
    return this.y;
  }

  getMaxY(): number {
    return this.y + this.height;
  }

  intersects(other: XRectangle2D): boolean {
    return this.intersectsRect(other.getX(), other.getY(), other.getWidth(), other.getHeight());
  }

  private intersectsRect(x: number, y: number, w: number, h: number): boolean {
    return (
      w > 0 &&
      h > 0 &&
      this.getWidth() > 0 &&
      this.getHeight() > 0 &&
      x < this.getX() + this.getWidth() &&
      x + w > this.getX() &&
      y < this.getY() + this.getHeight() &&
      y + h > this.getY()
    );
  }

  contains(point: XPoint2D): boolean;
  contains(xp: number, yp: number): boolean;
  contains(pointOrX: XPoint2D | number, yp?: number): boolean {
    if (typeof pointOrX === 'number') {
      if (this.width <= 0 || this.height <= 0) {
        throw new Error('IllegalStateException');
      }
      const xpVal = pointOrX;
      const ypVal = yp as number;
      return xpVal >= this.getMinX() && xpVal < this.getMaxX() && ypVal >= this.getMinY() && ypVal < this.getMaxY();
    }
    // Upstream: `contains(XPoint2D)` is itself an unimplemented stub —
    // `throw new UnsupportedOperationException()` (XRectangle2D.java).
    throw new Error('UnsupportedOperationException');
  }

  intersect(line: XLine2D): XPoint2D | undefined {
    const a = new XPoint2D(this.x, this.y);
    const b = new XPoint2D(this.x + this.width, this.y);
    const c = new XPoint2D(this.x + this.width, this.y + this.height);
    const d = new XPoint2D(this.x, this.y + this.height);
    const line1 = XLine2D.line(a, b);
    const line2 = XLine2D.line(b, c);
    const line3 = XLine2D.line(c, d);
    const line4 = XLine2D.line(d, a);

    let result = line.intersect(line1);
    if (result !== undefined) return result;
    result = line.intersect(line2);
    if (result !== undefined) return result;
    result = line.intersect(line3);
    if (result !== undefined) return result;
    result = line.intersect(line4);
    if (result !== undefined) return result;

    return undefined;
  }
}
