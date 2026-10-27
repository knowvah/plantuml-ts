import { describe, expect, it } from 'vitest';
import { RegexPartialMatch } from '../../../../src/core/regex/RegexPartialMatch.js';
import { RegexResult } from '../../../../src/core/regex/RegexResult.js';
import { UBrexConcat } from '../../../../src/core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../../src/core/ubrex/builder/UBrexNamed.js';
import { UBrexOr } from '../../../../src/core/ubrex/builder/UBrexOr.js';
import type { UMatcher } from '../../../../src/core/ubrex/UMatcher.js';

function partial(...values: (string | undefined)[]): RegexPartialMatch {
  const p = new RegexPartialMatch('x');
  for (const v of values) p.add(v);
  return p;
}

function mapResult(): RegexResult {
  return RegexResult.fromMap(
    new Map([
      ['NAME', partial('foo', 'bar')],
      ['NAME2', partial(undefined, 'baz')],
      ['OTHER', partial('o')],
    ]),
  );
}

function matcherResult(): { result: RegexResult; matcher: UMatcher } {
  const cut = UBrexConcat.build(
    new UBrexNamed('K', new UBrexLeaf('〇+〴d')),
    new UBrexLeaf(','),
    new UBrexNamed('K', new UBrexLeaf('〇+〴d')),
    new UBrexOr(new UBrexNamed('KP_A', new UBrexLeaf('x')), new UBrexNamed('KP_B', new UBrexLeaf('y'))),
  );
  const matcher = cut.match('12,34x', 0);
  return { result: RegexResult.fromUMatcher(matcher), matcher };
}

describe('RegexResult (Map-backed, RegexResult.java:53-57)', () => {
  it('getUMatcher is undefined (:50-52)', () => {
    expect(mapResult().getUMatcher()).toBeUndefined();
  });

  it('get(key) returns the partial match, undefined when absent (:70-74)', () => {
    const r = mapResult();
    expect(r.get('NAME')?.size()).toBe(2);
    expect(r.get('NOPE')).toBeUndefined();
  });

  it('get(key, num) reads the nth capture, undefined for an unknown key (:76-90)', () => {
    const r = mapResult();
    expect(r.get('NAME', 1)).toBe('bar');
    expect(r.get('NAME2', 0)).toBeUndefined();
    expect(r.get('NOPE', 0)).toBeUndefined();
  });

  it('get(key, num) out of range throws RangeError (RegexPartialMatch#get)', () => {
    expect(() => mapResult().get('NAME', 2)).toThrow(RangeError);
  });

  it('getLazzy returns the first non-null capture num among keys with the prefix (:92-111)', () => {
    const r = mapResult();
    expect(r.getLazzy('NAME', 0)).toBe('foo'); // NAME[0] first
    expect(r.getLazzy('NAME2', 0)).toBeUndefined(); // NAME2[0] is null, no other NAME2* key
    expect(r.getLazzy('NAME', 1)).toBe('bar');
    expect(r.getLazzy('OTH', 0)).toBe('o');
  });

  it('getLazzy skips keys whose list is too short and non-matching prefixes', () => {
    const r = RegexResult.fromMap(
      new Map([
        ['AB', partial('short')],
        ['ABC', partial(undefined, 'second')],
        ['ABD', partial('x', 'y')],
      ]),
    );
    expect(r.getLazzy('AB', 1)).toBe('second'); // AB has size 1 (<=1: continue), ABC[1] wins
    expect(r.getLazzy('Z', 0)).toBeUndefined();
    expect(r.getLazzy('AB', 5)).toBeUndefined();
  });

  it('size is the number of keys (:113-117)', () => {
    expect(mapResult().size()).toBe(3);
  });

  it('toString is Map#toString of the partial matches (:64-68)', () => {
    expect(mapResult().toString()).toBe('{NAME={[foo, bar]}, NAME2={[null, baz]}, OTHER={[o]}}');
    expect(RegexResult.fromMap(new Map()).toString()).toBe('{}');
  });

  it('keeps the map by reference like Collections.unmodifiableMap (:55)', () => {
    const map = new Map<string, RegexPartialMatch>();
    const r = RegexResult.fromMap(map);
    map.set('LATE', partial('v'));
    expect(r.size()).toBe(1);
    expect(r.get('LATE', 0)).toBe('v');
  });
});

describe('RegexResult (UMatcher-backed, RegexResult.java:59-62)', () => {
  it('getUMatcher returns the matcher (:50-52)', () => {
    const { result, matcher } = matcherResult();
    expect(result.getUMatcher()).toBe(matcher);
  });

  it('get(key) is unsupported (:70-74)', () => {
    expect(() => matcherResult().result.get('K')).toThrow('UnsupportedOperationException');
  });

  it('size is unsupported (:113-117)', () => {
    expect(() => matcherResult().result.size()).toThrow('UnsupportedOperationException');
  });

  it('get(key, num) indexes findValuesByKey, undefined when empty (:76-84)', () => {
    const { result } = matcherResult();
    expect(result.get('K', 0)).toBe('12');
    expect(result.get('K', 1)).toBe('34');
    expect(result.get('NOPE', 0)).toBeUndefined();
    expect(() => result.get('K', 2)).toThrow(new RangeError('Index 2 out of bounds for length 2'));
  });

  it('getLazzy indexes findFirstValuesByKeyPrefix, undefined when none (:92-99)', () => {
    const { result, matcher } = matcherResult();
    expect(result.getLazzy('KP_', 0)).toBe(matcher.findFirstValuesByKeyPrefix('KP_')?.[0]);
    expect(result.getLazzy('NOPE', 0)).toBeUndefined();
  });

  it('toString delegates to the matcher (:64-68)', () => {
    const { result, matcher } = matcherResult();
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Java Object#toString of the matcher
    expect(result.toString()).toBe(String(matcher));
  });
});
