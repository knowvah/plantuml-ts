import { describe, expect, it } from 'vitest';
import { UBrexLeaf } from '../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexOptional } from '../../../../../src/core/ubrex/builder/UBrexOptional.js';

describe('UBrexOptional', () => {
  const cut = new UBrexOptional(new UBrexLeaf('ab'));

  it('matches the origin once when present (UBrexOptional.java:41-43)', () => {
    expect(cut.match('abab').getAcceptedMatch()).toBe('ab');
  });

  it('matches the empty string when absent', () => {
    expect(cut.match('xab').startMatch()).toBe(true);
    expect(cut.match('xab').getAcceptedMatch()).toBe('');
    expect(cut.match('').exactMatch()).toBe(true);
  });
});
