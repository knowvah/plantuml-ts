/**
 * HColorGradient (HColorGradient.java:43-112) and the gradient arm of
 * `HColorSet#parseColor` (HColorSet.java:109-117).
 */
import { describe, expect, it } from 'vitest';
import { HColorGradient } from '../../../../../src/core/klimt/color/HColorGradient.js';
import { HColorSet } from '../../../../../src/core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';
import { HColors } from '../../../../../src/core/klimt/color/HColors.js';

const set = HColorSet.instance();

function gradientOf(s: string): HColorGradient {
  const c = set.getColorOrWhite(s);
  if (!(c instanceof HColorGradient)) throw new Error(`not a gradient: ${s}`);
  return c;
}

describe('HColorSet#parseColor gradient arm (HColorSet.java:109-117)', () => {
  it('#cc33cc-#0c33ac is an HColorGradient with policy "-" and both halves simple', () => {
    const g = gradientOf('#cc33cc-#0c33ac');
    expect(g.getPolicy()).toBe('-');
    expect(g.getColor1()).toBeInstanceOf(HColorSimple);
    expect(g.getColor1().asString()).toBe('#CC33CC');
    expect(g.getColor2().asString()).toBe('#0C33AC');
  });

  it.each([
    ['red|blue', '|'],
    ['red/blue', '/'],
    ['red\\blue', '\\'],
    ['#F18E3E-#EC7211', '-'],
  ])('%s splits on policy %s', (s, policy) => {
    expect(gradientOf(s).getPolicy()).toBe(policy);
  });

  it('three colours never split: each separator leaves one half unparsable (java:112-114)', () => {
    expect(set.getColorOrNull('#red-blue-green')).toBeUndefined();
  });

  it('a separator with an unparsable half is not a gradient (null -> WHITE)', () => {
    expect(set.getColorOrNull('red-nosuch')).toBeUndefined();
    expect(set.getColorOrWhite('red-nosuch')).toBe(HColors.WHITE);
  });
});

describe('HColorGradient (HColorGradient.java:43-112)', () => {
  const red = HColors.simple({ r: 255, g: 0, b: 0, a: 255 });
  const blue = HColors.simple({ r: 0, g: 0, b: 255, a: 255 });
  const green = HColors.simple({ r: 0, g: 128, b: 0, a: 255 });

  it('constructor unwraps a gradient half to its color1 / color2 (java:49-59)', () => {
    const inner = new HColorGradient(red, blue, '|');
    const g = new HColorGradient(inner, new HColorGradient(green, blue, '-'), '/');
    expect(g.getColor1()).toBe(red);
    expect(g.getColor2()).toBe(blue);
    expect(g.getPolicy()).toBe('/');
  });

  it('getColor interpolates each channel with (int) truncation (java:69-90)', () => {
    const g = new HColorGradient(red, blue, '-');
    expect(g.getColor(0.5, 200)).toEqual({ r: 128, g: 0, b: 127, a: 200 });
    expect(g.getColor(0, 255)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(g.getColor(1, 255)).toEqual({ r: 0, g: 0, b: 255, a: 255 });
  });

  it('getColor rejects a coefficient outside [0, 1] (java:70-71)', () => {
    const g = new HColorGradient(red, blue, '-');
    expect(() => g.getColor(1.5, 255)).toThrow('IllegalArgumentException: c=1.5');
    expect(() => g.getColor(-0.1, 255)).toThrow('IllegalArgumentException: c=-0.1');
  });

  it('toColor is color1 (java:102-105)', () => {
    expect(new HColorGradient(green, blue, '|').toColor()).toEqual({ r: 0, g: 128, b: 0, a: 255 });
  });

  it('withDark throws, the inherited HColor default (HColor.java:125-127)', () => {
    expect(() => new HColorGradient(red, blue, '|').withDark(blue)).toThrow('UnsupportedOperationException');
  });

  it('asPaint carries toRGB of each half: uppercase #RRGGBB, alpha dropped (HColor.java:69-72)', () => {
    expect(gradientOf('#cc33cc-#0c33ac').asPaint()).toEqual({ color1: '#CC33CC', color2: '#0C33AC', policy: '-' });
    expect(gradientOf('#11223344|blue').asPaint()).toEqual({ color1: '#112233', color2: '#0000FF', policy: '|' });
  });
});
