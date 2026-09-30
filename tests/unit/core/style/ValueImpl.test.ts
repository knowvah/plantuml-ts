/**
 * ValueImpl — the parsed style value (`style/ValueImpl.java`, 209 lines).
 *
 * Merge expectations are jar-probed with the T0c StyleProbe
 * (`plans/mindmap-engine-port/tools/probe/run-probe.sh StyleProbe <snippet>
 * merged root,element,mindmapDiagram,node,rootNode`, 1.2026.8beta1):
 *  - two `node { BackGroundColor ... }` blocks, `red` then `blue`
 *    -> `BackGroundColor=blue` (the later-counted, higher priority wins);
 *  - `node { BackGroundColor red }` then `@media (prefers-color-scheme:dark)
 *    { node { BackGroundColor blue } }` -> `BackGroundColor=red` (asString
 *    is value1: the dark value COMBINED with the regular one rather than
 *    replacing it -- a replacement would print `null`);
 *  - the dark block alone -> `BackGroundColor=null` (a dark-only value has
 *    a null value1).
 * Pure-Java semantics (digit extraction, parse, boolean, font face) are
 * pinned by quoting the Java line.
 */
import { describe, expect, it } from 'vitest';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';
import { ValueColor } from '../../../../src/core/style/ValueColor.js';
import { ValueNull } from '../../../../src/core/style/ValueNull.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { TestHColor, TestHColorSet, WHITE, counterFrom } from './helpers/hcolor-set.js';

