/**
 * `layoutDot` — hands the DOT body to @knowvah/dot-engine and keeps its SVG.
 *
 * For `@startdot` this single call is both layout AND rendering, mirroring
 * upstream handing the accumulated text to the graphviz executable
 * (`directdot/PSystemDot#exportDiagramNow`, PSystemDot.java:78-115).
 */
import { describe, it, expect } from 'vitest';

import { layoutDot } from '../../../src/diagrams/dot/layout.js';

describe('layoutDot', () => {
  it("returns graphviz's own SVG document, not this port's markup", () => {
    const geo = layoutDot({ dotContent: 'digraph G { a -> b; }\n' });
    // graphviz's SVG writer signature: pt units on the root, a `graph0`
    // wrapper, and per-element <title> children.
    expect(geo.svg).toContain('id="graph0"');
    expect(geo.svg).toContain('<title>G</title>');
    expect(geo.svg).toMatch(/width="\d+pt"/);
  });

  it('lays out clusters, edges and labels through the engine', () => {
    const geo = layoutDot({ dotContent: 'digraph G { subgraph cluster_0 { label=Backend; db -> api } }\n' });
    expect(geo.svg).toContain('class="cluster"');
    expect(geo.svg).toContain('Backend');
    expect(geo.svg).toContain('class="edge"');
  });

  it('surfaces a malformed-DOT failure instead of swallowing it', () => {
    expect(() => layoutDot({ dotContent: 'digraph { a ->\n' })).toThrow(/@startdot: could not render DOT/);
  });
});
