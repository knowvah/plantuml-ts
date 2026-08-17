/**
 * footprint-raster-dims.test.ts — SI15 T1 (ADR-1): unit-proves the guarded
 * raster/declared fallback `Footprint.MyUGraphic.drawImage` now uses
 * (`Footprint.ts`), and the two `render-atoms.ts` producers that populate
 * `UImage`'s optional raster dims.
 *
 * (a)/(b) use `alpha = 1` (a plain circle, no Y-squash — `YTransformer`'s
 * `getReversePoint2D` divides by `alpha`, a no-op at 1): for a single
 * rectangle's four corners `(0,0)`-`(w,h)`, the smallest enclosing circle's
 * diameter is exactly the rectangle's diagonal (`Math.hypot(w, h)`) — an
 * independent geometric fact, not a restatement of `Footprint`'s own
 * `ContainingEllipse`/`SmallestEnclosingCircle` implementation — so
 * `getWidth()`/`getHeight()` (equal at `alpha = 1`) directly expose which
 * pair of corner points `drawImage` recorded.
 */
import { describe, it, expect } from 'vitest';
import { Footprint } from '../../../../src/core/svek/image/Footprint.js';
import { UImage } from '../../../../src/core/klimt/shape/UImage.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import type { UDrawable } from '../../../../src/core/klimt/shape/UDrawable.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import { makeAtomImageResolverFor } from '../../../../src/core/creole-atoms-image-resolver.js';
import { measureUsecaseOrActorLeaf } from '../../../../src/diagrams/description/leaf-sizing.js';
import { WidthTableMeasurer } from '../../../../src/core/measurer.js';
import { createSpriteRegistry, addSprite, spriteDimsLookupFor } from '../../../../src/core/sprite-commands.js';
import { SpriteMonochrome } from '../../../../src/core/klimt/sprite/SpriteMonochrome.js';
import type { FontConfiguration } from '../../../../src/core/klimt/shape/UText.js';
import type { AtomImageResolver, InlineAtomToken } from '../../../../src/core/creole-atoms.js';

/**
 * SI15 T1 (ADR-1): widens `AtomImageResolver`'s `image` variant with the
 * optional raster-pixel fields under test -- mirrors
 * `EntityImageDescriptionTextBlock.ts`'s/`EntityImageDescriptionDelegates
 * .ts`'s identical local type (see either's doc comment for why
 * `AtomImageResolver` itself, `creole-atoms.ts`, is not widened -- that
 * module sits at this project's 500-line file cap).
 */
type ResolvedAtomImageWithRaster =
  | (Extract<ReturnType<AtomImageResolver>, { readonly kind: 'image' }> & {
      readonly rasterWidth?: number;
      readonly rasterHeight?: number;
    })
  | Exclude<ReturnType<AtomImageResolver>, { readonly kind: 'image' }>;

/** `Footprint`'s constructor requires a `StringBounder`, but none of the
 *  fixtures below draw a `UText` — never invoked. */
const UNUSED_STRING_BOUNDER: StringBounder = {
  calculateDimension: () => {
    throw new Error('not used by this test');
  },
};

function imageDrawable(image: UImage): UDrawable {
  return {
    drawU(ug: UGraphic): void {
      ug.apply(new UTranslate(0, 0)).draw(image);
    },
  };
}

