/**
 * Legacy (pre-T6) box-family sizing math, kept ONLY as a fallback for
 * displays this task's `EntityImageDescription` routing (`leaf-sizing.ts`,
 * ADR-6) does not yet reproduce byte-exact:
 *
 * - a `<latex>` atom: the shared svek/ text pipeline
 *   (`EntityImageDescriptionSupport.ts#buildTextBlock`) measures it as a
 *   real, non-zero-width KaTeX render — WORSE, not better, against the two
 *   permanently-divergent LaTeX box fixtures (`gevozu-46-sasu860`/
 *   `sunuju-01-pote718`, `DIVERGENCES.md`). This port's OWN
 *   `leaf-sizing-text.ts#lineTextMetrics` instead treats a `<latex>` atom as
 *   contributing NO width at all — the pre-existing, jar-verified-CLOSER
 *   approximation for those two fixtures.
 * - an `<img>` tag that fails to decode: the shared lexer's "(Cannot
 *   decode)" text fallback (`creole-atoms.ts`) measures at whatever font
 *   `buildLine` was given — the PER-ELEMENT font, since
 *   `EntityImageDescriptionSupport.ts#buildLine` has no `defaultFont` seam
 *   at all (S1L-h: upstream builds that fallback `AtomText` with the
 *   DIAGRAM-default font, not the element's own — jar-verified via
 *   `jecici-56-bimu826`, which sets `skinparam rectangleFontSize 10`).
 *
 * Both are gaps in `EntityImageDescriptionSupport.ts`/`Delegates.ts`
 * (svek/, out of T6's write-set to change) discovered by this task's
 * shrink-only ratchet (widened-pin diagnosis) — not upstream divergences
 * this port invented. Every OTHER box-family display routes through
 * `EntityImageDescription.calculateDimensionSlow` instead.
 *
 * Split out of `leaf-sizing.ts` purely to stay under this project's
 * 500-line file cap (this project's established "500-line splits"
 * workaround, same precedent as `EntityImageDescriptionDelegates.ts`) — this
 * file is mechanically relocated pre-T6 `measureBox`/`boxIcon` logic, not a
 * new upstream divergence.
 */
import type { DescriptiveNode } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import { measureTextBlock } from './leaf-sizing-text.js';
import {
  type BoxSizingOpts,
  type Dim,
  BOX_MIN_WIDTH_DEFAULT,
  DEFAULT_BOX_MARGIN,
  LINE_HEIGHT_FACTOR,
  STEREO_MARGIN,
  SYMBOL_BOX_MARGIN,
  SYMBOL_ICON_ALLOWANCE,
} from './leaf-sizing-consts.js';

/** True when `display` carries markup this task's routing does not yet
 *  reproduce byte-exact for a box-family symbol — see module doc comment. */
export function hasUnroutedBoxMarkup(display: string): boolean {
  return display.includes('<latex>') || display.includes('<img');
}

/** Decoration allowance `[w, h]` for a box symbol. Only the default `uml2`
 *  component draws the corner icon; `uml1`/`rectangle` render a plain box. */
function boxIcon(symbol: DescriptiveNode['symbol'], componentStyle: BoxSizingOpts['componentStyle']): readonly [number, number] {
  if (symbol === 'component' && componentStyle !== undefined && componentStyle !== 'uml2') {
    return [0, 0];
  }
  return SYMBOL_ICON_ALLOWANCE[symbol] ?? [0, 0];
}

/** Bundles the per-diagram inputs `measureLegacyBoxFallback` needs, so its
 *  own parameter count stays under this project's complexity-hook ceiling. */
export interface LegacyBoxFallbackCtx {
  readonly measurer: StringMeasurer;
  readonly opts: BoxSizingOpts | undefined;
  readonly sprites: SpriteDimsLookup | undefined;
  /** The diagram-wide default font (`baseFont`, BEFORE any per-element
   *  `FontSize` override) — upstream builds the `<img>` cannot-decode
   *  fallback `AtomText` with this, not the element's own font (S1L-h). */
  readonly defaultFont: FontSpec;
}

/** Verbatim pre-T6 `measureBox` — see module doc comment for why this one
 *  case still needs it. `asSmall.calculateDimension = margin.addDimension
 *  (stereo ⊕ textBlock)`: content is the stereotype line stacked above the
 *  label, + per-symbol margin and icon, floored at `minimumWidth`. */
export function measureLegacyBoxFallback(node: DescriptiveNode, fontSpec: FontSpec, ctx: LegacyBoxFallbackCtx): Dim {
  const { measurer, opts, sprites, defaultFont } = ctx;
  const [marginH, marginV] = SYMBOL_BOX_MARGIN[node.symbol] ?? DEFAULT_BOX_MARGIN;
  const [iconW, iconH] = boxIcon(node.symbol, opts?.componentStyle);
  const lineH = fontSpec.size * LINE_HEIGHT_FACTOR;
  const block = measureTextBlock(node.display, fontSpec, measurer, sprites, {
    lineH,
    maxWidth: opts?.wrapWidth ?? 0,
    ...(opts?.guillemet !== undefined ? { guillemet: opts.guillemet } : {}),
    defaultFont,
  });
  let contentW = block.width;
  let contentH = block.height;
  if (node.stereotype !== undefined && node.stereotype.length > 0) {
    const stereoWidth = Math.max(...node.stereotype.map((s) => measurer.measure(`«${s}»`, fontSpec).width));
    contentW = Math.max(contentW, stereoWidth + STEREO_MARGIN);
    contentH += lineH * node.stereotype.length;
  }
  const minContentW = opts?.minimumWidth ?? BOX_MIN_WIDTH_DEFAULT;
  return {
    width: Math.max(minContentW, contentW) + marginH + iconW,
    height: contentH + marginV + iconH,
  };
}
