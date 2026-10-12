/**
 * `SaltDictionary` (SaltDictionary.java:62-180): the named-element store
 * `ElementFactoryRetrieveFromDictonnary` reads, and the `ISkinSimple` every
 * salt text block is built against.
 *
 * Sprite lookups against the 1.2026.8beta1 jar (`scripts/oracle-render.sh`,
 * deterministic text): `element/fixtures/text-sprite.puml` defines
 * `sprite $dot [8x8/16]` and draws `A<$dot>B` and `<$missing>C` — the known
 * sprite is an `<image>` 7 x 7 at x = 14.025 (after `A`), `B` follows at
 * 21.41; the unknown one draws nothing (StripeSimple.java:229-230).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { CreoleMode } from '../../../src/core/klimt/creole/CreoleMode.js';
import { CreoleParser } from '../../../src/core/klimt/creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../../../src/core/klimt/creole/Parser.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import type { Sprite } from '../../../src/core/klimt/sprite/Sprite.js';
import { createSpriteRegistry, matchSpriteCommand } from '../../../src/core/sprite-commands.js';
import type { ISkinSimple } from '../../../src/core/style/ISkinSimple.js';
import { Style } from '../../../src/core/style/Style.js';
import { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import { GUILLEMET_DEFAULT } from '../../../src/core/text/Guillemet.js';
import { ElementEmpty } from '../../../src/diagrams/salt/element/ElementEmpty.js';
import { ElementText } from '../../../src/diagrams/salt/element/ElementText.js';
import { WrappedElement } from '../../../src/diagrams/salt/element/WrappedElement.js';
import { atomOpsFor, SaltDictionary } from '../../../src/diagrams/salt/SaltDictionary.js';
import { drawElement, FIXTURES, FONT_12, stringBounder, textElements } from './salt-test-support.js';

const FC: FontConfiguration = { family: 'SansSerif', size: 12, color: '#000000', styles: new Set() };

/** The `sprite $dot` block of `text-sprite.puml`, built by the shared sprite port. */
function dotSprite(): Sprite {
  const lines = readFileSync(`${FIXTURES}/text-sprite.puml`, 'utf8').split('\n');
  const registry = createSpriteRegistry();
  expect(matchSpriteCommand(lines, 1, registry)?.consumed).toBe(10);
  const sprite = registry.byName.get('dot');
  if (sprite === undefined) throw new Error('text-sprite.puml: sprite $dot did not register');
  return sprite;
}

function imageTags(svg: string): string[] {
  return [...svg.matchAll(/<image\b[^>]*?(?= xlink:href)/g)].map((m) => m[0]);
}

describe('SaltDictionary put/get (java:73-80)', () => {
  it('returns the stored element wrapped, measured at (0, 0)', () => {
    const dictionary = new SaltDictionary();
    const empty = new ElementEmpty();
    dictionary.put('cell', empty);
    const got = dictionary.get('cell');
    expect(got).toBeInstanceOf(WrappedElement);
    expect(got).not.toBe(empty);
    const dim = got.getPreferredDimension(stringBounder, 50, 60);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([1, 1]);
  });

  it('wraps afresh on every get, and a later put replaces the entry', () => {
    const dictionary = new SaltDictionary();
    dictionary.put('a', new ElementEmpty());
    expect(dictionary.get('a')).not.toBe(dictionary.get('a'));
    dictionary.put('a', new ElementText(['Login'], FONT_12, dictionary));
    expect(dictionary.get('a').getPreferredDimension(stringBounder, 0, 0).getWidth()).toBeCloseTo(29.4, 3);
  });

  it('throws on a name never put (Objects.requireNonNull, java:78)', () => {
    expect(() => new SaltDictionary().get('nope')).toThrow(/NullPointerException.*nope/);
  });
});

describe('SaltDictionary sprites (java:82-85, 122-127)', () => {
  it('getSprite is null until addSprite, then the very sprite', () => {
    const dictionary = new SaltDictionary();
    const dot = dotSprite();
    expect(dictionary.getSprite('dot')).toBeNull();
    dictionary.addSprite('dot', dot);
    expect(dictionary.getSprite('dot')).toBe(dot);
    expect(dictionary.getSprite('missing')).toBeNull();
  });

  it('a creole <$dot> draws the jar <image> box; <$missing> draws nothing', () => {
    const dictionary = new SaltDictionary();
    dictionary.addSprite('dot', dotSprite());
    const jar = readFileSync(`${FIXTURES}/text-sprite.jar.svg`, 'utf8');
    const first = drawElement(new ElementText(['A<$dot>B'], FONT_12, dictionary), { dx: 6, dy: 6 });
    expect(imageTags(first)).toEqual(imageTags(jar));
    expect(textElements(first)).toEqual(textElements(jar).slice(0, 2));
    const second = drawElement(new ElementText(['<$missing>C'], FONT_12, dictionary), { dx: 6, dy: 20 });
    expect(imageTags(second)).toEqual([]);
    expect(textElements(second)).toEqual(textElements(jar).slice(2));
  });
});

describe('SaltDictionary ISkinSimple members (java:87-178)', () => {
  const dictionary = new SaltDictionary();

  it('answers the fixed values', () => {
    expect(dictionary.getValue('padding')).toBeNull();
    expect(dictionary.getPadding().getTop()).toBe(0);
    expect(dictionary.getPadding().getLeft()).toBe(0);
    expect(dictionary.guillemet()).toBe(GUILLEMET_DEFAULT);
    expect(dictionary.getMonospacedFamily()).toBe(MONOSPACED);
    expect(dictionary.getTabSize()).toBe(8);
    expect(dictionary.getDpi()).toBe(96);
    expect(dictionary.getIHtmlColorSet()).toBe(HColorSet.instance());
    expect(dictionary.minClassWidthTOBEREMOVED(new Style(StyleSignatureBasic.of('root'), new Map()))).toBe(0);
    expect(dictionary.transformStringForSizeHack('a b')).toBe('a b');
    expect(dictionary.getFromMd5('d41d8cd98f00b204e9800998ecf8427e')).toBeNull();
    expect(dictionary.getPragma()).not.toBe(dictionary.getPragma());
  });

  it('refuses copyAllFrom and values (java:129-137)', () => {
    expect(() => dictionary.copyAllFrom(new Map())).toThrow(/UnsupportedOperationException/);
    expect(() => dictionary.values()).toThrow(/UnsupportedOperationException/);
  });

  it('builds a CreoleParser only through the stereo overload (java:148-158)', () => {
    expect(() => dictionary.sheet(FC, HorizontalAlignment.LEFT, CreoleMode.FULL)).toThrow(
      /UnsupportedOperationException/,
    );
    expect(dictionary.sheet(FC, HorizontalAlignment.LEFT, CreoleMode.FULL, FC)).toBeInstanceOf(CreoleParser);
  });
});

describe('atomOpsFor (port-only)', () => {
  it('refuses a sprite container that is not the SaltDictionary', () => {
    expect(() => atomOpsFor({} as ISkinSimple, FC)).toThrow(/ClassCastException/);
  });

  it('measures through the dictionary sprites', () => {
    const dictionary = new SaltDictionary();
    dictionary.addSprite('dot', dotSprite());
    const ops = atomOpsFor(dictionary, FC);
    const dim = ops.calculateDimension(
      { kind: 'inline', atom: { kind: 'sprite', name: 'dot', scale: 1 }, ambientFont: FC },
      stringBounder,
    );
    // 21.41 - 14.025: the jar's advance across the 8x8 sprite at 12/13.
    expect(dim.getWidth()).toBeCloseTo(7.385, 3);
  });
});
