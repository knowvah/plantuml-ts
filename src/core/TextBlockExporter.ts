/**
 * `TextBlockExporter#calculateFinalDimension` — the diagram's outer margin
 * applied to whatever the inner `TextBlock` measured, plus the truncating
 * `+1` `SvgGraphics` applies when it sizes the canvas.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:198-202
 *
 * ```java
 * private XDimension2D calculateFinalDimension() {
 *     final XDimension2D dim = textBlock.calculateDimension(stringBounder);
 *     return new XDimension2D(dim.getWidth() + margin.getLeft() + margin.getRight(),
 *             dim.getHeight() + margin.getTop() + margin.getBottom());
 * }
 * ```
 *
 * The recipe spans three upstream classes, which is why it lived duplicated
 * for so long — no single Java file holds all of it:
 *
 * 1. `SvekResult#calculateDimension` produces `dim` (ink + `delta(15,15)`) —
 *    `core/svek/SvekResult.ts#svekDimension`.
 * 2. `TextBlockExporter#calculateFinalDimension` adds the margin, which for
 *    the cuca family is `CucaDiagram#getDefaultMargins()` —
 *    `core/atmp/CucaDiagram.ts`.
 * 3. `SvgGraphics#ensureVisible` truncates: `maxX = (int) (x + 1)`
 *    (`klimt/drawing/svg/SvgGraphics.java:129-135`).
 *
 * The class and state engines each had all three steps inline, in identical
 * arithmetic, differing only in how they built the ink extent — which is
 * genuinely per-engine (they draw different shapes and so have different
 * per-shape ink rules). Only the recipe is shared here; neither engine's ink
 * rules move.
 *
 * **The description engine deliberately does NOT use this.** It walks a real
 * `UGraphic` to a `MinMax` rather than accumulating a plain-geometry ink box,
 * and its `computeDocumentDims` applies the margins WITHOUT the `ensureVisible`
 * truncation. Routing it through here would change its output, which is a
 * behaviour change wearing a consolidation's clothes.
 */

import { absorbLayoutEpsilon } from './layout-epsilon.js';
import {
  CUCA_DOCUMENT_MARGIN_TOP,
  CUCA_DOCUMENT_MARGIN_RIGHT,
  CUCA_DOCUMENT_MARGIN_BOTTOM,
  CUCA_DOCUMENT_MARGIN_LEFT,
} from './atmp/CucaDiagram.js';

export interface DocumentDims {
  width: number;
  height: number;
}

/**
 * Step 2 and 3 of the recipe above: add `CucaDiagram`'s default margins to a
 * measured dimension, then apply `SvgGraphics#ensureVisible`'s truncating
 * `(int)(v + 1)` — which for a non-negative `v` is `Math.floor(v + 1)`.
 *
 * `absorbLayoutEpsilon` runs first, deliberately: a value that is a hair
 * under an integer from accumulated float error would otherwise truncate a
 * whole pixel down.
 *
 * Kept separate from {@link import('./svek/SvekResult.js').svekDimension} —
 * rather than folded into one call — because the class engine needs the two
 * halves independently: its chrome path re-applies the margin to a
 * chrome-adjusted raw dimension (`core/annotations/chrome.ts#applyChrome`),
 * so the raw half has to be observable on its own.
 */
export function applyCucaDocumentMargin(dims: DocumentDims): DocumentDims {
  const width = dims.width + CUCA_DOCUMENT_MARGIN_LEFT + CUCA_DOCUMENT_MARGIN_RIGHT;
  const height = dims.height + CUCA_DOCUMENT_MARGIN_TOP + CUCA_DOCUMENT_MARGIN_BOTTOM;
  return {
    width: Math.floor(absorbLayoutEpsilon(width) + 1),
    height: Math.floor(absorbLayoutEpsilon(height) + 1),
  };
}
