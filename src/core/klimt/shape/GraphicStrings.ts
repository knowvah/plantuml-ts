/**
 * `GraphicStrings` — a list of lines drawn as one creole block (sans-serif 12
 * black on white by default) inside a 5px margin, optionally with an image in
 * a corner or under the text. The text of every utility page (`version`,
 * `donors`, the openiconic/archimate listings, the eggs).
 *
 * `core/error/graphic-strings.ts#blackOnWhite` is an older, separate model of
 * `createBlackOnWhite` for the error/Welcome pages (an `ErrorBlock`, not a
 * klimt `TextBlock`); it is left as it is.
 *
 * Adaptations:
 * - `PortableImage` is the port's `RasterImage` (`core/error/raster-image.ts`:
 *   pixel size + data URI), drawn as a `UImage` at that size.
 * - `FontConfiguration` is built upstream-shaped (`abel/FontConfiguration`)
 *   and bridged to the creole `FontConfiguration` (`FontConfigurationBridge`).
 * - `implements IEntityImage` is dropped: the port's `abel/IEntityImage.ts` is
 *   a brand-only stub with no member in common (a TS weak type); the
 *   `IEntityImage` members (`getShapeType`, `getShield`, `isHidden`,
 *   `getOverscanX`, `isCrash`) are all ported.
 * - `CreoleMode.NO_CREOLE` (only `createForError`) needs `TextBlockRaw`,
 *   which is unported: that branch throws.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java
 */
import { FontConfiguration as AbelFontConfiguration } from '../../abel/FontConfiguration.js';
import type { RasterImage } from '../../error/raster-image.js';
import type { HColor } from '../../style/Value.js';
import { Margins, ShapeType } from '../../svek/image/EntityImageDescriptionSupport.js';
import { HColors } from '../color/HColors.js';
import { HColorSet } from '../color/HColorSet.js';
import type { HColorSimple } from '../color/HColorSimple.js';
import { CreoleMode } from '../creole/CreoleMode.js';
import { Display } from '../creole/Display.js';
import { Fore } from '../Fore.js';
import { bridgeFontConfiguration } from '../font/FontConfigurationBridge.js';
import type { StringBounder } from '../font/StringBounder.js';
import { UFontFactory } from '../font/UFontFactory.js';
import { GraphicPosition } from '../geom/GraphicPosition.js';
import { HorizontalAlignment } from '../geom/HorizontalAlignment.js';
import { XDimension2D } from '../geom/XDimension2D.js';
import { SpriteContainerEmpty } from '../sprite/SpriteContainerEmpty.js';
import type { UGraphic } from '../UGraphic.js';
import { UStroke } from '../UStroke.js';
import { UTranslate } from '../UTranslate.js';
import type { TextBlock } from './TextBlock.js';
import { TextBlockMemoized } from './TextBlockMemoized.js';
import { FontStyle } from './UText.js';
import type { FontConfiguration } from './UText.js';
import { UImage } from './UImage.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:63 */
const MARGIN = 5;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:75 */
const IMAGE_PADDING = 30;

/** `UFontFactory.sansSerif(12)` / `sansSerif(14)` / `monospace(14)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:118-128 */
const SIZE_12 = 12;
const SIZE_14 = 14;

/** `HColors` constants this port's `HColors` does not carry, resolved as
 *  upstream resolves them: `set.getColorOrWhite(...)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColors.java:88,91-92,97 */
const RED_LIGHT = '#FEF6F3';
const GREEN = '#00FF00';
const BLUE = '#0000FF';
const MY_GREEN = '#33FF02';

/** Every `HColors` constant is an `HColorSimple`, which the port's
 *  `getColorOrWhite`/`withDark` type as the opaque `HColor`. */
function simple(color: HColor): HColorSimple {
  return color as HColorSimple;
}

function htmlColor(hex: string): HColorSimple {
  return simple(HColorSet.instance().getColorOrWhite(hex));
}

/** `hyperlinkColor = HColors.BLUE`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:67 */
function hyperlinkColor(): HColorSimple {
  return htmlColor(BLUE);
}

