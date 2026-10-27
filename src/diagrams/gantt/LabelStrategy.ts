import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { LabelPosition } from './LabelPosition.js';

/**
 * LabelStrategy — where a task title goes and how it aligns.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/LabelStrategy.java:40-66
 */
export class LabelStrategy {
  private readonly position: LabelPosition;
  private readonly alignment: HorizontalAlignment;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/LabelStrategy.java:45-48 */
  constructor(position: LabelPosition, alignment: HorizontalAlignment) {
    this.position = position;
    this.alignment = alignment;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/LabelStrategy.java:50-52 */
  titleInFirstColumn(): boolean {
    return this.position === LabelPosition.FIRST_COLUMN;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/LabelStrategy.java:54-56 */
  titleInLastColumn(): boolean {
    return this.position === LabelPosition.LAST_COLUMN;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/LabelStrategy.java:58-60 */
  titleInside(): boolean {
    return this.position === LabelPosition.LEGACY;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/LabelStrategy.java:62-64 */
  rightAligned(): boolean {
    return this.alignment === HorizontalAlignment.RIGHT;
  }
}
