/**
 * `GraphicStrings.createBlackOnWhite` — the Welcome and Unsupported blocks,
 * with the PlantUML logo in a corner (unwind2-S8).
 *
 * Sans-serif 12 black text on white, through `Display#create7` (Creole), with
 * a 5px margin all round (`GraphicStrings.java` `margin = 5`). With an image
 * in a background corner, the block widens by `imagePadding` (30) plus the
 * image width and the image is drawn over the text area's right edge
 * (`GraphicStrings#calculateDimensionInternal22`, `#drawU`).
 *
 * Each line is as tall as its tallest run — under the deterministic bounder
 * exactly the font size (`StringBounderFromWidthTable.java`: `height = size`)
 * — and a run's baseline sits its descent above the line's bottom
 * (`AtomText.java:213-215`: `ypos = rect.getHeight() - descent`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java
 */
import type { FontSpec, StringMeasurer } from '../measurer.js';
import { driverTextPlacement } from '../svg-text-font.js';
import type { ErrorBlock, Sink } from './error-block.js';
import { drawImage } from './error-block.js';
import { BLACK, drawRun, ERROR_PAGE_MARGIN, parseCreoleSubset, SANS, SIZE_12 } from './error-text.js';
import type { Run } from './error-text.js';
import type { RasterImage } from './raster-image.js';

/** Where the image goes (`klimt/geom/GraphicPosition.java`). */
export type GraphicPosition = 'BACKGROUND_CORNER_TOP_RIGHT' | 'BACKGROUND_CORNER_BOTTOM_RIGHT';

/** `GraphicStrings#imagePadding`. */
const IMAGE_PADDING = 30;

/** `HColors.WHITE`, `createBlackOnWhite`'s background. */
const WHITE = '#FFFFFF';

/** `GraphicStrings.sansSerif12(TEXTCOLOR)`. */
const FONT: FontSpec = { family: SANS, size: SIZE_12, weight: 'normal', style: 'normal' };

/** One laid-out line: its runs, size, and the x of each run. */
interface LaidLine {
  readonly runs: readonly Run[];
  readonly width: number;
  readonly height: number;
}

function layLine(source: string, measurer: StringMeasurer): LaidLine {
  const runs = parseCreoleSubset(source, FONT, BLACK);
  const sizes = runs.map((r) => measurer.measure(r.content, r.font));
  return {
    runs,
    width: sizes.reduce((w, d) => w + d.width, 0),
    height: Math.max(0, ...sizes.map((d) => d.height)),
  };
}

function drawLine(sink: Sink, line: LaidLine, x: number, top: number, measurer: StringMeasurer): void {
  let runX = x;
  for (const run of line.runs) {
    const dim = measurer.measure(run.content, run.font);
    const baseline = top + dim.height - measurer.getDescent(run.font, run.content);
    // `DriverTextSvg.java:114-126`: blank-to-NBSP, leading spaces into x, trin,
    // then measured on the trimmed text, before `SvgGraphics` swaps a
    // monospace run's spaces.
    const { text, dx } = driverTextPlacement(run.content, measurer.measure(' ', run.font).width);
    const textLength = measurer.measure(text, run.font).width;
    sink.svg.push(drawRun({ ...run, textLength }, runX + dx, baseline));
    runX += dim.width;
  }
}

/** The image's top-left inside the margin box of `inner` size. @see GraphicStrings.java#drawU */
function imageOrigin(
  img: RasterImage,
  position: GraphicPosition,
  inner: { readonly width: number; readonly height: number },
): { readonly x: number; readonly y: number } {
  if (position === 'BACKGROUND_CORNER_BOTTOM_RIGHT')
    return { x: inner.width - img.width, y: inner.height - img.height };
  return { x: inner.width - img.width - 1, y: 1 };
}

/**
 * `GraphicStrings.createBlackOnWhite(strings)` — or, given `image`, the
 * `(strings, image, position)` overload.
 */
export function blackOnWhite(
  strings: readonly string[],
  measurer: StringMeasurer,
  image?: { readonly img: RasterImage; readonly position: GraphicPosition },
): ErrorBlock {
  const lines = strings.map((s) => layLine(s, measurer));
  const textWidth = Math.max(0, ...lines.map((l) => l.width));
  const textHeight = lines.reduce((h, l) => h + l.height, 0);
  const inner = {
    width: textWidth + (image === undefined ? 0 : IMAGE_PADDING + image.img.width),
    height: textHeight,
  };
  return {
    width: inner.width + 2 * ERROR_PAGE_MARGIN,
    height: inner.height + 2 * ERROR_PAGE_MARGIN,
    background: WHITE,
    draw: (sink, x, y) => {
      const left = x + ERROR_PAGE_MARGIN;
      let top = y + ERROR_PAGE_MARGIN;
      for (const line of lines) {
        drawLine(sink, line, left, top, measurer);
        top += line.height;
      }
      if (image === undefined) return;
      const at = imageOrigin(image.img, image.position, inner);
      drawImage(sink, image.img, left + at.x, y + ERROR_PAGE_MARGIN + at.y);
    },
  };
}
