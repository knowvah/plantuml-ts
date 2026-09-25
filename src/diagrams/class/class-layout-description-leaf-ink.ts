/**
 * `symbolInk` for a `class-layout-generic-classifier.ts#tryMeasureDescriptionLeaf`
 * leaf — split out purely to keep that file under the project's 500-line
 * cap (cdd3-T8, R-LEAF); a pure move plus the new gate/call, zero behavior
 * change to anything this file does not itself add.
 *
 * @see class-layout-generic-classifier.ts#tryMeasureDescriptionLeaf
 */

import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import type { BoxSizingOpts } from '../../core/svek/image/leaf-sizing.js';
import { measureEntityLeafInk, type LeafSymbolInk } from '../../core/svek/image/leaf-sizing-entity.js';
import type { LeafSizingSubject } from '../../core/svek/image/LeafSizingSubject.js';

/** R-LEAF (cdd2-T17, cdd3-T8): the two USymbols a `descriptive` leaf ALSO
 *  draws through `EntityImageDescription.drawU` at render time
 *  (`renderer-usymbol-entity.ts#usesClassUSymbolEntity`'s `component`/
 *  `database` arms -- its third arm, `actor`, is already excluded by
 *  `tryMeasureDescriptionLeaf`'s own early return, and `usecase`/`circle`
 *  never reach that function: they carry `classifier.kind !== 'descriptive'`).
 *  Every OTHER symbol here (`folder`/`package`/`note`/`rectangle`/...)
 *  renders through a DIFFERENT path (`renderNamespaceUSymbol`/
 *  `renderClassifierBox`/...), so walking `EntityImageDescription` for them
 *  would measure ink for a shape nothing on screen matches -- gating here
 *  keeps the change additive, matching `class-ink-box.ts#addClassifierInk`'s
 *  own "only leaves that would otherwise fall through to the box rule"
 *  discipline for the `symbolInk` field it already reads. */
const DESCRIPTION_LEAF_INK_SYMBOLS: ReadonlySet<LeafSizingSubject['symbol']> = new Set(['component', 'database']);

/**
 * `measureEntityLeafInk`'s `fontSpec` param must be the SAME per-element
 * collapsed size `measureLeafNode`'s own default-case call to
 * `measureEntityLeaf` uses internally (`leaf-sizing.ts:117`,
 * `opts?.fontSize === undefined ? baseFont : {...baseFont, size:
 * opts.fontSize}`) -- reproduced here rather than threading a third
 * fontSpec out of `measureLeafNode`, which stays a plain `Dim` return.
 *
 * `undefined` for every symbol outside {@link DESCRIPTION_LEAF_INK_SYMBOLS},
 * which keeps `tryMeasureDescriptionLeaf`'s caller falling through to the
 * existing `addRectInk` box rule for those (`class-ink-box.ts
 * #addClassifierInk`'s `c.symbolInk !== undefined` gate).
 */
export function descriptionLeafSymbolInk(
  node: LeafSizingSubject,
  symbol: LeafSizingSubject['symbol'],
  baseFont: { family: string; size: number },
  ctx: { opts: BoxSizingOpts; sprites: SpriteDimsLookup | undefined; measurer: StringMeasurer },
): LeafSymbolInk | undefined {
  if (!DESCRIPTION_LEAF_INK_SYMBOLS.has(symbol)) return undefined;
  const fontSpec = ctx.opts.fontSize === undefined ? baseFont : { ...baseFont, size: ctx.opts.fontSize };
  return measureEntityLeafInk(node, fontSpec, ctx);
}
