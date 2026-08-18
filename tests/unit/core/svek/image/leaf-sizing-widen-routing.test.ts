/**
 * sizer-footprint-parity T3 (ADR-1/ADR-2), re-measured by SI10 (ADR-1/ADR-2)
 * — pins the CURRENT widened-routing state in `leaf-sizing.ts`:
 *
 * - `usecase`/`usecase-business` + `<$sprite>` on a SINGLE-LINE display
 *   routes through `measureEntityLeaf`, and for a lone sprite atom whose ink
 *   is a rectangular `<path>` (a shape whose drawn corners ARE its bbox
 *   corners) that must match `measureUsecase`'s own ink-fit math exactly —
 *   a rectangle's enclosing-circle dimensions are translation invariant, so
 *   both paths derive the SAME ellipse from the SAME ink box, even though
 *   (T10/ADR-3) they now get there by two DIFFERENT mechanisms: real
 *   `SvgNanoParser` decomposition for `measureLeafNode`, the unchanged
 *   ink-bbox approximation for `measureUsecase` (off-limits, ADR-3).
 * - A MULTI-LINE display mixing a sprite line with any other line ALSO now
 *   routes through `measureEntityLeaf` (SI10/ADR-1/ADR-2): the T3-era guard
 *   that kept this on `measureUsecase` was re-measured INERT (`widened 0`,
 *   IDENTICAL cause histogram, both named fixtures `delta 0, conformant
 *   true` with and without it) — see `leaf-sizing.ts#hasUnroutedUsecaseMarkup`'s
 *   own doc comment for the full measurement. This case therefore asserts
 *   LITERAL dimensions captured from a real run, not a tautological
 *   `toEqual` against the old path (ADR-3: that comparison was true BY
 *   CONSTRUCTION while the guard existed and is retired along with it).
 * - `<latex>` (usecase and box family both) stays guarded — permanent
 *   divergence, `DIVERGENCES.md`.
 * - box+`<img>` is now UNGUARDED (T3/ADR-1: the cannot-decode fallback font
 *   is hardcoded at its draw site, so no caller-threaded font is needed) —
 *   routes through `measureEntityLeaf` and, for this synthetic case,
 *   produces the IDENTICAL dimension the legacy fallback used to.
 */
import { describe, it, expect } from 'vitest';
import { measureLeafNode, measureUsecase, measureUsecaseOrActorLeaf } from '../../../../../src/core/svek/image/leaf-sizing.js';
import { WidthTableMeasurer } from '../../../../../src/core/measurer.js';
import type { FontSpec } from '../../../../../src/core/measurer.js';
import type { DescriptiveNode } from '../../../../../src/diagrams/description/ast.js';
import type { SpriteDims, SpriteDimsLookup } from '../../../../../src/core/creole-atoms.js';
import { createSpriteRegistry, addSprite, spriteDimsLookupFor } from '../../../../../src/core/sprite-commands.js';
import { SpriteSvg } from '../../../../../src/core/klimt/sprite/SpriteSvg.js';

const fontSpec: FontSpec = { family: 'Helvetica', size: 14 };
const measurer = new WidthTableMeasurer();

/** A lookup NOT backed by a real registry (no `svg`) — for assertions made
 *  directly against `measureUsecase`, which never routes through T10's
 *  real-decomposition path and only ever reads `inkWidth`/`inkHeight`. */
function rawSprite(dims: SpriteDims): SpriteDimsLookup {
  return { get: (name) => (name === 'icon' ? dims : undefined) };
}

/** A REAL registered SVG sprite (T10) whose drawn ink is a rectangular
 *  `<path>` -- `SpriteSvg.from` derives `inkX/inkY/inkWidth/inkHeight` from
 *  the path's own corners (`svgInkBox`), the SAME numbers the old
 *  hand-authored `SHRUNK_INK` literal asserted, but computed from real
 *  geometry so `measureLeafNode` actually exercises `SvgNanoParser`
 *  decomposition, not a fabricated ink number. */
function svgIconSprite(svg: string): SpriteDimsLookup {
  const registry = createSpriteRegistry();
  const sprite = SpriteSvg.from(svg);
  if (sprite === undefined) throw new Error('test fixture SVG failed to parse dimensions');
  addSprite(registry, 'icon', sprite);
  return spriteDimsLookupFor(registry);
}

/** Declared 16x16, ink rectangle [1,11]x[1,9] (10x8 at offset 1,1) — the
 *  SAME numbers `SHRUNK_INK` used to declare directly. */
