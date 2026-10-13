import type { ISkinParamWithSimple } from '../../core/abel/ISkinParam.js';
import { Direction } from '../../core/abel/Direction.js';
import { AbstractCommonUGraphic } from '../../core/klimt/AbstractCommonUGraphic.js';
import { Fore } from '../../core/klimt/Fore.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { HColorOrPaint } from '../../core/klimt/color/ColorMapper.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { HColor } from '../../core/style/Value.js';
import { FtileBoxOld } from '../activity/ftile/vertical/FtileBoxOld.js';
import { IdeaShape } from '../mindmap/IdeaShape.js';
import type { ITF } from './ITF.js';
import { ITFLeaf } from './ITFLeaf.js';
import { WBSTextBlock } from './WBSTextBlock.js';
import type { WElement } from './WElement.js';

/**
 * `ug.apply(lineColor)`: applying an `HColor` sets the foreground
 * (AbstractCommonUGraphic.java:123-124), the port's `Fore`, which carries
 * an `HColorSimple`/`HColorGradient` (the `Style.ts#foregroundOf` cast).
 */
function asForeground(color: HColor): HColorOrPaint {
  if (color instanceof HColorSimple || color instanceof HColorGradient) return color;
  throw new Error('ClassCastException: link colour is not an HColorSimple');
}

/**
 * ITFComposed — a wbs subtree with children: its main box (the node) over a
 * vertical trunk, the LEFT children stacked down the trunk's left side and
 * the RIGHT children down its right, each hung on a horizontal link at its
 * own `F2`/`F1` height.
 *
 * Ported: the constructor (java:71-78), `getMainBoxWidth` (java:80-83),
 * `setForcedMinWidth` (java:85-89), `applyAutoWidth` (java:93-109),
 * `build2` (java:111-124), `getw1` (java:126-130), `getT1`/`getT2`/`getF1`/
 * `getF2` (java:132-157), `calculateDimensionSlow` (java:159-169), `drawU`
 * (java:179-218), `getLinkColor` (java:220-224), `getCollWidth` (java:226-
 * 232), `getCollHeight` (java:234-241). Not ported: the ASCII `asciiDraw`
 * (java:171-177, D12). `drawU`'s two child loops are split into
 * {@link drawLeft}/{@link drawRight} for the repo's 30-NLOC complexity hook;
 * the statements and their order are upstream's.
 *
 * Mutation contract (mirrors upstream): `autoWidthApplied` is set by the
 * first of `calculateDimensionSlow`/`drawU`; the `Width auto` pass then
 * forces every child's main box to the widest and clears this block's
 * memoized dimension once.
 *
 * `atomOps` is ADR-9's injected creole capability, appended after every
 * upstream parameter (the `FtileBoxOld.ts`/`FingerImpl.ts` precedent).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/ITFComposed.java:60-244
 */
export class ITFComposed extends WBSTextBlock implements ITF {
  /** @see ITFComposed.java:62 */
  private readonly left: readonly ITF[];
  /** @see ITFComposed.java:63 */
  private readonly right: readonly ITF[];
  /** @see ITFComposed.java:65 */
  private readonly main: TextBlock;
  /** @see ITFComposed.java:67 */
  private readonly delta1x = 10;
  /** `// = 15` upstream: the default skin's node `Margin`. @see ITFComposed.java:68 */
  private readonly marginBottom: number;
  /** @see ITFComposed.java:69 */
  private autoWidthApplied = false;

  /** @see ITFComposed.java:71-78 */
  private constructor(
    skinParam: ISkinParamWithSimple,
    idea: WElement,
    left: readonly ITF[],
    right: readonly ITF[],
    atomOps: AtomOps,
  ) {
    super(skinParam, idea, atomOps);
    this.left = left;
    this.right = right;
    this.main = this.buildMain(idea);
    const style = idea.getStyle();
    this.marginBottom = idea.getShape() === IdeaShape.PSEUDO ? 0 : style.getMargin().getBottom();
  }

  /** @see ITFComposed.java:80-83 */
  getMainBoxWidth(stringBounder: StringBounder): number {
    return this.main.calculateDimension(stringBounder).getWidth();
  }

