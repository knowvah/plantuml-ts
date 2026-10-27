import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../../../src/core/klimt/color/HColorSet.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import { UFont } from '../../../../../src/core/klimt/font/UFont.js';
import { ULine } from '../../../../../src/core/klimt/shape/ULine.js';
import type { ISkinParam } from '../../../../../src/core/abel/ISkinParam.js';
import { Pragma } from '../../../../../src/core/skin/Pragma.js';
import { LocalDate } from '../../../../../src/core/time/LocalDate.js';
import { PrintScale } from '../../../../../src/diagrams/gantt/core/PrintScale.js';
import { TaskCode } from '../../../../../src/diagrams/gantt/core/TaskCode.js';
import { Load } from '../../../../../src/diagrams/gantt/ngm/Load.js';
import { drawSvg, elementsOf, newGantt, oracleSvg } from '../../helpers/gantt-diagram-fixture.js';
import { DayOfWeek } from '../../../../../src/core/time/DayOfWeek.js';
import { newLocale, type Locale } from '../../../../../src/core/utils/I18nTimeData.js';
import { HColorAutomagic } from '../../../../../src/core/klimt/color/HColorAutomagic.js';
import type { FontConfiguration } from '../../../../../src/core/abel/FontConfiguration.js';
import {
  TimeHeader,
  applyForeColor,
  emojiStoreOf,
  hColorEquals,
  paintOf,
} from '../../../../../src/diagrams/gantt/draw/header/TimeHeader.js';
import { TimePoint } from '../../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimePointFormat } from '../../../../../src/diagrams/gantt/time/TimePointFormat.js';
import { dailyScale, headerData, lineDraws, MIN_DAY, MAX_DAY, recorded, textDraws } from './helpers/header-fixture.js';

/** `[name, scale, Project starts, "[Task A] lasts N days"]` of tests/fixtures/gantt/printscale-<name>-zoom.puml. */
const PRINTSCALE_ORACLES: readonly (readonly [string, PrintScale, LocalDate, number])[] = [
  ['daily', PrintScale.DAILY, LocalDate.of(2020, 7, 1), 10],
  ['weekly', PrintScale.WEEKLY, LocalDate.of(2020, 7, 1), 20],
  ['monthly', PrintScale.MONTHLY, LocalDate.of(2020, 1, 1), 100],
  ['quarterly', PrintScale.QUARTERLY, LocalDate.of(2020, 1, 1), 200],
  ['yearly', PrintScale.YEARLY, LocalDate.of(2019, 1, 1), 900],
];

const colors = HColorSet.instance();
const RED = colors.getColorOrWhite('#FF0000');
const BLUE = colors.getColorOrWhite('#0000FF');

/** Probe subclass: fixed heights, Sunday closed, public access to the protected members. */
class Probe extends TimeHeader {
  getTimeHeaderHeight(): number {
    return 20;
  }
  getTimeFooterHeight(): number {
    return 5;
  }
  getFullHeaderHeight(): number {
    return 20;
  }
  drawTimeHeader(ug: UGraphic, total: number): void {
    this.drawColorsBackground(ug, total);
  }
  drawTimeFooter(): void {}
  /** The named formats dereference the locale (I18nTimeData.java:106); the calendar subclass supplies one. */
  protected override locale(): Locale {
    return newLocale('en');
  }
  baseLocale(): Locale | undefined {
    return (TimeHeader.prototype as unknown as { locale(): Locale | undefined }).locale.call(this);
  }
  protected isZeroOnDay(instant: TimePoint): boolean {
    return instant.toDayOfWeek() === DayOfWeek.SUNDAY;
  }
  open = {
    isBold: (d: typeof MIN_DAY) => this.isBold(d),
    min: () => this.getMinDay(),
    max: () => this.getMaxDay(),
    closedBack: () => this.closedBackgroundColor(),
    closedFont: () => this.closedFontColor(),
    openFont: () => this.openFontColor(),
    line: () => this.getLineColor(),
    hline: (ug: UGraphic, y: number) => this.drawHline(ug, y),
    vline: (ug: UGraphic, x: number, y1: number, y2: number) => this.drawVline(ug, x, y1, y2),
    fontConfiguration: (font: UFont, bold: boolean) => this.getFontConfiguration(font, bold, RED),
    fcSlow: (bold: boolean) => this.getFontConfigurationSLOW('day', bold, RED),
    blockWith: (text: string, fc: FontConfiguration) => this.getTextBlockSLOW(text, fc),
    block: (text: string, bold: boolean) =>
      this.getTextBlockSLOW(text, this.getFontConfigurationSLOW('day', bold, RED)),
    locale: () => this.baseLocale(),
    pragma: () => this.getPragma(),
    rect: (ug: UGraphic, h: number, x1: number, x2: number) => this.drawRectangle(ug, h, x1, x2),
    centered: (ug: UGraphic, hide: boolean, s: number, e: number, w: TimePoint, ...f: TimePointFormat[]) =>
      this.printCentered(ug, hide, s, e, w, this.getFontConfigurationSLOW('day', false, RED), ...f),
    separators: (ug: UGraphic, total: number) => this.printVerticalSeparators(ug, total),
  };
}

