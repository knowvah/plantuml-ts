import { describe, expect, it } from 'vitest';
import { UBrexLeaf } from '../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexOneOrMore } from '../../../../../src/core/ubrex/builder/UBrexOneOrMore.js';

describe('UBrexOneOrMore', () => {
  const cut = new UBrexOneOrMore(new UBrexLeaf('ab'));

  it('matches the origin repeatedly (UBrexOneOrMore.java:41-43)', () => {
    expect(cut.match('ababab').getAcceptedMatch()).toBe('ababab');
    expect(cut.match('ababab').exactMatch()).toBe(true);
  });

  it('stops at the first non-matching repetition', () => {
    expect(cut.match('ababa').getAcceptedMatch()).toBe('abab');
    expect(cut.match('ababa').exactMatch()).toBe(false);
  });

  it('rejects zero repetitions', () => {
    expect(cut.match('xab').startMatch()).toBe(false);
  });
});
