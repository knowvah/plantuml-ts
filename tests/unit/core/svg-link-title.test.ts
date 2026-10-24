import { describe, expect, it } from 'vitest';
import { linkWrap } from '../../../src/core/svg.js';
import { linkTitle } from '../../../src/core/svg-link-title.js';

const URL = 'http://example.com/';
const TITLE_ATTR = /title="([^"]*)"/g;

function titles(html: string): string[] {
  return [...html.matchAll(TITLE_ATTR)].map((m) => m[1] ?? '');
}

describe('linkTitle (SvgGraphics.java:1147-1160 LinkData#getXlinkTitle)', () => {
  it('decodes <U+XXXX> to the char with that hex code (:1149-1155)', () => {
    expect(linkTitle(URL, 'b<U+0041>')).toBe('bA');
    expect(linkTitle(URL, '<U+00e9><U+20AC>')).toBe('é€');
  });

  it('truncates the code to 16 bits like the (char) cast at :1153', () => {
    expect(linkTitle(URL, '<U+10041>')).toBe('A');
  });

  it('turns a literal two-char backslash-n into a newline (:1158)', () => {
    expect(linkTitle(URL, 'a\\nb')).toBe('a\nb');
  });

  it('keeps the first backslash of a doubled one (regex \\\\n at :1158)', () => {
    expect(linkTitle(URL, 'Tooltip for message\\\\nOn several lines')).toBe('Tooltip for message\\\nOn several lines');
  });

  it('returns the url for a null title (:1148-1149)', () => {
    expect(linkTitle(URL, undefined)).toBe(URL);
  });

  it('leaves a title with no escape untouched', () => {
    expect(linkTitle(URL, 'plain tip')).toBe('plain tip');
  });
});

describe('linkWrap title attributes (SvgGraphics.java:1170-1172)', () => {
  it('writes the decoded value to both title and xlink:title', () => {
    const out = linkWrap('<g/>', { url: URL, tooltip: 'a\\nb<U+0041>' });
    expect(titles(out)).toEqual(['a\nbA', 'a\nbA']);
    expect(out).toContain(' title="a\nbA" xlink:title="a\nbA"');
  });

  it('writes the url to both titles when there is no tooltip', () => {
    const out = linkWrap('<g/>', { url: URL });
    expect(titles(out)).toEqual([URL, URL]);
  });

  it('still escapes a decoded value through attrs (& < and ")', () => {
    const out = linkWrap('<g/>', { url: URL, tooltip: 'x<U+0026>y<U+003C>z<U+0022>q' });
    expect(out).toContain(' title="x&amp;y&lt;z&quot;q" xlink:title="x&amp;y&lt;z&quot;q"');
  });

  it('uses the emptied url as the title when the link is javascript:', () => {
    const out = linkWrap('<g/>', { url: 'javascript:alert(1)' });
    expect(out).toContain(' href="" ');
    expect(titles(out)).toEqual(['', '']);
  });
});
