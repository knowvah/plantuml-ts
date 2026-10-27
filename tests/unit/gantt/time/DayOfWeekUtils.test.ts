import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { UBrexPart } from '../../../../src/core/ubrex/builder/UBrexPart.js';
import {
  DayOfWeekUtils,
  fromString,
  getRegexString,
  getUbrex,
} from '../../../../src/diagrams/gantt/time/DayOfWeekUtils.js';

describe('DayOfWeekUtils', () => {
  it('getRegexString (DayOfWeekUtils.java:47-57)', () => {
    expect(getRegexString()).toBe('MON[a-z]*|TUE[a-z]*|WED[a-z]*|THU[a-z]*|FRI[a-z]*|SAT[a-z]*|SUN[a-z]*');
  });

  it.each([
    ['mon', DayOfWeek.MONDAY],
    ['Monday', DayOfWeek.MONDAY],
    ['TUE', DayOfWeek.TUESDAY],
    ['tuesday', DayOfWeek.TUESDAY],
    ['Wed', DayOfWeek.WEDNESDAY],
    ['WEDNESDAY', DayOfWeek.WEDNESDAY],
    ['thu', DayOfWeek.THURSDAY],
    ['Thursday', DayOfWeek.THURSDAY],
    ['FRI', DayOfWeek.FRIDAY],
    ['friday', DayOfWeek.FRIDAY],
    ['Sat', DayOfWeek.SATURDAY],
    ['SATURDAY', DayOfWeek.SATURDAY],
    ['sun', DayOfWeek.SUNDAY],
    ['Sunday', DayOfWeek.SUNDAY],
  ])('fromString(%s) (DayOfWeekUtils.java:78-86)', (input, expected) => {
    expect(fromString(input)).toBe(expected);
  });

  it('fromString throws IllegalArgumentException on an unknown prefix (DayOfWeekUtils.java:86)', () => {
    expect(() => fromString('xyz')).toThrow('IllegalArgumentException');
  });

  it('fromString throws on fewer than 3 chars (String#substring(0,3))', () => {
    expect(() => fromString('mo')).toThrow('begin 0, end 3, length 2');
  });

  it('getUbrex is a UBrexPart matching any case of a day and its tail (DayOfWeekUtils.java:59-76)', () => {
    const part = getUbrex();
    expect(part).toBeInstanceOf(UBrexPart);
    expect(part.match('mOnday x').getAcceptedMatch()).toBe('mOnday');
    expect(part.match('sun').getAcceptedMatch()).toBe('sun');
    expect(part.match('xyz').startMatch()).toBe(false);
  });

  it('the namespace object exposes the three members', () => {
    expect(DayOfWeekUtils.fromString('Fri')).toBe(DayOfWeek.FRIDAY);
    expect(DayOfWeekUtils.getRegexString()).toBe(getRegexString());
    expect(DayOfWeekUtils.getUbrex).toBe(getUbrex);
  });
});
