/**
 * Sheet.test.ts — T7: unit coverage for `Sheet` (klimt/creole/Sheet.java),
 * the ordered `Stripe` container `SheetBlock1` wraps.
 */
import { describe, expect, it } from 'vitest';
import { Sheet } from '../../../../../src/core/klimt/creole/Sheet.js';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { Stripe } from '../../../../../src/core/klimt/creole/Stripe.js';

function stripe(label: string): Stripe {
  return {
    getLHeader: () => null,
    getAtoms: () => [],
    toString: () => label,
  } as unknown as Stripe;
}

describe('Sheet', () => {
  it('starts empty and reports the constructor alignment', () => {
    const sheet = new Sheet(HorizontalAlignment.CENTER);
    expect(sheet.getHorizontalAlignment()).toBe(HorizontalAlignment.CENTER);
    expect(sheet.getLastStripe()).toBeNull();
    expect([...sheet]).toEqual([]);
  });

  it('add(Stripe) appends one stripe, iterable in insertion order', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    const a = stripe('a');
    const b = stripe('b');
    sheet.add(a);
    sheet.add(b);
    expect([...sheet]).toEqual([a, b]);
    expect(sheet.getLastStripe()).toBe(b);
  });

  it('add(Stripe[]) appends each element in order (Java add(List<Stripe>))', () => {
    const sheet = new Sheet(HorizontalAlignment.RIGHT);
    const a = stripe('a');
    const b = stripe('b');
    const c = stripe('c');
    sheet.add(a);
    sheet.add([b, c]);
    expect([...sheet]).toEqual([a, b, c]);
    expect(sheet.getLastStripe()).toBe(c);
  });

  it('iterator() returns the same sequence as [Symbol.iterator]', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    const a = stripe('a');
    sheet.add(a);
    expect([...sheet.iterator()]).toEqual([a]);
  });

  it('toString joins stripe string representations', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripe('x'));
    sheet.add(stripe('y'));
    expect(sheet.toString()).toBe('[x, y]');
  });
});
