import type { UGraphic } from '../UGraphic.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { XDimension2D } from '../geom/XDimension2D.js';
import type { XRectangle2D } from '../geom/XRectangle2D.js';
import type { MinMax } from '../geom/MinMax.js';
import type { MagneticBorder } from '../geom/MagneticBorder.js';
import type { Paint } from '../../paint.js';
import { textBlockMagneticBorder, type TextBlock } from './TextBlock.js';

/**
 * Url — structural seam for `url/Url.java`, pending SI1/T3's
 * `src/core/url/Url.ts` (a parallel batch-1 task; importing it here
 * would race that task's landing). The three accessors are upstream
 * `Url.java`'s core surface, so T3's class satisfies this shape
 * structurally. Once T3 has landed, a follow-up may swap this for
 * `import type { Url } from '../../url/Url.js'` — same precedent as
 * `UTranslate.ts`'s `Point2D` stand-in for `XPoint2D`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/Url.java
 */
export interface Url {
  getUrl(): string;
  getTooltip(): string;
  getLabel(): string;
}

/**
 * TextBlockWithUrl — wraps a `TextBlock` so its draw is bracketed by
 * `startUrl(url)`/`closeUrl()` (the SVG hyperlink anchor), delegating
 * every other `TextBlock` member to the wrapped block.
 *
 * Upstream: klimt/shape/TextBlockWithUrl.java. All members ported:
 * `withUrl` (the null-url pass-through factory), the private
 * constructor, `drawU`, `calculateDimension` (upstream `@Fast`),
 * `getMinMax`, `getInnerPosition`, `getMagneticBorder`, `getBackcolor`.
 *
 * Port idioms (established by `TextBlockLineBefore.ts` /
 * `TextBlock.ts` — this port's `TextBlock` interface deliberately
 * omits the Java default members):
 * - `drawU` duck-types `startUrl`/`closeUrl` on the incoming
 *   `UGraphic` (this port's `UGraphic.ts` interface does not carry
 *   them yet); a backend without url support just draws the block.
 * - `getMinMax` delegates when the block supports it and otherwise
 *   throws, mirroring `TextBlock.java`'s throwing default.
 * - `getInnerPosition`/`getBackcolor` delegate optionally, with
 *   `undefined` standing in for upstream's `null` defaults.
 * - `getMagneticBorder` resolves through `textBlockMagneticBorder`
 *   (the `MagneticBorderNone` default helper).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockWithUrl.java
 */
export class TextBlockWithUrl implements TextBlock {
  private readonly block: TextBlock;
  private readonly url: Url;

  /** @see klimt/shape/TextBlockWithUrl.java#withUrl */
  static withUrl(block: TextBlock, url: Url | undefined): TextBlock {
    if (url === undefined) return block;

    return new TextBlockWithUrl(block, url);
  }

  private constructor(block: TextBlock, url: Url) {
    this.block = block;
    this.url = url;
  }

  /** @see klimt/shape/TextBlockWithUrl.java#drawU */
  drawU(ug: UGraphic): void {
    const candidate = ug as UGraphic & Partial<{ startUrl(url: Url): void; closeUrl(): void }>;
    candidate.startUrl?.(this.url);
    this.block.drawU(ug);
    candidate.closeUrl?.();
  }

  /** @see klimt/shape/TextBlockWithUrl.java#calculateDimension (upstream @Fast) */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    return this.block.calculateDimension(stringBounder);
  }

  /** @see klimt/shape/TextBlockWithUrl.java#getMinMax */
  getMinMax(stringBounder: StringBounder): MinMax {
    const candidate = this.block as Partial<{ getMinMax(sb: StringBounder): MinMax }>;
    if (candidate.getMinMax !== undefined) return candidate.getMinMax(stringBounder);
    // TextBlock.java's default getMinMax throws UnsupportedOperationException.
    throw new Error('TextBlockWithUrl: wrapped block does not support getMinMax');
  }

  /** @see klimt/shape/TextBlockWithUrl.java#getInnerPosition */
  getInnerPosition(member: string, stringBounder: StringBounder): XRectangle2D | undefined {
    const candidate = this.block as Partial<{
      getInnerPosition(m: string, sb: StringBounder): XRectangle2D | undefined;
    }>;
    return candidate.getInnerPosition?.(member, stringBounder);
  }

  /** @see klimt/shape/TextBlockWithUrl.java#getMagneticBorder */
  getMagneticBorder(): MagneticBorder {
    return textBlockMagneticBorder(this.block);
  }

  /** @see klimt/shape/TextBlockWithUrl.java#getBackcolor (upstream default: null) */
  getBackcolor(): Paint | undefined {
    const candidate = this.block as Partial<{ getBackcolor(): Paint | undefined }>;
    return candidate.getBackcolor?.();
  }
}
