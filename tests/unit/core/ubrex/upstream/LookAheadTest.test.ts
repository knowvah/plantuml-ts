import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/LookAheadTest.java (every assertion; Java line cited per assertion).
describe('LookAheadTest', () => {
  it('test1 (LookAheadTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('ab');
    expect(cut.match(TextNavigator.build('ab')).getAcceptedMatch()).toBe('ab'); // LookAheadTest.java:12
  });

  it('test2 (LookAheadTest.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('ab');
    expect(cut.match(TextNavigator.build('abc')).getAcceptedMatch()).toBe('ab'); // LookAheadTest.java:18
  });

  it('test3 (LookAheadTest.java:22)', () => {
    const cut = UnicodeBracketedExpression.build('a 〒=b');
    expect(cut.match(TextNavigator.build('abc')).getAcceptedMatch()).toBe('a'); // LookAheadTest.java:24
    expect(cut.match(TextNavigator.build('ab')).getAcceptedMatch()).toBe('a'); // LookAheadTest.java:25
    expect(cut.match(TextNavigator.build('a')).getAcceptedMatch()).toBe(''); // LookAheadTest.java:26
    expect(cut.match(TextNavigator.build('aa')).getAcceptedMatch()).toBe(''); // LookAheadTest.java:27
  });

  it('test4 (LookAheadTest.java:31)', () => {
    const cut = UnicodeBracketedExpression.build('a 〒!b');
    expect(cut.match(TextNavigator.build('abc')).getAcceptedMatch()).toBe(''); // LookAheadTest.java:33
    expect(cut.match(TextNavigator.build('ab')).getAcceptedMatch()).toBe(''); // LookAheadTest.java:34
    expect(cut.match(TextNavigator.build('a')).getAcceptedMatch()).toBe('a'); // LookAheadTest.java:35
    expect(cut.match(TextNavigator.build('aa')).getAcceptedMatch()).toBe('a'); // LookAheadTest.java:36
  });
});
