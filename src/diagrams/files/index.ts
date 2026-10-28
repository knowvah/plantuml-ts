/**
 * Files diagram plugin -- `FilesDiagramFactory` (parse), then `TextBlockExporter`'s
 * export of `FilesDiagram#getTextBlock` (the `FilesListing`, FilesDiagram.java:107-110)
 * on the klimt substrate: canvas = the listing's `calculateDimension` plus
 * `calculateMargin` (`TitledDiagram#getDefaultMargins`, `same(10)`), the block drawn
 * translated by the top-left margin, `scale`/`dpi` resolved against that final
 * dimension (TextBlockExporter.java:159-209). The wbs plugin's shape
 * (`src/diagrams/wbs/index.ts`), with `diagramType: 'FILES'`; no `scale` command is
 * registered for files, so the scale is the `dpi` factor alone.
 *
 * No chrome: the jar draws no title/caption/legend/header/footer/mainframe in a files
 * diagram (FilesDiagram.java:80-88 reads only `/` and `<note>` lines), so the fragment
 * is always the exported block and {@link filesPlugin} hands `src/index.ts` an AST
 * without `annotations`.
 *
 * No `skinparam`: the diagram executes none (FilesDiagram.java:62-80), so its skin
 * param holds none, and `mode`/`monochrome`/`reversecolor`/`handwritten` never apply.
 * The two skinparam extensions the port honours (DIVERGENCES.md "Extensions", lad D9)
 * come from the theme, which `prepareBlock` builds from the extended-mode skinparams
 * and the jar-compatible mode empties: `lengthAdjust` and the document background.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FilesDiagramFactory.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:153-209
 */
import { addWarnings } from '../../core/annotations/WarningBannerBlock.js';
import type { RenderFragment, SyncPlugin } from '../../core/dispatcher.js';
import { ColorMapper, toSvgPaint } from '../../core/klimt/color/ColorMapper.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import { extractFlatContent, extractViewBoxDims, VERSION_PLACEHOLDER } from '../../core/klimt/document-shell.js';
import type { StringBounder as DriverStringBounder } from '../../core/klimt/drawing/svg/driver-text-svg.js';
import { lengthAdjustOverride } from '../../core/klimt/drawing/svg/svg-option.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics-core.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { Theme } from '../../core/theme.js';
import type { FilesDiagramAST } from './ast.js';
import { filesStyleInput } from './files-style-input.js';
import type { FilesDiagram } from './parser.js';
import { parseFiles } from './parser.js';

/** `DiagramType.FILES.name()`, the root `data-diagram-type` value.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:292-294 */
const DIAGRAM_TYPE_FILES = 'FILES';

/** `DiagramType.FILES.getStyleName()`: `DiagramType` has no `FILES` arm, so it is the final `return
 *  SName.activityDiagram`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramType.java:234-293 */
const FILES_STYLE_NAME = 'activityDiagram';

/** The parsed diagram, the measurer its text is sized with and the theme carrying the extended-mode skinparams. */
export interface FilesGeometry {
  readonly diagram: FilesDiagram;
  readonly measurer: StringMeasurer;
  readonly theme: Theme;
}

/** The width-only driver half of `UGraphicSvg`'s two text seams (the
 *  mindmap/salt plugins' local adapter). */
function driverBounderFor(measurer: StringMeasurer): DriverStringBounder {
  return {
    calculateDimension(font, text) {
      return { width: measurer.measure(text, font).width };
    },
  };
}

/** `fileFormatOption.getDefaultStringBounder(...)`. */
function stringBounderFor(measurer: StringMeasurer): StringBounder {
  return UGraphicSvg.build(
    0,
    basicSvgOption(),
    VERSION_PLACEHOLDER,
    driverBounderFor(measurer),
    measurer,
  ).getStringBounder();
}

/**
 * `TitledDiagram#calculateBackColor`: `root, document, activityDiagram`'s (`FILES_STYLE_NAME`)
 * `BackGroundColor`. Kept an `HColor` so a `@media dark` partner survives to
 * the mapper. java:284-285's `== null` fallback to `HColors.transparent()`
 * is not reachable: the port's `asColor` is typed non-null (the
 * `PSystemSalt#calculateBackColor` precedent).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:279-289
 */
