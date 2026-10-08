/**
 * The `TextBlock` composition the error, Welcome and Unsupported pages are
 * built from — unwind2-S8.
 *
 * Upstream composes those pages out of `TextBlock`s merged top-to-bottom
 * (`TextBlockVertical`) or left-to-right (`TextBlockHorizontal`), each one
 * optionally carrying a background colour (`TextBlockUtils#addBackcolor`),
 * then hands the result to `SvgGraphics`, whose canvas starts at the block's
 * declared size and grows to whatever is drawn past it
 * (`SvgGraphics#ensureVisible`). This is that model, just large enough for
 * those pages: a block knows its declared size, its background, and how to
 * draw itself at an origin into a {@link Sink}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockVertical.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockHorizontal.java
 */
import { group, image, rect } from '../svg.js';
import { assembleDocumentShell } from '../klimt/document-shell.js';
import type { ShellFragment } from '../klimt/document-shell.js';
import type { RasterImage } from './raster-image.js';

/** What a block draws into: the SVG elements, and the canvas extent. */
export interface Sink {
  readonly svg: string[];
  /** `SvgGraphics#ensureVisible` (`SvgGraphics.java:129-136`). */
  ensureVisible(x: number, y: number): void;
}

/** One `TextBlock`: declared size, optional background, and its drawing. */
export interface ErrorBlock {
  readonly width: number;
  readonly height: number;
  /** `TextBlock#getBackcolor`; `undefined` is upstream's `null`. */
  readonly background?: string;
  draw(sink: Sink, x: number, y: number): void;
}

/**
 * `TextBlockUtils.mergeTB(b1, b2, LEFT)`: width the max, height the sum; each
 * block with a background gets a rect as wide as the WHOLE merge
 * (`TextBlockVertical.java:79-104`). The merge itself has no background.
 */
export function mergeTB(b1: ErrorBlock, b2: ErrorBlock): ErrorBlock {
  const width = Math.max(b1.width, b2.width);
  return {
    width,
    height: b1.height + b2.height,
    draw: (sink, x, y) => {
      let top = y;
      for (const block of [b1, b2]) {
        if (block.background !== undefined)
          sink.svg.push(
            rect(x, top, width, block.height, { fill: block.background, stroke: block.background, strokeWidth: 1 }),
          );
        block.draw(sink, x, top);
        top += block.height;
      }
    },
  };
}

/**
 * `TextBlockUtils.mergeLR(b1, b2, TOP)`: width the sum, height the max, both
 * drawn from the top and NO background rect (`TextBlockHorizontal.java:69-93`).
 */
export function mergeLR(b1: ErrorBlock, b2: ErrorBlock): ErrorBlock {
  return {
    width: b1.width + b2.width,
    height: Math.max(b1.height, b2.height),
    draw: (sink, x, y) => {
      b1.draw(sink, x, y);
      b2.draw(sink, x + b1.width, y);
    },
  };
}

/**
 * Draw `img` at (`x`, `y`): `<image>` at its pixel size, which also extends
 * the canvas (`SvgGraphics#svgImage`, `SvgGraphics.java:970-983`).
 */
export function drawImage(sink: Sink, img: RasterImage, x: number, y: number): void {
  sink.svg.push(image(x, y, img.width, img.height, img.href));
  sink.ensureVisible(x, y);
  sink.ensureVisible(x + img.width, y + img.height);
}

/**
 * `new UImage(new PixelImage(img, ...))` as a block: one pixel narrower and
 * shorter than the image itself (`UImage.java:87-92`, `:118-120`).
 */
export function imageBlock(img: RasterImage): ErrorBlock {
  return {
    width: img.width - 1,
    height: img.height - 1,
    draw: (sink, x, y) => drawImage(sink, img, x, y),
  };
}

/** `(int) (x + 1)`, the canvas-growth step of `SvgGraphics#ensureVisible`. */
function grow(value: number): number {
  return Math.trunc(value + 1);
}

/**
 * The whole page: `block` drawn at the origin into the shared document
 * shell. The canvas is seeded with the declared size
 * (`SvgGraphics.java:141-143`, `ensureVisible(minDim)`) and grows past it
 * only where a drawn image reaches further. The page background is the
 * block's own, else white -- the root `style` carries it, with no rect.
 */
export function renderErrorBlock(block: ErrorBlock): string {
  let maxX = grow(block.width);
  let maxY = grow(block.height);
  const sink: Sink = {
    svg: [],
    ensureVisible: (x, y) => {
      if (x > maxX) maxX = grow(x);
      if (y > maxY) maxY = grow(y);
    },
  };
  block.draw(sink, 0, 0);
  const fragment: ShellFragment = {
    body: group(sink.svg.join('')),
    width: maxX,
    height: maxY,
    background: block.background ?? WHITE,
  };
  return assembleDocumentShell(fragment, undefined);
}

/** `HColors.WHITE`: the canvas behind a block with no background of its own. */
const WHITE = '#FFFFFF';
