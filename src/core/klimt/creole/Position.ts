import { UTranslate } from '../UTranslate.js';
import type { UGraphic } from '../UGraphic.js';
import type { MinMax } from '../geom/MinMax.js';
import type { XDimension2D } from '../geom/XDimension2D.js';

/**
 * Position — one `CreoleAtom`'s resolved (x, y, dim) box within a `Sea`
 * (`Sea.ts`'s own doc comment explains why this port's `Sea`/`Position`
 * operate on `CreoleAtom` rather than upstream's OOP `Atom`).
 *
 * Upstream: klimt/creole/Position.java. Ported: the constructor, `align`,
 * `getMinY`/`getMaxY`, `translate` (returns a translated `UGraphic`),
 * `translateY`/`translateX`, `update` (folds into a `MinMax` accumulator),
 * `getHeight`/`getWidth`, `getTranslate`.
 *
 * NOT ported: `drawDebug` — upstream's ONLY call site
 * (`SheetBlock1.java:216`, `// position.drawDebug(ug);`) is itself
 * commented out (dead in the Java, not merely unreached), and its
 * dependencies (`HColors`, `URectangle#build(XDimension2D)`) don't exist
 * in this port's color model (`TextBlockLineBefore.ts`'s own doc comment:
 * "this port's `Paint` has no null variant... `HColor` is not ported
 * anywhere"). Genuinely different from the ADR-8 corollary's WBS case —
 * this isn't "not yet reached", it's "upstream itself disabled the only
 * call site" plus a missing primitive with no other consumer anywhere in
 * this port. Trivial to add once `HColor`/`URectangle.build` land.
 */
export class Position {
  private readonly x: number;
  private readonly y: number;
  private readonly dim: XDimension2D;

  constructor(x: number, y: number, dim: XDimension2D) {
    this.x = x;
    this.y = y;
    this.dim = dim;
  }

  toString(): string {
    return `x=${this.x} y=${this.y} dim=${this.dim.toString()}`;
  }

  align(height: number): Position {
    const dy = height - this.dim.getHeight();
    return this.translateY(dy);
  }

  getMinY(): number {
    return this.y;
  }

  getMaxY(): number {
    return this.y + this.getHeight();
  }

  translate(ug: UGraphic): UGraphic {
    return ug.apply(new UTranslate(this.x, this.y));
  }

  translateY(dy: number): Position {
    return new Position(this.x, this.y + dy, this.dim);
  }

  translateX(dx: number): Position {
    return new Position(this.x + dx, this.y, this.dim);
  }

  update(minMax: MinMax): MinMax {
    return minMax.addPoint(this.x + this.dim.getWidth(), this.y + this.dim.getHeight());
  }

  getHeight(): number {
    return this.dim.getHeight();
  }

  getWidth(): number {
    return this.dim.getWidth();
  }

  getTranslate(): UTranslate {
    return new UTranslate(this.x, this.y);
  }
}
