import { describe, expect, it } from 'vitest';
import { Challenge } from '../../../../src/core/ubrex/Challenge.js';
import { ChallengeResult } from '../../../../src/core/ubrex/ChallengeResult.js';
import type { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';

describe('Challenge (Challenge.java)', () => {
  it('NO_MATCH is Integer.MIN_VALUE (:39)', () => {
    expect(Challenge.NO_MATCH).toBe(-(2 ** 31));
  });
  it('runChallengeString builds a navigator at position 0 (:43-45)', () => {
    const seen: [string, number][] = [];
    const c: Challenge = {
      runChallenge(nav: TextNavigator, position: number): ChallengeResult {
        seen.push([nav.toString(), position]);
        return ChallengeResult.ONE;
      },
    };
    expect(Challenge.runChallengeString(c, 'abc')).toBe(ChallengeResult.ONE);
    expect(seen).toEqual([['abc', 0]]);
  });
});
