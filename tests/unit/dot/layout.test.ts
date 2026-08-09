/**
 * `layoutDot` — hands the DOT body to @knowvah/dot-engine and keeps its SVG.
 *
 * For `@startdot` this single call is both layout AND rendering, mirroring
 * upstream handing the accumulated text to the graphviz executable
 * (`directdot/PSystemDot#exportDiagramNow`).
 */
import { describe, it, expect } from 'vitest';

import { parseDot } from '../../../src/diagrams/dot/parser.js';
import { layoutDot } from '../../../src/diagrams/dot/layout.js';

function layoutOf(inner: string) {
  return layoutDot(parseDot(`@startdot\n${inner}\n@enddot`));
}

describe('layoutDot', () => {
  it('returns graphviz\'s own SVG document, not this port\'s markup', () => {
    const geo = layoutOf('digraph G { a -> b; }');
    expect(geo.svg).toContain('<svg');
    // graphviz's SVG writer signature: pt units on the root, a `graph0`
    // wrapper, and per-element <title> children. None of these appear in this
    // port's own emitters.
    expect(geo.svg).toContain('id="graph0"');
    expect(geo.svg).toContain('<title>G</title>');
    expect(geo.svg).toMatch(/width="\d+pt"/);
  });

  it('reads width and height off the root viewBox', () => {
    const geo = layoutOf('digraph G { a -> b; }');
    const m = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/.exec(geo.svg);
    expect(m).not.toBeNull();
    expect(geo.width).toBe(Number(m![1]));
    expect(geo.height).toBe(Number(m![2]));
    expect(geo.width).toBeGreaterThan(0);
    expect(geo.height).toBeGreaterThan(0);
  });

  it('lays out clusters, edges and labels through the engine', () => {
    const geo = layoutOf('digraph G { subgraph cluster_0 { label=Backend; db -> api } }');
    expect(geo.svg).toContain('class="cluster"');
    expect(geo.svg).toContain('Backend');
    expect(geo.svg).toContain('class="edge"');
  });

  it('carries the parsed annotations onto the geometry', () => {
    const geo = layoutOf('title My Graph\ndigraph { a }');
    expect(geo.annotations.title.display).toEqual(['My Graph']);
  });

  it('an empty DOT body lays out to nothing, without throwing', () => {
    const geo = layoutOf('title Just Chrome');
    expect(geo.svg).toBe('');
    expect(geo.width).toBe(0);
    expect(geo.height).toBe(0);
  });

  it('surfaces a malformed-DOT failure instead of swallowing it', () => {
    expect(() => layoutOf('digraph { a ->')).toThrow(/@startdot: could not render DOT/);
  });
});
