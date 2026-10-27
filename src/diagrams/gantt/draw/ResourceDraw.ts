import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UDrawable } from '../../../core/klimt/shape/UDrawable.js';

/**
 * ResourceDraw — a drawable resource row.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDraw.java:41-47
 */
export interface ResourceDraw extends UDrawable {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDraw.java:43 */
  getHeight(stringBounder: StringBounder): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDraw.java:45 */
  getY(): number;
}
