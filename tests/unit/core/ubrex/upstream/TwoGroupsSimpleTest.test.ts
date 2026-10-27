import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/TwoGroupsSimpleTest.java (every assertion; Java line cited per assertion).
describe('TwoGroupsSimpleTest', () => {
  it('testNoMatch (TwoGroupsSimpleTest.java:11)', () => {
    const cut = UnicodeBracketedExpression.build('0〘a〘〇+b〙c〙9');
    const matcher = cut.match(TextNavigator.build('09'));
    expect(matcher.getAcceptedMatch()).toBe(''); // TwoGroupsSimpleTest.java:14
  });

  it('testTwoGroupsGroupMatch (TwoGroupsSimpleTest.java:18)', () => {
    const cut = UnicodeBracketedExpression.build('0〘a〘〇+b〙c〙9');
    const matcher = cut.match(TextNavigator.build('0abc9'));
    expect(matcher.getAcceptedMatch()).toBe('0abc9'); // TwoGroupsSimpleTest.java:21
  });

  it('testTwoGroupsGroupMatch2 (TwoGroupsSimpleTest.java:26)', () => {
    const cut = UnicodeBracketedExpression.build('0〘a〘〇+b〙c〙9');
    const matcher = cut.match(TextNavigator.build('0abbbc9'));
    expect(matcher.getAcceptedMatch()).toBe('0abbbc9'); // TwoGroupsSimpleTest.java:29
  });
});
