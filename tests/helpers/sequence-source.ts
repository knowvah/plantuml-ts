/**
 * Test-side seam for `parseSequence(source: UmlSource, …)` (sdd1 D3): a
 * hand-built source over bare interior lines, and the default-skin builder a
 * hand-built AST literal carries.
 */
import type { UmlSource } from '../../src/core/block-extractor.js';
import { HColorSet } from '../../src/core/klimt/color/HColorSet.js';
import type { StyleBuilder } from '../../src/core/style/StyleBuilder.js';
import type { LifelineSegment } from '../../src/diagrams/sequence/ast.js';
import {
  componentStyle,
  createSequenceStyleDispatch,
  currentStyleBuilder,
  paintOf,
  type SequencePaint,
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

/** The default skin's lifeline paint: `PARTICIPANT_LINE`'s merged style
 *  (`MutingLine.java:105-106`; `plantuml.skin:16,91-93,141-143`). */
export const DEFAULT_LIFELINE_PAINT: SequencePaint = paintOf(
  componentStyle(DEFAULT_SEQUENCE_STYLE_BUILDER, 'PARTICIPANT_LINE'),
  HColorSet.instance(),
);

/** The default skin's delay-line paint: `DELAY_LINE`'s merged style
 *  (`MutingLine.java:84`; `plantuml.skin:300-305`). */
export const DEFAULT_DELAY_LINE_PAINT: SequencePaint = paintOf(
  componentStyle(DEFAULT_SEQUENCE_STYLE_BUILDER, 'DELAY_LINE'),
  HColorSet.instance(),
);

/** One default-painted `PARTICIPANT_LINE` from `y1` to `y2` per participant:
 *  what layout builds for a hand-built geometry with no delay, create or
 *  destroy. */
export function wholeLifelines(ids: readonly string[], y1: number, y2: number): Record<string, LifelineSegment[]> {
  return Object.fromEntries(ids.map((id) => [id, [{ y1, y2, delay: false, paint: DEFAULT_LIFELINE_PAINT }]]));
}
