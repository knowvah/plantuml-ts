/**
 * Guard against PlantUML's time-based error-page donation decorations
 * (mission class-divergence-drive-6, T0c; finding filed at
 * `.agent-notes/cdd5-T0e-error-page-time-decoration.md`).
 *
 * `PSystemError.java:221-229` (net/sourceforge/plantuml/error/PSystemError.java,
 * verified in ~/git/plantuml) reads:
 *
 *   final int min = (int) (System.currentTimeMillis() / 60000L) % 60;
 *   if (disableTimeBasedErrorDecorations) {
 *       // do nothing
 *   } else if (min == 1 || min == 8 || min == 13 || min == 55)
 *       result = addMessagePatreon(result);
 *   else if (min == 15)
 *       result = addMessageLiberapay(result);
 *   else if (min == 30 || min == 39 || min == 48)
 *       result = addMessageDedication(result);
 *
 * `disableTimeBasedErrorDecorations` (line 85/87) has no caller anywhere in
 * `src/main/java`, so the jar can never be told to skip this: every error
 * page rendered in one of those eight minutes carries an extra banner (rect
 * + PNG) that a plain-minute capture never has. cdd5 found decorated
 * captures in both the committed oracle cache and a golden after a re-pin
 * landed on a decorated minute.
 *
 * `runInPlainMinute` waits out a currently-decorated minute, runs `fn`, and
 * retries the whole wait-then-call cycle if the minute at the END of `fn`
 * is ALSO decorated -- a render that straddled the minute boundary (e.g.
 * started at :47:59, finished at :48:02) is exactly as contaminated as one
 * that started inside a decorated minute. Clock and sleep are injected
 * (testability.md #5: inject non-determinism) so no test ever sleeps for
 * real. Shell precedent: `plans/class-divergence-drive-5/measurements/t0c/
 * safe-render-one.sh`, which polled the same eight minutes with `date -u`.
 */

/** The exact minute set PSystemError.java:224-229 decorates on, quoted
 *  above -- not re-derived, since the Java is the spec. */
const DECORATION_MINUTES: ReadonlySet<number> = new Set([1, 8, 13, 55, 15, 30, 39, 48]);

/** Mirrors PSystemError.java:221's `(currentTimeMillis() / 60000) % 60`. */
export function isDecorationMinute(minute: number): boolean {
  return DECORATION_MINUTES.has(minute);
}

function minuteOf(nowMs: number): number {
  return Math.floor(nowMs / 60_000) % 60;
}

/** Current time in epoch milliseconds. Production default is `Date.now`. */
export type GuardClock = () => number;

/** Suspends for `ms` milliseconds. Production default is a real timer. */
export type GuardSleep = (ms: number) => Promise<void>;

/** Poll interval while waiting out a decorated minute. Matches the
 *  precedent shell guard's `sleep 2` (safe-render-one.sh:12). */
export const POLL_INTERVAL_MS = 2_000;

const realSleep: GuardSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitOutDecorationMinute(now: GuardClock, sleep: GuardSleep): Promise<void> {
  while (isDecorationMinute(minuteOf(now()))) {
    await sleep(POLL_INTERVAL_MS);
  }
}

/**
 * Runs `fn` (sync or async) entirely outside decorated minutes: waits out a
 * decorated minute before the first call, and retries (wait, then call
 * again) whenever the minute at the end of `fn` is decorated too. `now`/
 * `sleep` default to real wall-clock time; tests inject fakes so the eight
 * decorated minutes per hour never cause a real sleep in CI.
 */
export async function runInPlainMinute<T>(
  fn: () => T | Promise<T>,
  now: GuardClock = Date.now,
  sleep: GuardSleep = realSleep,
): Promise<T> {
  for (;;) {
    await waitOutDecorationMinute(now, sleep);
    const result = await fn();
    if (!isDecorationMinute(minuteOf(now()))) return result;
  }
}
