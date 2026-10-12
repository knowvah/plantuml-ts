import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import type { Element } from './Element.js';

/**
 * WrappedElement — what `SaltDictionary#get` hands out: the stored element,
 * always measured at (0, 0).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/WrappedElement.java:42-58
 */
export class WrappedElement implements Element {
  /** @see WrappedElement.java:44 */
  private readonly wrapped: Element;

  /** @see WrappedElement.java:46-48 */
  constructor(element: Element) {
    this.wrapped = element;
  }

  /** @see WrappedElement.java:50-52 */
  getPreferredDimension(stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    return this.wrapped.getPreferredDimension(stringBounder, 0, 0);
  }

  /** @see WrappedElement.java:54-56 */
  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D): void {
    this.wrapped.drawU(ug, zIndex, dimToUse);
  }
}
