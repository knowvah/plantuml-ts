import { describe, it, expect } from 'vitest';
import { renderSync } from '../../src/index.js';
import { parseJson } from '../../src/diagrams/json/parser.js';
import jsonFixtures from '../visual/data/json.json';

function getMarkup(prefix: string): string {
  const f = (jsonFixtures as Array<{ slug: string; markup: string }>).find(
    (x) => x.slug.startsWith(prefix),
  );
  if (!f) throw new Error(`Fixture not found: ${prefix}`);
  return f.markup;
}

// ---------------------------------------------------------------------------
// Style block not bleeding into JSON body
// ---------------------------------------------------------------------------

describe('JSON style: <style> block does not pollute JSON body', () => {
  it('kusule-69: jsonDiagram is not parsed as a JSON key', () => {
    const markup = getMarkup('kusule-69');
    const ast = parseJson({ lines: markup.split('\n'), type: 'json' });
    expect(ast.root).not.toHaveProperty('jsonDiagram');
    expect(ast.root).not.toHaveProperty('jsondDiagram');
  });

  it('dometa-86: element selector is not parsed as a JSON key', () => {
    const markup = getMarkup('dometa-86');
    const ast = parseJson({ lines: markup.split('\n'), type: 'json' });
    expect(ast.root).not.toHaveProperty('element');
  });

  it('moseba-10: style keys do not appear as node keys in SVG', () => {
    const svg = renderSync(getMarkup('moseba-10'));
    expect(svg).not.toContain('>jsonDiagram<');
    expect(svg).not.toContain('>node<');
    expect(svg).not.toContain('>arrow<');
  });
});

// ---------------------------------------------------------------------------
// Custom node background color
// ---------------------------------------------------------------------------

describe('JSON style: node background color', () => {
  it('kusule-69: BackGroundColor black resolves to #000000 in SVG', () => {
    const svg = renderSync(getMarkup('kusule-69'));
    expect(svg).toContain('<svg');
    // black background must appear as a fill somewhere on the node rects
    expect(svg).toMatch(/fill="(black|#000000|#000)"/);
  });

  it('moseba-10: BackGroundColor Khaki appears in SVG', () => {
    const svg = renderSync(getMarkup('moseba-10'));
    expect(svg).toContain('<svg');
    expect(svg.length).toBeGreaterThan(200);
    // G1c: named colors resolve to their canonical jar hex.
    expect(svg).toContain('fill="#F0E68C"');
  });
});

// ---------------------------------------------------------------------------
// Custom font color
// ---------------------------------------------------------------------------

describe('JSON style: FontColor', () => {
  it('kusule-69: FontColor #CCFF02 appears on text elements', () => {
    const svg = renderSync(getMarkup('kusule-69'));
    expect(svg).toContain('#CCFF02');
  });
});

// ---------------------------------------------------------------------------
// Custom highlight color
// ---------------------------------------------------------------------------

describe('JSON style: highlight BackGroundColor override', () => {
  it('kusule-69: highlight BackGroundColor red — #highlight row uses red fill', () => {
    const svg = renderSync(getMarkup('kusule-69'));
    // Custom highlight color red must appear for the highlighted row rect.
    // Note: #CCFF02 also appears as FontColor on text elements — that is expected.
    // G1c: named colors resolve to their canonical jar hex.
    expect(svg).toContain('fill="#F00"');
  });

  it('dometa-86: element highlight BackgroundColor red overrides default highlight', () => {
    const svg = renderSync(getMarkup('dometa-86'));
    expect(svg).toContain('<svg');
    // red highlight must appear for the #highlight "lastName" row
    // G1c: named colors resolve to their canonical jar hex.
    expect(svg).toContain('fill="#F00"');
  });

  it('default highlight: no <style> block uses #CCFF02 for highlighted rows', () => {
    const svg = renderSync(
      '@startjson\n#highlight "key"\n{"key": "value", "other": "x"}\n@endjson',
    );
    expect(svg).toContain('#CCFF02');
  });
});

// ---------------------------------------------------------------------------
// RoundCorner style property
// ---------------------------------------------------------------------------

describe('JSON style: RoundCorner', () => {
  it('kusule-69: RoundCorner 0 emits NO rx/ry on the node rect', () => {
    // This test previously asserted `rx="0"`, which encoded a defect: upstream
    // guards both attributes behind `if (rx > 0 && ry > 0)`
    // (`SvgGraphics.java:580-583`), so a zero radius removes them rather than
    // writing zeros. Every cached `<style> … RoundCorner: 0` golden agrees.
    const svg = renderSync(getMarkup('kusule-69'));
    expect(svg).not.toContain('rx="0"');
    expect(svg).not.toContain('ry="0"');
    // Still a real render, so the assertion cannot pass vacuously.
    expect(svg).toContain('<rect');
  });

  it('noleta-28: RoundCorner 4 produces rx="2" on node rect', () => {
    const svg = renderSync(getMarkup('noleta-28'));
    // `DriverRectangleSvg.java:78` emits `rx/2`, `ry/2`.
    expect(svg).toContain('rx="2" ry="2"');
  });
});