describe('Footprint.MyUGraphic#drawImage — SI15 T1 (ADR-1) guarded raster fallback', () => {
  it('(a) raster-backed UImage: corners fit at raster - 1, not the declared box', () => {
    const image = UImage.build(3.230769, 2.153846, 'data:image/png;base64,x', {
      rasterWidth: 3,
      rasterHeight: 2,
    });
    const footprint = new Footprint(UNUSED_STRING_BOUNDER);
    const ellipse = footprint.getEllipse(imageDrawable(image), 1);
    const expectedDiagonal = Math.hypot(3 - 1, 2 - 1); // raster - 1 = 2x1
    expect(ellipse.getWidth()).toBeCloseTo(expectedDiagonal, 9);
    expect(ellipse.getHeight()).toBeCloseTo(expectedDiagonal, 9);
  });

  it('(b) rasterless UImage: corners fit at the declared dims, unchanged behaviour', () => {
    const image = UImage.build(3.230769, 2.153846, 'data:image/png;base64,x');
    const footprint = new Footprint(UNUSED_STRING_BOUNDER);
    const ellipse = footprint.getEllipse(imageDrawable(image), 1);
    const expectedDiagonal = Math.hypot(3.230769, 2.153846); // declared dims, no -1
    expect(ellipse.getWidth()).toBeCloseTo(expectedDiagonal, 9);
    expect(ellipse.getHeight()).toBeCloseTo(expectedDiagonal, 9);
  });

  it('UImage with no raster dims exposes undefined accessors', () => {
    const image = UImage.build(10, 20, 'data:image/png;base64,x');
    expect(image.getRasterWidth()).toBeUndefined();
    expect(image.getRasterHeight()).toBeUndefined();
  });

  it('UImage with raster dims exposes them via accessors alongside the declared dims', () => {
    const image = UImage.build(10, 20, 'data:image/png;base64,x', { rasterWidth: 4, rasterHeight: 5 });
    expect(image.getWidth()).toBe(10);
    expect(image.getHeight()).toBe(20);
    expect(image.getRasterWidth()).toBe(4);
    expect(image.getRasterHeight()).toBe(5);
  });
});

describe('render-atoms.ts resolvers — SI15 T1/T6 raster-dims producers', () => {
  it('(c) resolveSpriteAtom (monochrome branch): raster = Math.round(declared), not the raw grid', () => {
    const registry = createSpriteRegistry();
    addSprite(registry, 'gear', new SpriteMonochrome(4, 3, 8));
    const font: FontConfiguration = { family: 'Helvetica', size: 26, color: '#000000', styles: new Set() };
    const resolve = makeAtomImageResolverFor(registry)(font);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'gear', scale: 1 };
    const resolved: ResolvedAtomImageWithRaster | undefined = resolve(atom);
    expect(resolved).toBeDefined();
    if (resolved === undefined || resolved.kind !== 'image') throw new Error('expected an image resolution');
    // spriteScale(1, 26) = 1 * 26/13 = 2 -- declared dims are grid x 2, and
    // SI15 T6's raster formula is round(declared): upstream's actual PNG
    // raster is the AWT-resampled round(grid x scale), NOT the raw grid
    // (jar-proven via IHDR decode, `.agent-notes/si15-ink-offset.md`).
    expect(resolved.rasterWidth).toBe(8);
    expect(resolved.rasterHeight).toBe(6);
    expect(resolved.width).toBe(8);
    expect(resolved.height).toBe(6);
  });

  it('(c) resolveSpriteAtom at a rounding boundary: grid 16 at font 14 -> raster 17 (the jar-decoded case)', () => {
    const registry = createSpriteRegistry();
    addSprite(registry, 'inkbox', new SpriteMonochrome(16, 16, 16));
    const font: FontConfiguration = { family: 'Helvetica', size: 14, color: '#000000', styles: new Set() };
    const resolve = makeAtomImageResolverFor(registry)(font);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'inkbox', scale: 1 };
    const resolved: ResolvedAtomImageWithRaster | undefined = resolve(atom);
    if (resolved === undefined || resolved.kind !== 'image') throw new Error('expected an image resolution');
    // 16 * 14/13 = 17.230769... -> the jar's emitted PNG is 17x17
    // (IHDR-decoded from the oracle's own output, si15-ink-offset.md) --
    // the exact case that falsified T1's raw-grid formula (grid says 16).
    expect(resolved.width).toBeCloseTo(17.230769, 5);
    expect(resolved.rasterWidth).toBe(17);
    expect(resolved.rasterHeight).toBe(17);
  });

  it('(c) resolveImgAtom: raster = Math.round(IHDR x scale), not the raw IHDR dims', () => {
    const font: FontConfiguration = { family: 'Helvetica', size: 12, color: '#000000', styles: new Set() };
    const resolve = makeAtomImageResolverFor(undefined)(font);
    // `width`/`height` on an `ImgAtomToken` are the raw IHDR pixel dims
    // (`buildImgSpan`, creole-atoms.ts); declared = IHDR x scale, raster =
    // round(declared) per SI15 T6 (upstream resamples the drawn raster).
    const atom: InlineAtomToken = { kind: 'img', dataUri: 'data:image/png;base64,x', scale: 2, width: 5, height: 7 };
    const resolved: ResolvedAtomImageWithRaster | undefined = resolve(atom);
    expect(resolved).toBeDefined();
    if (resolved === undefined || resolved.kind !== 'image') throw new Error('expected an image resolution');
    expect(resolved.rasterWidth).toBe(10);
    expect(resolved.rasterHeight).toBe(14);
    expect(resolved.width).toBe(10);
    expect(resolved.height).toBe(14);
  });

  it('(d) Footprint corners at the boundary case use raster - 1 = 16, not the declared 17.23 box', () => {
    const image = UImage.build(17.230769, 17.230769, 'data:image/png;base64,x', {
      rasterWidth: 17,
      rasterHeight: 17,
    });
    const footprint = new Footprint(UNUSED_STRING_BOUNDER);
    const ellipse = footprint.getEllipse(imageDrawable(image), 1);
    const expectedDiagonal = Math.hypot(16, 16); // raster - 1
    expect(ellipse.getWidth()).toBeCloseTo(expectedDiagonal, 9);
  });
});

