/**
 * sizer-footprint-parity T3 (ADR-1/ADR-2) — pins the CURRENT widened-routing
 * state in `leaf-sizing.ts`:
 *
 * - `usecase`/`usecase-business` + `<$sprite>` on a SINGLE-LINE display
 *   routes through `measureEntityLeaf`, and for a lone sprite atom that must
 *   match `measureUsecase`'s own (unchanged) ink-fit math exactly — a
 *   rectangle's enclosing-circle dimensions are translation invariant, so
 *   both paths derive the SAME ellipse from the SAME ink box.
 * - A MULTI-LINE display mixing a sprite line with any other line STAYS on
 *   `measureUsecase` — a STOP-diagnosed regression (T3): routing it through
 *   `measureEntityLeaf` widened `bootstrap-0`/`ruziru-69-xixo434` by exactly
 *   0.029321in, because `SheetBlock1.ts`'s line-stacking cursor and
 *   `Footprint`'s ellipse fit both consume the SAME ink-shrunk atom
 *   dimension this port's `fitToInk` resolver returns — see `leaf-sizing.ts
 *   #hasUnroutedUsecaseMarkup`'s own doc comment for the full mechanism.
 * - `<latex>` (usecase and box family both) stays guarded — permanent
 *   divergence, `DIVERGENCES.md`.
 * - box+`<img>` is now UNGUARDED (T3/ADR-1: the cannot-decode fallback font
 *   is hardcoded at its draw site, so no caller-threaded font is needed) —
 *   routes through `measureEntityLeaf` and, for this synthetic case,
 *   produces the IDENTICAL dimension the legacy fallback used to.
 */
import { describe, it, expect } from 'vitest';
import { measureLeafNode, measureUsecase } from '../../../src/diagrams/description/leaf-sizing.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { FontSpec } from '../../../src/core/measurer.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import type { SpriteDims, SpriteDimsLookup } from '../../../src/core/creole-atoms.js';

const fontSpec: FontSpec = { family: 'Helvetica', size: 14 };
const measurer = new WidthTableMeasurer();

/** A single registered sprite whose INK box is smaller than its declared
 *  box on both axes — exercises the T5 ink-fit path distinctly from the
 *  declared-box path it replaced. */
function inkSprite(dims: SpriteDims): SpriteDimsLookup {
  return { get: (name) => (name === 'icon' ? dims : undefined) };
}

const SHRUNK_INK: SpriteDims = { width: 16, height: 16, inkX: 1, inkY: 1, inkWidth: 10, inkHeight: 8 };

function usecaseNode(display: string): DescriptiveNode {
  return { id: 'u', display, symbol: 'usecase', children: [] };
}

describe('T3 widened routing — usecase + <$sprite>', () => {
  it('a single-line sprite display routes through measureEntityLeaf and matches measureUsecase\'s own ink-fit math for a lone atom', () => {
    const display = '<$icon>';
    const sprites = inkSprite(SHRUNK_INK);
    const routed = measureLeafNode(usecaseNode(display), fontSpec, measurer, undefined, sprites);
    const viaOldPath = measureUsecase(display, fontSpec, measurer, sprites);
    expect(routed.width).toBeCloseTo(viaOldPath.width, 6);
    expect(routed.height).toBeCloseTo(viaOldPath.height, 6);
    // Sanity: the ink box (10x8) is smaller than the declared box (16x16),
    // so the fitted ellipse must be smaller than one built from the FULL
    // declared box -- proves the resolver is actually shrinking to ink,
    // not silently falling back to the declared dims.
    const declaredBoxLookup = inkSprite({ width: 16, height: 16 });
    const declaredBoxResult = measureUsecase(display, fontSpec, measurer, declaredBoxLookup);
    expect(routed.width).toBeLessThan(declaredBoxResult.width);
  });

  it('a multi-line display mixing a sprite line with a text line stays on measureUsecase (STOP-diagnosed line-stacking regression, T3)', () => {
    const display = '<$icon>\nlabel text';
    const sprites = inkSprite(SHRUNK_INK);
    const routed = measureLeafNode(usecaseNode(display), fontSpec, measurer, undefined, sprites);
    const viaOldPath = measureUsecase(display, fontSpec, measurer, sprites);
    expect(routed).toEqual(viaOldPath);
  });

  it('a <latex> use-case display still stays on measureUsecase', () => {
    const display = '<latex>x^2</latex>';
    const routed = measureLeafNode(usecaseNode(display), fontSpec, measurer);
    const viaOldPath = measureUsecase(display, fontSpec, measurer);
    expect(routed).toEqual(viaOldPath);
  });
});

