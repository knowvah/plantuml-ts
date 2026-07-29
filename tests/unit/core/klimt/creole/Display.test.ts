/**
 * Display.test.ts — T9c: unit coverage for `Display`
 * (klimt/creole/Display.java) -- construction, `cacheKey()` (the
 * faithfulness-critical value-equality contract `SheetBuilder.ts`/
 * `CreoleParser.ts` need), `create0`'s three-way dispatch, and the core
 * read surface.
 */
import { describe, expect, it } from 'vitest';
import { Display } from '../../../../../src/core/klimt/creole/Display.js';
import { CreoleMode } from '../../../../../src/core/klimt/creole/CreoleMode.js';
import { Sheet } from '../../../../../src/core/klimt/creole/Sheet.js';
import type { Stripe } from '../../../../../src/core/klimt/creole/Stripe.js';
import type { CreoleAtom } from '../../../../../src/core/klimt/creole/atom/Atom.js';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { LineBreakStrategy } from '../../../../../src/core/klimt/LineBreakStrategy.js';
import type { AtomOps } from '../../../../../src/core/klimt/creole/Sea.js';
import type { SheetBuilder, DisplayLike } from '../../../../../src/core/klimt/creole/SheetBuilder.js';
import type { ISkinSimple } from '../../../../../src/core/style/ISkinSimple.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';
import type { CreoleRenderContext } from '../../../../../src/core/klimt/creole/DisplayCreole.js';
import { Stereotype } from '../../../../../src/core/stereo/Stereotype.js';
import { MessageNumber } from '../../../../../src/core/sequencediagram/MessageNumber.js';
import { Pragma } from '../../../../../src/core/skin/Pragma.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 12, color: '#000000', styles: new Set() };
const CHAR_WIDTH = 2;
const LINE_HEIGHT = 10;

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

function unitOps(): AtomOps {
  return {
    calculateDimension: (atom): XDimension2D => {
      const text = atom.kind === 'text' ? atom.text : '';
      return new XDimension2D(text.length * CHAR_WIDTH, LINE_HEIGHT);
    },
    getStartingAltitude: (): number => 0,
    drawU: (): void => undefined,
  };
}

/** A real `SheetBuilder`: one text stripe per `DisplayLike` line (joined
 *  by a space) -- proves `getCreole`'s real chain end-to-end without a
 *  full `CreoleParser`, matching `CreoleHorizontalLine.test.ts`'s own
 *  established `realSheetBuilder` pattern. */
function realSheetBuilder(): SheetBuilder {
  return {
    createSheet(display: DisplayLike) {
      const sheet = new Sheet(HorizontalAlignment.LEFT);
      const text = [...display].map((line) => (typeof line === 'string' ? line : line.toString())).join(' ');
      const atom: CreoleAtom = { kind: 'text', text, font: FONT };
      const stripe: Stripe = { getLHeader: () => null, getAtoms: () => [atom] };
      sheet.add(stripe);
      return sheet;
    },
  };
}

