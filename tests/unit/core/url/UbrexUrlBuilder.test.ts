import { describe, expect, it } from 'vitest';
import { UbrexUrlBuilder, UMatchNone } from '../../../../src/core/url/UbrexUrlBuilder.js';
import { UrlMode } from '../../../../src/core/url/UrlMode.js';

describe('UbrexUrlBuilder (UbrexUrlBuilder.java)', () => {
  it('returns null when no pattern matches (:138)', () => {
    expect(new UbrexUrlBuilder(null, UrlMode.STRICT).getUrl('not a link')).toBeNull();
    expect(new UbrexUrlBuilder(null, UrlMode.ANYWHERE).getUrl('not a link')).toBeNull();
  });

  it('prefixes relative links with topurl (:177-185)', () => {
    const url = new UbrexUrlBuilder('http://top/', UrlMode.STRICT).getUrl('[[page text]]');
    expect(url?.getUrl()).toBe('http://top/page');
    expect(url?.getLabel()).toBe('text');
  });

  it.each(['http://a', 'https://a', 'file:///a'])('does not prefix %s (:178-183)', (link) => {
    const url = new UbrexUrlBuilder('http://top/', UrlMode.STRICT).getUrl('[[' + link + ']]');
    expect(url?.getUrl()).toBe(link);
  });

  it('a tooltip-only link has the empty url and ignores topurl for it (:177-178)', () => {
    const url = new UbrexUrlBuilder('http://top/', UrlMode.STRICT).getUrl('[[{tip} label]]');
    expect(url?.getUrl()).toBe('');
    expect(url?.getTooltip()).toBe('tip');
    expect(url?.getLabel()).toBe('label');
  });

  it('ANYWHERE finds an embedded link (:141-150)', () => {
    const url = new UbrexUrlBuilder(null, UrlMode.ANYWHERE).getUrl('see [[http://x label]] now');
    expect(url?.getUrl()).toBe('http://x');
    expect(url?.getLabel()).toBe('label');
  });

  it('STRICT rejects an embedded link (:110-113)', () => {
    expect(new UbrexUrlBuilder(null, UrlMode.STRICT).getUrl('see [[http://x]] now')).toBeNull();
  });

  it('ANYWHERE scan stops two characters before the end (:145 i < length - 2)', () => {
    // "[[a]]" has length 5; starts 0..2 are tried, a match at 0 is found.
    expect(new UbrexUrlBuilder(null, UrlMode.ANYWHERE).getUrl('[[a]]')?.getUrl()).toBe('a');
    // A 2-char string tries no start at all.
    expect(new UbrexUrlBuilder(null, UrlMode.ANYWHERE).getUrl('[[')).toBeNull();
  });

  it('an unknown mode is IllegalStateException (:167-175)', () => {
    const bad = new UbrexUrlBuilder(null, 'BOGUS' as UrlMode);
    expect(() => bad.getUrl('[[http://x]]')).toThrow('IllegalStateException');
  });
});

describe('UbrexUrlBuilder UMatchNone (UbrexUrlBuilder.java:187-218)', () => {
  const none = new UMatchNone();

  it('startMatch and exactMatch are false (:189-197)', () => {
    expect(none.startMatch()).toBe(false);
    expect(none.exactMatch()).toBe(false);
  });

  it.each([
    ['getAcceptedMatch', () => none.getAcceptedMatch()],
    ['findValuesByKey', () => none.findValuesByKey('K')],
    ['findFirstValuesByKeyPrefix', () => none.findFirstValuesByKeyPrefix('K')],
    ['extractByPrefix', () => none.extractByPrefix('K')],
    ['findFirstValueByKey (default over findValuesByKey)', () => none.findFirstValueByKey('K')],
  ])('%s throws UnsupportedOperationException (:199-217)', (_name, call) => {
    expect(call).toThrow('UnsupportedOperationException');
  });

  it('an ANYWHERE miss yields null via startMatch() === false', () => {
    expect(new UbrexUrlBuilder('t', UrlMode.ANYWHERE).getUrl('zzzzzz')).toBeNull();
  });
});
