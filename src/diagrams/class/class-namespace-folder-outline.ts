/**
 * class-namespace-folder-outline.ts — the folder-tab OUTLINE shape builders
 * (`USymbolFolder#drawFolder`'s two branches: the default rounded-arc
 * `UPath`, and the `skinparam style strictuml` sharp-corner `UPolygon`).
 * Split out of `class-namespace-shape.ts` purely to keep that file under
 * this project's 500-line file cap (T7b) -- mirrors the existing
 * `renderer-arrowhead.ts`/`renderer-group.ts`/`renderer-uid.ts`
 * split-out-of-`renderer.ts` precedent; no behavior change.
 *
 * @see ~/git/plantuml/.../decoration/symbol/USymbolFolder.java#drawFolder
 */
import { attrs } from '../../core/svg.js';
import { moveTo, lineTo, arcTo } from '../../core/svg-path-builder.js';
import { formatDecimal, DEFAULT_SVG_DECIMALS , shortenColor} from '../../core/svg-format.js';

/**
 * `USymbolFolder#drawFolder`'s `UPath` branch (`roundCorner !== 0`): the
 * SVG path `d` for the folder-tab outline, in ABSOLUTE coordinates (every
 * point offset by the namespace box's own `(ox, oy)` origin up front —
 * matches `USymbolFolder#asBig` drawing under
 * `ug.apply(this.geometry.position)` without a separate translate pass).
 * Byte-verified against `finono-05-cuvu171`'s path (origin `(6, 6)`) —
 * every `L`/`A` endpoint matches exactly.
 */
export function folderPathD(
  ox: number,
  oy: number,
  wtitle: number,
  htitle: number,
  width: number,
  height: number,
  roundCorner: number,
): string {
  const half = roundCorner / 2;
  const tabRadius = half * 1.5;
  const p = (x: number, y: number): [number, number] => [ox + x, oy + y];
  // T7b: every coordinate now routes through svg-path-builder.ts's
  // moveTo/lineTo/arcTo (formatDecimal, ADR-1) instead of raw template-
  // literal interpolation -- fixes the raw-float leak T6e uncovered
  // (`d="M8.5,6 L28.925000000000004,6 ..."`) once javaRound4 pre-rounding
  // was removed.
  return [
    moveTo(...p(half, 0)),
    lineTo(...p(wtitle - half, 0)),
    arcTo(...p(wtitle, half), tabRadius, 0, 1),
    lineTo(...p(wtitle + 7, htitle)), // MARGIN_TITLE_X3
    lineTo(...p(width - half, htitle)),
    arcTo(...p(width, htitle + half), half, 0, 1),
    lineTo(...p(width, height - half)),
    arcTo(...p(width - half, height), half, 0, 1),
    lineTo(...p(half, height)),
    arcTo(...p(0, height - half), half, 0, 1),
    lineTo(...p(0, half)),
    arcTo(...p(half, 0), half, 0, 1),
  ].join(' ');
  // #lizard forgives -- flat sequence of 12 path-segment builder calls, one
  // per USymbolFolder#drawFolder's own moveTo/lineTo/arcTo call
  // (decoration/symbol/USymbolFolder.java) -- reducible only by splitting
  // one upstream shape literal across functions, which would obscure the
  // segment-by-segment jar citation in this module's own doc comment.
}

/**
 * `USymbolFolder#drawFolder`'s `UPolygon` branch (`roundCorner === 0`,
 * `skinparam style strictuml`) -- the SAME 7 corner points `folderPathD`
 * traces, but every `A` arc collapses to a single point at `roundCorner=0`
 * (`half=0`/`tabRadius=0`), so jar draws a plain sharp-cornered
 * `<polygon>` instead of a rounded-arc `<path>` -- byte-verified against
 * `jinibe-02-tebi269`'s own `points="16,6,29.7875,6,36.7875,26,64,26,64,95,
 * 16,95,16,6"` (7 unique points, closing back to the start).
 */
export function folderPolygonPoints(
  ox: number,
  oy: number,
  wtitle: number,
  htitle: number,
  width: number,
  height: number,
): Array<[number, number]> {
  const pt = (x: number, y: number): [number, number] => [ox + x, oy + y];
  return [
    pt(0, 0),
    pt(wtitle, 0),
    pt(wtitle + 7, htitle), // MARGIN_TITLE_X3
    pt(width, htitle),
    pt(width, height),
    pt(0, height),
    pt(0, 0),
  ];
  // #lizard forgives -- pre-existing (unchanged by A2s F-D): 6 positional geometry params mirror USymbolFolder.java's own signature verbatim (porting discipline).
}

/** `USymbolFolder#drawFolder`'s `UPolygon` draw call under `strictuml`,
 *  matching `SvgGraphics`'s own `<polygon>` serialization for a klimt
 *  `UPolygon` (`svg-graphics-elements.ts#svgPolygon`, comma-only point
 *  list, a `style="stroke:...;stroke-width:...;"` PLUS the fixed
 *  `stroke-linejoin:miter;stroke-miterlimit:10;` suffix every klimt
 *  polygon carries) -- class draws plain SVG strings (never through
 *  `UGraphic`, see `class-namespace-shape.ts`'s own header doc comment),
 *  so this mirrors `class-visibility-icon.ts#polygonTag`'s identical
 *  established hand-built-markup precedent rather than routing through
 *  `core/svg.ts#polygon()` -- that emitter's discrete `stroke`/
 *  `stroke-width` attrs + space-joined points is a DIFFERENT, established
 *  shape used by many other callers outside this task's write-set; this
 *  function's own jar-verified shape (comma-joined points, one combined
 *  `style=` attr) is what real `SvgGraphics#svgPolygon` actually emits
 *  (`styleMe`), confirmed byte-for-byte against
 *  `test-results/dot-cache/class/jinibe-02-tebi269/in.svg`. Routed through
 *  `attrs()` (the shared emission choke point, ADR-1) rather than a raw
 *  template literal (T7b). */
export function renderFolderPolygon(
  points: ReadonlyArray<[number, number]>,
  stroke: string,
  strokeWidth: number,
  fill: string,
): string {
  const d3 = DEFAULT_SVG_DECIMALS;
  const pts = points.map(([x, y]) => `${formatDecimal(x, d3)},${formatDecimal(y, d3)}`).join(',');
  const style = `stroke:${shortenColor(stroke)};stroke-width:${formatDecimal(strokeWidth, d3)};stroke-linejoin:miter;stroke-miterlimit:10;`;
  return `<polygon${attrs([['points', pts], ['fill', fill], ['style', style]])}/>`;
}
