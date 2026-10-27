import { describe, expect, it } from 'vitest';
import { Repetition } from '../../../../../src/core/ubrex/Repetition.js';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/RepetitionTest.java (every assertion; Java line cited per assertion).
describe('RepetitionTest', () => {
  // ========== Exact {n} ==========

  it('testExact6_match (RepetitionTest.java:14)', () => {
    const cut = UnicodeBracketedExpression.build('he〇{6}lo');
    expect(cut.match(TextNavigator.build('hellllllo')).getAcceptedMatch()).toBe('hellllllo'); // RepetitionTest.java:16
  });

  it('testExact6_noMatch (RepetitionTest.java:20)', () => {
    const cut = UnicodeBracketedExpression.build('he〇{6}lo');
    expect(cut.match(TextNavigator.build('helllllo')).getAcceptedMatch()).toBe(''); // RepetitionTest.java:22
  });

  it('testExact2 (RepetitionTest.java:26)', () => {
    const cut = UnicodeBracketedExpression.build('〇{2}a');
    expect(cut.match('aa', 0).exactMatch()).toBe(true); // RepetitionTest.java:28
    expect(cut.match('a', 0).exactMatch()).toBe(false); // RepetitionTest.java:29
    expect(cut.match('aaa', 0).exactMatch()).toBe(false); // RepetitionTest.java:30
  });

  it('testExactMultiDigit (RepetitionTest.java:34)', () => {
    const cut = UnicodeBracketedExpression.build('〇{12}x');
    const twelve = 'xxxxxxxxxxxx';
    expect(cut.match(twelve, 0).exactMatch()).toBe(true); // RepetitionTest.java:37
    expect(cut.match(twelve + 'x', 0).exactMatch()).toBe(false); // RepetitionTest.java:38
    expect(cut.match(twelve.substring(1), 0).exactMatch()).toBe(false); // RepetitionTest.java:39
  });

  // ========== Range {m-n} ==========

  it('testRange1to3 (RepetitionTest.java:45)', () => {
    const cut = UnicodeBracketedExpression.build('〇{1-3}aZ');
    expect(cut.match('aZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:47
    expect(cut.match('aaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:48
    expect(cut.match('aaaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:49
    expect(cut.match('Z', 0).exactMatch()).toBe(false); // RepetitionTest.java:50
    expect(cut.match('aaaaZ', 0).exactMatch()).toBe(false); // RepetitionTest.java:51
  });

  it('testRange2to2 (RepetitionTest.java:55)', () => {
    const cut = UnicodeBracketedExpression.build('〇{2-2}a');
    expect(cut.match('aa', 0).exactMatch()).toBe(true); // RepetitionTest.java:57
    expect(cut.match('a', 0).exactMatch()).toBe(false); // RepetitionTest.java:58
    expect(cut.match('aaa', 0).exactMatch()).toBe(false); // RepetitionTest.java:59
  });

  // ========== Min or more {n+} ==========

  it('testMinOrMore2 (RepetitionTest.java:65)', () => {
    const cut = UnicodeBracketedExpression.build('〇{2+}aZ');
    expect(cut.match('aZ', 0).exactMatch()).toBe(false); // RepetitionTest.java:67
    expect(cut.match('aaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:68
    expect(cut.match('aaaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:69
    expect(cut.match('aaaaaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:70
  });

  it('testMinOrMore1 (RepetitionTest.java:74)', () => {
    const cut = UnicodeBracketedExpression.build('〇{1+}b');
    expect(cut.match('b', 0).exactMatch()).toBe(true); // RepetitionTest.java:76
    expect(cut.match('bb', 0).exactMatch()).toBe(true); // RepetitionTest.java:77
    expect(cut.match('bbbbb', 0).exactMatch()).toBe(true); // RepetitionTest.java:78
    expect(cut.match('', 0).exactMatch()).toBe(false); // RepetitionTest.java:79
  });

  // ========== Combined {m;n;...} ==========

  it('testCombinedExact (RepetitionTest.java:85)', () => {
    const cut = UnicodeBracketedExpression.build('〇{1;3;5}xZ');
    expect(cut.match('xZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:87
    expect(cut.match('xxZ', 0).exactMatch()).toBe(false); // RepetitionTest.java:88
    expect(cut.match('xxxZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:89
    expect(cut.match('xxxxZ', 0).exactMatch()).toBe(false); // RepetitionTest.java:90
    expect(cut.match('xxxxxZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:91
  });

  it('testCombinedRangeAndMore (RepetitionTest.java:95)', () => {
    // 2 times, or 4 to 6 times, or 8+ times
    const cut = UnicodeBracketedExpression.build('〇{2;4-6;8+}aZ');
    expect(cut.match('aZ', 0).exactMatch()).toBe(false); // RepetitionTest.java:98
    expect(cut.match('aaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:99
    expect(cut.match('aaaZ', 0).exactMatch()).toBe(false); // RepetitionTest.java:100
    expect(cut.match('aaaaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:101
    expect(cut.match('aaaaaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:102
    expect(cut.match('aaaaaaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:103
    expect(cut.match('aaaaaaaZ', 0).exactMatch()).toBe(false); // RepetitionTest.java:104
    expect(cut.match('aaaaaaaaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:105
    expect(cut.match('aaaaaaaaaaZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:106
  });

  // ========== Repetition.parse + match unit tests ==========

  it('testParseExact (RepetitionTest.java:112)', () => {
    const rep = Repetition.parse(TextNavigator.build('3}'));
    expect(rep.match(3)).toBe(true); // RepetitionTest.java:114
    expect(rep.match(2)).toBe(false); // RepetitionTest.java:115
    expect(rep.match(4)).toBe(false); // RepetitionTest.java:116
  });

  it('testParseMultiDigitExact (RepetitionTest.java:120)', () => {
    const rep = Repetition.parse(TextNavigator.build('15}'));
    expect(rep.match(15)).toBe(true); // RepetitionTest.java:122
    expect(rep.match(1)).toBe(false); // RepetitionTest.java:123
    expect(rep.match(5)).toBe(false); // RepetitionTest.java:124
    expect(rep.match(14)).toBe(false); // RepetitionTest.java:125
  });

  it('testParseRange (RepetitionTest.java:129)', () => {
    const rep = Repetition.parse(TextNavigator.build('2-5}'));
    expect(rep.match(1)).toBe(false); // RepetitionTest.java:131
    expect(rep.match(2)).toBe(true); // RepetitionTest.java:132
    expect(rep.match(3)).toBe(true); // RepetitionTest.java:133
    expect(rep.match(4)).toBe(true); // RepetitionTest.java:134
    expect(rep.match(5)).toBe(true); // RepetitionTest.java:135
    expect(rep.match(6)).toBe(false); // RepetitionTest.java:136
  });

  it('testParseMinOrMore (RepetitionTest.java:140)', () => {
    const rep = Repetition.parse(TextNavigator.build('3+}'));
    expect(rep.match(2)).toBe(false); // RepetitionTest.java:142
    expect(rep.match(3)).toBe(true); // RepetitionTest.java:143
    expect(rep.match(4)).toBe(true); // RepetitionTest.java:144
    expect(rep.match(100)).toBe(true); // RepetitionTest.java:145
  });

  it('testParseCombined (RepetitionTest.java:149)', () => {
    const rep = Repetition.parse(TextNavigator.build('1;5;4-6}'));
    expect(rep.match(1)).toBe(true); // RepetitionTest.java:151
    expect(rep.match(2)).toBe(false); // RepetitionTest.java:152
    expect(rep.match(3)).toBe(false); // RepetitionTest.java:153
    expect(rep.match(4)).toBe(true); // RepetitionTest.java:154
    expect(rep.match(5)).toBe(true); // RepetitionTest.java:155
    expect(rep.match(6)).toBe(true); // RepetitionTest.java:156
    expect(rep.match(7)).toBe(false); // RepetitionTest.java:157
  });

  it('testParseCombinedWithMore (RepetitionTest.java:161)', () => {
    const rep = Repetition.parse(TextNavigator.build('2;4-6;8+}'));
    expect(rep.match(0)).toBe(false); // RepetitionTest.java:163
    expect(rep.match(1)).toBe(false); // RepetitionTest.java:164
    expect(rep.match(2)).toBe(true); // RepetitionTest.java:165
    expect(rep.match(3)).toBe(false); // RepetitionTest.java:166
    expect(rep.match(4)).toBe(true); // RepetitionTest.java:167
    expect(rep.match(5)).toBe(true); // RepetitionTest.java:168
    expect(rep.match(6)).toBe(true); // RepetitionTest.java:169
    expect(rep.match(7)).toBe(false); // RepetitionTest.java:170
    expect(rep.match(8)).toBe(true); // RepetitionTest.java:171
    expect(rep.match(9)).toBe(true); // RepetitionTest.java:172
    expect(rep.match(50)).toBe(true); // RepetitionTest.java:173
  });

  // ========== With character sets ==========

  it('testRangeWithCharSet (RepetitionTest.java:179)', () => {
    const cut = UnicodeBracketedExpression.build('〇{1-2}「ab」Z');
    expect(cut.match('aZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:181
    expect(cut.match('bZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:182
    expect(cut.match('abZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:183
    expect(cut.match('baZ', 0).exactMatch()).toBe(true); // RepetitionTest.java:184
    expect(cut.match('aabZ', 0).exactMatch()).toBe(false); // RepetitionTest.java:185
    expect(cut.match('cZ', 0).exactMatch()).toBe(false); // RepetitionTest.java:186
  });

  it('testRangeWithDigitClass (RepetitionTest.java:190)', () => {
    const cut = UnicodeBracketedExpression.build('〇{1-4}〴d');
    expect(cut.match('1', 0).exactMatch()).toBe(true); // RepetitionTest.java:192
    expect(cut.match('12', 0).exactMatch()).toBe(true); // RepetitionTest.java:193
    expect(cut.match('123', 0).exactMatch()).toBe(true); // RepetitionTest.java:194
    expect(cut.match('1234', 0).exactMatch()).toBe(true); // RepetitionTest.java:195
    expect(cut.match('12345', 0).exactMatch()).toBe(false); // RepetitionTest.java:196
    expect(cut.match('', 0).exactMatch()).toBe(false); // RepetitionTest.java:197
  });
});
