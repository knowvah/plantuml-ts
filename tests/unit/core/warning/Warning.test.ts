/**
 * Warning.test.ts — T10b: unit coverage for `Warning` (warning/Warning.java):
 * multi-line message, `asSingleLine`, value-based `equals`.
 */
import { describe, expect, it } from 'vitest';
import { Warning } from '../../../../src/core/warning/Warning.js';

describe('Warning', () => {
  it('getMessage returns every constructor line', () => {
    const w = new Warning('line1', 'line2');
    expect(w.getMessage()).toEqual(['line1', 'line2']);
  });

  it('asSingleLine joins lines with a newline', () => {
    const w = new Warning('a', 'b', 'c');
    expect(w.asSingleLine()).toBe('a\nb\nc');
  });

  it('a zero-line Warning has an empty asSingleLine', () => {
    const w = new Warning();
    expect(w.getMessage()).toEqual([]);
    expect(w.asSingleLine()).toBe('');
  });

  it('equals compares by value, not identity', () => {
    const a = new Warning('x', 'y');
    const b = new Warning('x', 'y');
    expect(a).not.toBe(b);
    expect(a.equals(b)).toBe(true);
  });

  it('equals is false for a different message', () => {
    const a = new Warning('x');
    const b = new Warning('y');
    expect(a.equals(b)).toBe(false);
  });

  it('equals is false for a different line count', () => {
    const a = new Warning('x');
    const b = new Warning('x', 'y');
    expect(a.equals(b)).toBe(false);
  });
});
