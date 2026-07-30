/**
 * StripeTable.test.ts — T10b: unit coverage for `StripeTable`
 * (klimt/creole/legacy/StripeTable.java): the `|cell|cell|`/`|=Header|`
 * grammar (`<#color>` line/cell backcolor, `=` header-bold, `\|`
 * escaping, `<r>` right-alignment, `\n`-split multi-line cells,
 * `analyzeAndAddLine` continuation), plus `getWithNewlinesInternal`'s
 * two branches directly.
 */
import { describe, expect, it } from 'vitest';
import { StripeTable } from '../../../../../../src/core/klimt/creole/legacy/StripeTable.js';
import { BackSlash } from '../../../../../../src/core/text/BackSlash.js';
import type { AtomOps } from '../../../../../../src/core/klimt/creole/Sea.js';
import type { Atom } from '../../../../../../src/core/klimt/creole/SheetBlock1.js';
import { FontStyle, type FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { ClockwiseTopRightBottomLeft } from '../../../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import { URectangle } from '../../../../../../src/core/klimt/shape/URectangle.js';
import { Fore } from '../../../../../../src/core/klimt/Fore.js';
import { Back } from '../../../../../../src/core/klimt/Back.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import type { ISkinSimple } from '../../../../../../src/core/style/ISkinSimple.js';
import { GUILLEMET_DEFAULT } from '../../../../../../src/core/text/Guillemet.js';
import type { Sheet } from '../../../../../../src/core/klimt/creole/Sheet.js';
import type { StripeAtom } from '../../../../../../src/core/klimt/creole/Stripe.js';
import type { SheetBuilder } from '../../../../../../src/core/klimt/creole/SheetBuilder.js';
import { Pragma } from '../../../../../../src/core/skin/Pragma.js';

const CHAR_WIDTH = 2;
const BOLD_EXTRA = 5;

/** 1 unit per character, +BOLD_EXTRA when the atom's font carries BOLD --
 *  see `SheetBlock1.test.ts`'s established `AtomOps` test-double pattern. */
function unitOps(recordTranslate?: UTranslate[]): AtomOps {
  return {
    calculateDimension: (atom): XDimension2D => {
      if (atom.kind !== 'text') return new XDimension2D(0, 10);
      const bold = atom.font.styles.has(FontStyle.BOLD) ? BOLD_EXTRA : 0;
      return new XDimension2D(atom.text.length * CHAR_WIDTH + bold, 10);
    },
    getStartingAltitude: (): number => 0,
    drawU: (_atom, ug): void => {
      recordTranslate?.push(ug.getTranslate());
    },
  };
}

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

function fakeSkinSimple(padding: ClockwiseTopRightBottomLeft = ClockwiseTopRightBottomLeft.none()): ISkinSimple {
  const values = new Map<string, string>();
  return {
    getSprite: () => null,
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s) => s,
    getValue: (key) => values.get(key) ?? null,
    values: () => values,
    getPadding: () => padding,
    getMonospacedFamily: () => 'monospaced',
    getTabSize: () => 8,
    getDpi: () => 96,
    getPragma: () => Pragma.createEmpty(),
    copyAllFrom: (other) => {
      for (const [k, v] of other) values.set(k, v);
    },
    sheet: (): SheetBuilder => ({
      createSheet: (): Sheet<StripeAtom> => {
        throw new Error('not needed for this test');
      },
    }),
  };
}

const FONT: FontConfiguration = { family: 'sans-serif', size: 12, color: '#000000', styles: new Set() };

interface DrawCall {
  readonly shape: UShape;
  readonly translate: UTranslate;
  readonly fg: string | undefined;
  readonly bg: string | undefined;
}

class RecordingUGraphic implements UGraphic {
  constructor(
    readonly draws: DrawCall[] = [],
    private readonly translate: UTranslate = UTranslate.none(),
    private readonly fg?: string,
    private readonly bg?: string,
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.draws, this.translate.compose(change), this.fg, this.bg);
    if (change instanceof Fore) return new RecordingUGraphic(this.draws, this.translate, change.getColor() as string, this.bg);
    if (change instanceof Back) return new RecordingUGraphic(this.draws, this.translate, this.fg, change.getBackColor() as string);
    return this;
  }

  draw(shape: UShape): void {
    this.draws.push({ shape, translate: this.translate, fg: this.fg, bg: this.bg });
  }

  getParam(): never {
    throw new Error('not needed');
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return sb;
  }
}

