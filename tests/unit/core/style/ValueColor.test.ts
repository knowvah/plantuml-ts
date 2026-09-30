/** ValueColor — an already-resolved colour value (`style/ValueColor.java`). */
import { describe, expect, it } from 'vitest';
import { ValueColor } from '../../../../src/core/style/ValueColor.js';
import { TestHColor, TestHColorSet } from './helpers/hcolor-set.js';

describe('ValueColor', () => {
  const color = new TestHColor({ r: 1, g: 2, b: 3, a: 255 });
  const v = new ValueColor(color, 11);

  it('asColor returns the stored colour without consulting the set (ValueColor.java:56-59)', () => {
    const set = new TestHColorSet();
    expect(v.asColor(set)).toBe(color);
    expect(set.requested).toEqual([]);
  });

  it('toString is the colour toString (ValueColor.java:46-49)', () => {
    expect(new ValueColor({ withDark: () => color, toString: () => 'HColor#010203' }, 1).toString()).toBe(
      'HColor#010203',
    );
  });

  it('getPriority returns the constructor priority (java:61-64)', () => {
    expect(v.getPriority()).toBe(11);
  });

  it('every other accessor is ValueAbstract UnsupportedOperationException (ValueAbstract.java:45-84)', () => {
    expect(() => v.asString()).toThrow('UnsupportedOperationException: Class=ValueColor');
    expect(() => v.asInt()).toThrow('UnsupportedOperationException');
    expect(() => v.asIntButMinusOneIfError()).toThrow('UnsupportedOperationException');
    expect(() => v.asDouble()).toThrow('UnsupportedOperationException');
    expect(() => v.asDoubleDefaultTo(1)).toThrow('UnsupportedOperationException');
    expect(() => v.asBoolean()).toThrow('UnsupportedOperationException');
    expect(() => v.asFontFace()).toThrow('UnsupportedOperationException');
    expect(() => v.asHorizontalAlignment()).toThrow('UnsupportedOperationException');
  });
});
