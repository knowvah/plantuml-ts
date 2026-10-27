import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';
import { javaList } from '../helpers.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/UpToTest.java (every assertion; Java line cited per assertion).
describe('UpToTest', () => {
  it('test10 (UpToTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('a 〄>1');
    expect(cut.match(TextNavigator.build('a000000001')).getAcceptedMatch()).toBe('a000000001'); // UpToTest.java:12
  });

  it('test11 (UpToTest.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('a 〄>1');
    expect(cut.match(TextNavigator.build('a000000001')).getAcceptedMatch()).toBe('a000000001'); // UpToTest.java:18
  });

  it('test20 (UpToTest.java:22)', () => {
    const cut = UnicodeBracketedExpression.build('a 〶$cell=〄>1');
    expect(cut.match(TextNavigator.build('a000000001')).getAcceptedMatch()).toBe('a000000001'); // UpToTest.java:24
    expect(javaList(cut.match(TextNavigator.build('a000000001')).findValuesByKey('cell'))).toBe('[00000000]'); // UpToTest.java:25
  });
});
