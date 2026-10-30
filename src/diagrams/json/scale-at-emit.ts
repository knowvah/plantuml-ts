/**
 * The `scale …` directive for the json family, applied where upstream applies
 * it: at emit, to a page drawn at 1x.
 *
 * Replaces `scale-geo.ts`, which multiplied the LAYOUT's geometry. Upstream
 * multiplies nowhere but `SvgGraphics#format` (`SvgGraphics.java:468-475`), so
 * every length introduced after the layout is a 1x length that the multiply
 * then scales; multiplying the inputs missed four of them (the arrowhead tip
 * `ep`, the spot's `VERY_FIRST_LINE`, the cell's `CELL_MARGIN_X`, the `+1`).
 *
 * Reuses the shared emit-time mechanism the activity, description and
 * sequence engines use (`TextBlockExporter.ts#scaleActivityBody` over a body
 * drawn inside `svg-format.ts#withDeferredFormat`): no `src/core/` change.
 */

import { scaleActivityBody } from '../../core/TextBlockExporter.js';

/** What the json renderer puts on the canvas, before the document shell is declared. */
export interface DrawnJson {
  readonly body: string;
  readonly width: number;
  readonly height: number;
  readonly background?: string;
}

/**
 * `scale …` applied where upstream applies it: at emit, to a page drawn at 1x
 * (`SvgGraphics#format` multiplies every emitted numeric,
 * `SvgGraphics.java:468-475`; the exporter's `UGraphic` carries the scale from
 * the start, `TextBlockExporter.java:159-177`).
 *
 * - `body` was drawn with its numbers deferred (`withDeferredFormat`), so the
 *   multiply-then-round pass (`TextBlockExporter.ts#scaleActivityBody`, the
 *   shared single `format` step) is the only rounding, as upstream's;
 * - the canvas is `(int)(maxX * scale)` (`SvgGraphics.java:801-802`) with
 *   `maxX = (int)(x + 1)` tracked on UNSCALED coordinates (`ensureVisible`,
 *   `:129-135`, seeded by `withMinDim`, `TextBlockExporter.java:284`), so the
 *   `+1` is truncated BEFORE the multiply -- never `trunc((x + 1) * k)`.
 */
export function scaleAtEmit(drawn: DrawnJson, k: number): DrawnJson {
  return {
    ...drawn,
    body: scaleActivityBody(drawn.body, k),
    width: Math.trunc(drawn.width) * k,
    height: Math.trunc(drawn.height) * k,
  };
}
