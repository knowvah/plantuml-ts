import { describe, expect, it } from 'vitest';
import { Duration } from '../../../../src/core/time/Duration.js';
import type { CaptureLookup } from '../../../../src/core/ubrex/CaptureLookup.js';
import { ComplementDuration } from '../../../../src/diagrams/gantt/lang/ComplementDuration.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const lookup = (values: Record<string, string[]>): CaptureLookup => ({
  findFirstValueByKey: (key) => values[key]?.[0],
  findValuesByKey: (key) => values[key] ?? [],
});

const c = new ComplementDuration();
const ubrex = c.toUnicodeBracketedExpressionComplement();
const load = (text: string): Load => {
  const m = ubrex.match(text);
  expect(m.exactMatch()).toBe(true);
  return c.getMe(newGantt(), m).get();
};

// Expected values: lang/ComplementDuration.java (:54-127). A day is PT24H (GanttDiagramConfig.durationOfDays),
// daysInWeek() is 7 and daysInMonth() is 30 on a calendar with no closed day (GanttDiagram.java:366-372).
describe('ComplementDuration', () => {
  it.each([
    ['3 days', Duration.ofDays(3)],
    ['1 day', Duration.ofDays(1)],
    ['2 weeks', Duration.ofDays(14)],
    ['1 week and 2 days', Duration.ofDays(9)],
    ['1 week, 2 days', Duration.ofDays(9)],
    ['1 week ,2 days', Duration.ofDays(9)],
    ['2 hours', Duration.ofHours(2)],
    ['5 minutes', Duration.ofSeconds(300)],
    ['90 seconds', Duration.ofSeconds(90)],
    ['1 month', Duration.ofDays(30)],
    ['2 months and 1 day', Duration.ofDays(61)],
    ['1 day and 2 hours and 30 minutes and 10 seconds', Duration.ofSeconds(86400 + 7200 + 1800 + 10)],
  ])('%s -> the expected Load (java:77-94, 96-127)', (text, duration) => {
    expect(load(text).equals(Load.of(duration))).toBe(true);
  });

  it('captures the first element under CNUM0/CUNIT0 and the repeats under CNUM1/CUNIT1 (java:56-59, 77-85)', () => {
    const m = ubrex.match('1 week and 2 days and 3 hours');
    expect(m.findFirstValueByKey('CNUM0')).toBe('1');
    expect(m.findFirstValueByKey('CUNIT0')).toBe('week');
    expect(m.findValuesByKey('CNUM1')).toEqual(['2', '3']);
    expect(m.findValuesByKey('CUNIT1')).toEqual(['day', 'hour']); // the plural "s" is outside the CUNIT group (java:69-70);
  });

  it.each(['days', '3', '3 fortnights', '3 days and', 'and 3 days', '3days'])('rejects %s (java:56-75)', (text) => {
    expect(ubrex.match(text).exactMatch()).toBe(false);
  });

  it('unit letters are case-insensitive and "mi" selects minutes, other "m" months (java:98-125)', () => {
    const g = newGantt();
    const of = (num: string, unit: string): Load => c.getMe(g, lookup({ CNUM0: [num], CUNIT0: [unit] })).get();
    expect(of('2', 'H').equals(Load.of(Duration.ofHours(2)))).toBe(true);
    expect(of('2', 'D').equals(Load.of(Duration.ofDays(2)))).toBe(true);
    expect(of('1', 'W').equals(Load.of(Duration.ofDays(7)))).toBe(true);
    expect(of('4', 'S').equals(Load.of(Duration.ofSeconds(4)))).toBe(true);
    expect(of('2', 'MI').equals(Load.of(Duration.ofSeconds(120)))).toBe(true);
    expect(of('2', 'Mi').equals(Load.of(Duration.ofSeconds(120)))).toBe(true);
    expect(of('1', 'M').equals(Load.of(Duration.ofDays(30)))).toBe(true);
    expect(of('1', 'mo').equals(Load.of(Duration.ofDays(30)))).toBe(true);
  });

  it('an unknown unit is an IllegalArgumentException naming it (java:123-124)', () => {
    expect(() => c.getMe(newGantt(), lookup({ CNUM0: ['1'], CUNIT0: ['years'] }))).toThrow(
      'IllegalArgumentException: unknown time unit: years',
    );
  });

  it('a missing or non-integer number is a NumberFormatException; a missing unit a NullPointerException (java:97, 99)', () => {
    expect(() => c.getMe(newGantt(), lookup({ CUNIT0: ['days'] }))).toThrow('NumberFormatException');
    expect(() => c.getMe(newGantt(), lookup({ CNUM0: ['x'], CUNIT0: ['days'] }))).toThrow('NumberFormatException');
    expect(() => c.getMe(newGantt(), lookup({ CNUM0: ['1'] }))).toThrow('NullPointerException');
  });
});
