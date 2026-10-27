import { describe, expect, it } from 'vitest';
import { ChallengeCharClass } from '../../../../src/core/ubrex/ChallengeCharClass.js';
import { CharClass } from '../../../../src/core/ubrex/CharClass.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';
import { lengthOf } from './helpers.js';

describe('ChallengeCharClass', () => {
  const c = new ChallengeCharClass(CharClass.fromDefinition(TextNavigator.build('d')));

  it('matches one digit, not a letter, not the end', () => {
    expect(lengthOf(c, '7')).toBe(1);
    expect(lengthOf(c, 'x')).toBe(-2147483648);
    expect(lengthOf(c, '7', 1)).toBe(-2147483648);
  });

  it('toString is the class name (ChallengeCharClass.java toString)', () => {
    expect(c.toString()).toBe(CharClass.fromDefinition(TextNavigator.build('d')).name());
  });
});
