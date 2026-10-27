import { describe, expect, it } from 'vitest';
import { CharClass } from '../../../../src/core/ubrex/CharClass.js';
import { CharClassRaw } from '../../../../src/core/ubrex/CharClassRaw.js';
import { CharClassType } from '../../../../src/core/ubrex/CharClassType.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';

describe('CharClass (CharClass.java)', () => {
  it('matches honours polarity (:47-54)', () => {
    expect(new CharClass(CharClassRaw.DIGIT, CharClassType.NORMAL).matches('1')).toBe(true);
    expect(new CharClass(CharClassRaw.DIGIT, CharClassType.NORMAL).matches('a')).toBe(false);
    expect(new CharClass(CharClassRaw.DIGIT, CharClassType.NEGATIVE).matches('1')).toBe(false);
    expect(new CharClass(CharClassRaw.DIGIT, CharClassType.NEGATIVE).matches('a')).toBe(true);
  });
  it('fromDefinition: upper-case first char is NEGATIVE (:57-61)', () => {
    expect(CharClass.fromDefinition(TextNavigator.build('d')).name()).toBe('DIGIT-NORMAL');
    expect(CharClass.fromDefinition(TextNavigator.build('D')).name()).toBe('DIGIT-NEGATIVE');
    expect(CharClass.fromDefinition(TextNavigator.build('An')).name()).toBe('ALPHA_NUMERIC-NEGATIVE');
    expect(CharClass.fromDefinition(TextNavigator.build('.')).name()).toBe('ANY-NORMAL');
  });
  it('getDefinitionLength (:68)', () => {
    expect(CharClass.fromDefinition(TextNavigator.build('le')).getDefinitionLength()).toBe(2);
    expect(CharClass.fromDefinition(TextNavigator.build('s')).getDefinitionLength()).toBe(1);
  });
});
