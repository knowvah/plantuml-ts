/**
 * lad-T1a -- the shell finalize arms for the four generic root engines.
 * Every jar oracle for these types opens its content with
 * `<g font-family="sans-serif" lengthAdjust="spacing">` right after `<defs/>`
 * (`TextBlockExporter.java:292-294,306-307`; `SvgGraphics.java:155-158`).
 */
import { describe, it, expect } from 'vitest';
import { assembleSvg } from '../../../src/core/assemble-svg.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';

const TYPES = ['BOARD', 'FILES', 'PACKET', 'CHART'] as const;
const ROOT_G_SPACING = '<g font-family="sans-serif" lengthAdjust="spacing">';
const ROOT_G_NONE = '<g font-family="sans-serif">';
const RECT = '<rect x="0" y="0" width="1" height="1"/>';
const TEXT = '<text x="0" y="0" textLength="12.5">ab</text>';

function fragment(diagramType: string, overrides: Partial<RenderFragment> = {}): RenderFragment {
  return { body: RECT, width: 40, height: 30, diagramType, ...overrides };
}

describe.each(TYPES)('%s shell arm', (type) => {
  it('wraps an unwrapped body in one root <g> with lengthAdjust=spacing', () => {
    const svg = assembleSvg(fragment(type));
    expect(svg).toContain(`data-diagram-type="${type}"`);
    expect(svg).toContain(`<defs/>${ROOT_G_SPACING}${RECT}</g></svg>`);
    expect(svg.split('<g').length - 1).toBe(1);
  });

  it('under lengthAdjust none drops the root attribute and textLength', () => {
    const svg = assembleSvg(fragment(type, { body: TEXT, lengthAdjust: 'none' }));
    expect(svg).toContain(`<defs/>${ROOT_G_NONE}<text x="0" y="0">ab</text></g></svg>`);
  });

  it('writes spacingAndGlyphs on the root group', () => {
    const svg = assembleSvg(fragment(type, { lengthAdjust: 'spacingAndGlyphs' }));
    expect(svg).toContain('<g font-family="sans-serif" lengthAdjust="spacingAndGlyphs">' + RECT + '</g>');
  });

  it('passes a bodyWrapped body through without a second wrapper', () => {
    const svg = assembleSvg(fragment(type, { body: `<g>${RECT}</g>`, bodyWrapped: true }));
    expect(svg).toContain(`<defs/>${ROOT_G_SPACING}${RECT}</g></svg>`);
    expect(svg.split('<g').length - 1).toBe(1);
  });
});
