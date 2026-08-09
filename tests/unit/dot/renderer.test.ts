/**
 * `renderDot` — packaging only.
 *
 * This file used to assert drawing: node shapes, arrowheads, cluster
 * rectangles, label placement, all produced by this port's own SVG emitters.
 * The passthrough rewrite deleted that renderer — graphviz draws the graph now
 * — so what is left to test is which CONTAINER the engine's document is handed
 * back in, and that the no-chrome path does not touch a single byte of it.
 */
import { describe, it, expect } from 'vitest';

import { parseDot } from '../../../src/diagrams/dot/parser.js';
import { layoutDot } from '../../../src/diagrams/dot/layout.js';
import { renderDot } from '../../../src/diagrams/dot/renderer.js';
import type { RenderFragment, CompleteSvg } from '../../../src/core/dispatcher.js';

function renderOf(inner: string) {
  return renderDot(layoutDot(parseDot(`@startdot\n${inner}\n@enddot`)));
}

describe('renderDot — no chrome (the conformance path)', () => {
  it('returns the engine document as a CompleteSvg', () => {
    const out = renderOf('digraph G { a -> b; }');
    expect('completeSvg' in out).toBe(true);
  });

  it('passes graphviz\'s bytes through verbatim — not one character altered', () => {
    const geo = layoutDot(parseDot('@startdot\ndigraph G { a -> b; }\n@enddot'));
    const out = renderDot(geo) as CompleteSvg;
    expect(out.completeSvg).toBe(geo.svg);
  });

  it('keeps the XML prolog and DOCTYPE the engine emitted', () => {
    const out = renderOf('digraph G { a -> b; }') as CompleteSvg;
    expect(out.completeSvg.startsWith('<?xml')).toBe(true);
    expect(out.completeSvg).toContain('<!DOCTYPE svg');
    expect(out.completeSvg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('adds no <defs> of this port\'s own — arrowheads come from graphviz', () => {
    const out = renderOf('digraph G { a -> b; }') as CompleteSvg;
    // This port's shared shell auto-embeds arrowhead marker <defs>; the
    // passthrough must never acquire them, since the jar's output has none.
    expect(out.completeSvg).not.toContain('<marker');
    expect(out.completeSvg).toContain('<polygon');
  });
});

describe('renderDot — chrome present (the divergence path)', () => {
  it('returns a RenderFragment so the shared applyChrome can compose it', () => {
    const out = renderOf('title My Graph\ndigraph G { a -> b; }');
    expect('completeSvg' in out).toBe(false);
  });

  it('the fragment body is graphviz\'s inner markup, with the root <svg> peeled off', () => {
    const out = renderOf('title My Graph\ndigraph G { a -> b; }') as RenderFragment;
    expect(out.body).not.toContain('<svg');
    expect(out.body).not.toContain('</svg>');
    // The graph0 wrapper — and the translate() that flips graphviz's negative
    // y coordinates — must come along inside the body.
    expect(out.body).toContain('id="graph0"');
    expect(out.body).toMatch(/translate\(/);
  });

  it('the fragment carries the engine\'s dimensions', () => {
    const geo = layoutDot(parseDot('@startdot\ntitle My Graph\ndigraph G { a -> b; }\n@enddot'));
    const out = renderDot(geo) as RenderFragment;
    expect(out.width).toBe(geo.width);
    expect(out.height).toBe(geo.height);
  });

  it('a chrome-only block yields an empty body rather than throwing', () => {
    const out = renderOf('title Just Chrome') as RenderFragment;
    expect(out.body).toBe('');
    expect(out.width).toBe(0);
  });
});
