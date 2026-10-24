/**
 * renderer-document.ts -- the document-level fields of the sequence
 * fragment: canvas size, the margin-less block chrome composes around, and
 * the document chrome `TextBlockExporter` draws (background, border). Split
 * out of `renderer.ts` (500-line hook cap, sdd2-T7f).
 */
import type { SequenceGeometry } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { SEQUENCE_DOCUMENT_MARGIN, calculateMargin, type DocumentMargin } from '../../core/document-margin.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';

/** The two document extents {@link drawnExtentSeed} and {@link preChromeDims} read. */
type SequenceExtent = Pick<SequenceGeometry, 'totalWidth' | 'totalHeight'>;

/**
 * The floor the page's one `UGraphicSvg` is opened with: the page's own
 * extent, `option.withMinDim(dim)` (`TextBlockExporter.java:284`).
 * `SvgGraphics#ensureVisible` (`:128-143`) runs
 *
 * ```java
 * if (x > maxX)  maxX = (int) (x + 1);
 * if (y > maxY)  maxY = (int) (y + 1);
 * ```
 *
 * on it, and then on every primitive drawn, so the canvas is the graphic's own
 * `maxX`/`maxY` (`renderer-ug.ts#SequenceFinish`): `(int)(dim + 1)` when the
 * ink stays inside the box, more when a primitive reaches past it (an arc
 * counts its end point plus its radius, `:854`; sdd3-T8g). The `+ 1` is
 * `ensureVisible`'s own, never added by hand: taken in the shared shell
 * (`core/klimt/document-shell.ts`) it hurts class, state, object and
 * description, whose extent is a graphviz box that already carries the
 * rounding (`findings/vertical-terms.md`), so only this engine draws through
 * the fold.
 *
 * `maxX`/`maxY` also start at 10, a floor no sequence document reaches; the
 * graphic models it.
 */
export function drawnExtentSeed(extent: SequenceExtent): { readonly width: number; readonly height: number } {
  return { width: extent.totalWidth, height: extent.totalHeight };
}

/**
 * lgm-T1a: the margin-less block `DiagramChromeFactory.create` receives --
 * `SequenceDiagramFileMakerTeoz#getTextBlock` reports `body + 10` and draws
 * at `translate(5, 5)` (`teoz/SequenceDiagramFileMakerTeoz.java:134-168`),
 * and `TextBlockExporter` adds `SequenceDiagram#getDefaultMargins()` on top
 * (`core/document-margin.ts`). `totalWidth`/`totalHeight` here are that sum,
 * so the block is `total - margin`; `core/annotations/chrome-export.ts`
 * composes chrome around it and puts the margin back. sdd3-T3b: declared
 * under a `scale` too -- the page is drawn at scale 1, so the margin is a
 * constant and chrome sees the true block (`UgDiagram.java:128`); the
 * exporter scales the composed whole (`TextBlockExporter.java:165-177`).
 */
export function preChromeDims(
  geo: SequenceExtent,
  m: DocumentMargin = SEQUENCE_DOCUMENT_MARGIN,
): Pick<RenderFragment, 'preChromeWidth' | 'preChromeHeight'> {
  return { preChromeWidth: geo.totalWidth - m.left - m.right, preChromeHeight: geo.totalHeight - m.top - m.bottom };
}

/** Both margins agree on all four sides. */
function sameMargin(a: DocumentMargin, b: DocumentMargin): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

/** Where the exporter puts the page: its margin, the extent that margin gives
 *  the baked layout, and the translate from the baked placement to it. */
export interface ExporterPlacement {
  readonly margin: DocumentMargin;
  /** The page's extent under {@link margin}: the dimension the exporter reports (`:199-203`). */
  readonly extent: SequenceExtent;
  /** `(margin.left - 5, margin.top - 5)`: the page is drawn under it, so the canvas fold sees final coordinates. */
  readonly translate: UTranslate;
}

/**
 * sdd3-T2d: `TextBlockExporter.Builder#calculateMargin` for sequence -- the
 * merged `{root, document}` style's `Margin`, else `getDefaultMargins()`
 * (`core/TextBlockExporter.java:510-516`). The layout bakes the DEFAULT
 * exporter margin, `same(5)` (`SequenceDiagram.java:629-633`), under the
 * teoz block's own (5, 5) translate (`teoz/SequenceDiagramFileMakerTeoz.java
 * :134-168`) into the body and `totalWidth`/`totalHeight`. The exporter
 * translates the block by `(left, top)` and adds both sides to the dimension
 * (`TextBlockExporter.java:159-176,199-203`), so a style margin M moves the
 * page by `M.left - 5`, `M.top - 5` (sdd3-T8g: the page is DRAWN under that
 * translate, `renderer-ug.ts#openSequenceGraphic`) and grows the dimension by
 * the summed side difference; the page is drawn at scale 1, so a `scale`
 * multiplies the whole drawing, margin included, in the exporter afterwards.
 * Identity when the style margin is the default.
 *
 * @param geo the UNSCALED page geometry, baked at the default margin
 */
