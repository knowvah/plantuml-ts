import { describe, expect, it } from 'vitest';
import { ChallengeEndOfText } from '../../../../src/core/ubrex/ChallengeEndOfText.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { ChallengeZeroOrMore } from '../../../../src/core/ubrex/ChallengeZeroOrMore.js';
import { lengthOf } from './helpers.js';

describe('ChallengeZeroOrMore', () => {
  const c = new ChallengeZeroOrMore(new ChallengeSingleChar('a'));

  it('matches zero or more', () => {
    expect(lengthOf(c, 'aab')).toBe(2);
    expect(lengthOf(c, 'b')).toBe(0);
  });

  it('toString (ChallengeZeroOrMore.java toString)', () => {
    expect(c.toString()).toBe('ChallengeZeroOrMore:[a]');
  });

  it('a zero-width origin is an infinite loop', () => {
    expect(() => lengthOf(new ChallengeZeroOrMore(new ChallengeEndOfText()), 'a', 1)).toThrow('infinite loop');
  });
});
