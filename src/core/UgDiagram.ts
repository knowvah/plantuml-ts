/**
 * `UgDiagram` — the base of every diagram that exports one klimt `TextBlock`,
 * and its export path for the diagrams that are NOT a `TitledDiagram`
 * (`getExporter`'s `else` arm, UgDiagram.java:140-145): the utility pages
 * (`license`, `version`, `sudoku`, `colors`, the eggs, ...).
 *
 * `TitledDiagram` extends `UgDiagram` upstream; this port's `TitledDiagram`
 * (`core/TitledDiagram.ts`) is a standalone consumed slice that predates this
 * file and keeps its own export path (`TextBlockExporter.ts`, the engines'
 * plugins), so only the non-titled arm lives here.
 *
 * The `AbstractDiagram` members `getExporter` reads (`getDefaultMargins`,
 * `calculateBackColor`, `getScale`/`setScale`, `muteColorMapper`, the
 * constructor's source and preprocessing artifact) are hosted here, since
 * `AbstractDiagram` itself is unported.
 *
 * Adaptations, each forced by the port's pure-string SVG pipeline:
 * - `exportDiagram` returns the SVG document; the `OutputStream`, the
 *   non-SVG formats (`exportXmi`/`exportScxml`/`exportGraphml`/`exportTxt`,
 *   java:78-89) and the returned `ImageData` (with `computeStatus`'s status,
 *   java:126 and :152-162, `getWarningOrError`, `metadata`) have no consumer.
 * - The crash report (java:97-106) is `src/index.ts`'s error page; the
 *   test-only `SIMULATE_RENDER_CRASH_FOR_TESTS` switch and the stats
 *   (java:93-95, :107-114) read global configuration this port does not have.
 * - `seed()` is applied to the finished document by `core/assemble-svg.ts`
 *   (`applySeededDefIds`), as for every other klimt export (salt, wbs).
 * - `FileFormatOption` reaches `getTextBlock` only as its string bounder.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/AbstractDiagram.java
 */
import type { UmlSource } from './block-extractor.js';
import { ColorMapper } from './klimt/color/ColorMapper.js';
import type { HColorOrPaint } from './klimt/color/ColorMapper.js';
import { HColors } from './klimt/color/HColors.js';
import type { HColorSimple } from './klimt/color/HColorSimple.js';
import { VERSION_PLACEHOLDER } from './klimt/document-shell.js';
import { UGraphicHandwritten } from './klimt/drawing/hand/UGraphicHandwritten.js';
import type { StringBounder as DriverStringBounder } from './klimt/drawing/svg/driver-text-svg.js';
import { basicSvgOption } from './klimt/drawing/svg/svg-graphics-core.js';
import { UGraphicSvg } from './klimt/drawing/svg/u-graphic-svg.js';
import type { StringBounder } from './klimt/font/StringBounder.js';
import { ClockwiseTopRightBottomLeft } from './klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { TextBlock } from './klimt/shape/TextBlock.js';
import { TextBlockUtils } from './klimt/shape/TextBlockUtils.js';
import type { UGraphic } from './klimt/UGraphic.js';
import { UTranslate } from './klimt/UTranslate.js';
import type { StringMeasurer } from './measurer.js';
import { resolveScaleFactor } from './scale-command.js';
import type { ScaleSpec } from './scale-command.js';
import { OptionKey } from './tim/EaterOption.js';
import type { PreprocessingArtifact } from './tim/PreprocessingArtifact.js';

/** `skinParam == null ? 96 : ...`: a non-titled export has no skin param.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:206 */
const NO_SKIN_PARAM_DPI = 96;

/**
 * The settings `TextBlockExporter.Builder` collects for a non-titled diagram
 * (UgDiagram.java:137-145): the decorated block, `backcolor` (the builder's
 * `HColors.WHITE.withDark(HColors.BLACK)` default unless the block has its own,
 * java:407, :421-423), the margin, the scale, the muted colour mapper and
 * handwritten mode. `skinParam`, `pragma` and `diagramType` stay null here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:395-425
 */
export interface TextBlockExporter {
  readonly textBlock: TextBlock;
  readonly backcolor: HColorOrPaint;
  readonly margin: ClockwiseTopRightBottomLeft;
  readonly scale: ScaleSpec | undefined;
  readonly colorMapper: ColorMapper;
  readonly isHandwritten: boolean;
}

/** The width-only driver half of `UGraphicSvg`'s two text seams (the salt and
 *  wbs plugins' adapter). */
function driverBounderFor(measurer: StringMeasurer): DriverStringBounder {
  return {
    calculateDimension(font, text) {
      return { width: measurer.measure(text, font).width };
    },
  };
}

/** `fileFormatOption.getDefaultStringBounder(...)` (TextBlockExporter.java:139-140). */
export function stringBounderFor(measurer: StringMeasurer): StringBounder {
  return UGraphicSvg.build(
    0,
    basicSvgOption(),
    VERSION_PLACEHOLDER,
    driverBounderFor(measurer),
    measurer,
  ).getStringBounder();
}

/**
 * `TextBlockExporter.Builder`'s `backcolor` initializer. `HColorSimple#withDark`
 * always builds an `HColorSimple` (HColorSimple.java:225-228), which the port
 * types as the opaque `HColor`; the cast restores the class the call returned
 * (the `salt/element/AbstractElement.ts#simple` precedent).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:407
 */
