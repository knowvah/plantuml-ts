import type { ISkinParamWithSimple } from '../../../../core/abel/ISkinParam.js';
import type { Colors } from '../../../../core/abel/Colors.js';
import { Back } from '../../../../core/klimt/Back.js';
import { Fore } from '../../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../../core/klimt/UGraphic.js';
import { UStroke } from '../../../../core/klimt/UStroke.js';
import { UTranslate } from '../../../../core/klimt/UTranslate.js';
import { HColorGradient } from '../../../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../../../core/klimt/color/HColorSimple.js';
import { HColors } from '../../../../core/klimt/color/HColors.js';
import { CreoleMode } from '../../../../core/klimt/creole/CreoleMode.js';
import type { Display } from '../../../../core/klimt/creole/Display.js';
import type { AtomOps } from '../../../../core/klimt/creole/Sea.js';
import { SheetBlock1 } from '../../../../core/klimt/creole/SheetBlock1.js';
import { SheetBlock2 } from '../../../../core/klimt/creole/SheetBlock2.js';
import type { Stencil } from '../../../../core/klimt/creole/Stencil.js';
import { bridgeFontConfiguration } from '../../../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../../../core/klimt/font/StringBounder.js';
import { HorizontalAlignment } from '../../../../core/klimt/geom/HorizontalAlignment.js';
import type { TextBlock } from '../../../../core/klimt/shape/TextBlock.js';
import type { Paint } from '../../../../core/paint.js';
import { SkinParamColors } from '../../../../core/skin/SkinParamColors.js';
import type { Style } from '../../../../core/style/Style.js';
import type { HColor } from '../../../../core/style/Value.js';
import { AbstractFtile } from '../AbstractFtile.js';
import { BoxStyle } from '../BoxStyle.js';
import { FtileGeometry } from '../FtileGeometry.js';

/** `UStroke.withThickness(1)`, the `SheetBlock2` default stroke. @see FtileBoxOld.java:173 */
const SHEET_BLOCK2_THICKNESS = 1;

/**
 * `ug.apply(HColor)` / `ug.apply(HColor.bg())`: the port's `UGraphic`
 * takes a `Paint` wrapped in `Fore`/`Back`; the style engine's colours are
 * `HColorSimple` (`HColorSet.instance()`), whose port-only `asPaint` is
 * `HColor#toSvg(ColorMapper.IDENTITY)`. Java's checked cast otherwise.
 */
function paintOf(color: HColor): Paint {
  if (color instanceof HColorSimple || color instanceof HColorGradient) return color.asPaint();
  throw new Error('ClassCastException: box colour is not an HColorSimple');
}

/**
 * FtileBoxOld — the rounded box a mindmap/wbs idea (and an old-style
 * activity action) is drawn in: a `SheetBlock2` over the label's creole
 * sheet, padded by the style, outlined by `BoxStyle`.
 *
 * Ported: `setMinimumWidth` (java:84-87), `MyStencil` (java:124-137), both
 * factories (java:139-146), the constructor (java:148-176), `toString`
 * (java:178-183), `drawU` (java:185-223), `tbWidth` (java:225-227),
 * `calculateDimensionFtile` (java:229-237), `getMyChildren` (java:239-241).
 * Not ported: the `Ftile` graph members `getInLinkRendering`/`getSwimlanes`/
 * `getSwimlaneIn`/`getSwimlaneOut` (java:101-122) and the fields behind
 * them — `inRendering = LinkRendering.create(Rainbow.build(styleArrow, ...))`
 * (java:162) and `swimlane` (always `null` from both factories). No mindmap
 * or wbs path reads them; the activity ftile graph that does is not built
 * by this port (its activity engine is the separate `tiles/` tree), so
 * `styleArrow` is accepted and unused. Likewise the activity-only
 * `getDefaultStyleDefinitionActivity/Arrow` (java:98-104).
 *
 * `atomOps` is ADR-9's injected creole capability, appended after every
 * upstream parameter (the `SheetBlock1.ts`/`DisplayCreole.ts` precedent):
 * the port's `SheetBlock1` measures and draws atoms through it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBoxOld.java:72-243
 */
export class FtileBoxOld extends AbstractFtile implements TextBlock {
  /** @see FtileBoxOld.java:78 */
  private readonly tb: TextBlock;
  /** `= 25` upstream, always overwritten by the constructor. @see FtileBoxOld.java:79,168 */
  private readonly roundCorner: number;
  /** @see FtileBoxOld.java:80 */
  private readonly shadowing: number;
  /** `null` upstream where `HorizontalAlignment.fromString` fails. @see FtileBoxOld.java:81 */
  private readonly horizontalAlignment: HorizontalAlignment | undefined;
  /** @see FtileBoxOld.java:82 */
  private minimumWidth = 0;
  /** @see FtileBoxOld.java:91 */
  private readonly boxStyle: BoxStyle;
  /** @see FtileBoxOld.java:93 */
  private readonly borderColor: HColor | undefined;
  /** @see FtileBoxOld.java:94 */
  private readonly backColor: HColor | undefined;
  /** @see FtileBoxOld.java:95 */
  private readonly style: Style;
  /** @see FtileBoxOld.java:178 */
  private readonly print: string;

  /** @see FtileBoxOld.java:139-142 */
  static createWbs(style: Style, skinParam: ISkinParamWithSimple, label: Display, atomOps: AtomOps): FtileBoxOld {
    const styleArrow = style;
    return new FtileBoxOld(skinParam, label, BoxStyle.PLAIN, [style, styleArrow], atomOps);
  }

  /** @see FtileBoxOld.java:144-146 */
  static createMindMap(style: Style, skinParam: ISkinParamWithSimple, label: Display, atomOps: AtomOps): TextBlock {
    return new FtileBoxOld(skinParam, label, BoxStyle.PLAIN, [style, style], atomOps);
  }

