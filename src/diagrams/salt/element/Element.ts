import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';

/**
 * Element — one salt widget: measured at a position, drawn at a z-index
 * (`PSystemSalt#getTextBlock` draws the root twice, z 0 then z 1) into the
 * dimension its container settled on.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Element.java:42-48
 */
export interface Element {
  /** @see Element.java:44 */
  getPreferredDimension(stringBounder: StringBounder, x: number, y: number): XDimension2D;

  /** `dimToUse` is nullable as upstream's reference is: tree cells are drawn
   *  with `null` (ElementTreeEntry.java:90, 96). @see Element.java:46 */
  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D | null): void;
}
