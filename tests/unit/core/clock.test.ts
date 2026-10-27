import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEFAULT_CLOCK, localEpochDay, renderClock, zoneOffsetSeconds, type Clock } from '../../../src/core/clock.js';
import { clockOfOptions, withClock } from '../../../src/core/internal-render-options.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import {
  clockForKey,
  clockForPath,
  readCaptureClockRecord,
  type CaptureClockRecord,
} from '../../oracle/svg-conformance/capture-clock.js';

const CHICAGO = 'America/Chicago';
const CST_OFFSET = -21_600;
const CDT_OFFSET = -18_000;
const MILLIS_PER_DAY = 86_400_000;
/** 2020-10-10T00:00:00Z. */
const OCT_10_2020 = 1_602_288_000_000;

const at = (iso: string): number => Date.parse(iso);
const epochDay = (iso: string): number => at(iso) / MILLIS_PER_DAY;
const fixed = (millis: number, zone: string): Clock => ({ nowMillis: () => millis, zone });

function titleOf(svg: string): string {
  return /<text[^>]*>([^<]*)<\/text>/.exec(svg)?.[1] ?? '';
}

describe('DEFAULT_CLOCK', () => {
  it('is instant 0 in UTC', () => {
    expect(DEFAULT_CLOCK.nowMillis()).toBe(0);
    expect(DEFAULT_CLOCK.zone).toBe('UTC');
  });
});

describe('zoneOffsetSeconds', () => {
  it('is 0 for UTC', () => {
    expect(zoneOffsetSeconds(OCT_10_2020, 'UTC')).toBe(0);
  });

  it('flips from -21600 to -18000 across the 2026 Chicago spring-forward instant', () => {
    expect(zoneOffsetSeconds(at('2026-03-08T07:59:59Z'), CHICAGO)).toBe(CST_OFFSET);
    expect(zoneOffsetSeconds(at('2026-03-08T08:00:00Z'), CHICAGO)).toBe(CDT_OFFSET);
  });

  it('flips back at the 2026 fall-back instant', () => {
    expect(zoneOffsetSeconds(at('2026-11-01T06:59:59Z'), CHICAGO)).toBe(CDT_OFFSET);
    expect(zoneOffsetSeconds(at('2026-11-01T07:00:00Z'), CHICAGO)).toBe(CST_OFFSET);
  });

  it('handles a half-hour zone and a pre-epoch instant', () => {
    expect(zoneOffsetSeconds(at('2026-01-01T00:00:00Z'), 'Asia/Kolkata')).toBe(19_800);
    expect(zoneOffsetSeconds(at('1960-06-01T00:00:00Z'), 'UTC')).toBe(0);
  });

  it('throws RangeError for an unknown zone', () => {
    expect(() => zoneOffsetSeconds(0, 'Not/AZone')).toThrow(RangeError);
  });
});

describe('localEpochDay', () => {
  it('is the UTC day for a UTC clock', () => {
    expect(localEpochDay(fixed(at('2026-10-24T23:59:59Z'), 'UTC'))).toBe(epochDay('2026-10-24T00:00:00Z'));
  });

  it('rolls over at local midnight in Chicago (05:00Z in CDT)', () => {
    const day = epochDay('2026-10-24T00:00:00Z');
    expect(localEpochDay(fixed(at('2026-10-24T04:59:59Z'), CHICAGO))).toBe(day - 1);
    expect(localEpochDay(fixed(at('2026-10-24T05:00:00Z'), CHICAGO))).toBe(day);
  });

  it('is the previous day at instant 0 west of UTC and floors negative days', () => {
    expect(localEpochDay(fixed(0, CHICAGO))).toBe(-1);
    expect(localEpochDay(fixed(-1, 'UTC'))).toBe(-1);
  });
});

