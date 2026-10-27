import { describe, expect, it } from 'vitest';
import { LookAround } from '../../../../src/core/ubrex/LookAround.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';

describe('LookAround (LookAround.java)', () => {
  const nav = (s: string): TextNavigator => TextNavigator.build(s);
  it('from() recognises each marker (:50-68)', () => {
    expect(LookAround.from(nav('$'))).toBe(LookAround.END_OF_TEXT);
    expect(LookAround.from(nav('=x'))).toBe(LookAround.LOOK_AHEAD_POSITIVE);
    expect(LookAround.from(nav('!x'))).toBe(LookAround.LOOK_AHEAD_NEGATIVE);
    expect(LookAround.from(nav('<=x'))).toBe(LookAround.LOOK_BEHIND_POSITIVE);
    expect(LookAround.from(nav('<!x'))).toBe(LookAround.LOOK_BEHIND_NEGATIVE);
    expect(LookAround.from('=x')).toBe(LookAround.LOOK_AHEAD_POSITIVE);
  });
  it('from() returns undefined otherwise; "<" alone is out of bounds (:68-69)', () => {
    expect(LookAround.from(nav('a'))).toBeUndefined();
    expect(LookAround.from(nav('<x'))).toBeUndefined();
    expect(() => LookAround.from(nav('<'))).toThrow(RangeError);
  });
  it('isLookBehind/isLookAhead (:71,80)', () => {
    expect(LookAround.LOOK_BEHIND_POSITIVE.isLookBehind()).toBe(true);
    expect(LookAround.LOOK_BEHIND_NEGATIVE.isLookBehind()).toBe(true);
    expect(LookAround.LOOK_AHEAD_POSITIVE.isLookBehind()).toBe(false);
    expect(LookAround.END_OF_TEXT.isLookBehind()).toBe(false);
    expect(LookAround.LOOK_AHEAD_POSITIVE.isLookAhead()).toBe(true);
    expect(LookAround.LOOK_AHEAD_NEGATIVE.isLookAhead()).toBe(true);
    expect(LookAround.LOOK_BEHIND_NEGATIVE.isLookAhead()).toBe(false);
    expect(LookAround.END_OF_TEXT.isLookAhead()).toBe(false);
  });
  it('getDefinitionSize is the marker length (:89)', () => {
    expect(LookAround.LOOK_AHEAD_POSITIVE.getDefinitionSize()).toBe(1);
    expect(LookAround.LOOK_AHEAD_NEGATIVE.getDefinitionSize()).toBe(1);
    expect(LookAround.LOOK_BEHIND_POSITIVE.getDefinitionSize()).toBe(2);
    expect(LookAround.LOOK_BEHIND_NEGATIVE.getDefinitionSize()).toBe(2);
    expect(LookAround.END_OF_TEXT.getDefinitionSize()).toBe(1);
    expect(LookAround.END_OF_TEXT.name()).toBe('END_OF_TEXT');
  });
});
