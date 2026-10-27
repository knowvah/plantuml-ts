import { describe, expect, it } from 'vitest';
import { CharClassRaw, isLetter, isLetterOrDigit } from '../../../../src/core/ubrex/CharClassRaw.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';

const nav = (s: string): TextNavigator => TextNavigator.build(s);

describe('CharClassRaw (CharClassRaw.java)', () => {
  it('ANY and SPACE (:41-52)', () => {
    expect(CharClassRaw.ANY.internalMatches('x')).toBe(true);
    expect(CharClassRaw.SPACE.internalMatches(' ')).toBe(true);
    expect(CharClassRaw.SPACE.internalMatches(' ')).toBe(false);
    expect(CharClassRaw.SPACE.internalMatches('\t')).toBe(false);
  });
  it('GUILLEMET: " and curly quotes (:55-60)', () => {
    for (const c of ['"', '“', '”']) expect(CharClassRaw.GUILLEMET.internalMatches(c)).toBe(true);
    expect(CharClassRaw.GUILLEMET.internalMatches("'")).toBe(false);
    expect(CharClassRaw.GUILLEMET.internalMatches('«')).toBe(false);
  });
  it('WORD is ASCII [A-Za-z0-9_] (:62-67)', () => {
    for (const c of ['a', 'z', 'A', 'Z', '0', '9', '_']) expect(CharClassRaw.WORD.internalMatches(c)).toBe(true);
    for (const c of ['é', '-', '`', '{', '@', '[', '/', ':']) {
      expect(CharClassRaw.WORD.internalMatches(c)).toBe(false);
    }
  });
  it('DIGIT is [0-9_] (:69-74)', () => {
    for (const c of ['0', '9', '_']) expect(CharClassRaw.DIGIT.internalMatches(c)).toBe(true);
    for (const c of ['a', '٣', '/', ':']) expect(CharClassRaw.DIGIT.internalMatches(c)).toBe(false);
  });
  it('ALPHA_NUMERIC = Character.isLetterOrDigit (:76-81)', () => {
    for (const c of ['a', 'é', '٣', '5', '中']) {
      expect(CharClassRaw.ALPHA_NUMERIC.internalMatches(c)).toBe(true);
    }
    for (const c of ['_', ' ', ' ', '-', '\ud800']) expect(CharClassRaw.ALPHA_NUMERIC.internalMatches(c)).toBe(false);
  });
  it('LETTER = Character.isLetter (:83-88)', () => {
    for (const c of ['a', 'Z', 'é', 'ǅ', 'ʰ', '中']) {
      expect(CharClassRaw.LETTER.internalMatches(c)).toBe(true);
    }
    for (const c of ['5', '٣', '_', ' ', '\ud83d']) expect(CharClassRaw.LETTER.internalMatches(c)).toBe(false);
  });
  it('isLetter/isLetterOrDigit exported helpers', () => {
    expect(isLetter('é')).toBe(true);
    expect(isLetter('٣')).toBe(false);
    expect(isLetterOrDigit('٣')).toBe(true);
  });
  it('definition lengths (:92)', () => {
    expect(CharClassRaw.ANY.getDefinitionLength()).toBe(1);
    expect(CharClassRaw.ALPHA_NUMERIC.getDefinitionLength()).toBe(2);
    expect(CharClassRaw.LETTER.getDefinitionLength()).toBe(2);
    expect(CharClassRaw.SPACE.name()).toBe('SPACE');
  });
  it('fromDefinition (:96-123)', () => {
    expect(CharClassRaw.fromDefinition(nav('s'))).toBe(CharClassRaw.SPACE);
    expect(CharClassRaw.fromDefinition(nav('S'))).toBe(CharClassRaw.SPACE);
    expect(CharClassRaw.fromDefinition(nav('g'))).toBe(CharClassRaw.GUILLEMET);
    expect(CharClassRaw.fromDefinition(nav('G'))).toBe(CharClassRaw.GUILLEMET);
    expect(CharClassRaw.fromDefinition(nav('d'))).toBe(CharClassRaw.DIGIT);
    expect(CharClassRaw.fromDefinition(nav('D'))).toBe(CharClassRaw.DIGIT);
    expect(CharClassRaw.fromDefinition(nav('w'))).toBe(CharClassRaw.WORD);
    expect(CharClassRaw.fromDefinition(nav('W'))).toBe(CharClassRaw.WORD);
    expect(CharClassRaw.fromDefinition(nav('an'))).toBe(CharClassRaw.ALPHA_NUMERIC);
    expect(CharClassRaw.fromDefinition(nav('A'))).toBe(CharClassRaw.ALPHA_NUMERIC);
    expect(CharClassRaw.fromDefinition(nav('le'))).toBe(CharClassRaw.LETTER);
    expect(CharClassRaw.fromDefinition(nav('L'))).toBe(CharClassRaw.LETTER);
    expect(CharClassRaw.fromDefinition(nav('.'))).toBe(CharClassRaw.ANY);
    expect(() => CharClassRaw.fromDefinition(nav('x'))).toThrow('wip01class x');
  });
  it('internalMatchesAny (:126)', () => {
    const set = new Set([CharClassRaw.SPACE, CharClassRaw.DIGIT]);
    expect(CharClassRaw.internalMatchesAny(set, '3')).toBe(true);
    expect(CharClassRaw.internalMatchesAny(set, ' ')).toBe(true);
    expect(CharClassRaw.internalMatchesAny(set, 'a')).toBe(false);
    expect(CharClassRaw.internalMatchesAny(new Set(), 'a')).toBe(false);
  });
});
