import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { Display } from '../../core/klimt/creole/Display.js';
import type { FontConfiguration } from '../../core/abel/FontConfiguration.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import type { ISkinParam } from '../../core/abel/ISkinParam.js';
import type { Style } from '../../core/style/Style.js';
import { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { Locale } from '../../core/utils/I18nTimeData.js';
import type { Task } from './core/Task.js';
import { TaskImpl } from './core/TaskImpl.js';
import type { GanttModelData } from './data/GanttModelData.js';
import type { TaskDrawRegistryData } from './data/TaskDrawRegistryData.js';
import type { TimeBoundsData } from './data/TimeBoundsData.js';
import type { TimelineStyleData } from './data/TimelineStyleData.js';
import { applyForeColor, createLeftTextBlock, emojiStoreOf } from './draw/header/TimeHeader.js';
import { Context, type GanttTaskTableColumn } from './GanttTaskTableColumn.js';
import { TimePoint } from './time/TimePoint.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:77 */
const CELL_PADDING = 5;

/**
 * `ISkinParam#getCurrentStyleBuilder`: the abel layer's `ISkinParam` answers an opaque `object`
 * (`src/core/abel/ISkinParam.ts` `StyleBuilder` stand-in); Java has one `StyleBuilder` class, so narrow
 * to the real one at this seam.
 */
export function currentStyleBuilder(skinParam: ISkinParam): StyleBuilder {
  const builder = skinParam.getCurrentStyleBuilder();
  if (builder instanceof StyleBuilder) return builder;
  throw new Error('ClassCastException: the skin param answers a StyleBuilder that is not a style/StyleBuilder');
}

/**
 * Draws, on the left side of a Gantt diagram, a textual table giving for each task its code, its start date,
 * its end date and its duration (in days). Each row is vertically aligned with the corresponding task bar.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:71-206
 */
export class GanttTaskTable {
  readonly #modelData: GanttModelData;
  readonly #timeBounds: TimeBoundsData;
  readonly #drawRegistry: TaskDrawRegistryData;
  readonly #timelineStyle: TimelineStyleData;
  readonly #locale: Locale;
  readonly #headerHeight: number;

  readonly #context: Context;
  readonly #displayedColumn: readonly GanttTaskTableColumn[];

  /**
   * One boundary per column edge: columnEdges[0] is the left border, the last entry is the right border of
   * the last column. With N displayed columns there are N+1 edges.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:90-92
   */
  readonly #columnEdges: number[];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:94-112 */
  public constructor(
    modelData: GanttModelData,
    timeBounds: TimeBoundsData,
    drawRegistry: TaskDrawRegistryData,
    timelineStyle: TimelineStyleData,
    headerHeight: number,
    locale: Locale,
    stringBounder: StringBounder,
    displayedColumn: readonly GanttTaskTableColumn[],
  ) {
    this.#displayedColumn = displayedColumn;
    this.#modelData = modelData;
    this.#timeBounds = timeBounds;
    this.#drawRegistry = drawRegistry;
    this.#timelineStyle = timelineStyle;
    this.#headerHeight = headerHeight;
    this.#locale = locale;
    this.#context = new Context(locale, this.#isRelativeMode(), timeBounds.getMinDay());

    this.#columnEdges = new Array<number>(displayedColumn.length + 1).fill(0);
    this.#columnEdges[0] = 0;
    for (let i = 0; i < displayedColumn.length; i++) {
      const colWidth = this.#columnWidth(stringBounder, displayedColumn[i]!);
      this.#columnEdges[i + 1] = this.#columnEdges[i]! + colWidth;
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:114-122 */
  #columnWidth(stringBounder: StringBounder, column: GanttTaskTableColumn): number {
    let width = this.#widthOf(stringBounder, column.header(this.#locale));
    for (const task of this.#modelData.getTasks()) {
      if (this.#isDrawable(task) === false) continue;

      width = Math.max(width, this.#widthOf(stringBounder, column.valueOf(task, this.#context)));
    }
    return width + 2 * CELL_PADDING;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:124-126 */
  public getWidth(): number {
    return this.#columnEdges[this.#columnEdges.length - 1]!;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:128-143 */
  public drawU(ug: UGraphic, totalHeightWithoutFooter: number): void {
    const stringBounder = ug.getStringBounder();
    const line = this.#timelineStyle.getLineColor();

    this.#drawGrid(applyForeColor(ug, line), totalHeightWithoutFooter);

    this.#drawHeaderRow(ug, this.#headerHeight / 2);

    for (const task of this.#modelData.getTasks()) {
      if (this.#isDrawable(task) === false) continue;

      // `isDrawable` has just checked the registry holds a draw for `task` (java:182).
      const draw = this.#drawRegistry.getTaskDraw(task)!;
      const yCenter = draw.getY(stringBounder).getCurrentValue() + draw.getFullHeightTask(stringBounder) / 2;
      this.#drawTaskRow(ug, yCenter, task);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:145-154 */
  #drawGrid(ug: UGraphic, totalHeightWithoutFooter: number): void {
    const width = this.getWidth();

    ug.draw(ULine.hline(width));
    ug.apply(UTranslate.dy(this.#headerHeight)).draw(ULine.hline(width));
    ug.apply(UTranslate.dy(totalHeightWithoutFooter)).draw(ULine.hline(width));

    for (const x of this.#columnEdges) ug.apply(UTranslate.dx(x)).draw(ULine.vline(totalHeightWithoutFooter));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:156-159 */
  #drawHeaderRow(ug: UGraphic, yCenter: number): void {
    for (let i = 0; i < this.#displayedColumn.length; i++)
      this.#drawCell(ug, this.#columnEdges[i]!, yCenter, this.#displayedColumn[i]!.header(this.#locale));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:161-164 */
  #drawTaskRow(ug: UGraphic, yCenter: number, task: Task): void {
    for (let i = 0; i < this.#displayedColumn.length; i++)
      this.#drawCell(ug, this.#columnEdges[i]!, yCenter, this.#displayedColumn[i]!.valueOf(task, this.#context));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:166-171 */
  #drawCell(ug: UGraphic, xLeft: number, yCenter: number, text: string): void {
    const stringBounder = ug.getStringBounder();
    const block = this.#createTextBlock(text);
    const dim = block.calculateDimension(stringBounder);
    block.drawU(ug.apply(new UTranslate(xLeft + CELL_PADDING, yCenter - dim.getHeight() / 2)));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:173-183 */
  #isDrawable(task: Task): boolean {
    if (task instanceof TaskImpl === false) return false;

    if (this.#timeBounds.isHidden(task)) return false;

    if (this.#drawRegistry.getTaskDraw(task) === undefined) return false;

    return true;
  }

  /** `LocalDate#equals` against `TimePoint.epoch()`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:185-187 */
  #isRelativeMode(): boolean {
    return this.#timeBounds.getMinDay().equals(TimePoint.epoch());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:189-191 */
  #widthOf(stringBounder: StringBounder, text: string): number {
    return this.#createTextBlock(text).calculateDimension(stringBounder).getWidth();
  }

  /** `Display#create(fc, LEFT, new SpriteContainerEmpty())`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:193-196 */
  #createTextBlock(text: string): TextBlock {
    return createLeftTextBlock(
      Display.getWithNewlines(this.#timelineStyle.getPragma(), text),
      this.#getFontConfiguration(),
      emojiStoreOf(this.#timelineStyle.getSkinParam()),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:198-201 */
  #getStyle(): Style {
    const style = StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'timeline').getMergedStyle(
      currentStyleBuilder(this.#timelineStyle.getSkinParam()),
    );
    if (style === undefined) throw new Error('NullPointerException: no style for gantt timeline');
    return style;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:203-205 */
  #getFontConfiguration(): FontConfiguration {
    return this.#getStyle().getFontConfiguration(this.#timelineStyle.getColorSet());
  }
}
