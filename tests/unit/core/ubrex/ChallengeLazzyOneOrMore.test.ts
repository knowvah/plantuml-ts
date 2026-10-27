import { describe, expect, it } from 'vitest';
import { ChallengeEndOfText } from '../../../../src/core/ubrex/ChallengeEndOfText.js';
import { ChallengeLazzyOneOrMore } from '../../../../src/core/ubrex/ChallengeLazzyOneOrMore.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { lengthOf } from './helpers.js';

describe('ChallengeLazzyOneOrMore', () => {
  const any = new ChallengeSingleChar('a');
  const stop = new ChallengeSingleChar('b');

  it('stops as soon as the stop condition peeks true, without consuming it', () => {
    const c = new ChallengeLazzyOneOrMore(any, stop);
    expect(lengthOf(c, 'aaab')).toBe(3);
  });

  it('fails when the origin does not match', () => {
    expect(lengthOf(new ChallengeLazzyOneOrMore(any, stop), 'x')).toBe(-2147483648);
  });

  it('a zero-width origin is an infinite loop', () => {
    const c = new ChallengeLazzyOneOrMore(new ChallengeEndOfText(), stop);
    expect(() => lengthOf(c, 'a', 1)).toThrow('infinite loop');
  });
});
