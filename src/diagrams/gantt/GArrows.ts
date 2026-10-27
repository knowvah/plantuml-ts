import { Back } from '../../core/klimt/Back.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { HColorOrPaint } from '../../core/klimt/color/ColorMapper.js';
import { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import { UPath } from '../../core/klimt/shape/UPath.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import { UPolygon } from '../../core/klimt/shape/UPolygon.js';
import { GSide } from './core/GSide.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GArrows.java:46 */
const DELTA2 = 4;

/**
 * GArrows -- one polyline arrow with a filled head at its last point.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GArrows.java:44-156
 */
export class GArrows implements UDrawable {
  readonly #atEnd: GSide;
  readonly #backColor: HColorOrPaint;
  readonly #points: XPoint2D[] = [];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GArrows.java:52-55 */
  public constructor(atEnd: GSide, backColor: HColorOrPaint) {
    this.#atEnd = atEnd;
    this.#backColor = backColor;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GArrows.java:57-70 */
  public drawU(ug: UGraphic): void {
    const path = UPath.none();
    path.moveTo(this.#first());

    for (let i = 1; i < this.#points.length - 1; i++) path.lineTo(this.#at(i));
    path.lineTo(this.#lastPointPatched());

    path.closePath();

    ug.draw(path);

    // ug.apply(UStroke.simple()).apply(backColor.bg()) -- `HColor#bg()` is `new Back(color)`.
    const headUg = ug.apply(UStroke.simple()).apply(new Back(this.#backColor));
    headUg.draw(this.#getHead());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GArrows.java:72-79 */
  #lastPointPatched(): XPoint2D {
    const last = this.#last();
    if (this.#atEnd === GSide.LEFT) return new XPoint2D(last.getX() - 3, last.getY());
    if (this.#atEnd === GSide.RIGHT) return new XPoint2D(last.getX() + 3, last.getY());
    return last;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GArrows.java:81-83 */
  public addPoint(x: number, y: number): void {
    this.#points.push(new XPoint2D(x, y));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GArrows.java:85-107 (`assert false` + empty polygon for every other side) */
  #getHead(): UPolygon {
    const last = this.#last();
    const x = last.getX();
    const y = last.getY();
    if (this.#atEnd === GSide.LEFT) {
      const polygon = new UPolygon();
      polygon.addPoint(x - 4, y - DELTA2);
      polygon.addPoint(x, y);
      polygon.addPoint(x - 4, y + DELTA2);
      polygon.addPoint(x - 4, y - DELTA2);
      return polygon;
    }
    if (this.#atEnd === GSide.RIGHT) {
      const polygon = new UPolygon();
      polygon.addPoint(x + 4, y - DELTA2);
      polygon.addPoint(x, y);
      polygon.addPoint(x + 4, y + DELTA2);
      polygon.addPoint(x + 4, y - DELTA2);
      return polygon;
    }
    return new UPolygon();
  }

  /** `points.get(i)`: out of range is an `IndexOutOfBoundsException`. */
  #at(i: number): XPoint2D {
    const p = this.#points[i];
    if (p === undefined)
      throw new Error(`IndexOutOfBoundsException: Index ${i} out of bounds for length ${this.#points.length}`);
    return p;
  }

  #first(): XPoint2D {
    return this.#at(0);
  }

  #last(): XPoint2D {
    return this.#at(this.#points.length - 1);
  }
}
