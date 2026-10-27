import { describe, expect, it } from 'vitest';
import { UBrexLeaf } from '../../../../../src/core/ubrex/builder/UBrexLeaf.js';

describe('UBrexLeaf', () => {
  it('constructor parses the definition (UBrexLeaf.java:36)', () => {
    expect(new UBrexLeaf('〇+〴d').match('123x').getAcceptedMatch()).toBe('123');
  });

  it('end() is 〒$ (UBrexLeaf.java:39-41)', () => {
    expect(UBrexLeaf.end().match('', 0).exactMatch()).toBe(true);
    expect(UBrexLeaf.end().match('a', 0).startMatch()).toBe(false);
  });

  it('spaceOneOrMore() is 〇+〴s (UBrexLeaf.java:43-45)', () => {
    expect(UBrexLeaf.spaceOneOrMore().match('  x').getAcceptedMatch()).toBe('  ');
    expect(UBrexLeaf.spaceOneOrMore().match('x').startMatch()).toBe(false);
  });

  it('spaceZeroOrMore() is 〇*〴s (UBrexLeaf.java:47-49)', () => {
    expect(UBrexLeaf.spaceZeroOrMore().match('  x').getAcceptedMatch()).toBe('  ');
    expect(UBrexLeaf.spaceZeroOrMore().match('x').exactMatch()).toBe(false);
    expect(UBrexLeaf.spaceZeroOrMore().match('x').startMatch()).toBe(true);
  });

  it('an empty definition is rejected as CompositeList does (CompositeList.java UnsupportedOperationException)', () => {
    expect(() => new UBrexLeaf('')).toThrow('UnsupportedOperationException');
  });
});
