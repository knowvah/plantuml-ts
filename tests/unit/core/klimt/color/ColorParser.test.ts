import { describe, expect, it } from 'vitest';

import { ColorType } from '../../../../../src/core/abel/ColorType.js';
import { Colors } from '../../../../../src/core/abel/Colors.js';
import { LinkStyle } from '../../../../../src/core/decoration/LinkStyle.js';
import { COLORS_REGEXP, ColorParser } from '../../../../../src/core/klimt/color/ColorParser.js';
import { HColorSet } from '../../../../../src/core/klimt/color/HColorSet.js';
import { NoSuchColorException } from '../../../../../src/core/klimt/color/NoSuchColorException.js';

const SET = HColorSet.instance();
const BLUE = SET.getColor('blue');
const RED = SET.getColor('red');

describe('ColorParser regex', () => {
  const re = new RegExp(`^(${COLORS_REGEXP})$`, 'i');

  it.each(['#blue', '#back:blue;line:red', '#line.dashed;', '#blue;text:red'])('accepts %s', (s) => {
    expect(re.test(s)).toBe(true);
  });

  it('rejects a bare word without #', () => {
    expect(re.test('blue')).toBe(false);
  });

  it('simpleColor wraps the alternation in one optional capture group', () => {
    const p = ColorParser.simpleColor(ColorType.LINE);
    expect(p.regexSource).toBe(`(${COLORS_REGEXP})?`);
    expect(p.getName()).toBe('COLOR');
    expect(ColorParser.simpleColor(ColorType.LINE, 'X').getName()).toBe('X');
    expect(ColorParser.mandatoryColor(ColorType.BACK).regexSource).toBe(`(${COLORS_REGEXP})`);
    expect(ColorParser.simpleColorWithPrefix('to', ColorType.BACK).regexSource).toBe(`(?:to (${COLORS_REGEXP}))?`);
  });
});

describe('ColorParser.getColor / Colors.parse', () => {
  it('returns Colors.empty() for an absent capture', () => {
    expect(ColorParser.simpleColor(ColorType.LINE).getColor(undefined, SET).isEmpty()).toBe(true);
  });

  it('puts a bare token under the main type', () => {
    const c = ColorParser.simpleColor(ColorType.LINE).getColor('#blue', SET);
    expect(c.getColor(ColorType.LINE)).toEqual(BLUE);
    expect(c.getColor(ColorType.BACK)).toBeUndefined();
  });

  it('keys name:value parts by ColorType and reads line styles', () => {
    const c = Colors.parse('#back:blue;line:red;line.dashed;shadowing:true', SET, ColorType.LINE);
    expect(c.getColor(ColorType.BACK)).toEqual(BLUE);
    expect(c.getColor(ColorType.LINE)).toEqual(RED);
    expect(c.getLineStyle()).toEqual(LinkStyle.DASHED());
    expect(c.getShadowing()).toBe(true);
  });

  it('reads dotted and bold, and shadowing false', () => {
    expect(Colors.parse('#line.dotted;', SET, ColorType.LINE).getLineStyle()).toEqual(LinkStyle.DOTTED());
    expect(Colors.parse('#line.bold;', SET, ColorType.LINE).getLineStyle()).toEqual(LinkStyle.BOLD());
    expect(Colors.parse('#shadowing:false', SET, ColorType.LINE).getShadowing()).toBe(false);
  });

  it('throws NoSuchColorException for an unknown bare colour', () => {
    expect(() => Colors.parse('#nosuchcolourzz', SET, ColorType.LINE)).toThrow(NoSuchColorException);
  });

  it('stores a null for an unknown name:value colour (getColorOrNull)', () => {
    const c = Colors.parse('#back:nosuchcolourzz', SET, ColorType.LINE);
    expect(c.isEmpty()).toBe(false);
    expect(c.getColor(ColorType.BACK)).toBeUndefined();
  });
});
