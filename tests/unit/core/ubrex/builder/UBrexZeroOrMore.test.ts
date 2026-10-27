import { describe, expect, it } from 'vitest';
import { UBrexLeaf } from '../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexZeroOrMore } from '../../../../../src/core/ubrex/builder/UBrexZeroOrMore.js';

describe('UBrexZeroOrMore', () => {
  const cut = new UBrexZeroOrMore(new UBrexLeaf('ab'));

  it('matches the origin repeatedly (UBrexZeroOrMore.java:41-43)', () => {
    expect(cut.match('ababx').getAcceptedMatch()).toBe('abab');
  });

  it('matches zero repetitions', () => {
    expect(cut.match('x').startMatch()).toBe(true);
    expect(cut.match('x').getAcceptedMatch()).toBe('');
    expect(cut.match('').exactMatch()).toBe(true);
  });
});
