/**
 * StripeStyle.test.ts — T10a: unit coverage for `StripeStyle`
 * (klimt/creole/StripeStyle.java): the constructor/getter surface, the
 * `getHeader` fallthrough for NORMAL/HEADING/HORIZONTAL_LINE/TREE (the
 * only branch reachable via any producer this port has today), and the
 * LIST_WITHOUT_NUMBER/LIST_WITH_NUMBER headers — real `Bullet`/
 * `createListNumber` atoms since cdd-T28, where they were cited seams.
 */
import { describe, expect, it } from 'vitest';
import { StripeStyle } from '../../../../../src/core/klimt/creole/StripeStyle.js';
import { StripeStyleType } from '../../../../../src/core/klimt/creole/StripeStyleType.js';
import { CreoleContext } from '../../../../../src/core/klimt/creole/CreoleContext.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

describe('StripeStyle — constructor + getters', () => {
  it('getType/getOrder/getStyle return the constructor values verbatim', () => {
    const s = new StripeStyle(StripeStyleType.HEADING, 2, '=');
    expect(s.getType()).toBe(StripeStyleType.HEADING);
    expect(s.getOrder()).toBe(2);
    expect(s.getStyle()).toBe('=');
  });
});

describe('StripeStyle.getHeader — non-list types return null (java: implicit fallthrough)', () => {
  it.each([StripeStyleType.NORMAL, StripeStyleType.HEADING, StripeStyleType.HORIZONTAL_LINE, StripeStyleType.TREE])(
    '%s returns null',
    (type) => {
      const s = new StripeStyle(type, 0, '-');
      expect(s.getHeader(FONT, new CreoleContext())).toBeNull();
    },
  );
});

describe('StripeStyle.getHeader — the two list headers (cdd-T28: real atoms, were seams)', () => {
  const bounder: StringBounder = {
    calculateDimension: (font, text) => new XDimension2D(text.length * font.size * 0.6, font.size),
  };

  it('LIST_WITHOUT_NUMBER builds a Bullet: a 12x5 box at depth 0 (Bullet.java:82-87)', () => {
    const s = new StripeStyle(StripeStyleType.LIST_WITHOUT_NUMBER, 0, '*');
    const header = s.getHeader(FONT, new CreoleContext());
    expect(header).not.toBeNull();
    const dim = header!.calculateDimension(bounder);
    expect(dim.getWidth()).toBe(12);
    expect(dim.getHeight()).toBe(5);
    expect(header!.getStartingAltitude(bounder)).toBe(-5);
  });

  it('a deeper Bullet is the 8+8*order box hanging -7 (Bullet.java:85-86,92)', () => {
    const header = new StripeStyle(StripeStyleType.LIST_WITHOUT_NUMBER, 2, '*').getHeader(FONT, new CreoleContext());
    expect(header!.calculateDimension(bounder).getWidth()).toBe(24);
    expect(header!.getStartingAltitude(bounder)).toBe(-7);
  });

  it('LIST_WITH_NUMBER builds the 1-based number + period (AtomTextUtils.java:158)', () => {
    const ctx = new CreoleContext();
    const s = new StripeStyle(StripeStyleType.LIST_WITH_NUMBER, 0, '#');
    // localNumber 0 -> "1.", localNumber 1 -> "2." -- two atoms, two widths
    // (the text is private, so the measured width is the observable).
    const first = s.getHeader(FONT, ctx)!;
    const second = s.getHeader(FONT, ctx)!;
    // "1." and "2." are both 2 characters, so widths match; the counter
    // advance is asserted directly below.
    expect(first.calculateDimension(bounder).getWidth()).toBeCloseTo(second.calculateDimension(bounder).getWidth(), 6);
    expect(ctx.getLocalNumber(0)).toBe(2);
  });

  it('LIST_WITH_NUMBER indents by "9. " per order level (AtomTextUtils.java:146-151)', () => {
    const ctx = new CreoleContext();
    const flat = new StripeStyle(StripeStyleType.LIST_WITH_NUMBER, 0, '#').getHeader(FONT, ctx)!;
    const nested = new StripeStyle(StripeStyleType.LIST_WITH_NUMBER, 1, '#').getHeader(FONT, ctx)!;
    const indent = bounder.calculateDimension({ family: FONT.family, size: FONT.size }, '9. ').getWidth();
    expect(nested.calculateDimension(bounder).getWidth() - flat.calculateDimension(bounder).getWidth()).toBeCloseTo(
      indent,
      6,
    );
  });

  it('advances the CreoleContext counter before building (java:64 evaluation order)', () => {
    const ctx = new CreoleContext();
    new StripeStyle(StripeStyleType.LIST_WITH_NUMBER, 3, '#').getHeader(FONT, ctx);
    expect(ctx.getLocalNumber(3)).toBe(1);
  });
});
