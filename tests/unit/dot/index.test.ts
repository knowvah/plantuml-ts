import { describe, it, expect } from 'vitest';
import { dotPlugin } from '../../../src/diagrams/dot/index.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { assembleSvg } from '../../../src/index.js';

const measurer = new FormulaMeasurer();
const theme = defaultTheme;

function makeSource(lines: string[], rawStyles: string[] = []): UmlSource {
  return { type: 'dot', lines, rawStyles };
}

function renderFull(source: UmlSource): string {
  const ast = dotPlugin.parse(source);
  const geo = dotPlugin.layoutSync(ast, theme, measurer);
  return assembleSvg(dotPlugin.render(geo, theme));
}

describe('dotPlugin.parse()', () => {
  it('passes rawStyles from UmlSource into AST', () => {
    const source = makeSource(['@startdot', 'digraph { a }', '@enddot'], ['node { BackgroundColor: red }']);
    const ast = dotPlugin.parse(source);
    expect(ast.rawStyles).toHaveLength(1);
    expect(ast.rawStyles[0]).toContain('BackgroundColor');
  });

  it('rawStyles defaults to [] when UmlSource provides none', () => {
    const source: UmlSource = { type: 'dot', lines: ['@startdot', 'digraph { a }', '@enddot'] };
    const ast = dotPlugin.parse(source);
    expect(ast.rawStyles).toEqual([]);
  });
});

describe('dotPlugin.layoutSync() — skinparam overrides', () => {
  it('skinparam BackgroundColor is accepted without error', () => {
    const source = makeSource([
      '@startdot',
      'skinparam BackgroundColor #AABBCC',
      'digraph { a -> b }',
      '@enddot',
    ]);
    expect(() => renderFull(source)).not.toThrow();
  });

  it('skinparam FontColor is accepted without error', () => {
    const source = makeSource([
      '@startdot',
      'skinparam FontColor #FF0000',
      'digraph { a -> b }',
      '@enddot',
    ]);
    expect(() => renderFull(source)).not.toThrow();
  });
});

describe('dotPlugin.layoutSync() — <style> block overrides', () => {
  it('node BackgroundColor applies without error and produces SVG', () => {
    const svg = renderFull(makeSource(
      ['@startdot', 'digraph { a -> b }', '@enddot'],
      ['node { BackgroundColor: #FFD700 }'],
    ));
    expect(svg).toContain('<svg');
    expect(svg).toContain('#FFD700');
  });

  it('node BorderColor applies without error and produces SVG', () => {
    const svg = renderFull(makeSource(
      ['@startdot', 'digraph { a }', '@enddot'],
      ['node { BorderColor: #C00 }'],
    ));
    expect(svg).toContain('#C00');
  });

  it('diagram BackgroundColor applies without error and produces SVG', () => {
    const svg = renderFull(makeSource(
      ['@startdot', 'digraph { a -> b }', '@enddot'],
      ['diagram { BackgroundColor: #E0F0FF }'],
    ));
    expect(svg).toContain('<svg');
    expect(svg).toContain('#E0F0FF');
  });

  it('edge LineColor applies without error and produces SVG', () => {
    const svg = renderFull(makeSource(
      ['@startdot', 'digraph { a -> b }', '@enddot'],
      ['edge { LineColor: #0A0 }'],
    ));
    expect(svg).toContain('<svg');
    expect(svg).toContain('#0A0');
  });

  it('multiple style rules in one block all apply', () => {
    const svg = renderFull(makeSource(
      ['@startdot', 'digraph { a -> b }', '@enddot'],
      ['node { BackgroundColor: #FEC }\nedge { LineColor: #08F }'],
    ));
    expect(svg).toContain('#FEC');
    expect(svg).toContain('#08F');
  });

  it('diagram FontColor applies to SVG text', () => {
    const svg = renderFull(makeSource(
      ['@startdot', 'digraph { a }', '@enddot'],
      ['diagram { FontColor: #A0A }'],
    ));
    expect(svg).toContain('#A0A');
  });

  it('diagram FontName applies without error', () => {
    expect(() => renderFull(makeSource(
      ['@startdot', 'digraph { a }', '@enddot'],
      ['diagram { FontName: Helvetica }'],
    ))).not.toThrow();
  });

  it('diagram FontSize applies without error', () => {
    expect(() => renderFull(makeSource(
      ['@startdot', 'digraph { a }', '@enddot'],
      ['diagram { FontSize: 12 }'],
    ))).not.toThrow();
  });

  it('node FontColor applies to SVG text', () => {
    const svg = renderFull(makeSource(
      ['@startdot', 'digraph { a }', '@enddot'],
      ['node { FontColor: #050 }'],
    ));
    expect(svg).toContain('#050');
  });

  it('node FontSize and FontName apply without error', () => {
    expect(() => renderFull(makeSource(
      ['@startdot', 'digraph { a -> b }', '@enddot'],
      ['node { FontSize: 16\nFontName: Courier }'],
    ))).not.toThrow();
  });

  it('edge FontColor applies without error', () => {
    expect(() => renderFull(makeSource(
      ['@startdot', 'digraph { a -> b }', '@enddot'],
      ['edge { FontColor: #880088 }'],
    ))).not.toThrow();
  });

  it('empty rawStyles array leaves theme unchanged', () => {
    const svgDefault = renderFull(makeSource(['@startdot', 'digraph { a }', '@enddot']));
    const svgStyled = renderFull(makeSource(['@startdot', 'digraph { a }', '@enddot'], []));
    expect(svgDefault).toBe(svgStyled);
  });
});

describe('dotPlugin.accepts()', () => {
  it('always returns false (routing handled by START_SUFFIX_MAP)', () => {
    expect(dotPlugin.accepts(['@startdot', 'digraph { a }', '@enddot'])).toBe(false);
    expect(dotPlugin.accepts([])).toBe(false);
  });
});
