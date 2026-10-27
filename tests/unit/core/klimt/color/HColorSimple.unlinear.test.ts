import { describe, expect, it } from 'vitest';
import { HColors } from '../../../../../src/core/klimt/color/HColors.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';
import { HColorGradient } from '../../../../../src/core/klimt/color/HColorGradient.js';
import { parseSimpleColor } from '../../../../../src/core/klimt/color/HColorSet.js';

function simple(hex: string): HColorSimple {
  const c = parseSimpleColor('#' + hex);
  if (c === undefined) throw new Error(hex);
  return HColorSimple.create(c);
}

/**
 * PROVENANCE: expected values come from a scratch Java program (JDK
 * java.awt.Color, HSLColor.java fromRGB/toRGB and HColorSimple.java:178-206
 * copied verbatim, float32 throughout) run on 2026-10-26; columns are
 * from, to, completionInt, resulting RGB. The HSL round trip is lossy:
 * 33AA77 -> AA3377 at 100 is #AA3377 only after rounding (JDK: 170,51,119).
 */
const JDK_ROWS: readonly (readonly [string, string, number, string])[] = [
  ['FF0000', '0000FF', 0, '#FF0000'],
  ['FF0000', '0000FF', 1, '#FF0000'],
  ['FF0000', '0000FF', 25, '#FF1000'],
  ['FF0000', '0000FF', 50, '#FF8000'],
  ['FF0000', '0000FF', 99, '#001EFF'],
  ['FF0000', '0000FF', 100, '#0000FF'],
  ['FF0000', '0000FF', 150, '#0000FF'],
  ['FFFFFF', '000000', 0, '#FFFFFF'],
  ['FFFFFF', '000000', 1, '#FFFFFF'],
  ['FFFFFF', '000000', 25, '#FBFBFB'],
  ['FFFFFF', '000000', 50, '#DFDFDF'],
  ['FFFFFF', '000000', 99, '#080808'],
  ['FFFFFF', '000000', 100, '#000000'],
  ['FFFFFF', '000000', 150, '#000000'],
  ['33AA77', 'AA3377', 0, '#33AA77'],
  ['33AA77', 'AA3377', 1, '#33AA77'],
  ['33AA77', 'AA3377', 25, '#33AA7C'],
  ['33AA77', 'AA3377', 50, '#33AAA1'],
  ['33AA77', 'AA3377', 99, '#AA3381'],
  ['33AA77', 'AA3377', 100, '#AA3377'],
  ['33AA77', 'AA3377', 150, '#AA3377'],
  ['808080', 'FFE0B0', 0, '#808080'],
  ['808080', 'FFE0B0', 1, '#808080'],
  ['808080', 'FFE0B0', 25, '#837F7F'],
  ['808080', 'FFE0B0', 50, '#997F7C'],
  ['808080', 'FFE0B0', 99, '#FEDCAC'],
  ['808080', 'FFE0B0', 100, '#FFE0B0'],
  ['808080', 'FFE0B0', 150, '#FFE0B0'],
];

describe('HColorSimple.unlinear (HColorSimple.java:178-206)', () => {
  it.each(JDK_ROWS)('%s -> %s at %i is %s (JDK-exact)', (from, to, completion, expected) => {
    const result = HColorSimple.unlinear(simple(from), simple(to), completion);
    expect(result.asString()).toBe(expected);
    expect(result.getAwtColor().a).toBe(255);
  });
});

describe('HColors.unlinear (HColors.java:156-167)', () => {
  const red = simple('FF0000');
  const blue = simple('0000FF');

  it('0 returns color1 itself, 100 returns color2 itself', () => {
    expect(HColors.unlinear(red, blue, 0)).toBe(red);
    expect(HColors.unlinear(red, blue, 100)).toBe(blue);
  });

  it('two simple colours go through HColorSimple.unlinear', () => {
    expect((HColors.unlinear(red, blue, 50) as HColorSimple).asString()).toBe('#FF8000');
  });

  it('a gradient or missing operand returns color1', () => {
    const grad = HColors.gradient(red, blue, '|');
    expect(HColors.unlinear(grad, blue, 50)).toBe(grad);
    expect(HColors.unlinear(red, grad, 50)).toBe(red);
    expect(HColors.unlinear(undefined, blue, 50)).toBeUndefined();
    expect(grad).toBeInstanceOf(HColorGradient);
  });
});