describe('sizing-path reachability — SI15 T6 (`.agent-notes/si15-ink-offset.md`)', () => {
  /**
   * T4's jar-verified probe, reproduced as a permanent guard: a 16x16
   * monochrome sprite (the ink content is irrelevant to BOTH fits -- ours
   * and the jar's use only declared/raster dims, never pixel data) on a
   * usecase label in both orderings, font 14. Jar numbers from a fresh
   * deterministic oracle run recorded in the diagnosis note:
   * sprite+text 2rx/2ry = 56.2184/44.7130, text+sprite = 58.132/46.1882.
   * Pre-T6, text+sprite measured 59.3506/47.1275 (delta 1.22/0.94px)
   * because `sizingAtomImageResolverFor`'s monochrome fallback carried no
   * raster dims, leaving `Footprint.drawImage`'s raster branch unreachable
   * from `measureUsecaseOrActorLeaf` -- this test fails if that fallback
   * ever loses them again.
   */
  const JAR_TOLERANCE_PX = 1e-2;
  const fontSpec = { family: 'Helvetica', size: 14 } as const;

  function inkboxSprites() {
    const registry = createSpriteRegistry();
    addSprite(registry, 'inkbox', new SpriteMonochrome(16, 16, 16));
    return spriteDimsLookupFor(registry);
  }

  it('sprite+text ordering matches the jar (was already exact -- size-insensitive diameter pair)', () => {
    const dim = measureUsecaseOrActorLeaf('<$inkbox>\ninkbox', 'usecase', fontSpec, new WidthTableMeasurer(), inkboxSprites());
    expect(Math.abs(dim.width - 56.2184)).toBeLessThanOrEqual(JAR_TOLERANCE_PX);
    expect(Math.abs(dim.height - 44.713)).toBeLessThanOrEqual(JAR_TOLERANCE_PX);
  });

  it('text+sprite ordering matches the jar (the T4-diagnosed size-sensitive case)', () => {
    const dim = measureUsecaseOrActorLeaf('inkbox\n<$inkbox>', 'usecase', fontSpec, new WidthTableMeasurer(), inkboxSprites());
    expect(Math.abs(dim.width - 58.132)).toBeLessThanOrEqual(JAR_TOLERANCE_PX);
    expect(Math.abs(dim.height - 46.1882)).toBeLessThanOrEqual(JAR_TOLERANCE_PX);
  });
});
