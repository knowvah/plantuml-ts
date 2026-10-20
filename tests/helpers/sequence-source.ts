/**
 * Test-side seam for `parseSequence(source: UmlSource, …)` (sdd1 D3): a
 * hand-built source over bare interior lines, and the default-skin builder a
 * hand-built AST literal carries.
 */
import type { UmlSource } from '../../src/core/block-extractor.js';
import type { StyleBuilder } from '../../src/core/style/StyleBuilder.js';
import {
  createSequenceStyleDispatch,
  currentStyleBuilder,
  type SequenceStyleDispatch,
} from '../../src/diagrams/sequence/sequence-skin-param.js';

/** A hand-built sequence {@link UmlSource}: no style sources, no positions. */
export function sequenceSource(lines: readonly string[]): UmlSource {
  return { lines, type: 'sequence' };
}

/** The style dispatch a `ParseState` literal needs: default skin, nothing pending. */
export function emptySequenceStyleDispatch(): SequenceStyleDispatch {
  return createSequenceStyleDispatch(sequenceSource([]));
}

/** The default skin's builder, for AST literals built without a parse. */
export const DEFAULT_SEQUENCE_STYLE_BUILDER: StyleBuilder = currentStyleBuilder(emptySequenceStyleDispatch());
