/**
 * StripeStyle.test.ts — T10a: unit coverage for `StripeStyle`
 * (klimt/creole/StripeStyle.java): the constructor/getter surface, the
 * `getHeader` fallthrough for NORMAL/HEADING/HORIZONTAL_LINE/TREE (the
 * only branch reachable via any producer this port has today), and the
 * LIST_WITHOUT_NUMBER/LIST_WITH_NUMBER cited seams (ADR-8 corollary).
 */
import { describe, expect, it } from 'vitest';
import { StripeStyle } from '../../../../../src/core/klimt/creole/StripeStyle.js';
import { StripeStyleType } from '../../../../../src/core/klimt/creole/StripeStyleType.js';
import { CreoleContext } from '../../../../../src/core/klimt/creole/CreoleContext.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';

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

describe('StripeStyle.getHeader — list-header seams (ADR-8 corollary: throw, never silently wrong)', () => {
  it('LIST_WITHOUT_NUMBER throws, citing Bullet.java', () => {
    const s = new StripeStyle(StripeStyleType.LIST_WITHOUT_NUMBER, 0, '*');
    expect(() => s.getHeader(FONT, new CreoleContext())).toThrow(/Bullet\.java/);
  });

  it('LIST_WITH_NUMBER throws, citing AtomTextUtils.java', () => {
    const s = new StripeStyle(StripeStyleType.LIST_WITH_NUMBER, 0, '#');
    expect(() => s.getHeader(FONT, new CreoleContext())).toThrow(/AtomTextUtils\.java/);
  });

  it('LIST_WITH_NUMBER still advances the CreoleContext counter before throwing (java:64 evaluation order)', () => {
    const ctx = new CreoleContext();
    const s = new StripeStyle(StripeStyleType.LIST_WITH_NUMBER, 3, '#');
    expect(() => s.getHeader(FONT, ctx)).toThrow();
    // The order-3 counter was advanced by the throwing call above --
    // a second call at the same order observes 1, not 0.
    expect(ctx.getLocalNumber(3)).toBe(1);
  });
});