function probe() {
  const d = headerData();
  return { d, h: new Probe(dailyScale(d), d.weekConfig, d.dayCalendar, d.timeBounds, d.scaleConfig, d.timelineStyle) };
}

describe('TimeHeader (TimeHeader.java:70-299)', () => {
  it('reads min/max days and the style colours from its data (java:98-124)', () => {
    const { d, h } = probe();
    expect(h.open.min()).toBe(MIN_DAY);
    expect(h.open.max()).toBe(MAX_DAY);
    expect(h.open.closedBack()).toEqual(d.timelineStyle.getClosedBackgroundColor());
    expect(h.open.closedFont()).toEqual(d.timelineStyle.getClosedFontColor());
    expect(h.open.openFont()).toEqual(d.timelineStyle.getOpenFontColor());
    expect(h.open.line()).toEqual(d.timelineStyle.getLineColor());
    expect(h.getTimeScale()).toBeDefined();
  });

  it('isBold is the calendar separator-before flag (java:98-100)', () => {
    const { d, h } = probe();
    d.dayCalendar.addSeparatorBefore(MIN_DAY.plusDays(3));
    expect(h.open.isBold(MIN_DAY.plusDays(3))).toBe(true);
    expect(h.open.isBold(MIN_DAY)).toBe(false);
  });

  it('getColor has a TimePoint form and a DayOfWeek form (java:90-96)', () => {
    const { d, h } = probe();
    d.dayCalendar.putColorDay(TimePoint.ofStartOfDay(MIN_DAY), RED);
    d.dayCalendar.putColorDayOfWeek(DayOfWeek.SATURDAY, BLUE);
    expect(h.getColor(TimePoint.ofStartOfDay(MIN_DAY))).toBe(RED);
    expect(h.getColor(TimePoint.ofStartOfDay(MIN_DAY.plusDays(1)))).toBeUndefined();
    expect(h.getColor(DayOfWeek.SATURDAY)).toBe(BLUE);
    expect(h.getColor(DayOfWeek.MONDAY)).toBeUndefined();
  });

  it('drawHline spans min day start to max day end on the line colour at y (java:140-145)', () => {
    const { h } = probe();
    const log = recorded((ug) => h.open.hline(ug, 7));
    // 21 days x cellWidth 16 (day font 10 x 1.6), scale 1
    expect(lineDraws(log)).toEqual(['ULine(336,0) fore(#C0C0C0) translate(0,7)']);
  });

  it('drawVline translates to (x, y1) and is y2 - y1 long (java:147-150)', () => {
    const { h } = probe();
    const log = recorded((ug) => h.open.vline(ug, 16, 20, 100));
    expect(lineDraws(log)).toEqual(['ULine(0,80) translate(16,20)']);
  });

  it('getFontConfiguration: bold swaps the face for UFontFace.bold(), size and stack kept (java:152-157)', () => {
    const { d, h } = probe();
    const font = d.timelineStyle.getFont('day');
    const plain = h.open.fontConfiguration(font, false).getFont() as UFont;
    const bold = h.open.fontConfiguration(font, true).getFont() as UFont;
    expect(plain).toBe(font);
    expect(bold.getFontFace()).toEqual({ cssWeight: 700, italic: false });
    expect(bold.getSize()).toBe(font.getSize());
    expect(h.open.fcSlow(true).getFont()).toBeInstanceOf(UFont);
    expect((h.open.fcSlow(true).getFont() as UFont).getFontFace().cssWeight).toBe(700);
    expect(h.open.fontConfiguration(font, false).getColor()).toBe(RED);
  });

  it('getTextBlockSLOW caches per (text, font configuration) (java:201-234)', () => {
    const { h } = probe();
    const a = h.open.block('Mo', false);
    expect(h.open.block('Mo', false)).toBe(a);
    expect(h.open.block('Tu', false)).not.toBe(a);
    expect(h.open.block('Mo', true)).not.toBe(a);
  });

  it('locale() is null upstream (undefined here) and the pragma is empty (java:241-243,279-281)', () => {
    const { h } = probe();
    expect(h.open.locale()).toBeUndefined();
    expect(h.open.pragma()).toEqual(Pragma.createEmpty());
  });

  it('drawRectangle draws nothing for height 0 or x2 <= x1 (java:260-268)', () => {
    const { h } = probe();
    expect(recorded((ug) => h.open.rect(ug, 0, 0, 10))).toEqual([]);
    expect(recorded((ug) => h.open.rect(ug, 5, 10, 10))).toEqual([]);
    expect(recorded((ug) => h.open.rect(ug, 5, 10, 4))).toEqual([]);
  });

  it('drawRectangle fills (x2-x1) x height under the full header height (java:260-268)', () => {
    const { h } = probe();
    const log = recorded((ug) => h.open.rect(ug, 5, 10, 30));
    expect(log.map((e) => ('draw' in e ? `${e.draw} ${e.chain.join(' ')}` : ''))).toEqual([
      expect.stringMatching(/^URectangle\(20,5\) fore\(.*\) translate\(10,20\)$/),
    ]);
  });

  it('printCentered picks the widest format that fits and centres it (java:245-258)', () => {
    const { h } = probe();
    const when = TimePoint.ofStartOfDay(MIN_DAY);
    // pure wide column: the last (longest) format that fits is drawn
    const wide = recorded((ug) =>
      h.open.centered(ug, false, 0, 1000, when, TimePointFormat.MONTH_SHORT, TimePointFormat.MONTH_LONG),
    );
    expect(textDraws(wide).map((t) => t.split(' ')[0])).toEqual(['UText(July)']);
    const narrow = recorded((ug) =>
      h.open.centered(ug, false, 0, 8, when, TimePointFormat.MONTH_SHORT, TimePointFormat.MONTH_LONG),
    );
    expect(textDraws(narrow).map((t) => t.split(' ')[0])).toEqual(['UText(Jul)']);
  });

  it('printCentered hides when too big only if hideIfTooBig and i == 0 (java:249-251)', () => {
    const { h } = probe();
    const when = TimePoint.ofStartOfDay(MIN_DAY);
    expect(textDraws(recorded((ug) => h.open.centered(ug, true, 0, 1, when, TimePointFormat.YEAR)))).toEqual([]);
    expect(textDraws(recorded((ug) => h.open.centered(ug, false, 0, 1, when, TimePointFormat.YEAR))).length).toBe(1);
  });

  it('printVerticalSeparators draws a bold vline per separator day (java:270-277)', () => {
    const { d, h } = probe();
    d.dayCalendar.addSeparatorBefore(MIN_DAY.plusDays(2));
    const log = recorded((ug) => h.open.separators(ug, 100));
    expect(lineDraws(log).length).toBe(1);
    expect(lineDraws(log)[0]).toMatch(/^ULine\(0,80\) .*translate\(32,20\)$/);
  });

  it('drawColorsBackground merges equal-coloured runs; day-of-week beats day; closed days use the closed colour (java:161-199)', () => {
    const { d, h } = probe();
    // Mon..Wed red; Saturdays blue by day of week (beats a red day on a Saturday); Sundays closed (isZeroOnDay)
    for (let i = 0; i < 3; i++) d.dayCalendar.putColorDay(TimePoint.ofStartOfDay(MIN_DAY.plusDays(i)), RED);
    d.dayCalendar.putColorDay(TimePoint.ofStartOfDay(MIN_DAY.plusDays(5)), RED);
    d.dayCalendar.putColorDayOfWeek(DayOfWeek.SATURDAY, BLUE);
    const log = recorded((ug) => h.drawTimeHeader(ug, 100));
    const rects = log.flatMap((e) =>
      'draw' in e && e.draw.startsWith('URect') ? [`${e.draw} ${e.chain[e.chain.length - 1] ?? ''}`] : [],
    );
    expect(rects).toEqual([
      'URectangle(48,80) translate(0,20)', // Mon..Wed red, one merged run (x 0..48)
      'URectangle(16,80) translate(80,20)', // Saturday: blue by day of week although the day is red
      'URectangle(16,80) translate(96,20)', // Sunday: closed background
      'URectangle(16,80) translate(192,20)',
      'URectangle(16,80) translate(208,20)',
      'URectangle(16,80) translate(304,20)',
      'URectangle(16,80) translate(320,20)',
    ]);
    const backs = log.flatMap((e) => ('draw' in e ? [e.chain[0]] : []));
    expect(backs).toEqual([
      'back(#FF0000)',
      'back(#0000FF)',
      'back(#F1E5E5)',
      'back(#0000FF)',
      'back(#F1E5E5)',
      'back(#0000FF)',
      'back(#F1E5E5)',
    ]);
  });

  it('hColorEquals: simple colours by value, anything else by identity (HColorSimple.equals)', () => {
    const a = colors.getColorOrWhite('#FF0000');
    expect(hColorEquals(a, colors.getColorOrWhite('#FF0000'))).toBe(true);
    expect(hColorEquals(a, BLUE)).toBe(false);
  });

  it('hColorEquals: a non-simple left colour is compared by identity (HColor.equals is Object identity for a non-HColorSimple; TimeHeader.java:184)', () => {
    const magic = new HColorAutomagic();
    expect(hColorEquals(magic, magic)).toBe(true);
    expect(hColorEquals(magic, new HColorAutomagic())).toBe(false);
  });

  it('paintOf passes simple colours through and refuses a colour that is neither simple nor gradient (the cast behind `ug.apply(getLineColor())`, TimeHeader.java:144)', () => {
    expect(paintOf(RED)).toBe(RED);
    expect(() => paintOf(new HColorAutomagic())).toThrow('ClassCastException: colour is not an HColorSimple');
  });

  it('getTextBlockSLOW refuses a font configuration that is not a UFont with a simple colour (port-only key guard; TextBlockKey.java:201-226 hashes the object)', () => {
    const { h } = probe();
    const real = h.open.fcSlow(false);
    const notAFont = { getFont: () => ({}), getColor: () => RED } as unknown as FontConfiguration;
    expect(() => h.open.blockWith('x', notAFont)).toThrow('ClassCastException: FontConfiguration font is not a UFont');
    const notSimple = {
      getFont: () => real.getFont(),
      getColor: () => new HColorAutomagic(),
    } as unknown as FontConfiguration;
    expect(() => h.open.blockWith('x', notSimple)).toThrow(
      'ClassCastException: FontConfiguration color is not an HColorSimple',
    );
  });

  it('applyForeColor applies the colour as the foreground (UGraphic#apply(HColor))', () => {
    const log = recorded((ug) => {
      applyForeColor(ug, RED).draw(ULine.hline(3));
    });
    expect(lineDraws(log)).toEqual(['ULine(3,0) fore(#FF0000)']);
  });

  // T5e: the whole diagram is built through GanttDiagram (the jar's `printscale <scale> zoom 2` source of each
  // fixture) and every drawn element -- the header's texts and lines included -- must equal the jar oracle's, in order.
  it.each(PRINTSCALE_ORACLES)('%s header positions equal printscale-%s-zoom.svg', (name, scale, start, days) => {
    const diagram = newGantt();
    diagram.setPrintScale(scale);
    diagram.setFactorScale(2);
    diagram.updateStartingPoint(start);
    const task = diagram.getOrCreateTask(TaskCode.fromId('Task A'), false);
    task.setLoad(Load.of(diagram.durationOfDaysHoursMinutesSeconds(days, 0, 0, 0)));

    const jar = elementsOf(oracleSvg(`printscale-${name}-zoom`));
    const texts = jar.filter((e) => e.startsWith('<text'));
    expect(texts.length).toBeGreaterThan(5);
    expect(elementsOf(drawSvg(diagram))).toEqual(jar);
  });
});

describe('emojiStoreOf (T8c)', () => {
  it('is undefined for a skin param that is not the gantt SkinParam', () => {
    expect(emojiStoreOf({} as ISkinParam)).toBeUndefined();
  });
});
