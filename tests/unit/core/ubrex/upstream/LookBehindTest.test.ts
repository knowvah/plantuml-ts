import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/LookBehindTest.java (every assertion; Java line cited per assertion).
describe('LookBehindTest', () => {
  it('test1 (LookBehindTest.java:11)', () => {
    const cut = UnicodeBracketedExpression.build('ab');
    expect(cut.match(TextNavigator.build('ab')).startMatch()).toBe(true); // LookBehindTest.java:13
  });

  it('test2 (LookBehindTest.java:17)', () => {
    const cut = UnicodeBracketedExpression.build('abc');
    expect(cut.match(TextNavigator.build('abc')).startMatch()).toBe(true); // LookBehindTest.java:19
  });

  it('test31 (LookBehindTest.java:23)', () => {
    const cut = UnicodeBracketedExpression.build('〇*「〤_」  _');
    expect(cut.match(TextNavigator.build('abcd_')).startMatch()).toBe(true); // LookBehindTest.java:25
  });

  it('test32 (LookBehindTest.java:29)', () => {
    const cut = UnicodeBracketedExpression.build('〇*「〤_」  〒<!〴d  _');
    expect(cut.match(TextNavigator.build('abcd_')).startMatch()).toBe(true); // LookBehindTest.java:31
    expect(cut.match(TextNavigator.build('_')).startMatch()).toBe(true); // LookBehindTest.java:32
    expect(cut.match(TextNavigator.build('0_')).startMatch()).toBe(false); // LookBehindTest.java:33
  });

  it('test4 (LookBehindTest.java:37)', () => {
    const cut = UnicodeBracketedExpression.build('〇*「〤_」  〒<=〴d  _');
    expect(cut.match(TextNavigator.build('abcd_')).startMatch()).toBe(false); // LookBehindTest.java:39
    expect(cut.match(TextNavigator.build('_')).startMatch()).toBe(false); // LookBehindTest.java:40
    expect(cut.match(TextNavigator.build('0_')).startMatch()).toBe(true); // LookBehindTest.java:41
  });

  it('test5 (LookBehindTest.java:45)', () => {
    const cut = UnicodeBracketedExpression.build('〒<!「〴w」 _');
    expect(cut.match(TextNavigator.build('abc._'), 4).startMatch()).toBe(true); // LookBehindTest.java:47
    expect(cut.match(TextNavigator.build('abcd_'), 4).startMatch()).toBe(false); // LookBehindTest.java:48
    expect(cut.match(TextNavigator.build('d_d'), 1).startMatch()).toBe(false); // LookBehindTest.java:49
    expect(cut.match(TextNavigator.build('_')).startMatch()).toBe(true); // LookBehindTest.java:50
    expect(cut.match(TextNavigator.build('._')).startMatch()).toBe(false); // LookBehindTest.java:51
    expect(cut.match(TextNavigator.build('._'), 1).startMatch()).toBe(true); // LookBehindTest.java:52
    expect(cut.match(TextNavigator.build('0_'), 1).startMatch()).toBe(false); // LookBehindTest.java:53
  });
});
