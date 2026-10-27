import { describe, expect, it } from 'vitest';
import { ChallengeLookBehind } from '../../../../src/core/ubrex/ChallengeLookBehind.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { LookAround } from '../../../../src/core/ubrex/LookAround.js';
import { lengthOf } from './helpers.js';

describe('ChallengeLookBehind', () => {
  it('positive and negative look-behind read the reversed prefix', () => {
    const pos = new ChallengeLookBehind(new ChallengeSingleChar('a'), LookAround.LOOK_BEHIND_POSITIVE);
    const neg = new ChallengeLookBehind(new ChallengeSingleChar('a'), LookAround.LOOK_BEHIND_NEGATIVE);
    expect(lengthOf(pos, 'ab', 1)).toBe(0);
    expect(lengthOf(pos, 'ab', 2)).toBe(-2147483648);
    expect(lengthOf(neg, 'ab', 1)).toBe(-2147483648);
    expect(lengthOf(neg, 'ab', 2)).toBe(0);
  });

  it('a look-ahead constant is an IllegalStateException (ChallengeLookBehind.java switch fall-through)', () => {
    const bad = new ChallengeLookBehind(new ChallengeSingleChar('a'), LookAround.LOOK_AHEAD_POSITIVE);
    expect(() => lengthOf(bad, 'a', 1)).toThrow('IllegalStateException');
  });
});
