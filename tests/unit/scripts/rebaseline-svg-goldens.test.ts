/**
 * Unit tests for `scripts/rebaseline-svg-goldens.ts`'s pure functions (T2,
 * mission svg-output-size-reduction). Most of the jar-capture and
 * git-plumbing I/O is exercised by the manual report-only run documented in
 * the task's return report, not by a JVM- or git-dependent test --
 * `captureBatch` is the one exception, exercised below with a mocked
 * `spawnSync` to prove it routes through the D9 minute guard (cdd6 T0c).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import type * as ChildProcess from 'node:child_process';
import {
  compareCapture,
  summarize,
  formatSummaryLine,
  formatOutcomeLine,
  describeOutcome,
  evaluateDrift,
  parseErroredFiles,
  captureBatch,
  type FixtureOutcome,
} from '../../../scripts/rebaseline-svg-goldens.js';

vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof ChildProcess>()),
  spawnSync: vi.fn(),
}));

afterEach(() => {
  vi.mocked(spawnSync).mockReset();
});

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

describe('parseErroredFiles', () => {
  // A batched jar run returns ONE exit code, so per-fixture error status has
  // to come from stderr. Without this the ERROR-DIAGRAM signal would vanish
  // the moment more than one fixture shares a JVM.
  it('attributes each error to the file the jar named', () => {
    const stderr = [
      'Error line 13 in file: /scratch/svg-class/a/in.puml',
      'Some diagram description contains errors',
      'Error line 4 in file: /scratch/svg-state/b/in.puml',
    ].join('\n');
    expect([...parseErroredFiles(stderr)]).toEqual(['/scratch/svg-class/a/in.puml', '/scratch/svg-state/b/in.puml']);
  });

  it('is empty for a clean run', () => {
    expect(parseErroredFiles('').size).toBe(0);
    expect(parseErroredFiles('Some unrelated warning\n').size).toBe(0);
  });

  it('handles a path containing spaces', () => {
    expect([...parseErroredFiles('Error line 1 in file: /a b/c d/in.puml')]).toEqual(['/a b/c d/in.puml']);
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
// captureBatch — proves the jar call is routed through the D9 minute guard
// (cdd6 T0c). spawnSync is mocked; no jar output is produced, so the
// resulting Capture is always `{ bytes: undefined, exitCode: 0 }` here --
// only the guard wiring is under test.
// ---------------------------------------------------------------------------

describe('captureBatch', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'rsg-t0c-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  function makeFixtureDir(name: string): string {
    const dir = join(tmp, 'src', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'in.puml'), '@startuml\n@enduml\n', 'utf-8');
    return dir;
  }

  function mockCleanJarRun(): void {
    vi.mocked(spawnSync).mockReturnValue({
      stderr: '',
      stdout: '',
      status: 0,
      signal: null,
      pid: 1,
      output: [],
    });
  }

  it('waits out a decorated start minute before calling the jar (D9)', async () => {
    mockCleanJarRun();
    const fixtureDir = makeFixtureDir('foo');
    let now = 30 * 60_000; // minute 30 -- decorated (dedication banner)
    const sleep = vi.fn((): Promise<void> => {
      now = 31 * 60_000; // plain
      return Promise.resolve();
    });

    const result = await captureBatch([{ relPath: 'svg-class/foo', fixtureDir }], join(tmp, 'scratch'), {
      now: () => now,
      sleep,
    });

    expect(sleep).toHaveBeenCalledTimes(1);
    expect(spawnSync).toHaveBeenCalledTimes(1);
    expect(result.get('svg-class/foo')).toEqual({ bytes: undefined, exitCode: 0 });
  });

  it('calls the jar without waiting when the minute is already plain', async () => {
    mockCleanJarRun();
    const fixtureDir = makeFixtureDir('bar');
    const sleep = vi.fn((): Promise<void> => Promise.resolve());

    await captureBatch([{ relPath: 'svg-class/bar', fixtureDir }], join(tmp, 'scratch2'), {
      now: () => 10 * 60_000,
      sleep,
    });

    expect(sleep).not.toHaveBeenCalled();
    expect(spawnSync).toHaveBeenCalledTimes(1);
  });
});
