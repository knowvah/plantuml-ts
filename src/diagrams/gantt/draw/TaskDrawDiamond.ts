import type { ISkinParamWithSimple } from '../../../core/abel/ISkinParam.js';
import { Back } from '../../../core/klimt/Back.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import type { UShape } from '../../../core/klimt/UShape.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { Display } from '../../../core/klimt/creole/Display.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import { UFont } from '../../../core/klimt/font/UFont.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import { UPolygon } from '../../../core/klimt/shape/UPolygon.js';
import type { Real } from '../../../core/real/Real.js';
import type { StyleBuilder } from '../../../core/style/StyleBuilder.js';
import type { StyleSignature } from '../../../core/style/StyleSignature.js';
import { StyleSignatureBasic } from '../../../core/style/StyleSignatureBasic.js';
import type { HColorSet } from '../../../core/style/Value.js';
import type { LabelStrategy } from '../LabelStrategy.js';
import { GArrowType } from '../core/GArrowType.js';
import { GSide } from '../core/GSide.js';
import type { Task } from '../core/Task.js';
import type { TaskDrawRegistryData } from '../data/TaskDrawRegistryData.js';
import type { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from '../timescale/TimeScale.js';
import { AbstractTaskDraw, closeUrl, startUrl } from './AbstractTaskDraw.js';
import { FingerPrint } from './FingerPrint.js';
import { createLeftTextBlock } from './header/TimeHeader.js';

/**
 * TaskDrawDiamond -- the milestone: a diamond as high as the font size, with its label to the right.
 *
 * `null` returns of `getFingerPrintNote` are `undefined`; `HColor#bg()` is `new Back(..)` and
 * `ug.apply(HColor)` is `new Fore(..)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:66-282
 */
export class TaskDrawDiamond extends AbstractTaskDraw {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:68-71 */
  public constructor(
    colorSet: HColorSet,
    timeScale: TimeScale,
    y: Real,
    prettyDisplay: string,
    start: TimePoint,
    task: Task,
    toTaskDraw: TaskDrawRegistryData,
    styleBuilder: StyleBuilder,
    skinParam: ISkinParamWithSimple,
  ) {
    super(colorSet, timeScale, y, prettyDisplay, start, task, toTaskDraw, styleBuilder, skinParam);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:74-76 */
  protected getStyleSignature(): StyleSignature {
    return StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'milestone');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:78-82 */
  #getYNotePosition(stringBounder: StringBounder): number {
    const style = this.getStyle();
    const margin = style.getMargin();
    return margin.getTop() + this.getShapeHeight(stringBounder) + margin.getBottom();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:85-90 */
  public getHeightMax(stringBounder: StringBounder): number {
    if (this.note === undefined) return this.getFullHeightTask(stringBounder);

    return this.#getYNotePosition(stringBounder) + this.getOpaleNote().calculateDimension(stringBounder).getHeight();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:93-101 */
  protected getShapeHeight(stringBounder: StringBounder): number {
    //		final String displayString = getTask().getDisplayString();
    //		if (displayString == null)
    //			return getDiamondHeight();

    const title = this.getTitle();
    const titleDim = title.calculateDimension(stringBounder);
    return Math.max(titleDim.getHeight(), this.#getDiamondHeight());
  }

  /** `(int) getSize2D()`, made even (java:103-108). @see TaskDrawDiamond.java:103-108 */
  #getDiamondHeight(): number {
    // The abel `FontConfiguration` types its font opaquely; the style engine always builds a `UFont`.
    const font = this.getFontConfiguration().getFont();
    if (!(font instanceof UFont)) throw new Error('ClassCastException: FontConfiguration font is not a UFont');
    let result = Math.trunc(font.getSize2D());
    if (result % 2 === 1) result--;
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:111-142 */
  public drawTitle(ug: UGraphic, labelStrategy: LabelStrategy, colTitles: number, colBars: number): void {
    const style = this.getStyle();
    const margin = style.getMargin();
    const padding = style.getPadding();

    const title = this.getTitle();

    ug = ug.apply(UTranslate.dy(margin.getTop()));

    const stringBounder = ug.getStringBounder();
    const titleDim = title.calculateDimension(stringBounder);
    const h = (this.getShapeHeight(stringBounder) - titleDim.getHeight()) / 2;

    let x: number;
    if (labelStrategy.titleInFirstColumn()) {
      if (labelStrategy.rightAligned()) x = colTitles - titleDim.getWidth() - margin.getRight();
      else x = margin.getLeft();
    } else if (labelStrategy.titleInLastColumn()) {
      x = colBars + margin.getLeft();
    } else {
      const x1 = this.timeScale.getPosition(this.start);
      const x2 = this.timeScale.getPosition(this.start) + this.timeScale.getWidth(this.start);
      const width = this.#getDiamondHeight();
      const delta = x2 - x1 - width;
      x = x2 - delta / 2 + padding.getLeft();
    }
    title.drawU(ug.apply(new UTranslate(x, h)));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:145-148 */
  protected getTitle(): TextBlock {
    return createLeftTextBlock(
      Display.getWithNewlines(this.getPragma(), this.prettyDisplay),
      this.getFontConfiguration(),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:151-175 */
  public getLabelOverflow(stringBounder: StringBounder, barsWidth: number): number {
    const title = this.getTitle();
    const titleDim = title.calculateDimension(stringBounder);

    const style = this.getStyle();
    const padding = style.getPadding();

    const x2 = this.timeScale.getPosition(this.start) + this.timeScale.getWidth(this.start);
    const width = this.#getDiamondHeight();
    const delta = x2 - this.timeScale.getPosition(this.start) - width;
    const labelStart = x2 - delta / 2 + padding.getLeft();
    const labelEnd = labelStart + titleDim.getWidth();
    let overflow = 0;
    if (labelEnd > barsWidth) overflow = labelEnd - barsWidth;

    if (this.note !== undefined) {
      const noteEnd =
        this.timeScale.getPosition(this.start) + this.getOpaleNote().calculateDimension(stringBounder).getWidth();
      if (noteEnd - barsWidth > overflow) overflow = noteEnd - barsWidth;
    }

    return overflow;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:178-208 */
  public drawU(ug: UGraphic): void {
    const x1 = this.timeScale.getPosition(this.start);
    this.drawNote(ug.apply(new UTranslate(x1, this.#getYNotePosition(ug.getStringBounder()))));

    if (this.url !== undefined) startUrl(ug, this.url);

    const displayString = this.getTask().getDisplayString();

    const style = this.getStyle();
    const margin = style.getMargin();
    ug = ug.apply(UTranslate.dy(margin.getTop()));

    ug = ug.apply(UTranslate.dx(x1));

    if (displayString === undefined) {
      const x2 = this.timeScale.getPosition(this.start) + this.timeScale.getWidth(this.start);
      const width = this.#getDiamondHeight();
      const delta = x2 - x1 - width;
      ug = ug.apply(UTranslate.dx(delta / 2));
      this.#drawShape(this.#applyColors(ug));
    } else {
      const draw = createLeftTextBlock(
        Display.getWithNewlines(this.getPragma(), displayString),
        this.getFontConfiguration(),
      );
      draw.drawU(ug);
    }
    if (this.url !== undefined) closeUrl(ug);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:210-216 */
  #applyColors(ug: UGraphic): UGraphic {
    const col = this.getColors();
    if (col !== undefined && col.isOk()) return col.apply(ug);

    return ug.apply(new Fore(this.getLineColor())).apply(new Back(this.getBackgroundColor()));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:218-220 */
  #drawShape(ug: UGraphic): void {
    ug.draw(this.#getDiamond());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:223-225 */
  public getFingerPrintNote(_stringBounder: StringBounder): FingerPrint | undefined {
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:228-233 */
  public getFingerPrint(stringBounder: StringBounder): FingerPrint {
    const h = this.getFullHeightTask(stringBounder);
    const startPos = this.timeScale.getPosition(this.start);
    return new FingerPrint(
      startPos,
      this.getY(stringBounder).getCurrentValue(),
      startPos + h,
      this.getY(stringBounder).getCurrentValue() + h,
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:235-243 */
  #getDiamond(): UShape {
    const h = this.#getDiamondHeight();
    const result = new UPolygon();
    result.addPoint(h / 2, 0);
    result.addPoint(h, h / 2);
    result.addPoint(h / 2, h);
    result.addPoint(0, h / 2);
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:246-263 */
  public getX(_stringBounder: StringBounder, side: GSide, arrowType: GArrowType): number {
    let x: number;
    if (side === GSide.LEFT) x = this.timeScale.getPosition(this.start);
    else if (side === GSide.RIGHT) x = this.timeScale.getPosition(this.start) + this.timeScale.getWidth(this.start);
    else
      x =
        (this.timeScale.getPosition(this.start) +
          this.timeScale.getPosition(this.start) +
          this.timeScale.getWidth(this.start)) /
        2;

    if (arrowType === GArrowType.OUTGOING) {
      const width = this.#getDiamondHeight();
      if (side === GSide.LEFT) x += width / 2;
      else if (side === GSide.RIGHT) x -= width / 2;
    }
    return x;
  }

  /**
   * Overrides only the `GSide` overload upstream (java:266-280); the `Real` overload stays
   * `AbstractTaskDraw`'s, which TypeScript needs restated.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:266-280
   */
  public override getY(stringBounder: StringBounder): Real;
  public override getY(stringBounder: StringBounder, side: GSide): number;
  public override getY(stringBounder: StringBounder, side?: GSide): Real | number {
    if (side === undefined) return super.getY(stringBounder);

    const style = this.getStyle();
    const margin = style.getMargin();

    const y1 = margin.getTop() + this.getY(stringBounder).getCurrentValue();
    const y2 = y1 + this.getShapeHeight(stringBounder);

    const displayString = this.getTask().getDisplayString();

    if (displayString === undefined) return y1 + this.#getDiamondHeight() / 2;

    return (y1 + y2) / 2;
  }
}