export function calculateBackColor(diagram: FilesDiagram): HColorSimple | HColorGradient {
  const skinParam = diagram.getSkinParam();
  // `getMergedStyle` answers undefined only for an undefined builder; a files diagram's always exists.
  const style = StyleSignatureBasic.of('root', 'document', FILES_STYLE_NAME).getMergedStyle(
    skinParam.getCurrentStyleBuilder(),
  )!;
  const color = style.value('BackGroundColor').asColor(skinParam.getIHtmlColorSet());
  if (color instanceof HColorSimple || color instanceof HColorGradient) return color;
  throw new Error('ClassCastException: a document BackGroundColor is a simple or gradient colour');
}

/**
 * The document background: the style's ({@link calculateBackColor}), unless the theme's differs. The theme is
 * built from the same `<style>` cascade and, in extended mode only, the skinparams (`skinparam backgroundColor`,
 * a `!theme`'s transparent background): a difference is that extension. Port-only; the jar has no such seam.
 */
function backColorOf(diagram: FilesDiagram, theme: Theme): HColorSimple | HColorGradient {
  const fromStyle = calculateBackColor(diagram);
  const fromTheme = HColorSet.instance().getColorOrNull(theme.colors.background);
  if (!(fromTheme instanceof HColorSimple || fromTheme instanceof HColorGradient)) return fromStyle;
  const same = toSvgPaint(fromTheme, ColorMapper.IDENTITY) === toSvgPaint(fromStyle, ColorMapper.IDENTITY);
  return same ? fromStyle : fromTheme;
}

/**
 * `TextBlockExporter.Builder#calculateMargin`: the merged `{root, document}`
 * style's `Margin` when it has one, else `getDefaultMargins()` (`same(10)`,
 * TitledDiagram.java:274-277).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:510-516
 */
export function calculateMargin(diagram: FilesDiagram): ClockwiseTopRightBottomLeft {
  const style = StyleSignatureBasic.of('root', 'document').getMergedStyle(
    diagram.getSkinParam().getCurrentStyleBuilder(),
  );
  if (style?.hasValue('Margin') === true) return style.getMargin();
  return diagram.getDefaultMargins();
}

/** One klimt pass over the text block. */
interface DrawPass {
  readonly textBlock: TextBlock;
  readonly minDim: XDimension2D;
  readonly scale: number;
  readonly translate: UTranslate;
}

function svgGraphic(geo: FilesGeometry, pass: DrawPass): UGraphicSvg {
  const option = basicSvgOption({
    ...lengthAdjustOverride(geo.theme.lengthAdjust),
    minDim: { width: pass.minDim.getWidth(), height: pass.minDim.getHeight() },
    backcolor: backColorOf(geo.diagram, geo.theme),
    colorMapper: ColorMapper.IDENTITY,
    scale: pass.scale,
    rootAttributes: new Map([['data-diagram-type', DIAGRAM_TYPE_FILES]]),
  });
  return UGraphicSvg.build(0, option, VERSION_PLACEHOLDER, driverBounderFor(geo.measurer), geo.measurer);
}

/**
 * Draws the text block per `pass` (TextBlockExporter.java:165-176: the margin
 * translate, then `drawU`) and unwraps the document to a fragment whose body is
 * the flat drawing (the klimt graphic paints a non-white background `<rect>`
 * itself). The fragment's `background` is the same `backcolor.toSvg(mapper)` the
 * klimt graphic paints (SvgGraphics.java:176-188).
 */
