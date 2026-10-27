import { describe, expect, it } from 'vitest';
import { ChallengeLookAhead } from '../../../../src/core/ubrex/ChallengeLookAhead.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { LookAround } from '../../../../src/core/ubrex/LookAround.js';
import { lengthOf } from './helpers.js';

describe('ChallengeLookAhead', () => {
  it('positive and negative look-ahead are zero-width', () => {
    const pos = new ChallengeLookAhead(new ChallengeSingleChar('a'), LookAround.LOOK_AHEAD_POSITIVE);
    const neg = new ChallengeLookAhead(new ChallengeSingleChar('a'), LookAround.LOOK_AHEAD_NEGATIVE);
    expect(lengthOf(pos, 'a')).toBe(0);
    expect(lengthOf(pos, 'b')).toBe(-2147483648);
    expect(lengthOf(neg, 'a')).toBe(-2147483648);
    expect(lengthOf(neg, 'b')).toBe(0);
  });

  it('toString is the look-around name then the origin (ChallengeLookAhead.java toString)', () => {
    const pos = new ChallengeLookAhead(new ChallengeSingleChar('a'), LookAround.LOOK_AHEAD_POSITIVE);
    expect(pos.toString()).toBe('LOOK_AHEAD_POSITIVE [a]');
  });

  it('a look-behind constant is an IllegalStateException (ChallengeLookAhead.java switch fall-through)', () => {
    const bad = new ChallengeLookAhead(new ChallengeSingleChar('a'), LookAround.LOOK_BEHIND_POSITIVE);
    expect(() => lengthOf(bad, 'a')).toThrow('IllegalStateException');
  });
});
