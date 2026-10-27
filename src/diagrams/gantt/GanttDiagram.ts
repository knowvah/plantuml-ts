import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { DEFAULT_CLOCK, type Clock } from '../../core/clock.js';
import { HColors } from '../../core/klimt/color/HColors.js';
import type { Display } from '../../core/klimt/creole/Display.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { Stereotype } from '../../core/stereo/Stereotype.js';
import type { HColor } from '../../core/style/Value.js';
import type { UmlSource } from '../../core/TitledDiagram.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import type { LocalDate } from '../../core/time/LocalDate.js';
import type { Moment } from './core/Moment.js';
import { MomentImpl } from './core/MomentImpl.js';
import { Resource } from './core/Resource.js';
import type { Task } from './core/Task.js';
import { TaskAttribute } from './core/TaskAttribute.js';
import { TaskCode } from './core/TaskCode.js';
import { TaskGroup } from './core/TaskGroup.js';
import { TaskImpl } from './core/TaskImpl.js';
import { TaskInstant } from './core/TaskInstant.js';
import { TaskSeparator } from './core/TaskSeparator.js';
import { TaskDrawRegular } from './draw/TaskDrawRegular.js';
import type { TimeHeader } from './draw/header/TimeHeader.js';
import { TimeHeaderFactory } from './draw/header/TimeHeaderFactory.js';
import { GanttConstraint } from './GanttConstraint.js';
import { GanttDiagramConfig } from './GanttDiagramConfig.js';
import { GanttDiagramMainBlock } from './GanttDiagramMainBlock.js';
import type { SkinParam } from './gantt-skin-param.js';
import { CenterBorderColor } from './lang/CenterBorderColor.js';
import type { PiecewiseConstant } from './ngm/math/PiecewiseConstant.js';
import { ImpossibleSolvingException } from './solver/ImpossibleSolvingException.js';
import { TimePoint } from './time/TimePoint.js';

/** `365 * 20`. @see GanttDiagram.java:174 */
const MAX_DURATION_DAYS = 365 * 20;
/** @see GanttDiagram.java:174-175 */
const TOO_LONG_MESSAGE = 'Gantt diagrams cannot last more than 20 years';
/** `private int defaultCompletion = 100`. @see GanttDiagram.java:111 */
const DEFAULT_COMPLETION = 100;
/** `([^:]+)(:(\d+))?`. @see GanttDiagram.java:127 */
const RESOURCE_ASSIGNMENT_PATTERN = /([^:]+)(:(\d+))?/;

/**
 * `String#equalsIgnoreCase`: per UTF-16 unit, equal after `toUpperCase` or after `toLowerCase`.
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html#equalsIgnoreCase(java.lang.String)
 */
function equalsIgnoreCase(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    if (x !== y && x.toUpperCase() !== y.toUpperCase() && x.toLowerCase() !== y.toLowerCase()) return false;
  }
  return true;
}

/**
 * GanttDiagram -- the Gantt diagram model (the calendar/display/style members live in {@link GanttDiagramConfig}, a
 * 500-line split of this file): tasks, resources, constraints, calendar and display state, built
 * through this API and drawn through {@link GanttDiagramMainBlock}.
 *
 * Framework members follow `wbs/WBSDiagram.ts`: the skin param is built by the plugin and passed in (upstream's
 * `TitledDiagram` constructor builds it), `getDescription` answers the text of upstream's `DiagramDescription`, and
 * `getTextBlock` takes the `StringBounder` that `fileFormatOption.getDefaultStringBounder(...)` produces
 * (`UgDiagram.ts:171`). The wall clock upstream reads in `TimePoint.todayAtMidnight()` (`GanttDiagram.java:455-466`)
 * is the injected {@link Clock} (decision D3a).
 *
 * Not ported: `exportTxt` and its private helpers `isDrawable`, `codeOf`, `isRelativeMode`, `relativeDayNum`,
 * `startOf`, `endOf`, `durationOf` (`GanttDiagram.java:593-668`, ATXT output through `asciiverse.ATable` /
 * `InfinitePlan`): the port is an SVG-only library with no text-output path, and no engine ports `exportTxt`. The
 * helpers are called only from it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagram.java:101-690
 */