describe('StripeTable construction (java:76-86)', () => {
  it('getAtoms() returns a single AtomWithMargin-wrapped AtomTable; getLHeader() is always null', () => {
    const table = new StripeTable(FONT, fakeSkinSimple(), '|A|', unitOps());
    expect(table.getAtoms()).toHaveLength(1);
    expect(table.getLHeader()).toBeNull();
  });

  it('single 1x1 cell: measured width comes straight from the cell text, height widened by the 2/2 margin (java:84)', () => {
    const table = new StripeTable(FONT, fakeSkinSimple(), '|AB|', unitOps()); // "AB" -> width 4, height 10
    const atom = table.getAtoms()[0] as Atom;
    expect(atom.calculateDimension(sb)).toEqual(new XDimension2D(4, 10 + 2 + 2));
  });

  it('two columns: table width is the sum of each column (java: AtomTable#getEndingX)', () => {
    const table = new StripeTable(FONT, fakeSkinSimple(), '|AB|CCCC|', unitOps()); // widths 4, 8
    const atom = table.getAtoms()[0] as Atom;
    expect(atom.calculateDimension(sb).getWidth()).toBe(4 + 8);
  });
});

describe('StripeTable header cells are bolded (java:141-144,208-213)', () => {
  it('a "=" -prefixed cell measures BOLD_EXTRA wider than the identical non-header text', () => {
    const normal = new StripeTable(FONT, fakeSkinSimple(), '|AB|', unitOps());
    const header = new StripeTable(FONT, fakeSkinSimple(), '|=AB|', unitOps());
    const normalWidth = (normal.getAtoms()[0] as Atom).calculateDimension(sb).getWidth();
    const headerWidth = (header.getAtoms()[0] as Atom).calculateDimension(sb).getWidth();
    expect(headerWidth - normalWidth).toBe(BOLD_EXTRA);
  });
});

describe('StripeTable "\\|" escaping (java:132,140)', () => {
  it('an escaped pipe stays inside one cell instead of splitting into two columns', () => {
    const escaped = new StripeTable(FONT, fakeSkinSimple(), '|A\\|B|', unitOps()); // one cell, text "A|B" (3 chars)
    const unescaped = new StripeTable(FONT, fakeSkinSimple(), '|A|B|', unitOps()); // two cells, "A" + "B"
    const escapedWidth = (escaped.getAtoms()[0] as Atom).calculateDimension(sb).getWidth();
    const unescapedWidth = (unescaped.getAtoms()[0] as Atom).calculateDimension(sb).getWidth();
    expect(escapedWidth).toBe(3 * CHAR_WIDTH); // "A|B"
    expect(unescapedWidth).toBe(1 * CHAR_WIDTH + 1 * CHAR_WIDTH); // "A" column + "B" column
  });
});

describe('StripeTable line/cell backcolor (java:79-83,104-118,131-137)', () => {
  it('a line-level "<#color>" prefix fills the whole row background', () => {
    // `getBackOrFrontColor`'s substring is INCLUSIVE of the "#"
    // (`line.indexOf('#')` through `line.indexOf('>')`, java:106-111) --
    // this port's `Paint` stores the color verbatim ("#red", not "red"),
    // resolved late at SVG-emission time (`HColorSet.ts`'s own "stored
    // verbatim, interpreted late" design, `paint.ts`'s module doc comment).
    const table = new StripeTable(FONT, fakeSkinSimple(), '<#red>|AB|', unitOps());
    const ug = new RecordingUGraphic();
    (table.getAtoms()[0] as Atom).drawU(ug);
    const rect = ug.draws.find((d) => d.shape instanceof URectangle);
    expect(rect?.bg).toBe('#red');
  });

  it('a per-cell "<#color>" prefix fills only that cell (line has no line-level color)', () => {
    const table = new StripeTable(FONT, fakeSkinSimple(), '|<#blue>AB|CD|', unitOps());
    const ug = new RecordingUGraphic();
    (table.getAtoms()[0] as Atom).drawU(ug);
    const rects = ug.draws.filter((d) => d.shape instanceof URectangle);
    expect(rects).toHaveLength(1);
    expect(rects[0]?.bg).toBe('#blue');
  });

  it('with no color prefix, the table grid uses the font color as its line color', () => {
    const font: FontConfiguration = { ...FONT, color: '#ABCDEF' };
    const table = new StripeTable(font, fakeSkinSimple(), '|AB|', unitOps());
    const ug = new RecordingUGraphic();
    (table.getAtoms()[0] as Atom).drawU(ug);
    const grid = ug.draws.find((d) => !(d.shape instanceof URectangle));
    expect(grid?.fg).toBe('#ABCDEF');
  });
});

