import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/TwoGroupsTest.java (every assertion; Java line cited per assertion).
describe('TwoGroupsTest', () => {
  it('testTwoGroupsNoGroupMatch (TwoGroupsTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('0〇*〘a〘〇+b〙c〙9');
    const matcher = cut.match(TextNavigator.build('09'));
    expect(matcher.getAcceptedMatch()).toBe('09'); // TwoGroupsTest.java:13
  });

  it('testTwoGroupsMinimalMatch (TwoGroupsTest.java:17)', () => {
    const cut = UnicodeBracketedExpression.build('0〇*〘a〘〇+b〙c〙9');
    const matcher = cut.match(TextNavigator.build('0abbc9'));
    expect(matcher.getAcceptedMatch()).toBe('0abbc9'); // TwoGroupsTest.java:20
  });

  it('testTwoGroupsWithPrefixWildcards (TwoGroupsTest.java:24)', () => {
    const cut = UnicodeBracketedExpression.build('0〇*〘a〘〇+b〙c〙9');
    const matcher = cut.match(TextNavigator.build('0XYZaabc9'));
    expect(matcher.getAcceptedMatch()).toBe(''); // TwoGroupsTest.java:27
  });

  it('testSeveral (TwoGroupsTest.java:31)', () => {
    const cut = UnicodeBracketedExpression.build('0〇*〘a〘〇+b〙c〙9');
    const matcher = cut.match(TextNavigator.build('0abbcabbbbc9'));
    expect(matcher.getAcceptedMatch()).toBe('0abbcabbbbc9'); // TwoGroupsTest.java:34
  });
});
