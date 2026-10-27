import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/Test1.java (every assertion; Java line cited per assertion).
describe('Test1', () => {
  it('test1 (Test1.java:10)', () => {
    const cut = UnicodeBracketedExpression.build(
      'if 〇*〴s 〴g  〶$IF1=〇*〴G 〴g 〇*〴s 〇?〘as 〇+〴s 〶$ASIF1=〇+「〴an_.」 〇+〴s 〙  〇?〘then〙',
    );
    const matcher = cut.match(TextNavigator.build('if "" then'));
    expect(matcher.getAcceptedMatch()).toBe('if "" then'); // Test1.java:13
  });
});
