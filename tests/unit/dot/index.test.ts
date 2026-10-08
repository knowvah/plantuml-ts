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
 * BYTE-IDENTICAL to the same block without it (`UmlSource#removeInitialNoise`
 * drops it, UmlSource.java:79-106; a `<style>` there is a syntax error).
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

function makeSource(lines: string[]): UmlSource {
  return { type: 'dot', lines };
}

function renderFull(source: UmlSource): string {
  const ast = parseAst(dotPlugin, source);
  const geo = dotPlugin.layoutSync(ast, theme, measurer);
  return assembleSvg(dotPlugin.render(geo, theme));
}

const GRAPH = ['digraph G {', '  a -> b;', '}'];
const DOC = ['@startdot', ...GRAPH, '@enddot'];

describe('dotPlugin — skin directives are inert, as upstream', () => {
  const baseline = renderFull(makeSource(GRAPH));

  it('a skinparam line changes nothing about the output', () => {
    const withSkin = renderFull(makeSource(['skinparam BackgroundColor #AABBCC', ...GRAPH]));
    expect(withSkin).toBe(baseline);
  });

  it('several skinparam lines still change nothing', () => {
    const withSkin = renderFull(
      makeSource([
        'skinparam BackgroundColor #AABBCC',
        'skinparam FontColor #FF0000',
        'skinparam FontSize 22',
        ...GRAPH,
      ]),
    );
    expect(withSkin).toBe(baseline);
  });
});

describe('dotPlugin — output shape', () => {
  it("emits graphviz's document, untouched by assembleSvg", () => {
    const svg = renderFull(makeSource(GRAPH));
    expect(svg).toContain('id="graph0"');
    expect(svg).toMatch(/width="\d+pt"/);
  });

  it("a title before the header is the jar's syntax-error page, not chrome", () => {
    // PSystemDotFactory.java:71-77 + PSystemBasicFactory.java:61-64.
    const svg = renderSync(['@startdot', 'title My Graph', ...GRAPH, '@enddot'].join('\n'));
    expect(svg).toContain('Syntax Error? (Assumed diagram type: dot)');
    expect(svg).not.toContain('id="graph0"');
  });

  it("emits graphviz's document verbatim through the real entry point when there is no chrome", () => {
    const svg = renderSync(DOC.join('\n'));
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg).not.toContain('<marker');
  });
});
