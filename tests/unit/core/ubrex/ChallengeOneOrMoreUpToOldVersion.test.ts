import { describe, expect, it } from 'vitest';
import { ChallengeEndOfText } from '../../../../src/core/ubrex/ChallengeEndOfText.js';
import { ChallengeOneOrMoreUpToOldVersion } from '../../../../src/core/ubrex/ChallengeOneOrMoreUpToOldVersion.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { lengthOf } from './helpers.js';

describe('ChallengeOneOrMoreUpToOldVersion', () => {
  const a = new ChallengeSingleChar('a');
  const z = new ChallengeSingleChar('z');

  it('repeats the origin until the end challenge peeks true', () => {
    expect(lengthOf(new ChallengeOneOrMoreUpToOldVersion(a, z), 'aaz')).toBe(2);
  });

  it('fails when the origin stops matching before the end', () => {
    expect(lengthOf(new ChallengeOneOrMoreUpToOldVersion(a, z), 'aab')).toBe(-2147483648);
  });

  it('a zero-width origin is an infinite loop', () => {
    expect(() => lengthOf(new ChallengeOneOrMoreUpToOldVersion(new ChallengeEndOfText(), z), 'a', 1)).toThrow(
      'infinite loop',
    );
  });
});
