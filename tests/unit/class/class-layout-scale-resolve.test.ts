/**
 * cdd3-T34 — C-10: `layoutClass`'s `scale ...` factor must resolve from the
 * FRACTIONAL, pre-`SvgGraphics#ensureVisible` document dimension
 * (`core/TextBlockExporter.java:199-201,205-208`), not the already-truncated
 * `geo.totalWidth`/`totalHeight` (`applyCucaDocumentMargin`'s
 * `Math.floor(dim + 1)`). Every expected value below is read off the
 * fixture's own oracle SVG (`test-results/dot-cache/class/<slug>/in.svg`),
 * never fitted to our output — see `plans/class-divergence-drive-3/
 * diagnosis/C.md`'s cagace/nadaba/kujiji entry (mechanism C-10) for the
 * measured pre/used dimension pairs this test locks in.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const measurer = new DeterministicMeasurer();

function fixtureSource(slug: string): string {
  return readFileSync(`test-results/dot-cache/class/${slug}/in.puml`, 'utf8');
}

function fontSizes(svg: string): string[] {
  return [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => m[1]!);
}

describe('C-10 — scale max N width/height, scale N width (fractional pre-dim basis)', () => {
  it('cagace-55-libu760 (`scale max 50 width`): font-size 8.44, jar TextBlockExporter.java:199-201 pre=82.9375', () => {
    const svg = renderSync(fixtureSource('cagace-55-libu760'), { measurer });
    expect(fontSizes(svg)).toEqual(['8.44']);
    expect(svg).toContain('viewBox="0 0 50 40"');
  });

  it('nadaba-37-zaku242 (`scale max 50 height`): font-size 10.145, jar pre height=69', () => {
    const svg = renderSync(fixtureSource('nadaba-37-zaku242'), { measurer });
    expect(fontSizes(svg)).toEqual(['10.145', '10.145']);
    expect(svg).toContain('viewBox="0 0 133 50"');
  });

  it('kujiji-68-cujo036 (`scale 900 width`): font-size 9.874, jar pre width=1276.14375 (D3 residual: font rounds from 9.8735)', () => {
    const svg = renderSync(fixtureSource('kujiji-68-cujo036'), { measurer });
    // D3 (C-13): the jar itself rounds this boundary value to 9.874; with
    // the layout read at graphviz's 2-dp `-Tsvg` precision (cdd3-T-D3,
    // DotStringFactory.java:388-396) our k lands on it too.
    expect(fontSizes(svg)).toEqual(Array(11).fill('9.874'));
    expect(svg).toContain('viewBox="0 0 900 145"');
  });
});
