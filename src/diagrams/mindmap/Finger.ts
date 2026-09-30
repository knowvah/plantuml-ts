import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';

/**
 * Finger — one branch side's drawable tree: the node's own box (the
 * "phalanx") and its children (the "nail"), measured along the branch
 * (elongation) and across it (thickness).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Finger.java:41-57
 */
export interface Finger extends UDrawable {
  /** @see Finger.java:43 */
  getPhalanxThickness(stringBounder: StringBounder): number;

  /** @see Finger.java:45 */
  getNailThickness(stringBounder: StringBounder): number;

  /** @see Finger.java:47 */
  getFullThickness(stringBounder: StringBounder): number;

  /** @see Finger.java:49 */
  getPhalanxElongation(stringBounder: StringBounder): number;

  /** @see Finger.java:51 */
  getNailElongation(stringBounder: StringBounder): number;

  /** @see Finger.java:53 */
  getFullElongation(stringBounder: StringBounder): number;

  /** @see Finger.java:55 */
  doNotDrawFirstPhalanx(): void;
}
