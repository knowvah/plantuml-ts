/**
 * `dotPlugin` — the assembled `@startdot` pipeline.
 *
 * This file used to assert that `skinparam` and `<style>` blocks recolored
 * the output. They never did upstream, and now they do not here either: the
 * jar renders `@startdot` by handing the DOT to graphviz and writing its bytes
 * out (`directdot/PSystemDot`), so a PlantUML skin has nothing to act on.
 *
 * That is not an assumption. Measured against the pinned oracle jar: a block
 * with `skinparam BackgroundColor #AABBCC` above its `digraph` produces output
 * BYTE-IDENTICAL to the same block without it. The old assertions were
 * asserting a divergence; these assert the faithful behaviour.
 */
import { describe, it, expect } from 'vitest';

import { dotPlugin } from '../../../src/diagrams/dot/index.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { assembleSvg, renderSync } from '../../../src/index.js';
import { parseAst } from '../../helpers/parse-ast.js';

const measurer = new FormulaMeasurer();
const theme = defaultTheme;

function makeSource(lines: string[], rawStyles: string[] = []): UmlSource {
  return { type: 'dot', lines, rawStyles };
}

function renderFull(source: UmlSource): string {
  const ast = parseAst(dotPlugin, source);
  const geo = dotPlugin.layoutSync(ast, theme, measurer);
  return assembleSvg(dotPlugin.render(geo, theme));
}

const GRAPH = ['@startdot', 'digraph G {', '  a -> b;', '}', '@enddot'];

describe('parseAst(dotPlugin, )', () => {
  it('passes rawStyles from UmlSource into the AST', () => {
    const ast = parseAst(dotPlugin, makeSource(GRAPH, ['node { BackgroundColor: red }']));
    expect(ast.rawStyles).toHaveLength(1);
    expect(ast.rawStyles[0]).toContain('BackgroundColor');
  });

  it('rawStyles defaults to [] when UmlSource provides none', () => {
    const ast = parseAst(dotPlugin, { type: 'dot', lines: GRAPH });
    expect(ast.rawStyles).toEqual([]);
  });
});

describe('dotPlugin — skin directives are inert, as upstream', () => {
  const baseline = renderFull(makeSource(GRAPH));

  it('a skinparam line changes nothing about the output', () => {
    const withSkin = renderFull(
      makeSource(['@startdot', 'skinparam BackgroundColor #AABBCC', ...GRAPH.slice(1)]),
    );
    expect(withSkin).toBe(baseline);
  });

  it('several skinparam lines still change nothing', () => {
    const withSkin = renderFull(
      makeSource([
        '@startdot',
        'skinparam BackgroundColor #AABBCC',
        'skinparam FontColor #FF0000',
        'skinparam FontSize 22',
        ...GRAPH.slice(1),
      ]),
    );
    expect(withSkin).toBe(baseline);
  });

  it('a <style> block changes nothing', () => {
    const withStyle = renderFull(
      makeSource(GRAPH, ['node { BackgroundColor: red }', 'edge { LineColor: blue }']),
    );
    expect(withStyle).toBe(baseline);
  });

  it('an empty rawStyles array changes nothing', () => {
    expect(renderFull(makeSource(GRAPH, []))).toBe(baseline);
  });
});

describe('dotPlugin — output shape', () => {
  it('emits graphviz\'s document, untouched by assembleSvg', () => {
    const svg = renderFull(makeSource(GRAPH));
    expect(svg).toContain('id="graph0"');
    expect(svg).toMatch(/width="\d+pt"/);
  });

  it('renders chrome when the block carries a title (deliberate divergence)', () => {
    // Through the real entry point, not `renderFull`: chrome is composed by
    // `applyAnnotationChrome` inside src/index.ts's render path, which
    // `assembleSvg` alone does not reach.
    const svg = renderSync(['@startdot', 'title My Graph', ...GRAPH.slice(1)].join('\n'));
    expect(svg).toContain('My Graph');
    expect(svg).toContain('id="graph0"');
  });

  it('emits graphviz\'s document verbatim through the real entry point when there is no chrome', () => {
    const svg = renderSync(GRAPH.join('\n'));
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg).not.toContain('<marker');
  });
});

describe('dotPlugin.accepts()', () => {

});
