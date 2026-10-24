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
import { shiftFragmentBody } from '../../core/annotations/coord-shift.js';

/** The two document extents {@link canvasOf} and {@link preChromeDims} read. */
type SequenceExtent = Pick<SequenceGeometry, 'totalWidth' | 'totalHeight'>;

/**
 * `SvgGraphics#ensureVisible:128-135`, called from the constructor with the
 * computed dimension (`:138-143`):
 *
 * ```java
 * if (x > maxX)  maxX = (int) (x + 1);
 * if (y > maxY)  maxY = (int) (y + 1);
 * ```
 *
 * The emitted `width`/`height`/`viewBox` are therefore `(int)(dim + 1)`, not
 * `trunc(dim)`. `assembleDocumentShell` truncates, so the `+ 1` is added here
 * and the two compose into upstream's own expression.
 *
 * IT IS APPLIED ON THE SEQUENCE PATH ONLY, deliberately. Taken in the shared
 * shell (`core/klimt/document-shell.ts`) it helps sequence by 830 and hurts
 * class by 2 362, state by 936, object by 260 and description by 26 — measured
 * per fixture across all five families before the ruling in
 * `findings/vertical-terms.md`. Those four are already correct at `trunc`:
 * their extent is a graphviz bounding box plus explicit margins, which already
 * carries the rounding applied during drawing. Sequence's is a raw max
 * coordinate, so sequence alone is short. `bidopa-30-jafi560` is the witness —
 * its width was 115 against the jar's 116.
 *
 * `maxX`/`maxY` also start at 10, a floor no sequence document reaches; it is
 * not modelled.
 */
const ENSURE_VISIBLE_DELTA = 1;

/**
 * sdd2-T7f: the canvas, from the UNSCALED geometry. `SvgGraphics` runs
 * `ensureVisible` on unscaled coordinates (`option.withMinDim(dim)`,
 * `TextBlockExporter.java:284`; `SvgGraphics.java:142-143`) and applies the
 * scale only when it writes them out: `finalizeRootAttributes` truncates
 * `maxX * option.getScale()` for `style`/`viewBox` and prints `width`/`height`
 * as `format(maxX)` -- `maxX` scaled, 3 decimals (`SvgGraphics.java:800-811`,
 * `format` at `:468-475`). So a scaled canvas is `(int)(dim + 1) * scale`,
 * not `(int)(dim * scale + 1)` (`kitevo-12-guvo789`, `scale 2`: 228, not
 * 227), and carries `scaledCanvas` for the decimal attributes
 * (`jujigi-41-zodo151`, `scale 1.2`: `width="247.2px"`).
 */
export function canvasOf(geo: SequenceExtent, k: number): Pick<RenderFragment, 'width' | 'height' | 'scaledCanvas'> {
  if (k === 1) return { width: geo.totalWidth + ENSURE_VISIBLE_DELTA, height: geo.totalHeight + ENSURE_VISIBLE_DELTA };
  return {
    width: Math.trunc(geo.totalWidth + ENSURE_VISIBLE_DELTA) * k,
    height: Math.trunc(geo.totalHeight + ENSURE_VISIBLE_DELTA) * k,
    scaledCanvas: true,
  };
}

/**
 * lgm-T1a: the margin-less block `DiagramChromeFactory.create` receives --
 * `SequenceDiagramFileMakerTeoz#getTextBlock` reports `body + 10` and draws
 * at `translate(5, 5)` (`teoz/SequenceDiagramFileMakerTeoz.java:134-168`),
 * and `TextBlockExporter` adds `SequenceDiagram#getDefaultMargins()` on top
 * (`core/document-margin.ts`). `totalWidth`/`totalHeight` here are that sum,
 * so the block is `total - margin`; `core/annotations/chrome-export.ts`
 * composes chrome around it and puts the margin back. Left unset under a
 * `scale` (the margin is scaled with the body there, so it cannot be
 * subtracted as a constant) -- chrome then sees the final canvas as before.
 */
export function preChromeDims(
  geo: SequenceExtent,
  k: number,
  m: DocumentMargin = SEQUENCE_DOCUMENT_MARGIN,
): Pick<RenderFragment, 'preChromeWidth' | 'preChromeHeight'> {
  if (k !== 1) return {};
  return { preChromeWidth: geo.totalWidth - m.left - m.right, preChromeHeight: geo.totalHeight - m.top - m.bottom };
}

/** Both margins agree on all four sides. */
function sameMargin(a: DocumentMargin, b: DocumentMargin): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
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
 * body by `M.left - 5`, `M.top - 5` and grows the canvas by the summed side
 * difference. Under a `scale` the whole drawing -- margin included -- is
 * scaled by `SvgGraphics` (`:800-811`), hence the shift is multiplied by `k`
 * and the canvas goes through {@link canvasOf} again. The fragment then
 * declares the margin it is exported with (`RenderFragment.documentMargin`,
 * read by `document-margin.ts#documentMarginOf`) so chrome and the warning
 * banner compose around the same margin-less block as before. Identity when
 * the style margin is the default, so unstyled output is byte-identical.
 *
 * @param fragment the page as {@link renderSequence} assembled it, baked at
 *   the default margin
 * @param geo the UNSCALED page geometry {@link canvasOf} read
 */
export function withExporterMargin(
  fragment: RenderFragment,
  geo: SequenceExtent,
  theme: Theme,
  k: number,
): RenderFragment {
  const m = calculateMargin(theme, SEQUENCE_DOCUMENT_MARGIN);
  if (sameMargin(m, SEQUENCE_DOCUMENT_MARGIN)) return fragment;
  const baked = SEQUENCE_DOCUMENT_MARGIN;
  const grown: SequenceExtent = {
    totalWidth: geo.totalWidth + (m.left - baked.left) + (m.right - baked.right),
    totalHeight: geo.totalHeight + (m.top - baked.top) + (m.bottom - baked.bottom),
  };
  return {
    ...fragment,
    body: shiftFragmentBody(fragment.body, (m.left - baked.left) * k, (m.top - baked.top) * k),
    ...canvasOf(grown, k),
    ...preChromeDims(grown, k, m),
    documentMargin: m,
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
