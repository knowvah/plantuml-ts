import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import type { CaptureLookup } from '../../../../src/core/ubrex/CaptureLookup.js';
import { ComplementDayOfWeek } from '../../../../src/diagrams/gantt/lang/ComplementDayOfWeek.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const lookup = (values: Record<string, string[]>): CaptureLookup => ({
  findFirstValueByKey: (key) => values[key]?.[0],
  findValuesByKey: (key) => values[key] ?? [],
});

// Expected values: lang/ComplementDayOfWeek.java (:50-59); DayOfWeekUtils.java:78-86.
describe('ComplementDayOfWeek', () => {
  const c = new ComplementDayOfWeek();

  it('captures a day name as COMPLEMENT (java:52)', () => {
    const m = c.toUnicodeBracketedExpressionComplement().match('monday');
    expect(m.exactMatch()).toBe(true);
    expect(m.findFirstValueByKey('COMPLEMENT')).toBe('monday');
  });

  it('rejects a non-day word (java:52)', () => {
    expect(c.toUnicodeBracketedExpressionComplement().match('someday').exactMatch()).toBe(false);
  });

  it.each([
    ['monday', DayOfWeek.MONDAY],
    ['Tue', DayOfWeek.TUESDAY],
    ['SATURDAY', DayOfWeek.SATURDAY],
    ['sunday', DayOfWeek.SUNDAY],
  ])('getMe maps %s to its DayOfWeek (java:56-59)', (text, day) => {
    expect(c.getMe(newGantt(), lookup({ COMPLEMENT: [text] })).get()).toBe(day);
  });

  it('an unknown name is an IllegalArgumentException (DayOfWeekUtils.java:85)', () => {
    expect(() => c.getMe(newGantt(), lookup({ COMPLEMENT: ['xyz'] }))).toThrow('IllegalArgumentException');
  });
});
