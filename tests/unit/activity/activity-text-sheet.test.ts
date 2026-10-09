/**
 * add4-T3g: `activity-text-sheet.ts` -- `Display#create0` (`Display.java:637-701`)
 * for every non-action activity label, drawn on a throwaway `UGraphicSvg`.
 */
import { describe, expect, it } from 'vitest';
import {
  activityDisplayBlock,
  activityTextFontConfiguration,
  drawActivityTextBlock,
} from '../../../src/diagrams/activity/activity-text-sheet.js';
import { CreoleMode } from '../../../src/core/klimt/creole/CreoleMode.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { backColorFilterId } from '../../../src/core/svg-defs.js';
import { resolveColorToSvgHex } from '../../../src/core/klimt/color/HColorSet.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import { measured } from './measured-theme.js';

const THEME: Theme = measured(defaultTheme);
const ORIGIN = { x: 10, y: 20 };

function draw(label: string, theme: Theme = THEME, mode: CreoleMode = CreoleMode.SIMPLE_LINE): string {
  const fc = activityTextFontConfiguration(theme, 11, 'arrow');
  const tb = activityDisplayBlock(label, theme, {
    fontConfiguration: fc,
    horizontalAlignment: HorizontalAlignment.LEFT,
    creoleMode: mode,
  });
  return drawActivityTextBlock(tb, ORIGIN, theme, fc);
}

describe('activityDisplayBlock + drawActivityTextBlock', () => {
  it('draws a plain label as one <text> on the block baseline', () => {
    // AtomText baseline: block top + size - descent (size 11, descent 11/4.5).
    expect(draw('hello')).toBe('<text x="10" y="28.556" fill="#000" font-size="11" textLength="23.306">hello</text>');
  });

  it('splits a `**bold**` run into its own <text> at the accumulated x', () => {
    const svg = draw('**b** x');
    expect(svg).toContain('font-weight="700">b</text>');
    expect(svg.match(/<text /g)).toHaveLength(2);
  });

  it('draws one <text> per `\\n` stripe, one font size apart', () => {
    const ys = [...draw('one\ntwo').matchAll(/ y="([^"]+)"/g)].map((m) => Number(m[1]));
    expect(ys).toEqual([28.556, 39.556]);
  });

  it('keeps a `<back:color>` flood filter inline, keyed by colour', () => {
    const svg = draw('<back:yellow>on yellow');
    const id = backColorFilterId(resolveColorToSvgHex('yellow'));
    expect(svg.startsWith(`<filter id="${id}" x="0" y="0" width="1" height="1">`)).toBe(true);
    expect(svg).toContain(`filter="url(#${id})">on yellow</text>`);
  });

  it('gives two back colours two distinct filter ids', () => {
    const red = draw('<back:red>a');
    const blue = draw('<back:blue>a');
    expect(/filter id="([^"]+)"/.exec(red)?.[1]).not.toBe(/filter id="([^"]+)"/.exec(blue)?.[1]);
  });

  it('carries skinparam svgLinkTarget into a url run', () => {
    const svg = draw('[[http://x.com link]]', { ...THEME, svgLinkTarget: '_self' });
    expect(svg).toContain('<a target="_self" href="http://x.com"');
  });

  it('applies the arrow hyperlink colour (Style.java:265)', () => {
    const theme: Theme = {
      ...THEME,
      colors: { ...THEME.colors, elements: { ...THEME.colors.elements, root: { hyperlinkColor: '#008000' } } },
    };
    expect(draw('[[http://x.com link]]', theme)).toContain('fill="#008000"');
  });
});

describe('CreoleMode.SIMPLE_LINE (CommandCreoleBuilder.java:85-86)', () => {
  it('keeps `__x__` literal in a SIMPLE_LINE sheet', () => {
    // isw-T2-act: textLength from a one-JVM jar render (seam #4) of
    // `:A;\n-> a __u__ b;\n:B;` -- `textLength="48.881"`, the two spaces
    // now 3.025 each at 11pt.
    expect(draw('a __u__ b')).toBe(
      '<text x="10" y="28.556" fill="#000" font-size="11" textLength="48.881">a __u__ b</text>',
    );
  });

  it('still underlines `__x__` in a FULL sheet', () => {
    expect(draw('a __u__ b', THEME, CreoleMode.FULL)).toContain('text-decoration="underline">u</text>');
  });
});
