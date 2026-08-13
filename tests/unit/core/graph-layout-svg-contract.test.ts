/**
 * Contract test for the ONE remaining place `src/` reads the layout engine's
 * output as TEXT.
 *
 * `graph-layout.ts` recovers `tailLabel`/`headLabel` positions by regex-scanning
 * the SVG string `render()` returns, because `getLayout()`'s `EdgeGeometry`
 * publishes only `tail`, `head`, `points` and the CENTRE `label`. That is a
 * coupling to a serialization format no API contract governs, and it has
 * already broken once: the sibling scraper in `frontier-shadow-layout.ts` died
 * on dot-engine 1.2.x when node attributes began wrapping one per line, and it
 * surfaced as six description fixtures comparing a PlantUML *error diagram*
 * against their oracle — not as anything resembling a parse failure.
 *
 * These assertions exist so the NEXT such change fails here, naming the
 * coupling, instead of silently relocating edge labels. They deliberately
 * mirror the exact regex shapes `graph-layout.ts` relies on; if one of these
 * fails, that file needs updating, not this test.
 *
 * Retire all of this when `EdgeGeometry` gains the positions — tracked as
 * `docs/graphviz-issues/13-edge-tail-head-label-positions-not-in-getlayout.md`,
 * the same shape as issue 06 (cluster bbox), which landed and let the
 * frontier-shadow-layout scraper be deleted outright.
 */
import { describe, it, expect } from 'vitest';
import { parse, render, getLayout } from '@knowvah/dot-engine';
import '../../../src/core/dot-engine-measurer.js';

/** An edge carrying BOTH port labels, plus fixed-size nodes so the node-centre
 *  scraper (`parseNodeRenderCenters`, which derives the render→getLayout frame
 *  offset) has polygons to read. */
const DOT = `digraph G {
  rankdir=TB;
  a [shape=box, width=1, height=1, fixedsize=true, label=""];
  b [shape=box, width=1, height=1, fixedsize=true, label=""];
  a -> b [taillabel="T", headlabel="H"];
}`;

function renderSvg(): string {
  const g = parse(DOT);
  return String(render(g, 'svg', { engine: 'dot' }));
}

describe('graph-layout.ts SVG-scraping contract (dot-engine output shape)', () => {
  it('emits node blocks as `<g id="nodeN" class="node">` with a `<title>` and `<polygon points=>`', () => {
    const svg = renderSvg();
    // Exactly `parseNodeRenderCenters`' regex.
    const nodeRe = /<g id="node\d+" class="node">\s*<title>([^<]*)<\/title>([\s\S]*?)<\/g>/g;
    const ids: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = nodeRe.exec(svg)) !== null) {
      ids.push(m[1] ?? '');
      expect(
        /points="([^"]+)"/.test(m[2] ?? ''),
        'a node block carried no `points="…"` — parseNodeRenderCenters would skip it and the ' +
          'render→getLayout frame offset would be underdetermined',
      ).toBe(true);
    }
    expect(
      ids.sort(),
      'node <g> block shape changed; graph-layout.ts#parseNodeRenderCenters needs updating',
    ).toEqual(['a', 'b']);
  });

  it('emits edge blocks as `<g id="edgeN" class="edge">` with a `tail->head` title', () => {
    const svg = renderSvg();
    // Exactly `parsePortLabelBlocks`' regex.
    const edgeRe = /<g id="edge\d+" class="edge">\s*<title>([^<]*)<\/title>([\s\S]*?)<\/g>/g;
    const m = edgeRe.exec(svg);
    expect(m, 'no edge <g> block matched; graph-layout.ts#parsePortLabelBlocks needs updating').not.toBeNull();
    // `decodeSvgEntities` maps `&#45;` back to `-`; the title must still carry
    // the `->` separator parsePortLabelBlocks splits on.
    const title = (m![1] ?? '').replace(/&#45;/g, '-').replace(/&gt;/g, '>');
    expect(title.includes('->'), `edge <title> lost its "->" separator: ${title}`).toBe(true);
  });

  it('emits one `<text x= y=>` per port label, which is how they are recovered at all', () => {
    const svg = renderSvg();
    const edgeRe = /<g id="edge\d+" class="edge">\s*<title>([^<]*)<\/title>([\s\S]*?)<\/g>/g;
    const m = edgeRe.exec(svg);
    const body = m?.[2] ?? '';
    const textRe = /<text\b[^>]*\bx="(-?[\d.]+)"[^>]*\by="(-?[\d.]+)"[^>]*>/g;
    const texts: Array<{ x: number; y: number }> = [];
    let tm: RegExpExecArray | null;
    while ((tm = textRe.exec(body)) !== null) texts.push({ x: Number(tm[1]), y: Number(tm[2]) });
    // No centre `label` on this edge, so the two texts are exactly head then
    // tail — the emit order `pickPortLabelTexts` indexes into.
    expect(
      texts,
      'expected exactly two <text> positions (headlabel, taillabel) inside the edge block; ' +
        'graph-layout.ts#pickPortLabelTexts indexes by this emit ORDER',
    ).toHaveLength(2);
    for (const t of texts) {
      expect(Number.isFinite(t.x) && Number.isFinite(t.y)).toBe(true);
    }
  });

  it('still does NOT publish the same positions through getLayout — the reason the scraping exists', () => {
    const g = parse(DOT);
    render(g, 'svg', { engine: 'dot' });
    const snap = getLayout(g, { yAxis: 'down' });
    const edge = snap.edges[0];
    expect(edge, 'expected one edge in the snapshot').toBeDefined();
    // The day this stops being true, delete the scraping in graph-layout.ts and
    // this file with it. See docs/graphviz-issues/13-*.md.
    const withLabels = edge as unknown as Record<string, unknown>;
    expect(
      withLabels['tailLabel'] ?? withLabels['headLabel'],
      'dot-engine now publishes tail/head label positions — retire the SVG scraping in ' +
        'graph-layout.ts and delete this contract test (docs/graphviz-issues/13-*.md)',
    ).toBeUndefined();
  });
});
