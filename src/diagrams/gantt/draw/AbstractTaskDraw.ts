import type { ISkinParamWithSimple } from '../../../core/abel/ISkinParam.js';
import type { FontConfiguration as StyleFontConfiguration } from '../../../core/abel/FontConfiguration.js';
import { LineBreakStrategy } from '../../../core/klimt/LineBreakStrategy.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import type { HColorOrPaint } from '../../../core/klimt/color/ColorMapper.js';
import { HColors } from '../../../core/klimt/color/HColors.js';
import { CreoleMode } from '../../../core/klimt/creole/CreoleMode.js';
import type { CreoleAtom } from '../../../core/klimt/creole/atom/Atom.js';
import type { Display } from '../../../core/klimt/creole/Display.js';
import type { Sheet } from '../../../core/klimt/creole/Sheet.js';
import { SheetBlock1 } from '../../../core/klimt/creole/SheetBlock1.js';
import { bridgeFontConfiguration } from '../../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import { SpriteContainerEmpty } from '../../../core/klimt/sprite/SpriteContainerEmpty.js';
import type { Real } from '../../../core/real/Real.js';
import type { Pragma } from '../../../core/skin/Pragma.js';
import type { Stereotype } from '../../../core/stereo/Stereotype.js';
import type { Style } from '../../../core/style/Style.js';
import type { StyleBuilder } from '../../../core/style/StyleBuilder.js';
import type { StyleSignature } from '../../../core/style/StyleSignature.js';
import { StyleSignatureBasic } from '../../../core/style/StyleSignatureBasic.js';
import type { HColorSet } from '../../../core/style/Value.js';
import { Opale } from '../../../core/svek/image/Opale.js';
import type { Url } from '../../../core/url/Url.js';
import type { InternalEmojiStore } from '../../../core/internal-emoji-store.js';
import type { LabelStrategy } from '../LabelStrategy.js';
import type { GArrowType } from '../core/GArrowType.js';
import type { GSide } from '../core/GSide.js';
import type { Task } from '../core/Task.js';
import type { TaskDrawRegistryData } from '../data/TaskDrawRegistryData.js';
import type { CenterBorderColor } from '../lang/CenterBorderColor.js';
import type { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from '../timescale/TimeScale.js';
import { emojiStoreOf, paintOf } from './header/TimeHeader.js';
import type { FingerPrint } from './FingerPrint.js';
import type { TaskDraw } from './TaskDraw.js';

/**
 * `StyleSignature#getMergedStyle` answers `null` upstream when no style matches and the caller
 * dereferences it (NullPointerException); the port narrows with a throw.
 */
export function mergedStyleOf(signature: StyleSignature, styleBuilder: StyleBuilder): Style {
  const style = signature.getMergedStyle(styleBuilder);
  if (style === undefined) throw new Error('NullPointerException: no style for ' + String(signature));
  return style;
}

/**
 * `ug.startUrl(url)`. The port's `UGraphic` interface does not declare it (only the SVG
 * backends implement it), so it is duck-typed the way `TextBlockWithUrl#drawU` does.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/UGraphic.java
 */
export function startUrl(ug: UGraphic, url: Url): void {
  (ug as UGraphic & Partial<{ startUrl(url: Url): void }>).startUrl?.(url);
}

/** `ug.closeUrl()`; see {@link startUrl}. */
export function closeUrl(ug: UGraphic): void {
  (ug as UGraphic & Partial<{ closeUrl(): void }>).closeUrl?.();
}

/**
 * AbstractTaskDraw -- what the regular task, milestone and group draws share: the colours and
 * completion, the style lookups, the row indirection (`getTrueRow`) and the note (`Opale`).
 *
 * `colors` is `null` upstream when a task has none (`core/TaskImpl.java:329-331`), so it is
 * `CenterBorderColor | undefined` here and every read keeps the Java null check. The Java
 * package-private `getStyleSignature()` is `protected abstract`; `HColor#bg()` is `new Back(..)`
 * and `ug.apply(HColor)` is `new Fore(..)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:71-240
 */
export abstract class AbstractTaskDraw implements TaskDraw {
  #colors: CenterBorderColor | undefined;
  #completion = 100;
  protected url: Url | undefined;
  protected note: Display | undefined;
  protected noteStereotype: Stereotype | undefined;
  protected readonly timeScale: TimeScale;
  readonly #y: Real;
  protected readonly prettyDisplay: string;
  protected readonly start: TimePoint;
  readonly #styleBuilder: StyleBuilder;
  readonly #task: Task;
  readonly #toTaskDraw: TaskDrawRegistryData;
  readonly #skinParam: ISkinParamWithSimple;
  readonly #colorSet: HColorSet;

  /** `Object#toString()` is `Class@hash` upstream; the hash has no port equivalent. @see AbstractTaskDraw.java:90-92 */
  public toString(): string {
    return this.constructor.name + ' ' + (this.#task as { toString(): string }).toString();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:94-101 */
  public setColorsAndCompletion(
    colors: CenterBorderColor | undefined,
    completion: number,
    url: Url | undefined,
    note: Display | undefined,
    noteStereotype: Stereotype | undefined,
  ): void {
    this.#colors = colors;
    this.#completion = completion;
    this.url = url;
    this.note = note;
    this.noteStereotype = noteStereotype;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:103-115 */
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
    this.#colorSet = colorSet;
    this.#y = y;
    this.#skinParam = skinParam;
    this.#styleBuilder = styleBuilder;
    this.#toTaskDraw = toTaskDraw;
    this.start = start;
    this.prettyDisplay = prettyDisplay;
    this.timeScale = timeScale;
    this.#task = task;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:117 */
  protected abstract getStyleSignature(): StyleSignature;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:119-121 */
  #getStyleSignatureUnstarted(): StyleSignatureBasic {
    return StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'task', 'unstarted');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:123-128 */
  protected getLineColor(): HColorOrPaint {
    const unstarted = mergedStyleOf(this.#getStyleSignatureUnstarted(), this.#styleBuilder)
      .value('LineColor')
      .asColor(this.getColorSet());
    const regular = this.getStyle().value('LineColor').asColor(this.getColorSet());
    // `unlinear` answers undefined only for undefined inputs; both are resolved colours here.
    return HColors.unlinear(paintOf(unstarted), paintOf(regular), this.#completion) as HColorOrPaint;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:130-135 */
  protected getBackgroundColor(): HColorOrPaint {
    const unstarted = mergedStyleOf(this.#getStyleSignatureUnstarted(), this.#styleBuilder)
      .value('BackGroundColor')
      .asColor(this.getColorSet());
    const regular = this.getStyle().value('BackGroundColor').asColor(this.getColorSet());
    return HColors.unlinear(paintOf(unstarted), paintOf(regular), this.#completion) as HColorOrPaint;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:137-139 */
  protected getFontConfiguration(): StyleFontConfiguration {
    return this.getStyle().getFontConfiguration(this.getColorSet());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:141-143 */
  protected getStyle(): Style {
    return mergedStyleOf(this.getStyleSignature(), this.#styleBuilder);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:145-149 */
  public getTitleWidth(stringBounder: StringBounder): number {
    const style = mergedStyleOf(this.getStyleSignature(), this.getStyleBuilder());
    const margin = style.getMargin();
    return margin.getLeft() + this.getTitle().calculateDimension(stringBounder).getWidth() + margin.getRight();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:151 */
  protected abstract getTitle(): TextBlock;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:153 */
  protected abstract getShapeHeight(stringBounder: StringBounder): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:155-159 */
  public getFullHeightTask(stringBounder: StringBounder): number {
    const style = this.getStyle();
    const margin = style.getMargin();
    return margin.getTop() + this.getShapeHeight(stringBounder) + margin.getBottom();
  }

  /**
   * `toTaskDraw.getTaskDraw(task.getRow())`; the Java `HashMap.get(null)` is `null`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:161-163
   */
  public getTrueRow(): TaskDraw | undefined {
    const row = this.#task.getRow();
    return row === undefined ? undefined : this.#toTaskDraw.getTaskDraw(row);
  }

  /**
   * The two Java overloads: `getY(StringBounder)` (java:166-170, final) answers this row's
   * `Real`, `getY(StringBounder, GSide)` (java:178-193) the pixel position of a side.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:166-193
   */
  public getY(stringBounder: StringBounder): Real;
  public getY(stringBounder: StringBounder, side: GSide): number;
  public getY(stringBounder: StringBounder, side?: GSide): Real | number {
    if (side === undefined) {
      if (this.#task.getRow() === undefined) return this.#y;

      // Java dereferences `getTrueRow()` (NullPointerException when the row has no draw).
      return (this.getTrueRow() as TaskDraw).getY(stringBounder);
    }

    const style = this.getStyle();
    const margin = style.getMargin();

    const y1 = margin.getTop() + this.getY(stringBounder).getCurrentValue();
    const y2 = y1 + this.getShapeHeight(stringBounder);

    if (side.isTop()) return y1;

    if (side.isBottom()) return y2;

    return (y1 + y2) / 2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:173-175 */
  public getTask(): Task {
    return this.#task;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:195-197 */
  protected getStyleBuilder(): StyleBuilder {
    return this.#styleBuilder;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:199-201 */
  protected getColorSet(): HColorSet {
    return this.#colorSet;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:203-205 */
  protected getColors(): CenterBorderColor | undefined {
    return this.#colors;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:207-209 */
  protected getCompletion(): number {
    return this.#completion;
  }

  /** Port-only (ADR-2): the Twemoji artwork the title blocks draw `<:name:>` from (`Emoji.java:175-181`). */
  protected getEmojiStore(): InternalEmojiStore | undefined {
    return emojiStoreOf(this.#skinParam);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:211-213 */
  protected getPragma(): Pragma {
    return this.#skinParam.getPragma();
  }

  /**
   * The note: `skinParam.sheet(fc, align, CreoleMode.FULL).createSheet(note)` in a `SheetBlock1`
   * (route: `SkinParamDelegator#sheet`, which `ISkinParamWithSimple` carries) inside an `Opale`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:215-231
   */
  protected getOpaleNote(): Opale {
    const style = mergedStyleOf(
      StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'note').withTOBECHANGED(this.noteStereotype),
      this.getStyleBuilder(),
    );

    const fc = bridgeFontConfiguration(style.getFontConfiguration(this.getColorSet()));

    // Java hands the (possibly null) alignment on; the built-in skin always supplies it.
    const horizontalAlignment = style.value('HorizontalAlignment').asHorizontalAlignment() as HorizontalAlignment;
    // `SheetBuilder#createSheet` widens to `Sheet<StripeAtom>`; `SheetBlock1` takes the narrow `Sheet`
    // (same cast as `DisplayCreole.ts`, a pre-existing seam between those two files).
    const sheet = this.#skinParam
      .sheet(fc, horizontalAlignment, CreoleMode.FULL)
      .createSheet(this.note as Display) as unknown as Sheet<CreoleAtom>;
    const padding = style.getPadding();
    const atomOps = new SpriteContainerEmpty(undefined, this.getEmojiStore()).atomOps(fc);
    const sheet1 = new SheetBlock1(sheet, LineBreakStrategy.NONE, atomOps, padding);

    const noteBackgroundColor = style.value('BackGroundColor').asColor(this.getColorSet());
    const borderColor = style.value('LineColor').asColor(this.getColorSet());
    const shadowing = style.getShadowing();

    return new Opale(shadowing, paintOf(borderColor), paintOf(noteBackgroundColor), sheet1, false, style.getStroke());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java:233-239 */
  protected drawNote(ug: UGraphic): void {
    if (this.note === undefined) return;

    this.getOpaleNote().drawU(ug);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:62 */
  public abstract drawTitle(ug: UGraphic, labelStrategy: LabelStrategy, colTitles: number, colBars: number): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:68 */
  public abstract getHeightMax(stringBounder: StringBounder): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:72 */
  public abstract getFingerPrint(stringBounder: StringBounder): FingerPrint;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:74 */
  public abstract getFingerPrintNote(stringBounder: StringBounder): FingerPrint | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java:80 */
  public abstract getX(stringBounder: StringBounder, side: GSide, arrowType: GArrowType): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java (UDrawable) */
  public abstract drawU(ug: UGraphic): void;
}
