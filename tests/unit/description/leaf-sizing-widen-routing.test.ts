/**
 * T5 (bodyenhanced-atom-seams) — pins the widened-routing decisions made in
 * `leaf-sizing.ts`/`leaf-sizing-legacy-fallback.ts`:
 *
 * - `usecase`/`usecase-business` + `<$sprite>` on a SINGLE-LINE display now
 *   routes through `measureEntityLeaf` (T3/ADR-2's ink fields), and for a
 *   lone sprite atom that must match `measureUsecase`'s own (unchanged)
 *   ink-fit math exactly — a rectangle's enclosing-circle dimensions are
 *   translation invariant, so both paths derive the SAME ellipse from the
 *   SAME ink box.
 * - A MULTI-LINE display mixing a sprite line with any other line stays on
 *   `measureUsecase` (diagnosed regression: the shared `Sea`/`SheetBlock1`
 *   line-stacking pipeline reuses the ink-fitted height for cursor advance
 *   too, which under-stacks a multi-line block — see `leaf-sizing.ts
 *   #hasUnroutedUsecaseMarkup`'s own doc comment).
 * - box+`<img>` stays guarded (RE-DIAGNOSED, not closed: T3/ADR-3's
 *   caller-threaded fallback-font fix landed on a text-block builder
 *   `buildDesc` no longer calls for the main desc content since T4 routed
 *   it through `BodyFactory.create3` — since superseded by
 *   `sizer-footprint-parity` ADR-1 (the fallback font is now hardcoded, not
 *   threaded at all) — see `leaf-sizing-legacy-fallback.ts`'s module doc
 *   comment).
 */
import { describe, it, expect } from 'vitest';
import { measureLeafNode, measureUsecase } from '../../../src/diagrams/description/leaf-sizing.js';
import { measureLegacyBoxFallback } from '../../../src/diagrams/description/leaf-sizing-legacy-fallback.js';
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

describe('T5 widened routing — usecase + <$sprite>', () => {
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

  it('a multi-line display mixing a sprite line with a text line stays on measureUsecase (diagnosed line-stacking regression)', () => {
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

describe('T5 widened routing — box + <img> stays guarded (re-diagnosed)', () => {
  it('a rectangle with an unresolvable <img> tag still routes to the legacy fallback', () => {
    const display = '<img:does-not-exist.png>';
    const node: DescriptiveNode = { id: 'r', display, symbol: 'rectangle', children: [] };
    const routed = measureLeafNode(node, fontSpec, measurer);
    const viaFallback = measureLegacyBoxFallback(node, fontSpec, { measurer, opts: undefined, sprites: undefined, defaultFont: fontSpec });
    expect(routed).toEqual(viaFallback);
  });
});
