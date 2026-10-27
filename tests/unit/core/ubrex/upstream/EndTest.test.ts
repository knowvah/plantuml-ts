import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/EndTest.java (every assertion; Java line cited per assertion).
describe('EndTest', () => {
  it('test1 (EndTest.java:11)', () => {
    const cut = UnicodeBracketedExpression.build('ab');
    expect(cut.match(TextNavigator.build('ab')).startMatch()).toBe(true); // EndTest.java:13
  });

  it('test2 (EndTest.java:18)', () => {
    const cut = UnicodeBracketedExpression.build('ab');
    expect(cut.match(TextNavigator.build('abc')).startMatch()).toBe(true); // EndTest.java:20
  });

  it('test3 (EndTest.java:25)', () => {
    const cut = UnicodeBracketedExpression.build('ab 〒$');
    expect(cut.match(TextNavigator.build('ab')).startMatch()).toBe(true); // EndTest.java:27
  });

  it('test4 (EndTest.java:32)', () => {
    const cut = UnicodeBracketedExpression.build('ab 〒$');
    expect(cut.match(TextNavigator.build('abc')).startMatch()).toBe(false); // EndTest.java:34
  });
});