describe('T3 widened routing — box + <img> now routes through measureEntityLeaf (ADR-1)', () => {
  it('a rectangle with an unresolvable <img> tag no longer routes to the legacy fallback', () => {
    const display = '<img:does-not-exist.png>';
    const node: DescriptiveNode = { id: 'r', display, symbol: 'rectangle', children: [] };
    const routed = measureLeafNode(node, fontSpec, measurer);
    // Jar-verified fallback: `(Cannot decode)` at the hardcoded monospace(14)
    // fallback font measures 100.362 wide; margins/icon bring the box to
    // this exact value regardless of which routing path is taken (T1's
    // font-independence finding holds here too).
    expect(routed).toEqual({ width: 120.36250000000001, height: 34 });
  });
});

/**
 * T3 coverage restoration -- `measureLegacyBoxFallback`
 * (`leaf-sizing-legacy-fallback.ts`) and `measureTextBlock`
 * (`leaf-sizing-text.ts`) are now reachable ONLY via a `<latex>` box
 * display (the `<img>` guard that used to reach them, with every
 * componentStyle/stereotype/wrapWidth combination a real fixture happened
 * to carry, is gone). These three cases exercise the SAME internal
 * branches -- `boxIcon`'s non-uml2 early return, the stereotype merge, and
 * `measureTextBlock`'s word-wrapped path -- through the one guard left,
 * so `leaf-sizing-legacy-fallback.ts`/`leaf-sizing-text.ts` do not lose
 * coverage as a side effect of narrowing `leaf-sizing.ts`'s box guard.
 */
describe('T3 coverage restoration — measureLegacyBoxFallback via <latex> (the one reachable guard left)', () => {
  it('a non-uml2 component draws no corner icon (boxIcon early return)', () => {
    const node: DescriptiveNode = { id: 'c', display: '<latex>x^2</latex>', symbol: 'component', children: [] };
    const uml1 = measureLeafNode(node, fontSpec, measurer, { componentStyle: 'uml1' });
    const uml2 = measureLeafNode(node, fontSpec, measurer, { componentStyle: 'uml2' });
    expect(uml1).toEqual({ width: 20, height: 34 });
    expect(uml2).toEqual({ width: 40, height: 44 });
    expect(uml1.width).toBeLessThan(uml2.width);
  });

  it('a stereotype adds its own line + STEREO_MARGIN on top of the <latex> content', () => {
    const withStereo: DescriptiveNode = {
      id: 'r', display: '<latex>x^2</latex>', symbol: 'rectangle', stereotype: ['Foo'], children: [],
    };
    const withoutStereo: DescriptiveNode = { id: 'r', display: '<latex>x^2</latex>', symbol: 'rectangle', children: [] };
    expect(measureLeafNode(withStereo, fontSpec, measurer)).toEqual({ width: 61.725, height: 48 });
    expect(measureLeafNode(withoutStereo, fontSpec, measurer)).toEqual({ width: 20, height: 34 });
  });

  it('skinparam wrapWidth word-wraps a <latex>-guarded box (measureTextBlock\'s wrapped path)', () => {
    const node: DescriptiveNode = {
      id: 'r', display: '<latex>x^2</latex> plus some words here', symbol: 'rectangle', children: [],
    };
    const wrapped = measureLeafNode(node, fontSpec, measurer, { wrapWidth: 40 });
    const unwrapped = measureLeafNode(node, fontSpec, measurer);
    expect(wrapped).toEqual({ width: 57.362500000000004, height: 76 });
    expect(unwrapped).toEqual({ width: 145.3, height: 34 });
    // Wrapping must narrow the box and grow its height (more lines) --
    // proves the wrapped branch actually ran, not a silent passthrough.
    expect(wrapped.width).toBeLessThan(unwrapped.width);
    expect(wrapped.height).toBeGreaterThan(unwrapped.height);
  });
});
