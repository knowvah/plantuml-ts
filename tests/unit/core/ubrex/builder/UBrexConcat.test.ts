import { describe, expect, it } from 'vitest';
import { UBrexConcat } from '../../../../../src/core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../../../src/core/ubrex/builder/UBrexLeaf.js';

describe('UBrexConcat', () => {
  it('build concatenates the parts in order (UBrexConcat.java:42-49)', () => {
    const cut = UBrexConcat.build(new UBrexLeaf('a'), new UBrexLeaf('b'), new UBrexLeaf('c'));
    expect(cut.match('abc').exactMatch()).toBe(true);
    expect(cut.match('acb').startMatch()).toBe(false);
  });

  it('build of nothing matches the empty prefix (UBrexConcat.java:43 empty loop)', () => {
    const cut = UBrexConcat.build();
    expect(cut.match('xyz').getAcceptedMatch()).toBe('');
    expect(cut.match('xyz').startMatch()).toBe(true);
    expect(cut.match('').exactMatch()).toBe(true);
  });

  it('a concat nests inside a concat (UBrexConcat.java:45)', () => {
    const inner = UBrexConcat.build(new UBrexLeaf('b'), new UBrexLeaf('c'));
    const cut = UBrexConcat.build(new UBrexLeaf('a'), inner, new UBrexLeaf('d'));
    expect(cut.match('abcd').exactMatch()).toBe(true);
  });
});