describe('renderClock / clock option', () => {
  it('returns DEFAULT_CLOCK when no clock option is set', () => {
    expect(renderClock(undefined)).toBe(DEFAULT_CLOCK);
    expect(renderClock({})).toBe(DEFAULT_CLOCK);
    expect(clockOfOptions({})).toBeUndefined();
  });

  it('returns the injected clock', () => {
    const clock = fixed(5, CHICAGO);
    expect(renderClock(withClock({}, clock))).toBe(clock);
  });

  it('withClock leaves options untouched for an undefined clock', () => {
    const options = { measurer: new DeterministicMeasurer() };
    expect(withClock(options, undefined)).toBe(options);
  });
});

describe('%now / %date through renderSync', () => {
  const render = (expr: string, clock?: Clock): string =>
    titleOf(
      renderSync(
        `@startuml\ntitle ${expr}\nAlice -> Bob\n@enduml`,
        withClock({ measurer: new DeterministicMeasurer() }, clock),
      ),
    );

  it('%now() is 0 with no clock (byte-identical to the pre-seam default)', () => {
    expect(render('%now()')).toBe('0');
  });

  it('%now() reads the injected clock in seconds', () => {
    expect(render('%now()', fixed(OCT_10_2020, 'UTC'))).toBe('1602288000');
  });

  it('%date(format) without a zone uses the clock zone', () => {
    const clock = fixed(at('2026-10-24T03:30:00Z'), CHICAGO);
    expect(render('%date("yyyy-MM-dd HH:mm")', clock)).toBe('2026-10-23 22:30');
  });

  it('%date(format) with an explicit zone ignores the clock zone', () => {
    const clock = fixed(at('2026-10-24T03:30:00Z'), CHICAGO);
    expect(render('%date("yyyy-MM-dd HH:mm", 0, "UTC")', clock)).toBe('1970-01-01 00:00');
  });

  it('%date(format) without a clock keeps instant 0', () => {
    expect(render('%date("yyyy-MM-dd", 0, "UTC")')).toBe('1970-01-01');
  });
});

describe('capture-clock loader', () => {
  const record: CaptureClockRecord = { 'gantt/x': { epochMillis: 42, zone: CHICAGO } };

  it('builds a Clock from a row', () => {
    const clock = clockForKey('gantt/x', record);
    expect(clock?.nowMillis()).toBe(42);
    expect(clock?.zone).toBe(CHICAGO);
  });

  it('returns undefined for a source with no row', () => {
    expect(clockForKey('gantt/missing', record)).toBeUndefined();
    expect(clockForKey('constructor', record)).toBeUndefined();
  });

  it('derives the key from a cache path and from a fixture path', () => {
    expect(clockForPath('/r/test-results/dot-cache/gantt/x/in.puml', record)?.nowMillis()).toBe(42);
    expect(clockForPath('/r/tests/fixtures/gantt/x.puml', { 'fixtures/gantt/x': record['gantt/x']! })?.zone).toBe(
      CHICAGO,
    );
    expect(clockForPath('/elsewhere/in.puml', record)).toBeUndefined();
  });

  it('reads the committed sidecar: the firiru row is Chicago at its recorded instant', () => {
    const clock = clockForKey('unknown/firiru-71-viki803');
    expect(clock?.nowMillis()).toBe(1_791_605_405_000);
    expect(clock?.zone).toBe(CHICAGO);
  });

  it('treats an absent file as an empty record', () => {
    expect(readCaptureClockRecord('/nonexistent/capture-clock.json')).toEqual({});
  });

  it('rejects a malformed row, naming its key', () => {
    const dir = mkdtempSync(join(tmpdir(), 'capture-clock-'));
    const path = join(dir, 'capture-clock.json');
    writeFileSync(path, JSON.stringify({ 'gantt/bad': { epochMillis: 'soon', zone: CHICAGO } }));
    expect(() => readCaptureClockRecord(path)).toThrow(/row "gantt\/bad"/);
    writeFileSync(path, 'null');
    expect(() => readCaptureClockRecord(path)).toThrow(/expected an object/);
    rmSync(dir, { recursive: true });
  });
});
