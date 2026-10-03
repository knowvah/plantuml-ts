/**
 * T3e — creole-aware drawing in `activity-renderer-text.ts`: `drawActivityText`
 * routes a `[[url]]`/`|cell|` physical line through the real creole seam
 * instead of drawing it as one literal `<text>` run (decisions.md#D1 for
 * WHY activity text draws through the klimt driver at all). See
 * `plans/activity-divergence-drive/batch-3/T3e-creole-text.md`.
 */
import { describe, it, expect } from 'vitest';
import { drawActivityText } from '../../../src/diagrams/activity/activity-renderer-text.js';

const STYLE = { fontFamily: 'sans-serif', fontSize: 12, fill: '#000' };

describe('drawActivityText — plain text (regression guard)', () => {
  it('draws one <text> element, unchanged from the pre-T3e literal path', () => {
    const svg = drawActivityText(26, 74.333, 'foo1', STYLE);
    expect(svg).toContain('<text');
    expect((svg.match(/<text/g) ?? []).length).toBe(1);
    expect(svg).toContain('>foo1<');
    expect(svg).not.toContain('<a ');
  });
});

describe('drawActivityText — `[[url]]`', () => {
  it('a bare `[[url]]` draws ONE run, hyperlink-coloured, wrapped in <a href>', () => {
    // gaxezi-48-zesa921's own middle run, jar-verified:
    // <a target="_self" href="..."><text ... fill="#00F" ...>...</text></a>
    const svg = drawActivityText(49.325, 74.333, '[[http://www.google.com]]', STYLE);
    expect((svg.match(/<text/g) ?? []).length).toBe(1);
    expect(svg).toContain('>http://www.google.com<');
    expect(svg).toContain('fill="#00F"');
    expect(svg).toContain('<a ');
    expect(svg).toContain('href="http://www.google.com"');
  });

  it('plain text surrounding `[[url]]` draws as its own separate runs, not wrapped', () => {
    const svg = drawActivityText(26, 74.333, 'foo1 [[http://www.google.com]] end', STYLE);
    // Three runs total: "foo1 " (plain), the link, " end" (plain) --
    // jar-verified gaxezi-48-zesa921 (3 <text> elements on this line).
    expect((svg.match(/<text/g) ?? []).length).toBe(3);
    expect((svg.match(/<a /g) ?? []).length).toBe(1);
    expect(svg).toContain('>foo1<');
    expect(svg).toContain('>end<');
  });

  it('T2c: `[[url{tooltip} label]]` draws title/xlink:title as the TOOLTIP, not the url', () => {
    // zamagu-75-vape137's own middle run, jar-verified:
    // <a ... title="dd" xlink:title="dd"><text ...>sss</text></a> -- the
    // creole command's `{dd}` tooltip, never `http://testLink1.com`.
    const svg = drawActivityText(26, 87.333, '[[http://testLink1.com{dd} sss]]', STYLE);
    expect(svg).toContain('title="dd"');
    expect(svg).toContain('xlink:title="dd"');
    expect(svg).not.toContain('title="http://testLink1.com"');
    expect(svg).toContain('href="http://testLink1.com"');
  });

  it('`[[url label]]` with no `{tooltip}` still defaults the tooltip to the url', () => {
    const svg = drawActivityText(26, 74.333, '[[http://www.google.com]]', STYLE);
    expect(svg).toContain('title="http://www.google.com"');
    expect(svg).toContain('xlink:title="http://www.google.com"');
  });
});

describe('drawActivityText — hyperlinkUnderline/svgLinkTarget (add2 T3e, family F)', () => {
  it('a url run keeps the underline when hyperlinkUnderline is unset (upstream default true)', () => {
    const svg = drawActivityText(26, 74.333, '[[http://www.google.com]]', STYLE);
    expect(svg).toContain('text-decoration="underline"');
  });

  it('hyperlinkUnderline: false strips the underline off a url run only', () => {
    const svg = drawActivityText(26, 74.333, 'plain [[http://www.google.com]]', {
      ...STYLE,
      hyperlinkUnderline: false,
    });
    expect(svg).not.toContain('text-decoration="underline"');
  });

  it('svgLinkTarget forwards to the <a> wrapper\'s target attribute', () => {
    const svg = drawActivityText(26, 74.333, '[[http://www.google.com]]', { ...STYLE, svgLinkTarget: '_self' });
    expect(svg).toContain('target="_self"');
  });

  it('svgLinkTarget unset falls through to linkWrap\'s own "_top" default', () => {
    const svg = drawActivityText(26, 74.333, '[[http://www.google.com]]', STYLE);
    expect(svg).toContain('target="_top"');
  });
});

describe('drawActivityText — `|cell|` table row', () => {
  it('strips the pipe delimiters — no literal `|` reaches the drawn text', () => {
    // activity-creole-table: jar text content is "Creole Table Line1",
    // never "|Creole Table Line1|".
    const svg = drawActivityText(26, 37.333, '|Creole Table Line1|', STYLE);
    expect(svg).toContain('>Creole Table Line1<');
    expect(svg).not.toContain('|');
  });

  it('multiple cells on one row draw as separate runs, left to right', () => {
    const svg = drawActivityText(26, 37.333, '|a|b|', STYLE);
    expect((svg.match(/<text/g) ?? []).length).toBe(2);
    expect(svg).toContain('>a<');
    expect(svg).toContain('>b<');
  });
});
