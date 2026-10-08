/**
 * `renderDot` — packaging only: the engine's document goes back as a
 * `CompleteSvg`, byte-for-byte. Upstream has no second path — `PSystemDot`
 * writes graphviz's bytes and never reaches `DiagramChromeFactory`
 * (PSystemDot.java:78-115).
 */
import { describe, it, expect } from 'vitest';

import { layoutDot } from '../../../src/diagrams/dot/layout.js';
import { renderDot } from '../../../src/diagrams/dot/renderer.js';

describe('renderDot', () => {
  it("passes graphviz's bytes through verbatim as a CompleteSvg", () => {
    const geo = layoutDot({ dotContent: 'digraph G { a -> b; }\n' });
    expect(renderDot(geo)).toEqual({ completeSvg: geo.svg });
  });

  it("keeps the XML prolog and adds no <defs> of this port's own", () => {
    const { svg } = layoutDot({ dotContent: 'digraph G { a -> b; }\n' });
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg).toContain('<!DOCTYPE svg');
    expect(svg).not.toContain('<marker');
  });
});
