import { ColorType } from '../../core/abel/ColorType.js';
import { Colors } from '../../core/abel/Colors.js';
import { Fore } from '../../core/klimt/Fore.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { create0 } from '../../core/klimt/creole/DisplayCreole.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import { bridgeFontConfiguration } from '../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { Rankdir } from '../../core/klimt/geom/Rankdir.js';
import type { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import { UPath } from '../../core/klimt/shape/UPath.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import { SkinParamColors } from '../../core/skin/SkinParamColors.js';
import type { Style } from '../../core/style/Style.js';
import type { HColor } from '../../core/style/Value.js';
import { FtileBoxOld } from '../activity/ftile/vertical/FtileBoxOld.js';
import type { Finger } from './Finger.js';
import type { Idea } from './Idea.js';
import { IdeaShape } from './IdeaShape.js';
import type { MindMapSkinParam } from './MindMap.js';
import { SymetricalTee } from './SymetricalTee.js';
import type { SymetricalTeePositioned } from './SymetricalTeePositioned.js';
import { Tetris } from './Tetris.js';

/**
 * `drawLine`'s left-to-right deltas: the straight run off `p1` / into `p2`
 * and the cubic's control-point reach.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/FingerImpl.java:158-159
 */
const LR_DELTA1 = 10;
const LR_DELTA2 = 25;
/** `drawLine`'s top-to-bottom deltas. @see FingerImpl.java:153-154 */
const TB_DELTA1 = 3;
const TB_DELTA2 = 10;
/** `getX2()`'s fixed gap after the margin: bottom + 5 (TB), right + 30 (LR). @see FingerImpl.java:196-201 */
const X2_GAP_TB = 5;
const X2_GAP_LR = 30;
/** The boxless text's horizontal pad on the branch side (`withMargin(text, 3, 0, 1, 1)`). @see FingerImpl.java:239-242 */
const BOXLESS_MARGIN_X = 3;
/** The boxless text's vertical pad, top and bottom. @see FingerImpl.java:239-242 */
const BOXLESS_MARGIN_Y = 1;

/**
 * `ug.apply(HColor)`: the port's `UGraphic` takes a `Paint` in a `Fore`;
 * style colours are `HColorSimple` (the `FtileBoxOld.ts#paintOf` cast).
 */
function asSimple(color: HColor): HColorSimple {
  if (!(color instanceof HColorSimple)) throw new Error('ClassCastException: link colour is not an HColorSimple');
  return color;
}

/**
 * FingerImpl — one mindmap node on one branch side: its own box (the
 * phalanx, a `FtileBoxOld` or boxless creole text) and its children (the
 * nail), packed across the branch by a `Tetris` and joined by a cubic link.
 * `direction` is `1` for the regular side (right / down), `-1` for the
 * reverse side (left / up).
 *
 * `atomOps` is ADR-9's injected creole capability, appended after every
 * upstream parameter (the `FtileBoxOld.ts`/`DisplayCreole.ts` precedent):
 * the port's creole blocks measure and draw atoms through it.
 *
 * Mutation contract (mirrors upstream): `nail` is filled by `build` before
 * any measure; `tetris` is computed once, on first use; `drawPhalanx` is
 * cleared at most once by `doNotDrawFirstPhalanx`, before any measure.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/FingerImpl.java:64-278
 */
export class FingerImpl implements Finger, UDrawable {
  /** @see FingerImpl.java:66 */
  private readonly idea: Idea;
  /** @see FingerImpl.java:67 */
  private readonly skinParam: MindMapSkinParam;
  /** @see FingerImpl.java:68 */
  private readonly direction: number;
  /** @see FingerImpl.java:69 */
  private drawPhalanx = true;
  /** @see FingerImpl.java:71 */
  private readonly nail: FingerImpl[] = [];
  /** @see FingerImpl.java:72 */
  private tetris: Tetris | undefined = undefined;
  private readonly atomOps: AtomOps;

  /** @see FingerImpl.java:74-80 */
  static build(idea: Idea, skinParam: MindMapSkinParam, direction: boolean, atomOps: AtomOps): FingerImpl {
    const result = new FingerImpl(idea, skinParam, direction, atomOps);
    for (const child of idea.getChildren()) result.addInNail(FingerImpl.build(child, skinParam, direction, atomOps));

    return result;
  }

  /** @see FingerImpl.java:82-84 */
  private isTopToBottom(): boolean {
    return this.skinParam.getRankdir() === Rankdir.TOP_TO_BOTTOM;
  }

  /** @see FingerImpl.java:86-88 */
  addInNail(child: FingerImpl): void {
    this.nail.push(child);
  }

  /** @see FingerImpl.java:90-94 */
  private constructor(idea: Idea, skinParam: MindMapSkinParam, direction: boolean, atomOps: AtomOps) {
    this.idea = idea;
    this.skinParam = skinParam;
    this.direction = direction ? 1 : -1;
    this.atomOps = atomOps;
  }

  /** @see FingerImpl.java:96-98 */
  private getMargin(): ClockwiseTopRightBottomLeft {
    return this.getStyle().getMargin();
  }

  /**
   * The phalanx at its placement, then every child at its `Tetris` y and the
   * link from `p1` (the phalanx's far edge) to it. The two position
   * computations are {@link getPhalanxPosition} / {@link getChildPosition}
   * (complexity cap).
   * @see FingerImpl.java:100-137
   */
  drawU(ug: UGraphic): void {
    const stringBounder = ug.getStringBounder();
    const phalanx = this.getPhalanx();
    const dimPhalanx = phalanx.calculateDimension(stringBounder);
    if (this.drawPhalanx) phalanx.drawU(ug.apply(this.getPhalanxPosition(stringBounder, dimPhalanx)));

    const p1 = this.isTopToBottom()
      ? new XPoint2D(0, this.direction * dimPhalanx.getHeight())
      : new XPoint2D(this.direction * dimPhalanx.getWidth(), 0);

    for (let i = 0; i < this.nail.length; i++) {
      const child = this.nail[i]!;
      const stp = this.getTetris(stringBounder).getElements()[i]!;
      const p2 = this.getChildPosition(stp, dimPhalanx);

      child.drawU(ug.apply(UTranslate.point(p2)));
      const linkColor = asSimple(this.getLinkColor());
      if (linkColor.isTransparent() === false)
        this.drawLine(ug.apply(new Fore(linkColor.asPaint())).apply(this.getUStroke()), p1, p2);
    }
  }

  /** `posX`/`posY` of the phalanx. @see FingerImpl.java:105-113 */
  private getPhalanxPosition(stringBounder: StringBounder, dimPhalanx: XDimension2D): UTranslate {
    if (this.isTopToBottom()) {
      const posX = -this.getPhalanxThickness(stringBounder) / 2;
      const posY = this.direction === 1 ? 0 : -dimPhalanx.getHeight();
      return new UTranslate(posX, posY);
    }
    const posX = this.direction === 1 ? 0 : -dimPhalanx.getWidth();
    const posY = -this.getPhalanxThickness(stringBounder) / 2;
    return new UTranslate(posX, posY);
  }

  /** `p2` of child `stp`. @see FingerImpl.java:125-129 */
  private getChildPosition(stp: SymetricalTeePositioned, dimPhalanx: XDimension2D): XPoint2D {
    if (this.isTopToBottom())
      return new XPoint2D(stp.getY(), this.direction * (dimPhalanx.getHeight() + this.getX12()));
    return new XPoint2D(this.direction * (dimPhalanx.getWidth() + this.getX12()), stp.getY());
  }

  /** @see FingerImpl.java:139-142 */
  private getLinkColor(): HColor {
    const styleArrow = this.getStyleArrow();
    return styleArrow.value('LineColor').asColor(this.skinParam.getIHtmlColorSet());
  }

  /** @see FingerImpl.java:144-147 */
  private getUStroke(): UStroke {
    const styleArrow = this.getStyleArrow();
    return styleArrow.getStroke();
  }

  /** @see FingerImpl.java:149-165 */
  private drawLine(ug: UGraphic, p1: XPoint2D, p2: XPoint2D): void {
    const path = UPath.none();
    path.moveTo(p1);
    if (this.isTopToBottom()) {
      const delta1 = this.direction * TB_DELTA1;
      const delta2 = this.direction * TB_DELTA2;
      path.lineTo(p1.getX(), p1.getY() + delta1);
      path.cubicTo(p1.getX(), p1.getY() + delta2, p2.getX(), p2.getY() - delta2, p2.getX(), p2.getY() - delta1);
    } else {
      const delta1 = this.direction * LR_DELTA1;
      const delta2 = this.direction * LR_DELTA2;
      path.lineTo(p1.getX() + delta1, p1.getY());
      path.cubicTo(p1.getX() + delta2, p1.getY(), p2.getX() - delta2, p2.getY(), p2.getX() - delta1, p2.getY());
    }
    path.lineTo(p2);
    ug.draw(path);
  }

  /** @see FingerImpl.java:167-176 */
  private getTetris(stringBounder: StringBounder): Tetris {
    if (this.tetris === undefined) {
      this.tetris = new Tetris(this.idea.getLabel().toString());
      for (const child of this.nail) this.tetris.add(child.asSymetricalTee(stringBounder));

      this.tetris.balance();
    }
    return this.tetris;
  }

  /** @see FingerImpl.java:178-187 */
  private asSymetricalTee(stringBounder: StringBounder): SymetricalTee {
    const thickness1 = this.getPhalanxThickness(stringBounder);
    const elongation1 = this.getPhalanxElongation(stringBounder);
    if (this.nail.length === 0) return new SymetricalTee(thickness1, elongation1, 0, 0);

    const thickness2 = this.getNailThickness(stringBounder);
    const elongation2 = this.getNailElongation(stringBounder);
    return new SymetricalTee(thickness1, elongation1 + this.getX1(), thickness2, this.getX2() + elongation2);
  }

  /** @see FingerImpl.java:189-194 */
  private getX1(): number {
    if (this.isTopToBottom()) return this.getMargin().getTop();
    else return this.getMargin().getLeft();
  }

  /** @see FingerImpl.java:196-201 */
  private getX2(): number {
    if (this.isTopToBottom()) return this.getMargin().getBottom() + X2_GAP_TB;
    else return this.getMargin().getRight() + X2_GAP_LR;
  }

  /** @see FingerImpl.java:203-205 */
  getX12(): number {
    return this.getX1() + this.getX2();
  }

  /** @see FingerImpl.java:207-211 */
  getPhalanxThickness(stringBounder: StringBounder): number {
    if (this.isTopToBottom()) return this.getPhalanx().calculateDimension(stringBounder).getWidth();
    return this.getPhalanx().calculateDimension(stringBounder).getHeight();
  }

  /** @see FingerImpl.java:213-217 */
  getPhalanxElongation(stringBounder: StringBounder): number {
    if (this.isTopToBottom()) return this.getPhalanx().calculateDimension(stringBounder).getHeight();
    return this.getPhalanx().calculateDimension(stringBounder).getWidth();
  }

  /**
   * BOX: the `FtileBoxOld` over the idea's `[#color]` back colour, padded
   * across the branch by the style margin. NONE (boxless): the bare creole
   * text, padded 3 on its branch side and 1 above and below. Java hands
   * `create0` a possibly-`null` alignment; the port's `CreoleParser` needs
   * one, so `null` becomes LEFT (the `FtileBoxOld.ts#createTb` precedent).
   * @see FingerImpl.java:219-243
   */
  private getPhalanx(): TextBlock {
    if (this.drawPhalanx === false) return TextBlockUtils.empty(0, 0);

    const style = this.getStyle();

    if (this.idea.getShape() === IdeaShape.BOX) {
      const foo = new SkinParamColors(this.skinParam, Colors.empty().add(ColorType.BACK, this.idea.getBackColor()));
      const box = FtileBoxOld.createMindMap(style, foo, this.idea.getLabel(), this.atomOps);
      const margin = this.getMargin();
      if (this.isTopToBottom()) return TextBlockUtils.withMargin(box, margin.getLeft(), margin.getRight(), 0, 0);
      else return TextBlockUtils.withMargin(box, 0, 0, margin.getTop(), margin.getBottom());
    }

    const text = create0(
      this.idea.getLabel(),
      {
        fontConfiguration: bridgeFontConfiguration(style.getFontConfiguration(this.skinParam.getIHtmlColorSet())),
        spriteContainer: this.skinParam,
        atomOps: this.atomOps,
      },
      {
        horizontalAlignment: style.getHorizontalAlignment() ?? HorizontalAlignment.LEFT,
        maxMessageSize: style.wrapWidth(),
        creoleMode: CreoleMode.FULL,
      },
    );
    if (this.direction === 1)
      return TextBlockUtils.withMargin(text, BOXLESS_MARGIN_X, 0, BOXLESS_MARGIN_Y, BOXLESS_MARGIN_Y);

    return TextBlockUtils.withMargin(text, 0, BOXLESS_MARGIN_X, BOXLESS_MARGIN_Y, BOXLESS_MARGIN_Y);
  }

  /** `nail` must mirror the idea's children before any style read. @see FingerImpl.java:245-250 */
  private getStyle(): Style {
    if (this.nail.length !== this.idea.getChildren().length) throw new Error('IllegalStateException');

    return this.idea.getStyle();
  }

  /** @see FingerImpl.java:252-254 */
  private getStyleArrow(): Style {
    return this.idea.getStyleArrow();
  }

  /** @see FingerImpl.java:256-258 */
  getNailThickness(stringBounder: StringBounder): number {
    return this.getTetris(stringBounder).getHeight();
  }

  /** @see FingerImpl.java:260-262 */
  getNailElongation(stringBounder: StringBounder): number {
    return this.getTetris(stringBounder).getWidth();
  }

  /** @see FingerImpl.java:264-268 */
  getFullThickness(stringBounder: StringBounder): number {
    const thickness1 = this.getPhalanxThickness(stringBounder);
    const thickness2 = this.getNailThickness(stringBounder);
    return Math.max(thickness1, thickness2);
  }

  /** @see FingerImpl.java:270-272 */
  getFullElongation(stringBounder: StringBounder): number {
    return this.getPhalanxElongation(stringBounder) + this.getNailElongation(stringBounder);
  }

  /** @see FingerImpl.java:274-276 */
  doNotDrawFirstPhalanx(): void {
    this.drawPhalanx = false;
  }
}
