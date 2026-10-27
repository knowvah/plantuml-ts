import { describe, expect, it } from 'vitest';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import { DayOfWeek } from '../../../../../src/core/time/DayOfWeek.js';
import { newLocale } from '../../../../../src/core/utils/I18nTimeData.js';
import { TimeHeaderCalendar } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderCalendar.js';
import { TimePoint } from '../../../../../src/diagrams/gantt/time/TimePoint.js';
import {
  BASELINE_MONTH,
  MIN_DAY,
  dailyScale,
  headerData,
  placedOf,
  recorded,
  textOf,
} from './helpers/header-fixture.js';

/** A calendar header with an inert body, so the base-class behaviour is observed alone. */
class Calendar extends TimeHeaderCalendar {
  drawn: [UGraphic, number][] = [];
  getTimeHeaderHeight(): number {
    return 20;
  }
  getTimeFooterHeight(): number {
    return 0;
  }
  getFullHeaderHeight(): number {
    return 20;
  }
  drawTimeFooter(): void {}
  drawTimeHeaderInternal(ug: UGraphic, total: number): void {
    this.drawn.push([ug, total]);
  }
  named(ug: UGraphic): void {
    this.printNamedDays(ug);
  }
  zero(day: TimePoint): boolean {
    return this.isZeroOnDay(day);
  }
  loc() {
    return this.locale();
  }
}

function make() {
  const d = headerData();
  return {
    d,
    h: new Calendar(d.weekConfig, d.dayCalendar, d.timeBounds, d.scaleConfig, d.timelineStyle, dailyScale(d)),
  };
}

describe('TimeHeaderCalendar (TimeHeaderCalendar.java:55-99)', () => {
  it('locale() is the week configuration locale (java:62-65)', () => {
    const { d, h } = make();
    expect(h.loc().language).toBe('en');
    const fr = newLocale('fr');
    d.weekConfig.setLocale(fr);
    expect(h.loc()).toBe(fr);
  });

  it('isZeroOnDay is "the open/close plan is zero on that day" (java:67-70)', () => {
    const { d, h } = make();
    const monday = TimePoint.ofStartOfDay(MIN_DAY);
    const sunday = TimePoint.ofStartOfDay(MIN_DAY.plusDays(6));
    expect(h.zero(sunday)).toBe(false);
    d.dayCalendar.getOpenClose().close(DayOfWeek.SUNDAY);
    expect(h.zero(sunday)).toBe(true);
    expect(h.zero(monday)).toBe(false);
  });

  it('drawTimeHeader paints the colour background first, then the internal header (java:72-76)', () => {
    const { d, h } = make();
    d.dayCalendar.getOpenClose().close(DayOfWeek.SUNDAY);
    const log = recorded((ug) => h.drawTimeHeader(ug, 100));
    expect(h.drawn.map(([, total]) => total)).toEqual([100]);
    // 3 closed Sundays, painted by drawColorsBackground (height 100 - 20)
    expect(placedOf(log, 'URectangle(16,80)').map((p) => p.x)).toEqual([96, 208, 320]);
  });

  it('printNamedDays prints nothing without named days (java:80-82)', () => {
    const { h } = make();
    expect(
      placedOf(
        recorded((ug) => h.named(ug)),
        'UText',
      ),
    ).toEqual([]);
  });

  it('printNamedDays prints a name where it starts, not on consecutive repeats, at the header height (java:80-98)', () => {
    const { d, h } = make();
    const at = (i: number) => TimePoint.ofStartOfDay(MIN_DAY.plusDays(i));
    d.dayCalendar.putNameDay(at(1), 'A');
    d.dayCalendar.putNameDay(at(2), 'A');
    d.dayCalendar.putNameDay(at(4), 'A');
    d.dayCalendar.putNameDay(at(5), 'B');
    const texts = placedOf(
      recorded((ug) => h.named(ug)),
      'UText',
    );
    expect(texts.map((p) => [textOf(p), p.x, p.y])).toEqual([
      ['A', 16, 20 + BASELINE_MONTH],
      ['A', 64, 20 + BASELINE_MONTH],
      ['B', 80, 20 + BASELINE_MONTH],
    ]);
  });
});
