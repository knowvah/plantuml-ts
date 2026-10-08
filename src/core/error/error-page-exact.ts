/**
 * Exact `PSystemError` page geometry (C-17) — split out of
 * `error-renderer.ts` (500-line complexity hook).
 *
 * `PSystemError#getGraphicalFormatted` builds five `TextBlockRaw`/
 * `TextBlockMarged` paragraphs and stacks them with `TextBlockUtils.mergeTB`
 * (`PSystemError.java:126-146`). Under the deterministic `StringBounder`
 * (`FileFormat.java:185-187` selects `StringBounderFromWidthTable` for
 * `-tsvg` with `PLANTUML_DETERMINISTIC_TEXT`), `TileText`'s own line box is
 * EXACTLY the font size (`StringBounderFromWidthTable.java`:
 * `final double height = size;`; `FontPosition.NORMAL#getSpace() == 0`, so
 * `TileText`'s `spaceBottom` is 0 too), and `SingleLine#maxDeltaY` for a
 * single-run line is exactly that same size — so a line's SVG baseline is
 * its box's own top plus the font size, no ascent/descent table involved.
 * `XDimension2D#mergeTB` is `width = max, height = sum`, applied
 * associatively regardless of `mergeTB`'s left-nested call order, so a
 * paragraph's contribution to the PAGE's overall width/height needs no tree
 * walk — EXCEPT the green `[From … ]` band's own background rect, which
 * `TextBlockVertical#drawU` sizes to `dimtotal.getWidth()` of the ONE
 * `TextBlockVertical` it is the `b1` of (`result = mergeTB(result0, result1,
 * LEFT)`, `PSystemError.java:140`) — i.e. `max(bandWidth, bodyAllButLastWidth)`,
 * NOT the whole page's width and NOT the band's own line width alone.
 * Every OTHER merge step's `b1`/`b2` carries no backcolor
 * (`TextBlockVertical.java`'s `if (back != null …)` guard), so draws no rect.
 *
 * {@link errorPageBlock} is the page as one block; `error-renderer.ts` stacks
 * the Welcome block over it (source < 5 lines) and the Arecibo image beside
 * it, unwind2-S8.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemError.java#getGraphicalFormatted
 */

import type { FontSpec, StringMeasurer } from '../measurer.js';
import { rect } from '../svg.js';
import { emittedTextForm } from '../svg-text-font.js';
import type { PSystemError } from './PSystemError.js';
import {
  BLACK,
  RED,
  MY_GREEN,
  SANS,
  SIZE_12,
  SIZE_14,
  ERROR_PAGE_MARGIN,
  BAND_PAD_X,
  BAND_PAD_TOP,
  BAND_PAD_BOTTOM,
  HEADER_PAD_RIGHT,
  HEADER_PAD_BOTTOM,
  drawRun,
} from './error-text.js';
import type { Run } from './error-text.js';
import type { ErrorBlock } from './error-block.js';

/** One paragraph of the error page: `N` lines sharing a font/fill, optionally
 *  wrapped in a `TextBlockUtils#withMargin` box (and, for the `[From … ]`
 *  paragraph only, a green background). */
interface ErrorSegment {
  readonly lines: readonly string[];
  readonly font: FontSpec;
  readonly fill: string;
  readonly decoration?: string;
  readonly marginLeft: number;
  readonly marginRight: number;
  readonly marginTop: number;
  readonly marginBottom: number;
  readonly band?: string;
}

const ZERO_MARGIN = { marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0 } as const;

/** `result4` — the version banner: `withMargin(…, 0, 2, 0, 8)`. */
function bannerSegment(system: PSystemError): ErrorSegment {
  const fc4: FontSpec = { family: SANS, size: SIZE_12, weight: 'bold', style: 'italic' };
  return {
    lines: system.header(),
    font: fc4,
    fill: MY_GREEN,
    marginLeft: 0,
    marginRight: HEADER_PAD_RIGHT,
    marginTop: 0,
    marginBottom: HEADER_PAD_BOTTOM,
  };
}

