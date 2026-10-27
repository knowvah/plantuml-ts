import { describe, expect, it } from 'vitest';
import { ComplementFromTo } from '../../../../src/diagrams/gantt/lang/ComplementFromTo.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementFromTo.java:48-64.
const complement = new ComplementFromTo();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementFromTo', () => {
  it.each(['from [A] to [B]', 'from  [Prototype design]  to  [Test prototype]', 'from [a b/c] to [d]'])(
    'accepts %s (java:50-57)',
    (s) => {
      expect(parse(s).exactMatch()).toBe(true);
    },
  );

  it.each(['from [A]', 'from [A] to', 'from A to B', 'from [A] [B]', 'to [A] from [B]', 'from [] to [B]'])(
    'rejects %s (java:50-57)',
    (s) => {
      expect(parse(s).exactMatch()).toBe(false);
    },
  );

  it('captures the two task codes under COMPLEMENT1 and COMPLEMENT2 (java:53,56)', () => {
    const m = parse('from [Prototype design] to [Test prototype]');
    expect(m.findFirstValueByKey('COMPLEMENT1')).toBe('Prototype design');
    expect(m.findFirstValueByKey('COMPLEMENT2')).toBe('Test prototype');
  });

  it('getMe returns both names (java:59-64)', () => {
    const r = complement.getMe(newGantt(), parse('from [A] to [B]'));
    expect(r.isFail()).toBe(false);
    expect(r.get().getName1()).toBe('A');
    expect(r.get().getName2()).toBe('B');
  });
});
