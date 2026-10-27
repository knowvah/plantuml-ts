import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/LookAheadTest2.java (every assertion; Java line cited per assertion).
describe('LookAheadTest2', () => {
  it('test1a (LookAheadTest2.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘「〤|」  〒=Z 〙');
    expect(cut.match(TextNavigator.build('bZ')).getAcceptedMatch()).toBe('b'); // LookAheadTest2.java:12
  });

  it('test4a (LookAheadTest2.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘「〤|」  〒=Z 〙');
    expect(cut.match(TextNavigator.build('bZZ')).getAcceptedMatch()).toBe('bZ'); // LookAheadTest2.java:18
  });

  it('test4 (LookAheadTest2.java:22)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘「〤|」  〒!Z 〙');
    expect(cut.match(TextNavigator.build('bbbZ')).getAcceptedMatch()).toBe('bb'); // LookAheadTest2.java:24
  });

  it('test5 (LookAheadTest2.java:28)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘「〤|」  〒!〘a | 〙 〙');
    expect(cut.match(TextNavigator.build('bbbZ')).getAcceptedMatch()).toBe('bbbZ'); // LookAheadTest2.java:30
  });

  it('test6 (LookAheadTest2.java:34)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘「〤|」  〒!〘a | 〙 〙');
    expect(cut.match(TextNavigator.build('bbbZ|')).getAcceptedMatch()).toBe('bbbZ'); // LookAheadTest2.java:36
  });

  it('test7 (LookAheadTest2.java:40)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘「〤|」  〒!〘a | 〙 〙');
    expect(cut.match(TextNavigator.build('babbZ|')).getAcceptedMatch()).toBe('babbZ'); // LookAheadTest2.java:42
  });

  it('test8 (LookAheadTest2.java:46)', () => {
    const cut = UnicodeBracketedExpression.build('〇+〘「〤|」  〒!〘〇+a | 〙 〙');
    expect(cut.match(TextNavigator.build('123a|')).getAcceptedMatch()).toBe('12'); // LookAheadTest2.java:48
  });
});
