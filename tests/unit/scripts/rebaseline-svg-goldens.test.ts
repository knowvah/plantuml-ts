/**
 * Unit tests for `scripts/rebaseline-svg-goldens.ts`'s pure functions (T2,
 * mission svg-output-size-reduction). The jar-capture and git-plumbing I/O is
 * exercised by the manual report-only run, not by a JVM- or git-dependent
 * test -- `captureEach` is the one exception, exercised below with an
 * INJECTED renderer to prove it renders one fixture per call (isw-T0b: a
 * batched JVM is not byte-identical to solo renders) and routes the minute
 * guard's clock/sleep through to the renderer (cdd6 T0c).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  compareCapture,
  summarize,
  formatSummaryLine,
  formatOutcomeLine,
  describeOutcome,
  evaluateDrift,
  captureEach,
  type FixtureOutcome,
} from '../../../scripts/rebaseline-svg-goldens.js';
import type { Renderer } from '../../../scripts/lib/recapture-render.js';

describe('compareCapture', () => {
  it('is SAME for byte-identical buffers', () => {
    expect(compareCapture(Buffer.from('<svg/>'), Buffer.from('<svg/>'))).toBe('SAME');
  });

  it('is CHANGED for differing buffers', () => {
    expect(compareCapture(Buffer.from('<svg a/>'), Buffer.from('<svg b/>'))).toBe('CHANGED');
  });

  it('is FAILED when the jar produced no capture, never silently skipped', () => {
    expect(compareCapture(undefined, Buffer.from('<svg/>'))).toBe('FAILED');
  });
});

describe('formatSummaryLine', () => {
  it('matches the exact interface-contract format for T9', () => {
    expect(formatSummaryLine({ same: 0, changed: 445, failed: 1 })).toBe('SAME=0 CHANGED=445 FAILED=1');
  });

  it('formats an all-zero summary', () => {
    expect(formatSummaryLine({ same: 0, changed: 0, failed: 0 })).toBe('SAME=0 CHANGED=0 FAILED=0');
  });
});

describe('summarize', () => {
  function o(over: Partial<FixtureOutcome>): FixtureOutcome {
    return { relPath: 'svg-class/foo', status: 'SAME', ...over };
  }

  it('counts an empty result set as all zeros', () => {
    expect(summarize([])).toEqual({ same: 0, changed: 0, failed: 0 });
  });

  it('tallies SAME/CHANGED/FAILED independently', () => {
    const results = [
      o({ relPath: 'a', status: 'SAME' }),
      o({ relPath: 'b', status: 'SAME' }),
      o({ relPath: 'c', status: 'CHANGED' }),
      o({ relPath: 'd', status: 'FAILED', detail: 'jar produced no SVG' }),
    ];
    expect(summarize(results)).toEqual({ same: 2, changed: 1, failed: 1 });
  });
});

describe('formatOutcomeLine', () => {
  it('reports nothing for SAME -- 450 SAME lines would be pure noise', () => {
    expect(formatOutcomeLine({ relPath: 'svg-class/foo', status: 'SAME' })).toBeUndefined();
  });

  it('names the fixture for CHANGED', () => {
    expect(formatOutcomeLine({ relPath: 'svg-class/foo', status: 'CHANGED' })).toBe('CHANGED svg-class/foo');
  });

  it('names the fixture and reason for FAILED (AC4: never skipped silently)', () => {
    expect(
      formatOutcomeLine({
        relPath: 'svg-class/class-actor-bare-no-allowmixing',
        status: 'FAILED',
        detail: 'jar produced no SVG',
      }),
    ).toBe('FAILED svg-class/class-actor-bare-no-allowmixing: jar produced no SVG');
  });
});

describe('describeOutcome', () => {
  it('has nothing to say about a clean non-FAILED capture', () => {
    expect(describeOutcome('SAME', 0)).toBeUndefined();
    expect(describeOutcome('CHANGED', 0)).toBeUndefined();
  });

  it('reports a missing SVG', () => {
    expect(describeOutcome('FAILED', 0)).toBe('jar produced no SVG');
  });

  it('reports a non-zero jar exit as an error diagram', () => {
    // svg-class/class-actor-bare-no-allowmixing's real behavior: the jar
    // exits 200 AND writes a valid error-diagram SVG. Classified CHANGED
    // (an SVG exists) but never silently -- the golden it pins IS that
    // error diagram, and a fixture newly falling into this state must be
    // visible rather than re-baselined without comment.
    expect(describeOutcome('CHANGED', 200)).toBe('jar exit 200 (error diagram)');
  });

  it('reports both when the jar errored and produced nothing', () => {
    expect(describeOutcome('FAILED', 1)).toBe('jar produced no SVG; jar exit 1 (error diagram)');
  });
});

describe('formatOutcomeLine — jar-error visibility', () => {
  it('reports a SAME fixture when the jar errored on it', () => {
    expect(
      formatOutcomeLine({
        relPath: 'svg-class/class-actor-bare-no-allowmixing',
        status: 'SAME',
        detail: 'jar exit 200 (error diagram)',
        jarExit: 200,
      }),
    ).toBe('SAME svg-class/class-actor-bare-no-allowmixing: jar exit 200 (error diagram)');
  });

  it('still stays quiet about an ordinary SAME fixture', () => {
    expect(formatOutcomeLine({ relPath: 'svg-class/foo', status: 'SAME' })).toBeUndefined();
  });
});

describe('evaluateDrift', () => {
  it('is ok when the base tree matches the pinned tree', () => {
    expect(evaluateDrift({ pinTree: 'abc', baseTree: 'abc', allowOverride: false })).toEqual({
      ok: true,
    });
  });

  it('refuses when the pinned upstream sha cannot be resolved in the fork', () => {
    expect(evaluateDrift({ pinTree: undefined, baseTree: 'abc', allowOverride: false })).toEqual({
      ok: false,
      reason: 'pin.json upstreamSha not found in fork',
    });
  });

  it('refuses when the trees diverge and no override is set', () => {
    expect(evaluateDrift({ pinTree: 'abc', baseTree: 'def', allowOverride: false })).toEqual({
      ok: false,
      reason: 'dot-output~seamCommitCount tree != pinned upstream tree',
    });
  });

  it('honors ORACLE_ALLOW_DRIFT=1 as an explicit, reported override', () => {
    expect(evaluateDrift({ pinTree: 'abc', baseTree: 'def', allowOverride: true })).toEqual({
      ok: true,
      reason: 'ORACLE_ALLOW_DRIFT=1 override',
    });
  });
});

// ---------------------------------------------------------------------------
// captureEach -- one renderer call (one JVM) per fixture.
// ---------------------------------------------------------------------------

describe('captureEach', () => {
  const fixtures = [
    { relPath: 'svg-class/a', fixtureDir: '/src/a' },
    { relPath: 'svg-dot/b', fixtureDir: '/src/b' },
  ];

  it('calls the renderer once per fixture, never with several inputs', async () => {
    const render = vi.fn<Renderer>((puml) =>
      Promise.resolve({ files: new Map([['in.svg', Buffer.from(`svg for ${puml}`)]]), exitCode: 0, timedOut: false }),
    );

    const result = await captureEach(fixtures, '/scratch', {}, render);

    expect(render).toHaveBeenCalledTimes(2);
    expect(render.mock.calls.map((c) => c[0]).sort()).toEqual(['/src/a/in.puml', '/src/b/in.puml']);
    expect(result.get('svg-class/a')).toEqual({ bytes: Buffer.from('svg for /src/a/in.puml'), exitCode: 0 });
    expect(result.get('svg-dot/b')?.bytes).toEqual(Buffer.from('svg for /src/b/in.puml'));
  });

  it('keeps the real per-JVM exit code beside the bytes of an error diagram', async () => {
    const render: Renderer = () =>
      Promise.resolve({ files: new Map([['in.svg', Buffer.from('err')]]), exitCode: 200, timedOut: false });

    const result = await captureEach([fixtures[0]!], '/scratch', {}, render);

    expect(result.get('svg-class/a')).toEqual({ bytes: Buffer.from('err'), exitCode: 200 });
  });

  it('reports no bytes (FAILED) when the jar wrote nothing or timed out', async () => {
    const empty: Renderer = () => Promise.resolve({ files: new Map(), exitCode: 1, timedOut: false });
    const timedOut: Renderer = () => Promise.resolve({ files: new Map(), exitCode: null, timedOut: true });

    expect((await captureEach([fixtures[0]!], '/s', {}, empty)).get('svg-class/a')).toEqual({
      bytes: undefined,
      exitCode: 1,
    });
    expect((await captureEach([fixtures[0]!], '/s', {}, timedOut)).get('svg-class/a')).toEqual({
      bytes: undefined,
      exitCode: -1,
    });
  });

  it('hands the minute-guard clock and sleep to the renderer (D9)', async () => {
    const now = (): number => 10 * 60_000;
    const sleep = (): Promise<void> => Promise.resolve();
    const render = vi.fn<Renderer>(() => Promise.resolve({ files: new Map(), exitCode: 0, timedOut: false }));

    await captureEach([fixtures[0]!], '/scratch', { now, sleep }, render);

    expect(render.mock.calls[0]![1]).toMatchObject({ scratchRoot: '/scratch', now, sleep });
  });
});
