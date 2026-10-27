import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/OptionalTest.java (every assertion; Java line cited per assertion).
describe('OptionalTest', () => {
  it('testPatternTrieMatchingHeo (OptionalTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('he〇?lo');
    expect(cut.match(TextNavigator.build('heo')).getAcceptedMatch()).toBe('heo'); // OptionalTest.java:12
  });

  it('testPatternTrieMatchingHelo (OptionalTest.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('he〇?lo');
    expect(cut.match(TextNavigator.build('helo')).getAcceptedMatch()).toBe('helo'); // OptionalTest.java:18
  });

  it('testPatternTrieMatchingHello (OptionalTest.java:22)', () => {
    const cut = UnicodeBracketedExpression.build('he〇?lo');
    expect(cut.match(TextNavigator.build('hello')).getAcceptedMatch()).toBe(''); // OptionalTest.java:24
  });
});
