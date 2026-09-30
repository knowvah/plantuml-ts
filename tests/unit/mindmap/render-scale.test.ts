/**
 * Unit tests for `finalizeTitledDiagramFragment`'s scale-after-chrome step
 * (T6d, mission mindmap-engine-port batch 6, decision-journal row 27's
 * "zebuzi" residual). Exercises `TextBlockExporter.ts` directly against a
 * synthetic `bodyWrapped` fragment carrying `scaleSpec`/`dpi` — the fields
 * `src/diagrams/mindmap/index.ts#rawTextBlock` does not yet set (that
 * wiring is `mindmap/index.ts`'s own write-set, owned by T6c in parallel;
 * see the mission decision journal / T6d's spec "Stop and report" note).
 * The factor is resolved HERE (against the post-chrome/post-margin
 * dimension), not by the producer, because upstream's own
 * `computeScaleFactor` reads `calculateFinalDimension()` — jar-verified
 * against zebuzi that resolving against the pre-chrome body alone gives
 * the WRONG factor (1.682, not 1.495 — see `dispatcher.ts#scaleSpec`'s
 * own doc comment).
 *
 * Mechanism under test (`TextBlockExporter.java:159-176` draws the
 * CHROME-DECORATED `textBlock` through ONE `UGraphic` whose `option.scale`
 * is already set, so `SvgGraphics#format` (`:881-884`) scales every
 * primitive — including the title — at draw time). This port's chrome is
 * composed OUTSIDE klimt as a string splice
 * (`core/annotations/chrome.ts#applyChrome`), so `finalizeTitledDiagramFragment`
 * reproduces the SAME numeric effect as a post-composition pass: margin
 * shift first (pre-existing `shiftFragmentBody`), THEN a uniform multiply
 * of every geometry-bearing attribute this module's known producer
 * vocabulary (rect/text/path/polygon — mindmap emits no
 * ellipse/circle/line, grep-verified against every cached
 * `test-results/dot-cache/mindmap/*\/in.svg`) ever carries.
 */
import { describe, expect, it } from 'vitest';
import { finalizeTitledDiagramFragment, scaleFragmentBody } from '../../../src/core/TextBlockExporter.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';
import type { ScaleSpec } from '../../../src/core/scale-command.js';

/** `{ kind: 'simple', factor }` resolves to exactly `factor` at dpi 96
 *  (clamped 0 < factor <= 4 — `scale-command.ts#clampScale`), the simplest
 *  `ScaleSpec` to drive a known scale factor from these tests. */
function simpleScale(factor: number): ScaleSpec {
  return { kind: 'simple', factor };
}

const DIAGRAM_TYPE_MINDMAP = 'MINDMAP';

function wrappedFragment(overrides: Partial<RenderFragment>): RenderFragment {
  return {
    body: '<rect x="10" y="20" width="30" height="15"/>',
    width: 100,
    height: 50,
    diagramType: DIAGRAM_TYPE_MINDMAP,
    bodyWrapped: true,
    ...overrides,
  };
}

describe('scaleFragmentBody — attribute vocabulary', () => {
  it('factor=1 is a no-op (byte-identical, fast path)', () => {
    const body = '<rect x="10" y="20" width="30" height="15" rx="5" ry="5"/>';
    expect(scaleFragmentBody(body, 1)).toBe(body);
  });

  it('multiplies x/y/width/height/rx/ry on a rect', () => {
    const body = '<rect x="10" y="20" width="30" height="15" rx="5" ry="5"/>';
    expect(scaleFragmentBody(body, 2)).toBe('<rect x="20" y="40" width="60" height="30" rx="10" ry="10"/>');
  });

  it('multiplies font-size/textLength on a text element, leaves font-weight untouched', () => {
    const body = '<text x="12" y="22" font-size="14" textLength="50" font-weight="700">Hi</text>';
    expect(scaleFragmentBody(body, 2)).toBe(
      '<text x="24" y="44" font-size="28" textLength="100" font-weight="700">Hi</text>',
    );
  });

  it('multiplies stroke-width inside a style attribute, leaves the color and stroke-linejoin untouched', () => {
    const body = '<rect x="1" y="1" style="stroke:#181818;stroke-width:1.5;stroke-miterlimit:10;"/>';
    expect(scaleFragmentBody(body, 1.5)).toBe(
      '<rect x="1.5" y="1.5" style="stroke:#181818;stroke-width:2.25;stroke-miterlimit:10;"/>',
    );
  });

  it('multiplies every coordinate in a comma-separated points list (polygon)', () => {
    const body = '<polygon points="1,2,3,4,5,6"/>';
    expect(scaleFragmentBody(body, 2)).toBe('<polygon points="2,4,6,8,10,12"/>');
  });

  it('multiplies M/L/C path coordinates', () => {
    const body = '<path d="M1,2 L3,4 C5,6 7,8 9,10"/>';
    expect(scaleFragmentBody(body, 2)).toBe('<path d="M2,4 L6,8 C10,12 14,16 18,20"/>');
  });

  it('multiplies A-command radii and endpoint, leaves x-axis-rotation and the two flags untouched', () => {
    const body = '<path d="M0,0 A1.744,1.744 0 0 0 866.312,687.687"/>';
    expect(scaleFragmentBody(body, 2)).toBe('<path d="M0,0 A3.488,3.488 0 0 0 1732.624,1375.374"/>');
  });

  it('uses Java HALF_UP rounding at 3 decimals, not JS toFixed (matches SvgGraphics#format)', () => {
    // 34.223 * 1.495 = 51.163385 -> rounds to 51.163 (not 51.164 or naive toString noise).
    const body = '<rect x="34.223" y="0"/>';
    expect(scaleFragmentBody(body, 1.495)).toBe('<rect x="51.163" y="0"/>');
  });

  it('does not scale numeric attributes inside an inline gradient/filter def (objectBoundingBox units)', () => {
    const body =
      '<defs><linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="g1"><stop offset="0%"/></linearGradient></defs><rect x="1" y="1" width="2" height="2"/>';
    expect(scaleFragmentBody(body, 2)).toBe(
      '<defs><linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="g1"><stop offset="0%"/></linearGradient></defs><rect x="2" y="2" width="4" height="4"/>',
    );
  });
});

