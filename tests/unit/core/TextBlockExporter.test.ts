/**
 * sep-T5a: `finalizeTitledDiagramFragment` exports a chromed `TitledDiagram`
 * fragment with the margin its PRODUCER resolved
 * (`RenderFragment.exportMargin`) -- `TextBlockExporter.Builder
 * #calculateMargin`: the merged `{root, document}` style's `Margin`, else
 * `diagram.getDefaultMargins()` (`core/TextBlockExporter.java:510-516`) --
 * translated by `(left, top)` (`:173`), the canvas `calculateFinalDimension`
 * (`:198-202`) plus `ensureVisible`'s `(int)(v + 1)`
 * (`klimt/drawing/svg/SvgGraphics.java:129-135`), and the scale resolved
 * against the un-bumped final dimension (`computeScaleFactor`, `:205-209`).
 */
import { describe, expect, it } from 'vitest';
import { assembleSvg } from '../../../src/core/assemble-svg.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';
import { ClockwiseTopRightBottomLeft } from '../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { ROOT_GROUP_OPEN } from '../../../src/core/svg.js';
import { BODY_ANCHOR, finalizeTitledDiagramFragment, scaleFragmentBody } from '../../../src/core/TextBlockExporter.js';

/** `PSystemSalt#getDefaultMargins()` (PSystemSalt.java:238-240). */
const SALT_DEFAULT_MARGIN = ClockwiseTopRightBottomLeft.same(5);
/** `TitledDiagram#getDefaultMargins()` (TitledDiagram.java:274-277). */
const TITLED_DEFAULT_MARGIN = ClockwiseTopRightBottomLeft.same(10);

const INNER = '<text x="1" y="2">A</text>';

function chromed(overrides: Partial<RenderFragment>): RenderFragment {
  return { body: INNER, width: 100, height: 50, diagramType: 'SALT', bodyWrapped: true, ...overrides };
}

describe('finalizeTitledDiagramFragment — the producer-resolved margin', () => {
  it('same(5): body at (+5, +5), canvas (int)(100 + 10 + 1) x (int)(50 + 10 + 1)', () => {
    const out = finalizeTitledDiagramFragment(chromed({ exportMargin: SALT_DEFAULT_MARGIN }));
    expect(out.body).toBe('<text x="6" y="7">A</text>');
    expect([out.width, out.height]).toEqual([111, 61]);
  });

  it('same(10): the mindmap default is unchanged -- (int)(100 + 20 + 1) x (int)(50 + 20 + 1)', () => {
    const out = finalizeTitledDiagramFragment(chromed({ diagramType: 'MINDMAP', exportMargin: TITLED_DEFAULT_MARGIN }));
    expect(out.body).toBe('<text x="11" y="12">A</text>');
    expect([out.width, out.height]).toEqual([121, 71]);
  });

  it('an asymmetric style Margin: translate by (left, top), grow by left+right / top+bottom', () => {
    const margin = ClockwiseTopRightBottomLeft.topRightBottomLeft(1, 2, 3, 4);
    const out = finalizeTitledDiagramFragment(chromed({ exportMargin: margin }));
    expect(out.body).toBe('<text x="5" y="3">A</text>');
    expect([out.width, out.height]).toEqual([107, 55]);
  });

  it('scale 2 multiplies the (int)(dim + 1) canvas and the shifted body', () => {
    const out = finalizeTitledDiagramFragment(
      chromed({ exportMargin: SALT_DEFAULT_MARGIN, scaleSpec: { kind: 'simple', factor: 2 } }),
    );
    expect(out.body).toBe('<text x="12" y="14">A</text>');
    expect([out.width, out.height]).toEqual([222, 122]);
    expect(out.scaledCanvas).toBe(true);
  });

  it('drawBodyAt receives the scale and the anchor translate after the (left, top) shift', () => {
    const calls: number[][] = [];
    const out = finalizeTitledDiagramFragment(
      chromed({
        body: `<g>${BODY_ANCHOR}</g>`,
        exportMargin: SALT_DEFAULT_MARGIN,
        drawBodyAt: (scale, dx, dy) => {
          calls.push([scale, dx, dy]);
          return INNER;
        },
      }),
    );
    expect(calls).toEqual([[1, 5, 5]]);
    expect(out.body).toBe(`<g>${INNER}</g>`);
  });

  it('a chromed fragment without its producer margin is a programmer error', () => {
    expect(() => finalizeTitledDiagramFragment(chromed({}))).toThrow(/exportMargin/);
  });

  it('no chrome: only the single content <g> is added (the producer already exported through klimt)', () => {
    const out = finalizeTitledDiagramFragment({ body: INNER, width: 31, height: 25, diagramType: 'SALT' });
    expect(out.body).toBe(`<g>${INNER}</g>`);
    expect([out.width, out.height]).toEqual([31, 25]);
  });
});

describe('assembleSvg — SALT is a TitledDiagram on the shared export path', () => {
  it('an unchromed SALT fragment gets exactly one content <g>', () => {
    const svg = assembleSvg({ body: INNER, width: 31, height: 25, diagramType: 'SALT' });
    expect(svg).toContain(`${ROOT_GROUP_OPEN}${INNER}</g></svg>`);
  });

  it('a chromed SALT fragment is margined by its exportMargin', () => {
    const svg = assembleSvg(chromed({ body: `<g>${INNER}</g>`, exportMargin: SALT_DEFAULT_MARGIN }));
    expect(svg).toContain('viewBox="0 0 111 61"');
    expect(svg).toContain('<text x="6" y="7">A</text>');
  });
});

describe('scaleFragmentBody — dash pattern inside style', () => {
  it('scales stroke-width and the stroke-dasharray pair together (SvgGraphics#setStrokeWidth, :557-562)', () => {
    const body = '<path d="M10,20 L30,40" style="stroke:#181818;stroke-width:1;stroke-dasharray:7,7;" fill="none"/>';
    expect(scaleFragmentBody(body, 0.625)).toBe(
      '<path d="M6.25,12.5 L18.75,25" style="stroke:#181818;stroke-width:0.625;stroke-dasharray:4.375,4.375;" fill="none"/>',
    );
  });
});
