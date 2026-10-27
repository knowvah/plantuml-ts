import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import type { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { HColorSet } from '../../core/style/Value.js';
import { paintOf } from './draw/header/TimeHeader.js';
import { GArrowType } from './core/GArrowType.js';
import { GSide } from './core/GSide.js';
import type { Task } from './core/Task.js';
import { TaskAttribute } from './core/TaskAttribute.js';
import type { TaskInstant } from './core/TaskInstant.js';
import type { TaskDrawRegistryData } from './data/TaskDrawRegistryData.js';
import type { TaskDraw } from './draw/TaskDraw.js';
import { GArrows } from './GArrows.js';
import type { TimeScale } from './timescale/TimeScale.js';

/**
 * `source.getMoment() instanceof Task`: every `Task` implementer in this port extends `AbstractTask`
 * (the one `TaskInstant#isTask` tests), and `MomentImpl` is the only non-task `Moment`.
 */
function taskOf(instant: TaskInstant): Task | undefined {
  return instant.isTask() ? (instant.getMoment() as Task) : undefined;
}

/**
 * GanttArrow -- the polyline arrow of one {@link GanttConstraint}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttArrow.java:51-175
 */
export class GanttArrow implements UDrawable {
  readonly #timeScale: TimeScale;
  readonly #atStart: GSide;
  readonly #source: TaskInstant;
  readonly #atEnd: GSide;
  readonly #dest: TaskInstant;

  readonly #colorSet: HColorSet;
  readonly #style: Style;
  readonly #toTaskDraw: TaskDrawRegistryData;
  readonly #styleBuilder: StyleBuilder;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttArrow.java:63-93 */
  public constructor(
    colorSet: HColorSet,
    style: Style,
    timeScale: TimeScale,
    source: TaskInstant,
    dest: TaskInstant,
    toTaskDraw: TaskDrawRegistryData,
    styleBuilder: StyleBuilder,
  ) {
    this.#styleBuilder = styleBuilder;
    this.#toTaskDraw = toTaskDraw;
    this.#style = style;
    this.#colorSet = colorSet;
    this.#timeScale = timeScale;
    this.#source = source;
    this.#dest = dest;
    if (source.getAttribute() === TaskAttribute.END && dest.getAttribute() === TaskAttribute.START) {
      this.#atStart = source.sameRowAs(dest) ? GSide.RIGHT : GSide.BOTTOM_RIGHT;
      this.#atEnd = GSide.LEFT;
    } else if (source.getAttribute() === TaskAttribute.END && dest.getAttribute() === TaskAttribute.END) {
      this.#atStart = GSide.RIGHT;
      this.#atEnd = GSide.RIGHT;
    } else if (source.getAttribute() === TaskAttribute.START && dest.getAttribute() === TaskAttribute.START) {
      this.#atStart = GSide.LEFT;
      this.#atEnd = GSide.LEFT;
    } else if (source.getAttribute() === TaskAttribute.START && dest.getAttribute() === TaskAttribute.END) {
      this.#atStart = source.sameRowAs(dest) ? GSide.LEFT : GSide.BOTTOM_LEFT;
      this.#atEnd = GSide.RIGHT;
    } else {
      throw new Error('IllegalArgumentException');
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttArrow.java:95-100 */
  #getSource(): TaskDraw | undefined {
    const task = taskOf(this.#source);
    if (task !== undefined) return this.#toTaskDraw.getTaskDraw(task);

    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttArrow.java:102-107 */
  #getDestination(): TaskDraw | undefined {
    const task = taskOf(this.#dest);
    if (task !== undefined) return this.#toTaskDraw.getTaskDraw(task);

    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttArrow.java:109-168 */
  public drawU(ug: UGraphic): void {
    ug = this.#style.applyStrokeAndLineColor(ug, this.#colorSet);

    const start = this.#getSource();
    const end = this.#getDestination();
    if (start === undefined || end === undefined) return;

    const stringBounder = ug.getStringBounder();
    let x1 = start.getX(stringBounder, this.#atStart, GArrowType.OUTGOING);
    let y1 = start.getY(stringBounder, this.#atStart);

    const x2 = end.getX(stringBounder, this.#atEnd, GArrowType.INCOMING);
    const y2 = end.getY(stringBounder, this.#atEnd);

    if (this.#atStart.isBottom() && y2 < y1) y1 = start.getY(stringBounder, this.#atStart.reverseBottomTop());

    const minimalWidth = 6;
    const arrows = new GArrows(this.#atEnd, paintOf(this.#style.value('LineColor').asColor(this.#colorSet)));

    if (this.#atStart.isBottom() && this.#atEnd === GSide.LEFT) {
      if (x2 > x1 + minimalWidth) {
        arrows.addPoint(x1, y1);
        arrows.addPoint(x1, y2);
        arrows.addPoint(x2, y2);
      } else {
        x1 = start.getX(stringBounder, GSide.RIGHT, GArrowType.OUTGOING);
        y1 = start.getY(stringBounder, GSide.RIGHT);
        const y1b = end.getY(stringBounder).getCurrentValue();
        arrows.addPoint(x1, y1);
        arrows.addPoint(x1 + 6, y1);
        arrows.addPoint(x1 + 6, y1b);
        arrows.addPoint(x2 - 8, y1b);
        arrows.addPoint(x2 - 8, y2);
        arrows.addPoint(x2, y2);
      }
    } else if (this.#atStart === GSide.RIGHT && this.#atEnd === GSide.RIGHT) {
      const xmax = Math.max(x1, x2) + 8;
      arrows.addPoint(x1, y1);
      arrows.addPoint(xmax, y1);
      arrows.addPoint(xmax, y2);
      arrows.addPoint(x2, y2);
    } else if (this.#atStart === GSide.LEFT && this.#atEnd === GSide.LEFT) {
      const xmin = Math.min(x1, x2) - 8;
      arrows.addPoint(x1, y1);
      arrows.addPoint(xmin, y1);
      arrows.addPoint(xmin, y2);
      arrows.addPoint(x2, y2);
    } /* if (this.atStart == Direction.DOWN && this.atEnd == Direction.LEFT) */ else {
      arrows.addPoint(x1, y1);
      arrows.addPoint(x1, y2);
      arrows.addPoint(x2, y2);
      // } else { throw new IllegalArgumentException(); }   (commented out upstream, java:160-161)
    }

    arrows.drawU(ug);
  }

  /** Private and unused upstream (java:170-173); kept for parity. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttArrow.java:170-173 */
  #getStyleSignatureTask(): StyleSignatureBasic {
    return StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'task');
  }
}
