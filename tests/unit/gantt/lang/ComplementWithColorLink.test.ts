import { describe, expect, it } from 'vitest';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { ComplementWithColorLink } from '../../../../src/diagrams/gantt/lang/ComplementWithColorLink.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementWithColorLink.java:51-74.
const complement = new ComplementWithColorLink();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);
const hex = (c: unknown): string => (c as HColorSimple).asString();

describe('ComplementWithColorLink', () => {
  it.each([
    'with #FF0000 link',
    'with dotted #FF0000 link',
    'with #FF0000 bold link',
    'with  dashed  #00FF00  dashed  link',
  ])('accepts %s (java:61-66)', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each(['with link', 'with #FF0000', 'with wavy #FF0000 link', '#FF0000 link'])('rejects %s (java:61-66)', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('colour is both centre and border; no style gives undefined (java:72)', () => {
    const c = complement.getMe(newGantt(), parse('with #FF0000 link')).get();
    expect(hex(c.getCenter())).toBe('#FF0000');
    expect(c.getStyle()).toBeUndefined();
  });

  it('STYLE before the colour is captured (java:52-56, 71)', () => {
    expect(complement.getMe(newGantt(), parse('with dotted #FF0000 link')).get().getStyle()).toBe('dotted');
  });

  it('STYLE after the colour is captured (java:52-56, 64)', () => {
    expect(complement.getMe(newGantt(), parse('with #FF0000 bold link')).get().getStyle()).toBe('bold');
  });

  it('an absent COLOR gives a null centre (java:71-72)', () => {
    const none = { findFirstValueByKey: (): undefined => undefined, findValuesByKey: (): string[] => [] };
    const c = complement.getMe(newGantt(), none).get();
    expect(c.getCenter()).toBeUndefined();
    expect(c.getStyle()).toBeUndefined();
  });
});