function fakeSkin(builder: SheetBuilder = realSheetBuilder()): ISkinSimple {
  return {
    getSprite: () => null,
    guillemet: () => {
      throw new Error('not exercised in this test');
    },
    getFromMd5: () => null,
    transformStringForSizeHack: (s) => s,
    getValue: () => null,
    values: () => new Map(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => 'monospaced',
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => Pragma.createEmpty(),
    sheet: () => builder,
  };
}

function ctx(builder?: SheetBuilder): CreoleRenderContext {
  return { fontConfiguration: FONT, spriteContainer: fakeSkin(builder), atomOps: unitOps() };
}

describe('Display.cacheKey() -- value-equality contract (SheetBuilder.ts, faithfulness-critical)', () => {
  it('two DISTINCT Display objects with IDENTICAL content return EQUAL cacheKeys', () => {
    const a = Display.create('Hello', 'World');
    const b = Display.create('Hello', 'World');
    expect(a).not.toBe(b);
    expect(a.cacheKey()).toBe(b.cacheKey());
  });

  it('two Display objects with DIFFERENT content return DIFFERENT cacheKeys', () => {
    const a = Display.create('Hello', 'World');
    const b = Display.create('Hello', 'Mars');
    expect(a.cacheKey()).not.toBe(b.cacheKey());
  });

  it('Display.NULL has one reserved sentinel key, distinct from any real content', () => {
    expect(Display.NULL.cacheKey()).toBe(' NULL');
    expect(Display.create('NULL').cacheKey()).not.toBe(Display.NULL.cacheKey());
  });

  it('a Stereotype element folds to a stable string, not object identity', () => {
    const s1 = Stereotype.build('<<Foo>>')!;
    const s2 = Stereotype.build('<<Foo>>')!;
    expect(s1).not.toBe(s2);
    const a = Display.create(s1, 'line');
    const b = Display.create(s2, 'line');
    expect(a.cacheKey()).toBe(b.cacheKey());
  });

  it('hashCode() is 42 for Display.NULL (java:107-108) and stable/repeatable otherwise', () => {
    expect(Display.NULL.hashCode()).toBe(42);
    const d = Display.create('x');
    expect(d.hashCode()).toBe(d.hashCode());
    expect(Display.create('x').hashCode()).toBe(Display.create('x').hashCode());
  });
});

describe('Display.create0 dispatch (java:637-669) -- all three branches reached', () => {
  it('branch 3 (plain text) -- getCreole produces a real SheetBlock2 with a measurable dimension', () => {
    const display = Display.create('Hi');
    const tb = display.create9(ctx(), HorizontalAlignment.LEFT, LineBreakStrategy.NONE);
    expect(tb.calculateDimension(sb)).toEqual(new XDimension2D(2 * CHAR_WIDTH, LINE_HEIGHT));
  });

  it('branch 2 (MessageNumber at position 0) -- createMessageNumber merges number + text into one real TextBlock', () => {
    const display = Display.create(new MessageNumber('1)'), 'Hello');
    const tb = display.create9(ctx(), HorizontalAlignment.LEFT, LineBreakStrategy.NONE);
    // tb1 ("1)", 2 chars = 4 wide) + 4px margin (java:708) + tb2 ("Hello", 5 chars = 10 wide).
    expect(tb.calculateDimension(sb)).toEqual(new XDimension2D(2 * CHAR_WIDTH + 4 + 5 * CHAR_WIDTH, LINE_HEIGHT));
  });

  it('branch 1 (Stereotype at position 0) -- cited seam throws (circled-character decoration blocked, ADR-8 corollary)', () => {
    const stereotype = Stereotype.build('<<Foo>>')!;
    const display = Display.create(stereotype, 'Hello');
    expect(() => display.create9(ctx(), HorizontalAlignment.LEFT, LineBreakStrategy.NONE)).toThrow(/circled-character\/sprite decoration is blocked/);
  });

  it('branch 1 (Stereotype at LAST position) -- same cited seam', () => {
    const stereotype = Stereotype.build('<<Foo>>')!;
    const display = Display.create('Hello', stereotype);
    expect(() => display.create9(ctx(), HorizontalAlignment.LEFT, LineBreakStrategy.NONE)).toThrow(/circled-character\/sprite decoration is blocked/);
  });

  it('a SPOTTED Stereotype cites the HColor/CircledCharacter gap specifically', () => {
    const spotted = Stereotype.build('<<(X, red)Foo>>', 0, undefined, () => undefined);
    expect(spotted.isSpotted()).toBe(true);
    const display = Display.create(spotted);
    expect(() => display.create9(ctx(), HorizontalAlignment.LEFT, LineBreakStrategy.NONE)).toThrow(/CircledCharacter\.java/);
  });

  it('a non-spotted Stereotype cites the SpriteRegistry/ISkinSimple integration gap specifically', () => {
    const plain = Stereotype.build('<<Foo>>')!;
    expect(plain.isSpotted()).toBe(false);
    const display = Display.create(plain);
    expect(() => display.create9(ctx(), HorizontalAlignment.LEFT, LineBreakStrategy.NONE)).toThrow(/SpriteRegistry/);
  });

  it('naturalHorizontalAlignment overrides the passed horizontalAlignment (java:648-649)', () => {
    const display = Display.getWithNewlines(Pragma.createEmpty(), 'a\\rb');
    expect(display.getNaturalHorizontalAlignment()).toBe(HorizontalAlignment.RIGHT);
    let capturedAlignment: HorizontalAlignment | undefined;
    const builder: SheetBuilder = {
      createSheet(d: DisplayLike) {
        return realSheetBuilder().createSheet(d);
      },
    };
    const skin: ISkinSimple = {
      ...fakeSkin(builder),
      sheet: (fc, ha) => {
        capturedAlignment = ha;
        return builder;
      },
    };
    display.create9({ fontConfiguration: FONT, spriteContainer: skin, atomOps: unitOps() }, HorizontalAlignment.LEFT, LineBreakStrategy.NONE);
    expect(capturedAlignment).toBe(HorizontalAlignment.RIGHT);
  });
});

describe('Display construction / list surface', () => {
  it('Display.NULL.isNull is true; Display.empty() is non-null and empty', () => {
    expect(Display.NULL.isNull).toBe(true);
    expect(Display.NULL.size()).toBe(0);
    expect(Display.empty().isNull).toBe(false);
    expect(Display.empty().size()).toBe(0);
  });

  it('Display.isNull(display) matches java:609-612 (null OR isNull)', () => {
    expect(Display.isNull(null)).toBe(true);
    expect(Display.isNull(undefined)).toBe(true);
    expect(Display.isNull(Display.NULL)).toBe(true);
    expect(Display.isNull(Display.create('x'))).toBe(false);
  });

  it('create(...strings) and create(array) both build the same content', () => {
    const a = Display.create('a', 'b');
    const b = Display.create(['a', 'b']);
    expect(a.asList()).toEqual(['a', 'b']);
    expect(b.asList()).toEqual(['a', 'b']);
  });

  it('get/size/subList/asList read the raw element (Stereotype/MessageNumber preserved, not coerced)', () => {
    const stereotype = Stereotype.build('<<Foo>>')!;
    const display = Display.create(stereotype, 'line');
    expect(display.size()).toBe(2);
    expect(display.get(0)).toBe(stereotype);
    expect(display.asList()[0]).toBe(stereotype);
    expect(display.subList(1, 2).asList()).toEqual(['line']);
  });

  it('[Symbol.iterator]() (DisplayLike contract) coerces a non-Stereotype element to string', () => {
    const num = new MessageNumber('1)');
    const display = Display.create(num, 'text');
    const iterated = [...display];
    expect(iterated).toEqual(['1)', 'text']);
    expect(typeof iterated[0]).toBe('string');
  });

  it('[Symbol.iterator]() yields a Stereotype element verbatim (StereotypeLike-compatible)', () => {
    const stereotype = Stereotype.build('<<Foo>>')!;
    const display = Display.create(stereotype);
    const [first] = [...display];
    expect(first).toBe(stereotype);
  });

  it('showStereotype/isNull are DisplayLike-compliant plain-property reads (no parens)', () => {
    const display = Display.create('x');
    expect(display.showStereotype).toBe(true);
    expect(display.isNull).toBe(false);
  });

  it('equals: two distinct Displays with identical content are equal (java:112-115)', () => {
    expect(Display.create('a', 'b').equals(Display.create('a', 'b'))).toBe(true);
    expect(Display.create('a').equals(Display.create('b'))).toBe(false);
  });

  it('equals throws when called on Display.NULL (unguarded NPE quirk, preserved faithfully)', () => {
    expect(() => Display.NULL.equals(Display.create('x'))).toThrow();
  });

  it('equalsLike treats two NULL-ish Displays as equal without throwing (java:117-121)', () => {
    expect(Display.NULL.equalsLike(Display.NULL)).toBe(true);
    expect(Display.NULL.equalsLike(Display.create('x'))).toBe(false);
  });

  it('withCreoleMode throws IllegalArgumentException on a NULL display (java:491-492)', () => {
    expect(() => Display.NULL.withCreoleMode(CreoleMode.NO_CREOLE)).toThrow();
  });

  it('contentWidth returns the longest line length (java:769-777)', () => {
    expect(Display.create('short', 'a longer line').contentWidth()).toBe('a longer line'.length);
  });

  it('isWhite is true for empty/whitespace-only, false otherwise (java:172-175)', () => {
    expect(Display.empty().isWhite()).toBe(true);
    expect(Display.create('   ').isWhite()).toBe(true);
    expect(Display.create('x').isWhite()).toBe(false);
  });

  it('toString renders "NULL" for the null sentinel, else a bracketed list (java:497-503)', () => {
    expect(Display.NULL.toString()).toBe('NULL');
    expect(Display.create('a', 'b').toString()).toBe('[a, b]');
  });
});

describe('Display.withoutStereotypeIfNeeded / hasUrl -- cited, thrown seams', () => {
  it('withoutStereotypeIfNeeded on Display.NULL returns Display.NULL without needing the Style subsystem', () => {
    expect(Display.NULL.withoutStereotypeIfNeeded({})).toBe(Display.NULL);
  });

  it('withoutStereotypeIfNeeded on a real Display throws, citing the missing Style subsystem', () => {
    expect(() => Display.create('x').withoutStereotypeIfNeeded({})).toThrow(/Style/);
  });

  it('hasUrl throws, citing the missing url/UrlBuilder subsystem', () => {
    expect(() => Display.create('x').hasUrl()).toThrow(/UrlBuilder/);
  });
});
