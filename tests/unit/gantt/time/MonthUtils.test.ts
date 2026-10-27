import { describe, expect, it } from 'vitest';
import { Month } from '../../../../src/core/time/Month.js';
import { UBrexPart } from '../../../../src/core/ubrex/builder/UBrexPart.js';
import { MonthUtils, fromString, getRegexString, getUbrex } from '../../../../src/diagrams/gantt/time/MonthUtils.js';

describe('MonthUtils', () => {
  it('getRegexString joins the 3-letter upper-case prefixes with [a-z]* (MonthUtils.java:47-57)', () => {
    expect(getRegexString()).toBe(
      'JAN[a-z]*|FEB[a-z]*|MAR[a-z]*|APR[a-z]*|MAY[a-z]*|JUN[a-z]*|JUL[a-z]*|AUG[a-z]*|SEP[a-z]*|OCT[a-z]*|NOV[a-z]*|DEC[a-z]*',
    );
  });

  it.each([
    ['jan', Month.JANUARY],
    ['January', Month.JANUARY],
    ['FEBRUARY', Month.FEBRUARY],
    ['mar', Month.MARCH],
    ['Apr', Month.APRIL],
    ['may', Month.MAY],
    ['JUNE', Month.JUNE],
    ['jul', Month.JULY],
    ['August', Month.AUGUST],
    ['sept', Month.SEPTEMBER],
    ['oct', Month.OCTOBER],
    ['Nov', Month.NOVEMBER],
    ['december', Month.DECEMBER],
  ])('fromString(%s) (MonthUtils.java:78-85)', (input, expected) => {
    expect(fromString(input)).toBe(expected);
  });

  it('fromString throws IllegalArgumentException on an unknown prefix (MonthUtils.java:85)', () => {
    expect(() => fromString('xyz')).toThrow('IllegalArgumentException');
  });

  it('fromString throws on fewer than 3 chars (String#substring(0,3))', () => {
    expect(() => fromString('ja')).toThrow('begin 0, end 3, length 2');
  });

  it('getUbrex is a UBrexPart matching any case of a month and its tail (MonthUtils.java:59-76)', () => {
    const part = getUbrex();
    expect(part).toBeInstanceOf(UBrexPart);
    expect(part.match('JaNuary rest').getAcceptedMatch()).toBe('JaNuary');
    expect(part.match('dec 2020').getAcceptedMatch()).toBe('dec');
    expect(part.match('Sep').getAcceptedMatch()).toBe('Sep');
  });

  it('getUbrex does not match a non-month', () => {
    expect(getUbrex().match('xyz').startMatch()).toBe(false);
  });

  it('the namespace object exposes the three members', () => {
    expect(MonthUtils.fromString('Mar')).toBe(Month.MARCH);
    expect(MonthUtils.getRegexString()).toBe(getRegexString());
    expect(MonthUtils.getUbrex).toBe(getUbrex);
  });
});
