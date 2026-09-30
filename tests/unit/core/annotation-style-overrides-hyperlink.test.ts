/**
 * cdd6 T3g: `<style> { HyperLinkColor }` reaches a chrome element's
 * `AnnotationBoxStyle.hyperlinkColor` -- `Style.java:265` reads
 * `PName.HyperLinkColor` into the element's `FontConfiguration`
 * (`FontConfiguration.java:213-219`). Fixture: `unknown/jixipo-21-mefu703`
 * (`root { HyperlinkColor #FF0000 }`, title `[[test link]]` drawn `#F00`).
 */
import { describe, it, expect } from 'vitest';
import { applyStyleOverrides } from '../../../src/core/annotations/annotation-style-overrides.js';
import { BASE_DEFAULTS, cloneBoxStyle } from '../../../src/core/annotations/annotation-defaults.js';
import { parseStyleBlock } from '../../../src/core/skinparam-style-block.js';

const WHITE = '#FFFFFF';

function titleStyleFor(styleSource: string) {
  const style = cloneBoxStyle(BASE_DEFAULTS.title);
  applyStyleOverrides('title', style, parseStyleBlock(styleSource), WHITE);
  return style;
}

describe('applyStyleOverrides — HyperLinkColor (cdd6 T3g)', () => {
  it('root { HyperlinkColor } sets the title hyperlinkColor', () => {
    expect(titleStyleFor('root {\n  HyperlinkColor #FF0000\n}').hyperlinkColor).toBe('#FF0000');
  });

  it('document { title { HyperLinkColor } } wins over root', () => {
    const src = 'root {\n  HyperlinkColor #FF0000\n}\ndocument {\n  title {\n    HyperLinkColor green\n  }\n}';
    expect(titleStyleFor(src).hyperlinkColor).toBe('green');
  });

  it('a #?light:dark HyperLinkColor resolves against the document background', () => {
    expect(titleStyleFor('root {\n  HyperLinkColor #?blue:cyan\n}').hyperlinkColor).toBe('#0000FF');
  });

  it('no HyperLinkColor leaves the field undefined (the #0000FF fallback stands)', () => {
    expect(titleStyleFor('root {\n  FontColor red\n}').hyperlinkColor).toBeUndefined();
  });
});
