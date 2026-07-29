/**
 * ISkinSimple.test.ts — T9a: `ISkinSimple` is a pure interface (no
 * executable code), so this file is a conformance check: a minimal fake
 * implementation must structurally satisfy every ported member, exercised
 * the way `CreoleParser` actually calls `guillemet()`/`sheet(...)`.
 */
import { describe, expect, it } from 'vitest';
import type { ISkinSimple } from '../../../../src/core/style/ISkinSimple.js';
import { GUILLEMET_DEFAULT } from '../../../../src/core/text/Guillemet.js';
import { CreoleMode } from '../../../../src/core/klimt/creole/CreoleMode.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { FontConfiguration } from '../../../../src/core/klimt/shape/UText.js';
import type { Sheet } from '../../../../src/core/klimt/creole/Sheet.js';
import type { SheetBuilder } from '../../../../src/core/klimt/creole/SheetBuilder.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { PragmaKey } from '../../../../src/core/skin/PragmaKey.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

function fakeSkinSimple(): ISkinSimple {
  const values = new Map<string, string>([['key1', 'value1']]);
  return {
    getSprite: () => null,
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s) => s,
    getValue: (key) => values.get(key) ?? null,
    values: () => values,
    getPadding: () => ClockwiseTopRightBottomLeft.same(2),
    getMonospacedFamily: () => 'monospaced',
    getTabSize: () => 8,
    getDpi: () => 96,
    getPragma: () => Pragma.createEmpty(),
    copyAllFrom: (other) => {
      for (const [k, v] of other) values.set(k, v);
    },
    sheet: (): SheetBuilder => ({
      createSheet: (): Sheet => {
        throw new Error('not needed for this conformance test');
      },
    }),
  };
}

describe('ISkinSimple conformance', () => {
  it('a fake implementation satisfies every ported member', () => {
    const skin = fakeSkinSimple();
    expect(skin.guillemet()).toBe(GUILLEMET_DEFAULT);
    expect(skin.getValue('key1')).toBe('value1');
    expect(skin.getValue('missing')).toBeNull();
    expect(skin.getPadding().getTop()).toBe(2);
    expect(skin.getMonospacedFamily()).toBe('monospaced');
    expect(skin.getTabSize()).toBe(8);
    expect(skin.getDpi()).toBe(96);
    expect(skin.transformStringForSizeHack('x')).toBe('x');
    expect(skin.getSprite('name')).toBeNull();
    expect(skin.getFromMd5('abc')).toBeNull();
  });

  it('copyAllFrom mutates values() in place', () => {
    const skin = fakeSkinSimple();
    skin.copyAllFrom(new Map([['key2', 'value2']]));
    expect(skin.values().get('key2')).toBe('value2');
  });

  it('sheet(...) 3-arg and 4-arg overloads both return a SheetBuilder', () => {
    const skin = fakeSkinSimple();
    const b3 = skin.sheet(FONT, HorizontalAlignment.LEFT, CreoleMode.FULL);
    const b4 = skin.sheet(FONT, HorizontalAlignment.LEFT, CreoleMode.FULL, FONT);
    expect(typeof b3.createSheet).toBe('function');
    expect(typeof b4.createSheet).toBe('function');
  });
});

// `getPragma()` is REQUIRED, matching `ISkinSimple.java:75`
// (`public Pragma getPragma();` — a Java interface member).
//
// T10b originally added it as optional so that pre-existing test doubles
// kept compiling, and asserted that optionality here. The orchestrator
// made it required once no sibling task was in flight and updated every
// double. These assertions were rewritten rather than deleted: a test
// that pins a divergence keeps the divergence alive, and this mission's
// standing guidance is that a faithful port overrides a short-term patch.
describe('ISkinSimple.getPragma (REQUIRED — mirrors ISkinSimple.java:75)', () => {
  it('returns the Pragma the implementor supplies', () => {
    const pragma = Pragma.createEmpty();
    pragma.define('ratio', '1.5');
    const skin: ISkinSimple = { ...fakeSkinSimple(), getPragma: () => pragma };
    expect(skin.getPragma().getValue(PragmaKey.RATIO)).toBe('1.5');
  });

  it('is callable without a guard on every conforming implementor', () => {
    const skin = fakeSkinSimple();
    expect(typeof skin.getPragma).toBe('function');
    // The point of requiring it: callers reach a real Pragma with no
    // `?.` guard and no undefined branch to handle.
    expect(skin.getPragma().getValue(PragmaKey.RATIO)).toBeNull();
  });
});
