/**
 * `SpriteContainerEmpty` (klimt/sprite/SpriteContainerEmpty.java): the
 * skinparam-free `ISkinSimple` `GraphicStrings` builds its creole with.
 */
import { describe, expect, it } from 'vitest';
import type { InternalSpriteStore } from '../../../../../src/core/internal-sprite-store.js';
import { CreoleMode } from '../../../../../src/core/klimt/creole/CreoleMode.js';
import { CreoleParser } from '../../../../../src/core/klimt/creole/legacy/CreoleParser.js';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { FontStyle } from '../../../../../src/core/klimt/shape/UText.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';
import type { Sprite } from '../../../../../src/core/klimt/sprite/Sprite.js';
import { SpriteContainerEmpty } from '../../../../../src/core/klimt/sprite/SpriteContainerEmpty.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 12, color: '#000000', styles: new Set<FontStyle>() };

describe('SpriteContainerEmpty (SpriteContainerEmpty.java:56-149)', () => {
  const empty = new SpriteContainerEmpty();

  it('answers the empty-skin constants', () => {
    expect(empty.getValue('anything')).toBeNull();
    const p = empty.getPadding();
    expect([p.getTop(), p.getRight(), p.getBottom(), p.getLeft()]).toEqual([0, 0, 0, 0]);
    expect(empty.guillemet()).toEqual({ start: '<<', end: '>>' });
    expect(empty.getMonospacedFamily()).toBe('monospaced');
    expect(empty.getTabSize()).toBe(8);
    expect(empty.getDpi()).toBe(96);
    expect(empty.minClassWidthTOBEREMOVED(undefined)).toBe(0);
    expect(empty.transformStringForSizeHack('a b')).toBe('a b');
    expect(empty.getFromMd5('abc')).toBeNull();
    expect(empty.getPragma().getWarnings()).toEqual([]);
  });

  it('copyAllFrom and values are unsupported (java:98-106)', () => {
    expect(() => empty.copyAllFrom(new Map())).toThrow('UnsupportedOperationException');
    expect(() => empty.values()).toThrow('UnsupportedOperationException');
  });

  it('the three-argument sheet() is unsupported; the four-argument one is a CreoleParser (java:117-127)', () => {
    expect(() => empty.sheet(FONT, HorizontalAlignment.LEFT, CreoleMode.FULL)).toThrow('UnsupportedOperationException');
    expect(empty.sheet(FONT, HorizontalAlignment.LEFT, CreoleMode.FULL, FONT)).toBeInstanceOf(CreoleParser);
  });

  it('getSprite is SpriteImage.fromInternal: null without a bundle (java:58-61)', () => {
    expect(empty.getSprite('archimate/actor')).toBeNull();
  });

  it('getSprite reads the internal bundle when one is supplied', () => {
    const sprite: Sprite = { width: 16, height: 12 };
    const store: InternalSpriteStore = { get: (path) => (path === 'archimate/actor' ? sprite : undefined) };
    const withStore = new SpriteContainerEmpty(store);
    expect(withStore.getSprite('archimate/actor')).toBe(sprite);
    expect(withStore.getSprite('archimate/none')).toBeNull();
  });
});
