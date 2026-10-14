/**
 * The `<$name>` atom of an internal PNG sprite: `AtomSprite` (AtomSprite.java:66-80)
 * measures and draws `SpriteImage#asTextBlock` (SpriteImage.java:70-98) — a
 * declared box of `UImage#getWidth() * scale` and one drawn `UImage` of the
 * PNG scaled to `round(16 * scale)` pixels.
 */
import { describe, expect, it } from 'vitest';
import type { InlineAtomToken } from '../../../src/core/creole-atoms.js';
import { makeAtomImageResolverFor } from '../../../src/core/creole-atoms-image-resolver.js';
import { internalSpriteStoreFrom, readPng } from '../../../src/core/internal-sprite-store.js';
import { UImage } from '../../../src/core/klimt/shape/UImage.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import { HColorSimple } from '../../../src/core/klimt/color/HColorSimple.js';
import { createSpriteRegistry } from '../../../src/core/sprite-registry.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';

const DATA_URI_PREFIX = 'data:image/png;base64,';
/** `CommandCreoleSprite.java:82`: `fc.getSize2D() / 13.0` at size 12. */
const DECLARED_12 = (15 * 12) / 13;

function font(color: string | null, hColor?: HColorSimple): FontConfiguration {
  return {
    family: 'SansSerif',
    size: 12,
    color,
    ...(hColor === undefined ? {} : { hColor }),
    styles: new Set(),
  };
}

function resolve(
  atom: InlineAtomToken,
  fc: FontConfiguration,
): ReturnType<ReturnType<ReturnType<typeof makeAtomImageResolverFor>>> {
  const registry = createSpriteRegistry(internalSpriteStoreFrom(buildSpriteAssetsStore()));
  return makeAtomImageResolverFor(registry)(fc)(atom);
}

function onlyImage(resolved: ReturnType<typeof resolve>): UImage {
  if (resolved?.kind !== 'drawable') throw new Error('expected a drawable atom');
  expect(resolved.primitives).toHaveLength(1);
  const shape = resolved.primitives[0]!.shape;
  if (!(shape instanceof UImage)) throw new Error('expected a UImage');
  return shape;
}

function opaquePixels(shape: UImage): number[] {
  const bytes = Uint8Array.from(Buffer.from(shape.getHref().slice(DATA_URI_PREFIX.length), 'base64'));
  return Array.from(readPng(bytes)!.argb).filter((v) => v >>> 24 !== 0);
}

describe('makeAtomImageResolverFor — internal PNG sprite (SpriteImage)', () => {
  const access: InlineAtomToken = { kind: 'sprite', name: 'archimate/access', scale: 1 };
  /** A url-label sprite keeps its raw scale (`spriteAtomScale`): 1 exactly, so no resample. */
  const accessAt1: InlineAtomToken = { ...access, insideUrl: true };

  it('declares (16 - 1) * 12/13 and draws one 15x15 UImage (jar xucoma-93 <image width="15">)', () => {
    const resolved = resolve(access, font('#000000'));
    expect(resolved?.width).toBeCloseTo(DECLARED_12, 12);
    expect(resolved?.height).toBeCloseTo(DECLARED_12, 12);
    const shape = onlyImage(resolved);
    expect([shape.getWidth(), shape.getHeight(), shape.getRasterWidth(), shape.getRasterHeight()]).toEqual([
      15, 15, 15, 15,
    ]);
  });

  it('mutes to the font colour: Java int 0xFF000000 + 0xFF000000 leaves alpha 0xFE (PixelImage.java:109)', () => {
    const muted = opaquePixels(onlyImage(resolve(accessAt1, font('#000000'))));
    expect(muted).toEqual(new Array<number>(15).fill(0xfe000000 | 0));
  });

  it('draws the raw pixels when the font has no colour (SpriteImage.java:88-89)', () => {
    const raw = opaquePixels(onlyImage(resolve(accessAt1, font(null))));
    expect(raw).toEqual(new Array<number>(15).fill(0xff000000 | 0));
  });

  it('uses the forced colour over the font colour, getColorOrWhite for an unknown name', () => {
    const red = opaquePixels(onlyImage(resolve({ ...accessAt1, forcedColor: 'red' }, font('#000000'))));
    expect(red.every((v) => (v & 0xffffff) === 0xff0000)).toBe(true);
    const unknown = opaquePixels(onlyImage(resolve({ ...accessAt1, forcedColor: 'nosuchcolour' }, font('#000000'))));
    expect(unknown.every((v) => (v & 0xffffff) === 0xffffff)).toBe(true);
  });

  it("reads the font's HColorSimple while it is still the font colour", () => {
    const blue = HColorSimple.create({ r: 0, g: 0, b: 255, a: 255 });
    const paint = blue.asPaint();
    if (typeof paint !== 'string') throw new Error('a simple colour paints as a string');
    const viaHColor = opaquePixels(onlyImage(resolve(accessAt1, font(paint, blue))));
    expect(viaHColor.every((v) => (v & 0xffffff) === 0x0000ff)).toBe(true);
    const stale = opaquePixels(onlyImage(resolve(accessAt1, font('#00FF00', blue))));
    expect(stale.every((v) => (v & 0xffffff) === 0x00ff00)).toBe(true);
  });

  it('applies the url-label raw scale (AtomTextUtils): 15 * 2 declared, round(16 * 2) drawn', () => {
    const resolved = resolve({ kind: 'sprite', name: 'archimate/access', scale: 2, insideUrl: true }, font('#000000'));
    expect(resolved?.width).toBe(30);
    expect(onlyImage(resolved).getRasterWidth()).toBe(32);
  });
});
