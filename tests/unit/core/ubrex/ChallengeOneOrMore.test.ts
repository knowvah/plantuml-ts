import { describe, expect, it } from 'vitest';
import { ChallengeEndOfText } from '../../../../src/core/ubrex/ChallengeEndOfText.js';
import { ChallengeOneOrMore } from '../../../../src/core/ubrex/ChallengeOneOrMore.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { lengthOf } from './helpers.js';

describe('ChallengeOneOrMore', () => {
  const c = new ChallengeOneOrMore(new ChallengeSingleChar('a'));

  it('needs at least one match and is greedy', () => {
    expect(lengthOf(c, 'aaab')).toBe(3);
    expect(lengthOf(c, 'b')).toBe(-2147483648);
  });

  it('toString (ChallengeOneOrMore.java toString)', () => {
    expect(c.toString()).toBe('ChallengeOneOrMore:[a]');
  });

  it('a zero-width origin is an infinite loop', () => {
    expect(() => lengthOf(new ChallengeOneOrMore(new ChallengeEndOfText()), 'a', 1)).toThrow('infinite loop');
  });
});