  /**
   * `swimlane` (always `null` from both factories) is dropped, and `style`/
   * `styleArrow` travel as one pair, keeping the 5-parameter cap; the
   * `fc` / `sheet` / `tb` statements (java:161,171-173) are
   * {@link createTb}, keeping the 30-line cap.
   * @see FtileBoxOld.java:148-176
   */
  private constructor(
    skinParam: ISkinParamWithSimple,
    label: Display,
    boxStyle: BoxStyle,
    styles: readonly [style: Style, styleArrow: Style],
    atomOps: AtomOps,
  ) {
    super(skinParam);
    const specBack: Colors | undefined = skinParam instanceof SkinParamColors ? skinParam.getColors() : undefined;

    const style = styles[0].eventuallyOverride(specBack);
    this.style = style;
    this.boxStyle = boxStyle;

    this.borderColor = style.value('LineColor').asColor(this.getIHtmlColorSet());
    this.backColor = style.value('BackGroundColor').asColor(this.getIHtmlColorSet());
    this.horizontalAlignment = style.getHorizontalAlignment();
    this.roundCorner = style.value('RoundCorner').asDouble();
    this.shadowing = style.getShadowing();
    this.minimumWidth = style.value('MinimumWidth').asDouble();

    this.tb = this.createTb(skinParam, label, style, atomOps);
    this.print = label.toString();
  }

  /** `fc`, `wrapWidth`, the sheet and the `SheetBlock2`. @see FtileBoxOld.java:161,166,171-173 */
  private createTb(skinParam: ISkinParamWithSimple, label: Display, style: Style, atomOps: AtomOps): TextBlock {
    const fc = bridgeFontConfiguration(style.getFontConfiguration(this.getIHtmlColorSet()));
    const wrapWidth = style.wrapWidth();
    // The port's `CreoleParser` requires an alignment where Java would carry `null`.
    const sheet = skinParam
      .sheet(fc, this.horizontalAlignment ?? HorizontalAlignment.LEFT, CreoleMode.FULL)
      .createSheet(label);
    return new SheetBlock2(
      new SheetBlock1(sheet as ConstructorParameters<typeof SheetBlock1>[0], wrapWidth, atomOps, style),
      new MyStencil(this),
      UStroke.withThickness(SHEET_BLOCK2_THICKNESS),
    );
  }

  /** @see FtileBoxOld.java:84-87 */
  setMinimumWidth(minimumWidth: number): void {
    this.minimumWidth = Math.max(this.minimumWidth, minimumWidth);
    this.invalidateGeometryCache();
  }

  /** @see FtileBoxOld.java:180-183 */
  toString(): string {
    return this.print;
  }

  /** @see FtileBoxOld.java:185-223 */
  drawU(ugIn: UGraphic): void {
    const stringBounder = ugIn.getStringBounder();
    const dimTotal = this.calculateDimension(stringBounder);
    const widthTotal = dimTotal.getWidth();
    const heightTotal = dimTotal.getHeight();

    const thickness = this.style.getStroke();

    let ug = ugIn;
    if (this.borderColor === undefined) ug = ug.apply(new Fore(paintOf(HColors.none())));
    else ug = ug.apply(new Fore(paintOf(this.borderColor)));

    if (this.backColor === undefined) ug = ug.apply(new Back(paintOf(HColors.none())));
    else ug = ug.apply(new Back(paintOf(this.backColor)));

    ug = ug.apply(thickness);
    this.boxStyle.drawMe(ug, widthTotal, heightTotal, this.shadowing, this.roundCorner);

    if (this.horizontalAlignment === HorizontalAlignment.LEFT) this.tb.drawU(ug);
    else if (this.horizontalAlignment === HorizontalAlignment.RIGHT)
      this.tb.drawU(ug.apply(new UTranslate(dimTotal.getWidth() - this.tbWidth(stringBounder), 0)));
    else if (this.horizontalAlignment === HorizontalAlignment.CENTER)
      this.tb.drawU(ug.apply(new UTranslate((dimTotal.getWidth() - this.tbWidth(stringBounder)) / 2, 0)));
  }

  /** @see FtileBoxOld.java:225-227 */
  private tbWidth(stringBounder: StringBounder): number {
    return Math.max(this.minimumWidth, this.tb.calculateDimension(stringBounder).getWidth());
  }

  /** @see FtileBoxOld.java:229-237 */
  protected calculateDimensionFtile(stringBounder: StringBounder): FtileGeometry {
    let dimRaw = this.tb.calculateDimension(stringBounder);
    dimRaw = dimRaw.atLeast(this.minimumWidth, 0);
    return new FtileGeometry(
      dimRaw.getWidth() + this.boxStyle.getShield(),
      dimRaw.getHeight(),
      dimRaw.getWidth() / 2,
      0,
      dimRaw.getHeight(),
    );
  }

  /** @see FtileBoxOld.java:239-241 */
  getMyChildren(): readonly never[] {
    return [];
  }
}

/**
 * The inner class `FtileBoxOld.MyStencil`: the `SheetBlock2` clip spans the
 * whole box (`0` .. the box's own width).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBoxOld.java:124-137
 */
class MyStencil implements Stencil {
  constructor(private readonly outer: FtileBoxOld) {}

  /** @see FtileBoxOld.java:126-129 */
  getStartingX(_stringBounder: StringBounder, _y: number): number {
    return 0;
  }

  /** @see FtileBoxOld.java:131-135 */
  getEndingX(stringBounder: StringBounder, _y: number): number {
    const dim = this.outer.calculateDimension(stringBounder);
    return dim.getWidth();
  }
}
