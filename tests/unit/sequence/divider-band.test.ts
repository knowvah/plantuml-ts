/**
 * sdd2 T5g: the divider / newpage band and the divider's width terms.
 *
 * Expected values are Java arithmetic quoted at each assertion.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { DividerGeo, NewpageGeo, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { DIVIDER_WIDTH_ALLOWANCE, dividerPreferredHeight } from '../../../src/diagrams/sequence/divider-style.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { LEFT_MARGIN } from '../../../src/diagrams/sequence/sequence-layout-participants.js';
import { RIGHT_MARGIN } from '../../../src/diagrams/sequence/sequence-layout-width.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const measurer = new DeterministicMeasurer();
/** `ComponentRoseDivider.java:129-131` `getTextHeight + 20`, text height 0 + 4 + 4. */
const EMPTY_DIVIDER_HEIGHT = 28;
/** `AbstractTextualComponent.java:106-108`: no text, just the 4 + 4 padding. */
const EMPTY_TEXT_WIDTH = 8;

function layoutOf(lines: readonly string[]): ReturnType<typeof layoutSequence> {
  const ast: SequenceDiagramAST = astOrThrow(parseSequence(sequenceSource(lines)), 'sequence');
  return layoutSequence(ast, defaultTheme, measurer);
}

function dividers(lines: readonly string[]): { geos: DividerGeo[]; width: number } {
  const g = layoutOf(lines);
  return { geos: g.events.filter((e): e is DividerGeo => e.kind === 'divider'), width: g.totalWidth };
}

describe('divider and newpage band (DividerTile.java:92-95, NewpageTile.java:97-99)', () => {
  it('starts at the playing-space min (the left margin) even with a left overhang', () => {
    // PlayingSpace.java:318-320 border1 = min; the body is translated by -min.
    const { geos, width } = dividers(['participant A', 'note left of A : overhang', '== sep ==']);
    expect(geos[0]!.bandX).toBe(LEFT_MARGIN);
    expect(geos[0]!.bandWidth).toBe(width - LEFT_MARGIN - RIGHT_MARGIN);
  });

  it('gives a newpage the same band', () => {
    const g = layoutOf(['participant A', 'note left of A : overhang', 'newpage']);
    const n = g.events.find((e): e is NewpageGeo => e.kind === 'newpage')!;
    expect(n.bandX).toBe(LEFT_MARGIN);
    expect(n.bandWidth).toBe(g.totalWidth - LEFT_MARGIN - RIGHT_MARGIN);
  });
});

describe('divider width terms', () => {
  it('maxes xorigin + preferredWidth into the document (DividerTile.java:115-118)', () => {
    const long = 'a very long divider label that is wider than the single participant row';
    const { geos, width } = dividers(['participant A', `== ${long} ==`]);
    const g = geos[0]!;
    expect(width).toBe(LEFT_MARGIN + g.textWidth + DIVIDER_WIDTH_ALLOWANCE + RIGHT_MARGIN);
  });

  it('measures an empty divider as no text line (AbstractTextualComponent.java:86-87)', () => {
    const { geos } = dividers(['A -> B : x', '====']);
    expect(geos[0]!.textHeight).toBe(EMPTY_TEXT_WIDTH);
    expect(geos[0]!.textWidth).toBe(EMPTY_TEXT_WIDTH);
    expect(geos[0]!.height).toBe(EMPTY_DIVIDER_HEIGHT);
    expect(geos[0]!.height).toBe(dividerPreferredHeight(0));
  });
});
