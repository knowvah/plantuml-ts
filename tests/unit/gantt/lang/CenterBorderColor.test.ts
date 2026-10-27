import { describe, expect, it } from 'vitest';
import { Back } from '../../../../src/core/klimt/Back.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import type { UChange } from '../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { HColors } from '../../../../src/core/klimt/color/HColors.js';
import { CenterBorderColor } from '../../../../src/diagrams/gantt/lang/CenterBorderColor.js';

function recorder(log: UChange[]): UGraphic {
  const ug = { apply: (c: UChange) => (log.push(c), ug) } as unknown as UGraphic;
  return ug;
}

describe('CenterBorderColor', () => {
  it('applies bg(center) then the border (CenterBorderColor.java:58-69)', () => {
    const log: UChange[] = [];
    const c = new CenterBorderColor(HColors.WHITE, HColors.BLACK, 'sty');
    c.apply(recorder(log));
    expect(log).toHaveLength(2);
    expect(log[0]).toBeInstanceOf(Back);
    expect((log[0] as Back).getBackColor()).toBe(HColors.WHITE);
    expect(log[1]).toBeInstanceOf(Fore);
    expect((log[1] as Fore).getColor()).toBe(HColors.BLACK);
    expect(c.getStyle()).toBe('sty');
  });

  it('falls back to the center as line colour when border is null (:62-64)', () => {
    const log: UChange[] = [];
    new CenterBorderColor(HColors.WHITE, undefined).apply(recorder(log));
    expect((log[1] as Fore).getColor()).toBe(HColors.WHITE);
  });

  it('isOk is center != null and apply throws otherwise (:58-60,71-73)', () => {
    const c = new CenterBorderColor(undefined, HColors.BLACK);
    expect(c.isOk()).toBe(false);
    expect(c.getStyle()).toBeUndefined();
    expect(c.getCenter()).toBeUndefined();
    expect(() => c.apply(recorder([]))).toThrow('IllegalStateException');
    expect(new CenterBorderColor(HColors.BLACK, undefined).isOk()).toBe(true);
    expect(new CenterBorderColor(HColors.BLACK, undefined).getCenter()).toBe(HColors.BLACK);
  });

  it('unlinearTo shades center and border, keeps style (:83-88; JDK values: HColorSimple.unlinear.test.ts)', () => {
    const from = new CenterBorderColor(
      HColorSimple.create({ r: 255, g: 0, b: 0, a: 255 }),
      HColorSimple.create({ r: 255, g: 255, b: 255, a: 255 }),
      'sty',
    );
    const to = new CenterBorderColor(
      HColorSimple.create({ r: 0, g: 0, b: 255, a: 255 }),
      HColorSimple.create({ r: 0, g: 0, b: 0, a: 255 }),
    );
    const mid = from.unlinearTo(to, 50);
    expect((mid.getCenter() as HColorSimple).asString()).toBe('#FF8000');
    expect(mid.getStyle()).toBe('sty');
    // border shaded too: white -> black at 50 is #DFDFDF (JDK 223)
    const log: UChange[] = [];
    mid.apply(recorder(log));
    expect((log[1] as Fore).getColor()).toSatisfy((c: HColorSimple) => c.asString() === '#DFDFDF');
    expect(from.unlinearTo(to, 0).getCenter()).toBe(from.getCenter());
    expect(from.unlinearTo(to, 100).getCenter()).toBe(to.getCenter());
    const noBorder = new CenterBorderColor(HColors.WHITE, undefined).unlinearTo(
      new CenterBorderColor(HColors.BLACK, undefined),
      50,
    );
    expect(noBorder.isOk()).toBe(true);
  });
});
