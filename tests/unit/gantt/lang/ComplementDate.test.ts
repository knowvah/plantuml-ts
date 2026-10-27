import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import type { CaptureLookup } from '../../../../src/core/ubrex/CaptureLookup.js';
import type { UBrexPart } from '../../../../src/core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { ComplementDate } from '../../../../src/diagrams/gantt/lang/ComplementDate.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const lookup = (values: Record<string, string[]>): CaptureLookup => ({
  findFirstValueByKey: (key) => values[key]?.[0],
  findValuesByKey: (key) => values[key] ?? [],
});

const START = LocalDate.of(2020, 7, 1);

function started(): GanttDiagram {
  const d = newGantt();
  d.updateStartingPoint(START);
  return d;
}

const accepts = (ubrex: UBrexPart, text: string): boolean => ubrex.match(text).exactMatch();
const resolve = (c: ComplementDate, text: string): string => {
  const m = c.toUnicodeBracketedExpressionComplement().match(text);
  expect(m.exactMatch()).toBe(true);
  return c.getMe(started(), m).get().toString();
};

const ABSOLUTE: [string, string][] = [
  ['2020-03-15', '2020-03-15'], // B: YYYY-MM-DD (TimeResolution.java B)
  ['2020/3/9', '2020-03-09'], // B: YYYY/M/D
  ['15 March 2020', '2020-03-15'], // A: D MONTH YYYY
  ['5 mar 2021', '2021-03-05'],
  ['dec 25, 2021', '2021-12-25'], // C: MONTH D, YYYY
  ['December 5 2021', '2021-12-05'],
];

// Expected values: lang/ComplementDate.java (:62-127); the absolute forms are DayPattern.java's.
describe('ComplementDate', () => {
  it.each(ABSOLUTE)('any() and onlyAbsolute() resolve %s to %s (java:62-72, 75-84, 105-108)', (text, iso) => {
    expect(resolve(ComplementDate.any(), text)).toBe(iso);
    expect(resolve(ComplementDate.onlyAbsolute(), text)).toBe(iso);
  });

  it.each([
    ['3 days after start', '2020-07-04'],
    ['1 day after start', '2020-07-02'],
    ['0 days after start', '2020-07-01'],
    // 「dD」+ is one of d/D followed by a literal "+" (java:99)
    ['d+5', '2020-07-06'],
    ['D+12', '2020-07-13'],
  ])('any() and onlyRelative() resolve %s to %s from the minimum day (java:109-127)', (text, iso) => {
    expect(resolve(ComplementDate.any(), text)).toBe(iso);
    expect(resolve(ComplementDate.onlyRelative(), text)).toBe(iso);
  });

  it('onlyAbsolute() rejects the relative forms (java:77)', () => {
    const u = ComplementDate.onlyAbsolute().toUnicodeBracketedExpressionComplement();
    expect(accepts(u, '3 days after start')).toBe(false);
    expect(accepts(u, 'd+5')).toBe(false);
  });

  it('onlyRelative() rejects the absolute forms (java:78-79)', () => {
    const u = ComplementDate.onlyRelative().toUnicodeBracketedExpressionComplement();
    for (const [text] of ABSOLUTE) expect(accepts(u, text)).toBe(false);
  });

  it('every variant rejects text that is no date (java:75-84)', () => {
    for (const c of [ComplementDate.any(), ComplementDate.onlyAbsolute(), ComplementDate.onlyRelative()]) {
      const u = c.toUnicodeBracketedExpressionComplement();
      expect(accepts(u, 'tomorrow')).toBe(false);
      expect(accepts(u, 'd5')).toBe(false);
      expect(accepts(u, '3 days before start')).toBe(false);
    }
  });

  it('getMe prefers the absolute day, then DCOUNT, then ECOUNT (java:105-115)', () => {
    const c = ComplementDate.any();
    const d = started();
    expect(
      c
        .getMe(d, lookup({ BDAY: ['2'], BMONTH: ['3'], BYEAR: ['2021'], DCOUNT: ['9'] }))
        .get()
        .toString(),
    ).toBe('2021-03-02');
    expect(
      c
        .getMe(d, lookup({ DCOUNT: ['2'], ECOUNT: ['9'] }))
        .get()
        .toString(),
    ).toBe('2020-07-03');
    expect(
      c
        .getMe(d, lookup({ ECOUNT: ['9'] }))
        .get()
        .toString(),
    ).toBe('2020-07-10');
  });

  it('getMe with none of the groups is an IllegalStateException (java:117)', () => {
    expect(() => ComplementDate.any().getMe(started(), lookup({}))).toThrow('IllegalStateException');
  });

  it('a non-integer DCOUNT / ECOUNT is a NumberFormatException (java:120, 125)', () => {
    expect(() => ComplementDate.any().getMe(started(), lookup({ DCOUNT: ['x'] }))).toThrow('NumberFormatException');
    expect(() => ComplementDate.any().getMe(started(), lookup({ ECOUNT: ['x'] }))).toThrow('NumberFormatException');
  });
});
