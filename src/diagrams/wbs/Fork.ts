import type { ISkinParamWithSimple } from '../../core/abel/ISkinParam.js';
import { Direction } from '../../core/abel/Direction.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { ITF } from './ITF.js';
import { ITFComposed } from './ITFComposed.js';
import { WBSTextBlock } from './WBSTextBlock.js';
import type { WElement } from './WElement.js';

/**
 * Fork — the root row of a WBS: the root box centred over a horizontal bar,
 * each RIGHT child of the root hung below it on a vertical stub, side by
 * side `delta1x` apart. Only the root builds one (level 0); every subtree
 * below it is an `ITFComposed.build2`.
 *
 * Ported: the constructor (java:58-67), `applyAutoWidth` (java:69-84),
 * `delta1x`/`deltay` (java:86-87), `drawU` (java:99-140),
 * `calculateDimensionSlow` (java:142-157). Not ported: the ASCII
 * `asciiDraw` (java:89-97, D12), and the `TeaVM.a()` assertion
 * (java:131-132, a TeaVM-build-only check that draws nothing). `drawU`'s
 * child loop is split into {@link drawChildren} for the repo's 30-NLOC
 * complexity hook; the statements and their order are upstream's.
 *
 * Mutation contract (mirrors upstream): `autoWidthApplied` is set by the
 * first of `calculateDimensionSlow`/`drawU`; the `Width auto` pass then
 * forces every child's main box to the widest and clears this block's
 * memoized dimension once.
 *
 * `atomOps` is ADR-9's injected creole capability, appended after every
 * upstream parameter (the `FtileBoxOld.ts`/`FingerImpl.ts` precedent).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/Fork.java:52-161
 */
export class Fork extends WBSTextBlock {
  /** @see Fork.java:54 */
  private readonly main: TextBlock;
  /** @see Fork.java:55 */
  private readonly right: ITF[] = [];
  /** @see Fork.java:56 */
  private autoWidthApplied = false;
  /** @see Fork.java:86 */
  private readonly delta1x = 20;
  /** @see Fork.java:87 */
  private readonly deltay = 40;

  /**
   * The block is built over `idea.withBackColor(skinParam)`; the children
   * over the unwrapped `skinParam`. A non-root idea throws.
   * @see Fork.java:58-67
   */
  constructor(skinParam: ISkinParamWithSimple, idea: WElement, atomOps: AtomOps) {
    super(idea.withBackColor(skinParam), idea, atomOps);
    if (idea.getLevel() !== 0) throw new Error('IllegalArgumentException: a Fork is built over the root only');

    this.main = this.buildMain(idea);
    for (const child of idea.getChildren(Direction.RIGHT))
      this.right.push(ITFComposed.build2(skinParam, child, atomOps));
  }

  /**
   * Called from both `calculateDimensionSlow()` and `drawU()` because
   * either may be invoked first; the flag runs it only once.
   * @see Fork.java:69-84
   */
  private applyAutoWidth(stringBounder: StringBounder): void {
    if (this.autoWidthApplied) return;
    this.autoWidthApplied = true;

    if (this.isAutoWidth() === false) return;
    let maxWidth = 0;
    for (const child of this.right) maxWidth = Math.max(maxWidth, child.getMainBoxWidth(stringBounder));
    for (const child of this.right) child.setForcedMinWidth(maxWidth);
    this.invalidateDimensionCache();
  }

  /** @see Fork.java:99-140 */
  drawU(ug: UGraphic): void {
    this.applyAutoWidth(ug.getStringBounder());
    const stringBounder = ug.getStringBounder();
    const mainDim = this.main.calculateDimension(stringBounder);

    const y0 = mainDim.getHeight();
    const y1 = y0 + this.deltay / 2;
    const y2 = y0 + this.deltay;
    const mainWidth = mainDim.getWidth();

    if (this.right.length === 0) {
      this.main.drawU(ug);
      this.drawLine(ug, mainWidth / 2, y0, mainWidth / 2, y1);
      return;
    }

    const firstX = this.right[0]!.getT1(stringBounder).getX();
    const lastX = this.drawChildren(ug, firstX, y1, y2);

    let posMain: number;
    if (lastX > firstX) {
      this.drawLine(ug, firstX, y1, lastX, y1);
      posMain = firstX + (lastX - firstX - mainWidth) / 2;
    } else {
      const fullDim = this.calculateDimension(stringBounder);
      posMain = (fullDim.getWidth() - mainWidth) / 2;
      this.drawLine(ug, firstX, y1, posMain + mainWidth / 2, y1);
    }
    this.main.drawU(ug.apply(UTranslate.dx(posMain)));
    this.drawLine(ug, posMain + mainWidth / 2, y0, posMain + mainWidth / 2, y1);
  }

  /**
   * `drawU`'s child loop: each child's stub from `y1` to `y2` at its `T1`,
   * the child at (`x`, `y2`), then `x` past it and `delta1x`; returns
   * `lastX`.
   * @see Fork.java:115-124
   */
  private drawChildren(ug: UGraphic, firstX: number, y1: number, y2: number): number {
    const stringBounder = ug.getStringBounder();
    let x = 0;
    let lastX = firstX;

    for (const child of this.right) {
      lastX = x + child.getT1(stringBounder).getX();
      this.drawLine(ug, lastX, y1, lastX, y2);
      child.drawU(ug.apply(new UTranslate(x, y2)));
      x += child.calculateDimension(stringBounder).getWidth() + this.delta1x;
    }
    return lastX;
  }

  /** @see Fork.java:142-157 */
  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    this.applyAutoWidth(stringBounder);
    let width = 0;
    let height = 0;
    for (const child of this.right) {
      const childDim = child.calculateDimension(stringBounder);
      height = Math.max(height, childDim.getHeight());
      width += childDim.getWidth();
    }
    if (this.right.length > 1) width += (this.right.length - 1) * this.delta1x;
    const mainDim = this.main.calculateDimension(stringBounder);
    height += mainDim.getHeight();
    height += this.deltay;
    width = Math.max(width, mainDim.getWidth());
    return new XDimension2D(width, height);
  }
}