describe('finalizeTitledDiagramFragment — scale applied AFTER the margin shift (chrome path)', () => {
  it('no scaleSpec (undefined): unchanged from the pre-T6d margin-only behavior', () => {
    const fragment = wrappedFragment({});
    const result = finalizeTitledDiagramFragment(fragment);
    expect(result.body).toBe('<rect x="20" y="30" width="30" height="15"/>');
    expect(result.width).toBe(121); // 100 + 2*10 + 1
    expect(result.height).toBe(71); // 50 + 2*10 + 1
  });

  it('scaleSpec resolving to 1 (dpi 96, no clamp change): identical to the undefined case', () => {
    const fragment = wrappedFragment({ scaleSpec: simpleScale(1) });
    const result = finalizeTitledDiagramFragment(fragment);
    expect(result.body).toBe('<rect x="20" y="30" width="30" height="15"/>');
    expect(result.width).toBe(121);
    expect(result.height).toBe(71);
  });

  it('scale factor 2: shifts by the margin first, THEN multiplies every geometry attribute', () => {
    const fragment = wrappedFragment({ scaleSpec: simpleScale(2) });
    const result = finalizeTitledDiagramFragment(fragment);
    // shift: x 10->20, y 20->30; scale by 2: x 20->40, y 30->60, w 30->60, h 15->30.
    expect(result.body).toBe('<rect x="40" y="60" width="60" height="30"/>');
    // unscaled final dims truncate to an int BEFORE the multiply (mirrors
    // SvgGraphics.java's `maxX` being an int via `ensureVisible`'s
    // `(int)(x+1)` BEFORE `finalizeRootAttributes`'s `maxX * option.scale`
    // -- see this file's own doc comment / TextBlockExporter.java:198-209).
    expect(result.width).toBe(242); // trunc(100+21)=121, *2
    expect(result.height).toBe(142); // trunc(50+21)=71, *2
  });

  it('scale factor resolution truncates the unscaled dimension before multiplying (order matters)', () => {
    // 100.7 + 21 = 121.7 -> trunc = 121 -> *1.5 = 181.5 (NOT trunc(121.7*1.5)=182).
    const fragment = wrappedFragment({ width: 100.7, height: 50, scaleSpec: simpleScale(1.5) });
    const result = finalizeTitledDiagramFragment(fragment);
    expect(result.width).toBe(181.5);
  });

  it("a non-96 dpi multiplies the resolved factor further (resolveScaleFactor's own dpi/96 term)", () => {
    const fragment = wrappedFragment({ scaleSpec: simpleScale(1), dpi: 192 });
    const result = finalizeTitledDiagramFragment(fragment);
    expect(result.width).toBe(242); // trunc(121) * (1 * 192/96) = 121 * 2
  });

  it('no chrome (bodyWrapped unset): scale is ignored here — the export path already baked it into the klimt draw', () => {
    const fragment: RenderFragment = {
      body: '<rect x="10" y="20" width="30" height="15"/>',
      width: 100,
      height: 50,
      diagramType: DIAGRAM_TYPE_MINDMAP,
      scaleSpec: simpleScale(2),
    };
    const result = finalizeTitledDiagramFragment(fragment);
    expect(result.body).toBe('<g><rect x="10" y="20" width="30" height="15"/></g>');
    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });
});
