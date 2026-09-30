/**
 * cdd7-T1a: class edge paint -- `skinparam ArrowLollipopColor` on the `(0`
 * middle decor (`SvekEdge.java:266-268` -> `MiddleCircleCircled.java:76,88`)
 * and a gradient `skinparam arrowColor` stroking the edge through
 * `DriverDotPathSvg` -> `DriverRectangleSvg#applyStrokeColor` ->
 * `SvgGraphics#createSvgGradient` (`DriverDotPathSvg.java`,
 * `DriverRectangleSvg.java:103-107`, `SvgGraphics.java:367-394`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { renderEdgeDotPath } from '../../../src/diagrams/class/renderer-edge-extras.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';

const LOLLIPOP_BODY = 'something -right(0- anything : description';

function render(lines: readonly string[]): string {
  return renderSync(`@startuml\n${lines.join('\n')}\n@enduml`);
}

/** The inner `MiddleCircleCircled` circle: the only 6x6 ellipse drawn. */
function innerEllipseFill(svg: string): string | undefined {
  return /<ellipse[^>]*rx="6"[^>]*ry="6"[^>]*fill="([^"]+)"/.exec(svg)?.[1];
}

describe('ArrowLollipopColor (SvekEdge.java:266-268)', () => {
  it('lands on theme.colors.arrowLollipopColor', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['arrowLollipopColor', '#red']]), defaultTheme);
    expect(theme.colors.arrowLollipopColor).toBe('#red');
    expect(unknown).toEqual([]);
  });

  it('fills the (0 inner circle with the lollipop colour', () => {
    const svg = render(['skinparam arrowLollipopColor #red', LOLLIPOP_BODY]);
    expect(innerEllipseFill(svg)).toBe('#F00');
  });

  it('falls back to the diagram background without the skinparam', () => {
    expect(innerEllipseFill(render([LOLLIPOP_BODY]))).toBe('#FFF');
    expect(innerEllipseFill(render(['skinparam backgroundColor #EEEEEE', LOLLIPOP_BODY]))).toBe('#EEE');
  });
});

describe('gradient arrowColor (DriverDotPathSvg -> createSvgGradient)', () => {
  it('stores the arrow colour as a Paint gradient', () => {
    const { theme } = resolveSkinparam(new Map([['classArrowColor', 'Red|Green']]), defaultTheme);
    expect(theme.colors.arrow).toEqual({ color1: 'Red', color2: 'Green', policy: '|' });
  });

  it('emits exactly one horizontal linearGradient and strokes the edge with it', () => {
    const svg = render(['skinparam classArrowColor Red|Green', 'A - B']);
    const defs = svg.match(/<linearGradient[^>]*>/g) ?? [];
    expect(defs).toHaveLength(1);
    const id = /<linearGradient[^>]*id="([^"]+)"/.exec(svg)?.[1];
    expect(defs[0]).toContain('x1="0%" y1="50%" x2="100%" y2="50%"');
    expect(svg).toContain('<stop stop-color="#F00" offset="0%"/><stop stop-color="#008000" offset="100%"/>');
    const edgePath = /<path[^>]*id="A-B"[^>]*>/.exec(svg)?.[0];
    expect(edgePath).toContain(`stroke:url(#${String(id)});stroke-width:1;`);
    expect(svg).not.toContain('Red|Green');
  });

  it('a flat arrow colour emits no gradient def', () => {
    const svg = render(['skinparam classArrowColor Red', 'A - B']);
    expect(svg).not.toContain('<linearGradient');
    expect(svg).toContain('fill="none" stroke="#F00" stroke-width="1" id="A-B"');
  });

  it('dashes both a dashed link style and a [dashed] bracket, sharing one def (oracle probe)', () => {
    // Jar probe (1.2026.8beta1): both edges `stroke:url(#g..0);stroke-width:1;
    // stroke-dasharray:7,7;`, both arrowheads `fill="url(#g..0)"`, ONE def.
    const svg = render(['skinparam classArrowColor Red|Green', 'A ..> B', 'C -[dashed]-> D']);
    expect(svg.match(/<linearGradient/g) ?? []).toHaveLength(1);
    const id = String(/<linearGradient[^>]*id="([^"]+)"/.exec(svg)?.[1]);
    for (const linkId of ['A-to-B', 'C-to-D']) {
      const edgePath = new RegExp(`<path[^>]*id="${linkId}"[^>]*>`).exec(svg)?.[0];
      expect(edgePath).toContain(`stroke:url(#${id});stroke-width:1;stroke-dasharray:7,7;`);
    }
    expect(svg.match(new RegExp(`fill="url\\(#${id}\\)"`, 'g')) ?? []).toHaveLength(2);
  });

  it('renderEdgeDotPath declines a point list that is not a 1 + 3n spline', () => {
    const geo = { points: [], sourceLine: 1 } as unknown as EdgeGeo;
    const stroke = {
      color: { color1: 'Red', color2: 'Green', policy: '|' as const },
      thickness: 1,
      linkId: 'A-B',
      k: 1,
    };
    expect(
      renderEdgeDotPath(
        geo,
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        stroke,
      ),
    ).toBeUndefined();
  });
});
