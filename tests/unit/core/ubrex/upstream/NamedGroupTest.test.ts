import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';
import { javaList } from '../helpers.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/NamedGroupTest.java (every assertion; Java line cited per assertion).
describe('NamedGroupTest', () => {
  it('testNamedGroupNoMatch (NamedGroupTest.java:11)', () => {
    const cut = UnicodeBracketedExpression.build('a  〶$group1=〘〇+b〙c');
    const matcher = cut.match(TextNavigator.build('heo'));
    expect(matcher.getAcceptedMatch()).toBe(''); // NamedGroupTest.java:14
    expect(javaList(matcher.findValuesByKey('group1'))).toBe('[]'); // NamedGroupTest.java:15
  });

  it('testNamedGroupMatchSingleCharacter (NamedGroupTest.java:19)', () => {
    const cut = UnicodeBracketedExpression.build('a  〶$group1=〘〇+b〙c');
    const matcher = cut.match(TextNavigator.build('abc'));
    expect(matcher.getAcceptedMatch()).toBe('abc'); // NamedGroupTest.java:22
    expect(javaList(matcher.findValuesByKey('group1'))).toBe('[b]'); // NamedGroupTest.java:23
  });

  it('testNamedGroupMatchDoubleCharacters (NamedGroupTest.java:27)', () => {
    const cut = UnicodeBracketedExpression.build('a  〶$group1=〘〇+b〙c');
    const matcher = cut.match(TextNavigator.build('abbc'));
    expect(matcher.getAcceptedMatch()).toBe('abbc'); // NamedGroupTest.java:30
    expect(javaList(matcher.findValuesByKey('group1'))).toBe('[bb]'); // NamedGroupTest.java:31
  });

  it('testNamedGroupMatchTripleCharacters (NamedGroupTest.java:35)', () => {
    const cut = UnicodeBracketedExpression.build('a  〶$group1=〘〇+b〙c');
    const matcher = cut.match(TextNavigator.build('abbbc'));
    expect(matcher.getAcceptedMatch()).toBe('abbbc'); // NamedGroupTest.java:38
    expect(javaList(matcher.findValuesByKey('group1'))).toBe('[bbb]'); // NamedGroupTest.java:39
  });
});
