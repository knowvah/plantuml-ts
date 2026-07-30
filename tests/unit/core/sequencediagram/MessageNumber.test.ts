/**
 * MessageNumber.test.ts — T9b: unit coverage for `MessageNumber`
 * (sequencediagram/MessageNumber.java).
 */
import { describe, expect, it } from 'vitest';
import { MessageNumber, isMessageNumber } from '../../../../src/core/sequencediagram/MessageNumber.js';

describe('MessageNumber', () => {
  it('toString returns the raw representation unchanged', () => {
    expect(new MessageNumber('3').toString()).toBe('3');
    expect(new MessageNumber('<b>4</b>').toString()).toBe('<b>4</b>');
  });

  it('getNumberRaw strips <b>/</b> tags', () => {
    expect(new MessageNumber('<b>4</b>').getNumberRaw()).toBe('4');
    expect(new MessageNumber('4').getNumberRaw()).toBe('4');
    expect(new MessageNumber('<b>1.2</b>').getNumberRaw()).toBe('1.2');
  });

  it('getNumberRaw is idempotent across repeated calls (regex lastIndex reset)', () => {
    const n = new MessageNumber('<b>4</b>');
    expect(n.getNumberRaw()).toBe('4');
    expect(n.getNumberRaw()).toBe('4');
  });

  it('charAt/length/subSequence delegate to the representation string', () => {
    const n = new MessageNumber('<b>4</b>');
    expect(n.length()).toBe(8);
    expect(n.charAt(0)).toBe('<');
    expect(n.charAt(3)).toBe('4');
    expect(n.subSequence(3, 4)).toBe('4');
    expect(n.subSequence(0, 3)).toBe('<b>');
  });

  it('carries the "MessageNumber" discriminant for a Display element union', () => {
    expect(new MessageNumber('1').kind).toBe('MessageNumber');
  });

  it('isMessageNumber discriminates MessageNumber instances from plain strings', () => {
    const n = new MessageNumber('1');
    expect(isMessageNumber(n)).toBe(true);
    expect(isMessageNumber('1')).toBe(false);
    expect(isMessageNumber(undefined)).toBe(false);
  });
});
