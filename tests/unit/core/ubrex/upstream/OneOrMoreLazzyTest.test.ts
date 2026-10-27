import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';
import { javaList } from '../helpers.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/OneOrMoreLazzyTest.java (every assertion; Java line cited per assertion).
describe('OneOrMoreLazzyTest', () => {
  it('test10 (OneOrMoreLazzyTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('a 〇l+〴w end  〒$');
    expect(cut.match(TextNavigator.build('abbbbend')).getAcceptedMatch()).toBe('abbbbend'); // OneOrMoreLazzyTest.java:12
  });

  it('test20 (OneOrMoreLazzyTest.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('aa 〇l+〴w end  〒$');
    expect(cut.match(TextNavigator.build('aabbbbend')).getAcceptedMatch()).toBe('aabbbbend'); // OneOrMoreLazzyTest.java:18
  });

  it('test30 (OneOrMoreLazzyTest.java:22)', () => {
    const cut = UnicodeBracketedExpression.build('aa 〇l+〶$gr1=〴w 〶$gr2=end  〒$');
    const matcher = cut.match(TextNavigator.build('aabbbbend'));
    expect(matcher.getAcceptedMatch()).toBe('aabbbbend'); // OneOrMoreLazzyTest.java:25
    expect(javaList(matcher.findValuesByKey('gr1'))).toBe('[b, b, b, b]'); // OneOrMoreLazzyTest.java:26
    expect(javaList(matcher.findValuesByKey('gr2'))).toBe('[e]'); // OneOrMoreLazzyTest.java:27
  });

  it('test40 (OneOrMoreLazzyTest.java:32)', () => {
    const cut = UnicodeBracketedExpression.build('aa 〶$gr1=〇l+〴w   〶$gr2=end  〒$');
    const matcher = cut.match(TextNavigator.build('aabbbbend'));
    expect(matcher.getAcceptedMatch()).toBe('aabbbbend'); // OneOrMoreLazzyTest.java:35
    expect(javaList(matcher.findValuesByKey('gr1'))).toBe('[bbbb]'); // OneOrMoreLazzyTest.java:36
    expect(javaList(matcher.findValuesByKey('gr2'))).toBe('[e]'); // OneOrMoreLazzyTest.java:37
  });

  it('test50 (OneOrMoreLazzyTest.java:42)', () => {
    const cut = UnicodeBracketedExpression.build('aaa 〶$gr1=〇l+〴w   〶$gr2=end  〒$');
    const matcher = cut.match(TextNavigator.build('aaabbbbend'));
    expect(matcher.getAcceptedMatch()).toBe('aaabbbbend'); // OneOrMoreLazzyTest.java:45
    expect(javaList(matcher.findValuesByKey('gr1'))).toBe('[bbbb]'); // OneOrMoreLazzyTest.java:46
    expect(javaList(matcher.findValuesByKey('gr2'))).toBe('[e]'); // OneOrMoreLazzyTest.java:47
  });

  it('test60 (OneOrMoreLazzyTest.java:51)', () => {
    const cut = UnicodeBracketedExpression.build('aaa 〶$gr1=〇l+〘〴w〴w〙   〶$gr2=end  〒$');
    const matcher = cut.match(TextNavigator.build('aaabbbbbbend'));
    expect(matcher.getAcceptedMatch()).toBe('aaabbbbbbend'); // OneOrMoreLazzyTest.java:54
    expect(javaList(matcher.findValuesByKey('gr1'))).toBe('[bbbbbb]'); // OneOrMoreLazzyTest.java:55
    expect(javaList(matcher.findValuesByKey('gr2'))).toBe('[e]'); // OneOrMoreLazzyTest.java:56
  });

  it('test61 (OneOrMoreLazzyTest.java:60)', () => {
    const cut = UnicodeBracketedExpression.build(' 〶$gr1=〇l+〘〴w〴w〙   〶$gr2=end  〒$');
    const matcher = cut.match(TextNavigator.build('bbbbbbend'));
    expect(matcher.getAcceptedMatch()).toBe('bbbbbbend'); // OneOrMoreLazzyTest.java:63
    expect(javaList(matcher.findValuesByKey('gr1'))).toBe('[bbbbbb]'); // OneOrMoreLazzyTest.java:64
    expect(javaList(matcher.findValuesByKey('gr2'))).toBe('[e]'); // OneOrMoreLazzyTest.java:65
  });

  it('test70 (OneOrMoreLazzyTest.java:69)', () => {
    const cut = UnicodeBracketedExpression.build(' 〶$gr1=〇l+〘〴w〴w〙  〶$gr2=end  〒$');
    const matcher = cut.match(TextNavigator.build('bbend'));
    expect(matcher.getAcceptedMatch()).toBe('bbend'); // OneOrMoreLazzyTest.java:72
    expect(javaList(matcher.findValuesByKey('gr1'))).toBe('[bb]'); // OneOrMoreLazzyTest.java:73
    expect(javaList(matcher.findValuesByKey('gr2'))).toBe('[e]'); // OneOrMoreLazzyTest.java:74
  });

  it('test71 (OneOrMoreLazzyTest.java:78)', () => {
    const cut = UnicodeBracketedExpression.build('aaaa 〶$gr1=〇l+〘〴w〴w〙   〶$gr2=end  〒$');
    const matcher = cut.match(TextNavigator.build('aaaabbend'));
    expect(matcher.getAcceptedMatch()).toBe('aaaabbend'); // OneOrMoreLazzyTest.java:81
    expect(javaList(matcher.findValuesByKey('gr1'))).toBe('[bb]'); // OneOrMoreLazzyTest.java:82
    expect(javaList(matcher.findValuesByKey('gr2'))).toBe('[e]'); // OneOrMoreLazzyTest.java:83
  });
});
