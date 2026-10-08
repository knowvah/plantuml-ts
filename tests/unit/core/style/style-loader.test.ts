/**
 * StyleLoader — `style/StyleLoader.java:60-187`.
 *
 * Jar oracle (1.2026.8beta1): `fixtures/plantuml-skin-storage.json` (the
 * storage after `plantuml.skin` alone) and the `authored-skin-rose` /
 * `authored-skin-debug` cases of `fixtures/style-parser-storage.json`
 * (DumpProbe; see `helpers/storage-dump.ts`).
 */
import { describe, expect, it } from 'vitest';
import {
  addPriorityForStereotype,
  DELTA_PRIORITY_FOR_STEREOTYPE,
  getInputStreamForStyle,
  getMissingRootProperties,
  loadSkin,
  NoStyleAvailableException,
} from '../../../../src/core/style/StyleLoader.js';
import { BUILTIN_SKINS } from '../../../../src/core/skins-builtin.js';
import { PLANTUML_SKIN, STRICTUML_SKIN } from '../../../../src/core/style/skins/plantuml-skin.js';
import { Style } from '../../../../src/core/style/Style.js';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import type { PName } from '../../../../src/core/style/PName.js';
import type { Value } from '../../../../src/core/style/Value.js';
import { skinStorageDump } from './helpers/style-fixture.js';
import { dumpStorage, jarStorageCases } from './helpers/storage-dump.js';

/** The jar's storage for a `skin <name>` case with no other declaration. */
function jarStorage(name: string): unknown {
  const found = jarStorageCases().find((c) => c.name === name);
  if (found === undefined) throw new Error(`no case ${name}`);
  return found.storage;
}

describe('StyleLoader.loadSkin', () => {
  it('plantuml.skin: the jar storage, in order, with every priority (126 styles)', () => {
    const storage = dumpStorage(loadSkin('plantuml.skin'));
    expect(storage).toHaveLength(126);
    expect(storage).toEqual(skinStorageDump());
  });

  it('plantuml.skin leaves the counter where the jar does: the first user value is 326', () => {
    // corpus cejije-94-xibi793: `:depth(2) * { FontColor red ... }` stores FontColor at 326
    expect(loadSkin('plantuml.skin').getNextInt()).toBe(326);
  });

  it('debug.skin: the jar storage of `skin debug`', () => {
    expect(dumpStorage(loadSkin('debug.skin'))).toEqual(jarStorage('authored-skin-debug'));
  });

  it('returns a clone: mutating one result never reaches the next (StyleLoader.java:77)', () => {
    const first = loadSkin('plantuml.skin');
    first.getNextInt();
    first.loadInternal(
      StyleSignatureBasic.of('root'),
      new Style(StyleSignatureBasic.of('root'), new Map<PName, Value>([['FontColor', ValueImpl.regular('red', 999)]])),
    );
    const second = loadSkin('plantuml.skin');
    expect(second.getNextInt()).toBe(326);
    expect(dumpStorage(second)).toEqual(skinStorageDump());
  });

  it('an unknown skin is NoStyleAvailableException (StyleLoader.java:95-98)', () => {
    expect(() => loadSkin('nope.skin')).toThrow(NoStyleAvailableException);
  });
});

describe('StyleLoader.getInputStreamForStyle', () => {
  it('resolves `/skin/<filename>` to the embedded jar text', () => {
    expect(getInputStreamForStyle('plantuml.skin')).toBe(PLANTUML_SKIN);
    expect(getInputStreamForStyle('strictuml.skin')).toBe(STRICTUML_SKIN);
    // skins-builtin.ts text, byte-identical to the jar's skin/<name>.skin (unwind2-S8)
    expect(getInputStreamForStyle('debug.skin')).toBe(BUILTIN_SKINS['debug']);
    expect(getInputStreamForStyle('rose.skin')).toBe(BUILTIN_SKINS['rose']);
    expect(getInputStreamForStyle('sonyxperiadev.skin')).toBe(BUILTIN_SKINS['sonyxperiadev']);
    // reddress.skin is no jar resource (removed upstream, commit 11ed6720);
    // the lookup is case-sensitive, as `getResourceAsStream` is in a jar.
    expect(getInputStreamForStyle('reddress.skin')).toBeUndefined();
    expect(getInputStreamForStyle('Rose.skin')).toBeUndefined();
    expect(getInputStreamForStyle('constructor.skin')).toBeUndefined();
    expect(getInputStreamForStyle('rose')).toBeUndefined();
  });
});

describe('StyleLoader.getMissingRootProperties', () => {
  it('plantuml.skin defines every mandatory root property', () => {
    expect(getMissingRootProperties(loadSkin('plantuml.skin'))).toEqual([]);
  });

  it('strictuml.skin is a fragment: all eight are missing (StyleLoader.java:152-153)', () => {
    expect(getMissingRootProperties(loadSkin('strictuml.skin'))).toEqual([
      'FontName',
      'FontSize',
      'FontStyle',
      'FontColor',
      'LineColor',
      'LineThickness',
      'BackGroundColor',
      'HorizontalAlignment',
    ]);
  });

  it('a null builder misses all eight', () => {
    expect(getMissingRootProperties(undefined)).toHaveLength(8);
  });
});

describe('StyleLoader.addPriorityForStereotype', () => {
  it('lifts every value by DELTA_PRIORITY_FOR_STEREOTYPE = 1000 (StyleLoader.java:178-185)', () => {
    expect(DELTA_PRIORITY_FOR_STEREOTYPE).toBe(1000);
    const map = new Map<PName, Value>([
      ['FontColor', ValueImpl.regular('red', 7)],
      ['LineColor', ValueImpl.regular('blue', 9)],
    ]);
    const lifted = addPriorityForStereotype(map);
    expect([...lifted.entries()].map(([k, v]) => [k, v.getPriority()])).toEqual([
      ['FontColor', 1007],
      ['LineColor', 1009],
    ]);
    expect(map.get('FontColor')?.getPriority()).toBe(7);
  });
});