function drawFragment(geo: FilesGeometry, pass: DrawPass): RenderFragment {
  const backcolor = toSvgPaint(backColorOf(geo.diagram, geo.theme), ColorMapper.IDENTITY);
  const ug = svgGraphic(geo, pass);
  pass.textBlock.drawU(ug.apply(pass.translate));
  const svg = ug.getSvgString();
  const { width, height } = extractViewBoxDims(svg);
  const { body, extraDefs } = extractFlatContent(svg);
  const fragment: RenderFragment = {
    body,
    width,
    height,
    diagramType: DIAGRAM_TYPE_FILES,
    ...(geo.theme.lengthAdjust === undefined ? {} : { lengthAdjust: geo.theme.lengthAdjust }),
  };
  // A gradient backcolor leaves `backcolorString` null (SvgGraphics.java:178-183):
  // no root `background:`, which `RenderFragment.backgroundGradient` carries.
  const withBackground =
    typeof backcolor === 'string'
      ? { ...fragment, background: backcolor }
      : { ...fragment, backgroundGradient: backcolor };
  return extraDefs.length > 0 ? { ...withBackground, extraDefs } : withBackground;
}

/**
 * `TextBlockExporter#exportTo` for SVG, no chrome: `calculateFinalDimension`
 * (the text block plus the margins, java:198-202) as `minDim`, the scale
 * resolved against it (`computeScaleFactor`, java:205-209), the margin
 * translate (java:173), then `textBlock.drawU`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:159-209
 */
function exportTextBlock(geo: FilesGeometry, textBlock: TextBlock, dim: XDimension2D): RenderFragment {
  const margin = calculateMargin(geo.diagram);
  const minDim = new XDimension2D(
    dim.getWidth() + margin.getLeft() + margin.getRight(),
    dim.getHeight() + margin.getTop() + margin.getBottom(),
  );
  const scale = resolveScaleFactor(
    undefined,
    minDim.getWidth(),
    minDim.getHeight(),
    geo.diagram.getSkinParam().getDpi(),
  );
  const translate = new UTranslate(margin.getLeft(), margin.getTop());
  return drawFragment(geo, { textBlock, minDim, scale, translate });
}

/**
 * The diagram as the fragment `src/index.ts` assembles. No chrome: `FilesDiagram` reads only the lines starting
 * `/` and `<note>` (FilesDiagram.java:80-88) and `FilesDiagramFactory` runs no command
 * (FilesDiagramFactory.java:46-52), so `TitledDiagram`'s title, caption, legend, header, footer and mainframe
 * stay unset and the jar draws none of them. `diagram.annotations` is parsed (mission G0b) but never drawn.
 */
export function renderFiles(geo: FilesGeometry): RenderFragment {
  const { diagram, measurer } = geo;
  // `DiagramChromeFactory.create`'s first step, `addWarnings` (DiagramChromeFactory.java:128).
  const textBlock = addWarnings(diagram.getTextBlock(), diagram.getWarnings(), ColorMapper.IDENTITY);
  return exportTextBlock(geo, textBlock, textBlock.calculateDimension(stringBounderFor(measurer)));
}

/**
 * The AST without its `annotations`: `src/index.ts#annotationsOf` chromes any AST that carries them, and the jar
 * draws no chrome for files -- `FilesDiagram` consumes only the lines starting `/` and `<note>`
 * (FilesDiagram.java:80-88), so a `title`/`legend`/... line is skipped like any other.
 */
function withoutChrome(ast: FilesDiagramAST): FilesDiagramAST {
  return { root: ast.root, diagram: ast.diagram, ...(ast.sprites === undefined ? {} : { sprites: ast.sprites }) };
}

export const filesPlugin: SyncPlugin<FilesDiagramAST, FilesGeometry> = {
  type: 'files',

  /** `FilesDiagramFactory extends PSystemAbstractFactory` (`FilesDiagramFactory.java:47`): no empty test;
   *  an empty listing is a 21x21 diagram. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FilesDiagramFactory.java:47-59 */
  factoryBase: 'PSystemAbstractFactory',

  /** `FilesDiagramFactory#createSystem`; `options.assetStore` carries the Twemoji artwork of the folder/file
   *  emoticons (ADR-2). */
  parse(source, options) {
    return withoutChrome(parseFiles(source, options));
  },

  /** The jar-compatible style input of `@startfiles` (lad D9): `files-style-input.ts`. */
  styleInput: filesStyleInput,

  layoutSync(ast, theme, measurer) {
    return { diagram: ast.diagram, measurer, theme };
  },

  render(geo) {
    return renderFiles(geo);
  },
};
