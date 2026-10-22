/**
 * sdd2 T3a, the half that needs the call sites wired: the event list reaching
 * `computeTotalWidth` (`layout.ts`) and the `!pragma sequenceMessageSpan`
 * flag reaching the participant row.
 *
 * Expected values are the jar's own `in.svg`: `cexeju-49-dumu881` (width 90),
 * `zetele-98-tafo132` (second lifeline at 226.587, `kozova-44-lore387`'s
 * sibling with a self message instead of a plain one).
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const measurer = new DeterministicMeasurer();

function parse(lines: readonly string[]): SequenceDiagramAST {
  return astOrThrow(parseSequence(sequenceSource(lines)), 'sequence');
}

const ZETELE = [
  'participant ParticipantNumber1',
  'participant ParticipantNumber2',
  'participant ParticipantNumber3',
  'ParticipantNumber1 -> ParticipantNumber1 : this is a very long message that is very long ',
  'ParticipantNumber2 -> ParticipantNumber3 : foo2',
];

describe('layoutSequence width terms', () => {
  it('sizes a lone self message to the jar: width 90 (cexeju-49)', () => {
    const geo = layoutSequence(parse(['Bob -> Bob : hello']), defaultTheme, measurer);
    expect(geo.totalWidth).toBeCloseTo(89.469, 3);
    expect(Math.trunc(geo.totalWidth + 1)).toBe(90);
  });
});

describe('!pragma sequenceMessageSpan true (AbstractCommunicationTile.java:52-54)', () => {
  const centreOfSecond = (lines: readonly string[]): number =>
    layoutSequence(parse(lines), defaultTheme, measurer).participants[1]!.centerX;

  it('parses to the flag', () => {
    expect(parse(['!pragma sequenceMessageSpan true', 'participant A']).options.sequenceMessageSpan).toBe(true);
    expect(parse(['!pragma SequenceMessageSpan on', 'participant A']).options.sequenceMessageSpan).toBe(true);
    expect(parse(['!pragma sequenceMessageSpan false', 'participant A']).options.sequenceMessageSpan).toBe(false);
    expect(parse(['!pragma teoz true', 'participant A']).options.sequenceMessageSpan).toBeUndefined();
  });

  it('drops the self message constraint: the second lifeline stays at 226.587 (zetele-98)', () => {
    expect(centreOfSecond(['!pragma sequenceMessageSpan true', ...ZETELE])).toBeCloseTo(226.587, 3);
  });

  it('keeps it without the pragma: 344.006, the jar value for the same diagram unspanned (botoku-28 shape)', () => {
    expect(centreOfSecond(ZETELE)).toBeCloseTo(344.006, 3);
  });
});
