import type { ISkinParamWithSimple } from '../../../core/abel/ISkinParam.js';
import { Back } from '../../../core/klimt/Back.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { HColorGradient } from '../../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../../core/klimt/color/HColorSimple.js';
import type { Display } from '../../../core/klimt/creole/Display.js';
import { Display as DisplayClass } from '../../../core/klimt/creole/Display.js';
import { bridgeFontConfiguration } from '../../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../../core/klimt/shape/TextBlockUtils.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import { SpriteContainerEmpty } from '../../../core/klimt/sprite/SpriteContainerEmpty.js';
import type { Real } from '../../../core/real/Real.js';
import type { Stereotype } from '../../../core/stereo/Stereotype.js';
import type { Style } from '../../../core/style/Style.js';
import type { StyleBuilder } from '../../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../../core/style/StyleSignatureBasic.js';
import type { HColor, HColorSet } from '../../../core/style/Value.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { Url } from '../../../core/url/Url.js';
import type { LabelStrategy } from '../LabelStrategy.js';
import type { GArrowType } from '../core/GArrowType.js';
import type { GSide } from '../core/GSide.js';
import { unsupportedOperation } from '../core/AbstractTask.js';
import type { Task } from '../core/Task.js';
import type { CenterBorderColor } from '../lang/CenterBorderColor.js';
import { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from '../timescale/TimeScale.js';
import { FingerPrint } from './FingerPrint.js';
import { emojiStoreOf } from './header/TimeHeader.js';
import type { TaskDraw } from './TaskDraw.js';

/** `ug.apply(HColor)`: the style layer's `HColor` is an `HColorSimple`/`HColorGradient`; Java's cast otherwise. */
function paintOf(color: HColor): HColorSimple | HColorGradient {
  if (color instanceof HColorSimple || color instanceof HColorGradient) return color;
  throw new Error('ClassCastException: colour is not an HColorSimple');
}

/**
 * `HColor#isTransparent` (HColor.java:137); a gradient answers for its first colour.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorLinearGradient.java:341-343
 */
function isTransparent(color: HColorSimple | HColorGradient): boolean {
  return color instanceof HColorGradient ? color.getColor1().isTransparent() : color.isTransparent();
}

/**
 * TaskDrawSeparator -- the drawable row of a `-- title --` separator.
 *
 * `name` and the `null` returns of `getTrueRow` / `getFingerPrintNote` are
 * `undefined`; the `Display` import is type-only for the interface signature.
 * `HColor#bg()` is `new Back(color)` and `ug.apply(HColor)` is `new Fore(..)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:71-236
 */
export class TaskDrawSeparator implements TaskDraw {
  readonly #timeScale: TimeScale;
  readonly #y: Real;
  readonly #minDay: LocalDate;
  readonly #maxDay: LocalDate;
  readonly #name: string | undefined;
  readonly #styleBuilder: StyleBuilder;
  readonly #colorSet: HColorSet;
  readonly #skinParam: ISkinParamWithSimple;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:82-92 */
  public constructor(
    name: string | undefined,
    timeScale: TimeScale,
    y: Real,
    minDay: LocalDate,
    maxDay: LocalDate,
    styleBuilder: StyleBuilder,
    skinParam: ISkinParamWithSimple,
  ) {
    this.#styleBuilder = styleBuilder;
    this.#skinParam = skinParam;
    this.#colorSet = skinParam.getIHtmlColorSet();
    this.#name = name;
    this.#y = y;
    this.#timeScale = timeScale;
    this.#minDay = minDay;
    this.#maxDay = maxDay;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:94-108 */
  public drawTitle(ug: UGraphic, labelStrategy: LabelStrategy, colTitles: number, _colBars: number): void {
    const padding = this.#getStyle().getPadding();
    const margin = this.#getStyle().getMargin();
    const dx = margin.getLeft() + padding.getLeft();
    const dy = margin.getTop() + padding.getTop();
    let x: number;
    if (labelStrategy.titleInFirstColumn()) x = colTitles;
    else x = 0;

    this.#getTitle().drawU(ug.apply(new UTranslate(x + dx, dy)));
  }

  /** Never used in first column (java:111). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:109-113 */
  public getTitleWidth(_stringBounder: StringBounder): number {
    return 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:115-117 */
  #getStyleSignature(): StyleSignatureBasic {
    return StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'separator');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:119-121 */
  #getStyle(): Style {
    const style = this.#getStyleSignature().getMergedStyle(this.#styleBuilder);
    if (style === undefined) throw new Error('NullPointerException: no style for gantt separator');
    return style;
  }

  /**
   * The title's emoji draw from the injected Twemoji store (port-only, ADR-2); upstream's `Emoji#getSvg` always
   * finds the artwork on the classpath (`Emoji.java:175-193`), with no text fallback.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:123-129
   */
  #getTitle(): TextBlock {
    if (this.#name === undefined) return TextBlockUtils.empty(0, 0);

    const spriteContainer = new SpriteContainerEmpty(undefined, emojiStoreOf(this.#skinParam));
    const fontConfiguration = this.#getFontConfiguration();
    const ctx = { fontConfiguration, spriteContainer, atomOps: spriteContainer.atomOps(fontConfiguration) };
    const display: Display = DisplayClass.getWithNewlines(this.#skinParam.getPragma(), this.#name);
    return display.create(ctx, HorizontalAlignment.LEFT);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:131-133 */
  #getFontConfiguration(): ReturnType<typeof bridgeFontConfiguration> {
    return bridgeFontConfiguration(this.#getStyle().getFontConfiguration(this.#colorSet));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:135-174 */
  public drawU(ug: UGraphic): void {
    const stringBounder = ug.getStringBounder();
    const widthTitle = this.#getTitle().calculateDimension(stringBounder).getWidth();
    const start = this.#timeScale.getPosition(TimePoint.ofStartOfDay(this.#minDay));
    // final double start2 = start1 + widthTitle;
    const end = this.#timeScale.getPosition(TimePoint.ofStartOfDay(this.#maxDay.plusDays(1)));

    const padding = this.#getStyle().getPadding();
    const margin = this.#getStyle().getMargin();
    ug = ug.apply(new UTranslate(0, margin.getTop()));

    const backColor = paintOf(this.#getStyle().value('BackGroundColor').asColor(this.#colorSet));

    if (isTransparent(backColor) === false) {
      const height = padding.getTop() + this.#getTextHeight(stringBounder) + padding.getBottom();
      if (height > 0) {
        const rect = URectangle.build(end - start, height);
        ug.apply(new Back(backColor)).draw(rect);
      }
    }

    const lineColor = paintOf(this.#getStyle().value('LineColor').asColor(this.#colorSet));
    ug = ug.apply(new Fore(lineColor));
    ug = ug.apply(UTranslate.dy(padding.getTop() + this.#getTextHeight(stringBounder) / 2));

    if (widthTitle === 0) {
      const line = ULine.hline(end - start);
      ug.draw(line);
    } else {
      if (padding.getLeft() > 1) {
        const line1 = ULine.hline(padding.getLeft());
        ug.draw(line1);
      }
      const x1 = padding.getLeft() + margin.getLeft() + widthTitle + margin.getRight();
      const x2 = end - 1;
      const line2 = ULine.hline(x2 - x1);
      ug.apply(UTranslate.dx(x1)).draw(line2);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:176-183 */
  public getFingerPrint(stringBounder: StringBounder): FingerPrint {
    const h = this.getFullHeightTask(stringBounder);
    const end = this.#timeScale.getPosition(TimePoint.ofStartOfDay(this.#maxDay.plusDays(1)));
    return new FingerPrint(
      0,
      this.getY(stringBounder).getCurrentValue(),
      end,
      this.getY(stringBounder).getCurrentValue() + h,
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:184-187 */
  public getFingerPrintNote(_stringBounder: StringBounder): FingerPrint | undefined {
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:189-195 */
  public getFullHeightTask(stringBounder: StringBounder): number {
    const padding = this.#getStyle().getPadding();
    const margin = this.#getStyle().getMargin();
    return (
      margin.getTop() + padding.getTop() + this.#getTextHeight(stringBounder) + padding.getBottom() + margin.getBottom()
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:197-199 */
  #getTextHeight(stringBounder: StringBounder): number {
    return this.#getTitle().calculateDimension(stringBounder).getHeight();
  }

  /**
   * The two Java overloads: `getY(StringBounder)` (java:201-204) returns the row,
   * `getY(StringBounder, GSide)` (java:221-224) is unsupported.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:201-204
   */
  public getY(stringBounder: StringBounder): Real;
  public getY(stringBounder: StringBounder, side: GSide): number;
  public getY(_stringBounder: StringBounder, side?: GSide): Real | number {
    if (side !== undefined) return unsupportedOperation();
    return this.#y;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:206-209 */
  public getTrueRow(): TaskDraw | undefined {
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:211-214 */
  public setColorsAndCompletion(
    _colors: CenterBorderColor | undefined,
    _completion: number,
    _url: Url | undefined,
    _note: Display | undefined,
    _noteStereotype: Stereotype | undefined,
  ): void {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:216-219 */
  public getTask(): Task {
    return unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:226-229 */
  public getHeightMax(stringBounder: StringBounder): number {
    return this.getFullHeightTask(stringBounder);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java:231-234 */
  public getX(_stringBounder: StringBounder, _side: GSide, _arrowType: GArrowType): number {
    return unsupportedOperation();
  }
}
