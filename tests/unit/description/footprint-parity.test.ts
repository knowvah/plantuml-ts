/**
 * SI14/T2 (ADR-3) -- pins the parity check the `usecase-footprint.ts`
 * retirement rests on: for every shape its own header claimed jar-verified
 * to within 5e-4 px (sprite; text; text×2; sprite+text; text+sprite;
 * sprite+text×2; sprite×2), the retired data-based mechanism
 * (`FootprintBox`es -> `boxPoints` -> `containingEllipse`,
 * `usecase-footprint.ts`, deleted by this task) and the real, object-based
 * `Footprint#getEllipse` mechanism (`core/svek/image/Footprint.ts`, reached
 * here via `measureUsecaseOrActorLeaf` -> `measureEntityLeaf` ->
 * `EntityImageDescription.calculateDimensionSlow` -> `USymbolUsecase.asSmall`
 * -> `TextBlockInEllipse`) must agree.
 *
 * The `width`/`height` literals below are the RETIRED implementation's own
 * output, captured from a real run BEFORE `usecase-footprint.ts` was
 * deleted (jiti probe, this task) -- not re-derived from the new mechanism,
 * so this is a genuine before/after comparison, not a tautology. The
 * `sprite+text`/`text+sprite` pair reproduces the exact fixture
 * `usecase-footprint.ts`'s header cited as its own jar verification
 * (`"<$bi-globe>\nbi-globe"` = 66.026×43.587, `"bi-globe\n<$bi-globe>"` =
 * 69.791×45.945) -- the numbers below match those to the header's own
 * stated precision, confirming this test exercises the SAME order-dependent
 * case the header's mechanism was built to handle.
 *
 * `measureUsecase` (leaf-sizing.ts, non-`<latex>` branch) is asserted too:
 * SI14/ADR-3 made it a thin delegate to `measureEntityLeaf`, so this is a
 * direct regression guard on that delegation, not just the underlying
 * mechanism.
 */
import { describe, it, expect } from 'vitest';
import { measureUsecase, measureUsecaseOrActorLeaf } from '../../../src/core/svek/image/leaf-sizing.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { FontSpec } from '../../../src/core/measurer.js';
import type { SpriteDimsLookup } from '../../../src/core/creole-atoms.js';
import { createSpriteRegistry, addSprite, spriteDimsLookupFor } from '../../../src/core/sprite-commands.js';
import { SpriteSvg } from '../../../src/core/klimt/sprite/SpriteSvg.js';

/** Tolerance `usecase-footprint.ts`'s own header claimed for its jar
 *  verification across these seven shapes. */
const PARITY_TOLERANCE_PX = 5e-4;

const fontSpec: FontSpec = { family: 'Helvetica', size: 14 };
const measurer = new WidthTableMeasurer();

/** The stdlib `bootstrap1.13.1` `bi-globe` sprite -- the SAME icon
 *  `usecase-footprint.ts`'s header cited by name for its own jar
 *  verification (`packages/stdlib/assets/bootstrap1.13.1/sprites/
 *  bi-globe.puml`), inlined here so this test has no cross-package file
 *  dependency. */
const BI_GLOBE_SVG =
  '<svg width="16" height="16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 ' +
  '1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4z' +
  'm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5z' +
  'M8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.' +
  '187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472' +
  'a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5' +
  'h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0' +
  ' 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594' +
  '-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312' +
  ' 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855' +
  ' 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z"/></svg>';

function biGlobeSprites(): SpriteDimsLookup {
  const registry = createSpriteRegistry();
  const sprite = SpriteSvg.from(BI_GLOBE_SVG);
  if (sprite === undefined) throw new Error('test fixture SVG failed to parse dimensions');
  addSprite(registry, 'bi-globe', sprite);
  return spriteDimsLookupFor(registry);
}

/** The seven shapes `usecase-footprint.ts`'s header named as jar-verified
 *  to within 5e-4 px, and each shape's RETIRED-implementation output --
 *  captured from a real run before `usecase-footprint.ts` was deleted. */
const SEVEN_SHAPES: ReadonlyArray<{
  readonly name: string;
  readonly display: string;
  readonly retired: { readonly width: number; readonly height: number };
}> = [
  { name: 'sprite', display: '<$bi-globe>', retired: { width: 31.383183295850994, height: 26.306546636680796 } },
  { name: 'text', display: 'bi-globe', retired: { width: 76.53390142335812, height: 25.79898987322333 } },
  { name: 'text×2', display: 'bi-globe\nlabel', retired: { width: 71.08566105838617, height: 42.539318488918546 } },
  {
    name: 'sprite+text',
    display: '<$bi-globe>\nbi-globe',
    retired: { width: 66.02573020357005, height: 43.58696196282929 },
  },
  {
    name: 'text+sprite',
    display: 'bi-globe\n<$bi-globe>',
    retired: { width: 69.79098970776818, height: 45.94469530958763 },
  },
  {
    name: 'sprite+text×2',
    display: '<$bi-globe>\nbi-globe\nlabel',
    retired: { width: 64.41962532360232, height: 52.735700258881856 },
  },
  {
    name: 'sprite×2',
    display: '<$bi-globe>\n<$bi-globe>',
    retired: { width: 49.716306587889946, height: 40.97304527031196 },
  },
];

describe('usecase ellipse-fit parity — retired data-based mechanism vs real Footprint#getEllipse (SI14/ADR-3)', () => {
  const sprites = biGlobeSprites();

  it.each(SEVEN_SHAPES)('$name: real Footprint#getEllipse matches the retired implementation to 5e-4px', ({ display, retired }) => {
    const real = measureUsecaseOrActorLeaf(display, 'usecase', fontSpec, measurer, sprites);
    expect(Math.abs(real.width - retired.width)).toBeLessThanOrEqual(PARITY_TOLERANCE_PX);
    expect(Math.abs(real.height - retired.height)).toBeLessThanOrEqual(PARITY_TOLERANCE_PX);
  });

  it.each(SEVEN_SHAPES)('$name: measureUsecase (its delegation target, post-retirement) matches too', ({ display, retired }) => {
    const viaMeasureUsecase = measureUsecase(display, fontSpec, measurer, sprites);
    expect(Math.abs(viaMeasureUsecase.width - retired.width)).toBeLessThanOrEqual(PARITY_TOLERANCE_PX);
    expect(Math.abs(viaMeasureUsecase.height - retired.height)).toBeLessThanOrEqual(PARITY_TOLERANCE_PX);
  });

  it('sprite+text / text+sprite reproduce the exact order-dependent pair usecase-footprint.ts\'s header cited', () => {
    // "<$bi-globe>\nbi-globe" = 66.026×43.587, "bi-globe\n<$bi-globe>" = 69.791×45.945 (jar, per the header) —
    // same lines, swapped order, different result; both paths must still agree with each other on each.
    const spriteFirst = measureUsecaseOrActorLeaf('<$bi-globe>\nbi-globe', 'usecase', fontSpec, measurer, sprites);
    const textFirst = measureUsecaseOrActorLeaf('bi-globe\n<$bi-globe>', 'usecase', fontSpec, measurer, sprites);
    expect(spriteFirst.width).toBeCloseTo(66.026, 2);
    expect(spriteFirst.height).toBeCloseTo(43.587, 2);
    expect(textFirst.width).toBeCloseTo(69.791, 2);
    expect(textFirst.height).toBeCloseTo(45.945, 2);
    expect(spriteFirst.width).not.toBeCloseTo(textFirst.width, 1);
  });
});
