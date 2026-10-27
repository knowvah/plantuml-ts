import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/UnnamedGroupTest.java (every assertion; Java line cited per assertion).
describe('UnnamedGroupTest', () => {
  it('testNamedGroupNoMatch (UnnamedGroupTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('a〘〇+b〙c');
    const matcher = cut.match(TextNavigator.build('heo'));
    expect(matcher.getAcceptedMatch()).toBe(''); // UnnamedGroupTest.java:13
    // assertEquals("???", matcher.getNamedCaptures().toString());
  });

  it('testNamedGroupMatchSingleCharacter (UnnamedGroupTest.java:18)', () => {
    const cut = UnicodeBracketedExpression.build('a〘〇+b〙c');
    const matcher = cut.match(TextNavigator.build('abc'));
    expect(matcher.getAcceptedMatch()).toBe('abc'); // UnnamedGroupTest.java:21
    // assertEquals("???", matcher.getNamedCaptures().toString());
  });

  it('testNamedGroupMatchDoubleCharacters (UnnamedGroupTest.java:26)', () => {
    const cut = UnicodeBracketedExpression.build('a〘〇+b〙c');
    const matcher = cut.match(TextNavigator.build('abbc'));
    expect(matcher.getAcceptedMatch()).toBe('abbc'); // UnnamedGroupTest.java:29
    // assertEquals("???", matcher.getNamedCaptures().toString());
  });

  it('testNamedGroupMatchTripleCharacters (UnnamedGroupTest.java:34)', () => {
    const cut = UnicodeBracketedExpression.build('a〘〇+b〙c');
    const matcher = cut.match(TextNavigator.build('abbbc'));
    expect(matcher.getAcceptedMatch()).toBe('abbbc'); // UnnamedGroupTest.java:37
    // assertEquals("???", matcher.getNamedCaptures().toString());
  });
});
