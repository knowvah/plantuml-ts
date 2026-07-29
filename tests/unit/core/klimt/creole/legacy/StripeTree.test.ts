/**
 * StripeTree.test.ts — T10c/T10g: coverage for `klimt/creole/legacy/
 * StripeTree.java`'s port. `computeLevel` (a pure, standalone-exported
 * function) is covered exhaustively with concrete return-value assertions.
 * T10g lifted the `blockedOnStripeTable` seam once `StripeTable` (T10b)
 * landed — `analyzeAndAdd`'s real per-line tree-cell construction is
 * covered here directly, asserting on concrete measured dimensions rather
 * than "does not throw".
 */
import { describe, expect, it } from 'vitest';
import { StripeTree, computeLevel } from '../../../../../../src/core/klimt/creole/legacy/StripeTree.js';
import type { Atom } from '../../../../../../src/core/klimt/creole/SheetBlock1.js';
import type { AtomOps } from '../../../../../../src/core/klimt/creole/Sea.js';
import type { ISkinSimple } from '../../../../../../src/core/style/ISkinSimple.js';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import type { SheetBuilder } from '../../../../../../src/core/klimt/creole/SheetBuilder.js';
import { Pragma } from '../../../../../../src/core/skin/Pragma.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import { Fore } from '../../../../../../src/core/klimt/Fore.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';

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

/** 1 unit per character for a `'text'` atom, matching `StripeTable.test
 *  .ts`'s established `AtomOps` test-double convention. */
function unitOps(): AtomOps {
  return {
    calculateDimension: (atom): XDimension2D => (atom.kind === 'text' ? new XDimension2D(atom.text.length, 10) : new XDimension2D(0, 10)),
    getStartingAltitude: (): number => 0,
    drawU: (): void => undefined,
  };
}

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

function treeAtom(tree: StripeTree): Atom {
  return tree.getAtoms()[0] as Atom;
}

/** Records the last `Fore` color `apply`d, so a test can assert on the
 *  concrete color `AtomTree#drawU` applies to its skeleton connectors. */
class RecordingUGraphic implements UGraphic {
  lastFore: string | undefined;

  apply(change: UChange): UGraphic {
    if (change instanceof Fore) this.lastFore = change.getColor() as string | undefined;
    return this;
  }

  draw(_shape: UShape): void {
    // not exercised by this test
  }

  getParam(): never {
    throw new Error('not needed');
  }

  getTranslate(): UTranslate {
    return UTranslate.none();
  }

  getStringBounder(): StringBounder {
    return sb;
  }
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

describe('StripeTree construction (java:63-69, T10g: real, no longer seamed)', () => {
  it('getAtoms() returns a single block-wrapped AtomTree atom; getLHeader() is always null', () => {
    const tree = new StripeTree(FONT, fakeSkinParam(), '|_ root', unitOps());
    expect(tree.getAtoms()).toHaveLength(1);
    expect(tree.getLHeader()).toBeNull();
  });

  it('a null-color FontConfiguration falls back to the port-wide NONE_PAINT sentinel (java:66)', () => {
    const noColorFont: FontConfiguration = { family: 'sans-serif', size: 12, color: null, styles: new Set() };
    const tree = new StripeTree(noColorFont, fakeSkinParam(), '|_ root', unitOps());
    const ug = new RecordingUGraphic();
    treeAtom(tree).drawU(ug);
    expect(ug.lastFore).toBe('none');
  });

  it('one cell: height is the single cell\'s measured height plus the 2/2 margin', () => {
    const tree = new StripeTree(FONT, fakeSkinParam(), '|_ root', unitOps());
    // "root" (4 chars) inside a 1-cell AtomTable-via-asAtom wrapper: unit
    // height 10 for the text row, +2+2 from StripeTree's own AtomWithMargin.
    expect(treeAtom(tree).calculateDimension(sb).getHeight()).toBe(10 + 2 + 2);
  });
});

describe('StripeTree.analyzeAndAdd (java:80-90, T10g: real per-line cell construction)', () => {
  it('strips the leading "|_" tree marker from each cell\'s text (java:84)', () => {
    // Both trees have ONE cell of equal indentation; only the marker prefix
    // differs -- if the marker leaked into the cell's own text, the two
    // measured widths would differ by the marker's own length.
    const withMarker = new StripeTree(FONT, fakeSkinParam(), '|_root', unitOps());
    const bareText = new StripeTree(FONT, fakeSkinParam(), 'root', unitOps());
    expect(treeAtom(withMarker).calculateDimension(sb).getWidth()).toBe(treeAtom(bareText).calculateDimension(sb).getWidth());
  });

  it('a "\\n"-split line becomes multiple stacked cells (StripeTable.getWithNewlinesInternal reuse, java:80)', () => {
    const oneCell = new StripeTree(FONT, fakeSkinParam(), '|_root', unitOps());
    const twoCells = new StripeTree(FONT, fakeSkinParam(), '|_root\\nchild', unitOps());
    // Each cell contributes its own unit height (10); two cells sum to 20
    // vs. one cell's 10 -- the margin (2+2) is added once by AtomWithMargin
    // regardless of cell count.
    const oneHeight = treeAtom(oneCell).calculateDimension(sb).getHeight();
    const twoHeight = treeAtom(twoCells).calculateDimension(new FakeStringBounder()).getHeight();
    expect(twoHeight - oneHeight).toBe(10);
  });

  it('analyzeAndAdd (the continuation entry point) adds a further cell to the SAME tree', () => {
    const tree = new StripeTree(FONT, fakeSkinParam(), '|_root', unitOps());
    const oneCellHeight = treeAtom(tree).calculateDimension(sb).getHeight();
    tree.analyzeAndAdd('  |_child');
    class OtherStringBounder implements StringBounder {
      calculateDimension(): XDimension2D {
        return new XDimension2D(0, 0);
      }
    }
    const twoCellHeight = treeAtom(tree).calculateDimension(new OtherStringBounder()).getHeight();
    expect(twoCellHeight - oneCellHeight).toBe(10);
  });
});
