import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UTranslate } from '../../core/klimt/UTranslate.js';
import { Fore } from '../../core/klimt/Fore.js';
import type { HColorOrPaint } from '../../core/klimt/color/ColorMapper.js';
import type { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { XLine2D } from '../../core/klimt/geom/XLine2D.js';
import { XRectangle2D } from '../../core/klimt/geom/XRectangle2D.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import { ExtremityArrow } from '../../core/svek/extremity/ExtremityArrow.js';

/**
 * The slice of `WElement` that `WBSLink` reads (WElement.java getPosition /
 * getDimension). `WElement` (T1a) satisfies it structurally.
 */
export interface WElementGeometry {
  getPosition(): UTranslate | undefined;
  getDimension(): XDimension2D | undefined;
}

/**
 * WBSLink — a `-->` link drawn between two placed elements: the centre-to-centre
 * line clipped to both rectangles, plus an arrowhead at the second end.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WBSLink.java:49-100
 */
export class WBSLink<E extends WElementGeometry = WElementGeometry> implements UDrawable {
  private readonly element1: E;
  private readonly element2: E;
  private readonly color: HColorOrPaint;

  /** @see WBSLink.java:55-61 — a missing colour throws IllegalArgumentException. */
  constructor(element1: E, element2: E, color: HColorOrPaint | undefined) {
    if (color === undefined) throw new Error('IllegalArgumentException: WBSLink requires a colour');
    this.element1 = element1;
    this.element2 = element2;
    this.color = color;
  }

  /** @see WBSLink.java:63-65 */
  getElement1(): E {
    return this.element1;
  }

  /** @see WBSLink.java:67-69 */
  getElement2(): E {
    return this.element2;
  }

  /** @see WBSLink.java:71-98 */
  drawU(ug: UGraphic): void {
    const position1 = this.element1.getPosition();
    const position2 = this.element2.getPosition();
    const dim1 = this.element1.getDimension();
    const dim2 = this.element2.getDimension();
    if (position1 === undefined || position2 === undefined || dim1 === undefined || dim2 === undefined) return;

    const rect1 = new XRectangle2D(position1.getDx(), position1.getDy(), dim1.getWidth(), dim1.getHeight());
    const rect2 = new XRectangle2D(position2.getDx(), position2.getDy(), dim2.getWidth(), dim2.getHeight());
    const centres = new XLine2D(rect1.getCenterX(), rect1.getCenterY(), rect2.getCenterX(), rect2.getCenterY());

    const c1 = rect1.intersect(centres);
    const c2 = rect2.intersect(centres);
    // Upstream passes the (possibly null) points straight to XLine2D.line, which NPEs.
    if (c1 === undefined || c2 === undefined) throw new Error('NullPointerException: centre line misses a rectangle');

    const line = XLine2D.line(c1, c2);
    const coloured = ug.apply(new Fore(this.color));
    line.drawU(coloured);
    new ExtremityArrow(c2, line.getAngle()).drawU(coloured);
  }
}
