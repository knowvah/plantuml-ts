import { describe, expect, it } from 'vitest';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { ChallengeUpTo } from '../../../../src/core/ubrex/ChallengeUpTo.js';
import { lengthOf } from './helpers.js';

describe('ChallengeUpTo', () => {
  const c = new ChallengeUpTo(new ChallengeSingleChar('z'));

  it('advances up to (not over) the origin', () => {
    expect(lengthOf(c, 'abz')).toBe(2);
    expect(lengthOf(c, 'zab')).toBe(0);
  });

  it('fails when the origin never matches', () => {
    expect(lengthOf(c, 'abc')).toBe(-2147483648);
  });
});