// ---------------------------------------------------------------------------
// No-space path separator in #highlight
// ---------------------------------------------------------------------------

describe('JSON style: #highlight path separator variants', () => {
  it('mudumo-73: no-space slash in path applies highlight color to target row', () => {
    const svg = renderSync(getMarkup('mudumo-73'));
    // Four #highlight directives — at least one default highlight rect must appear
    expect(svg).toContain('#CCFF02');
  });

  it('mixed separators: "a"/"b" and "c" / "d" both resolve correctly', () => {
    const svg = renderSync(
      '@startjson\n' +
      '#highlight "a"/"b"\n' +
      '#highlight "a" / "c"\n' +
      '{"a": {"b": 1, "c": 2, "d": 3}}\n' +
      '@endjson',
    );
    // Two highlighted rows → highlight color appears twice
    const count = (svg.match(/#CCFF02/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Multiple diagrams on same page — defs ID uniqueness
// ---------------------------------------------------------------------------

// A5/T6b: the "Array index keys" divergence is retired. Upstream never draws
// an array index -- it uses the index only to resolve `#highlight` -- and it
// draws no column divider for a node whose lines all have a null `b2`.
describe('JSON: array rows match upstream (index-key divergence retired)', () => {
  it('does not draw the array index as a key', () => {
    const svg = renderSync('@startjson\n["alpha", "beta"]\n@endjson');
    expect(svg).toContain('alpha');
    expect(svg).toContain('beta');
    // The indices 0 and 1 must not appear as their own text runs.
    expect(svg).not.toMatch(/>0</);
    expect(svg).not.toMatch(/>1</);
  });

  it('draws no column divider for an array node', () => {
    const array = renderSync('@startjson\n["alpha", "beta"]\n@endjson');
    const object = renderSync('@startjson\n{"a": "alpha", "b": "beta"}\n@endjson');
    // The object node has a vertical divider; the array node must not.
    const verticals = (svg: string): number =>
      [...svg.matchAll(/<line[^>]*x1="([\d.]+)"[^>]*x2="([\d.]+)"/g)]
        .filter((m) => m[1] === m[2]).length;
    expect(verticals(object)).toBeGreaterThan(0);
    expect(verticals(array)).toBe(0);
  });

  it('still resolves #highlight by array index, which upstream also does', () => {
    const svg = renderSync('@startjson\n#highlight "1"\n["alpha", "beta"]\n@endjson');
    expect(svg).toContain('beta');
  });
});

/**
 * These two cases used to assert the OPPOSITE — that repeated renders produce
 * DIFFERENT ids — which codified a `Math.random()` call in the render path.
 * That violated CLAUDE.md outright: *"every non-determinism (uid counters,
 * gradient/shadow ids) is seeded so output is reproducible."* The salt is now
 * derived from the diagram's own geometry (`renderer.ts#saltFor`, via
 * upstream's `UmlSource.seed()`), so the property under test inverts.
 *
 * The uniqueness the salt actually exists for — two DIFFERENT diagrams sharing
 * one HTML page must not collide — is what the second pair of cases pins, and
 * that is preserved.
 */
describe('JSON style: the document generates no ids at all', () => {
  // This suite used to pin the DETERMINISM of two generated id namespaces
  // (`json-node-clip-…`, `arrow-json-dep-…`), which existed because the
  // renderer once emitted a per-node `<clipPath>` and an arrowhead `<marker>`.
  // A5's M2/M3 removed both: upstream clips nothing in this family and draws
  // its arrowheads as inline filled paths, so the jar's json documents contain
  // an EMPTY `<defs/>` and no `id=` anywhere.
  //
  // The property is now stronger than determinism and is asserted as such —
  // an id that is never emitted cannot collide, and cannot be non-deterministic.
  const NESTED = '@startjson\n{"a": {"b": 1}}\n@endjson';

  it('emits no clipPath and no marker', () => {
    const svg = renderSync(NESTED);
    expect(svg).not.toContain('clipPath');
    expect(svg).not.toContain('<marker');
    expect(svg).toContain('<defs/>');
  });

  it('emits no generated id of any kind', () => {
    expect(renderSync(NESTED)).not.toMatch(/\bid="/);
  });

  it('is byte-identical across renders of the same source', () => {
    expect(renderSync(NESTED)).toBe(renderSync(NESTED));
  });
});