export class GanttDiagram extends GanttDiagramConfig {
  readonly #clock: Clock;
  #today: TimePoint | undefined = undefined;
  #defaultCompletion = DEFAULT_COMPLETION;

  #it: Task | undefined = undefined;
  #they: Resource | undefined = undefined;
  #currentGroup: TaskGroup | undefined = undefined;

  /** @see GanttDiagram.java:154-157 */
  public constructor(
    source: UmlSource,
    preprocessing: PreprocessingArtifact,
    skinParam: SkinParam,
    clock: Clock = DEFAULT_CLOCK,
  ) {
    super(source, preprocessing, skinParam);
    this.#clock = clock;
  }

  /**
   * T7c routes a returned message to the `final` refusal kind (`PSystemCommandFactory.java:150-153`).
   * @see GanttDiagram.java:171-181
   */
  public checkFinalError(): string | undefined {
    try {
      this.#initMinMax();
      if (this.timeBounds.durationInDays() > MAX_DURATION_DAYS) return TOO_LONG_MESSAGE;
    } catch (ex) {
      if (ex instanceof ImpossibleSolvingException) return ex.message;
      throw ex;
    }
    return undefined;
  }

  /** @see GanttDiagram.java:183-200 */
  public getTextBlock(_num: number, stringBounder: StringBounder): TextBlock {
    const printStart = this.timeBounds.getPrintStart();
    if (printStart === undefined) {
      this.#initMinMax();
    } else {
      this.timeBounds.setMinDay(printStart);
      this.timeBounds.setMaxDay(this.timeBounds.getPrintEnd());
    }
    const factory = new TimeHeaderFactory(
      this.weekConfig,
      this.dayCalendar,
      this.timeBounds,
      this.scaleConfig,
      this.timelineStyle,
    );

    const timeHeader: TimeHeader = factory.createTimeHeader();

    return new GanttDiagramMainBlock(
      this.timeBounds,
      this.modelData,
      this.drawRegistry,
      this.displayConfig,
      this.timelineStyle,
      this,
      timeHeader,
      this.weekConfig.getLocale(),
      stringBounder,
    );
  }