describe('ValueImpl', () => {
  describe('factories (ValueImpl.java:50-60)', () => {
    it('regular(value, counter) takes the next counter int as priority', () => {
      const counter = counterFrom(41);
      const a = ValueImpl.regular('red', counter);
      const b = ValueImpl.regular('blue', counter);
      expect([a.getPriority(), b.getPriority()]).toEqual([41, 42]);
      expect(a.toString()).toBe('red/null (41)');
    });

    it('regular(value, int) takes the priority verbatim', () => {
      expect(ValueImpl.regular('7', 1000).toString()).toBe('7/null (1000)');
    });

    it('dark(value, counter) stores the value as value2', () => {
      const d = ValueImpl.dark('blue', counterFrom(3));
      expect(d.toString()).toBe('null/blue (3)');
      expect(d.asString()).toBeNull(); // probe: dark-only BackGroundColor=null
    });
  });

  describe('mergeWith (ValueImpl.java:62-74) -- the OVERWRITE_EXISTING_VALUE step Style.java:132 runs', () => {
    it('probe: red then blue in source order -> blue wins either way round', () => {
      const counter = counterFrom(1);
      const red = ValueImpl.regular('red', counter);
      const blue = ValueImpl.regular('blue', counter);
      expect(blue.mergeWith(red).asString()).toBe('blue');
      expect(red.mergeWith(blue).asString()).toBe('blue');
    });

    it('probe: regular red + later dark blue -> value1 red, value2 blue, regular priority kept', () => {
      const counter = counterFrom(1);
      const red = ValueImpl.regular('red', counter);
      const blue = ValueImpl.dark('blue', counter);
      const merged = blue.mergeWith(red);
      expect(merged.asString()).toBe('red');
      expect(merged.getPriority()).toBe(1);
    });

    it('returns this for an undefined other (java:63-64)', () => {
      const v = ValueImpl.regular('red', 1);
      expect(v.mergeWith(undefined)).toBe(v);
    });

    it('against a ValueColor: the strictly higher priority wins (java:67-71)', () => {
      const v = ValueImpl.regular('red', 5);
      const higher = new ValueColor(new TestHColor(WHITE), 6);
      const equal = new ValueColor(new TestHColor(WHITE), 5);
      expect(v.mergeWith(higher)).toBe(higher);
      expect(v.mergeWith(equal)).toBe(v);
    });

    it('throws for any other Value kind (java:72)', () => {
      expect(() => ValueImpl.regular('red', 5).mergeWith(ValueNull.NULL)).toThrow('UnsupportedOperationException');
    });
  });

  it('addPriority shifts the priority by delta (java:79-81)', () => {
    expect(ValueImpl.regular('red', 7).addPriority(1000).getPriority()).toBe(1007);
  });

  describe('asColor (ValueImpl.java:92-108) through the colour set', () => {
    it('"none"/"transparent" (any case) -> HColors.transparent(), i.e. XColor(0,0,0,0)', () => {
      const set = new TestHColorSet();
      expect(ValueImpl.regular('None', 1).asColor(set)).toEqual(new TestHColor({ r: 0, g: 0, b: 0, a: 0 }));
      expect(ValueImpl.regular('TRANSPARENT', 1).asColor(set)).toEqual(new TestHColor({ r: 0, g: 0, b: 0, a: 0 }));
    });

    it('resolves value1 through getColorOrWhite', () => {
      const set = new TestHColorSet();
      expect(ValueImpl.regular('red', 1).asColor(set)).toEqual(new TestHColor({ r: 255, g: 0, b: 0, a: 255 }));
      expect(set.requested).toEqual(['red']);
    });

    it('an unknown colour falls back to white (HColorSet.java:58-63)', () => {
      expect(ValueImpl.regular('banana', 1).asColor(new TestHColorSet())).toEqual(new TestHColor(WHITE));
    });

    it('a merged regular/dark pair resolves both halves and pairs them with withDark (java:103-106)', () => {
      const counter = counterFrom(1);
      const merged = ValueImpl.dark('#000080', counter).mergeWith(ValueImpl.regular('#FF0000', counter));
      const expected = new TestHColor({ r: 255, g: 0, b: 0, a: 255 }, new TestHColor({ r: 0, g: 0, b: 128, a: 255 }));
      expect(merged.asColor(new TestHColorSet())).toEqual(expected);
    });

    it('a dark-only value throws IllegalArgumentException(value.toString()) (java:100-101)', () => {
      expect(() => ValueImpl.dark('blue', counterFrom(4)).asColor(new TestHColorSet())).toThrow('null/blue (4)');
    });
  });

  describe('asBoolean (java:111-114): "true".equalsIgnoreCase(value1)', () => {
    it.each([
      ['true', true],
      ['TRUE', true],
      ['yes', false],
      ['1', false],
    ])('%s -> %s', (s, expected) => {
      expect(ValueImpl.regular(s, 1).asBoolean()).toBe(expected);
    });

    it('a dark-only value (null value1) is false', () => {
      expect(ValueImpl.dark('true', counterFrom(1)).asBoolean()).toBe(false);
    });
  });

  describe('asInt / asIntButMinusOneIfError (java:120-153): digits only, then Integer.parseInt', () => {
    it.each([
      ['7px', 7, 7],
      ['1.5', 15, 15],
      ['-3', 3, 3],
      ['a1b2', 12, 12],
      ['none', 0, -1],
      ['', 0, -1],
    ])('%s -> asInt %d, asIntButMinusOneIfError %d', (s, asInt, minusOne) => {
      const v = ValueImpl.regular(s, 1);
      expect(v.asInt()).toBe(asInt);
      expect(v.asIntButMinusOneIfError()).toBe(minusOne);
    });

    it('digits beyond Integer.MAX_VALUE throw NumberFormatException', () => {
      expect(() => ValueImpl.regular('2147483648', 1).asInt()).toThrow('NumberFormatException');
      expect(ValueImpl.regular('2147483647', 1).asInt()).toBe(2147483647);
    });
  });

  describe('asDouble (java:156-172): digits and dots only, then Double.parseDouble', () => {
    it.each([
      ['1.5', 1.5],
      ['0.5px', 0.5],
      ['.25', 0.25],
      ['3.', 3],
      ['-2', 2],
    ])('%s -> %d', (s, expected) => {
      expect(ValueImpl.regular(s, 1).asDouble()).toBe(expected);
    });

    it('no digit or dot -> NaN', () => {
      expect(ValueImpl.regular('none', 1).asDouble()).toBeNaN();
    });

    it('two dots is not a Java double literal -> NumberFormatException', () => {
      expect(() => ValueImpl.regular('1.2.3', 1).asDouble()).toThrow('NumberFormatException');
    });

    it('asDoubleDefaultTo never substitutes: `s == Double.NaN` is always false (java:174-179)', () => {
      expect(ValueImpl.regular('none', 1).asDoubleDefaultTo(4)).toBeNaN();
      expect(ValueImpl.regular('2.5', 1).asDoubleDefaultTo(4)).toBe(2.5);
    });
  });

  describe('asFontFace (java:181-200)', () => {
    it.each([
      ['bold', { cssWeight: 700, italic: false }],
      [' Italic ', { cssWeight: 400, italic: true }],
      ['plain', { cssWeight: 400, italic: false }],
      ['NORMAL', { cssWeight: 400, italic: false }],
      ['lighter', { cssWeight: 300, italic: false }],
      ['bolder', { cssWeight: 800, italic: false }],
      ['600', { cssWeight: 600, italic: false }],
      ['649', { cssWeight: 600, italic: false }],
      ['650', { cssWeight: 700, italic: false }],
      ['50', { cssWeight: 100, italic: false }],
      ['1200', { cssWeight: 900, italic: false }],
      ['underline', { cssWeight: 400, italic: false }],
      ['', { cssWeight: 400, italic: false }],
    ])('%j -> %j', (s, expected) => {
      expect(ValueImpl.regular(s, 1).asFontFace()).toEqual(expected);
    });

    it('a dark-only value (null raw) is normal', () => {
      expect(ValueImpl.dark('bold', counterFrom(1)).asFontFace()).toEqual({ cssWeight: 400, italic: false });
    });
  });

  describe('asHorizontalAlignment (java:202-204): HorizontalAlignment.fromString(asString())', () => {
    it('matches the constant name case-insensitively', () => {
      expect(ValueImpl.regular('center', 1).asHorizontalAlignment()).toBe(HorizontalAlignment.CENTER);
      expect(ValueImpl.regular('Right', 1).asHorizontalAlignment()).toBe(HorizontalAlignment.RIGHT);
    });

    it('returns undefined for anything else (Java null)', () => {
      expect(ValueImpl.regular('middle', 1).asHorizontalAlignment()).toBeUndefined();
      expect(ValueImpl.dark('left', counterFrom(1)).asHorizontalAlignment()).toBeUndefined();
    });
  });
});
