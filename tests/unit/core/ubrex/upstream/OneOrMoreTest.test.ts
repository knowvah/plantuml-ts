import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/OneOrMoreTest.java (every assertion; Java line cited per assertion).
describe('OneOrMoreTest', () => {
  it('testPatternTrieMatchingInvalidMatch (OneOrMoreTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('he〇+lo');
    expect(cut.match(TextNavigator.build('heo')).getAcceptedMatch()).toBe(''); // OneOrMoreTest.java:12
  });

  it('testPatternTrieMatchingHelo (OneOrMoreTest.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('he〇+lo');
    expect(cut.match(TextNavigator.build('helo')).getAcceptedMatch()).toBe('helo'); // OneOrMoreTest.java:18
  });

  it('testPatternTrieMatchingHello (OneOrMoreTest.java:22)', () => {
    const cut = UnicodeBracketedExpression.build('he〇+lo');
    expect(cut.match(TextNavigator.build('hello')).getAcceptedMatch()).toBe('hello'); // OneOrMoreTest.java:24
  });

  it('testPatternTrieMatchingHelllo (OneOrMoreTest.java:28)', () => {
    const cut = UnicodeBracketedExpression.build('he〇+lo');
    expect(cut.match(TextNavigator.build('helllo')).getAcceptedMatch()).toBe('helllo'); // OneOrMoreTest.java:30
  });
});
