import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { SName } from '../../core/style/SName.js';
import type { Style } from '../../core/style/Style.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { HColor } from '../../core/style/Value.js';
import type { UmlSource } from '../../core/TitledDiagram.js';
import { TitledDiagram } from '../../core/TitledDiagram.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import type { DayOfWeek } from '../../core/time/DayOfWeek.js';
import { Duration } from '../../core/time/Duration.js';
import type { LocalDate } from '../../core/time/LocalDate.js';
import { newLocale } from '../../core/utils/I18nTimeData.js';
import type { PrintScale } from './core/PrintScale.js';
import type { TimeRange } from './core/TimeRange.js';
import { DayCalendarData } from './data/DayCalendarData.js';
import { DisplayConfigData } from './data/DisplayConfigData.js';
import { GanttModelData } from './data/GanttModelData.js';
import { TaskDrawRegistryData } from './data/TaskDrawRegistryData.js';
import { TimeBoundsData } from './data/TimeBoundsData.js';
import { TimeScaleConfigData } from './data/TimeScaleConfigData.js';
import { TimelineStyleData } from './data/TimelineStyleData.js';
import { WeekConfigData } from './data/WeekConfigData.js';
import type { WeeklyHeaderStrategy } from './draw/WeeklyHeaderStrategy.js';
import type { GanttStyle } from './GanttStyle.js';
import { GanttTaskTableColumn } from './GanttTaskTableColumn.js';
import type { SkinParam } from './gantt-skin-param.js';
import type { PiecewiseConstant } from './ngm/math/PiecewiseConstant.js';
import { TimePoint } from './time/TimePoint.js';
import { WeekNumberStrategy } from './time/WeekNumberStrategy.js';

/** `return 96`. @see GanttDiagram.java:159-161 */
const DPI = 96;
/** `return 30`. @see GanttDiagram.java:370-372 */
const DAYS_IN_MONTH = 30;
/** `getDescription()`. @see GanttDiagram.java:134-136 */
const DESCRIPTION = '(Gantt)';

/** `LocalDate` carries `toEpochDay`; `DayOfWeek` is an enum object without it. */
function isLocalDate(day: LocalDate | DayOfWeek): day is LocalDate {
  return 'toEpochDay' in day;
}

/**
 * GanttDiagramConfig -- the calendar, display, scale, week and style half of `GanttDiagram`: every member that only
 * reads or writes the `*Data` registries and the skin param. A 500-line split of `GanttDiagram.ts` (the file limit);
 * the members keep their upstream names and `@see` lines, and `GanttDiagram extends GanttDiagramConfig`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagram.java:101-690
 */
export abstract class GanttDiagramConfig extends TitledDiagram implements GanttStyle {
  protected readonly modelData = new GanttModelData();
  protected readonly timeBounds = new TimeBoundsData();
  protected readonly scaleConfig = new TimeScaleConfigData();
  protected readonly weekConfig = new WeekConfigData();
  protected readonly dayCalendar = new DayCalendarData();
  protected readonly displayConfig = new DisplayConfigData();
  protected readonly drawRegistry = new TaskDrawRegistryData();
  protected readonly timelineStyle: TimelineStyleData;
  protected readonly skinParam: SkinParam;

  /** The shared half of `GanttDiagram.java:154-157`: `timelineStyle = new TimelineStyleData(getSkinParam(), this, HColorSet.instance())`. */
  protected constructor(source: UmlSource, preprocessing: PreprocessingArtifact, skinParam: SkinParam) {
    super(source, 'GANTT', undefined, preprocessing);
    this.skinParam = skinParam;
    this.timelineStyle = new TimelineStyleData(skinParam, this, HColorSet.instance());
  }

  /** `EnumSet.of(START, END, DURATION)`, iterated in ordinal order. @see GanttDiagram.java:672-673 */
  protected readonly displayedColumn = new Set<GanttTaskTableColumn>([
    GanttTaskTableColumn.START,
    GanttTaskTableColumn.END,
    GanttTaskTableColumn.DURATION,
  ]);

  public getSkinParam(): SkinParam {
    return this.skinParam;
  }

