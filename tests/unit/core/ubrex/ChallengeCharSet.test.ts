import { describe, expect, it } from 'vitest';
import { ChallengeCharSet } from '../../../../src/core/ubrex/ChallengeCharSet.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';
import { lengthOf } from './helpers.js';

describe('ChallengeCharSet', () => {
  it('build accepts a TextNavigator and skips spaces', () => {
    const c = ChallengeCharSet.build(TextNavigator.build('a b'));
    expect(lengthOf(c, 'a')).toBe(1);
    expect(lengthOf(c, ' ')).toBe(-2147483648);
  });

  it('〃 adds a double quote and ∙ adds a space (ChallengeCharSet.java build)', () => {
    const c = ChallengeCharSet.build('〃∙');
    expect(lengthOf(c, '"')).toBe(1);
    expect(lengthOf(c, ' ')).toBe(1);
    expect(lengthOf(c, 'x')).toBe(-2147483648);
  });

  it('〴 adds a char class; 〤 reverses', () => {
    const c = ChallengeCharSet.build('〤〴d');
    expect(lengthOf(c, 'x')).toBe(1);
    expect(lengthOf(c, '5')).toBe(-2147483648);
  });

  it('does not match at the end of the text', () => {
    expect(lengthOf(ChallengeCharSet.build('a'), 'a', 1)).toBe(-2147483648);
  });
});
