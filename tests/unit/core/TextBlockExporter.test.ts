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
import {
  BODY_ANCHOR,
  exportTo,
  finalizeTitledDiagramFragment,
  scaleActivityBody,
  scaleFragmentBody,
} from '../../../src/core/TextBlockExporter.js';

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
          return { body: INNER, width: 1, height: 1 };
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

/**
 * The ONE `TextBlockExporter#exportTo` tail (`TextBlockExporter.java:159-177`):
 * `dim = calculateFinalDimension()` (`:198-203`), `factor =
 * computeScaleFactor(dim)` = `scale.getScale(dim.w, dim.h) * dpi / 96`
 * (`:205-209`), the canvas `ensureVisible`'s `(int)(v + 1)`
 * (`SvgGraphics.java:129-135`) times `factor` (`:800-813`).
 */
describe('exportTo -- the margin-baked arm (activity, description, sequence)', () => {
  const base: RenderFragment = { body: INNER, width: 100, height: 50 };

  it('dim is exportedDimension when set, not the floored canvas: width 199 / 99.5 = 2 (:205-209)', () => {
    const out = exportTo(
      { ...base, exportedDimension: { width: 99.5, height: 49.5 }, scaleSpec: { kind: 'width', target: 199 } },
      INNER,
    );
    expect([out.width, out.height]).toEqual([200, 100]);
    expect(out.body).toBe('<text x="2" y="4">A</text>');
    expect(out.scaledCanvas).toBe(true);
  });

  it('dim is the fragment width/height when exportedDimension is absent: 200 / 100 = 2', () => {
    const out = exportTo({ ...base, scaleSpec: { kind: 'width', target: 200 } }, INNER);
    expect([out.width, out.height]).toEqual([200, 100]);
  });

  it('a widthAndHeight spec takes the smaller ratio (ScaleWidthAndHeight.java:48-55): min(300/100, 100/50) = 2', () => {
    const out = exportTo({ ...base, scaleSpec: { kind: 'widthAndHeight', width: 300, height: 100 } }, INNER);
    expect([out.width, out.height]).toEqual([200, 100]);
  });

  it('dpi alone scales by dpi / 96 (:208): 192 -> 2', () => {
    const out = exportTo({ ...base, dpi: 192 }, INNER);
    expect([out.width, out.height]).toEqual([200, 100]);
    expect(out.body).toBe('<text x="2" y="4">A</text>');
  });

  it('scale 1 at dpi 96 with a formatted body is left as handed over', () => {
    const out = exportTo(base, '<g>x</g>');
    expect(out).toEqual({ ...base, body: '<g>x</g>' });
  });

  it('a deferred body is formatted once, even at factor 1, with the full vocabulary (SvgGraphics.java:468-475)', () => {
    const out = exportTo(
      { ...base, numbersDeferred: true },
      '<line x1="0.12345" y1="1" x2="2" y2="3" stroke-dasharray="7.12345,7.12345"/>',
    );
    expect(out.body).toBe('<line x1="0.123" y1="1" x2="2" y2="3" stroke-dasharray="7.123,7.123"/>');
    expect([out.width, out.height]).toEqual([100, 50]);
    expect(out.scaledCanvas).toBe(true);
  });

  it('the shadow filter blurs by 2 * scale and offsets by 4 * scale (SvgGraphics.java:1081,1084)', () => {
    const extraDefs = '<filter><feGaussianBlur result="b" stdDeviation="2"/><feOffset dx="4" dy="4"/></filter>';
    const out = exportTo({ ...base, extraDefs, dpi: 192 }, INNER);
    expect(out.extraDefs).toBe(
      '<filter><feGaussianBlur result="b" stdDeviation="4"/><feOffset dx="8" dy="8"/></filter>',
    );
  });
});

describe('exportTo -- the exportMargin arm (mindmap, wbs, salt)', () => {
  it('dim is width/height plus the margin: 100 + 10 = 110, width 220 / 110 = 2; canvas (int)(111) * 2 = 222', () => {
    const out = exportTo(
      chromed({ exportMargin: SALT_DEFAULT_MARGIN, scaleSpec: { kind: 'width', target: 220 } }),
      INNER,
    );
    expect([out.width, out.height]).toEqual([222, 122]);
    expect(out.body).toBe('<text x="12" y="14">A</text>');
  });

  it('a deferred chromed body is formatted once after the margin shift and the scale', () => {
    const out = exportTo(
      chromed({
        exportMargin: SALT_DEFAULT_MARGIN,
        numbersDeferred: true,
        scaleSpec: { kind: 'simple', factor: 1.5 },
      }),
      '<text x="7.0000005" y="8" textLength="20.83125">A</text>',
    );
    expect(out.body).toBe('<text x="18" y="19.5" textLength="31.247">A</text>');
  });
});

describe('scaleActivityBody -- the single format pass', () => {
  it('multiplies then rounds once: 20.83125 * 1.5 -> 31.247, not the double-rounded 31.246', () => {
    expect(scaleActivityBody('<text textLength="20.83125">a</text>', 1.5)).toBe('<text textLength="31.247">a</text>');
  });
});

describe('exportTo — the canvas floors at the drawn body canvas (T2a)', () => {
  // SvgGraphics.java:129-135 ensureVisible runs for every primitive drawn (:620-621 svgLine), so
  // the jar's canvas is max((int)(dim + 1), (int)(ink + 1)). xikovo: title 35 + dim 46 = 81 -> 82,
  // body ink 8 px below its dim at dy 35 -> 90.
  const anchored = (overrides: Partial<RenderFragment>, drawn: { width: number; height: number }): RenderFragment =>
    chromed({
      body: `<g>${BODY_ANCHOR}</g>`,
      width: 100,
      height: 81,
      exportMargin: ClockwiseTopRightBottomLeft.same(0),
      drawBodyAt: () => ({ body: INNER, ...drawn }),
      ...overrides,
    });

  it('drawn canvas taller than the declared dimension (title): keeps the drawn height', () => {
    const out = finalizeTitledDiagramFragment(anchored({}, { width: 90, height: 90 }));
    expect([out.width, out.height]).toEqual([101, 90]);
  });

  it('same under a header (SvgGraphics.java:129-135): 42 -> 43 raised to 51', () => {
    const out = finalizeTitledDiagramFragment(anchored({ height: 42 }, { width: 50, height: 51 }));
    expect([out.width, out.height]).toEqual([101, 51]);
  });

  it('drawn canvas inside the dimension (caption): unchanged (48 -> 49)', () => {
    const out = finalizeTitledDiagramFragment(anchored({ height: 48 }, { width: 50, height: 40 }));
    expect([out.width, out.height]).toEqual([101, 49]);
  });

  it('a drawn canvas wider than the dimension raises the width', () => {
    const out = finalizeTitledDiagramFragment(anchored({}, { width: 130, height: 10 }));
    expect([out.width, out.height]).toEqual([130, 82]);
  });
});
