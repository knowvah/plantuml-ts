import { describe, expect, it } from 'vitest';
import { ChallengeEndOfText } from '../../../../src/core/ubrex/ChallengeEndOfText.js';
import { lengthOf } from './helpers.js';

describe('ChallengeEndOfText', () => {
  it('matches zero-width only at or after the end', () => {
    const c = new ChallengeEndOfText();
    expect(lengthOf(c, 'ab', 2)).toBe(0);
    expect(lengthOf(c, 'ab', 3)).toBe(0);
    expect(lengthOf(c, 'ab', 1)).toBe(-2147483648);
  });
});