  /** @see GanttDiagram.java:202-204 */
  #initMinMax(): void {
    this.timeBounds.initMinMax(this.modelData, this.dayCalendar);
  }

  /** @see GanttDiagram.java:249-260 */
  public getThenDate(): TimePoint {
    let result = TimePoint.ofStartOfDay(this.timeBounds.getMinDay());
    for (const d of this.dayCalendar.getColorDays()) if (d.compareTo(result) > 0) result = d;

    for (const d of this.dayCalendar.getNameDays().keys()) if (d.compareTo(result) > 0) result = d;

    return result;
  }

  /** @see GanttDiagram.java:262-265 */
  public getExistingTask(id: string): Task | undefined {
    const code = TaskCode.fromId(id);
    return this.modelData.getTask(code);
  }

  /** @see GanttDiagram.java:267-275 */
  public forceTaskOrder(task1: Task, task2: Task): GanttConstraint {
    const end1 = new TaskInstant(task1, TaskAttribute.END);
    task2.setStart(end1.getInstantPrecise());
    const result = new GanttConstraint(
      this.getIHtmlColorSet(),
      this.getSkinParam().getCurrentStyleBuilder(),
      end1,
      new TaskInstant(task2, TaskAttribute.START),
    );
    this.addContraint(result);
    return result;
  }

  /** @see GanttDiagram.java:277-294 */
  public getOrCreateTask(code: TaskCode, linkedToPrevious: boolean): Task {
    let result = this.modelData.getTask(code);
    if (result === undefined) {
      let previous: Task | undefined = undefined;
      if (linkedToPrevious) previous = this.#getLastCreatedTask();

      result = new TaskImpl(
        this,
        this.getSkinParam().getCurrentStyleBuilder(),
        code,
        TimePoint.ofStartOfDay(this.timeBounds.getMinDay()),
        this.#defaultCompletion,
      );
      if (this.#currentGroup !== undefined) this.#currentGroup.addTask(result);

      this.modelData.putTask(code, result);

      if (previous !== undefined) this.forceTaskOrder(previous, result);
    }
    return result;
  }

  /** @see GanttDiagram.java:296-299 */
  public getLoadPlanableForTask(taskId: string): PiecewiseConstant {
    return this.dayCalendar.getOpenClose().mutateMe(this.dayCalendar.getOpenCloseForTask(taskId)).asPiecewiseConstant();
  }

  /** @see GanttDiagram.java:301-308 */
  #getLastCreatedTask(): Task | undefined {
    const all = [...this.modelData.getTasks()];
    for (let i = all.length - 1; i >= 0; i--) if (all[i] instanceof TaskImpl) return all[i];

    return undefined;
  }

  /** @see GanttDiagram.java:310-314 */
  public addSeparator(comment: string): void {
    const separator = new TaskSeparator(
      this.getSkinParam().getCurrentStyleBuilder(),
      comment,
      this.modelData.getTasks().length,
    );
    this.modelData.putTask(separator.getCode(), separator);
  }

  /** @see GanttDiagram.java:316-325 */
  public addGroup(code: TaskCode): CommandExecutionResult {
    const group = new TaskGroup(this.#currentGroup, this.getSkinParam().getCurrentStyleBuilder(), code);

    if (this.#currentGroup !== undefined) this.#currentGroup.addTask(group);

    this.#currentGroup = group;
    this.modelData.putTask(group.getCode(), group);
    return CommandExecutionResult.ok();
  }

  /** @see GanttDiagram.java:327-334 */
  public endGroup(): CommandExecutionResult {
    if (this.#currentGroup === undefined) return CommandExecutionResult.error('No group to be closed');

    this.#currentGroup = this.#currentGroup.getParent();

    return CommandExecutionResult.ok();
  }

  /** Upstream's spelling. @see GanttDiagram.java:336-338 */
  public addContraint(constraint: GanttConstraint): void {
    this.modelData.addConstraint(constraint);
  }

  /** @see GanttDiagram.java:340-346 */
  public updateStartingPoint(start: LocalDate): CommandExecutionResult {
    if (this.modelData.getTasks().length > 0)
      return CommandExecutionResult.error('Starting point must be set before task definition');

    this.timeBounds.setMinDay(start);
    return CommandExecutionResult.ok();
  }

  /** @see GanttDiagram.java:348-350 */
  public getMinDay(): LocalDate {
    return this.timeBounds.getMinDay();
  }

  /** @see GanttDiagram.java:352-355 */
  public getMaxDay(): LocalDate {
    this.#initMinMax();
    return this.timeBounds.getMaxDay();
  }

  /** @see GanttDiagram.java:357-359 */
  public getMinTimePoint(): TimePoint {
    return TimePoint.ofStartOfDay(this.timeBounds.getMinDay());
  }

  /** @see GanttDiagram.java:361-364 */
  public getMaxTimePoint(): TimePoint {
    this.#initMinMax();
    return TimePoint.ofStartOfDay(this.timeBounds.getMaxDay());
  }

  /** @see GanttDiagram.java:378-392 */
  public affectResource(result: Task, description: string): boolean {
    const m = RESOURCE_ASSIGNMENT_PATTERN.exec(description);
    if (m === null) throw new Error('IllegalArgumentException');

    const resource = this.getResource(m[1]!);
    let percentage = 100;
    if (m[3] !== undefined) percentage = Number.parseInt(m[3], 10);

    if (percentage === 0) return false;

    result.addResource(resource, percentage);
    return true;
  }

  /** @see GanttDiagram.java:394-401 */
  public getResource(resourceName: string): Resource {
    let resource = this.modelData.getResource(resourceName);
    if (resource === undefined) resource = new Resource(resourceName);

    this.modelData.putResource(resourceName, resource);
    return resource;
  }

  /** @see GanttDiagram.java:403-421 */
  public getExistingMoment(id: string): Moment | undefined {
    let result: Moment | undefined = this.getExistingTask(id);
    if (result === undefined) {
      let start: TimePoint | undefined = undefined;
      let end: TimePoint | undefined = undefined;
      for (const [key, value] of this.dayCalendar.getNameDays()) {
        if (equalsIgnoreCase(value, id) === false) continue;

        start = min(start, key);
        end = max(end, key);
      }
      if (start !== undefined && end !== undefined) result = new MomentImpl(start, end.increment());
    }
    return result;
  }

  /** The clock replaces the wall clock of `TimePoint.todayAtMidnight()` (D3a). @see GanttDiagram.java:455-461 */
  public getToday(): LocalDate {
    this.#today ??= TimePoint.todayAtMidnight(this.#clock);

    return this.#today.toDay();
  }

  /** @see GanttDiagram.java:463-469 */
  public setTodayColors(colors: CenterBorderColor): void {
    this.#today ??= TimePoint.todayAtMidnight(this.#clock);

    this.dayCalendar.putColorDayToday(
      this.#today,
      // `DayCalendarData` takes the style layer's `HColor`; the centre colour is one (Java has a single `HColor`)
      colors.getCenter() as HColor,
    );
  }

  /** @see GanttDiagram.java:471-474 */
  public setToday(date: LocalDate): CommandExecutionResult {
    this.#today = TimePoint.ofStartOfDay(date);
    return CommandExecutionResult.ok();
  }

  /** @see GanttDiagram.java:476-479 */
  public deleteTask(task: Task): CommandExecutionResult {
    task.setColors(new CenterBorderColor(HColors.WHITE, HColors.BLACK));
    return CommandExecutionResult.ok();
  }

  /** @see GanttDiagram.java:486-495 */
  public addNote(note: Display, stereotype: Stereotype | undefined): CommandExecutionResult {
    let last: Task | undefined = undefined;
    for (const current of this.modelData.getTasks()) last = current;
    if (last === undefined) return CommandExecutionResult.error('No task defined');

    last.setNote(note, stereotype);
    return CommandExecutionResult.ok();
  }

  /** @see GanttDiagram.java:529-531 */
  public setTaskDefaultCompletion(defaultCompletion: number): void {
    this.#defaultCompletion = defaultCompletion;
  }

  /**
   * Java's `(TaskDrawRegular)` cast: a draw of another class is a `ClassCastException`; an unregistered
   * task (null in Java, then a null element) is rejected too -- no caller reads a null draw.
   * @see GanttDiagram.java:533-542
   */
  public getAllTasksForResource(res: Resource): readonly TaskDrawRegular[] {
    const result: TaskDrawRegular[] = [];
    for (const task of this.modelData.getTasks())
      if (task.isAssignedTo(res)) {
        const draw = this.drawRegistry.getTaskDraw(task);
        if (!(draw instanceof TaskDrawRegular)) throw new Error('ClassCastException: not a TaskDrawRegular');
        result.push(draw);
      }

    return Object.freeze(result);
  }

  /** @see GanttDiagram.java:544-546 */
  public setIt(result: Task | undefined): void {
    this.#it = result;
  }

  /** @see GanttDiagram.java:548-550 */
  public getIt(): Task | undefined {
    return this.#it;
  }

  /** @see GanttDiagram.java:552-554 */
  public getThey(): Resource | undefined {
    return this.#they;
  }

  /** @see GanttDiagram.java:556-558 */
  public setThey(they: Resource | undefined): void {
    this.#they = they;
  }

  // exportTxt(OutputStream, int, FileFormat) and its private helpers: GanttDiagram.java:593-668, not ported
  // (see the class doc comment).
}

/** @see GanttDiagram.java:423-429 */
function min(d1: TimePoint | undefined, d2: TimePoint): TimePoint {
  if (d1 === undefined) return d2;

  if (d1.compareTo(d2) > 0) return d2;

  return d1;
}

/** @see GanttDiagram.java:431-437 */
function max(d1: TimePoint | undefined, d2: TimePoint): TimePoint {
  if (d1 === undefined) return d2;

  if (d1.compareTo(d2) < 0) return d2;

  return d1;
}
