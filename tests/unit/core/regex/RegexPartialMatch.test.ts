import { describe, expect, it } from 'vitest';
import { RegexPartialMatch } from '../../../../src/core/regex/RegexPartialMatch.js';

describe('RegexPartialMatch', () => {
  it('starts empty (RegexPartialMatch.java:46)', () => {
    const m = new RegexPartialMatch('NAME');
    expect(m.size()).toBe(0);
    expect(m.toString()).toBe('{[]}');
  });

  it('add/size/get keep insertion order (RegexPartialMatch.java:52-62)', () => {
    const m = new RegexPartialMatch('NAME');
    m.add('a');
    m.add(undefined);
    m.add('c');
    expect(m.size()).toBe(3);
    expect(m.get(0)).toBe('a');
    expect(m.get(1)).toBeUndefined();
    expect(m.get(2)).toBe('c');
  });

  it('get out of range is IndexOutOfBounds -> RangeError (ArrayList#get)', () => {
    const m = new RegexPartialMatch('NAME');
    m.add('a');
    expect(() => m.get(1)).toThrow(new RangeError('Index 1 out of bounds for length 1'));
    expect(() => m.get(-1)).toThrow(RangeError);
  });

  it('iterates the entries (RegexPartialMatch.java:64-66)', () => {
    const m = new RegexPartialMatch('NAME');
    m.add('a');
    m.add(undefined);
    expect([...m]).toEqual(['a', undefined]);
  });

  it('toString is "{" + List#toString + "}" with null (RegexPartialMatch.java:68-70)', () => {
    const m = new RegexPartialMatch('NAME');
    m.add('a');
    m.add(undefined);
    expect(m.toString()).toBe('{[a, null]}');
  });
});
