import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { ComplementIntervals } from '../../../../src/diagrams/gantt/lang/ComplementIntervals.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementIntervals.java:54-104.
const complement = new ComplementIntervals();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementIntervals', () => {
  it.each([
    '2020-07-02 to 2020-07-05', // toRegexB, java:62-68
    '2020-07-02   to   2020-07-05',
    'd+1 to d+3', // toRegexE, java:72-79
    'D+1 to D+3',
  ])('accepts %s', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each([
    '2020-07-02',
    '2020-07-02 to',
    'to 2020-07-05',
    'd+1',
    'd+1 to 2020-07-05',
    'd1 to d3',
    '2020-07-02 until 2020-07-05',
  ])('rejects %s', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  // Words.uexactly(TO) is " to" (Words.java:84-91) and Words.uzeroOrMore(THE) wants "the" glued to it
  // (Words.java:67-74), so a spaced "to the" never matches: mirrored as-is (java:65,76).
  it.each(['2020-07-02 to the 2020-07-05', 'd+1 to the d+3'])('rejects %s (the THE word cannot follow " to ")', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('captures ECOUNT1 and ECOUNT2 for the relative form (java:74,79)', () => {
    const m = parse('d+4 to d+6');
    expect(m.findFirstValueByKey('ECOUNT1')).toBe('4');
    expect(m.findFirstValueByKey('ECOUNT2')).toBe('6');
  });

  it('getMe on two absolute days gives a DaysAsDates of both (java:83-89)', () => {
    const days = complement.getMe(newGantt(), parse('2020-07-02 to 2020-07-04')).get();
    expect(days.toString()).toBe('{ 2020-07-02 , 2020-07-04 }');
    expect([...days].map((d) => d.toString())).toEqual(['2020-07-02', '2020-07-03', '2020-07-04']);
  });

  it('getMe on d+N counts from the gantt min time point (java:91,96-104)', () => {
    const gantt = newGantt();
    gantt.updateStartingPoint(LocalDate.of(2020, 7, 1));
    const days = complement.getMe(gantt, parse('d+1 to d+3')).get();
    expect(days.toString()).toBe('{ 2020-07-02 , 2020-07-04 }');
  });

  // Integer.parseInt (java:97,100): a non-number or a value outside int is a NumberFormatException.
  it.each(['x', '', '99999999999', '-99999999999'])('getMe with ECOUNT1 %j is a NumberFormatException', (bad) => {
    const lookup = {
      findFirstValueByKey: (key: string): string | undefined =>
        key === 'ECOUNT1' ? bad : key === 'ECOUNT2' ? '1' : undefined,
      findValuesByKey: (): string[] => [],
    };
    expect(() => complement.getMe(newGantt(), lookup)).toThrow('NumberFormatException');
  });

  it('getMe with a missing ECOUNT2 is a NumberFormatException (java:100)', () => {
    const lookup = {
      findFirstValueByKey: (key: string): string | undefined => (key === 'ECOUNT1' ? '1' : undefined),
      findValuesByKey: (): string[] => [],
    };
    expect(() => complement.getMe(newGantt(), lookup)).toThrow('NumberFormatException');
  });

  it('getMe with neither form captured is the IllegalStateException of java:93', () => {
    const none = { findFirstValueByKey: (): undefined => undefined, findValuesByKey: (): string[] => [] };
    expect(() => complement.getMe(newGantt(), none)).toThrow('IllegalStateException');
  });
});
