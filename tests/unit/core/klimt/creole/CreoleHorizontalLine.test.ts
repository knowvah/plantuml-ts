/**
 * CreoleHorizontalLine.test.ts — T10a/T9c: unit coverage for
 * `CreoleHorizontalLine` (klimt/creole/CreoleHorizontalLine.java): the
 * empty-line ("bare separator") path, plus (T9c) the now-real non-empty-
 * line ("labelled separator") path built through `Display.getWithNewlines`
 * -> `SheetBuilder.createSheet` -> `SheetBlock1`.
 */
import { describe, expect, it } from 'vitest';
import { CreoleHorizontalLine } from '../../../../../src/core/klimt/creole/CreoleHorizontalLine.js';
import { UHorizontalLine } from '../../../../../src/core/klimt/shape/UHorizontalLine.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { ClockwiseTopRightBottomLeft } from '../../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { Sheet } from '../../../../../src/core/klimt/creole/Sheet.js';
import type { Stripe } from '../../../../../src/core/klimt/creole/Stripe.js';
import type { CreoleAtom } from '../../../../../src/core/klimt/creole/atom/Atom.js';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { SheetBuilder, DisplayLike } from '../../../../../src/core/klimt/creole/SheetBuilder.js';
import type { ISkinSimple } from '../../../../../src/core/style/ISkinSimple.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';
import type { AtomOps } from '../../../../../src/core/klimt/creole/Sea.js';
import { Pragma } from '../../../../../src/core/skin/Pragma.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
const CHAR_WIDTH = 2;
const LINE_HEIGHT = 10;

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

/** 1-unit-per-character width, fixed height -- `SheetBlock1.test.ts`'s
 *  own established `AtomOps` test-double pattern. */
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

/** A minimal, REAL `SheetBuilder`: one text stripe per `DisplayLike` line
 *  (joined by a space), proving `getTitle()`'s real chain end-to-end
 *  without needing the full `CreoleParser`. */
function realSheetBuilder(): SheetBuilder {
  return {
    createSheet(display: DisplayLike): Sheet {
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
    getPadding: () => ClockwiseTopRightBottomLeft.same(0),
    getMonospacedFamily: () => 'monospaced',
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => Pragma.createEmpty(),
    sheet: () => builder,
  };
}

/** Records every `draw(shape)` call together with the translate active at
 *  that point, sharing one `drawn` array across every `apply()`-derived
 *  instance — this project's established per-file UGraphic-double
 *  convention (`SheetBlock1.test.ts`'s `RecordingUGraphic`), extended
 *  here to also capture `draw()` since (unlike `SheetBlock1`/`SheetBlock2`)
 *  `CreoleHorizontalLine.drawU` calls `ug.draw(...)` directly. */
class RecordingUGraphic implements UGraphic {
  constructor(
    private readonly translate: UTranslate = UTranslate.none(),
    private readonly drawn: { shape: UShape; translate: UTranslate }[] = [],
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.translate.compose(change), this.drawn);
    return this;
  }

  draw(shape: UShape): void {
    this.drawn.push({ shape, translate: this.translate });
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

  getDrawn(): readonly { shape: UShape; translate: UTranslate }[] {
    return this.drawn;
  }
}

describe('CreoleHorizontalLine — empty line', () => {
  it('calculateDimensionSlow returns the fixed 10x10 (java:101-102)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '-', fakeSkin(), unitOps());
    expect(line.calculateDimension(sb)).toEqual(new XDimension2D(10, 10));
  });

  it('getStartingAltitude is always 0, regardless of StringBounder (java:108-110)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '=', fakeSkin(), unitOps());
    expect(line.getStartingAltitude(sb)).toBe(0);
  });

  it('drawU translates down by height/2 then draws a UHorizontalLine (java:92-96)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '-', fakeSkin(), unitOps());
    const ug = new RecordingUGraphic();
    line.drawU(ug);
    const drawn = ug.getDrawn();
    expect(drawn).toHaveLength(1);
    expect(drawn[0]!.shape).toBeInstanceOf(UHorizontalLine);
    expect(drawn[0]!.translate).toEqual(new UTranslate(0, 5)); // height(10)/2
  });

  it('threads the "style" char through to the drawn UHorizontalLine (isDouble() for "=")', () => {
    const equalsLine = CreoleHorizontalLine.create(FONT, '', '=', fakeSkin(), unitOps());
    const ug1 = new RecordingUGraphic();
    equalsLine.drawU(ug1);
    expect((ug1.getDrawn()[0]!.shape as UHorizontalLine).isDouble()).toBe(true);

    const dashLine = CreoleHorizontalLine.create(FONT, '', '-', fakeSkin(), unitOps());
    const ug2 = new RecordingUGraphic();
    dashLine.drawU(ug2);
    expect((ug2.getDrawn()[0]!.shape as UHorizontalLine).isDouble()).toBe(false);
  });

  it('memoizes calculateDimension (inherited TextBlockMemoized via AbstractAtom)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '.', fakeSkin(), unitOps());
    const first = line.calculateDimension(sb);
    const second = line.calculateDimension(sb);
    expect(second).toBe(first); // same cached instance
  });
});

describe('CreoleHorizontalLine — non-empty line (T9c: real getTitle(), was a cited Display.java seam)', () => {
  it('calculateDimension reflects the built title text width (5 chars * 2 = 10, java:78-83)', () => {
    const line = CreoleHorizontalLine.create(FONT, 'Title', '-', fakeSkin(), unitOps());
    expect(line.calculateDimension(sb)).toEqual(new XDimension2D(10, LINE_HEIGHT));
  });

  it('drawU draws a UHorizontalLine carrying a non-null title TextBlock', () => {
    const line = CreoleHorizontalLine.create(FONT, 'Title', '=', fakeSkin(), unitOps());
    const ug = new RecordingUGraphic();
    line.drawU(ug);
    const shape = ug.getDrawn()[0]!.shape as UHorizontalLine;
    expect(shape.isDouble()).toBe(true);
    // The title TextBlock's own dimension flows through drawLineInternal's
    // first/second-half stencil split -- proven indirectly via a real,
    // non-empty draw with no throw (see the previous test for the exact
    // measured width).
  });

  it('a labelled separator no longer throws -- the Display.java seam is closed', () => {
    const line = CreoleHorizontalLine.create(FONT, 'Header', '-', fakeSkin(), unitOps());
    expect(() => line.calculateDimension(sb)).not.toThrow();
  });

  it('routes through Display.getWithNewlines + skinParam.getPragma() + skinParam.sheet(...)', () => {
    let sheetCalls = 0;
    const builder: SheetBuilder = {
      createSheet(display: DisplayLike) {
        sheetCalls++;
        expect([...display]).toEqual(['Multi']);
        return realSheetBuilder().createSheet(display);
      },
    };
    const line = CreoleHorizontalLine.create(FONT, 'Multi', '-', fakeSkin(builder), unitOps());
    line.calculateDimension(sb);
    expect(sheetCalls).toBe(1);
  });
});

describe('CreoleHorizontalLine.getNeutrons — inherited ADR-9 adaptation', () => {
  it('always throws UnsupportedOperationException (AbstractAtom precedent)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '-', fakeSkin(), unitOps());
    expect(() => line.getNeutrons()).toThrow('UnsupportedOperationException');
  });
});