describe('StripeTable <r> alignment (java:154-157)', () => {
  it('a <r>-prefixed single-sub-line cell shifts right when a sibling row widens its column', () => {
    const translates: UTranslate[] = [];
    const table = new StripeTable(FONT, fakeSkinSimple(), '|<r>AB|CCCCCC|', unitOps(translates));
    // Widen column 0 via a continuation row with a much wider col0 cell.
    table.analyzeAndAddLine('|WWWWWWWWWWWW|D|');

    (table.getAtoms()[0] as Atom).drawU(new RecordingUGraphic());

    // col0 width = max("AB"=4, "WWWWWWWWWWWW"=24) = 24. The right-aligned
    // "AB" cell's own width is 4, so it shifts right by 24-4=20.
    expect(translates).toContainEqual(new UTranslate(20, 2)); // dy=2: AtomWithMargin's marginY1
  });
});

describe('StripeTable.analyzeAndAddLine continuation (java:215-217)', () => {
  it('appends a new row, doubling the table height for two identical rows', () => {
    const table = new StripeTable(FONT, fakeSkinSimple(), '|AB|', unitOps());
    const oneRowHeight = (table.getAtoms()[0] as Atom).calculateDimension(sb).getHeight();
    table.analyzeAndAddLine('|CD|');
    // calculateDimension is memoized (TextBlockMemoized) on the SAME
    // StringBounder constructor -- use a fresh double to force recompute.
    class OtherStringBounder implements StringBounder {
      calculateDimension(): XDimension2D {
        return new XDimension2D(0, 0);
      }
    }
    const twoRowHeight = (table.getAtoms()[0] as Atom).calculateDimension(new OtherStringBounder()).getHeight();
    // Each row is 10 tall (unitOps); margin (2+2) is added ONCE by
    // AtomWithMargin regardless of row count.
    expect(twoRowHeight - oneRowHeight).toBe(10);
  });
});

describe('StripeTable.getWithNewlinesInternal (java:165-206)', () => {
  it('a string with no newline marker returns as a single unchanged element', () => {
    expect(StripeTable.getWithNewlinesInternal('hello')).toEqual(['hello']);
  });

  it('splits on a literal "\\n" escape sequence', () => {
    expect(StripeTable.getWithNewlinesInternal('a\\nb')).toEqual(['a', 'b']);
  });

  it('un-escapes a literal "\\\\" (backslash) without splitting', () => {
    expect(StripeTable.getWithNewlinesInternal('a\\\\b')).toEqual(['a\\b']);
  });

  it('a trailing empty segment is preserved (java always pushes the final `current`)', () => {
    expect(StripeTable.getWithNewlinesInternal('a\\n')).toEqual(['a', '']);
  });

  it('also splits on a raw hidden-newline sentinel character (java:184-186)', () => {
    const sentinel = BackSlash.hiddenNewLine();
    expect(StripeTable.getWithNewlinesInternal(`a${sentinel}b`)).toEqual(['a', 'b']);
  });

  it('a backslash followed by neither "n" nor "\\\\" is kept verbatim, unsplit (java:180-183)', () => {
    expect(StripeTable.getWithNewlinesInternal('a\\tb')).toEqual(['a\\tb']);
  });
});
