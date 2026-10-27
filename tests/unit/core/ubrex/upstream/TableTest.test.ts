import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';
import { javaList } from '../helpers.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/TableTest.java (every assertion; Java line cited per assertion).
describe('TableTest', () => {
  it('test1 (TableTest.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('| 〇+〘 〇*〴s  〶$cell=〇*「〤|」  〇*〴s  | 〙');

    expect(cut.match(TextNavigator.build('|a|')).getAcceptedMatch()).toBe('|a|'); // TableTest.java:13
    expect(javaList(cut.match(TextNavigator.build('|a|')).findValuesByKey('cell'))).toBe('[a]'); // TableTest.java:14
  });
});
