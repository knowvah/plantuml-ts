import type { ISkinParamWithSimple } from '../../core/abel/ISkinParam.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import type { Display } from '../../core/klimt/creole/Display.js';
import { create0 } from '../../core/klimt/creole/DisplayCreole.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import { bridgeFontConfiguration } from '../../core/klimt/font/FontConfigurationBridge.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { TextBlockMemoized } from '../../core/klimt/shape/TextBlockMemoized.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import type { Stereotype } from '../../core/stereo/Stereotype.js';
import type { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { FtileBoxOld } from '../activity/ftile/vertical/FtileBoxOld.js';
import { IdeaShape } from '../mindmap/IdeaShape.js';

/** The boxless text's right pad (`withMargin(text, 0, 3, 1, 1)`). @see WBSTextBlock.java:113 */
const BOXLESS_MARGIN_X2 = 3;
/** The boxless text's top and bottom pad. @see WBSTextBlock.java:113 */
const BOXLESS_MARGIN_Y = 1;

/**
 * The `WElement` members `WBSTextBlock` and `ITFLeaf` read — a slice of
 * T1a's `WElement` contract (batch 1 runs in parallel), which the real
 * class satisfies structurally. `withBackColor` is typed over
 * `ISkinParamWithSimple` because its result feeds `FtileBoxOld.createWbs`
 * (and `SkinParamColors` requires it).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WElement.java
 */
export interface WElementSlice {
  getLevel(): number;
  getLabel(): Display;
  getShape(): IdeaShape;
  getStereotype(): Stereotype | undefined;
  getStyle(): Style;
  getStyleBuilder(): StyleBuilder;
  withBackColor(skinParam: ISkinParamWithSimple): ISkinParamWithSimple;
  setGeometry(position: UTranslate, dimension: XDimension2D): void;
}

/**
 * WBSTextBlock — the base of the two wbs composite blocks (`Fork` for the
 * root row, `ITFComposed` for a subtree): the node box, the `Width auto`
 * test, and the link style.
 *
 * Ported: the constructor (java:69-75), `isAutoWidth` (java:77-80),
 * `getIdea` (java:82-84), `getStyleUsed` (java:86-91), `drawLine`
 * (java:93-100), `buildMain` (java:102-114). Not ported: the ASCII
 * `asciiDraw` (java:116-122, D12: no `-ttxt` in this port).
 *
 * `atomOps` is ADR-9's injected creole capability, appended after every
 * upstream parameter (the `FtileBoxOld.ts`/`FingerImpl.ts` precedent).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WBSTextBlock.java:61-124
 */
export abstract class WBSTextBlock extends TextBlockMemoized {
  /** @see WBSTextBlock.java:63 */
  protected readonly skinParam: ISkinParamWithSimple;
  /** @see WBSTextBlock.java:64 */
  private readonly stereotype: Stereotype | undefined;
  /** @see WBSTextBlock.java:65 */
  private readonly styleBuilder: StyleBuilder;
  /** @see WBSTextBlock.java:66 */
  private readonly level: number;
  /** @see WBSTextBlock.java:67 */
  private readonly idea: WElementSlice;
  private readonly atomOps: AtomOps;

  /** @see WBSTextBlock.java:69-75 */
  constructor(skinParam: ISkinParamWithSimple, idea: WElementSlice, atomOps: AtomOps) {
    super();
    this.idea = idea;
    this.skinParam = skinParam;
    this.styleBuilder = idea.getStyleBuilder();
    this.level = idea.getLevel();
    this.stereotype = idea.getStereotype();
    this.atomOps = atomOps;
  }

  /** `"auto".equalsIgnoreCase(width)`; `ValueNull` reads `""`. @see WBSTextBlock.java:77-80 */
  protected isAutoWidth(): boolean {
    const width = this.idea.getStyle().value('Width').asString();
    return width !== null && width.toLowerCase() === 'auto';
  }

  /** @see WBSTextBlock.java:82-84 */
  protected getIdea(): WElementSlice {
    return this.idea;
  }

  /**
   * The link style: `arrow` at this block's level, per stereotype. Java
   * dereferences a `null` merged style in `drawLine` (an NPE); the port
   * throws here.
   * @see WBSTextBlock.java:86-91
   */
  private getStyleUsed(): Style {
    const signature = StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'arrow')
      .addLevel(this.level)
      .withTOBECHANGED(this.stereotype);
    const style = signature.getMergedStyle(this.styleBuilder);
    if (style === undefined) throw new Error('NullPointerException: no wbs arrow style in the StyleBuilder');
    return style;
  }

  /**
   * A straight link from the smaller x to the larger: `y1` stays with the
   * smaller x and `y2` with the larger, whichever end each came from.
   * @see WBSTextBlock.java:93-100
   */
  protected drawLine(ug: UGraphic, x1: number, y1: number, x2: number, y2: number): void {
    ug = this.getStyleUsed().applyStrokeAndLineColor(ug, this.skinParam.getIHtmlColorSet());
    const p1 = new XPoint2D(Math.min(x1, x2), y1);
    const p2 = new XPoint2D(Math.max(x1, x2), y2);
    const line = ULine.create(p1, p2);
    ug = ug.apply(UTranslate.point(p1));
    ug.draw(line);
  }

  /**
   * PSEUDO: nothing; BOX: the activity ftile box over the idea's back
   * colour; otherwise the bare creole text, padded 3 on the right and 1
   * above and below. Java hands `create0` a possibly-`null` alignment; the
   * port's `CreoleParser` needs one, so `null` becomes LEFT (the
   * `FtileBoxOld.ts#createTb` precedent).
   * @see WBSTextBlock.java:102-114
   */
  protected buildMain(idea: WElementSlice): TextBlock {
    const label = idea.getLabel();
    const style = idea.getStyle();
    if (idea.getShape() === IdeaShape.PSEUDO) return TextBlockUtils.EMPTY_TEXT_BLOCK;

    if (idea.getShape() === IdeaShape.BOX)
      return FtileBoxOld.createWbs(style, idea.withBackColor(this.skinParam), label, this.atomOps);

    const text = create0(
      label,
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
    return TextBlockUtils.withMargin(text, 0, BOXLESS_MARGIN_X2, BOXLESS_MARGIN_Y, BOXLESS_MARGIN_Y);
  }
}
