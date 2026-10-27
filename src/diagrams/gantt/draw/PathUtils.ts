import { XPoint2D } from '../../../core/klimt/geom/XPoint2D.js';
import { UPath } from '../../../core/klimt/shape/UPath.js';

/**
 * PathUtils — the open "U" paths of the gantt task bars.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/PathUtils.java:41-81
 */
export class PathUtils {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/PathUtils.java:43-60 */
  static UtoRight(width: number, height: number, round: number): UPath {
    const result = UPath.none();
    if (round === 0) {
      result.moveTo(0, 0);
      result.lineTo(width, 0);
      result.lineTo(width, height);
      result.lineTo(0, height);
    } else {
      const halfRound = round / 2;
      result.moveTo(0, 0);
      result.lineTo(width - halfRound, 0);
      result.arcTo(new XPoint2D(width, halfRound), halfRound, 0, 1);
      result.lineTo(width, height - halfRound);
      result.arcTo(new XPoint2D(width - halfRound, height), halfRound, 0, 1);
      result.lineTo(0, height);
    }
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/PathUtils.java:62-79 */
  static UtoLeft(width: number, height: number, round: number): UPath {
    const result = UPath.none();
    if (round === 0) {
      result.moveTo(width, height);
      result.lineTo(0, height);
      result.lineTo(0, 0);
      result.lineTo(width, 0);
    } else {
      const halfRound = round / 2;
      result.moveTo(width, height);
      result.lineTo(halfRound, height);
      result.arcTo(new XPoint2D(0, height - halfRound), halfRound, 0, 1);
      result.lineTo(0, halfRound);
      result.arcTo(new XPoint2D(halfRound, 0), halfRound, 0, 1);
      result.lineTo(width, 0);
    }
    return result;
  }
}
