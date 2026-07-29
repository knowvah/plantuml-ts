/**
 * LineBreakStrategy.test.ts — T7: unit coverage for `LineBreakStrategy`
 * (klimt/LineBreakStrategy.java), the wrap-width skinparam value wrapper.
 */
import { describe, expect, it } from 'vitest';
import { LineBreakStrategy } from '../../../../src/core/klimt/LineBreakStrategy.js';

describe('LineBreakStrategy', () => {
  it('NONE wraps a null value: toString null, not auto, maxWidth 0', () => {
    expect(LineBreakStrategy.NONE.toString()).toBeNull();
    expect(LineBreakStrategy.NONE.isAuto()).toBe(false);
    expect(LineBreakStrategy.NONE.getMaxWidth()).toBe(0);
  });

  it('isAuto() is case-insensitive on the literal "auto"', () => {
    expect(new LineBreakStrategy('auto').isAuto()).toBe(true);
    expect(new LineBreakStrategy('AUTO').isAuto()).toBe(true);
    expect(new LineBreakStrategy('Auto').isAuto()).toBe(true);
    expect(new LineBreakStrategy('automatic').isAuto()).toBe(false);
  });

  it('getMaxWidth() parses a signed-integer string', () => {
    expect(new LineBreakStrategy('100').getMaxWidth()).toBe(100);
    expect(new LineBreakStrategy('-5').getMaxWidth()).toBe(-5);
    expect(new LineBreakStrategy('0').getMaxWidth()).toBe(0);
  });

  it('getMaxWidth() returns 0 for non-integer values (e.g. "auto")', () => {
    expect(new LineBreakStrategy('auto').getMaxWidth()).toBe(0);
    expect(new LineBreakStrategy('12.5').getMaxWidth()).toBe(0);
    expect(new LineBreakStrategy('abc').getMaxWidth()).toBe(0);
  });

  it('toString() returns the raw constructor value', () => {
    expect(new LineBreakStrategy('42').toString()).toBe('42');
  });
});
