import { describe, expect, it } from 'vitest';
import { HColors } from '../../../../../src/core/klimt/color/HColors.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';

describe('HColors (HColors.java)', () => {
  it('BLACK and WHITE come from HColorSet.instance().getColorOrWhite (java:84-87), once', () => {
    expect(HColors.BLACK.toString()).toBe('[r=0,g=0,b=0,a=255] α=255');
    expect(HColors.WHITE.toString()).toBe('[r=255,g=255,b=255,a=255] α=255');
    expect(HColors.BLACK).toBe(HColors.BLACK);
  });

  it('transparent() and none() are the same alpha-0 HColorSimple (java:123-135)', () => {
    expect(HColors.transparent()).toBe(HColors.none());
    expect(HColors.none().isTransparent()).toBe(true);
    expect(HColors.none().toString()).toBe('[r=0,g=0,b=0,a=0] α=0 transparent');
  });

  it('simple wraps an XColor (java:178-180)', () => {
    const c = HColors.simple({ r: 1, g: 2, b: 3, a: 255 });
    expect(c).toBeInstanceOf(HColorSimple);
    expect(c.asString()).toBe('#010203');
  });
});