/** `TEXTCOLOR = HColors.BLACK.withDark(HColors.WHITE)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:68 */
function textColor(): HColorSimple {
  return simple(HColors.BLACK.withDark(HColors.WHITE));
}

/** A font configuration upstream-shaped, and the creole one it bridges to. */
interface GraphicFont {
  readonly color: HColorSimple;
  readonly creole: FontConfiguration;
}

/** `FontConfiguration.create(font, color, hyperlinkColor, useUnderlineForHyperlink)`
 *  (`useUnderlineForHyperlink = UStroke.simple()`, java:70). */
function fontOf(font: ReturnType<typeof UFontFactory.sansSerif>, color: HColorSimple): GraphicFont {
  const creole = bridgeFontConfiguration(AbelFontConfiguration.create(font, color, hyperlinkColor(), UStroke.simple()));
  return { color, creole };
}

/** `FontConfiguration#bold()`: `add(FontStyle.BOLD)`. */
function bold(font: GraphicFont): GraphicFont {
  return { ...font, creole: { ...font.creole, styles: new Set([...font.creole.styles, FontStyle.BOLD]) } };
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:118-120 */
function sansSerif12(color: HColorSimple): GraphicFont {
  return fontOf(UFontFactory.sansSerif(SIZE_12), color);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:122-124 */
function sansSerif14(color: HColorSimple): GraphicFont {
  return fontOf(UFontFactory.sansSerif(SIZE_14), color);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:126-128 */
function monospaced14(color: HColorSimple): GraphicFont {
  return fontOf(UFontFactory.monospace(SIZE_14), color);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:86-91 */
function getForeColor(useRed: boolean): HColorSimple {
  if (useRed) return HColors.BLACK;
  return htmlColor(MY_GREEN);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:93-98 */
function getBackColor(useRed: boolean): HColorSimple {
  if (useRed) return htmlColor(RED_LIGHT);
  return HColors.BLACK;
}

/** The image and where it goes; both absent upstream when `image == null`. */
interface PlacedImage {
  readonly image: RasterImage;
  readonly position: GraphicPosition;
}

/** The constructor's `mode` and `isCrash` (java:130, :132). */
interface GraphicMode {
  readonly mode: CreoleMode;
  readonly isCrash: boolean;
}

/** Every factory but `createForError` and `createGreenOnBlackMonospaced`. */
const FULL: GraphicMode = { mode: CreoleMode.FULL, isCrash: false };

/** `createBlackOnWhite(strings, image, position)`'s mode (java:113-116). */
const FULL_BUT_UNDERSCORE: GraphicMode = { mode: CreoleMode.FULL_BUT_UNDERSCORE, isCrash: false };

/** `new UImage(new PixelImage(image, TYPE_BILINEAR))`: the raster at its pixel size. */
function uimage(image: RasterImage): UImage {
  return UImage.build(image.width, image.height, image.href);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:61 */
export class GraphicStrings extends TextBlockMemoized {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:81-84 */
  static createForError(strings: readonly string[], useRed: boolean): GraphicStrings {
    return new GraphicStrings(strings, bold(sansSerif14(getForeColor(useRed))), getBackColor(useRed), undefined, {
      mode: CreoleMode.NO_CREOLE,
      isCrash: true,
    });
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:100-103 */
  static createGreenOnBlackMonospaced(strings: readonly string[]): TextBlock {
    return new GraphicStrings(strings, monospaced14(htmlColor(GREEN)), HColors.BLACK, undefined, {
      mode: CreoleMode.SIMPLE_LINE,
      isCrash: false,
    });
  }

  /**
   * `createBlackOnWhite(strings)` (java:105-107, `CreoleMode.FULL`), or the
   * `(strings, image, position)` overload (java:113-116,
   * `FULL_BUT_UNDERSCORE`). The overloads differ by arity, as upstream's do:
   * passing `image`/`position` — even `undefined`, Java's `null` — selects the
   * second. An image without a position is neither drawn nor sized
   * (java:157-170, :181-188 test `position` after `image != null`).
   */
  static createBlackOnWhite(strings: readonly string[]): TextBlock;
  static createBlackOnWhite(
    strings: readonly string[],
    image: RasterImage | undefined,
    position: GraphicPosition | undefined,
  ): TextBlock;
  static createBlackOnWhite(
    strings: readonly string[],
    ...imageArgs: [] | [RasterImage | undefined, GraphicPosition | undefined]
  ): TextBlock {
    if (imageArgs.length === 0)
      return new GraphicStrings(strings, sansSerif12(textColor()), HColors.WHITE, undefined, FULL);
    const [image, position] = imageArgs;
    const placed = image === undefined || position === undefined ? undefined : { image, position };
    return new GraphicStrings(strings, sansSerif12(textColor()), HColors.WHITE, placed, FULL_BUT_UNDERSCORE);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:109-111 */
  static createBlackOnWhiteMonospaced(strings: readonly string[]): TextBlock {
    return new GraphicStrings(strings, monospaced14(textColor()), HColors.WHITE, undefined, FULL);
  }

  /** `mode`/`isCrash` travel as one {@link GraphicMode} (the complexity
   *  hook's 5-parameter cap); every upstream value is kept.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:132-142 */
  private constructor(
    private readonly strings: readonly string[],
    private readonly fontConfiguration: GraphicFont,
    private readonly background: HColorSimple,
    private readonly placed: PlacedImage | undefined,
    private readonly graphicMode: GraphicMode,
  ) {
    super();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:144-151 */
  private getTextBlock(): TextBlock {
    const display = Display.create([...this.strings]);
    if (this.graphicMode.mode === CreoleMode.NO_CREOLE)
      throw new Error('GraphicStrings: TextBlockRaw (CreoleMode.NO_CREOLE) is not ported');
    const fontConfiguration = this.fontConfiguration.creole;
    const spriteContainer = new SpriteContainerEmpty();
    const ctx = { fontConfiguration, spriteContainer, atomOps: spriteContainer.atomOps(fontConfiguration) };
    return display.create7(ctx, HorizontalAlignment.LEFT, this.graphicMode.mode);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:153-172 */
  drawU(ug: UGraphic): void {
    const inner = ug.apply(new UTranslate(MARGIN, MARGIN));
    const size = this.calculateDimension(inner.getStringBounder()).delta(-2 * MARGIN);
    this.getTextBlock().drawU(inner.apply(new Fore(this.fontConfiguration.color)));
    if (this.placed === undefined) return;
    const { image, position } = this.placed;
    if (position === GraphicPosition.BOTTOM)
      inner
        .apply(new UTranslate((size.getWidth() - image.width) / 2, size.getHeight() - image.height))
        .draw(uimage(image));
    else if (position === GraphicPosition.BACKGROUND_CORNER_BOTTOM_RIGHT)
      inner.apply(new UTranslate(size.getWidth() - image.width, size.getHeight() - image.height)).draw(uimage(image));
    else inner.apply(new UTranslate(size.getWidth() - image.width - 1, 1)).draw(uimage(image));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:174-177 */
  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    return this.calculateDimensionInternal22(stringBounder).delta(2 * MARGIN);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:179-191 */
  private calculateDimensionInternal22(stringBounder: StringBounder): XDimension2D {
    const dim = this.getTextBlock().calculateDimension(stringBounder);
    if (this.placed === undefined) return dim;
    const { image, position } = this.placed;
    if (position === GraphicPosition.BOTTOM) return new XDimension2D(dim.getWidth(), dim.getHeight() + image.height);
    return new XDimension2D(dim.getWidth() + IMAGE_PADDING + image.width, dim.getHeight());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:193-195 */
  getShapeType(): ShapeType {
    return ShapeType.RECTANGLE;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:197-199 */
  getBackcolor(): HColorSimple {
    return this.background;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:201-203 */
  getShield(_stringBounder: StringBounder): Margins {
    return Margins.NONE;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:205-207 */
  isHidden(): boolean {
    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:209-211 */
  getOverscanX(_stringBounder: StringBounder): number {
    return 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java:213-216 */
  isCrash(): boolean {
    return this.graphicMode.isCrash;
  }
}
