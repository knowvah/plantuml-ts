import { describe, expect, it } from 'vitest';
import { Capture } from '../../../../src/core/ubrex/Capture.js';

describe('Capture (Capture.java)', () => {
  it('EMPTY prints [] and withEntry appends (:42,54)', () => {
    expect(Capture.EMPTY.toString()).toBe('[]');
    const c = Capture.EMPTY.withEntry('a', '1').withEntry('b', '2');
    expect(c.toString()).toBe('[a=1, b=2]');
    expect(Capture.EMPTY.toString()).toBe('[]');
  });
  it('merge shortcuts and concatenation (:58-65)', () => {
    const a = Capture.EMPTY.withEntry('a', '1');
    const b = Capture.EMPTY.withEntry('b', '2').withEntry('c', '3');
    expect(a.merge(Capture.EMPTY)).toBe(a);
    expect(Capture.EMPTY.merge(a)).toBe(a);
    expect(a.merge(b).toString()).toBe('[a=1, b=2, c=3]');
  });
  it('withPrefixedKeys (:68)', () => {
    expect(Capture.EMPTY.withEntry('a', '1').withPrefixedKeys('p').toString()).toBe('[p/a=1]');
    expect(Capture.EMPTY.withPrefixedKeys('p').toString()).toBe('[]');
  });
  it('findValuesByKey keeps order, findFirstValueByKey first or undefined (:73,99)', () => {
    const c = Capture.EMPTY.withEntry('a', '1').withEntry('b', '9').withEntry('a', '2');
    expect(c.findValuesByKey('a')).toEqual(['1', '2']);
    expect(c.findValuesByKey('z')).toEqual([]);
    expect(c.findFirstValueByKey('a')).toBe('1');
    expect(c.findFirstValueByKey('z')).toBeUndefined();
  });
  it('findFirstValuesByKeyPrefix returns values of the first matching full key (:81)', () => {
    const c = Capture.EMPTY.withEntry('ab', '1').withEntry('ac', '2').withEntry('ab', '3');
    expect(c.findFirstValuesByKeyPrefix('a')).toEqual(['1', '3']);
    expect(c.findFirstValuesByKeyPrefix('x')).toBeUndefined();
  });
  it('extractByPrefix keeps only prefixed entries with prefix stripped (:88)', () => {
    const c = Capture.EMPTY.withEntry('p/a', '1').withEntry('q/a', '2').withEntry('p/b', '3');
    expect(c.extractByPrefix('p').toString()).toBe('[a=1, b=3]');
    expect(c.extractByPrefix('none').toString()).toBe('[]');
  });
});
