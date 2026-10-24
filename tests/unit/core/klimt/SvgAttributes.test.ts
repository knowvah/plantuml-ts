/**
 * SvgAttributes.test.ts — `klimt/SvgAttributes.java:44-100`.
 */
import { describe, expect, it } from 'vitest';
import { SvgAttributes } from '../../../../src/core/klimt/SvgAttributes.js';

describe('SvgAttributes.build (SvgAttributes.java:63-73)', () => {
  it('keys come out in TreeMap order whatever the source order', () => {
    // `attributes` is a `TreeMap` (java:46): String#compareTo, so 'Z' < 'a'.
    const built = SvgAttributes.build('id=dummy class=foo Zed=1 abc=2');
    expect([...built.attributes()]).toEqual([
      ['Zed', '1'],
      ['abc', '2'],
      ['class', 'foo'],
      ['id', 'dummy'],
    ]);
  });

  it('reads quoted values with spaces, around an optional "="-padding (pattern java:61)', () => {
    // `\w+` stops at '-', so `data-x` yields the key `x` (java:61).
    const built = SvgAttributes.build('data-x = "a b c"  title="t"');
    expect([...built.attributes()]).toEqual([
      ['title', 't'],
      ['x', 'a b c'],
    ]);
  });

  it('strips curly and guillemet quotes through eventuallyRemoveStartingAndEndingDoubleQuote', () => {
    // `[%g]` = " U+201C U+201D U+E121 (Pattern2.java TRANSFORM); the strip
    // (StringUtils.java:93-95) also accepts U+00AB/U+00BB, which `[%g]`
    // never lets through, so only the matched pairs below can occur.
    const built = SvgAttributes.build('a=“x y” b="z"');
    expect([...built.attributes()]).toEqual([
      ['a', 'x y'],
      ['b', 'z'],
    ]);
  });

  it('the last duplicate wins (TreeMap#put) and the empty string builds the empty map', () => {
    expect([...SvgAttributes.build('a=1 a=2').attributes()]).toEqual([['a', '2']]);
    expect(SvgAttributes.build('').attributes().size).toBe(0);
    expect(SvgAttributes.empty().attributes().size).toBe(0);
  });
});

describe('SvgAttributes#add (SvgAttributes.java:80-92)', () => {
  it('returns a clone and leaves the receiver untouched', () => {
    const base = SvgAttributes.build('b=1');
    const keyed = base.add('a', '0');
    const merged = base.add(SvgAttributes.build('b=2 c=3'));
    expect([...base.attributes()]).toEqual([['b', '1']]);
    expect([...keyed.attributes()]).toEqual([
      ['a', '0'],
      ['b', '1'],
    ]);
    expect([...merged.attributes()]).toEqual([
      ['b', '2'],
      ['c', '3'],
    ]);
  });
});
