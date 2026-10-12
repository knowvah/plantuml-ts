import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { AbstractElement } from './AbstractElement.js';

/**
 * ElementEmpty — a 1 x 1 placeholder cell that draws nothing.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementEmpty.java:42-51
 */
export class ElementEmpty extends AbstractElement {
  /** @see ElementEmpty.java:44-46 */
  getPreferredDimension(_stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    return new XDimension2D(1, 1);
  }

  /** @see ElementEmpty.java:48-49 */
  drawU(_ug: UGraphic, _zIndex: number, _dimToUse: XDimension2D): void {}
}
