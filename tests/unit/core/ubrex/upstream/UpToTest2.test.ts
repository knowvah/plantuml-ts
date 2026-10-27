import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';
import { javaList } from '../helpers.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/UpToTest2.java (every assertion; Java line cited per assertion).
describe('UpToTest2', () => {
  it('test1 (UpToTest2.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('〄+〴w->z');
    expect(cut.match(TextNavigator.build('abcdzedf')).getAcceptedMatch()).toBe('abcdz'); // UpToTest2.java:12
  });

  it('test2 (UpToTest2.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('〄+〴w -> z');
    expect(cut.match(TextNavigator.build('abcdzedf')).getAcceptedMatch()).toBe('abcdz'); // UpToTest2.java:18
  });

  it('test3 (UpToTest2.java:22)', () => {
    const cut = UnicodeBracketedExpression.build('〄+〶$txt=〴w -> z');
    expect(cut.match(TextNavigator.build('abcdzedf')).getAcceptedMatch()).toBe('abcdz'); // UpToTest2.java:24
    expect(javaList(cut.match(TextNavigator.build('abcdzedf')).findValuesByKey('txt'))).toBe('[a, b, c, d]'); // UpToTest2.java:25
  });

  it('test4 (UpToTest2.java:30)', () => {
    const cut = UnicodeBracketedExpression.build('〶$txt=〄+〴w -> z');
    // assertEquals("abcdz", cut.getMatcher(TextNavigator.build("abcdzedf")).getAcceptedMatch());
    expect(javaList(cut.match(TextNavigator.build('abcdzedf')).findValuesByKey('txt'))).toBe('[abcd]'); // UpToTest2.java:33
  });

  it('test5 (UpToTest2.java:38)', () => {
    const cut = UnicodeBracketedExpression.build('Z〶$txt=〄+〴w -> Z');
    expect(cut.match(TextNavigator.build('ZabcdZedf')).getAcceptedMatch()).toBe('ZabcdZ'); // UpToTest2.java:40
    expect(javaList(cut.match(TextNavigator.build('ZabcdZedf')).findValuesByKey('txt'))).toBe('[abcd]'); // UpToTest2.java:41
  });

  it('test6 (UpToTest2.java:46)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘 Z〶$txt=〄+〴w -> Z 〇*〴s 〙');
    expect(cut.match(TextNavigator.build('ZabcdZedf')).getAcceptedMatch()).toBe('ZabcdZ'); // UpToTest2.java:48
    expect(javaList(cut.match(TextNavigator.build('ZabcdZedf')).findValuesByKey('txt'))).toBe('[abcd]'); // UpToTest2.java:49
  });

  it('test7 (UpToTest2.java:53)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘 Z〶$txt=〄+〴w -> Z 〇*〴s 〙');
    expect(cut.match(TextNavigator.build('ZabcdZ ZedfZ')).getAcceptedMatch()).toBe('ZabcdZ ZedfZ'); // UpToTest2.java:55
    expect(javaList(cut.match(TextNavigator.build('ZabcdZ ZedfZ')).findValuesByKey('txt'))).toBe('[abcd, edf]'); // UpToTest2.java:56
  });

  it('test8 (UpToTest2.java:60)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘 Z〄+〶$txt=〴w -> Z 〇*〴s 〙');
    expect(cut.match(TextNavigator.build('ZabcdZ ZedfZ')).getAcceptedMatch()).toBe('ZabcdZ ZedfZ'); // UpToTest2.java:62
    expect(javaList(cut.match(TextNavigator.build('ZabcdZ ZedfZ')).findValuesByKey('txt'))).toBe(
      '[a, b, c, d, e, d, f]',
    ); // UpToTest2.java:63
  });
});