function builderDefaultBackcolor(): HColorSimple {
  return HColors.WHITE.withDark(HColors.BLACK) as HColorSimple;
}

/** `TextBlock#getBackcolor()` — a default member upstream (null), absent from
 *  this port's `TextBlock` interface, so read structurally (the
 *  `TextBlockWithUrl.ts#getBackcolor` precedent). */
function backcolorOf(textBlock: TextBlock): HColorOrPaint | undefined {
  const candidate = textBlock as Partial<{ getBackcolor(): HColorOrPaint | undefined }>;
  return candidate.getBackcolor?.();
}

/**
 * `TextBlockExporter#exportTo` for SVG, with `skinParam == null` (so no
 * border, `maybeDrawBorder` java:216-218): `calculateFinalDimension` (the block
 * plus the margins, java:198-202) is the canvas `minDim`, the scale resolves
 * against it (`computeScaleFactor`, java:205-209), then the margin translate,
 * `UGraphicHandwritten` when handwritten, and `drawU` (java:153-176).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:153-209
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:262-301
 */
export function exportTo(exporter: TextBlockExporter, stringBounder: StringBounder, measurer: StringMeasurer): string {
  const { textBlock, margin } = exporter;
  const dim = textBlock.calculateDimension(stringBounder);
  const width = dim.getWidth() + margin.getLeft() + margin.getRight();
  const height = dim.getHeight() + margin.getTop() + margin.getBottom();
  const scaleFactor = resolveScaleFactor(exporter.scale, width, height, NO_SKIN_PARAM_DPI);
  if (scaleFactor <= 0) throw new Error('Bad scaleFactor');
  const option = basicSvgOption({
    minDim: { width, height },
    backcolor: exporter.backcolor,
    scale: scaleFactor,
    colorMapper: exporter.colorMapper,
  });
  const svg = UGraphicSvg.build(0, option, VERSION_PLACEHOLDER, driverBounderFor(measurer), measurer);
  let ug: UGraphic = svg.apply(new UTranslate(margin.getLeft(), margin.getTop()));
  if (exporter.isHandwritten) ug = new UGraphicHandwritten(ug);
  textBlock.drawU(ug);
  return svg.getSvgString();
}

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:62
 */
export abstract class UgDiagram {
  /** @see AbstractDiagram.java (`scale`, set by `setScale`) */
  private scale: ScaleSpec | undefined = undefined;

  /** `super(source, preprocessing)` — AbstractDiagram's two stored inputs.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:64-66 */
  constructor(
    private readonly source: UmlSource,
    private readonly preprocessing: PreprocessingArtifact,
  ) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/AbstractDiagram.java */
  getSource(): UmlSource {
    return this.source;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/AbstractDiagram.java */
  getPreprocessingArtifact(): PreprocessingArtifact {
    return this.preprocessing;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:68 */
  abstract getTextBlock(num: number, stringBounder: StringBounder): TextBlock;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:70-72 */
  addChrome(_index: number, result: TextBlock): TextBlock {
    return result;
  }

  /**
   * The SVG arm of `exportDiagram` → `getExporter(index, ...).exportTo(os)`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:74-115
   */
  exportDiagram(index: number, measurer: StringMeasurer): string {
    const stringBounder = stringBounderFor(measurer);
    return exportTo(this.getExporter(index, stringBounder), stringBounder, measurer);
  }

  /** `getPreprocessingArtifact().getOption().isTrue(OptionKey.HANDWRITTEN)`;
   *  `ConfigurationStore#isTrue` is `"true".equalsIgnoreCase(value)`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:117-121
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc/ConfigurationStore.java:60-62 */
  isHandwritten(): boolean {
    return this.preprocessing.getOptions().get(OptionKey.HANDWRITTEN)?.toLowerCase() === 'true';
  }

  /**
   * `getTextBlock`, `addChrome`, the optional back colour, the muted mapper,
   * then the non-titled `Builder` (`scale`, `margin(getDefaultMargins())`).
   * `TextBlockUtils.addBackcolor` is unported (`TextBlockUtils.ts`) and throws
   * if a subclass ever returns a back colour.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:123-150
   */
  protected getExporter(index: number, stringBounder: StringBounder): TextBlockExporter {
    let result = this.getTextBlock(index, stringBounder);
    result = this.addChrome(index, result);
    const backColor = this.calculateBackColor();
    if (backColor !== undefined) result = TextBlockUtils.addBackcolor();
    return {
      textBlock: result,
      backcolor: backcolorOf(result) ?? builderDefaultBackcolor(),
      margin: this.getDefaultMargins(),
      scale: this.getScale(),
      colorMapper: this.muteColorMapper(ColorMapper.IDENTITY),
      isHandwritten: this.isHandwritten(),
    };
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/AbstractDiagram.java:191-193 */
  calculateBackColor(): HColorOrPaint | undefined {
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/AbstractDiagram.java:195-197 */
  setScale(scale: ScaleSpec | undefined): void {
    this.scale = scale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/AbstractDiagram.java:199-201 */
  getScale(): ScaleSpec | undefined {
    return this.scale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/AbstractDiagram.java:203-205 */
  protected muteColorMapper(init: ColorMapper): ColorMapper {
    return init;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/AbstractDiagram.java:231-233 */
  getDefaultMargins(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.same(0);
  }
}
