/**
 * The one injected clock (gantt-engine-port D3a): TIM `%now` / `%date` and
 * gantt's `today` read it, never the ambient wall clock.
 *
 * Upstream reads `System.currentTimeMillis()` (`tim/builtin/Now.java:56`,
 * `DateFunction.java:76-79`) and `LocalDate.now()` in the JVM default zone
 * (`time/TimePoint.java:93-95`, `GanttDiagram.java:455-466`). The port makes
 * both an injected seam: the library default is {@link DEFAULT_CLOCK}
 * (instant 0, UTC); conformance tooling sets the jar's capture clock through
 * the internal `clock` render option (`internal-render-options.ts`, not
 * re-exported, no public `RenderOptions` field).
 *
 * Zone conversion lives HERE (`Intl.DateTimeFormat`, the mechanism
 * `tim/builtin/date-format.ts` already uses); `src/core/time` stays Intl-free
 * and takes plain integers. No `Date`, `Date.now()` or `Math.random()`.
 *
 * Route to a plugin: `renderClock(options)` takes the `RenderOptions` a render
 * was given. `prepareBlock` (`src/index.ts`) hands plugins `ctx`, which does not
 * carry the options today (`dispatcher-types.ts`, outside T1b's write-set), so
 * batch 5 threads the clock by adding it to that ctx from
 * `renderClock(options)` -- nested `{{ }}` renders already receive the same
 * `options` object (`registerNestedDiagramRenderers(... renderSync(nested,
 * options))`), so they inherit it.
 */

import { clockOfOptions } from './internal-render-options.js';
import type { RenderOptions } from './render-options.js';

/** An instant source plus the zone that defines "local" (the JVM default zone at capture). */
export interface Clock {
  nowMillis(): number;
  readonly zone: string;
}

/** The library default: instant 0, UTC -- byte-identical to the pre-seam `%now()`. */
export const DEFAULT_CLOCK: Clock = { nowMillis: () => 0, zone: 'UTC' };

const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_DAY = 86_400;
const MILLIS_PER_DAY = 86_400_000;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

/** The clock a render with `options` uses: the internal `clock` option, else {@link DEFAULT_CLOCK}. */
export function renderClock(options: RenderOptions | undefined): Clock {
  return clockOfOptions(options) ?? DEFAULT_CLOCK;
}

/** `Math.floor(a / b)` for integers, correct for negative `a`. */
function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

/** Days since 1970-01-01 of a proleptic-Gregorian civil date (Hinnant's days_from_civil). */
function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = floorDiv(y, 400);
  const yoe = y - era * 400;
  const doy = floorDiv(153 * (month + (month > 2 ? -3 : 9)) + 2, 5) + day - 1;
  const doe = yoe * 365 + floorDiv(yoe, 4) - floorDiv(yoe, 100) + doy;
  return era * 146_097 + doe - 719_468;
}

/**
 * Seconds `zone` is ahead of UTC at the instant `epochMillis` (DST-aware;
 * `America/Chicago` is -21600 in winter, -18000 in summer). Throws `RangeError`
 * for an unknown IANA zone, like `Intl.DateTimeFormat`.
 */
export function zoneOffsetSeconds(epochMillis: number, zone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });
  const fields = new Map<string, number>();
  for (const part of formatter.formatToParts(epochMillis)) {
    fields.set(part.type, Number.parseInt(part.value, 10));
  }
  const get = (type: string): number => fields.get(type) ?? 0;
  const localSeconds =
    daysFromCivil(get('year'), get('month'), get('day')) * SECONDS_PER_DAY +
    (get('hour') % 24) * SECONDS_PER_HOUR +
    get('minute') * SECONDS_PER_MINUTE +
    get('second');
  return localSeconds - floorDiv(epochMillis, MILLIS_PER_SECOND);
}

/**
 * The epoch-day (days since 1970-01-01) of the clock's instant in the clock's
 * zone: what `LocalDate.now()` yields in the JVM default zone
 * (`time/TimePoint.java:93-95`, `todayAtMidnight`).
 */
export function localEpochDay(clock: Clock): number {
  const now = clock.nowMillis();
  return floorDiv(now + zoneOffsetSeconds(now, clock.zone) * MILLIS_PER_SECOND, MILLIS_PER_DAY);
}
