/**
 * sdd3-T2c: the document shell's root `<g>` and per-`<text>` `textLength`
 * follow `ShellFragment.lengthAdjust` (`SvgOption.getLengthAdjust()`).
 * @see net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:155-158 (root <g>)
 * @see net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:703-705 (textLength)
 */
import { describe, it, expect } from 'vitest';
import { assembleDocumentShell } from '../../../../src/core/klimt/document-shell.js';
import { ROOT_GROUP_OPEN, rootGroupOpen } from '../../../../src/core/svg.js';

const LABEL = '<text x="5" y="10" fill="#000" font-size="14" textLength="24.938">Bob</text>';
const SINGLE = '<text x="5" y="30" fill="#000" font-size="14">B</text>';
const BODY = '<g>' + LABEL + SINGLE + '</g>';

function shell(lengthAdjust?: 'spacing' | 'spacingAndGlyphs' | 'none'): string {
  const fragment = { body: BODY, width: 100, height: 50 };
  return assembleDocumentShell(lengthAdjust === undefined ? fragment : { ...fragment, lengthAdjust }, 'SEQUENCE');
}

describe('rootGroupOpen (SvgGraphics.java:155-158)', () => {
  it('SPACING writes lengthAdjust="spacing"; this is the default and ROOT_GROUP_OPEN', () => {
    expect(rootGroupOpen('spacing')).toBe('<g font-family="sans-serif" lengthAdjust="spacing">');
    expect(rootGroupOpen()).toBe(ROOT_GROUP_OPEN);
  });

  it('SPACING_AND_GLYPHS writes lengthAdjust="spacingAndGlyphs" (peduzi-80-giki495 in.svg)', () => {
    expect(rootGroupOpen('spacingAndGlyphs')).toBe('<g font-family="sans-serif" lengthAdjust="spacingAndGlyphs">');
  });

  it('NONE writes no lengthAdjust (vucomo-53-gicu658 in.svg)', () => {
    expect(rootGroupOpen('none')).toBe('<g font-family="sans-serif">');
  });
});

describe('assembleDocumentShell lengthAdjust', () => {
  it('unset is byte-identical to the explicit default', () => {
    expect(shell()).toBe(shell('spacing'));
    expect(shell()).toContain(ROOT_GROUP_OPEN + LABEL + SINGLE + '</g>');
  });

  it('spacingAndGlyphs keeps every textLength and names the value on the root', () => {
    const svg = shell('spacingAndGlyphs');
    expect(svg).toContain('<g font-family="sans-serif" lengthAdjust="spacingAndGlyphs">');
    expect(svg).toContain('textLength="24.938"');
  });

  it('none drops the root lengthAdjust and every <text> textLength, and only that', () => {
    const svg = shell('none');
    expect(svg).toContain('<g font-family="sans-serif">' + LABEL.replace(' textLength="24.938"', '') + SINGLE + '</g>');
    expect(svg).not.toContain('lengthAdjust');
    expect(svg).not.toContain('textLength');
  });
});
