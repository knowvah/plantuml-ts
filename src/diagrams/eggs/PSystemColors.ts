/**
 * `PSystemColors` — the `colors` page: every named colour as a 175x28 swatch
 * in 21-row columns, or, given a colour, a 19-hexagon palette of the names
 * closest to it (http://www.redblobgames.com/grids/hexagons/).
 *
 * Adaptations:
 * - `UFontFactory.sansSerif(14).withFontFace(UFontFace.bold())` (java:177,
 *   :264): `UFont#withFontFace` is unported, so the bold face is built with
 *   the public `UFont` constructor (`new UFont(stack, face, size)`, what
 *   `withFontFace` returns, UFont.java:89-93), `UFontFace.bold()` spelled
 *   `{ cssWeight: 700, italic: false }` as `style/ValueImpl.ts` spells it.
 * - `HColors.BLUE` (java:287) is not in the port's `HColors`; it is resolved
 *   as upstream builds it, `set.getColorOrWhite("#0000FF")` (HColors.java:92),
 *   the `GraphicStrings.ts` precedent.
 * - `HColor#opposite()` is called on `getColorOrWhite` results (java:286),
 *   typed `HColorSimple | HColorGradient` in the port; `HColorGradient#opposite`
 *   is unported. Every colour reaching it is an `HColorSimple` (the names are
 *   plain colours, the argument passed the java:99 test), so the result is
 *   narrowed with Java's checked cast, as `closeComparator` (java:253-257)
 *   already does upstream.
 * - `colors automatic`: `HColorSet.ts` throws for `HColorAutomagic`
 *   (unported), so the java:99/:122 test throws where the jar draws the full
 *   grid — the task's named residual.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java
 */
import { FontConfiguration } from '../../core/abel/FontConfiguration.js';
import type { UmlSource } from '../../core/block-extractor.js';
import { Back } from '../../core/klimt/Back.js';
import { HColors } from '../../core/klimt/color/HColors.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import type { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { Fore } from '../../core/klimt/Fore.js';
import { bridgeFontConfiguration } from '../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { UFont } from '../../core/klimt/font/UFont.js';
import { UFontFactory } from '../../core/klimt/font/UFontFactory.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { UPolygon } from '../../core/klimt/shape/UPolygon.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import type { FontFace } from '../../core/klimt/shape/UText.js';
import { SpriteContainerEmpty } from '../../core/klimt/sprite/SpriteContainerEmpty.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { BackSlash } from '../../core/text/BackSlash.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { UgSimpleDiagram } from '../../core/UgSimpleDiagram.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:77 */
const RECTANGLE_HEIGHT = 28;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:78 */
const RECTANGLE_WIDTH = 175;

/** The hexagon radius. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:81 */
const SIZE = 60;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:106 */
const NB_ROWS = 21;

/** `if (j++ == 20)`: the last row index of a column.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:278 */
const LAST_ROW = 20;

/** `maxI` / `maxJ`: the palette's two rings.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:114-115 */
const MAX_I = 2;
const MAX_J = 2;

/** `UFontFactory.sansSerif(14)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:177,264 */
const FONT_SIZE = 14;

/** `UFontFace.bold()`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/UFontFace.java:56,78-80 */
const BOLD: FontFace = { cssWeight: 700, italic: false };

/** `BLUE = set.getColorOrWhite("#0000FF")`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColors.java:92 */
const BLUE = '#0000FF';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:229 */
const GRAY = 'Gray';
const GREY = 'Grey';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:93 */
const DESCRIPTION = '(Colors)';

/** Java's checked `(HColorSimple)` cast. */
function asSimple(color: HColorSimple | HColorGradient): HColorSimple {
  if (!(color instanceof HColorSimple)) throw new Error('ClassCastException: not an HColorSimple');
  return color;
}

/** `Character.isLowerCase(char)`. */
function isLowerCase(c: string): boolean {
  return /^\p{Ll}$/u.test(c);
}

