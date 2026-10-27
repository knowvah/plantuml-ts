import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import type { Display } from '../../../core/klimt/creole/Display.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UDrawable } from '../../../core/klimt/shape/UDrawable.js';
import type { Real } from '../../../core/real/Real.js';
import type { Stereotype } from '../../../core/stereo/Stereotype.js';
import type { Url } from '../../../core/url/Url.js';
import type { LabelStrategy } from '../LabelStrategy.js';
import type { GArrowType } from '../core/GArrowType.js';
import type { GSide } from '../core/GSide.js';
import type { Task } from '../core/Task.js';
import type { CenterBorderColor } from '../lang/CenterBorderColor.js';
import type { FingerPrint } from './FingerPrint.js';

/**
 * TaskDraw -- the drawable row of one task.
 *
 * The two `getY` overloads (java:58, :60) stay overloads; `null` returns and
 * parameters are `undefined`. The `default` method `getLabelOverflow`
 * (java:76-78) is optional here; {@link taskDrawLabelOverflow} supplies the
 * Java default body for an implementer that omits it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:51-82
 */
export interface TaskDraw extends UDrawable {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:53 */
  getTrueRow(): TaskDraw | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:55-56 */
  setColorsAndCompletion(
    colors: CenterBorderColor,
    completion: number,
    url: Url | undefined,
    note: Display | undefined,
    noteStereotype: Stereotype | undefined,
  ): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:58 and :60 */
  getY(stringBounder: StringBounder): Real;
  getY(stringBounder: StringBounder, side: GSide): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:62 */
  drawTitle(ug: UGraphic, labelStrategy: LabelStrategy, colTitles: number, colBars: number): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:64 */
  getTitleWidth(stringBounder: StringBounder): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:66 */
  getFullHeightTask(stringBounder: StringBounder): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:68 */
  getHeightMax(stringBounder: StringBounder): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:70 */
  getTask(): Task;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:72 */
  getFingerPrint(stringBounder: StringBounder): FingerPrint;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:74 */
  getFingerPrintNote(stringBounder: StringBounder): FingerPrint | undefined;

  /**
   * The Java `default` method returns 0 (java:76-78); an implementer that does
   * not override it omits it and callers use {@link taskDrawLabelOverflow}.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:76-78
   */
  getLabelOverflow?(stringBounder: StringBounder, barsWidth: number): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:80 */
  getX(stringBounder: StringBounder, side: GSide, arrowType: GArrowType): number;
}

/**
 * `TaskDraw#getLabelOverflow` with its `default` body: 0 unless overridden.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:76-78
 */
export function taskDrawLabelOverflow(draw: TaskDraw, stringBounder: StringBounder, barsWidth: number): number {
  return draw.getLabelOverflow === undefined ? 0 : draw.getLabelOverflow(stringBounder, barsWidth);
}
