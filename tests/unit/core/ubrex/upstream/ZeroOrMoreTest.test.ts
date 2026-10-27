import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/ZeroOrMoreTest.java (every assertion; Java line cited per assertion).
describe('ZeroOrMoreTest', () => {
  it('testPatternTrieMatchingHeo (ZeroOrMoreTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('he〇*lo');
    expect(cut.match(TextNavigator.build('heo')).getAcceptedMatch()).toBe('heo'); // ZeroOrMoreTest.java:12
  });

  it('testPatternTrieMatchingHelo (ZeroOrMoreTest.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('he〇*lo');
    expect(cut.match(TextNavigator.build('helo')).getAcceptedMatch()).toBe('helo'); // ZeroOrMoreTest.java:18
  });

  it('testPatternTrieMatchingHello (ZeroOrMoreTest.java:22)', () => {
    const cut = UnicodeBracketedExpression.build('he〇*lo');
    expect(cut.match(TextNavigator.build('hello')).getAcceptedMatch()).toBe('hello'); // ZeroOrMoreTest.java:24
  });
});