  /** @see ITFComposed.java:85-89 */
  setForcedMinWidth(width: number): void {
    if (this.main instanceof FtileBoxOld) this.main.setMinimumWidth(width);
  }

  /**
   * Called from both `calculateDimensionSlow()` and `drawU()` because
   * either may be invoked first; the flag runs it only once.
   * @see ITFComposed.java:91-109
   */
  private applyAutoWidth(stringBounder: StringBounder): void {
    if (this.autoWidthApplied) return;
    this.autoWidthApplied = true;
    if (this.isAutoWidth() === false) return;

    const all: ITF[] = [];
    all.push(...this.left);
    all.push(...this.right);
    let maxWidth = 0;
    for (const child of all) maxWidth = Math.max(maxWidth, child.getMainBoxWidth(stringBounder));
    for (const child of all) child.setForcedMinWidth(maxWidth);
    this.invalidateDimensionCache();
  }

  /**
   * A leaf over `idea.withBackColor(skinParam)`, else the LEFT and RIGHT
   * children built recursively over the unwrapped `skinParam`.
   * @see ITFComposed.java:111-124
   */
  static build2(skinParam: ISkinParamWithSimple, idea: WElement, atomOps: AtomOps): ITF {
    if (idea.isLeaf()) return new ITFLeaf(idea, idea.withBackColor(skinParam), atomOps);

    const left: ITF[] = [];
    const right: ITF[] = [];
    for (const child of idea.getChildren(Direction.LEFT)) left.push(ITFComposed.build2(skinParam, child, atomOps));

    for (const child of idea.getChildren(Direction.RIGHT)) right.push(ITFComposed.build2(skinParam, child, atomOps));

    return new ITFComposed(skinParam, idea, left, right, atomOps);
  }

  /** The trunk's x: half the main box, or the LEFT column plus `delta1x`. @see ITFComposed.java:126-130 */
  protected getw1(stringBounder: StringBounder): number {
    const mainDim = this.main.calculateDimension(stringBounder);
    const mainWidth = mainDim.getWidth();
    return Math.max(mainWidth / 2, this.delta1x + this.getCollWidth(stringBounder, this.left));
  }

  /** @see ITFComposed.java:132-136 */
  getT1(stringBounder: StringBounder): XPoint2D {
    const x = this.getw1(stringBounder);
    const y = 0;
    return new XPoint2D(x, y);
  }

  /** @see ITFComposed.java:138-143 */
  getT2(stringBounder: StringBounder): XPoint2D {
    const mainDim = this.main.calculateDimension(stringBounder);
    const x = this.getw1(stringBounder);
    const y = mainDim.getHeight();
    return new XPoint2D(x, y);
  }

  /** @see ITFComposed.java:145-150 */
  getF1(stringBounder: StringBounder): XPoint2D {
    const mainDim = this.main.calculateDimension(stringBounder);
    const x = this.getw1(stringBounder) - mainDim.getWidth() / 2;
    const y = mainDim.getHeight() / 2;
    return new XPoint2D(x, y);
  }

  /** @see ITFComposed.java:152-157 */
  getF2(stringBounder: StringBounder): XPoint2D {
    const mainDim = this.main.calculateDimension(stringBounder);
    const x = this.getw1(stringBounder) + mainDim.getWidth() / 2;
    const y = mainDim.getHeight() / 2;
    return new XPoint2D(x, y);
  }

