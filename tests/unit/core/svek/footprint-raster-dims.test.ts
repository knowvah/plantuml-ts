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
import { makeAtomImageResolverFor } from '../../../../src/diagrams/description/render-atoms.js';
import { createSpriteRegistry, addSprite } from '../../../../src/core/sprite-commands.js';
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

describe('render-atoms.ts resolvers — SI15 T1 (ADR-1) raster-dims producers', () => {
  it('(c) resolveSpriteAtom (monochrome branch) carries the sprite grid dims as raster dims', () => {
    const registry = createSpriteRegistry();
    // A 4x3 grid, one pixel per cell -- the PNG raster this sprite
    // rasterizes to (`resolveSpriteAtom`'s own doc comment, render-atoms.ts).
    addSprite(registry, 'gear', new SpriteMonochrome(4, 3, 8));
    const font: FontConfiguration = { family: 'Helvetica', size: 26, color: '#000000', styles: new Set() };
    const resolve = makeAtomImageResolverFor(registry)(font);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'gear', scale: 1 };
    const resolved: ResolvedAtomImageWithRaster | undefined = resolve(atom);
    expect(resolved).toBeDefined();
    if (resolved === undefined || resolved.kind !== 'image') throw new Error('expected an image resolution');
    // spriteScale(1, 26) = 1 * 26/13 = 2 -- declared dims are SCALED, raster
    // dims are the RAW grid (unscaled), exactly the two-notion split.
    expect(resolved.rasterWidth).toBe(4);
    expect(resolved.rasterHeight).toBe(3);
    expect(resolved.width).toBe(8);
    expect(resolved.height).toBe(6);
  });

  it('(c) resolveImgAtom carries the data URI IHDR dims as raster dims', () => {
    const font: FontConfiguration = { family: 'Helvetica', size: 12, color: '#000000', styles: new Set() };
    const resolve = makeAtomImageResolverFor(undefined)(font);
    // `width`/`height` on an `ImgAtomToken` are ALREADY the raw IHDR pixel
    // dims (`buildImgSpan`, creole-atoms.ts) -- constructed directly here
    // rather than round-tripped through the scanner/a real PNG, since
    // `resolveImgAtom` only reads `atom.width`/`atom.height`/`atom.scale`.
    const atom: InlineAtomToken = { kind: 'img', dataUri: 'data:image/png;base64,x', scale: 2, width: 5, height: 7 };
    const resolved: ResolvedAtomImageWithRaster | undefined = resolve(atom);
    expect(resolved).toBeDefined();
    if (resolved === undefined || resolved.kind !== 'image') throw new Error('expected an image resolution');
    expect(resolved.rasterWidth).toBe(5);
    expect(resolved.rasterHeight).toBe(7);
    expect(resolved.width).toBe(10);
    expect(resolved.height).toBe(14);
  });
});
