import { describe, expect, it } from 'vitest';

import { Colors } from '../../../../src/core/abel/Colors.js';
import { ColorType, getType } from '../../../../src/core/abel/ColorType.js';
import { LinkStyle } from '../../../../src/core/decoration/LinkStyle.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';
import { SingleStrategy, computeBranch } from '../../../../src/core/abel/SingleStrategy.js';

const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };

/** Behavior tests from klimt/color/Colors.java (consumed slice). */
describe('Colors', () => {
  it('empty() is empty and add() is copy-on-write', () => {
    const empty = Colors.empty();
    expect(empty.isEmpty()).toBe(true);

    const withBack = empty.add(ColorType.BACK, RED);
    expect(withBack).not.toBe(empty);
    expect(empty.isEmpty()).toBe(true);
    expect(withBack.isEmpty()).toBe(false);
    expect(withBack.getColor(ColorType.BACK)).toBe(RED);
    expect(withBack.getColor(ColorType.LINE)).toBeUndefined();
  });

  it('add() with an undefined color is a no-op returning this', () => {
    const c = Colors.empty();
    expect(c.add(ColorType.BACK, undefined)).toBe(c);
  });

  it('getColor(key1, key2) falls back to key2', () => {
    const c = Colors.empty().add(ColorType.LINE, BLUE);
    expect(c.getColor(ColorType.BACK, ColorType.LINE)).toBe(BLUE);
    expect(c.getColor(ColorType.LINE, ColorType.BACK)).toBe(BLUE);
    const both = c.add(ColorType.BACK, RED);
    expect(both.getColor(ColorType.BACK, ColorType.LINE)).toBe(RED);
  });

  it('mergeWith overlays the other map and lineStyle; undefined returns this', () => {
    const base = Colors.empty().add(ColorType.BACK, RED);
    expect(base.mergeWith(undefined)).toBe(base);

    const other = Colors.empty().add(ColorType.BACK, BLUE).addLegacyStroke('BOLD');
    const merged = base.mergeWith(other);
    expect(merged.getColor(ColorType.BACK)).toBe(BLUE);
    expect(merged.getLineStyle()?.toString()).toBe(LinkStyle.BOLD().toString());
    // originals untouched
    expect(base.getColor(ColorType.BACK)).toBe(RED);
    expect(base.getLineStyle()).toBeUndefined();
  });

  it('addLegacyStroke parses via LinkStyle.fromString1 (upper-cased)', () => {
    const dashed = Colors.empty().addLegacyStroke('dashed');
    expect(dashed.getLineStyle()?.toString()).toBe(LinkStyle.DASHED().toString());
  });

  it('muteStroke returns the input when no lineStyle, else delegates', () => {
    const stroke = UStroke.simple();
    expect(Colors.empty().muteStroke(stroke)).toBe(stroke);

    const bold = Colors.empty().addLegacyStroke('BOLD');
    const muted = bold.muteStroke(stroke);
    expect(muted).not.toBe(stroke);
  });

  it('getShadowing defaults to undefined (Java three-state null)', () => {
    expect(Colors.empty().getShadowing()).toBeUndefined();
  });
});

describe('ColorType', () => {
  it('getType strips from the first dot and upper-cases', () => {
    expect(getType('back')).toBe(ColorType.BACK);
    expect(getType('line.dotted')).toBe(ColorType.LINE);
    expect(getType('ARROW')).toBe(ColorType.ARROW);
  });

  it('getType throws on unknown names', () => {
    expect(() => getType('bogus')).toThrow('IllegalArgumentException');
  });
});

describe('SingleStrategy', () => {
  it('exposes the three upstream values', () => {
    expect(Object.keys(SingleStrategy)).toEqual(['SQUARE', 'HLINE', 'VLINE']);
  });

  it('computeBranch is ceil(sqrt) via the upstream int expression', () => {
    expect(computeBranch(1)).toBe(1);
    expect(computeBranch(4)).toBe(2);
    expect(computeBranch(5)).toBe(3);
    expect(computeBranch(9)).toBe(3);
    expect(computeBranch(10)).toBe(4);
  });
});
