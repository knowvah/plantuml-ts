/**
 * Pragma.test.ts — T10b: unit coverage for `Pragma` (skin/Pragma.java):
 * `define`'s default-value substitution, `isDefine`/`undefine`,
 * `isTrue`/`isFalse`, `getLatexEngine`'s cited process-seam throw, and
 * `WarningHandler` (`addWarning` value-based de-dup, `getWarnings`
 * insertion order).
 */
import { describe, expect, it } from 'vitest';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { PragmaKey } from '../../../../src/core/skin/PragmaKey.js';
import { Warning } from '../../../../src/core/warning/Warning.js';

describe('Pragma.define/getValue/isDefine/undefine (java:60-79)', () => {
  it('define stores a value retrievable via getValue', () => {
    const p = Pragma.createEmpty();
    p.define('ratio', '1.5');
    expect(p.getValue(PragmaKey.RATIO)).toBe('1.5');
    expect(p.isDefine(PragmaKey.RATIO)).toBe(true);
  });

  it('an unrecognized key name is silently ignored (lazyFrom returns null)', () => {
    const p = Pragma.createEmpty();
    p.define('not_a_real_key', 'x');
    expect(p.isDefine(PragmaKey.RATIO)).toBe(false);
  });

  it('a null value substitutes the key default (SVEK_TRACE -> "true")', () => {
    const p = Pragma.createEmpty();
    p.define('svek_trace', null);
    expect(p.getValue(PragmaKey.SVEK_TRACE)).toBe('true');
  });

  it('a null value with no default stays null but IS defined (EnumMap allows a null value)', () => {
    const p = Pragma.createEmpty();
    p.define('ratio', null);
    expect(p.isDefine(PragmaKey.RATIO)).toBe(true);
    expect(p.getValue(PragmaKey.RATIO)).toBeNull();
  });

  it('undefine removes the key', () => {
    const p = Pragma.createEmpty();
    p.define('ratio', '1.5');
    p.undefine(PragmaKey.RATIO);
    expect(p.isDefine(PragmaKey.RATIO)).toBe(false);
    expect(p.getValue(PragmaKey.RATIO)).toBeNull();
  });

  it('getValue for a never-defined key is null', () => {
    const p = Pragma.createEmpty();
    expect(p.getValue(PragmaKey.COMPACT)).toBeNull();
  });
});

describe('Pragma.isTrue/isFalse (java:85-93)', () => {
  it('isTrue matches "true"/"on" case-insensitively', () => {
    const p = Pragma.createEmpty();
    p.define('compact', 'TRUE');
    expect(p.isTrue(PragmaKey.COMPACT)).toBe(true);
    p.define('compact', 'On');
    expect(p.isTrue(PragmaKey.COMPACT)).toBe(true);
    p.define('compact', 'yes');
    expect(p.isTrue(PragmaKey.COMPACT)).toBe(false);
  });

  it('isFalse matches "false"/"off" case-insensitively', () => {
    const p = Pragma.createEmpty();
    p.define('compact', 'FALSE');
    expect(p.isFalse(PragmaKey.COMPACT)).toBe(true);
    p.define('compact', 'Off');
    expect(p.isFalse(PragmaKey.COMPACT)).toBe(true);
  });

  it('isTrue/isFalse are both false for an undefined key', () => {
    const p = Pragma.createEmpty();
    expect(p.isTrue(PragmaKey.COMPACT)).toBe(false);
    expect(p.isFalse(PragmaKey.COMPACT)).toBe(false);
  });
});

describe('Pragma.getLatexEngine (java:81-83) — BLOCKED ON THE PROCESS SEAM', () => {
  it('throws a cited, labelled error rather than a fixed engine value', () => {
    const p = Pragma.createEmpty();
    expect(() => p.getLatexEngine()).toThrow(/BLOCKED ON THE PROCESS SEAM/);
  });
});

describe('Pragma.legacyReplaceBackslashNByNewline (java:95-97)', () => {
  it('always returns true', () => {
    expect(Pragma.legacyReplaceBackslashNByNewline()).toBe(true);
  });
});

describe('Pragma as WarningHandler (java:99-108)', () => {
  it('addWarning/getWarnings preserves insertion order', () => {
    const p = Pragma.createEmpty();
    p.addWarning(new Warning('first'));
    p.addWarning(new Warning('second'));
    expect(p.getWarnings().map((w) => w.asSingleLine())).toEqual(['first', 'second']);
  });

  it('addWarning de-duplicates by value equality (LinkedHashSet semantics)', () => {
    const p = Pragma.createEmpty();
    p.addWarning(new Warning('dup'));
    p.addWarning(new Warning('dup'));
    expect(p.getWarnings()).toHaveLength(1);
  });
});
