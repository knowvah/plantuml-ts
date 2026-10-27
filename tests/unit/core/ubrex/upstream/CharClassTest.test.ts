import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/CharClassTest.java (every assertion; Java line cited per assertion).
describe('CharClassTest', () => {
  it('test1 (CharClassTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('〴w');
    expect(cut.match(TextNavigator.build('h')).getAcceptedMatch()).toBe('h'); // CharClassTest.java:12
  });

  it('test2 (CharClassTest.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〴w');
    expect(cut.match(TextNavigator.build('aaé')).getAcceptedMatch()).toBe('aa'); // CharClassTest.java:18
    expect(cut.match(TextNavigator.build('h')).getAcceptedMatch()).toBe('h'); // CharClassTest.java:19
    expect(cut.match(TextNavigator.build('ab')).getAcceptedMatch()).toBe('ab'); // CharClassTest.java:20
    expect(cut.match(TextNavigator.build('abc')).getAcceptedMatch()).toBe('abc'); // CharClassTest.java:21
  });
});
