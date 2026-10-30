/**
 * T4a (jfp M5): `scale` is applied AT EMIT, after a 1x layout, as upstream
 * does -- `SvgGraphics#format` multiplies every emitted numeric
 * (`SvgGraphics.java:468-475`), so every length is computed at 1x first.
 *
 * Expected values are the Java arithmetic, quoted per test; the two jar
 * oracles (`yaml/nuzaje-74-kenu009`, `json/timafu-94-bixe774`) are covered end
 * to end by `plans/json-family-parity/tools/residue.mts` and cannot be read
 * from a committed fixture.
 */
import { describe, it, expect } from 'vitest';
import { renderJson } from '../../../src/diagrams/json/renderer.js';
import { assembleSvg } from '../../../src/index.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { JsonGeometry, JsonNodeGeo, JsonEdgeGeo } from '../../../src/diagrams/json/layout.js';
import { jsonStylesOf } from '../../helpers/json-skin.js';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SCALE_2 = { kind: 'simple', factor: 2 } as const;
const SCALE_1_5 = { kind: 'simple', factor: 1.5 } as const;

function node(): JsonNodeGeo {
  return {
    id: 'n0',
    x: 10,
    y: 20,
    width: 200,
    height: 60,
    keyColWidth: 80,
    valueColWidth: 120,
    rows: [
      {
        key: 'name',
        value: 'Alice',
        valueType: 'string',
        valueLines: ['Alice'],
        highlight: false,
        arrayEntry: false,
        y: 4,
        height: 20,
        keyWidth: 30,
        valueLineWidths: [40],
        keyTextLength: 30,
        valueTextLengths: [40],
        keyBaselineY: 16,
        valueBaselineYs: [16],
        keyAtoms: [{ text: 'name', dx: 0, textLength: 30 }],
        valueAtoms: [[{ text: 'Alice', dx: 0, textLength: 40 }]],
      },
    ],
  };
}

function geoOf(overrides: Partial<JsonGeometry>): JsonGeometry {
  return { styles: jsonStylesOf('json'), nodes: [node()], edges: [], width: 400, height: 300, ...overrides };
}

/** The plugin's own assembly: `json/index.ts#render` stamps the diagram type that selects the jar shell. */
const render = (geo: JsonGeometry): string => assembleSvg({ ...renderJson(geo, defaultTheme), diagramType: 'JSON' });

