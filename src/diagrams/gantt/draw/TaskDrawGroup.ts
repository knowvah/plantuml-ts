import type { ISkinParamWithSimple } from '../../../core/abel/ISkinParam.js';
import { Back } from '../../../core/klimt/Back.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { HColors } from '../../../core/klimt/color/HColors.js';
import { Display } from '../../../core/klimt/creole/Display.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import { UPath } from '../../../core/klimt/shape/UPath.js';
import type { Real } from '../../../core/real/Real.js';
import type { StyleBuilder } from '../../../core/style/StyleBuilder.js';
import type { StyleSignature } from '../../../core/style/StyleSignature.js';
import { StyleSignatureBasic } from '../../../core/style/StyleSignatureBasic.js';
import type { HColorSet } from '../../../core/style/Value.js';
import type { LabelStrategy } from '../LabelStrategy.js';
import type { GArrowType } from '../core/GArrowType.js';
import { GSide } from '../core/GSide.js';
import type { Task } from '../core/Task.js';
import type { TaskDrawRegistryData } from '../data/TaskDrawRegistryData.js';
import type { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from '../timescale/TimeScale.js';
import { AbstractTaskDraw, closeUrl, startUrl } from './AbstractTaskDraw.js';
import { FingerPrint } from './FingerPrint.js';
import { createLeftTextBlock } from './header/TimeHeader.js';

/** The inset of the group label from the bracket ends (`TaskDrawGroup.java:84-85,104-105,113,130-131,135`). */
const LABEL_INSET = 6;

/**
 * TaskDrawGroup -- the bracket of a task group.
 *
 * `HColor#bg()` is `new Back(..)` and `ug.apply(HColor)` is `new Fore(..)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:66-279
 */
export class TaskDrawGroup extends AbstractTaskDraw {
  readonly #end: TimePoint;
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:218 */
  readonly #height = 10;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:70-75 */
  public constructor(
    colorSet: HColorSet,
    timeScale: TimeScale,
    y: Real,
    prettyDisplay: string,
    start: TimePoint,
    end: TimePoint,
    task: Task,
    toTaskDraw: TaskDrawRegistryData,
    styleBuilder: StyleBuilder,
    skinParam: ISkinParamWithSimple,
  ) {
    super(colorSet, timeScale, y, prettyDisplay, start, task, toTaskDraw, styleBuilder, skinParam);
    this.#end = end;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:78-92 */
  public getShapeHeight(stringBounder: StringBounder): number {
    const style = this.getStyle();
    // final ClockwiseTopRightBottomLeft padding = style.getPadding();   (java:80: unused)
    void style;
    // return padding.getTop() + getTitle().calculateDimension(stringBounder).getHeight() + padding.getBottom() + 8;
    const pos1 = this.timeScale.getPosition(this.start) + LABEL_INSET;
    const pos2 = this.timeScale.getPosition(this.#end) + this.timeScale.getWidth(this.#end) - LABEL_INSET;
    const title = this.getTitle();
    const dim = title.calculateDimension(stringBounder);
    if (pos2 - pos1 > dim.getWidth()) return dim.getHeight() + 2;
    else return dim.getHeight();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:95-117 */
  public drawTitle(ug: UGraphic, _labelStrategy: LabelStrategy, _colTitles: number, _colBars: number): void {
    const title = this.getTitle();
    const stringBounder = ug.getStringBounder();
    const dim = title.calculateDimension(stringBounder);

    const pos1 = this.timeScale.getPosition(this.start) + LABEL_INSET;
    const pos2 = this.timeScale.getPosition(this.#end) + this.timeScale.getWidth(this.#end) - LABEL_INSET;
    let pos: number;
    let y: number;
    if (pos2 - pos1 > dim.getWidth()) {
      pos = pos1 + (pos2 - pos1 - dim.getWidth()) / 2;
      // y = margin.getTop() + padding.getTop();
      y = 0;
    } else {
      pos = pos2 + LABEL_INSET;
      y = this.getFullHeightTask(stringBounder) - dim.getHeight();
    }
    title.drawU(ug.apply(new UTranslate(pos, y)));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:120-123 */
  protected getTitle(): TextBlock {
    return createLeftTextBlock(
      Display.getWithNewlines(this.getPragma(), this.prettyDisplay),
      this.getFontConfiguration(),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:126-140 */
  public getLabelOverflow(stringBounder: StringBounder, barsWidth: number): number {
    const title = this.getTitle();
    const dim = title.calculateDimension(stringBounder);

    const pos1 = this.timeScale.getPosition(this.start) + LABEL_INSET;
    const pos2 = this.timeScale.getPosition(this.#end) + this.timeScale.getWidth(this.#end) - LABEL_INSET;
    if (pos2 - pos1 > dim.getWidth()) return 0;

    const labelEnd = pos2 + LABEL_INSET + dim.getWidth();
    if (labelEnd > barsWidth) return labelEnd - barsWidth;

    return 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:143-145 */
  protected getStyleSignature(): StyleSignature {
    return StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'task');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:147-151 */
  public drawU(ug: UGraphic): void {
    // final double startPos = timeScale.getStartingPosition(start);
    ug = this.#applyColors(ug);
    this.#drawShape(ug);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:154-156 */
  public getHeightMax(stringBounder: StringBounder): number {
    return this.getFullHeightTask(stringBounder);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:158-163 */
  public getFingerPrint(stringBounder: StringBounder): FingerPrint {
    const h = this.getFullHeightTask(stringBounder);
    const startPos = this.timeScale.getPosition(this.start);
    const endPos = this.timeScale.getPosition(this.#end) + this.timeScale.getWidth(this.#end);
    return new FingerPrint(startPos, this.getY(stringBounder).getCurrentValue(), endPos - startPos, h);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:165-167 */
  public getFingerPrintNote(_stringBounder: StringBounder): FingerPrint | undefined {
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:169-175 */
  #applyColors(ug: UGraphic): UGraphic {
    const col = this.getColors();
    if (col !== undefined && col.isOk()) return col.apply(ug);

    return ug.apply(new Fore(this.getLineColor())).apply(new Back(this.getBackgroundColor()));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:178-195 */
  public getX(_stringBounder: StringBounder, side: GSide, _arrowType: GArrowType): number {
    // final Style style = getStyleSignature().getMergedStyle(getStyleBuilder());
    // final ClockwiseTopRightBottomLeft margin = style.getMargin();
    const timeScale = this.timeScale;
    let x: number;

    if (side === GSide.LEFT) x = timeScale.getPosition(this.start);
    else if (side === GSide.RIGHT) x = timeScale.getPosition(this.#end) + timeScale.getWidth(this.#end);
    else if (side === GSide.TOP_LEFT || side === GSide.BOTTOM_LEFT)
      x = (timeScale.getPosition(this.start) + timeScale.getPosition(this.start) + timeScale.getWidth(this.start)) / 2;
    else if (side === GSide.TOP_RIGHT || side === GSide.BOTTOM_RIGHT)
      x = (timeScale.getPosition(this.#end) + timeScale.getPosition(this.#end) + timeScale.getWidth(this.#end)) / 2;
    else throw new Error('IllegalArgumentException');

    return x;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:197-216 */
  #drawShape(ug: UGraphic): void {
    const style = this.getStyle();
    const margin = style.getMargin();

    const startPos = this.timeScale.getPosition(this.start) + margin.getLeft();
    const endPos = this.timeScale.getPosition(this.#end) + this.timeScale.getWidth(this.#end) - margin.getRight();

    if (this.url !== undefined) startUrl(ug, this.url);

    // ug = ug.apply(UTranslate.dy(margin.getTop() + 7));
    ug = ug.apply(UTranslate.dy(this.getFullHeightTask(ug.getStringBounder()) - this.#height));

    ug = ug.apply(new Fore(HColors.BLACK)).apply(new Back(HColors.BLACK));
    ug.draw(this.#getShape(startPos, endPos));

    if (this.url !== undefined) closeUrl(ug);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java:220-240 */
  #getShape(startPos: number, endPos: number): UPath {
    const rect = UPath.none();

    const height = this.#height;
    const thick = 2;
    const y1 = (height - thick) / 2;
    const y2 = height - (height - thick) / 2;
    const dx = 6;

    rect.moveTo(startPos, 0);
    rect.lineTo(startPos + dx, y1);
    rect.lineTo(endPos - dx, y1);
    rect.lineTo(endPos, 0);
    rect.lineTo(endPos, height);
    rect.lineTo(endPos - dx, y2);
    rect.lineTo(startPos + dx, y2);
    rect.lineTo(startPos, height);
    rect.lineTo(startPos, 0);

    rect.closePath();
    return rect;
  }

  /** Unused upstream (kept: no refactoring while porting). @see TaskDrawGroup.java:242-259 */
  protected getShapeOld2(startPos: number, endPos: number): UPath {
    const rect = UPath.none();

    const height1 = 9;
    const height2 = 7;
    const dx = 6;

    rect.moveTo(startPos, 0);
    rect.lineTo(startPos + dx, height2);
    rect.lineTo(endPos - dx, height2);
    rect.lineTo(endPos, 0);
    rect.lineTo(endPos, height1);
    rect.lineTo(startPos, height1);
    rect.lineTo(startPos, 0);

    rect.closePath();
    return rect;
  }

  /** Unused upstream (kept: no refactoring while porting). @see TaskDrawGroup.java:261-277 */
  protected getShapeOld(startPos: number, endPos: number): UPath {
    const rect = UPath.none();

    const height1 = 9;
    const height2 = 2;
    const dx = 6;

    rect.moveTo(startPos, 0);
    rect.lineTo(endPos, 0);
    rect.lineTo(endPos, height1);
    rect.lineTo(endPos - dx, height2);
    rect.lineTo(startPos + dx, height2);
    rect.lineTo(startPos, height1);
    rect.lineTo(startPos, 0);
    rect.closePath();
    return rect;
  }
}