const SHRUNK_INK_SVG = '<svg width="16" height="16"><path d="M1,1 L11,1 L11,9 L1,9 Z"/></svg>';

function usecaseNode(display: string): DescriptiveNode {
  return { id: 'u', display, symbol: 'usecase', children: [] };
}

describe('T3 widened routing — usecase + <$sprite>', () => {
  it('a single-line sprite display routes through measureEntityLeaf and matches measureUsecase\'s own ink-fit math for a lone atom', () => {
    const display = '<$icon>';
    const sprites = svgIconSprite(SHRUNK_INK_SVG);
    const routed = measureLeafNode(usecaseNode(display), fontSpec, measurer, undefined, sprites);
    const viaOldPath = measureUsecase(display, fontSpec, measurer, sprites);
    expect(routed.width).toBeCloseTo(viaOldPath.width, 6);
    expect(routed.height).toBeCloseTo(viaOldPath.height, 6);
    // Sanity: the ink box (10x8) is smaller than the declared box (16x16),
    // so the fitted ellipse must be smaller than one built from the FULL
    // declared box -- proves the resolver is actually shrinking to ink,
    // not silently falling back to the declared dims.
    const declaredBoxLookup = rawSprite({ width: 16, height: 16 });
    const declaredBoxResult = measureUsecase(display, fontSpec, measurer, declaredBoxLookup);
    expect(routed.width).toBeLessThan(declaredBoxResult.width);
  });

  it('a multi-line display mixing a sprite line with a text line now routes through measureEntityLeaf too (SI10: the T3 guard measured INERT)', () => {
    const display = '<$icon>\nlabel text';
    const sprites = svgIconSprite(SHRUNK_INK_SVG);
    const routed = measureLeafNode(usecaseNode(display), fontSpec, measurer, undefined, sprites);
    // Literal dimensions captured from a real run (jiti probe, 2026-08-02) —
    // NOT derived from `measureUsecase` at test time (ADR-3: that comparison
    // was tautological while the guard existed; asserting literals here
    // means the test actually fails if the faithful path's geometry moves).
    expect(routed).toEqual({ width: 68.5778265682734, height: 43.47562148642083 });
    // Sanity: the OLD analytic path lands within floating-point noise of the
    // SAME numbers for this fixture -- proof the guard's removal is size-
    // neutral here, not proof the two paths are the same mechanism (T10/
    // ADR-3: they reach this point via different ink-decomposition code).
    const viaOldPath = measureUsecase(display, fontSpec, measurer, sprites);
    expect(routed.width).toBeCloseTo(viaOldPath.width, 6);
    expect(routed.height).toBeCloseTo(viaOldPath.height, 6);
  });

  it('a <latex> use-case display still stays on measureUsecase', () => {
    const display = '<latex>x^2</latex>';
    const routed = measureLeafNode(usecaseNode(display), fontSpec, measurer);
    const viaOldPath = measureUsecase(display, fontSpec, measurer);
    expect(routed).toEqual(viaOldPath);
  });
});

describe('SI10 — measureUsecaseOrActorLeaf matches the description engine\'s own faithful path (ADR-2)', () => {
  it('usecase: the exported entry point returns the same Dim as measureLeafNode for an equivalent node', () => {
    const display = 'Hello World';
    const sprites = svgIconSprite(SHRUNK_INK_SVG);
    const viaEntryPoint = measureUsecaseOrActorLeaf(display, 'usecase', fontSpec, measurer, sprites);
    const viaFaithfulPath = measureLeafNode(usecaseNode(display), fontSpec, measurer, undefined, sprites);
    expect(viaEntryPoint).toEqual({ width: 103.01505037879433, height: 25.79898987322333 });
    expect(viaEntryPoint).toEqual(viaFaithfulPath);
  });

  it('actor: the exported entry point returns the same Dim as measureLeafNode for an equivalent node', () => {
    const display = 'Bob';
    const sprites = svgIconSprite(SHRUNK_INK_SVG);
    const actorNode: DescriptiveNode = { id: 'a', display, symbol: 'actor', children: [] };
    const viaEntryPoint = measureUsecaseOrActorLeaf(display, 'actor', fontSpec, measurer, sprites);
    const viaFaithfulPath = measureLeafNode(actorNode, fontSpec, measurer, undefined, sprites);
    expect(viaEntryPoint).toEqual({ width: 27, height: 74 });
    expect(viaEntryPoint).toEqual(viaFaithfulPath);
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
