import { describe, expect, it } from 'vitest';
import { CaptureEntry } from '../../../../src/core/ubrex/CaptureEntry.js';

describe('CaptureEntry (CaptureEntry.java)', () => {
  const e = new CaptureEntry('k', 'v');
  it('getters and toString (:47,51,66)', () => {
    expect(e.getKey()).toBe('k');
    expect(e.getValue()).toBe('v');
    expect(e.toString()).toBe('k=v');
  });
  it('withPrefixedKey joins with "/" (:55)', () => {
    expect(e.withPrefixedKey('p').toString()).toBe('p/k=v');
  });
  it('withoutPrefixedKey strips "prefix/" or returns undefined (:59)', () => {
    expect(new CaptureEntry('p/k', 'v').withoutPrefixedKey('p')?.toString()).toBe('k=v');
    expect(new CaptureEntry('p/a/k', 'v').withoutPrefixedKey('p')?.getKey()).toBe('a/k');
    expect(e.withoutPrefixedKey('p')).toBeUndefined();
    expect(new CaptureEntry('pk', 'v').withoutPrefixedKey('p')).toBeUndefined();
  });
});
