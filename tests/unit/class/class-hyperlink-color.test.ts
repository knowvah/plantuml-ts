/**
 * cdd6 T3g: a classifier's name and member `[[url]]` links draw in the
 * class style's `HyperLinkColor` -- `FontConfiguration.create(skinParam,
 * style, colors)` reads `style.value(PName.HyperLinkColor)`
 * (`FontConfiguration.java:213-219`) and `StripeSimple.java:224-225`
 * (`addUrl`) draws the link atom from that configuration. Sources are the
 * oracle fixtures `unknown/jixipo-21-mefu703` (root) and
 * `unknown/zivenu-37-nace681` (`.normal`/`.otro` tag selectors); expected
 * fills are the jar's (`#F00`; `#0F0`; `#0FF`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const BODY = `
class uno <<normal>> {
  * aaa
  + [[modelo normal]]
  - bb
}
class TRES AS "[[http://www.plantuml.com tres]]" <<otro>> {
  * aaa
  + [[otro modelo]]
  + aa
  - bb
}`;

function linkFills(style: string): string[] {
  const svg = renderSync(`@startuml\n<style>\n${style}\n</style>\n${BODY}\n@enduml`, {
    measurer: new WidthTableMeasurer(),
  });
  return [...svg.matchAll(/<a [^>]*><text [^>]*fill="([^"]+)"/g)].map((m) => m[1]!);
}

describe('classifier links take the class-cascade HyperLinkColor (cdd6 T3g)', () => {
  it('root { HyperlinkColor } colours member and name links (jixipo-21-mefu703)', () => {
    expect(linkFills('root {\n  HyperlinkColor #FF0000\n}')).toEqual(['#F00', '#F00', '#F00']);
  });

  it('.tag { HyperlinkColor } wins per stereotype (zivenu-37-nace681)', () => {
    const style =
      'root {\n  HyperlinkColor #FF0000\n}\n.normal {\n  HyperlinkColor #00FF00\n}\n.otro {\n  HyperlinkColor #00FFFF\n}';
    expect(linkFills(style)).toEqual(['#0F0', '#0FF', '#0FF']);
  });

  it('no HyperLinkColor keeps the #0000FF default', () => {
    expect(linkFills('root {\n  FontColor black\n}')).toEqual(['#00F', '#00F', '#00F']);
  });
});