  /** @see GanttDiagram.java:129-132 */
  public changeLanguage(lang: string): CommandExecutionResult {
    this.weekConfig.setLocale(newLocale(lang));
    return CommandExecutionResult.ok();
  }

  /** @see GanttDiagram.java:134-136 */
  public getDescription(): string {
    return DESCRIPTION;
  }

  /** @see GanttDiagram.java:138-140 */
  public setWeekNumberStrategy(firstDayOfWeek: DayOfWeek, minimalDaysInFirstWeek: number): void {
    this.weekConfig.setWeekNumberStrategy(new WeekNumberStrategy(firstDayOfWeek, minimalDaysInFirstWeek));
  }

  /** `getDpi(FileFormatOption)` ignores its argument. @see GanttDiagram.java:159-161 */
  public getDpi(): number {
    return DPI;
  }

  /** @see GanttDiagram.java:163-165 */
  public setPrintScale(printScale: PrintScale): void {
    this.scaleConfig.setPrintScale(printScale);
  }

  /** @see GanttDiagram.java:167-169 */
  public setFactorScale(factorScale: number): void {
    this.scaleConfig.setFactorScale(factorScale);
  }

  /**
   * `getCurrentStyleBuilder()` is `TitledDiagram.java:129-131` = `skinParam.getCurrentStyleBuilder()`;
   * Java's `getMergedStyle` is non-null, so an unresolved signature is its NPE.
   * @see GanttDiagram.java:206-216
   */
  public getStyle(param: SName, param2?: SName): Style {
    const names: SName[] = ['root', 'element', 'ganttDiagram', param];
    if (param2 !== undefined) names.push(param2);
    const merged = StyleSignatureBasic.of(...names).getMergedStyle(this.getSkinParam().getCurrentStyleBuilder());
    if (merged === undefined) throw new Error('NullPointerException: no style for ' + names.join('.'));
    return merged;
  }

