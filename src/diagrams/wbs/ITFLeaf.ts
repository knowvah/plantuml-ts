import type { ISkinParamWithSimple } from '../../core/abel/ISkinParam.js';
import { AbstractCommonUGraphic } from '../../core/klimt/AbstractCommonUGraphic.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { create0 } from '../../core/klimt/creole/DisplayCreole.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import { bridgeFontConfiguration } from '../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import { FtileBoxOld } from '../activity/ftile/vertical/FtileBoxOld.js';
import { IdeaShape } from '../mindmap/IdeaShape.js';
import { getMainBoxWidthDefault, type ITF } from './ITF.js';
import type { WElementSlice } from './WBSTextBlock.js';

/** The boxless text's right pad (`withMargin(text, 0, 3, 1, 1)`). @see ITFLeaf.java:79 */
const BOXLESS_MARGIN_X2 = 3;
/** The boxless text's top and bottom pad. @see ITFLeaf.java:79 */
const BOXLESS_MARGIN_Y = 1;

/**
 * ITFLeaf — a wbs leaf: its box (the activity ftile box, boxless creole
 * text, or nothing for PSEUDO), widened to the forced minimum width of a
 * `Width auto` parent, anchored at its own box.
 *
 * Mirrors upstream: the box is built over `skinParam` as passed — the
 * caller (`ITFComposed.build2`, java:113) applies `withBackColor` first.
 * Not ported: the ASCII `asciiDraw` (java:83-89, D12).
 *
 * Mutation contract (mirrors upstream): `forcedMinWidth` is set by the
 * parent's auto-width pass (`setForcedMinWidth`) before the parent
 * re-measures; `calculateDimension` is not memoized, so it reads the
 * current value.
 *
 * `atomOps` is ADR-9's injected creole capability, appended after every
 * upstream parameter (the `FtileBoxOld.ts`/`FingerImpl.ts` precedent).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/ITFLeaf.java:57-143
 */
export class ITFLeaf implements ITF {
  /** @see ITFLeaf.java:59 */
  private readonly box: TextBlock;
  /** `null` upstream unless BOX. @see ITFLeaf.java:60 */
  private readonly fbox: FtileBoxOld | undefined;
  /** @see ITFLeaf.java:61 */
  private readonly idea: WElementSlice;
  /** @see ITFLeaf.java:62 */
  private forcedMinWidth = 0;

  /** @see ITFLeaf.java:64-81 */
  constructor(idea: WElementSlice, skinParam: ISkinParamWithSimple, atomOps: AtomOps) {
    const shape = idea.getShape();
    const style = idea.getStyle();
    const label = idea.getLabel();
    this.idea = idea;
    if (shape === IdeaShape.PSEUDO) {
      this.fbox = undefined;
      this.box = TextBlockUtils.EMPTY_TEXT_BLOCK;
    } else if (shape === IdeaShape.BOX) {
      this.fbox = FtileBoxOld.createWbs(style, skinParam, label, atomOps);
      this.box = this.fbox;
    } else {
      this.fbox = undefined;
      // `null` alignment becomes LEFT: the port's `CreoleParser` needs one (`FtileBoxOld.ts#createTb`).
      const text = create0(
        label,
        {
          fontConfiguration: bridgeFontConfiguration(style.getFontConfiguration(skinParam.getIHtmlColorSet())),
          spriteContainer: skinParam,
          atomOps,
        },
        {
          horizontalAlignment: style.getHorizontalAlignment() ?? HorizontalAlignment.LEFT,
          maxMessageSize: style.wrapWidth(),
          creoleMode: CreoleMode.FULL,
        },
      );
      this.box = TextBlockUtils.withMargin(text, 0, BOXLESS_MARGIN_X2, BOXLESS_MARGIN_Y, BOXLESS_MARGIN_Y);
    }
  }

  /** @see ITFLeaf.java:91-96 */
  setForcedMinWidth(width: number): void {
    this.forcedMinWidth = width;
    if (this.fbox !== undefined) this.fbox.setMinimumWidth(width);
  }

  /** The `ITF` default. @see ITF.java:52-54 */
  getMainBoxWidth(stringBounder: StringBounder): number {
    return getMainBoxWidthDefault(this, stringBounder);
  }

  /** @see ITFLeaf.java:98-105 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    const dim = this.box.calculateDimension(stringBounder);
    if (this.fbox === undefined && this.forcedMinWidth > dim.getWidth())
      return new XDimension2D(this.forcedMinWidth, dim.getHeight());
    return dim;
  }

  /** @see ITFLeaf.java:107-121 */
  drawU(ug: UGraphic): void {
    if (ug instanceof AbstractCommonUGraphic) {
      const translate = ug.getTranslate();
      this.idea.setGeometry(translate, this.calculateDimension(ug.getStringBounder()));
    }
    if (this.fbox === undefined && this.forcedMinWidth > 0) {
      const boxDim = this.box.calculateDimension(ug.getStringBounder());
      if (this.forcedMinWidth > boxDim.getWidth()) {
        const dx = (this.forcedMinWidth - boxDim.getWidth()) / 2;
        this.box.drawU(ug.apply(UTranslate.dx(dx)));
        return;
      }
    }
    this.box.drawU(ug);
  }

  /** @see ITFLeaf.java:123-126 */
  getT1(stringBounder: StringBounder): XPoint2D {
    const dim = this.calculateDimension(stringBounder);
    return new XPoint2D(dim.getWidth() / 2, 0);
  }

  /** @see ITFLeaf.java:128-131 */
  getT2(stringBounder: StringBounder): XPoint2D {
    const dim = this.calculateDimension(stringBounder);
    return new XPoint2D(dim.getWidth() / 2, dim.getHeight());
  }

  /** @see ITFLeaf.java:133-136 */
  getF1(stringBounder: StringBounder): XPoint2D {
    const dim = this.calculateDimension(stringBounder);
    return new XPoint2D(0, dim.getHeight() / 2);
  }

  /** @see ITFLeaf.java:138-141 */
  getF2(stringBounder: StringBounder): XPoint2D {
    const dim = this.calculateDimension(stringBounder);
    return new XPoint2D(dim.getWidth(), dim.getHeight() / 2);
  }
}
