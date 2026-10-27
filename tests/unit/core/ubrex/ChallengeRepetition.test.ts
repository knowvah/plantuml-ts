import { describe, expect, it } from 'vitest';
import { ChallengeEndOfText } from '../../../../src/core/ubrex/ChallengeEndOfText.js';
import { ChallengeRepetition } from '../../../../src/core/ubrex/ChallengeRepetition.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { Repetition } from '../../../../src/core/ubrex/Repetition.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';
import { lengthOf } from './helpers.js';

describe('ChallengeRepetition', () => {
  const two = (): Repetition => Repetition.parse(TextNavigator.build('2}'));

  it('accepts exactly the counted repetitions', () => {
    const c = new ChallengeRepetition(two(), new ChallengeSingleChar('a'));
    expect(lengthOf(c, 'aab')).toBe(2);
    expect(lengthOf(c, 'ab')).toBe(-2147483648);
    expect(lengthOf(c, 'b')).toBe(-2147483648);
  });

  it('a zero-width origin is an infinite loop', () => {
    expect(() => lengthOf(new ChallengeRepetition(two(), new ChallengeEndOfText()), 'a', 1)).toThrow('infinite loop');
  });
});
