import type { ISkinParamWithSimple } from '../../../core/abel/ISkinParam.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { Real } from '../../../core/real/Real.js';
import type { RealOrigin } from '../../../core/real/RealOrigin.js';
import { RealUtils } from '../../../core/real/RealUtils.js';
import type { Task } from '../core/Task.js';
import { TaskGroup } from '../core/TaskGroup.js';
import { TaskImpl } from '../core/TaskImpl.js';
import { TaskSeparator } from '../core/TaskSeparator.js';
import type { FingerPrint } from '../draw/FingerPrint.js';
import type { ResourceDraw } from '../draw/ResourceDraw.js';
import { ResourceDrawNumbers } from '../draw/ResourceDrawNumbers.js';
import type { TaskDraw } from '../draw/TaskDraw.js';
import { TaskDrawDiamond } from '../draw/TaskDrawDiamond.js';
import { TaskDrawGroup } from '../draw/TaskDrawGroup.js';
import { TaskDrawRegular } from '../draw/TaskDrawRegular.js';
import { TaskDrawSeparator } from '../draw/TaskDrawSeparator.js';
import type { TimeHeader } from '../draw/header/TimeHeader.js';
import { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from '../timescale/TimeScale.js';
import type { DisplayConfigData } from './DisplayConfigData.js';
import type { GanttModelData } from './GanttModelData.js';
import type { TimeBoundsData } from './TimeBoundsData.js';
import type { TimelineStyleData } from './TimelineStyleData.js';

/**
 * Value object containing the mapping from Task to TaskDraw.
 *
 * `LinkedHashMap<Task, TaskDraw>`: no Task class overrides equals/hashCode, so a JS `Map`
 * keyed by the task object (identity) with insertion order is the same map.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TaskDrawRegistryData.java:68
 */
export class TaskDrawRegistryData {
  readonly #origin: RealOrigin = RealUtils.createOrigin();
  readonly #draws = new Map<Task, TaskDraw>();
  #totalHeightWithoutFooter = 0;

  /** @see TaskDrawRegistryData.java:74-76 */
  public getTotalHeightWithoutFooter(): number {
    return this.#totalHeightWithoutFooter;
  }

  /** @see TaskDrawRegistryData.java:78-80 */
  public getOrigin(): RealOrigin {
    return this.#origin;
  }

  /** @see TaskDrawRegistryData.java:82-84 */
  public getTaskDraw(task: Task): TaskDraw | undefined {
    return this.#draws.get(task);
  }

  // Mutators

  /** @see TaskDrawRegistryData.java:88-90 */
  public putTaskDraw(task: Task, draw: TaskDraw): void {
    this.#draws.set(task, draw);
  }

  // Internal access

  /** @see TaskDrawRegistryData.java:94-100 */
  #computeBottomY(stringBounder: StringBounder): number {
    let result = 0;
    for (const td of this.#draws.values())
      result = Math.max(result, td.getY(stringBounder).getCurrentValue() + td.getHeightMax(stringBounder));

    return result;
  }

  /** @see TaskDrawRegistryData.java:102-123 */
  #resolveNoteOverlaps(stringBounder: StringBounder): void {
    const notes: TaskDraw[] = [];
    for (const td of this.#draws.values()) {
      const taskPrint: FingerPrint = td.getFingerPrint(stringBounder);
      const fingerPrintNote = td.getFingerPrintNote(stringBounder);

      if (td.getTrueRow() === undefined)
        for (const note of notes) {
          // Only tasks whose note print exists are pushed into `notes` (:120-121).
          const otherNote = note.getFingerPrintNote(stringBounder) as FingerPrint;
          const deltaY = otherNote.overlap(taskPrint);
          if (deltaY > 0) {
            const bottom = note.getY(stringBounder).addAtLeast(note.getHeightMax(stringBounder));
            td.getY(stringBounder).ensureBiggerThan(bottom);
            this.getOrigin().compileNow();
          }
        }

      if (fingerPrintNote !== undefined) notes.push(td);
    }
  }

  /** @see TaskDrawRegistryData.java:125-142 */
  #createRegularTaskDraw(
    modelData: GanttModelData,
    timeBounds: TimeBoundsData,
    timelineStyle: TimelineStyleData,
    timeScale: TimeScale,
    y: Real,
    task: Task,
    display: string,
  ): TaskDraw {
    let oddEnd: boolean;
    let oddStart: boolean;
    const startForDrawing = timeBounds.getStartForDrawing(task);
    const endForDrawing = timeBounds.getEndForDrawing(task);
    if (timeBounds.getPrintStart() !== undefined) {
      oddStart = TimePoint.ofStartOfDay(timeBounds.getMinDay()).compareTo(startForDrawing) === 0;
      oddEnd = TimePoint.ofStartOfDay(timeBounds.getMaxDay().plusDays(1)).compareTo(endForDrawing) === 0;
    } else {
      oddStart = false;
      oddEnd = false;
    }
    return new TaskDrawRegular(
      timelineStyle.getColorSet(),
      timeScale,
      y,
      display,
      startForDrawing,
      endForDrawing,
      oddStart,
      oddEnd,
      timelineStyle.getSkinParam(),
      task,
      this,
      modelData.getConstraintsForTask(task),
      task.getStyleBuilder(),
    );
  }

  /** @see TaskDrawRegistryData.java:144-184 */
  public buildTaskAndResourceDraws(
    stringBounder: StringBounder,
    timeHeader: TimeHeader,
    modelData: GanttModelData,
    displayConfig: DisplayConfigData,
    timeBounds: TimeBoundsData,
    timelineStyle: TimelineStyleData,
  ): void {
    const timeScale = timeHeader.getTimeScale();
    const headerTotalHeight = timeHeader.getFullHeaderHeight(stringBounder);
    // Java `ISkinParam extends ISkinSimple`; the TS port splits them (ISkinParamWithSimple), the object is the same.
    const skinParam = timelineStyle.getSkinParam() as ISkinParamWithSimple;

    let y: Real = this.getOrigin().addFixed(headerTotalHeight);
    for (const task of modelData.getTasks()) {
      let draw: TaskDraw;
      if (task instanceof TaskSeparator) {
        draw = new TaskDrawSeparator(
          task.getName(),
          timeScale,
          y,
          timeBounds.getMinDay(),
          timeBounds.getMaxDay(),
          task.getStyleBuilder(),
          skinParam,
        );
      } else if (task instanceof TaskGroup) {
        draw = new TaskDrawGroup(
          timelineStyle.getColorSet(),
          timeScale,
          y,
          task.getCode().getDisplay(),
          timeBounds.getStartForDrawing(task),
          timeBounds.getEndForDrawing(task),
          task,
          this,
          task.getStyleBuilder(),
          skinParam,
        );
      } else {
        if (!(task instanceof TaskImpl)) throw new Error('ClassCastException: task is not a TaskImpl');
        const taskLabel = displayConfig.isHideResourceName() ? task.getCode().getDisplay() : task.getPrettyDisplay();
        if (task.isDiamond())
          draw = new TaskDrawDiamond(
            timelineStyle.getColorSet(),
            timeScale,
            y,
            taskLabel,
            timeBounds.getStartForDrawing(task),
            task,
            this,
            task.getStyleBuilder(),
            skinParam,
          );
        else draw = this.#createRegularTaskDraw(modelData, timeBounds, timelineStyle, timeScale, y, task, taskLabel);

        draw.setColorsAndCompletion(
          task.getColors(),
          task.getCompletion(),
          task.getUrl(),
          task.getNote(),
          task.getNoteStereotype(),
        );
      }
      if (task.getRow() === undefined) y = y.addAtLeast(draw.getFullHeightTask(stringBounder));

      this.putTaskDraw(task, draw);
    }
    this.getOrigin().compileNow();
    this.#resolveNoteOverlaps(stringBounder);
    this.#buildResourceDraws(
      stringBounder,
      timeScale,
      modelData,
      displayConfig,
      timeBounds,
      timelineStyle,
      headerTotalHeight,
    );
  }

  /** @see TaskDrawRegistryData.java:186-204 */
  #buildResourceDraws(
    stringBounder: StringBounder,
    timeScale: TimeScale,
    modelData: GanttModelData,
    displayConfig: DisplayConfigData,
    timeBounds: TimeBoundsData,
    timelineStyle: TimelineStyleData,
    fullHeaderHeight: number,
  ): void {
    let yy = this.#computeBottomY(stringBounder);
    if (yy === 0) {
      yy = fullHeaderHeight;
    } else if (!displayConfig.isHideResourceFootbox())
      for (const res of modelData.getResources()) {
        const draw: ResourceDraw = new ResourceDrawNumbers(
          modelData,
          timelineStyle,
          res,
          timeScale,
          yy,
          TimePoint.ofStartOfDay(timeBounds.getMinDay()),
          TimePoint.ofEndOfDayMinusOneSecond(timeBounds.getMaxDay()),
        );
        res.setTaskDraw(draw);
        yy += draw.getHeight(stringBounder);
      }

    this.#totalHeightWithoutFooter = yy;
  }
}
