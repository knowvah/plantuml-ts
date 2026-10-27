import { describe, expect, it } from 'vitest';
import { PrintScale } from '../../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimeRange } from '../../../../../src/diagrams/gantt/core/TimeRange.js';
import { TimeHeaderDaily } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderDaily.js';
import { TimeHeaderFactory } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderFactory.js';
import { TimeHeaderMonthly } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderMonthly.js';
import { TimeHeaderQuarterly } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderQuarterly.js';
import { TimeHeaderSimple } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderSimple.js';
import { TimeHeaderVariant } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderVariant.js';
import { TimeHeaderWeekly } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderWeekly.js';
import { TimeHeaderYearly } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderYearly.js';
import { TimePoint } from '../../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimeScaleCompressed } from '../../../../../src/diagrams/gantt/timescale/TimeScaleCompressed.js';
import { TimeScaleDaily } from '../../../../../src/diagrams/gantt/timescale/TimeScaleDaily.js';
import { TimeScaleDailyHideClosed } from '../../../../../src/diagrams/gantt/timescale/TimeScaleDailyHideClosed.js';
import { TimeScaleWink } from '../../../../../src/diagrams/gantt/timescale/TimeScaleWink.js';
import { VariantTimeScale } from '../../../../../src/diagrams/gantt/timescale/VariantTimeScale.js';
import { LONG_MAX, LONG_MIN, boundsOf, headerData } from './helpers/header-fixture.js';

function create(printScale: PrintScale, tweak: (d: ReturnType<typeof headerData>) => void = () => {}) {
  const d = headerData(printScale, LONG_MIN, LONG_MAX);
  tweak(d);
  return new TimeHeaderFactory(
    d.weekConfig,
    d.dayCalendar,
    d.timeBounds,
    d.scaleConfig,
    d.timelineStyle,
  ).createTimeHeader();
}

describe('TimeHeaderFactory (TimeHeaderFactory.java:52-151)', () => {
  it.each([
    [PrintScale.DAILY, TimeHeaderDaily, TimeScaleDaily],
    [PrintScale.WEEKLY, TimeHeaderWeekly, TimeScaleCompressed],
    [PrintScale.MONTHLY, TimeHeaderMonthly, TimeScaleCompressed],
    [PrintScale.QUARTERLY, TimeHeaderQuarterly, TimeScaleCompressed],
    [PrintScale.YEARLY, TimeHeaderYearly, TimeScaleCompressed],
  ] as const)('%s picks its header and scale (java:93-111, 123-135)', (printScale, header, scale) => {
    const h = create(printScale);
    expect(h).toBeInstanceOf(header);
    expect(h.getTimeScale()).toBeInstanceOf(scale);
  });

  it('daily with hideClosed uses the hide-closed scale (java:124-129)', () => {
    const h = create(PrintScale.DAILY, (d) => {
      d.scaleConfig.setHideClosed(true);
    });
    expect(h).toBeInstanceOf(TimeHeaderDaily);
    expect(h.getTimeScale()).toBeInstanceOf(TimeScaleDailyHideClosed);
  });

  it('a minimum day equal to the epoch gives the simple header over a wink scale (java:76-79, 119-121)', () => {
    const d = headerData(PrintScale.WEEKLY, TimePoint.epoch(), TimePoint.epoch().plusDays(13));
    const h = new TimeHeaderFactory(
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
    ).createTimeHeader();
    expect(h).toBeInstanceOf(TimeHeaderSimple);
    expect(h.getTimeScale()).toBeInstanceOf(TimeScaleWink);
  });

  it('working time ranges give the variant header over a variant scale, whatever the print scale (java:81-90)', () => {
    const h = create(PrintScale.MONTHLY, (d) => {
      d.dayCalendar.addWorkingTimeRange(new TimeRange('08:00', '12:00'));
    });
    expect(h).toBeInstanceOf(TimeHeaderVariant);
    expect(h.getTimeScale()).toBeInstanceOf(VariantTimeScale);
  });

  it('the epoch check precedes the working-time check (java:76-81)', () => {
    const d = headerData(PrintScale.DAILY, TimePoint.epoch(), TimePoint.epoch().plusDays(3));
    d.dayCalendar.addWorkingTimeRange(new TimeRange('08:00', '12:00'));
    const h = new TimeHeaderFactory(
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
    ).createTimeHeader();
    expect(h).toBeInstanceOf(TimeHeaderSimple);
  });

  it('the scale is anchored at the first day and sized by cell width x effective scale (java:123-147)', () => {
    const h = create(PrintScale.WEEKLY, (d) => {
      d.scaleConfig.setFactorScale(2);
    });
    // cellWidth 16 x (weekly 1/4 x factor 2) = 8 px per day
    expect(h.getTimeScale().getWidth(TimePoint.ofStartOfDay(LONG_MIN))).toBe(8);
    expect(h.getTimeScale().getPosition(TimePoint.ofStartOfDay(LONG_MIN.plusDays(3)))).toBe(24);
  });

  it('an unknown print scale is an IllegalStateException (java:112-113)', () => {
    const d = headerData(PrintScale.DAILY, LONG_MIN, LONG_MAX);
    d.scaleConfig.setPrintScale('NOPE' as unknown as PrintScale);
    const factory = new TimeHeaderFactory(
      d.weekConfig,
      d.dayCalendar,
      boundsOf(LONG_MIN, LONG_MAX),
      d.scaleConfig,
      d.timelineStyle,
    );
    expect(() => factory.createTimeHeader()).toThrow('IllegalStateException: Unsupported print scale: NOPE');
  });
});