describe('scale at emit -- lengths introduced after layout stay 1x until the multiply', () => {
  it('CELL_MARGIN_X is added at 1x: key text x = (node.x + 5) * 2, not node.x * 2 + 5', () => {
    // TextBlockUtils.withMargin(..., 5, 2) (TextBlockJson.java:348) runs before the
    // scale; (10 + 5) * 2 = 30. The pre-T4a port emitted 10 * 2 + 5 = 25.
    const svg = render(geoOf({ scale: SCALE_2, finalDimension: { width: 399, height: 299 } }));
    expect(svg).toMatch(/<text x="30" y="/);
    expect(svg).not.toContain('<text x="25"');
  });

  it('font-size, textLength and node geometry are all the 1x value times k', () => {
    const svg = render(geoOf({ scale: SCALE_2, finalDimension: { width: 399, height: 299 } }));
    expect(svg).toContain('font-size="28"');
    expect(svg).toContain('textLength="60"');
    expect(svg).toContain('<rect x="20" y="40" width="400" height="120"');
  });

  it('VERY_FIRST_LINE is applied at 1x: the spot sits 13 back from the spline start, emitted as 26', () => {
    // SmetanaForJson.java:173 / JsonCurve.java:119-121: supp(p0, p1, 13) at 1x.
    // p0 = (100, 50), p1 = (110, 50) -> spot (87, 50) -> emitted (174, 100).
    // The pre-T4a port scaled the points first: 200 - 13 = 187.
    const edge: JsonEdgeGeo = {
      points: [
        { x: 100, y: 50 },
        { x: 110, y: 50 },
      ],
      spline: false,
    };
    const svg = render(geoOf({ scale: SCALE_2, edges: [edge], finalDimension: { width: 399, height: 299 } }));
    expect(svg).toContain('<ellipse cx="174" cy="100" rx="6" ry="6"');
    expect(svg).toContain('d="M 174 100 L 200 100"');
  });

  it('ep is scaled with the points: the arrowhead is built at 1x then multiplied', () => {
    // Arrow#drawArrow (Arrow.java) at 1x: last point (160, 50), ep (170, 50),
    // dist 10, alpha = atan2(10, 0) = 90deg -> barbs (160, 54) / (160, 46) at
    // 0.4 * dist, notch (163, 50) at 0.3 * dist, tip = ep. Times 2:
    // M 320 108 L 326 100 L 320 92 L 340 100 L 320 108.
    const edge: JsonEdgeGeo = {
      points: [
        { x: 100, y: 50 },
        { x: 120, y: 50 },
        { x: 140, y: 50 },
        { x: 160, y: 50 },
      ],
      ep: { x: 170, y: 50 },
      spline: true,
    };
    const svg = render(geoOf({ scale: SCALE_2, edges: [edge], finalDimension: { width: 399, height: 299 } }));
    expect(svg).toContain('d="M 320 108 L 326 100 L 320 92 L 340 100 L 320 108"');
  });

  it('the arrow dash is multiplied once, at emit: skin LineStyle 3-3 -> 3,3 at 1x, 6,6 at scale 2', () => {
    // plantuml.skin:449-451 (`arrow { LineStyle 3-3 }`); jar-verified on json/timafu-94-bixe774.
    const edge: JsonEdgeGeo = {
      points: [
        { x: 100, y: 50 },
        { x: 110, y: 50 },
      ],
      spline: false,
    };
    const dim = { width: 399, height: 299 };
    expect(render(geoOf({ scale: SCALE_2, edges: [edge], finalDimension: dim }))).toContain('stroke-dasharray="6,6"');
    expect(render(geoOf({ edges: [edge], finalDimension: dim }))).toContain('stroke-dasharray="3,3"');
  });
});

describe('scale at emit -- the document size', () => {
  it('is (int)((int)(x + 1) * k): 192.85 -> 193 -> 386, never trunc(193.85 * 2) = 387', () => {
    // SvgGraphics.java:129-131 (maxX = (int)(x + 1)) and :801-802 ((int)(maxX * scale)),
    // jar-verified on yaml/nuzaje-74-kenu009 (golden width 386 at scale 2).
    const geo = geoOf({
      scale: SCALE_2,
      width: 193.85,
      height: 100.2,
      finalDimension: { width: 192.85, height: 99.2 },
    });
    const svg = render(geo);
    expect(svg).toContain('viewBox="0 0 386 200"');
    expect(svg).toContain('width="386px" height="200px"');
  });

  it('writes the root width/height as format(maxX * k) at 3 decimals, viewBox truncated', () => {
    // SvgGraphics.java:798-811: style/viewBox = (int)(maxX * scale), width/height = format(maxX).
    // maxX = 193, k = 1.5 -> 289.5 (viewBox 289); maxY = 100 -> 150.
    const geo = geoOf({
      scale: SCALE_1_5,
      width: 193.85,
      height: 100.2,
      finalDimension: { width: 192.85, height: 99.2 },
    });
    const svg = render(geo);
    expect(svg).toContain('width="289.5px" height="150px"');
    expect(svg).toContain('viewBox="0 0 289 150"');
  });

  it('leaves an unscaled diagram untouched: no scaledCanvas, the untruncated canvas', () => {
    const fragment = renderJson(geoOf({ width: 193.85, height: 100.2 }), defaultTheme);
    expect(fragment.scaledCanvas).toBeUndefined();
    expect(fragment.width).toBe(193.85);
    expect(fragment.height).toBe(100.2);
  });

  it('resolves the factor against the pre-bump dimension, not the canvas', () => {
    // `scale 100 width`: TextBlockExporter.java:205-209 reads calculateFinalDimension().
    const geo = geoOf({
      scale: { kind: 'width', target: 193 },
      width: 194,
      height: 100,
      finalDimension: { width: 193, height: 99 },
    });
    // 193 / 193 = 1 -> a no-op scale; resolved against the canvas (194) it would be 0.995.
    expect(renderJson(geo, defaultTheme).scaledCanvas).toBeUndefined();
  });
});

describe('scale at emit -- end to end on the nuzaje source (jar oracle yaml/nuzaje-74-kenu009)', () => {
  const NUZAJE = '@startyaml\nscale 2\nfruit: Apple\nsize: Large\ncolor: \n - Red\n - Green\n@endyaml';
  const svg = renderSync(NUZAJE, { measurer: new DeterministicMeasurer(), filename: 'in.puml' });

  it('carries the jar numbers where no Smetana arithmetic is involved', () => {
    // The numbers are the jar's in.svg verbatim (attribute order and the
    // `style=` spelling differ and are normalised by the structural gate): the
    // first node box, its first key text (CELL_MARGIN_X at 1x: 30, not 25) with
    // the 28px font, and its divider.
    expect(svg).toContain('<rect x="20" y="20" width="172.475" height="108"');
    expect(svg).toContain(
      '<text x="30" y="45.778" font-size="28" font-weight="700" fill="#000" textLength="46.55">fruit</text>',
    );
    expect(svg).toContain('<line x1="100.725" y1="20" x2="100.725" y2="56"');
  });

  it('emits the doubled spot radius and stroke, and the dash at 6,6', () => {
    // jar: <ellipse cx="167" cy="110" rx="6" ry="6" ... stroke-width:2;> and stroke-dasharray:6,6.
    expect(svg).toMatch(/<ellipse cx="[\d.]+" cy="110" rx="6" ry="6" fill="#000" stroke="#000" stroke-width="2"\/>/);
    expect(svg).toContain('stroke-dasharray="6,6"');
  });
});
