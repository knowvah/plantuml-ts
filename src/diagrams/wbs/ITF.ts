import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';

/**
 * ITF — one wbs subtree as a text block with four link anchors: `T1`/`T2`
 * the top/bottom centre of its main box, `F1`/`F2` the left/right middle.
 *
 * Upstream's interface is package-private (`net.sourceforge.plantuml.wbs`);
 * this port's module boundary is the file, so it is exported.
 *
 * TS interfaces carry no `default` bodies: both default members are
 * required here, and the `getMainBoxWidth` default body is
 * {@link getMainBoxWidthDefault}, which an implementor that does not
 * override it (`ITFLeaf`) calls. The `setForcedMinWidth` default is a
 * no-op that no implementor inherits (`ITFLeaf` and `ITFComposed` both
 * override it), so it has no helper.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/ITF.java:42-59
 */
export interface ITF extends TextBlock {
  /** @see ITF.java:44 */
  getT1(stringBounder: StringBounder): XPoint2D;
  /** @see ITF.java:46 */
  getT2(stringBounder: StringBounder): XPoint2D;
  /** @see ITF.java:48 */
  getF1(stringBounder: StringBounder): XPoint2D;
  /** @see ITF.java:50 */
  getF2(stringBounder: StringBounder): XPoint2D;
  /** Default {@link getMainBoxWidthDefault}. @see ITF.java:52-54 */
  getMainBoxWidth(stringBounder: StringBounder): number;
  /** Default: no-op. @see ITF.java:56-57 */
  setForcedMinWidth(width: number): void;
}

/** `ITF#getMainBoxWidth`'s default body. @see ITF.java:52-54 */
export function getMainBoxWidthDefault(itf: TextBlock, stringBounder: StringBounder): number {
  return itf.calculateDimension(stringBounder).getWidth();
}
