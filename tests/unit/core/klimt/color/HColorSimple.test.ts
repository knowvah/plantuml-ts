/**
 * HColorSimple — the reachable slice of `klimt/color/HColorSimple.java`.
 * `toString` forms are the jar's own (a reflection probe printed
 * `Style.value(...).asColor(HColorSet.instance())` on 1.2026.8beta1:
 * `WITHDARK [r=24,g=24,b=24,a=255] α=255`, `[r=255,g=0,b=0,a=255] α=255`).
 */
import { describe, expect, it } from 'vitest';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';

const RED = HColorSimple.create({ r: 255, g: 0, b: 0, a: 255 });
const HALF = HColorSimple.create({ r: 255, g: 0, b: 0, a: 128 });
const CLEAR = HColorSimple.create({ r: 0, g: 0, b: 0, a: 0 });

describe('HColorSimple', () => {
  it('toString: XColor form, alpha, WITHDARK and transparent markers (HColorSimple.java:49-65)', () => {
    expect(RED.toString()).toBe('[r=255,g=0,b=0,a=255] α=255');
    expect(RED.withDark(CLEAR).toString()).toBe('WITHDARK [r=255,g=0,b=0,a=255] α=255');
    expect(CLEAR.toString()).toBe('[r=0,g=0,b=0,a=0] α=0 transparent');
  });

  it('asString: #RRGGBB opaque, #aarrggbb lowercase otherwise, `transparent` at alpha 0 (java:68-82)', () => {
    expect(RED.asString()).toBe('#FF0000');
    expect(HALF.asString()).toBe('#80ff0000');
    expect(CLEAR.asString()).toBe('transparent');
  });

  it('isTransparent is alpha 0 (java:131-134)', () => {
    expect(CLEAR.isTransparent()).toBe(true);
    expect(HALF.isTransparent()).toBe(false);
  });

  it('withDark pairs without mutating; darkSchemeTheme returns the dark partner or this (java:225-240)', () => {
    const paired = RED.withDark(HALF);
    expect(paired).not.toBe(RED);
    expect((paired as HColorSimple).darkSchemeTheme()).toBe(HALF);
    expect(RED.darkSchemeTheme()).toBe(RED);
    expect((paired as HColorSimple).getAwtColor()).toEqual({ r: 255, g: 0, b: 0, a: 255 });
  });

  it('equals compares the XColor only (java:84-90)', () => {
    expect(RED.equals(HColorSimple.create({ r: 255, g: 0, b: 0, a: 255 }).withDark(CLEAR))).toBe(true);
    expect(RED.equals(HALF)).toBe(false);
    expect(RED.equals({})).toBe(false);
  });

  it('asPaint (port-only): HColor.toSvg under ColorMapper.IDENTITY (HColor.java:74-80, XColor.java:111-125)', () => {
    expect(RED.asPaint()).toBe('#FF0000');
    expect(HALF.asPaint()).toBe('#FF000080');
    expect(CLEAR.asPaint()).toBe('#00000000');
    expect(RED.withDark(HALF) as HColorSimple).toBeInstanceOf(HColorSimple);
  });
});

describe('HColorSimple.distanceTo (HColorSimple.java:217-219)', () => {
  it('delegates to ColorUtils.distance on the wrapped colours', () => {
    const a = HColorSimple.create({ r: 10, g: 40, b: 90, a: 255 });
    const b = HColorSimple.create({ r: 20, g: 20, b: 60, a: 255 });
    expect(a.distanceTo(b)).toBe(18150);
    expect(RED.distanceTo(CLEAR)).toBe(255 * 299);
  });
});

describe('HColorSimple.opposite (HColorSimple.java:211-215)', () => {
  const rgb = (r: number, g: number, b: number): HColorSimple => HColorSimple.create({ r, g, b, a: 255 });
  const awt = (c: HColorSimple): unknown => c.opposite().getAwtColor();
  const WHITE = { r: 255, g: 255, b: 255, a: 255 };
  const BLACK = { r: 0, g: 0, b: 0, a: 255 };

  it('is white on black and black on white', () => {
    expect(awt(rgb(0, 0, 0))).toEqual(WHITE);
    expect(awt(rgb(255, 255, 255))).toEqual(BLACK);
  });

  it('thresholds 255 - grey > 127 strictly: grey 127 -> white, grey 128 -> black', () => {
    // Chocolate (210,105,30): grey = (62790 + 61635 + 3420) / 1000 = 127.
    expect(awt(rgb(210, 105, 30))).toEqual(WHITE);
    expect(awt(rgb(128, 128, 128))).toEqual(BLACK);
  });
});
