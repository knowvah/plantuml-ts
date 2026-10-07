/**
 * add4-T3gates: the three core seams a `[[url]]` run's skin reaches through.
 *
 *  - `skinparam hyperlinkColor X` -> the ROOT `HyperLinkColor`
 *    (`FromSkinparamToStyle.java:135`, `addConvert(..., SName.root)`).
 *  - `FontConfiguration#hyperlink()` (`FontConfiguration.java:335-340`) adds
 *    `UNDERLINE` only when `hyperlinkUnderlineStroke != null` -- `null` is
 *    `skinparam hyperlinkUnderline false` (`SkinParam.java:1057-1060`).
 *  - `UGraphicSvg#startUrl` (`UGraphicSvg.java:161`) opens the `<a>` with
 *    `option.getLinkTarget()` (`net/atmp/SvgOption.java:223`).
 */
import { describe, expect, it } from 'vitest';

import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { buildLineAtoms } from '../../../src/core/klimt/creole/legacy/StripeSimple.js';
import { FontStyle, UText } from '../../../src/core/klimt/shape/UText.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import { HYPERLINK_COLOR } from '../../../src/core/klimt/creole/command/CommandCreoleUrl.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { extractFlatContent } from '../../../src/core/klimt/document-shell-fragment.js';

const BASE: FontConfiguration = { family: 'SansSerif', size: 12, color: '#000000', styles: new Set() };
const LINK = '[[http://example.com label]]';

function urlAtomFont(font: FontConfiguration): FontConfiguration {
  const atom = buildLineAtoms(LINK, font).atoms.find((a) => a.kind === 'text' && a.url !== undefined);
  if (atom?.kind !== 'text') throw new Error('no url text atom');
  return atom.font;
}

describe('skinparam hyperlinkColor (FromSkinparamToStyle.java:135)', () => {
  it('writes the root HyperLinkColor and is a handled key', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['hyperlinkcolor', 'red']]), defaultTheme);
    expect(theme.colors.elements?.['root']?.hyperlinkColor).toBe('red');
    expect(unknown).toEqual([]);
  });
});

describe('CommandCreoleUrl underline (FontConfiguration.java:335-340)', () => {
  it('underlines a url run by default, in the plantuml.skin blue', () => {
    const font = urlAtomFont(BASE);
    expect(font.styles.has(FontStyle.UNDERLINE)).toBe(true);
    expect(font.color).toBe(HYPERLINK_COLOR);
  });

  it('drops the underline when hyperlinkUnderlineStroke is null, keeping the configured colour', () => {
    const font = urlAtomFont({ ...BASE, hyperlinkColor: '#FF0000', hyperlinkUnderlineStroke: null });
    expect(font.styles.has(FontStyle.UNDERLINE)).toBe(false);
    expect(font.color).toBe('#FF0000');
  });
});

describe('UGraphicSvg link target (UGraphicSvg.java:161)', () => {
  const bounder = { calculateDimension: () => ({ width: 10 }) };
  function linkMarkup(linkTarget?: string): string {
    const option = basicSvgOption(linkTarget === undefined ? {} : { linkTarget });
    const ug = UGraphicSvg.build(0, option, '$version$', bounder);
    ug.startUrl({ url: 'http://example.com', tooltip: 'tip' });
    ug.draw(UText.build('x', BASE));
    ug.closeUrl();
    return extractFlatContent(ug.getSvgString()).body;
  }

  it('defaults to _top (SkinParam.java:1082)', () => {
    expect(linkMarkup()).toContain('<a target="_top" href="http://example.com"');
  });

  it('uses SvgOption.linkTarget when set', () => {
    expect(linkMarkup('_blank')).toContain('<a target="_blank" href="http://example.com"');
  });
});
