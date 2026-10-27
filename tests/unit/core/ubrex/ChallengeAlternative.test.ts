import { describe, expect, it } from 'vitest';
import { ChallengeAlternative } from '../../../../src/core/ubrex/ChallengeAlternative.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { lengthOf } from './helpers.js';

describe('ChallengeAlternative', () => {
  const alt = new ChallengeAlternative();
  alt.addAlternative(new ChallengeSingleChar('a'));
  alt.addAlternative(new ChallengeSingleChar('b'));

  it('returns the first matching alternative', () => {
    expect(lengthOf(alt, 'b')).toBe(1);
    expect(lengthOf(alt, 'c')).toBe(-2147483648);
  });

  it('toString lists the alternatives (ChallengeAlternative.java toString)', () => {
    expect(alt.toString()).toBe('ALTERNATIVE[[a], [b]]');
  });
});
