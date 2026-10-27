import { describe, expect, it } from 'vitest';
import { CaseMode } from '../../../../src/core/ubrex/CaseMode.js';
import { ChallengeResult } from '../../../../src/core/ubrex/ChallengeResult.js';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { lengthOf } from './helpers.js';

describe('ChallengeSingleChar', () => {
  it('matches case-insensitively (ChallengeSingleChar.java mode CASE_INSENSITIVE)', () => {
    const c = new ChallengeSingleChar('A');
    expect(lengthOf(c, 'a')).toBe(1);
    expect(lengthOf(c, 'A')).toBe(1);
    expect(lengthOf(c, 'b')).toBe(ChallengeResult.NO_MATCH.getFullCaptureLength());
  });

  it('does not match at the end of the text', () => {
    expect(lengthOf(new ChallengeSingleChar('a'), 'a', 1)).toBe(-2147483648);
  });

  it('compares exactly when the mode is CASE_SENSITIVE (ChallengeSingleChar.java mode branch)', () => {
    const c = new ChallengeSingleChar('a');
    Object.defineProperty(c, 'mode', { value: CaseMode.CASE_SENSITIVE });
    expect(lengthOf(c, 'a')).toBe(1);
    expect(lengthOf(c, 'A')).toBe(-2147483648);
  });

  it('toString shows the lowercased char', () => {
    expect(new ChallengeSingleChar('Q').toString()).toBe('[q]');
  });

  it.each(['┇', '〴', '「', '」', '〤', '〜', '〇', '〄', '〶', '〘', '〙', '【', '】'])(
    'rejects reserved char %s',
    (ch) => {
      expect(() => new ChallengeSingleChar(ch)).toThrow('IllegalArgumentException');
    },
  );
});
