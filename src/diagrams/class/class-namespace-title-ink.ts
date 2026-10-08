/**
 * cdd3-T31 (E1-2 = E2-8): the `LimitFinder` ink of a class group title drawn
 * through the plain-string paths (`class-namespace-shape.ts
 * #renderNamespaceFolder`/`#renderNamespaceRect`, `class-empty-package.ts
 * #renderEmptyPackageIcon`). Upstream draws the title as `UText`s inside
 * `USymbolFolder#asBig` (`title.drawU(ug.apply(new UTranslate(4, 2)))`,
 * `decoration/symbol/USymbolFolder.java:228`) or `USymbolRectangle#asBig`,
 * and `LimitFinder#drawText` (`klimt/drawing/LimitFinder.java:217-224`)
 * records each from its BASELINE: `y -= dim.getHeight() - 1.5`, then the
 * four corners of `[x, x + w] x [y, y + h]`. At a large `packageFontSize` the
 * title's ink rises above the frame (`pixexi-81-sete111`: 5.389 px at 40 pt;
 * `cocube-46-tusu692`: 3.167 px at 30 pt) and becomes the document's topmost
 * ink.
 *
 * Positions mirror the draw sites' own placement exactly, through the same
 * {@link namespaceTitleLines}/{@link namespaceTitleLineBaselines} pair
 * `renderNamespaceTitleAuto` draws with, in coordinates LOCAL to the group's
 * own `(x, y)` and unscaled (computed at layout time, before
 * `scaleClassGeometry`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:217-224
 */

import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { LeafSymbolInk } from '../../core/svek/image/leaf-sizing-entity.js';
import {
  namespaceTitleLines,
  namespaceTitleLineBaselines,
  TITLE_LOCAL_LEFT_OFFSET,
  TITLE_LOCAL_TOP_OFFSET,
  type NamespaceTitleLine,
} from './class-namespace-title-runs.js';
import { MARGIN_TITLE_X1, MARGIN_TITLE_X2 } from './class-package-style.js';
import type { NamespaceGeo } from './class-geo-namespace-types.js';
import { namespaceUSymbolInk } from './class-namespace-usymbol-shape.js';
import { atomFontSpec } from './class-member-creole-sea.js';

/** `LimitFinder.java:220`'s `1.5` baseline drop. */
const TEXT_INK_BASELINE_DROP = 1.5;

/** Where one title block sits, local to the group's `(x, y)` -- each draw
 *  site's own rule (see {@link namespaceTitleInk}). */
export interface TitleInkPlacement {
  /** The single-line fallback's `x` (`renderNamespaceTitleAuto`'s
   *  `fallback.x`). */
  readonly singleX: number;
  /** The single-line fallback's baseline (`fallback.y`). */
  readonly singleBaseline: number;
  /** The multi-line block's top (`input.blockTopY`). */
  readonly blockTop: number;
  /** Per-line `x` for the multi-line block (`xForLine`). */
  readonly xForLine: (lineWidth: number) => number;
}