  /** @see ITFComposed.java:159-169 */
  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    this.applyAutoWidth(stringBounder);
    const mainDim = this.main.calculateDimension(stringBounder);
    const mainWidth = mainDim.getWidth();
    const height =
      mainDim.getHeight() +
      Math.max(
        this.getCollHeight(stringBounder, this.left, this.marginBottom),
        this.getCollHeight(stringBounder, this.right, this.marginBottom),
      );
    const width =
      Math.max(mainWidth / 2, this.delta1x + this.getCollWidth(stringBounder, this.left)) +
      Math.max(mainWidth / 2, this.delta1x + this.getCollWidth(stringBounder, this.right));
    return new XDimension2D(width, height);
  }

  /** @see ITFComposed.java:179-218 */
  drawU(ug: UGraphic): void {
    this.applyAutoWidth(ug.getStringBounder());
    const stringBounder = ug.getStringBounder();

    const mainDim = this.main.calculateDimension(stringBounder);

    if (ug instanceof AbstractCommonUGraphic) {
      const translate = ug.getTranslate();
      this.getIdea().setGeometry(translate, mainDim);
    }

    const wx = this.getw1(stringBounder) - mainDim.getWidth() / 2;
    this.main.drawU(ug.apply(UTranslate.dx(wx)));
    const x = this.getw1(stringBounder);
    const lineColor = this.getLinkColor();
    const lastY1 = this.drawLeft(ug, lineColor, x, mainDim.getHeight());
    const lastY2 = this.drawRight(ug, lineColor, x, mainDim.getHeight());
    this.drawLine(ug.apply(new Fore(lineColor)), x, mainDim.getHeight(), x, Math.max(lastY1, lastY2));
  }

  /**
   * `drawU`'s LEFT loop: each child hung `delta1x` left of the trunk, its
   * link from its `F2` to the trunk; returns `lastY1`.
   * @see ITFComposed.java:194-205
   */
  private drawLeft(ug: UGraphic, lineColor: HColorOrPaint, x: number, mainHeight: number): number {
    const stringBounder = ug.getStringBounder();
    let y = mainHeight;
    let lastY1 = y;
    for (const child of this.left) {
      y += this.marginBottom;
      const childDim = child.calculateDimension(stringBounder);
      lastY1 = y + child.getF2(stringBounder).getY();
      this.drawLine(
        ug.apply(new Fore(lineColor)),
        x - childDim.getWidth() - this.delta1x + child.getF2(stringBounder).getX(),
        lastY1,
        x,
        lastY1,
      );
      child.drawU(ug.apply(new UTranslate(x - childDim.getWidth() - this.delta1x, y)));
      y += childDim.getHeight();
    }
    return lastY1;
  }

  /**
   * `drawU`'s RIGHT loop: each child hung `delta1x` right of the trunk, its
   * link from the trunk to its `F1`; returns `lastY2`.
   * @see ITFComposed.java:207-216
   */
  private drawRight(ug: UGraphic, lineColor: HColorOrPaint, x: number, mainHeight: number): number {
    const stringBounder = ug.getStringBounder();
    let y = mainHeight;
    let lastY2 = y;
    for (const child of this.right) {
      y += this.marginBottom;
      const childDim = child.calculateDimension(stringBounder);
      lastY2 = y + child.getF1(stringBounder).getY();
      this.drawLine(
        ug.apply(new Fore(lineColor)),
        x,
        lastY2,
        x + this.delta1x + child.getF1(stringBounder).getX(),
        lastY2,
      );
      child.drawU(ug.apply(new UTranslate(x + this.delta1x, y)));
      y += childDim.getHeight();
    }
    return lastY2;
  }

  /**
   * `LineColor` of this node's own style signature, per stereotype. Java
   * dereferences a `null` merged style (an NPE); the port throws there.
   * The colour is overridden by `drawLine`'s `applyStrokeAndLineColor`.
   * @see ITFComposed.java:220-224
   */
  private getLinkColor(): HColorOrPaint {
    const styleArrow = this.getIdea()
      .getStyle()
      .getSignature()
      .withTOBECHANGED(this.getIdea().getStereotype())
      .getMergedStyle(this.getIdea().getStyleBuilder());
    if (styleArrow === undefined) throw new Error('NullPointerException: no wbs link style in the StyleBuilder');
    return asForeground(styleArrow.value('LineColor').asColor(this.skinParam.getIHtmlColorSet()));
  }

  /** @see ITFComposed.java:226-232 */
  private getCollWidth(stringBounder: StringBounder, all: readonly TextBlock[]): number {
    let result = 0;
    for (const child of all) result = Math.max(result, child.calculateDimension(stringBounder).getWidth());

    return result;
  }

  /** @see ITFComposed.java:234-241 */
  private getCollHeight(stringBounder: StringBounder, all: readonly TextBlock[], deltay: number): number {
    let result = 0;
    for (const child of all) result += deltay + child.calculateDimension(stringBounder).getHeight();

    return result;
  }
}
