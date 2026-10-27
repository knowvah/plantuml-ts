import { describe, expect, it } from 'vitest';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/LookAheadTest3.java (every assertion; Java line cited per assertion).
describe('LookAheadTest3', () => {
  it('test1 (LookAheadTest3.java:10)', () => {
    const cut = UnicodeBracketedExpression.build('a【 ; ┇ 〒!「〴w;:.」 】');
    expect(cut.match('a;', 0).getAcceptedMatch()).toBe('a;'); // LookAheadTest3.java:12
  });

  it('test2 (LookAheadTest3.java:16)', () => {
    const cut = UnicodeBracketedExpression.build('a【 ; ┇ 〒!「〴w;:.」 】');
    expect(cut.match('a,', 0).getAcceptedMatch()).toBe('a'); // LookAheadTest3.java:18
  });

  it('test3 (LookAheadTest3.java:22)', () => {
    const cut = UnicodeBracketedExpression.build('a【 ; ┇ 〒!「〴w;:.」 】');
    expect(cut.match('a.', 0).getAcceptedMatch()).toBe(''); // LookAheadTest3.java:24
  });
});
