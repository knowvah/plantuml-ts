import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';
import { javaList } from '../helpers.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/NamedGroup2Test.java (every assertion; Java line cited per assertion).
describe('NamedGroup2Test', () => {
  it('testNamedGroup10 (NamedGroup2Test.java:11)', () => {
    const cut = UnicodeBracketedExpression.build('〶$gr=〘 〇*〴s  〇+〴d 〙');
    const matcher = cut.match(TextNavigator.build('000'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:14
    // assertEquals("{gr=000}", matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('gr'))).toBe('[000]'); // NamedGroup2Test.java:16
  });

  it('testNamedGroup20 (NamedGroup2Test.java:20)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘 〇*〴s  〶$num=〇+〴d 〙');
    const matcher = cut.match(TextNavigator.build('123 456'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:23
    // assertEquals("{num=[123, 456]}", matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('num'))).toBe('[123, 456]'); // NamedGroup2Test.java:25
  });

  it('testNamedGroup21 (NamedGroup2Test.java:29)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘 〇*〴s  〶$num=〇+〴d 〙');
    const matcher = cut.match(TextNavigator.build('123 456 789'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:32
    // assertEquals("{num=[123, 456, 789]}", matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('num'))).toBe('[123, 456, 789]'); // NamedGroup2Test.java:34
  });

  it('testNamedGroup30 (NamedGroup2Test.java:38)', () => {
    const cut = UnicodeBracketedExpression.build('〶$gr=〇+〘 〇*〴s  〶$num=〇+〴d 〙');
    const matcher = cut.match(TextNavigator.build('123 456'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:41
    // assertEquals("{gr={num=[123, 456], =123 456}}", matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('gr'))).toBe('[123 456]'); // NamedGroup2Test.java:43
    expect(javaList(matcher.findValuesByKey('gr/num'))).toBe('[123, 456]'); // NamedGroup2Test.java:44
  });

  it('testNamedGroup00 (NamedGroup2Test.java:48)', () => {
    const cut = UnicodeBracketedExpression.build('〘 〇*〴s  〶$num=〇+〴d 〙');
    const matcher = cut.match(TextNavigator.build('123 456'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:51
    // assertEquals("{num=123}", matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('num'))).toBe('[123]'); // NamedGroup2Test.java:53
  });

  it('testNamedGroup01 (NamedGroup2Test.java:57)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘 〇*〴s  〶$num=〇+〴d 〙');
    const matcher = cut.match(TextNavigator.build('123 456'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:60
    // assertEquals("{num=[123, 456]}", matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('num'))).toBe('[123, 456]'); // NamedGroup2Test.java:62
  });

  it('testNamedGroup02 (NamedGroup2Test.java:66)', () => {
    const cut = UnicodeBracketedExpression.build(' 〶$gr=〘 〇*〴s  〶$num=〇+〴d 〙');
    const matcher = cut.match(TextNavigator.build('123 456'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:69
    // assertEquals("{gr={num=123, =123}}", matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('gr'))).toBe('[123]'); // NamedGroup2Test.java:71
    expect(javaList(matcher.findValuesByKey('gr/num'))).toBe('[123]'); // NamedGroup2Test.java:72
  });

  it('testNamedGroup31 (NamedGroup2Test.java:76)', () => {
    const cut = UnicodeBracketedExpression.build('〶$gr=〇+〘 〇*〴s  〶$num=〇+〴d  〶$letter=〇*「a〜z」 〙');
    const matcher = cut.match(TextNavigator.build('123qsd 456 0ccc 0'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:79
    //		assertEquals("{gr={num=[123, 456, 0, 0], letter=[qsd, , ccc, ], =123qsd 456 0ccc 0}}",
    //				matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('gr'))).toBe('[123qsd 456 0ccc 0]'); // NamedGroup2Test.java:82
    expect(javaList(matcher.findValuesByKey('gr/num'))).toBe('[123, 456, 0, 0]'); // NamedGroup2Test.java:83
    expect(javaList(matcher.findValuesByKey('gr/letter'))).toBe('[qsd, , ccc, ]'); // NamedGroup2Test.java:84
  });

  it('testNamedGroup32 (NamedGroup2Test.java:88)', () => {
    const cut = UnicodeBracketedExpression.build('〶$gr=〇+〘 〇*「〴s_」  〶$num=〇+〴d  〶$letter=〇*「a〜z」 〙');
    const matcher = cut.match(TextNavigator.build('123qsd 456 0ccc 0'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:91
    //		assertEquals("{gr={num=[123, 456, 0, 0], letter=[qsd, , ccc, ], =123qsd 456 0ccc 0}}",
    //				matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('gr'))).toBe('[123qsd 456 0ccc 0]'); // NamedGroup2Test.java:94
    expect(javaList(matcher.findValuesByKey('gr/num'))).toBe('[123, 456, 0, 0]'); // NamedGroup2Test.java:95
    expect(javaList(matcher.findValuesByKey('gr/letter'))).toBe('[qsd, , ccc, ]'); // NamedGroup2Test.java:96
  });

  it('testNamedGroup33 (NamedGroup2Test.java:100)', () => {
    const cut = UnicodeBracketedExpression.build(
      '〇+〘 *  〶$gr=〇+〘 〇*「〴s_」  〶$num=〇+〴d  〶$letter=〇*「a〜z」 〙   〙',
    );
    const matcher = cut.match(TextNavigator.build('*123qsd 456 1ccc 2*3aa'));
    expect(matcher.startMatch()).toBe(true); // NamedGroup2Test.java:104
    //		assertEquals("{gr={num=[123, 456, 0, 0], letter=[qsd, , ccc, ], =123qsd 456 0ccc 0}}",
    //				matcher.getNamedCaptures().toString());
    expect(javaList(matcher.findValuesByKey('gr'))).toBe('[123qsd 456 1ccc 2, 3aa]'); // NamedGroup2Test.java:107
    expect(javaList(matcher.findValuesByKey('gr/num'))).toBe('[123, 456, 1, 2, 3]'); // NamedGroup2Test.java:108
    expect(javaList(matcher.findValuesByKey('gr/letter'))).toBe('[qsd, , ccc, , aa]'); // NamedGroup2Test.java:109
  });
});