/** `UFontFactory.sansSerif(14).withFontFace(UFontFace.bold())`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:177,264 */
function boldSansSerif14(): UFont {
  const font = UFontFactory.sansSerif(FONT_SIZE);
  return new UFont(font.getFontStack(), BOLD, font.getSize());
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:75 */
export class PSystemColors extends UgSimpleDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:79 */
  private readonly colors = HColorSet.instance();
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:80 */
  private readonly paletteCentralColor: string | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:83-90 */
  constructor(source: UmlSource, option: string | undefined, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
    if (option === undefined) this.paletteCentralColor = undefined;
    else this.paletteCentralColor = option.replaceAll('#', '');
  }

  /** Port-only read of the `paletteCentralColor` field (java:80). */
  getPaletteCentralColor(): string | undefined {
    return this.paletteCentralColor;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:92-94 */
  getDescription(): string {
    return DESCRIPTION;
  }

  /** java:99 and java:122's shared test. */
  private isPalette(): boolean {
    return (
      this.paletteCentralColor !== undefined &&
      this.colors.getColorOrWhite(this.paletteCentralColor) instanceof HColorSimple
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:96-102 */
  calculateDimension(_stringBounder: StringBounder): XDimension2D {
    if (this.isPalette()) return this.calculateDimensionPalette();
    return this.calculateDimensionFull();
  }

  /** `(totalColors + nbRows - 1) / nbRows` is Java `int` division.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:104-109 */
  private calculateDimensionFull(): XDimension2D {
    const totalColors = this.colors.names().length;
    const nbRows = NB_ROWS;
    const nbColumns = Math.trunc((totalColors + nbRows - 1) / nbRows);
    return new XDimension2D(nbColumns * RECTANGLE_WIDTH, nbRows * RECTANGLE_HEIGHT);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:111-119 */
  private calculateDimensionPalette(): XDimension2D {
    const translateX = (this.centerHexa(2, 0).getX() + this.centerHexa(3, 0).getX()) / 2;
    const translateY = this.centerHexa(0, 2).getY() + this.corner(1).getY();
    const maxI = MAX_I;
    const maxJ = MAX_J;
    const maxCenterX = this.getWidth() * maxI + this.getWidth() / 2;
    const maxCenterY = SIZE * maxJ * 1.5;
    return new XDimension2D(translateX + maxCenterX + SIZE + 1, translateY + maxCenterY + SIZE + 1);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:121-126 */
  drawU(ug: UGraphic): void {
    if (this.isPalette()) this.drawPalette(ug);
    else this.drawFull(ug);
  }

  /** `paletteCentralColor` is non-null here (java:122).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:128-157 */
  private drawPalette(ug: UGraphic): void {
    const x = (this.centerHexa(2, 0).getX() + this.centerHexa(3, 0).getX()) / 2;
    const y = this.centerHexa(0, 2).getY() + this.corner(1).getY();
    ug = ug.apply(new UTranslate(x, y));
    const hexa = this.getHexa();

    const friends = this.getColorsCloseTo(this.paletteCentralColor as string);
    let idx = 0;
    this.drawOneHexa(ug, friends[idx++] as string, 0, 0, hexa);

    this.drawOneHexa(ug, friends[idx++] as string, 1, 0, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, 0, 1, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, -1, 1, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, -1, 0, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, -1, -1, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, 0, -1, hexa);

    this.drawOneHexa(ug, friends[idx++] as string, 2, 0, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, 1, 1, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, 1, 2, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, 0, 2, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, -1, 2, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, -2, 1, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, -2, 0, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, -2, -1, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, -1, -2, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, 0, -2, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, 1, -2, hexa);
    this.drawOneHexa(ug, friends[idx++] as string, 1, -1, hexa);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:159-165 */
  private centerHexa(i: number, j: number): XPoint2D {
    const width = this.getWidth();
    const x = width * i + (j % 2 === 0 ? 0 : width / 2);
    const y = SIZE * j * 1.5;
    return new XPoint2D(x, y);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:167-169 */
  private getWidth(): number {
    return (Math.sqrt(3) / 2) * 2 * SIZE;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:171-186 */
  private drawOneHexa(ug: UGraphic, colorName: string, i: number, j: number, hexa: UPolygon): void {
    const color = asSimple(this.colors.getColorOrWhite(colorName));
    ug = this.applyColor(ug, color);
    ug = ug.apply(UTranslate.point(this.centerHexa(i, j)));
    ug.draw(hexa);

    const font = boldSansSerif14();

    let tt = this.getTextName(font, colorName, color);
    let dimText = tt.calculateDimension(ug.getStringBounder());
    if (dimText.getWidth() > this.getWidth()) {
      tt = this.getTextName(font, this.findShortest(ug.getStringBounder(), font, colorName), color);
      dimText = tt.calculateDimension(ug.getStringBounder());
    }
    tt.drawU(ug.apply(new UTranslate(-dimText.getWidth() / 2, -dimText.getHeight() / 2)));
  }

  /** `null` (no capital at 1..length-2) is `undefined`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:188-205 */
  private findShortest(stringBounder: StringBounder, font: UFont, colorName: string): string | undefined {
    let result: string | undefined = undefined;
    let min = Number.MAX_VALUE;
    for (let i = 1; i < colorName.length - 1; i++) {
      if (isLowerCase(colorName.charAt(i))) continue;

      const candidate = colorName.substring(0, i) + BackSlash.BS_BS_N + colorName.substring(i);
      const tt = this.getTextName(font, candidate, HColors.BLACK);
      const width = tt.calculateDimension(stringBounder).getWidth();
      if (width < min) {
        result = candidate;
        min = width;
      }
    }
    return result;
  }

  /** `ug.apply(color).apply(color.bg())`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:207-209 */
  private applyColor(ug: UGraphic, color: HColorSimple): UGraphic {
    return ug.apply(new Fore(color)).apply(new Back(color));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:211-215 */
  private corner(i: number): XPoint2D {
    const angle_deg = 60 * i + 30;
    const angle_rad = (Math.PI / 180) * angle_deg;
    return new XPoint2D(SIZE * Math.cos(angle_rad), SIZE * Math.sin(angle_rad));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:217-223 */
  private getHexa(): UPolygon {
    const result = new UPolygon();
    for (let i = 0; i < 6; i++) result.addPoint(this.corner(i));

    return result;
  }

  /**
   * The names without each `Gray` twin of a `Grey` name, plus `other` when
   * absent, stably sorted by distance to the centre (`Collections.sort` and
   * `Array#sort` are both stable). Upstream removes through the iterator
   * while it scans; a removed `...Gray` name is never another candidate's
   * `...Grey` twin, so testing against the unfiltered list is the same set.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:225-242
   */
  private getColorsCloseTo(other: string): string[] {
    const names = this.colors.names();
    const result = names.filter((candidate) => {
      const similar = candidate.replaceAll(GRAY, GREY);
      if (candidate === similar) return true;

      return !names.includes(similar);
    });
    if (!this.containsCaseInsensitive(result, other)) result.push(other);

    result.sort(this.closeComparator(other));
    return result;
  }

  /** `String#equalsIgnoreCase`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:244-250 */
  private containsCaseInsensitive(source: readonly string[], target: string): boolean {
    for (const s of source) if (s.length === target.length && s.toUpperCase() === target.toUpperCase()) return true;

    return false;
  }

  /** `getColorsCloseTo(paletteCentralColor)` passes the centre: `other` here.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:252-261 */
  private closeComparator(center: string): (col1: string, col2: string) => number {
    const centerColor = asSimple(this.colors.getColorOrWhite(center));
    return (col1, col2) => {
      const dist1 = centerColor.distanceTo(asSimple(this.colors.getColorOrWhite(col1)));
      const dist2 = centerColor.distanceTo(asSimple(this.colors.getColorOrWhite(col2)));
      return Math.sign(dist1 - dist2);
    };
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:263-283 */
  private drawFull(ug: UGraphic): void {
    const font = boldSansSerif14();

    ug = ug.apply(new Fore(HColors.BLACK));
    let i = 0;
    let j = 0;
    for (const name of this.colors.names()) {
      const tmp = this.getPositioned(ug, i, j);
      const color = asSimple(this.colors.getColorOrWhite(name));
      this.applyColor(tmp, color).draw(URectangle.build(RECTANGLE_WIDTH, RECTANGLE_HEIGHT));
      const tt = this.getTextName(font, name, color);
      const dimText = tt.calculateDimension(ug.getStringBounder());
      const dy = (RECTANGLE_HEIGHT - dimText.getHeight()) / 2;
      const dx = (RECTANGLE_WIDTH - dimText.getWidth()) / 2;
      tt.drawU(tmp.apply(new UTranslate(dx, dy)));
      if (j++ === LAST_ROW) {
        j = 0;
        i++;
      }
    }
  }

  /** A `null` name (`findShortest`'s) is `Display.NULL` (Display.java:263-264).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:285-291 */
  private getTextName(font: UFont, name: string | undefined, color: HColorSimple): TextBlock {
    const opposite = color.opposite();
    const blue = this.colors.getColorOrWhite(BLUE);
    const fc = bridgeFontConfiguration(FontConfiguration.create(font, opposite, blue, UStroke.simple()));
    const spriteContainer = new SpriteContainerEmpty();
    const ctx = { fontConfiguration: fc, spriteContainer, atomOps: spriteContainer.atomOps(fc) };
    const tt = Display.getWithNewlines(Pragma.createEmpty(), name ?? null).create(ctx, HorizontalAlignment.CENTER);
    return tt;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColors.java:293-295 */
  private getPositioned(ug: UGraphic, i: number, j: number): UGraphic {
    return ug.apply(new UTranslate(RECTANGLE_WIDTH * i, RECTANGLE_HEIGHT * j));
  }
}
