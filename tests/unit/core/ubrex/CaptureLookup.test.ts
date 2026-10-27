import { describe, expect, it } from 'vitest';
import type { CaptureLookup } from '../../../../src/core/ubrex/CaptureLookup.js';
import { Capture } from '../../../../src/core/ubrex/Capture.js';

describe('CaptureLookup (CaptureLookup.java:41,43)', () => {
  it('Capture satisfies the interface', () => {
    const l: CaptureLookup = Capture.EMPTY.withEntry('a', '1').withEntry('a', '2');
    expect(l.findFirstValueByKey('a')).toBe('1');
    expect(l.findValuesByKey('a')).toEqual(['1', '2']);
    expect(l.findFirstValueByKey('b')).toBeUndefined();
  });
});