interface MutableInk {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function add(ink: MutableInk, x: number, y: number): void {
  ink.minX = Math.min(ink.minX, x);
  ink.minY = Math.min(ink.minY, y);
  ink.maxX = Math.max(ink.maxX, x);
  ink.maxY = Math.max(ink.maxY, y);
}

/** `LimitFinder#drawText` for one `UText` of width `w`, height `h`. */
function addText(ink: MutableInk, x: number, baseline: number, dim: { width: number; height: number }): void {
  const top = baseline - (dim.height - TEXT_INK_BASELINE_DROP);
  add(ink, x, top);
  add(ink, x + dim.width, top + dim.height);
}

/**
 * One physical line's runs, placed exactly as `class-namespace-title-runs.ts
 * #renderNamespaceTitleRuns` places them. A text run is a `UText`
 * (`drawText`); an image/sprite run is drawn at `(x, bottom - height)`
 * (unwind2-S11, the line's bottom) and is bounded by `LimitFinder#drawImage`
 * (`LimitFinder.java:195-203`): `(x, y)..(x + w - 1, y + h - 1)` over the
 * raster's own rounded size.
 */
function addLine(
  ink: MutableInk,
  measurer: StringMeasurer,
  line: NamespaceTitleLine,
  at: { x: number; y: number; bottom: number },
): void {
  let x = at.x;
  for (const run of line.runs) {
    if (run.kind === 'text') {
      const dim = measurer.measure(run.text, atomFontSpec(run.font));
      addText(ink, x, at.y, dim);
      x += dim.width;
      continue;
    }
    const top = at.bottom - run.height;
    add(ink, x, top);
    add(ink, x + Math.round(run.width) - 1, top + Math.round(run.height) - 1);
    x += run.width;
  }
}

/**
 * The title's ink extent, local to the group, or `undefined` for an empty
 * label (no `UText` is drawn). Mirrors `renderNamespaceTitleAuto`'s own
 * branch: a single-line, single-text-run title draws ONE `UText` at
 * `(singleX, singleBaseline)`; anything else draws each line at `blockTop +`
 * its {@link namespaceTitleLineBaselines} offset. A transparent title colour
 * still counts: `LimitFinder` never reads the colour (only `DriverTextSvg`
 * skips the markup).
 */
export function namespaceTitleInk(
  measurer: StringMeasurer,
  theme: Theme,
  label: string,
  place: TitleInkPlacement,
): LeafSymbolInk | undefined {
  if (label.length === 0) return undefined;
  const lines = namespaceTitleLines(measurer, theme, label);
  const ink: MutableInk = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const sole = lines.length === 1 && lines[0]!.runs.length === 1 && lines[0]!.runs[0]!.kind === 'text';
  if (sole) {
    addLine(ink, measurer, lines[0]!, { x: place.singleX, y: place.singleBaseline, bottom: place.singleBaseline });
    return ink;
  }
  const baselines = namespaceTitleLineBaselines(measurer, theme, lines);
  let bottom = place.blockTop;
  lines.forEach((line, i) => {
    bottom += line.fontSize;
    addLine(ink, measurer, line, { x: place.xForLine(line.width), y: place.blockTop + baselines[i]!, bottom });
  });
  return ink;
}

/** `USymbolFolder#asBig` (`USymbolFolder.java:228`): every line at the
 *  fixed local `(4, 2)` -- `renderNamespaceFolder`/`renderFolderLeaf`. */
export function folderTitlePlacement(baselineOffset: number): TitleInkPlacement {
  return {
    singleX: TITLE_LOCAL_LEFT_OFFSET,
    singleBaseline: baselineOffset,
    blockTop: TITLE_LOCAL_TOP_OFFSET,
    xForLine: () => TITLE_LOCAL_LEFT_OFFSET,
  };
}

/** `USymbolRectangle#asBig` (`USymbolRectangle.java:103-131`, CENTER): the
 *  title below the stereo at `2 + dimStereo.getHeight()`, each line centred
 *  in `width` -- `renderNamespaceRect`/`renderRectLeaf`. `wtitle` is
 *  `getWTitle` (raw text width + X1 + X2). */
export function rectTitlePlacement(
  box: { readonly width: number; readonly wtitle: number },
  stereoHeight: number,
  baselineOffset: number,
): TitleInkPlacement {
  const rawTextWidth = box.wtitle - (MARGIN_TITLE_X1 + MARGIN_TITLE_X2);
  return {
    singleX: (box.width - rawTextWidth) / 2,
    singleBaseline: stereoHeight + baselineOffset,
    blockTop: stereoHeight + TITLE_LOCAL_TOP_OFFSET,
    xForLine: (w) => (box.width - w) / 2,
  };
}

/**
 * A populated group's drawn-ink fields, dispatched exactly like
 * `renderer.ts#renderNamespace`: a USymbol container is walked whole
 * (`symbolInk`, `class-namespace-usymbol-shape.ts#namespaceUSymbolInk`);
 * otherwise `packageStyle rect` draws `USymbolRectangle#asBig` and the
 * default draws `USymbolFolder#asBig`, whose outline ink
 * `class-ink-box.ts#addNamespaceInk` already models -- only the title
 * `UText` ink (`titleInk`) is added for those.
 */
export function namespaceDrawnInk(
  geo: NamespaceGeo,
  theme: Theme,
  measurer: StringMeasurer,
): Pick<NamespaceGeo, 'symbolInk' | 'titleInk'> {
  const symbolInk = namespaceUSymbolInk(geo, theme, measurer);
  if (symbolInk !== undefined) return { symbolInk };
  const place =
    theme.packageStyle === 'rect'
      ? rectTitlePlacement(geo, geo.clusterHeaderStereo?.height ?? 0, geo.baselineOffset)
      : folderTitlePlacement(geo.baselineOffset);
  const titleInk = namespaceTitleInk(measurer, theme, geo.label, place);
  return titleInk !== undefined ? { titleInk } : {};
}
