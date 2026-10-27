import { describe, expect, it } from 'vitest';
import { ChallengeCharSet } from '../../../../../src/core/ubrex/ChallengeCharSet.js';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/CharSetPatternTest.java (every assertion; Java line cited per assertion).
describe('CharSetPatternTest', () => {
  /** CharSetPatternTest.java:14 */
  function match(pattern: ChallengeCharSet, ch: string): boolean {
    return pattern.runChallenge(TextNavigator.build('' + ch), 0).getFullCaptureLength() === 1;
  }

  /** Valid chars are added and found. */
  it('testAddAndContains (CharSetPatternTest.java:23)', () => {
    const pattern = new ChallengeCharSet();
    pattern.addChar('A');
    pattern.addChar('z');
    pattern.addChar(' '); // lower bound (code 32)
    pattern.addChar(String.fromCharCode(128)); // upper bound
    expect(match(pattern, 'A')).toBe(true); // CharSetPatternTest.java:33
    expect(match(pattern, 'z')).toBe(true); // CharSetPatternTest.java:34
    expect(match(pattern, ' ')).toBe(true); // CharSetPatternTest.java:35
    expect(match(pattern, String.fromCharCode(128))).toBe(true); // CharSetPatternTest.java:36
    expect(match(pattern, 'B')).toBe(false); // CharSetPatternTest.java:39
    expect(match(pattern, 'b')).toBe(false); // CharSetPatternTest.java:40
    expect(match(pattern, '0')).toBe(false); // CharSetPatternTest.java:41
  });

  /** A char outside 32..128 throws (Java IllegalArgumentException; ported as an Error from CharSet.addChar). */
  it('testInvalidAddChar (CharSetPatternTest.java:49)', () => {
    const pattern = new ChallengeCharSet();
    expect(() => {
      pattern.addChar(String.fromCharCode(31));
    }).toThrow('Bad char'); // CharSetPatternTest.java:53
    expect(() => {
      pattern.addChar(String.fromCharCode(129));
    }).toThrow('Bad char'); // CharSetPatternTest.java:58
  });

  it('testInvalidContains (CharSetPatternTest.java:68)', () => {
    const pattern = new ChallengeCharSet();
    expect(match(pattern, String.fromCharCode(31))).toBe(false); // CharSetPatternTest.java:72
    expect(match(pattern, String.fromCharCode(129))).toBe(false); // CharSetPatternTest.java:75
  });

  it('testMultipleAdditions (CharSetPatternTest.java:83)', () => {
    const pattern = new ChallengeCharSet();
    const characters = ['A', 'B', 'C', '1', '2', '3', '#', '$'];
    for (const ch of characters) {
      pattern.addChar(ch);
      pattern.addChar(ch); // Verify that duplicate additions do not cause issues
    }
    for (const ch of characters) {
      expect(match(pattern, ch)).toBe(true); // CharSetPatternTest.java:96
    }
  });

  it('testBuildWithSingleCharacters (CharSetPatternTest.java:105)', () => {
    const pattern = ChallengeCharSet.build('abc');
    expect(match(pattern, 'a')).toBe(true); // CharSetPatternTest.java:107
    expect(match(pattern, 'b')).toBe(true); // CharSetPatternTest.java:108
    expect(match(pattern, 'c')).toBe(true); // CharSetPatternTest.java:109
    expect(match(pattern, 'd')).toBe(false); // CharSetPatternTest.java:110
  });

  it('testBuildWithRange (CharSetPatternTest.java:118)', () => {
    const pattern = ChallengeCharSet.build('a〜c');
    expect(match(pattern, 'a')).toBe(true); // CharSetPatternTest.java:120
    expect(match(pattern, 'b')).toBe(true); // CharSetPatternTest.java:121
    expect(match(pattern, 'c')).toBe(true); // CharSetPatternTest.java:122
    expect(match(pattern, 'd')).toBe(false); // CharSetPatternTest.java:123
  });

  it('testBuildWithMultipleRangesAndCharacters (CharSetPatternTest.java:132)', () => {
    const pattern = ChallengeCharSet.build('-a〜z0〜9');
    expect(match(pattern, '-')).toBe(true); // CharSetPatternTest.java:136
    for (let code = 'a'.charCodeAt(0); code <= 'z'.charCodeAt(0); code++) {
      expect(match(pattern, String.fromCharCode(code))).toBe(true); // CharSetPatternTest.java:140
    }
    for (let code = '0'.charCodeAt(0); code <= '9'.charCodeAt(0); code++) {
      expect(match(pattern, String.fromCharCode(code))).toBe(true); // CharSetPatternTest.java:145
    }
    expect(match(pattern, '.')).toBe(false); // CharSetPatternTest.java:149
  });

  it('testBuildWithIncompleteRange (CharSetPatternTest.java:157)', () => {
    expect(() => {
      ChallengeCharSet.build('a〜');
    }).toThrow("Range operator '〜' must be followed by a character."); // CharSetPatternTest.java:160 assertThrows(IllegalArgumentException)
  });

  it('testBuildWithInvalidRangeOrder (CharSetPatternTest.java:171)', () => {
    expect(() => {
      ChallengeCharSet.build('z〜a');
    }).toThrow("Invalid range: 'z' is greater than 'a'."); // CharSetPatternTest.java:173 assertThrows(IllegalArgumentException)
  });

  it('testBuildWithEmptyInnerContent (CharSetPatternTest.java:183)', () => {
    expect(() => {
      ChallengeCharSet.build('');
    }).toThrow('Empty!'); // CharSetPatternTest.java:184 assertThrows(IllegalArgumentException)
  });

  it('test1 (CharSetPatternTest.java:194)', () => {
    expect(() => {
      ChallengeCharSet.build('f〜');
    }).toThrow("Range operator '〜' must be followed by a character."); // CharSetPatternTest.java:195 assertThrows(IllegalArgumentException)
  });

  it('testAddRangeEntirelyInMask1 (CharSetPatternTest.java:205)', () => {
    const pattern = new ChallengeCharSet();
    pattern.addRange('A', 'Z'); // 'A' = 65, 'Z' = 90, all in mask1
    for (let code = 'A'.charCodeAt(0); code <= 'Z'.charCodeAt(0); code++) {
      expect(match(pattern, String.fromCharCode(code))).toBe(true); // CharSetPatternTest.java:210
    }
    expect(match(pattern, '5')).toBe(false); // CharSetPatternTest.java:213
  });

  it('testAddRangeEntirelyInMask2 (CharSetPatternTest.java:221)', () => {
    const pattern = new ChallengeCharSet();
    pattern.addRange('a', 'z'); // 'a' = 97, 'z' = 122, all in mask2
    for (let code = 'a'.charCodeAt(0); code <= 'z'.charCodeAt(0); code++) {
      expect(match(pattern, String.fromCharCode(code))).toBe(true); // CharSetPatternTest.java:226
    }
    expect(match(pattern, '5')).toBe(false); // CharSetPatternTest.java:229
  });

  it('testAddRangeSpanningBothMasks (CharSetPatternTest.java:233)', () => {
    const pattern = new ChallengeCharSet();
    pattern.addRange('1', '8');
    for (let code = '1'.charCodeAt(0); code <= '8'.charCodeAt(0); code++) {
      expect(match(pattern, String.fromCharCode(code))).toBe(true); // CharSetPatternTest.java:238
    }
    expect(match(pattern, '0')).toBe(false); // CharSetPatternTest.java:242
    expect(match(pattern, '9')).toBe(false); // CharSetPatternTest.java:243
  });
});
