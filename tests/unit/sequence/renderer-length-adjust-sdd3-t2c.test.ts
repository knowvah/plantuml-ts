/**
 * sdd3-T2c: `skinparam lengthAdjust` reaches the sequence document.
 * Oracles: `vucomo-53-gicu658` / `vuniba-19-repo187` (`none`: bare root `<g>`,
 * no `textLength`), `peduzi-80-giki495` (`spacingAndGlyphs` on the root).
 * @see net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:155-158,703-705
 * @see net/sourceforge/plantuml/core/TextBlockExporter.java:305-308
 */
import { describe, it, expect } from 'vitest';
import { renderFixture } from '../../helpers/render.js';

function sequence(lengthAdjust?: string): string {
  const param = lengthAdjust === undefined ? '' : `skinparam lengthAdjust ${lengthAdjust}\n`;
  return renderFixture(`@startuml\n${param}title Hello title\nAlice -> Bob : hello\n@enduml`);
}

describe('sequence skinparam lengthAdjust', () => {
  it('unset: root lengthAdjust="spacing" and textLength on multi-character text', () => {
    const svg = sequence();
    expect(svg).toContain('<g font-family="sans-serif" lengthAdjust="spacing">');
    expect(svg).toMatch(/<text [^>]*textLength="[\d.]+"[^>]*>Alice<\/text>/);
  });

  it('explicit spacing is byte-identical to unset', () => {
    expect(sequence('spacing')).toBe(sequence());
  });

  it('spacingAndGlyphs: named on the root, textLength kept', () => {
    const svg = sequence('spacingAndGlyphs');
    expect(svg).toContain('<g font-family="sans-serif" lengthAdjust="spacingAndGlyphs">');
    expect(svg).toMatch(/textLength="[\d.]+"/);
  });

  it('none: bare root <g>, no textLength on any text (title chrome included)', () => {
    const svg = sequence('none');
    expect(svg).toContain('<g font-family="sans-serif">');
    expect(svg).not.toContain('lengthAdjust');
    expect(svg).not.toContain('textLength');
    expect(svg).toContain('>Alice</text>');
    expect(svg).toContain('>Hello title</text>');
  });
});
