/**
 * The registered wbs plugin end to end: `renderSync` over a `@startwbs`
 * source against the jar (`scripts/oracle-render.sh` probes under
 * `tests/fixtures/wbs/`, and the cached corpus goldens under
 * `test-results/dot-cache/wbs/`), through the same
 * `compareSvg(…, 'deterministic')` the survey and `render-diff.mts` use.
 *
 * - `WBSDiagram#drawU`/`calculateDimension` (WBSDiagram.java:99-107): the
 *   fork at `UTranslate(10, 10)`, the dimension `delta(20)`;
 * - `calculateMargin` (core/TextBlockExporter.java:510-516): the style
 *   `Margin` else `getDefaultMargins()` = `same(10)` (TitledDiagram.java:274-277);
 * - `muteColorMapper` (TitledDiagram.java:291-313) and the document
 *   background (TitledDiagram.java:279-289);
 * - chrome around the raw block, then the margin and `scale`
 *   (UgDiagram.java:123-131, TextBlockExporter.java:159-209);
 * - a line no command accepts is the jar's error page; ours is our own (D8).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const measurer = new DeterministicMeasurer();
const PROBES = 'tests/fixtures/wbs';

interface Fixture {
  readonly markup: string;
  readonly golden: string;
}

function probe(name: string): Fixture {
  return {
    markup: readFileSync(`${PROBES}/${name}.puml`, 'utf8'),
    golden: readFileSync(`${PROBES}/${name}.svg`, 'utf8'),
  };
}

function corpus(row: string): Fixture {
  const dir = `test-results/dot-cache/${row}`;
  return { markup: readFileSync(`${dir}/in.puml`, 'utf8'), golden: readFileSync(`${dir}/in.svg`, 'utf8') };
}

function diffPaths(f: Fixture): string[] {
  return compareSvg(renderSync(f.markup, { measurer }), f.golden, 'deterministic').diffs.map((d) => d.path);
}

function rootAttr(svg: string, name: string): string | undefined {
  const root = /^<svg[^>]*>/.exec(svg)?.[0] ?? '';
  return new RegExp(`\\s${name}="([^"]*)"`).exec(root)?.[1];
}

describe('wbs plugin — renderSync equals the jar', () => {
  it('routes @startwbs to WBS: `* r` is a 64x113 canvas (fork + 20 + same(10))', () => {
    const f = probe('single-root');
    const svg = renderSync(f.markup, { measurer });
    expect(rootAttr(svg, 'data-diagram-type')).toBe('WBS');
    expect(rootAttr(svg, 'viewBox')).toBe('0 0 64 113');
    expect(diffPaths(f)).toEqual([]);
  });

  it('`root { Margin 30 }` replaces same(10): 104x153 like the jar', () => {
    const f = probe('style-margin');
    expect(rootAttr(renderSync(f.markup, { measurer }), 'viewBox')).toBe('0 0 104 153');
    expect(diffPaths(f)).toEqual([]);
  });

  it('`wbsDiagram { BackgroundColor pink }` paints the document background', () => {
    const f = probe('background-pink');
    expect(rootAttr(renderSync(f.markup, { measurer }), 'style')).toContain('background:#FFC0CB;');
    expect(diffPaths(f)).toEqual([]);
  });

  it('a gradient document background paints the rect and leaves no root `background:` (SvgGraphics.java:178-183)', () => {
    const f = probe('gradient-background');
    expect(rootAttr(renderSync(f.markup, { measurer }), 'style')).toBe('width:67px;height:145px;');
    expect(diffPaths(f)).toEqual([]);
  });

  it.each([['monochrome-reverse'], ['reversecolor-dark']])('probe %s: the muted colour mapper', (name) => {
    expect(diffPaths(probe(name))).toEqual([]);
  });

  it('`scale 2` resolves against the margined dimension: 134x290 like the jar', () => {
    const f = probe('scale');
    expect(rootAttr(renderSync(f.markup, { measurer }), 'viewBox')).toBe('0 0 134 290');
    expect(diffPaths(f)).toEqual([]);
  });

  it('WBS-arrow-0: a link between coded nodes, 207x157', () => {
    const f = corpus('wbs/WBS-arrow-0');
    expect(rootAttr(renderSync(f.markup, { measurer }), 'viewBox')).toBe('0 0 207 157');
    expect(diffPaths(f)).toEqual([]);
  });
});

describe('wbs plugin — chrome', () => {
  it('title/caption/header/footer compose around the raw block: 86x219 like the jar', () => {
    const f = probe('chrome');
    expect(rootAttr(renderSync(f.markup, { measurer }), 'viewBox')).toBe('0 0 86 219');
    expect(diffPaths(f)).toEqual([]);
  });

  it('a mainframe frames the LimitFinder ink: 173x194 like the jar', () => {
    const f = probe('mainframe');
    expect(rootAttr(renderSync(f.markup, { measurer }), 'viewBox')).toBe('0 0 173 194');
    expect(diffPaths(f)).toEqual([]);
  });

  it('title + scale 2: 134x360 like the jar', () => {
    const f = probe('title-scale');
    expect(rootAttr(renderSync(f.markup, { measurer }), 'viewBox')).toBe('0 0 134 360');
    expect(diffPaths(f)).toEqual([]);
  });

  it('a style `Margin` outranks same(10) on the chrome path too: 140x238 like the jar', () => {
    const f = probe('style-margin-title');
    expect(rootAttr(renderSync(f.markup, { measurer }), 'viewBox')).toBe('0 0 140 238');
    expect(diffPaths(f)).toEqual([]);
  });
});

describe('wbs plugin — error pages (D8)', () => {
  it('a line no command accepts renders our error page, as the jar renders its own', () => {
    const svg = renderSync(probe('syntax-error').markup, { measurer });
    expect(rootAttr(svg, 'data-diagram-type')).not.toBe('WBS');
    expect(svg).toContain('Syntax Error?');
  });
});

describe('embedded wbs: activity/bozido-07-geze049', () => {
  it('the wbs slot draws at the jar size, 163x145', () => {
    const svg = renderSync(corpus('activity/bozido-07-geze049').markup, { measurer });
    const first = /<image width="(\d+)" height="(\d+)"/.exec(svg);
    expect([first?.[1], first?.[2]]).toEqual(['163', '145']);
  });
});
