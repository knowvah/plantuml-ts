import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/AlternativeTest.java (every assertion; Java line cited per assertion).
describe('AlternativeTest', () => {
  it('test1 (AlternativeTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('【a┇b┇c】');
    expect(cut.match(TextNavigator.build('a')).getAcceptedMatch()).toBe('a'); // AlternativeTest.java:12
    expect(cut.match(TextNavigator.build('b')).getAcceptedMatch()).toBe('b'); // AlternativeTest.java:13
    expect(cut.match(TextNavigator.build('c')).getAcceptedMatch()).toBe('c'); // AlternativeTest.java:14
    expect(cut.match(TextNavigator.build('h')).getAcceptedMatch()).toBe(''); // AlternativeTest.java:15
  });

  it('test2 (AlternativeTest.java:19)', () => {
    const cut = UnicodeBracketedExpression.build('【ab┇cd】');
    expect(cut.match(TextNavigator.build('ab')).getAcceptedMatch()).toBe('ab'); // AlternativeTest.java:21
    expect(cut.match(TextNavigator.build('cd')).getAcceptedMatch()).toBe('cd'); // AlternativeTest.java:22
    expect(cut.match(TextNavigator.build('c')).getAcceptedMatch()).toBe(''); // AlternativeTest.java:23
    expect(cut.match(TextNavigator.build('h')).getAcceptedMatch()).toBe(''); // AlternativeTest.java:24
  });

  it('test3 (AlternativeTest.java:28)', () => {
    const cut = UnicodeBracketedExpression.build('【〇+a┇〇+b┇〇?c】');
    expect(cut.match(TextNavigator.build('')).getAcceptedMatch()).toBe(''); // AlternativeTest.java:30
    expect(cut.match(TextNavigator.build('aaaa')).getAcceptedMatch()).toBe('aaaa'); // AlternativeTest.java:31
    expect(cut.match(TextNavigator.build('bb')).getAcceptedMatch()).toBe('bb'); // AlternativeTest.java:32
    expect(cut.match(TextNavigator.build('c')).getAcceptedMatch()).toBe('c'); // AlternativeTest.java:33
  });

  it('test4 (AlternativeTest.java:37)', () => {
    const cut = UnicodeBracketedExpression.build('partition∙〇+〴S∙【 # 〇{6}「0〜9a〜fA〜F」┇ 〇?# 〇+〴w 】');
    expect(cut.match('partition to #012345', 0).getAcceptedMatch()).toBe('partition to #012345'); // AlternativeTest.java:39
    expect(cut.match('partition to gray', 0).getAcceptedMatch()).toBe('partition to gray'); // AlternativeTest.java:40
  });

  it('test5 (AlternativeTest.java:44)', () => {
    const cut = UnicodeBracketedExpression.build('partition∙〇+〴S∙# 〇{6}「0〜9a〜fA〜F」');
    expect(cut.match('partition to #012345', 0).getAcceptedMatch()).toBe('partition to #012345'); // AlternativeTest.java:46
  });

  it('test50 (AlternativeTest.java:50)', () => {
    const cut = UnicodeBracketedExpression.build('partition∙〇+〴S∙# 〇+「0〜9」');
    expect(cut.match('partition to #012345', 0).getAcceptedMatch()).toBe('partition to #012345'); // AlternativeTest.java:52
  });
});