export function exporterPlacement(geo: SequenceExtent, theme: Theme): ExporterPlacement {
  const m = calculateMargin(theme, SEQUENCE_DOCUMENT_MARGIN);
  const baked = SEQUENCE_DOCUMENT_MARGIN;
  return {
    margin: m,
    extent: {
      totalWidth: geo.totalWidth + (m.left - baked.left) + (m.right - baked.right),
      totalHeight: geo.totalHeight + (m.top - baked.top) + (m.bottom - baked.bottom),
    },
    translate: new UTranslate(m.left - baked.left, m.top - baked.top),
  };
}

/**
 * The fragment's declaration of the margin it is exported with: the
 * margin-less block chrome and the warning banner compose around
 * ({@link preChromeDims}) and, when not the default, the margin itself
 * (`RenderFragment.documentMargin`, read by `document-margin.ts#documentMarginOf`).
 * Unstyled output declares no margin, so it is byte-identical.
 */
export function exporterMarginFields(
  placement: ExporterPlacement,
): Pick<RenderFragment, 'preChromeWidth' | 'preChromeHeight' | 'documentMargin'> {
  const { margin, extent } = placement;
  return {
    ...preChromeDims(extent, margin),
    ...(sameMargin(margin, SEQUENCE_DOCUMENT_MARGIN) ? {} : { documentMargin: margin }),
  };
}

/**
 * The document backcolor, plus (sdd2-T7f) the two pieces of document chrome
 * `TextBlockExporter` draws around the diagram, handed to `core/assemble-svg-sequence.ts`, which draws
 * them at the final (chrome-composed) dimension:
 *  - an `HColorGradient` backcolor -- `SvgGraphics.java:178-183` mints its
 *    gradient and paints the canvas with it, and leaves the root style
 *    without `background:`;
 *  - `diagramBorderColor` -- `maybeDrawBorder` (`core/TextBlockExporter.java
 *    :214-231`), resolved to its SVG hex here as class does
 *    (`class/renderer-document.ts:147-154`).
 * Each is omitted, not `undefined`, when unset (`exactOptionalPropertyTypes`).
 */
export function documentChromeOf(
  theme: Theme,
): Pick<
  RenderFragment,
  'background' | 'backgroundGradient' | 'diagramBorderColor' | 'diagramBorderThickness' | 'diagramBorderRoundCorner'
> {
  const { backgroundGradient } = theme.colors;
  return {
    // `SvgGraphics` receives the background as `HColor#toSvg` and paints the
    // canvas rect unless that string is `#00000000`, `#000000` or `#FFFFFF`
    // (`SvgGraphics.java:189-191`). Handing over the raw token (`white`, as
    // `!theme plain` writes it) failed that test and drew an extra rect.
    background: resolveColorToSvgHex(theme.colors.background),
    ...(backgroundGradient === undefined ? {} : { backgroundGradient }),
    ...diagramBorderOf(theme),
  };
}

/** `HColors.BLACK`, `maybeDrawBorder`'s colour when only a thickness is set
 *  (`core/TextBlockExporter.java:228`). */
const DIAGRAM_BORDER_DEFAULT_COLOR = '#000000';

/**
 * `maybeDrawBorder` (`core/TextBlockExporter.java:214-231`): the border is
 * drawn when `diagramBorderColor` OR a `diagramBorderThickness` is set (a
 * thickness alone draws it in black); the corner is `CornerParam
 * .diagramBorder`, falling back to the plain `roundCorner`
 * (`SkinParam.java:891-904`, stored as `classCascadeRoundCorner`).
 */
function diagramBorderOf(
  theme: Theme,
): Pick<RenderFragment, 'diagramBorderColor' | 'diagramBorderThickness' | 'diagramBorderRoundCorner'> {
  const { diagramBorderColor, diagramBorderThickness, diagramBorderRoundCorner, classCascadeRoundCorner } =
    theme.colors.graph;
  if (diagramBorderColor === undefined && diagramBorderThickness === undefined) return {};
  const corner = diagramBorderRoundCorner ?? classCascadeRoundCorner;
  return {
    diagramBorderColor:
      diagramBorderColor === undefined ? DIAGRAM_BORDER_DEFAULT_COLOR : resolveColorToSvgHex(diagramBorderColor),
    ...(diagramBorderThickness === undefined ? {} : { diagramBorderThickness }),
    ...(corner === undefined ? {} : { diagramBorderRoundCorner: corner }),
  };
}
