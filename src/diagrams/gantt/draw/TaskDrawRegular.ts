import type { ISkinParam, ISkinParamWithSimple } from '../../../core/abel/ISkinParam.js';
import { Back } from '../../../core/klimt/Back.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { Display } from '../../../core/klimt/creole/Display.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import type { Real } from '../../../core/real/Real.js';
import { Segment } from '../../../core/sequencediagram/graphic/Segment.js';
import type { StyleBuilder } from '../../../core/style/StyleBuilder.js';
import type { StyleSignature } from '../../../core/style/StyleSignature.js';
import { StyleSignatureBasic } from '../../../core/style/StyleSignatureBasic.js';
import type { HColorSet } from '../../../core/style/Value.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { GanttConstraint } from '../GanttConstraint.js';
import type { LabelStrategy } from '../LabelStrategy.js';
import { GArrowType } from '../core/GArrowType.js';
import { GSide } from '../core/GSide.js';
import type { Task } from '../core/Task.js';
import { TaskImpl } from '../core/TaskImpl.js';
import type { TaskDrawRegistryData } from '../data/TaskDrawRegistryData.js';
import { PiecewiseConstantUtils } from '../ngm/math/PiecewiseConstantUtils.js';
import { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from '../timescale/TimeScale.js';
import { AbstractTaskDraw, closeUrl, mergedStyleOf, startUrl } from './AbstractTaskDraw.js';
import { FingerPrint } from './FingerPrint.js';
import { RectangleTask } from './RectangleTask.js';
import { createLeftTextBlock, paintOf } from './header/TimeHeader.js';

/** The inset of the in-bar label on each side (`TaskDrawRegular.java:130-131,168-169`). */
const LABEL_INSET = 6;
/** Distance of an out-of-bar label from the bar end (`getOutPosition`, java:150). */
const OUT_POSITION = 8;
/** Same, when an arrow leaves the bar's right end (java:148). */
const OUT_POSITION_WITH_ARROW = 18;
/** Inset of the top/bottom arrow anchors from the bar ends (java:247-253). */
const ARROW_INSET = 8;

/**
 * TaskDrawRegular -- the bar of a regular task.
 *
 * `paused` is a `TreeSet<LocalDate>`: sorted and de-duplicated by `LocalDate#compareTo`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:76-308
 */
export class TaskDrawRegular extends AbstractTaskDraw {
  readonly #end: TimePoint;
  readonly #oddStart: boolean;
  readonly #oddEnd: boolean;
  readonly #paused: LocalDate[];
  readonly #constraints: readonly GanttConstraint[];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:84-98 */
  public constructor(
    colorSet: HColorSet,
    timeScale: TimeScale,
    y: Real,
    prettyDisplay: string,
    start: TimePoint,
    end: TimePoint,
    oddStart: boolean,
    oddEnd: boolean,
    skinParam: ISkinParam,
    task: Task,
    toTaskDraw: TaskDrawRegistryData,
    constraints: readonly GanttConstraint[],
    styleBuilder: StyleBuilder,
  ) {
    // Java `ISkinParam extends ISkinSimple`; the port splits them (ISkinParamWithSimple), the object is the same
    // (same cast as `TaskDrawRegistryData#buildTaskAndResourceDraws`).
    super(
      colorSet,
      timeScale,
      y,
      prettyDisplay,
      start,
      task,
      toTaskDraw,
      styleBuilder,
      skinParam as ISkinParamWithSimple,
    );
    if (!(task instanceof TaskImpl)) throw new Error('ClassCastException: task is not a TaskImpl');
    this.#constraints = constraints;
    this.#end = end;
    this.#oddStart = oddStart;
    this.#oddEnd = oddEnd;
    const paused = [...task.getAllPaused()];
    const defaultPlan = task.getDefaultPlan();
    for (let tmp = start; tmp.compareTo(end) <= 0; tmp = tmp.increment())
      if (PiecewiseConstantUtils.isZeroOnDay(defaultPlan, tmp.toDay())) paused.push(tmp.toDay());

    // TreeSet: ordered, no duplicates.
    paused.sort((a, b) => a.compareTo(b));
    this.#paused = paused.filter((day, i) => i === 0 || day.compareTo(paused[i - 1] as LocalDate) !== 0);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:101-105 */
  public getShapeHeight(stringBounder: StringBounder): number {
    const style = this.getStyle();
    const padding = style.getPadding();
    return padding.getTop() + this.getTitle().calculateDimension(stringBounder).getHeight() + padding.getBottom();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:108-138 */
  public drawTitle(ug: UGraphic, labelStrategy: LabelStrategy, colTitles: number, colBars: number): void {
    const title = this.getTitle();
    const stringBounder = ug.getStringBounder();
    const dim = title.calculateDimension(stringBounder);

    const style = mergedStyleOf(this.getStyleSignature(), this.getStyleBuilder());
    const margin = style.getMargin();
    const padding = style.getPadding();

    ug = ug.apply(UTranslate.dy(margin.getTop() + padding.getTop()));

    if (labelStrategy.titleInFirstColumn()) {
      if (labelStrategy.rightAligned())
        title.drawU(ug.apply(UTranslate.dx(colTitles - dim.getWidth() - margin.getRight())));
      else title.drawU(ug.apply(UTranslate.dx(margin.getLeft())));
      return;
    } else if (labelStrategy.titleInLastColumn()) {
      title.drawU(ug.apply(UTranslate.dx(colBars + margin.getLeft())));
      return;
    }

    const pos1 = this.timeScale.getPosition(this.start) + LABEL_INSET;
    const pos2 = this.timeScale.getPosition(this.#end) - LABEL_INSET;
    let pos: number;
    if (pos2 - pos1 > dim.getWidth()) pos = pos1;
    else pos = this.#getOutPosition(pos2);
    title.drawU(ug.apply(UTranslate.dx(pos)));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:141-144 */
  protected getTitle(): TextBlock {
    return createLeftTextBlock(
      Display.getWithNewlines(this.getPragma(), this.prettyDisplay),
      this.getFontConfiguration(),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:146-151 */
  #getOutPosition(pos2: number): number {
    if (this.#isThereRightArrow()) return pos2 + OUT_POSITION_WITH_ARROW;

    return pos2 + OUT_POSITION;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:153-159 */
  #isThereRightArrow(): boolean {
    for (const constraint of this.#constraints) if (constraint.isThereRightArrow(this.getTask())) return true;

    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:162-184 */
  public getLabelOverflow(stringBounder: StringBounder, barsWidth: number): number {
    let overflow = 0;

    const title = this.getTitle();
    const dim = title.calculateDimension(stringBounder);

    const pos1 = this.timeScale.getPosition(this.start) + LABEL_INSET;
    const pos2 = this.timeScale.getPosition(this.#end) - LABEL_INSET;
    if (pos2 - pos1 <= dim.getWidth()) {
      const labelEnd = this.#getOutPosition(pos2) + dim.getWidth();
      if (labelEnd > barsWidth) overflow = labelEnd - barsWidth;
    }

    if (this.note !== undefined) {
      const noteEnd =
        this.timeScale.getPosition(this.start) + this.getOpaleNote().calculateDimension(stringBounder).getWidth();
      if (noteEnd - barsWidth > overflow) overflow = noteEnd - barsWidth;
    }

    return overflow;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:187-190 */
  protected getStyleSignature(): StyleSignature {
    return StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'task').withTOBECHANGED(
      this.getTask().getStereotype(),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:192-197 */
  public drawU(ug: UGraphic): void {
    const startPos = this.timeScale.getPosition(this.start);
    this.drawNote(ug.apply(new UTranslate(startPos, this.#getYNotePosition(ug.getStringBounder()))));

    this.drawShape(ug);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:199-203 */
  #getYNotePosition(stringBounder: StringBounder): number {
    const style = this.getStyle();
    const margin = style.getMargin();
    return margin.getTop() + this.getShapeHeight(stringBounder) + margin.getBottom();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:206-211 */
  public getHeightMax(stringBounder: StringBounder): number {
    if (this.note === undefined) return this.getFullHeightTask(stringBounder);

    return this.#getYNotePosition(stringBounder) + this.getOpaleNote().calculateDimension(stringBounder).getHeight();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:213-218 */
  public getFingerPrint(stringBounder: StringBounder): FingerPrint {
    const h = this.getFullHeightTask(stringBounder);
    const startPos = this.timeScale.getPosition(this.start);
    const endPos = this.timeScale.getPosition(this.#end);
    return new FingerPrint(startPos, this.getY(stringBounder).getCurrentValue(), endPos - startPos, h);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:220-229 */
  public getFingerPrintNote(stringBounder: StringBounder): FingerPrint | undefined {
    if (this.note === undefined) return undefined;

    const dim = this.getOpaleNote().calculateDimension(stringBounder);
    const startPos = this.timeScale.getPosition(this.start);
    // final double endPos = timeScale.getEndingPosition(end);
    return new FingerPrint(
      startPos,
      this.getY(stringBounder).getCurrentValue() + this.#getYNotePosition(stringBounder),
      dim.getWidth(),
      dim.getHeight(),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:231-237 */
  #applyColors(ug: UGraphic): UGraphic {
    const col = this.getColors();
    if (col !== undefined && col.isOk()) return col.apply(ug);

    return ug.apply(new Fore(this.getLineColor())).apply(new Back(this.getBackgroundColor()));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:240-269 */
  public getX(_stringBounder: StringBounder, side: GSide, arrowType: GArrowType): number {
    const timeScale = this.timeScale;
    let x: number;
    if (side === GSide.LEFT) x = timeScale.getPosition(this.start);
    else if (side === GSide.RIGHT) x = timeScale.getPosition(this.#end);
    else if (side === GSide.TOP_LEFT || side === GSide.BOTTOM_LEFT) {
      x = timeScale.getPosition(this.start) + ARROW_INSET;
      if (x > timeScale.getPosition(this.#end))
        x =
          (timeScale.getPosition(this.start) + timeScale.getPosition(this.start) + timeScale.getWidth(this.start)) / 2;
    } else if (side === GSide.TOP_RIGHT || side === GSide.BOTTOM_RIGHT) {
      x = timeScale.getPosition(this.#end) - ARROW_INSET;
      if (x < timeScale.getPosition(this.start) + timeScale.getWidth(this.start))
        x = timeScale.getPosition(this.#end) - ARROW_INSET;
      // x = (timeScale.getPosition(end) + timeScale.getPosition(end) + timeScale.getWidth(end)) / 2;
    } else throw new Error('IllegalArgumentException');

    if (arrowType === GArrowType.OUTGOING) {
      const style = mergedStyleOf(this.getStyleSignature(), this.getStyleBuilder());
      const margin = style.getMargin();
      if (side === GSide.LEFT) x += margin.getLeft();
      else if (side === GSide.RIGHT) x -= margin.getLeft();
    }

    return x;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java:271-306 */
  public drawShape(ug: UGraphic): void {
    ug = this.#applyColors(ug);
    const style = mergedStyleOf(this.getStyleSignature(), this.getStyleBuilder());
    const margin = style.getMargin();

    const startPos = this.timeScale.getPosition(this.start) + margin.getLeft();
    const endPos = this.timeScale.getPosition(this.#end) - margin.getRight();

    if (this.url !== undefined) startUrl(ug, this.url);

    ug = ug.apply(UTranslate.dy(margin.getTop()));

    const stringBounder = ug.getStringBounder();

    const round = style.value('RoundCorner').asDouble();

    const off: Segment[] = [];
    for (const day of this.#paused) {
      const pause = TimePoint.ofStartOfDay(day);
      const x1 = this.timeScale.getPosition(pause);
      const x2 = this.timeScale.getPosition(pause) + this.timeScale.getWidth(pause);
      off.push(new Segment(x1, x2));
    }

    const backUndone = mergedStyleOf(
      StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'undone'),
      this.getStyleBuilder(),
    )
      .value('BackGroundColor')
      .asColor(this.getColorSet());

    const rectangleTask = new RectangleTask(startPos, endPos, round, this.getCompletion(), off);

    rectangleTask.draw(ug, this.getShapeHeight(stringBounder), paintOf(backUndone), this.#oddStart, this.#oddEnd);

    if (this.url !== undefined) closeUrl(ug);
  }
}