  /** @see GanttDiagram.java:218-220 */
  public getDefaultStyleDefinitionArrow(): StyleSignatureBasic {
    return StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'arrow');
  }

  /** `task` is unused upstream. @see GanttDiagram.java:222-224 */
  public closeDayOfWeek(day: DayOfWeek, _task: string): void {
    this.dayCalendar.getOpenClose().close(day);
  }

  /** @see GanttDiagram.java:226-231 */
  public openDayOfWeek(day: DayOfWeek, task: string): void {
    if (task.length === 0) this.dayCalendar.getOpenClose().open(day);
    else this.dayCalendar.getOpenCloseForTask(task).open(day);
  }

  /** @see GanttDiagram.java:233-239 */
  public closeDayAsDate(day: LocalDate, task: string): void {
    if (task.length === 0) this.dayCalendar.getOpenClose().close(day);
    else this.dayCalendar.getOpenCloseForTask(task).close(day);
  }

  /** @see GanttDiagram.java:241-247 */
  public openDayAsDate(day: LocalDate, task: string): void {
    if (task.length === 0) this.dayCalendar.getOpenClose().open(day);
    else this.dayCalendar.getOpenCloseForTask(task).open(day);
  }

  /** @see GanttDiagram.java:366-368 */
  public daysInWeek(): number {
    return this.dayCalendar.getOpenClose().daysInWeek();
  }

  /** @see GanttDiagram.java:370-372 */
  public daysInMonth(): number {
    return DAYS_IN_MONTH;
  }

  /** @see GanttDiagram.java:374-376 */
  public isOpen(day: LocalDate): boolean {
    return this.dayCalendar.isOpen(day);
  }

  /** `colorDay(LocalDate, HColor)`. @see GanttDiagram.java:437-439 */
  public colorDay(day: LocalDate, color: HColor): void;
  /** `colorDay(DayOfWeek, HColor)`. @see GanttDiagram.java:441-443 */
  public colorDay(day: DayOfWeek, color: HColor): void;
  public colorDay(day: LocalDate | DayOfWeek, color: HColor): void {
    // Java dispatches on the static type; the two types are distinct classes.
    if (isLocalDate(day)) this.dayCalendar.putColorDay(TimePoint.ofStartOfDay(day), color);
    else this.dayCalendar.putColorDayOfWeek(day, color);
  }

  /** @see GanttDiagram.java:445-447 */
  public nameDay(day: LocalDate, name: string): void {
    this.dayCalendar.putNameDay(TimePoint.ofStartOfDay(day), name);
  }

  /** @see GanttDiagram.java:481-484 */
  public setPrintInterval(start: LocalDate, end: LocalDate): void {
    this.timeBounds.setPrintStart(start);
    this.timeBounds.setPrintEnd(end);
  }

  /** @see GanttDiagram.java:497-499 */
  public setShowFootbox(footbox: boolean): void {
    this.displayConfig.setShowFootbox(footbox);
  }

  /** @see GanttDiagram.java:501-504 */
  public override getDefaultMargins(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.none();
  }

  /** @see GanttDiagram.java:510-513 */
  public setWeeklyHeaderStrategy(weeklyHeaderStrategy: WeeklyHeaderStrategy, weekStartingNumber: number): void {
    this.weekConfig.setWeeklyHeaderStrategy(weeklyHeaderStrategy);
    this.weekConfig.setWeekStartingNumber(weekStartingNumber);
  }

  /** @see GanttDiagram.java:515-518 */
  public hideResourceName(): CommandExecutionResult {
    this.displayConfig.setHideResourceName(true);
    return CommandExecutionResult.ok();
  }

  /** @see GanttDiagram.java:520-523 */
  public hideResourceFootbox(): CommandExecutionResult {
    this.displayConfig.setHideResourceFootbox(true);
    return CommandExecutionResult.ok();
  }

  /** @see GanttDiagram.java:525-527 */
  public addVerticalSeparatorBefore(day: LocalDate): void {
    this.dayCalendar.addSeparatorBefore(day);
  }

  /** @see GanttDiagram.java:560-562 */
  public setHideClosed(hideClosed: boolean): void {
    this.scaleConfig.setHideClosed(hideClosed);
  }

  /** @see GanttDiagram.java:564-566 */
  public getDefaultPlan(): PiecewiseConstant {
    return this.dayCalendar.getDefaultPlan();
  }

  /** Returns the klimt `HColorSet` (`getColor` included), not the style-layer slice. @see GanttDiagram.java:568-570, HColorSet.java:58-76 */
  public getIHtmlColorSet(): HColorSet {
    return this.timelineStyle.getColorSet();
  }

  /** @see GanttDiagram.java:572-575 */
  public addWorkingTimeRange(timeRange: TimeRange): CommandExecutionResult {
    this.dayCalendar.addWorkingTimeRange(timeRange);
    return CommandExecutionResult.ok();
  }

  /** @see GanttDiagram.java:577-579 */
  public durationOfDays(totalDays: number): Duration {
    return this.dayCalendar.durationOfDays(totalDays);
  }

  /** @see GanttDiagram.java:581-584 */
  public durationOfDaysAndHours(totalDays: number, totalHours: number): Duration {
    const result = this.durationOfDays(totalDays);
    return result.plus(Duration.ofHours(totalHours));
  }

  /** @see GanttDiagram.java:586-591 */
  public durationOfDaysHoursMinutesSeconds(
    totalDays: number,
    totalHours: number,
    totalMinutes: number,
    totalSeconds: number,
  ): Duration {
    return this.durationOfDays(totalDays).plusHours(totalHours).plusMinutes(totalMinutes).plusSeconds(totalSeconds);
  }

  /** @see GanttDiagram.java:675-682 */
  public hideOrShowColumn(show: boolean, column: GanttTaskTableColumn | undefined): CommandExecutionResult {
    if (column !== undefined) {
      if (show) this.displayedColumn.add(column);
      else this.displayedColumn.delete(column);
    }
    return CommandExecutionResult.ok();
  }

  /**
   * An `EnumSet` iterates in ordinal order, not insertion order.
   * @see GanttDiagram.java:684-686
   */
  public getDisplayedColumn(): readonly GanttTaskTableColumn[] {
    return GanttTaskTableColumn.values().filter((c) => this.displayedColumn.has(c));
  }
}
