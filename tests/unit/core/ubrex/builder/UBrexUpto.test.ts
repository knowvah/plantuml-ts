import { describe, expect, it } from 'vitest';
import { UBrexConcat } from '../../../../../src/core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../../../src/core/ubrex/builder/UBrexNamed.js';
import { UBrexUpto } from '../../../../../src/core/ubrex/builder/UBrexUpto.js';

describe('UBrexUpto', () => {
  it('consumes what up to and including stop (UBrexUpto.java:46-54)', () => {
    const cut = new UBrexUpto(new UBrexLeaf('〴D'), new UBrexLeaf('end'));
    expect(cut.match('-- end').getAcceptedMatch()).toBe('-- end');
    expect(cut.match('-- end').exactMatch()).toBe(true);
  });

  it('fails when stop never appears', () => {
    const cut = new UBrexUpto(new UBrexLeaf('〴D'), new UBrexLeaf('end'));
    expect(cut.match('-- fin').startMatch()).toBe(false);
  });

  it('TimeResolution.toUbrexA shape: DD <non-digits> MONTH <non-digits> YYYY (TimeResolution.java:48-57)', () => {
    const month = new UBrexLeaf('【jan┇feb┇mar】');
    const cut = UBrexConcat.build(
      new UBrexNamed('D', new UBrexLeaf('〇{1-2}〴d')),
      new UBrexUpto(new UBrexLeaf('〴D'), new UBrexNamed('M', month)),
      new UBrexLeaf('〇+〴D'),
      new UBrexNamed('Y', new UBrexLeaf('〇{1-4}〴d')),
    );
    const m = cut.match('12 of feb in 2020', 0);
    expect(m.exactMatch()).toBe(true);
    expect(m.findFirstValueByKey('D')).toBe('12');
    expect(m.findFirstValueByKey('M')).toBe('feb');
    expect(m.findFirstValueByKey('Y')).toBe('2020');
  });
});
