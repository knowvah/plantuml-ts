/**
 * Unit cases for the capture-clock detector and key helpers
 * (gantt-engine-port T0c, D3b). Upstream citations are in
 * `tests/oracle/svg-conformance/capture-clock.ts`.
 */
import { describe, it, expect } from 'vitest';

import {
  clockKeyForPath,
  corpusClockKey,
  fixtureClockKey,
  isClockDependentSource,
  withClockEntry,
} from '../../oracle/svg-conformance/capture-clock.js';

const gantt = (...body: string[]): string => ['@startgantt', ...body, '@endgantt'].join('\n');

describe('isClockDependentSource -- gantt today', () => {
  it('today is colored with no earlier date is dependent', () => {
    expect(isClockDependentSource(gantt('today is colored in #ff8080'))).toBe(true);
    expect(isClockDependentSource(gantt('today is colored'))).toBe(true);
  });
  it('today set first and colored on the same line is NOT dependent', () => {
    expect(isClockDependentSource(gantt('today is 2021-01-11 and is colored'))).toBe(false);
    expect(isClockDependentSource(gantt('today is 30 days after start and is colored in #AAF'))).toBe(false);
  });
  it('statement order matters: colored before the date is dependent, after is not', () => {
    expect(isClockDependentSource(gantt('today is colored', 'today is 2021-01-11'))).toBe(true);
    expect(isClockDependentSource(gantt('today is 2021-01-11', 'today is colored in #AAF'))).toBe(false);
  });
});

describe('isClockDependentSource -- gantt T+N day subject', () => {
  it('T+N / T-N with today unset is dependent', () => {
    expect(isClockDependentSource(gantt('[Task] starts at T+3'))).toBe(true);
    expect(isClockDependentSource(gantt('[Task] ends at t-2'))).toBe(true);
  });
  it('T+N after today is set is not', () => {
    expect(isClockDependentSource(gantt('today is 2021-01-11', '[Task] starts at T+3'))).toBe(false);
  });
  it('D+N and E+N never read the clock', () => {
    expect(isClockDependentSource(gantt('[Task] starts at D+3', '[B] ends at E-1'))).toBe(false);
  });
  it('gantt rules do not fire on non-gantt sources', () => {
    expect(isClockDependentSource('@startuml\ntoday is colored in #ff8080\n@enduml')).toBe(false);
  });
});

describe('isClockDependentSource -- TIM', () => {
  it('%now() is always dependent', () => {
    expect(isClockDependentSource('@startuml\n!$t = %now()\n@enduml')).toBe(true);
  });
  it('%date() and %date(fmt) are dependent (DateFunction.java:71-79)', () => {
    expect(isClockDependentSource('footer Generated %date()')).toBe(true);
    expect(isClockDependentSource('footer %date("YYYY-MM-dd")')).toBe(true);
    expect(isClockDependentSource('footer %date("a,b")')).toBe(true);
  });
  it('%date(fmt, timestamp[, zone]) is fixed (DateFunction.java:76-77)', () => {
    expect(isClockDependentSource('!$today = %date("YYYY-MM-dd", 200 * 20000)')).toBe(false);
    expect(isClockDependentSource('x %date("HH", %strlen("a"), "UTC")')).toBe(false);
  });
  it('a plain source is not dependent', () => {
    expect(isClockDependentSource('@startuml\nA -> B\n@enduml')).toBe(false);
  });
});

describe('sidecar keys', () => {
  it('formats corpus and fixture keys', () => {
    expect(corpusClockKey('gantt', 'x-1')).toBe('gantt/x-1');
    expect(fixtureClockKey('gantt/today-implicit.puml')).toBe('fixtures/gantt/today-implicit');
  });
  it('derives keys from paths', () => {
    expect(clockKeyForPath('/r/tests/fixtures/gantt/a.puml')).toBe('fixtures/gantt/a');
    expect(clockKeyForPath('/r/test-results/dot-cache/unknown/firiru/in.puml')).toBe('unknown/firiru');
    expect(clockKeyForPath('/tmp/other.puml')).toBeUndefined();
  });
  it('withClockEntry inserts sorted without mutating the input', () => {
    const base = { 'b/x': { epochMillis: 1, zone: 'UTC' } };
    const next = withClockEntry(base, 'a/y', { epochMillis: 2, zone: 'UTC' });
    expect(Object.keys(next)).toEqual(['a/y', 'b/x']);
    expect(Object.keys(base)).toEqual(['b/x']);
  });
});