/** `result0` — the `[From … ]` stack: `withMargin(…, 1, 1, 1, 4)`, backed by
 *  the green band `TextBlockVertical#drawU` draws for it. */
function bandSegment(system: PSystemError): ErrorSegment {
  const fc0: FontSpec = { family: SANS, size: SIZE_14, weight: 'bold', style: 'normal' };
  return {
    lines: system.getTextFromStack(),
    font: fc0,
    fill: BLACK,
    marginLeft: BAND_PAD_X,
    marginRight: BAND_PAD_X,
    marginTop: BAND_PAD_TOP,
    marginBottom: BAND_PAD_BOTTOM,
    band: MY_GREEN,
  };
}

/** `SingleLine#rawText`: `if (text.length() == 0) text = " ";` — a blank
 *  SOURCE line (the only place an empty string can reach this file; the
 *  banner/band/error paragraphs are never empty) is substituted BEFORE the
 *  line ever becomes a `TileText`, so both its measured width and its
 *  emitted content see the space, not the empty string. */
function rawLine(l: string): string {
  return l.length === 0 ? ' ' : l;
}

/** `result1`/`result2` — the source listing, unmargined: every line but the
 *  last, then the last (the one that failed) alone, wavy-underlined. */
function bodySegments(system: PSystemError): readonly [ErrorSegment, ErrorSegment] {
  const fc1: FontSpec = { family: SANS, size: SIZE_14, weight: 'bold', style: 'normal' };
  const fullBody = system.getTextFullBody().map(rawLine);
  return [
    { lines: fullBody.slice(0, -1), font: fc1, fill: MY_GREEN, ...ZERO_MARGIN },
    { lines: fullBody.slice(-1), font: fc1, fill: MY_GREEN, decoration: 'wavy underline', ...ZERO_MARGIN },
  ];
}

/** `result3` — the message, in red, unmargined. */
function errorSegment(system: PSystemError): ErrorSegment {
  const fc2: FontSpec = { family: SANS, size: SIZE_14, weight: 'bold', style: 'normal' };
  return { lines: system.getTextError(), font: fc2, fill: RED, ...ZERO_MARGIN };
}

/**
 * The five paragraphs, in `PSystemError#getGraphicalFormatted`'s own order
 * (`result4`, `result0`..`result3`).
 * @see ~/git/plantuml/.../error/PSystemError.java#getGraphicalFormatted
 */
function buildErrorSegments(system: PSystemError): readonly ErrorSegment[] {
  const [allButLast, last] = bodySegments(system);
  return [bannerSegment(system), bandSegment(system), allButLast, last, errorSegment(system)];
}

/** A paragraph's own line width, measured on the RAW (untrimmed) string —
 *  `TileText#calculateDimensionSlow`'s `stringBounder.calculateDimension(…,
 *  text)`, BEFORE `DriverTextSvg`'s leading/trailing-whitespace strip. */
function segmentRawWidth(seg: ErrorSegment, measurer: StringMeasurer): number {
  return Math.max(0, ...seg.lines.map((l) => measurer.measure(l, seg.font).width));
}

/** `TextBlockRaw#getTextDimension`: height = Σ of each line's own box height,
 *  which under the deterministic bounder is exactly the font size per line. */
function segmentRawHeight(seg: ErrorSegment): number {
  return seg.lines.length * seg.font.size;
}

/** `TextBlockMarged#calculateDimension`: `dim.delta(left+right, top+bottom)`. */
function segmentMarginedWidth(seg: ErrorSegment, measurer: StringMeasurer): number {
  return segmentRawWidth(seg, measurer) + seg.marginLeft + seg.marginRight;
}

function segmentMarginedHeight(seg: ErrorSegment): number {
  return segmentRawHeight(seg) + seg.marginTop + seg.marginBottom;
}

/** The page's own declared width: `withMargin(result, 5, 5)` around the
 *  widest paragraph — `mergeTB`'s `width = max` is associative, so the
 *  overall max needs no tree walk regardless of the five paragraphs' actual
 *  left-nested `TextBlockVertical` shape. */
