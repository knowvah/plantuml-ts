/**
 * `PSystemOpenIconic` — the `openiconic <name>` page: one OpenIconic glyph,
 * black, at `factor`, with a 5px margin all round.
 *
 * `OpenIconic.java` has no TS file of its own: its glyph table and path
 * builder are `core/openiconic-glyphs.ts` (+ `openiconic-glyphs-data.ts`),
 * and its `SvgPath` is `core/klimt/sprite/SvgPath.ts`, which this file reuses. {@link retrieve} and {@link asTextBlock} are the
 * two `OpenIconic` members this page reads.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/OpenIconic.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { Back } from '../../core/klimt/Back.js';
import type { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import { HColors } from '../../core/klimt/color/HColors.js';
import { Fore } from '../../core/klimt/Fore.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { TextBlockMemoized } from '../../core/klimt/shape/TextBlockMemoized.js';
import type { UPath } from '../../core/klimt/shape/UPath.js';
import { parseSvgPath } from '../../core/klimt/sprite/SvgPath.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { XAffineTransform } from '../../core/klimt/UGraphicWithScale.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { RAW_GLYPHS } from '../../core/openiconic-glyphs-data.js';
import { isKnownOpenIconicGlyph, OPENICONIC_NATURAL_SIZE } from '../../core/openiconic-glyphs.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { UgSimpleDiagram } from '../../core/UgSimpleDiagram.js';

/** `ClockwiseTopRightBottomLeft.same(5)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java:66 */
const MARGIN = 5;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java:61 */
const DESCRIPTION = '(Open iconic)';

/**
 * `OpenIconic.retrieve(name)`: the icon name when `/openiconic/<name>.svg`
 * exists, else `null` (`getResource` returns null, java:78-80). The resource
 * set is `openiconic-glyphs-data.ts#RAW_GLYPHS`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/OpenIconic.java:73-88
 */
function retrieve(name: string): string | undefined {
  return isKnownOpenIconicGlyph(name) ? name : undefined;
}

/**
 * `svgPath.drawMe(ug, factor)` → `toUPath(factor, factor)`: the icon's
 * `<path d>` and its `translate(...)` (`new SvgPath(d, translate)`,
 * OpenIconic.java:129-148) through the klimt `SvgPath` port. That port
 * mirrors the `toUPath(XAffineTransform)` overload; with
 * `getScaleInstance(factor, factor)` every point is `x*factor + y*0 + 0`, the
 * same double as the factor overload's `x*factor`, and the final translate is
 * scaled by `getScaleX()`/`getScaleY()` = `factor` as there. The two differ
 * only on `T`, which no OpenIconic glyph uses (`openiconic-glyphs.ts`).
 * `RAW_GLYPHS` carries the translate `patternTranslate` actually reads
 * (none for `euro`, java:67 and :151-164).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPath.java:146-190
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPath.java:250-253
 */
function toUPath(name: string, factor: number): UPath {
  // `retrieve` admitted `name`, so it is a `RAW_GLYPHS` key.
  const raw = RAW_GLYPHS[name]!;
  const translate = new UTranslate(raw.translateX ?? 0, raw.translateY ?? 0);
  return parseSvgPath(raw.d, translate, XAffineTransform.getScaleInstance(factor, factor));
}

/**
 * `OpenIconic#asTextBlock(color, factor)`: `getDimension(factor)` (the
 * source SVG's `width`/`height`, 8 for every icon, times `factor`) and a
 * `drawU` filling the path in `color`, stroke thickness 0.
 * `color.getAppropriateColor(back)` is `HColor`'s identity default
 * (HColor.java:121-123), which `HColorSimple` does not override.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/OpenIconic.java:196-209
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPath.java:250-253
 */
function asTextBlock(name: string, color: HColorSimple, factor: number): TextBlock {
  return new (class extends TextBlockMemoized {
    drawU(ug: UGraphic): void {
      const textColor = color;
      ug.apply(new Fore(textColor))
        .apply(new Back(textColor))
        .apply(UStroke.withThickness(0))
        .draw(toUPath(name, factor));
    }

    protected calculateDimensionSlow(_stringBounder: StringBounder): XDimension2D {
      return new XDimension2D(OPENICONIC_NATURAL_SIZE * factor, OPENICONIC_NATURAL_SIZE * factor);
    }
  })();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java:50 */
export class PSystemOpenIconic extends UgSimpleDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java:52 */
  private readonly textBlock: TextBlock;

  /**
   * An unknown `iconName` leaves `icon` null and `icon.asTextBlock` throws
   * the NullPointerException the jar reports as a "Fatal crash error" page
   * (jar probe `openiconic foo`); the port throws too.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java:54-58
   */
  constructor(source: UmlSource, iconName: string, factor: number, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
    const icon = retrieve(iconName);
    if (icon === undefined)
      throw new Error('Cannot invoke "OpenIconic.asTextBlock(HColor, double)" because "icon" is null');
    this.textBlock = asTextBlock(icon, HColors.BLACK, factor);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java:60-62 */
  getDescription(): string {
    return DESCRIPTION;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java:64-67 */
  override getDefaultMargins(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.same(MARGIN);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java:69-73 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    return this.textBlock.calculateDimension(stringBounder);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconic.java:75-78 */
  drawU(ug: UGraphic): void {
    this.textBlock.drawU(ug);
  }
}
