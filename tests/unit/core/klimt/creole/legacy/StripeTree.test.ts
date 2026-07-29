/**
 * StripeTree.test.ts — T10c: coverage for `klimt/creole/legacy/StripeTree
 * .java`'s port. `computeLevel` (a pure, standalone-exported function) is
 * covered exhaustively with concrete return-value assertions. The class
 * itself cannot be constructed today — `analyzeAndAdd`'s first statement
 * needs the concurrent sibling `StripeTable`'s static helpers (T10b, not
 * yet landed at the time this file was written) — so the constructor-throw
 * itself is pinned instead (`getAtoms`/`getLHeader` are unreachable by
 * construction, matching `CreoleHorizontalLine.ts#getHorizontalLine()`'s
 * established, documented-in-line precedent, T10a).
 */
import { describe, expect, it } from 'vitest';
import { StripeTree, computeLevel } from '../../../../../../src/core/klimt/creole/legacy/StripeTree.js';
import type { ISkinSimple } from '../../../../../../src/core/style/ISkinSimple.js';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import type { SheetBuilder } from '../../../../../../src/core/klimt/creole/SheetBuilder.js';
import { Pragma } from '../../../../../../src/core/skin/Pragma.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 12, color: '#000000', styles: new Set() };

function notNeeded(): never {
  throw new Error('not needed');
}

function fakeSkinParam(): ISkinSimple {
  return {
    getSprite: () => null,
    guillemet: notNeeded,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map(),
    getPadding: notNeeded,
    getMonospacedFamily: notNeeded,
    getTabSize: notNeeded,
    getDpi: notNeeded,
    copyAllFrom: () => undefined,
    getPragma: () => Pragma.createEmpty(),
    sheet: (...args: unknown[]): SheetBuilder => notNeeded(...(args as [])),
  };
}

describe('StripeTree.computeLevel (java:93-109, @JawsStrange)', () => {
  it('no leading indent: level 1', () => {
    expect(computeLevel('|_ leaf')).toBe(1);
  });

  it('one leading 2-space group: level 2', () => {
    expect(computeLevel('  |_ leaf')).toBe(2);
  });

  it('two leading 2-space groups: level 3', () => {
    expect(computeLevel('    |_ leaf')).toBe(3);
  });

  it('one leading tab: level 2', () => {
    expect(computeLevel('\t|_ leaf')).toBe(2);
  });

  it('mixed tab then 2-space group: both count (level 3)', () => {
    expect(computeLevel('\t  |_ leaf')).toBe(3);
  });

  it('mixed 2-space group then tab: both count (level 3)', () => {
    expect(computeLevel('  \t|_ leaf')).toBe(3);
  });

  it('a single leading space (not a full 2-space group) does not advance the level', () => {
    expect(computeLevel(' |_ leaf')).toBe(1);
  });

  it('empty string: level 1 (the loop never advances, returns the base level)', () => {
    expect(computeLevel('')).toBe(1);
  });
});

describe('StripeTree constructor (java:63-69)', () => {
  it('throws a cited, labelled error naming the blocked StripeTable dependency', () => {
    expect(() => new StripeTree(FONT, fakeSkinParam(), '|_ leaf')).toThrow(/StripeTable\.java/);
  });

  it('the thrown error names the concrete blocked method ("analyzeAndAdd")', () => {
    expect(() => new StripeTree(FONT, fakeSkinParam(), '|_ leaf')).toThrow(/analyzeAndAdd/);
  });

  it('throws regardless of the line content passed (StripeTable.getWithNewlinesInternal ' +
    'is the FIRST statement, blocking every line shape identically)', () => {
    expect(() => new StripeTree(FONT, fakeSkinParam(), '')).toThrow(Error);
    expect(() => new StripeTree(FONT, fakeSkinParam(), '|_ a\n  |_ b')).toThrow(Error);
  });
});
