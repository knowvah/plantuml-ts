import { describe, expect, it } from 'vitest';
import { Url, eventuallyRemoveStartingAndEndingDoubleQuote } from '../../../../src/core/url/Url.js';
import { Check } from '../../../../src/core/url/Check.js';

/**
 * Url — url/Url.java, plus its consumed StringUtils slice and the
 * url-package Check flag.
 *
 * NOTE on ordering: `Check.goJunit()` sets a one-way global flag
 * (url/Check.java has no reset, faithfully preserved), so the junit-mode
 * assertions run in the LAST describe block of this file.
 */
describe('eventuallyRemoveStartingAndEndingDoubleQuote (StringUtils slice)', () => {
  it('strips ordinary double quotes when format contains a quote', () => {
    expect(eventuallyRemoveStartingAndEndingDoubleQuote('"abc"', '"')).toBe('abc');
  });

  it('strips typographic quote pairs (isDoubleQuote set)', () => {
    expect(eventuallyRemoveStartingAndEndingDoubleQuote('“abc”', '"')).toBe('abc');
    expect(eventuallyRemoveStartingAndEndingDoubleQuote('«ab»', '"')).toBe('ab');
  });

  it('leaves unquoted and single-char strings alone', () => {
    expect(eventuallyRemoveStartingAndEndingDoubleQuote('abc', '"')).toBe('abc');
    expect(eventuallyRemoveStartingAndEndingDoubleQuote('"', '"')).toBe('"');
  });

  it('passes null through', () => {
    expect(eventuallyRemoveStartingAndEndingDoubleQuote(null, '"')).toBeNull();
  });

  it('strips parens, brackets and colons only when the format requests them', () => {
    expect(eventuallyRemoveStartingAndEndingDoubleQuote('(abc)', '"([:')).toBe('abc');
    expect(eventuallyRemoveStartingAndEndingDoubleQuote('[abc]', '"([:')).toBe('abc');
    expect(eventuallyRemoveStartingAndEndingDoubleQuote(':abc:', '"([:')).toBe('abc');
    expect(eventuallyRemoveStartingAndEndingDoubleQuote('(abc)', '"')).toBe('(abc)');
  });
});

describe('Url', () => {
  it('strips surrounding quotes from the url', () => {
    const url = new Url('"http://example.com"', null, null);
    expect(url.getUrl()).toBe('http://example.com');
  });

  it('defaults tooltip and label to the url', () => {
    const url = new Url('http://x', null, null);
    expect(url.getTooltip()).toBe('http://x');
    expect(url.getLabel()).toBe('http://x');
  });

  it('defaults label to the url for an empty label', () => {
    const url = new Url('http://x', 'tip', '');
    expect(url.getTooltip()).toBe('tip');
    expect(url.getLabel()).toBe('http://x');
  });

  it('keeps explicit tooltip and label', () => {
    const url = new Url('http://x', 'tip', 'lab');
    expect(url.getTooltip()).toBe('tip');
    expect(url.getLabel()).toBe('lab');
  });

  it('detects latex pseudo-urls (static and instance)', () => {
    expect(Url.isLatex('latex://x^2')).toBe(true);
    expect(Url.isLatex('http://x')).toBe(false);
    expect(new Url('latex://x', null, null).isLatex()).toBe(true);
    expect(new Url('http://x', null, null).isLatex()).toBe(false);
  });

  it('tracks the member flag', () => {
    const url = new Url('http://x', null, null);
    expect(url.isMember()).toBe(false);
    url.setMember(true);
    expect(url.isMember()).toBe(true);
  });

  it('accumulates visibility and reports coords/hasData', () => {
    const url = new Url('http://x', null, null);
    expect(url.hasData()).toBe(false);
    url.ensureVisible(10, 20);
    url.ensureVisible(30, 40);
    expect(url.hasData()).toBe(true);
    expect(url.getCoords(1.0)).toBe('10,20,30,40');
    expect(url.getCoords(0.5)).toBe('5,10,15,20');
  });

  it('toString carries the url and the unscaled coords', () => {
    const url = new Url('http://x', null, null);
    url.ensureVisible(1, 2);
    expect(url.toString()).toContain('http://x');
    expect(url.toString()).toContain('1,2,1,2');
  });

  it('orders urls by surface via SURFACE_COMPARATOR', () => {
    const small = new Url('http://s', null, null);
    small.ensureVisible(0, 0);
    small.ensureVisible(1, 1);
    const big = new Url('http://b', null, null);
    big.ensureVisible(0, 0);
    big.ensureVisible(10, 10);
    expect(Url.SURFACE_COMPARATOR(big, small)).toBe(1);
    expect(Url.SURFACE_COMPARATOR(small, big)).toBe(-1);
    expect(Url.SURFACE_COMPARATOR(small, small)).toBe(0);
  });
});

describe('Check junit mode (one-way flag; must run last)', () => {
  it('is off by default and getCoords tolerates empty boxes', () => {
    expect(Check.isJunit()).toBe(false);
    expect(new Url('http://x', null, null).getCoords(1.0)).toBe('0,0,0,0');
  });

  it('after goJunit, getCoords throws on an empty visibility box', () => {
    Check.goJunit();
    expect(Check.isJunit()).toBe(true);
    const url = new Url('http://x', null, null);
    expect(() => url.getCoords(1.0)).toThrow();
    // A url with real data still works.
    const ok = new Url('http://y', null, null);
    ok.ensureVisible(3, 4);
    expect(ok.getCoords(1.0)).toBe('3,4,3,4');
  });
});
