/**
 * Unit tests for `scripts/lib/oracle-minute-guard.ts` (mission
 * class-divergence-drive-6, T0c / D9).
 *
 * `isDecorationMinute`'s set is quoted directly from
 * `PSystemError.java:224-229` in the module's own header comment; these
 * tests assert against that quoted set, not a re-typed copy.
 */
import { describe, it, expect, vi } from 'vitest';
import { isDecorationMinute, runInPlainMinute, POLL_INTERVAL_MS } from '../../../scripts/lib/oracle-minute-guard.js';

function ms(minute: number, second = 0): number {
  return minute * 60_000 + second * 1_000;
}

describe('isDecorationMinute', () => {
  it('is true for every minute PSystemError.java:224-229 decorates', () => {
    for (const m of [1, 8, 13, 55, 15, 30, 39, 48]) {
      expect(isDecorationMinute(m)).toBe(true);
    }
  });

  it('is true for 30 and false for 31 (AC1)', () => {
    expect(isDecorationMinute(30)).toBe(true);
    expect(isDecorationMinute(31)).toBe(false);
  });

  it('is false for every other minute in the hour', () => {
    const decorated = new Set([1, 8, 13, 15, 30, 39, 48, 55]);
    for (let m = 0; m < 60; m++) {
      if (!decorated.has(m)) expect(isDecorationMinute(m)).toBe(false);
    }
  });
});

describe('runInPlainMinute', () => {
  it('calls fn once and never sleeps when start and end minutes are both plain', async () => {
    let now = ms(10, 0);
    const clock = () => now;
    const sleep = vi.fn((): Promise<void> => Promise.resolve());
    const fn = vi.fn(() => {
      now = ms(10, 30);
      return 'done';
    });

    const result = await runInPlainMinute(fn, clock, sleep);

    expect(result).toBe('done');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('sleeps until the next plain minute before calling fn when the start is decorated (AC3)', async () => {
    let now = ms(30, 5); // decorated
    const clock = () => now;
    const sleep = vi.fn((): Promise<void> => {
      now = ms(31, 0); // simulates waiting out the decorated minute
      return Promise.resolve();
    });
    const fn = vi.fn(() => {
      now = ms(31, 10);
      return 'ok';
    });

    const result = await runInPlainMinute(fn, clock, sleep);

    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(POLL_INTERVAL_MS);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe('ok');
  });

  it('keeps sleeping while the minute stays decorated across polls', async () => {
    let now = ms(48, 0); // decorated
    const clock = () => now;
    let polls = 0;
    const sleep = vi.fn((): Promise<void> => {
      polls += 1;
      now = polls < 3 ? ms(48, polls * 10) : ms(49, 0); // still 48 twice, then plain
      return Promise.resolve();
    });
    const fn = vi.fn(() => {
      now = ms(49, 5);
      return 'ready';
    });

    const result = await runInPlainMinute(fn, clock, sleep);

    expect(sleep).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe('ready');
  });

  it('retries when a render straddles a decoration-minute boundary, 47:59 -> 48:02 (AC2)', async () => {
    let now = ms(47, 59);
    const clock = () => now;
    const sleep = vi.fn((): Promise<void> => {
      now = ms(49, 0); // waits out minute 48
      return Promise.resolve();
    });
    const fn = vi
      .fn<() => string>()
      .mockImplementationOnce(() => {
        now = ms(48, 2); // ends inside a decorated minute -- must retry
        return 'first';
      })
      .mockImplementationOnce(() => {
        now = ms(49, 5);
        return 'second';
      });

    const result = await runInPlainMinute(fn, clock, sleep);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(result).toBe('second');
  });

  it('supports an async fn', async () => {
    let now = ms(2, 0);
    const clock = () => now;
    const sleep = vi.fn((): Promise<void> => Promise.resolve());
    const fn = vi.fn(async () => {
      await Promise.resolve();
      now = ms(2, 30);
      return 42;
    });

    await expect(runInPlainMinute(fn, clock, sleep)).resolves.toBe(42);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('defaults to Date.now and a real timer-based sleep when not injected', async () => {
    // Pinned to a plain minute so this never depends on the real wall clock
    // landing on a decorated minute (which would sleep for real).
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(ms(10, 0));
    const fn = vi.fn(() => 'value');

    try {
      await expect(runInPlainMinute(fn)).resolves.toBe('value');
      expect(fn).toHaveBeenCalledTimes(1);
    } finally {
      nowSpy.mockRestore();
    }
  });
});
