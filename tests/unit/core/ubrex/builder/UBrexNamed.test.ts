import { describe, expect, it } from 'vitest';
import { UBrexConcat } from '../../../../../src/core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../../../src/core/ubrex/builder/UBrexNamed.js';
import { UBrexUpto } from '../../../../../src/core/ubrex/builder/UBrexUpto.js';

describe('UBrexNamed', () => {
  it('captures the part under the name (UBrexNamed.java:51-58)', () => {
    const cut = new UBrexNamed('N', new UBrexLeaf('〇+〴d'));
    const m = cut.match('123x');
    expect(m.findValuesByKey('N')).toEqual(['123']);
    expect(m.findFirstValueByKey('N')).toBe('123');
  });

  it('an unrelated key has no value (UMatcher default findFirstValueByKey)', () => {
    const m = new UBrexNamed('N', new UBrexLeaf('a')).match('a');
    expect(m.findValuesByKey('OTHER')).toEqual([]);
    expect(m.findFirstValueByKey('OTHER')).toBeUndefined();
  });

  it('an UBrexUpto origin is unwrapped to its challenge list (UBrexNamed.java:44-48)', () => {
    const upto = new UBrexUpto(new UBrexLeaf('〴D'), new UBrexLeaf('end'));
    const cut = UBrexConcat.build(new UBrexLeaf('1'), new UBrexNamed('U', upto));
    const m = cut.match('1-- end');
    expect(m.exactMatch()).toBe(true);
    expect(m.findValuesByKey('U')).toEqual(['-- end']);
  });
});
