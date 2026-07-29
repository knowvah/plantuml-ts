/**
 * CreoleHorizontalLine.test.ts — T10a: unit coverage for
 * `CreoleHorizontalLine` (klimt/creole/CreoleHorizontalLine.java): the
 * fully-reachable empty-line ("bare separator") path — dimension,
 * altitude, and the drawn `UHorizontalLine` shape/translate/style — plus
 * the non-empty-line branch's cited `Display.java` seam (ADR-8
 * corollary).
 */
import { describe, expect, it } from 'vitest';
import { CreoleHorizontalLine } from '../../../../../src/core/klimt/creole/CreoleHorizontalLine.js';
import { UHorizontalLine } from '../../../../../src/core/klimt/shape/UHorizontalLine.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { ClockwiseTopRightBottomLeft } from '../../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { ISkinSimple } from '../../../../../src/core/style/ISkinSimple.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}

const sb: StringBounder = new FakeStringBounder();

function fakeSkin(): ISkinSimple {
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
    sheet: () => {
      throw new Error('not exercised in this test — getTitle() throws before reaching skinParam.sheet()');
    },
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

describe('CreoleHorizontalLine — empty line (the only shape reachable today)', () => {
  it('calculateDimensionSlow returns the fixed 10x10 (java:101-102)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '-', fakeSkin());
    expect(line.calculateDimension(sb)).toEqual(new XDimension2D(10, 10));
  });

  it('getStartingAltitude is always 0, regardless of StringBounder (java:108-110)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '=', fakeSkin());
    expect(line.getStartingAltitude(sb)).toBe(0);
  });

  it('drawU translates down by height/2 then draws a UHorizontalLine (java:92-96)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '-', fakeSkin());
    const ug = new RecordingUGraphic();
    line.drawU(ug);
    const drawn = ug.getDrawn();
    expect(drawn).toHaveLength(1);
    expect(drawn[0]!.shape).toBeInstanceOf(UHorizontalLine);
    expect(drawn[0]!.translate).toEqual(new UTranslate(0, 5)); // height(10)/2
  });

  it('threads the "style" char through to the drawn UHorizontalLine (isDouble() for "=")', () => {
    const equalsLine = CreoleHorizontalLine.create(FONT, '', '=', fakeSkin());
    const ug1 = new RecordingUGraphic();
    equalsLine.drawU(ug1);
    expect((ug1.getDrawn()[0]!.shape as UHorizontalLine).isDouble()).toBe(true);

    const dashLine = CreoleHorizontalLine.create(FONT, '', '-', fakeSkin());
    const ug2 = new RecordingUGraphic();
    dashLine.drawU(ug2);
    expect((ug2.getDrawn()[0]!.shape as UHorizontalLine).isDouble()).toBe(false);
  });

  it('memoizes calculateDimension (inherited TextBlockMemoized via AbstractAtom)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '.', fakeSkin());
    const first = line.calculateDimension(sb);
    const second = line.calculateDimension(sb);
    expect(second).toBe(first); // same cached instance
  });
});

describe('CreoleHorizontalLine — non-empty line (cited Display.java seam, ADR-8 corollary)', () => {
  it('calculateDimension throws, citing Display.java, when the line has a captured label', () => {
    const line = CreoleHorizontalLine.create(FONT, 'Header', '-', fakeSkin());
    expect(() => line.calculateDimension(sb)).toThrow(/Display\.java/);
  });

  it('drawU also throws (getHorizontalLine\'s title branch reaches the same getTitle() seam)', () => {
    const line = CreoleHorizontalLine.create(FONT, 'Header', '=', fakeSkin());
    expect(() => line.drawU(new RecordingUGraphic())).toThrow(/Display\.java/);
  });

  it('the thrown error names SheetBuilder.ts\'s own documented T9c seam, not a silent drop', () => {
    const line = CreoleHorizontalLine.create(FONT, 'Header', '-', fakeSkin());
    expect(() => line.calculateDimension(sb)).toThrow(/getWithNewlines/);
  });
});

describe('CreoleHorizontalLine.getNeutrons — inherited ADR-9 adaptation', () => {
  it('always throws UnsupportedOperationException (AbstractAtom precedent)', () => {
    const line = CreoleHorizontalLine.create(FONT, '', '-', fakeSkin());
    expect(() => line.getNeutrons()).toThrow('UnsupportedOperationException');
  });
});
