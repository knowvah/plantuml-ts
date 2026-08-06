/**
 * UrlBuilder.test.ts — SI1/T7 closure pull: `src/core/url/UrlBuilder.ts`
 * against url/UrlBuilder.java:104-146. One case per pattern in upstream's
 * 5-pattern cascade, plus mode and topurl behavior; expectations
 * hand-derived from the Java (`Url`'s tooltip/label fallbacks are
 * Url.java's own, already ported/tested in `Url.ts`).
 */
import { describe, expect, it } from 'vitest';
import { UrlBuilder, getRegexp, transform } from '../../../../src/core/url/UrlBuilder.js';
import { UrlMode } from '../../../../src/core/url/UrlMode.js';

describe('UrlBuilder.getUrl — the 5-pattern cascade (java:104-128)', () => {
  const b = new UrlBuilder(null, UrlMode.STRICT);

  it('QUOTED: [["url" {tooltip} label]]', () => {
    const url = b.getUrl('[["http://foo bar" {tip} the label]]');
    expect(url?.getUrl()).toBe('http://foo bar');
    expect(url?.getTooltip()).toBe('tip');
    expect(url?.getLabel()).toBe('the label');
  });

  it('QUOTED: bare and label-only variants (optional groups unmatched -> Url fallbacks)', () => {
    const bare = b.getUrl('[["http://q"]]');
    expect(bare?.getUrl()).toBe('http://q');
    expect(bare?.getTooltip()).toBe('http://q');
    const labelOnly = b.getUrl('[["http://q" lbl]]');
    expect(labelOnly?.getUrl()).toBe('http://q');
    expect(labelOnly?.getLabel()).toBe('lbl');
  });

  it('ONLY_TOOLTIP: [[{tooltip}]] has empty url', () => {
    const url = b.getUrl('[[{just a tooltip}]]');
    expect(url?.getUrl()).toBe('');
    expect(url?.getTooltip()).toBe('just a tooltip');
  });

  it('ONLY_TOOLTIP_AND_LABEL: [[{tooltip} label]]', () => {
    const url = b.getUrl('[[{tip} my label]]');
    expect(url?.getUrl()).toBe('');
    expect(url?.getTooltip()).toBe('tip');
    expect(url?.getLabel()).toBe('my label');
  });

  it('LINK_TOOLTIP_NOLABEL: [[link{tooltip}]]', () => {
    const url = b.getUrl('[[http://foo{tip text}]]');
    expect(url?.getUrl()).toBe('http://foo');
    expect(url?.getTooltip()).toBe('tip text');
  });

  it('LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL: bare link; tooltip defaults to the url (Url.java)', () => {
    const url = b.getUrl('[[http://foo]]');
    expect(url?.getUrl()).toBe('http://foo');
    expect(url?.getTooltip()).toBe('http://foo');
    const withLabel = b.getUrl('[[http://foo label]]');
    expect(withLabel?.getUrl()).toBe('http://foo');
    expect(withLabel?.getLabel()).toBe('label');
  });

  it('returns null when nothing matches', () => {
    expect(b.getUrl('not a url')).toBeNull();
    expect(b.getUrl('[[]]')).toBeNull();
  });
});

describe('UrlBuilder modes and topurl (java:130-146)', () => {
  it('STRICT requires the whole string to be the [[...]] form', () => {
    const strict = new UrlBuilder(null, UrlMode.STRICT);
    expect(strict.getUrl('see [[http://foo]] here')).toBeNull();
  });

  it('ANYWHERE finds an embedded [[...]] form', () => {
    const anywhere = new UrlBuilder(null, UrlMode.ANYWHERE);
    expect(anywhere.getUrl('see [[http://foo]] here')?.getUrl()).toBe('http://foo');
  });

  it('an unknown mode is an IllegalStateException (java:135-137)', () => {
    const bogus = new UrlBuilder(null, 'BOGUS' as UrlMode);
    expect(() => bogus.getUrl('[[http://foo]]')).toThrow('IllegalStateException');
  });

  it('withTopUrl prefixes relative links only (java:140-146)', () => {
    const based = new UrlBuilder('http://base/', UrlMode.STRICT);
    expect(based.getUrl('[[page]]')?.getUrl()).toBe('http://base/page');
    expect(based.getUrl('[[http://abs]]')?.getUrl()).toBe('http://abs');
    expect(based.getUrl('[[https://abs]]')?.getUrl()).toBe('https://abs');
    expect(based.getUrl('[[file:local]]')?.getUrl()).toBe('file:local');
  });
});

describe('Pattern2 %-token transform (regex/Pattern2.java:51-61)', () => {
  it('substitutes %s/%q/%g/%pLN and leaves other text verbatim', () => {
    expect(transform('[%s]*')).toBe('[\\s\\u00A0]*');
    expect(transform("a[%q]b")).toBe("a['\\u2018\\u2019]b");
    expect(transform('[%g]')).toBe('["\\u201C\\u201D\\uE121]');
    expect(transform('[%pLN]')).toBe('[\\p{L}\\p{N}]');
  });

  it('getRegexp keeps the RAW %-tokens (transform is the caller’s job, as Pattern2 vs String.replaceAll differ upstream)', () => {
    expect(getRegexp()).toContain('[%s]');
    expect(getRegexp()).toContain('[%g]');
    expect(getRegexp().split('|').length).toBeGreaterThanOrEqual(5);
  });

  it('accepts smart double quotes via %g (QUOTED pattern)', () => {
    const b = new UrlBuilder(null, UrlMode.STRICT);
    const url = b.getUrl('[[“http://foo”]]');
    expect(url?.getUrl()).toBe('http://foo');
  });
});