function errorPageWidth(segments: readonly ErrorSegment[], measurer: StringMeasurer): number {
  return 2 * ERROR_PAGE_MARGIN + Math.max(0, ...segments.map((s) => segmentMarginedWidth(s, measurer)));
}

/** The page's own declared height: `withMargin(result, 5, 5)` around the SUM
 *  of every paragraph's own height — `mergeTB`'s `height = sum` is likewise
 *  associative. */
function errorPageHeight(segments: readonly ErrorSegment[]): number {
  return 2 * ERROR_PAGE_MARGIN + segments.reduce((h, s) => h + segmentMarginedHeight(s), 0);
}

/** One paragraph's own lines, as `Run`s — baseline = this line's box top plus
 *  the font size (this file's own doc comment: `SingleLine#maxDeltaY`'s
 *  single-run case). */
function drawSegmentLines(seg: ErrorSegment, left: number, boxTop: number, measurer: StringMeasurer): string[] {
  const svg: string[] = [];
  const x = left + ERROR_PAGE_MARGIN + seg.marginLeft;
  let lineTop = boxTop + seg.marginTop;
  for (const line of seg.lines) {
    const baseline = lineTop + seg.font.size;
    const display = emittedTextForm(line, seg.font.family);
    const run: Run = {
      content: line,
      font: seg.font,
      fill: seg.fill,
      textLength: measurer.measure(display, seg.font).width,
      ...(seg.decoration === undefined ? {} : { decoration: seg.decoration }),
    };
    svg.push(drawRun(run, x, baseline));
    lineTop += seg.font.size;
  }
  return svg;
}

/** One paragraph's own green band rect (when it has one) plus its lines,
 *  starting at `boxTop`. `bandRectWidth` is precomputed once by the caller
 *  (`max(bandWidth, bodyAllButLastWidth)` — this file's own doc comment). */
function drawSegment(seg: ErrorSegment, origin: Origin, measurer: StringMeasurer, bandRectWidth: number): string[] {
  const svg: string[] = [];
  const boxTop = origin.y;
  if (seg.band !== undefined) {
    svg.push(
      rect(origin.x + ERROR_PAGE_MARGIN, boxTop, bandRectWidth, segmentMarginedHeight(seg), {
        fill: seg.band,
        stroke: seg.band,
        strokeWidth: 1,
      }),
    );
  }
  svg.push(...drawSegmentLines(seg, origin.x, boxTop, measurer));
  return svg;
}

/** Where a page's top-left corner lands. */
interface Origin {
  readonly x: number;
  readonly y: number;
}

/**
 * Draw all five paragraphs top to bottom, starting at the page's own
 * `withMargin(result, 5, 5)` top/left inside `origin`.
 * @see ~/git/plantuml/.../error/PSystemError.java#getGraphicalFormatted
 */
function drawErrorSegments(segments: readonly ErrorSegment[], origin: Origin, measurer: StringMeasurer): string[] {
  const svg: string[] = [];
  const bandSeg = segments[1]!;
  const bodyAllButLast = segments[2]!;
  const bandRectWidth = Math.max(segmentMarginedWidth(bandSeg, measurer), segmentRawWidth(bodyAllButLast, measurer));

  let y = origin.y + ERROR_PAGE_MARGIN;
  for (const seg of segments) {
    svg.push(...drawSegment(seg, { x: origin.x, y }, measurer, bandRectWidth));
    y += segmentMarginedHeight(seg);
  }
  return svg;
}

/**
 * The faithful `PSystemError` page as one block: its declared size (the
 * `withMargin(result, 5, 5)` box, un-truncated) and black background
 * (`addBackcolor(result, HColors.BLACK)`, `PSystemError.java:145`), drawn at
 * any origin -- alone, under the Welcome block, or beside the Arecibo image.
 */
export function errorPageBlock(system: PSystemError, measurer: StringMeasurer): ErrorBlock {
  const segments = buildErrorSegments(system);
  return {
    width: errorPageWidth(segments, measurer),
    height: errorPageHeight(segments),
    background: BLACK,
    draw: (sink, x, y) => sink.svg.push(...drawErrorSegments(segments, { x, y }, measurer)),
  };
}
