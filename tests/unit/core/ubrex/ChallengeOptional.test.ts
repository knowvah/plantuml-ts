import { describe, expect, it } from 'vitest';
import { ChallengeOptional } from '../../../../src/core/ubrex/ChallengeOptional.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { lengthOf } from './helpers.js';

describe('ChallengeOptional', () => {
  const c = new ChallengeOptional(new ChallengeSingleChar('a'));

  it('matches the origin or zero-width', () => {
    expect(lengthOf(c, 'a')).toBe(1);
    expect(lengthOf(c, 'b')).toBe(0);
  });

  it('toString (ChallengeOptional.java toString)', () => {
    expect(c.toString()).toBe('ChallengeOptional:[a]');
  });
});
